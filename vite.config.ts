import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 自定义 API 代理中间件
    {
      name: 'custom-api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/dify', async (req, res, next) => {
          if (req.method !== 'POST') {
            return next()
          }

          try {
            // 读取请求体
            const chunks = []
            req.on('data', chunk => chunks.push(chunk))
            req.on('end', async () => {
              try {
                const bodyString = Buffer.concat(chunks).toString()
                const { apiUrl, apiKey, payload } = JSON.parse(bodyString)

                console.log(`[代理] 转发请��到: ${apiUrl}`)

                // 构造目标 URL
                const targetUrl = `${apiUrl}/chat-messages`

                // 发送请求到真实 API
                const response = await fetch(targetUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                  },
                  body: JSON.stringify(payload),
                })

                // 返回响应
                const data = await response.json()
                console.log(`[代理] 响应状态: ${response.status}`)
                res.statusCode = response.status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(data))
              } catch (error) {
                console.error('[代理] 处理请求出错:', error)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Proxy processing error' }))
              }
            })
          } catch (error) {
            console.error('[代理] 读取请求体出错:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Proxy read error' }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './guidelines/src'),
    },
  },
})
