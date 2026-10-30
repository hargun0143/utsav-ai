export class GeminiUnavailableError extends Error {
  constructor(message = 'Gemini service is unavailable') {
    super(message)
    this.name = 'GeminiUnavailableError'
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function callModelOnce({ model, apiKey, systemText, userText }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7, thinkingConfig: { thinkingLevel: 'low' } },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = new Error(`HTTP error ${res.status}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]

  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'BLOCKLIST' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
    throw new Error('Response blocked by safety filters')
  }

  const parts = candidate?.content?.parts
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('No content returned')
  }

  const text = parts.map((p) => p?.text || '').join('')
  if (!text.trim()) {
    throw new Error('Empty response text')
  }

  return text
}

export async function generatePlanText({ systemText, userText, env = process.env, sleep = defaultSleep }) {
  const apiKey = env.GEMINI_API_KEY
  const primaryModel = env.GEMINI_MODEL
  const fallbackModel = env.GEMINI_FALLBACK_MODEL

  if (!apiKey || !primaryModel) {
    throw new GeminiUnavailableError('API key or model not configured')
  }

  const models = [primaryModel]
  if (fallbackModel && fallbackModel.trim()) {
    models.push(fallbackModel.trim())
  }

  const RETRY_DELAYS = [1000, 2000]

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const model = models[mIdx]
    const isPrimary = mIdx === 0
    let attempt = 0

    while (attempt < 3) {
      try {
        const text = await callModelOnce({ model, apiKey, systemText, userText })
        return text
      } catch (err) {
        attempt++
        const status = err.status

        if (status === 429) {
          if (isPrimary && models.length > 1) {
            break
          }
          throw new GeminiUnavailableError('Rate limited')
        }

        const isRetryableStatus = status === 500 || status === 503 || status === 504
        const isNetworkError = !status

        if ((isRetryableStatus || isNetworkError) && attempt < 3) {
          await sleep(RETRY_DELAYS[attempt - 1])
          continue
        }

        break
      }
    }
  }

  throw new GeminiUnavailableError('All attempts failed')
}
