'use strict'

const express = require('express')
const path = require('path')
const crypto = require('crypto')
const { Storage } = require('@google-cloud/storage')
const { OAuth2Client } = require('google-auth-library')

const PORT = parseInt(process.env.PORT || '8080', 10)
const BUCKET_NAME = process.env.STATE_BUCKET || ''
const STATE_OBJECT = 'state.json'
const USERS_OBJECT = 'users.json'
const ADMIN_EMAIL = 'szczawinskipiotr@gmail.com'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret'
const COOKIE_NAME = 'sp_tok'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // seconds

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// --- Token helpers (HMAC-signed, no extra packages) ---

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) return null
  } catch {
    return null
  }
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function parseCookies(req) {
  const result = {}
  const header = req.headers.cookie || ''
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=')
    if (idx < 0) continue
    result[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim())
  }
  return result
}

function setSessionCookie(res, user) {
  const token = signToken(user)
  const secure = !!GOOGLE_CLIENT_ID
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
  )
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  )
}

function getSessionUser(req) {
  const cookies = parseCookies(req)
  const raw = cookies[COOKIE_NAME]
  if (!raw) return null
  return verifyToken(decodeURIComponent(raw))
}

// --- GCS helpers ---

function getBucket() {
  if (!BUCKET_NAME) return null
  return new Storage().bucket(BUCKET_NAME)
}

async function getAllowedUsers() {
  const b = getBucket()
  if (!b) return []
  try {
    const [contents] = await b.file(USERS_OBJECT).download()
    return JSON.parse(contents.toString())
  } catch {
    return []
  }
}

async function saveAllowedUsers(users) {
  const b = getBucket()
  if (!b) return
  await b.file(USERS_OBJECT).save(JSON.stringify(users, null, 2), { contentType: 'application/json' })
}

// --- Auth middleware ---

function requireAuth(req, res, next) {
  if (!GOOGLE_CLIENT_ID) return next()
  const user = getSessionUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  req.sessionUser = user
  next()
}

function requireAdmin(req, res, next) {
  const user = getSessionUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })
  req.sessionUser = user
  next()
}

// --- Config ---

app.get('/api/config', (_req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null })
})

// --- Auth ---

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req)
  res.json(user ?? null)
})

app.post('/api/auth/verify', async (req, res) => {
  const { credential } = req.body || {}
  if (!credential) return res.status(400).json({ error: 'Missing credential' })
  if (!GOOGLE_CLIENT_ID) return res.status(400).json({ error: 'Auth not configured' })
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    const email = payload.email

    const isAdmin = email === ADMIN_EMAIL
    if (!isAdmin) {
      const allowed = await getAllowedUsers()
      if (!allowed.includes(email)) return res.status(403).json({ error: 'Access denied' })
    }

    const user = { email, name: payload.name, picture: payload.picture, isAdmin }
    setSessionCookie(res, user)
    res.json(user)
  } catch (err) {
    console.error('Auth verify error', err)
    res.status(400).json({ error: 'Invalid token' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

// --- Admin ---

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    res.json(await getAllowedUsers())
  } catch (err) {
    console.error('Admin get users error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { email } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })
  try {
    const users = await getAllowedUsers()
    const normalized = email.toLowerCase().trim()
    if (!users.includes(normalized)) {
      users.push(normalized)
      await saveAllowedUsers(users)
    }
    res.json(users)
  } catch (err) {
    console.error('Admin add user error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

app.delete('/api/admin/users/:email', requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email)
    const users = await getAllowedUsers()
    const updated = users.filter((e) => e !== email)
    await saveAllowedUsers(updated)
    res.json(updated)
  } catch (err) {
    console.error('Admin remove user error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// --- State (protected) ---

app.get('/api/state', requireAuth, async (_req, res) => {
  const b = getBucket()
  if (!b) return res.status(404).end()
  try {
    const [contents] = await b.file(STATE_OBJECT).download()
    res.setHeader('Content-Type', 'application/json')
    res.send(contents)
  } catch (err) {
    if (err.code === 404) return res.status(404).end()
    console.error('GCS read error', err)
    res.status(500).end()
  }
})

app.post('/api/state', requireAuth, async (req, res) => {
  const b = getBucket()
  if (!b) return res.status(204).end()
  try {
    await b.file(STATE_OBJECT).save(JSON.stringify(req.body, null, 2), { contentType: 'application/json' })
    res.status(204).end()
  } catch (err) {
    console.error('GCS write error', err)
    res.status(500).end()
  }
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => console.log(`seats-planner listening on :${PORT}`))
