// Serverless API endpoint for validating input and generating an event plan.
import { validateInput } from '../shared/validateInput.js'
import { buildPrompt } from './_lib/buildPrompt.js'
import { normalizePlan } from './_lib/normalizePlan.js'
import { generatePlanText, GeminiUnavailableError } from './_lib/geminiClient.js'

export const config = { maxDuration: 60 }

/**
 * Handles HTTP requests to generate an event plan.
 * @param {import('http').IncomingMessage & { method: string, body: any }} req - The incoming HTTP request.
 * @param {import('http').ServerResponse & { status: Function, json: Function, setHeader: Function }} res - The outgoing HTTP response.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { valid, errors, value } = validateInput(req.body)
  if (!valid) {
    return res.status(400).json({ error: 'Please check the form.', fields: errors })
  }

  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL
  if (!apiKey || !model) {
    return res.status(500).json({ error: 'The planner is not configured.' })
  }

  const { systemText, userText } = buildPrompt(value)

  try {
    let rawText = await generatePlanText({ systemText, userText })
    let plan
    try {
      plan = normalizePlan(rawText, value)
    } catch (err) {
      if (err.name === 'InvalidPlanError') {
        rawText = await generatePlanText({ systemText, userText })
        plan = normalizePlan(rawText, value)
      } else {
        throw err
      }
    }

    return res.status(200).json(plan)
  } catch (err) {
    if (err instanceof GeminiUnavailableError || err.name === 'GeminiUnavailableError') {
      return res.status(503).json({
        error: 'The AI service is busy right now. Please try again in a moment.',
        retryable: true,
      })
    }

    console.error(`[Plan Error] ${err.name}: ${err.message}`)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
