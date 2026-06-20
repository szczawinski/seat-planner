'use strict'

const express = require('express')
const path = require('path')
const { Storage } = require('@google-cloud/storage')

const PORT = parseInt(process.env.PORT || '8080', 10)
const BUCKET_NAME = process.env.STATE_BUCKET || ''
const STATE_OBJECT = 'state.json'

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

function bucket() {
  if (!BUCKET_NAME) return null
  const storage = new Storage()
  return storage.bucket(BUCKET_NAME)
}

app.get('/api/state', async (_req, res) => {
  const b = bucket()
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

app.post('/api/state', async (req, res) => {
  const b = bucket()
  if (!b) return res.status(204).end()
  try {
    await b.file(STATE_OBJECT).save(JSON.stringify(req.body, null, 2), {
      contentType: 'application/json',
    })
    res.status(204).end()
  } catch (err) {
    console.error('GCS write error', err)
    res.status(500).end()
  }
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`seats-planner listening on :${PORT}`)
})
