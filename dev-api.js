import { loadEnv } from 'vite'
import handler from './api/plan.js'

export default function devApiPlugin() {
  return {
    name: 'dev-api-plugin',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode || 'development', process.cwd(), '')
      Object.assign(process.env, env)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/plan') {
          return next()
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let bodyBuffer = ''
        req.on('data', (chunk) => {
          bodyBuffer += chunk
        })

        req.on('end', async () => {
          let parsedBody = {}
          try {
            if (bodyBuffer.trim()) {
              parsedBody = JSON.parse(bodyBuffer)
            }
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
            return
          }

          req.body = parsedBody

          const wrappedRes = {
            status(code) {
              res.statusCode = code
              return this
            },
            setHeader(name, value) {
              res.setHeader(name, value)
              return this
            },
            json(data) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return this
            },
          }

          try {
            await handler(req, wrappedRes)
          } catch (err) {
            console.error(`[Dev API Error] ${err.name}: ${err.message}`)
            if (!res.writableEnded) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }))
            }
          }
        })
      })
    },
  }
}
