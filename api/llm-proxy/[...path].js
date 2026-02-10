export default async function handler(req, res) {
  // Vercel Serverless Function to proxy requests to an OpenAI-compatible API.
  // This replaces Vite's dev-only proxy, enabling production deployments.

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-User-ID'
    );
    res.status(200).end();
    return;
  }

  // Accept: /api/llm-proxy/v1/*  ->  ${LLM_BASE_URL}/v1/*
  const { path = [] } = req.query
  const upstreamBase = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL
  const upstreamKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY

  if (!upstreamBase) {
    res.status(500).json({ error: 'Missing env var LLM_BASE_URL (or OPENAI_BASE_URL)' })
    return
  }

  const targetPath = Array.isArray(path) ? path.join('/') : String(path)
  const targetUrl = new URL(targetPath, upstreamBase.endsWith('/') ? upstreamBase : upstreamBase + '/')

  // Copy headers but remove hop-by-hop headers that can break proxying.
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (!v) continue
    const key = k.toLowerCase()
    if (['host', 'connection', 'content-length'].includes(key)) continue
    headers.set(k, Array.isArray(v) ? v.join(',') : v)
  }

  // Ensure Authorization is set from server-side secret (never expose to client)
  if (upstreamKey) headers.set('authorization', `Bearer ${upstreamKey}`)

  const method = req.method || 'GET'
  let body
  if (!['GET', 'HEAD'].includes(method)) {
    // Vercel provides req.body as object for JSON by default; preserve raw for other types
    if (req.body == null) {
      body = undefined
    } else if (typeof req.body === 'string' || req.body instanceof Buffer) {
      body = req.body
    } else {
      body = JSON.stringify(req.body)
      if (!headers.get('content-type')) headers.set('content-type', 'application/json')
    }
  }

  try {
    const upstreamResp = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      redirect: 'manual',
    })

    // Pass through status and headers (including SSE for streaming)
    res.status(upstreamResp.status)
    upstreamResp.headers.forEach((value, key) => {
      const k = key.toLowerCase()
      if (['transfer-encoding', 'content-encoding'].includes(k)) return
      res.setHeader(key, value)
    })

    const contentType = upstreamResp.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream')) {
      // Stream SSE
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      if (upstreamResp.body) {
        for await (const chunk of upstreamResp.body) {
          res.write(chunk)
        }
      }
      res.end()
      return
    }

    const arrayBuffer = await upstreamResp.arrayBuffer()
    res.send(Buffer.from(arrayBuffer))
  } catch (err) {
    res.status(502).json({ error: 'Upstream proxy error', message: err?.message || String(err) })
  }
}
