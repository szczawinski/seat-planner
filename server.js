'use strict'

const express = require('express')
const path = require('path')
const { Storage } = require('@google-cloud/storage')
const cookieSession = require('cookie-session')
const { OAuth2Client } = require('google-auth-library')

const PORT = parseInt(process.env.PORT || '8080', 10)
const BUCKET_NAME = process.env.STATE_BUCKET || ''
const STATE_OBJECT = 'state.json'
const USERS_OBJECT = 'users.json'
const ADMIN_EMAIL = 'szczawinskipiotr@gmail.com'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret'

const app = express()

app.use(cookieSession({
  name: 'sp_session',
  keys: [SESSION_SECRET],
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: !!GOOGLE_CLIENT_ID,
  httpOnly: true,
  sameSite: 'lax',
}))

app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

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
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (req.session.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })
  next()
}

// --- Config ---

app.get('/api/config', (_req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null })
})

// --- Auth ---

app.get('/api/auth/me', (req, res) => {
  res.json(req.session?.user ?? null)
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
    req.session.user = user
    res.json(user)
  } catch (err) {
    console.error('Auth verify error', err)
    res.status(400).json({ error: 'Invalid token' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  req.session = null
  res.json({ ok: true })
})

// --- Admin ---

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  res.json(await getAllowedUsers())
})

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { email } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' })
  const users = await getAllowedUsers()
  const normalized = email.toLowerCase().trim()
  if (!users.includes(normalized)) {
    users.push(normalized)
    await saveAllowedUsers(users)
  }
  res.json(users)
})

app.delete('/api/admin/users/:email', requireAdmin, async (req, res) => {
  const email = decodeURIComponent(req.params.email)
  const users = await getAllowedUsers()
  const updated = users.filter((e) => e !== email)
  await saveAllowedUsers(updated)
  res.json(updated)
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
