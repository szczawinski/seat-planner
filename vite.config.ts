import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const STATE_FILE = path.resolve('./wedding-state.json')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-state-persist',
      configureServer(server) {
        server.middlewares.use('/api/state', async (req, res) => {
          if (req.method === 'GET') {
            if (fs.existsSync(STATE_FILE)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(fs.readFileSync(STATE_FILE, 'utf-8'))
            } else {
              res.statusCode = 404
              res.end()
            }
          } else if (req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(Buffer.from(chunk))
            }
            fs.writeFileSync(STATE_FILE, Buffer.concat(chunks).toString('utf-8'), 'utf-8')
            res.statusCode = 204
            res.end()
          }
        })
      },
    },
  ],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
})
