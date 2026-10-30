import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { generatePlanText } from '../api/_lib/geminiClient.js'

describe('geminiClient', () => {
  const originalFetch = globalThis.fetch
  const instantSleep = async () => {}

  beforeEach(() => {
    // Reset fetch before each test
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const makeSuccessResponse = (text) => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }),
  })

  const makeErrorResponse = (status) => ({
    ok: false,
    status,
    json: async () => ({ error: { message: `HTTP ${status}` } }),
  })

  it('success on the first try', async () => {
    const expectedText = '{"title":"Test Plan"}'
    let callCount = 0
    let capturedUrl = ''
    let capturedHeaders = {}

    globalThis.fetch = async (url, options) => {
      callCount++
      capturedUrl = url
      capturedHeaders = options.headers
      return makeSuccessResponse(expectedText)
    }

    const env = {
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-model-primary',
    }

    const result = await generatePlanText({
      systemText: 'System instructions',
      userText: 'User details',
      env,
      sleep: instantSleep,
    })

    assert.equal(result, expectedText)
    assert.equal(callCount, 1)
    assert.ok(capturedUrl.includes('gemini-model-primary'))
    assert.equal(capturedHeaders['x-goog-api-key'], 'test-key')
  })

  it('retries after a 503 then succeeds', async () => {
    const expectedText = '{"title":"After 503"}'
    let callCount = 0
    const sleepDelays = []

    globalThis.fetch = async () => {
      callCount++
      if (callCount === 1) {
        return makeErrorResponse(503)
      }
      return makeSuccessResponse(expectedText)
    }

    const customSleep = async (ms) => {
      sleepDelays.push(ms)
    }

    const env = {
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-model-primary',
    }

    const result = await generatePlanText({
      systemText: 'System instructions',
      userText: 'User details',
      env,
      sleep: customSleep,
    })

    assert.equal(result, expectedText)
    assert.equal(callCount, 2)
    assert.deepEqual(sleepDelays, [1000])
  })

  it('uses the fallback model after the primary fails 3 times', async () => {
    const expectedText = '{"title":"From Fallback"}'
    const urlsCalled = []
    let callCount = 0

    globalThis.fetch = async (url) => {
      callCount++
      urlsCalled.push(url)
      if (callCount <= 3) {
        return makeErrorResponse(500)
      }
      return makeSuccessResponse(expectedText)
    }

    const env = {
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'primary-model',
      GEMINI_FALLBACK_MODEL: 'fallback-model',
    }

    const result = await generatePlanText({
      systemText: 'System instructions',
      userText: 'User details',
      env,
      sleep: instantSleep,
    })

    assert.equal(result, expectedText)
    assert.equal(callCount, 4)
    assert.ok(urlsCalled[0].includes('primary-model'))
    assert.ok(urlsCalled[1].includes('primary-model'))
    assert.ok(urlsCalled[2].includes('primary-model'))
    assert.ok(urlsCalled[3].includes('fallback-model'))
  })

  it('429 on the primary goes straight to the fallback with no waiting', async () => {
    const expectedText = '{"title":"Fallback after 429"}'
    const urlsCalled = []
    const sleepDelays = []

    globalThis.fetch = async (url) => {
      urlsCalled.push(url)
      if (urlsCalled.length === 1) {
        return makeErrorResponse(429)
      }
      return makeSuccessResponse(expectedText)
    }

    const customSleep = async (ms) => {
      sleepDelays.push(ms)
    }

    const env = {
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'primary-model',
      GEMINI_FALLBACK_MODEL: 'fallback-model',
    }

    const result = await generatePlanText({
      systemText: 'System instructions',
      userText: 'User details',
      env,
      sleep: customSleep,
    })

    assert.equal(result, expectedText)
    assert.equal(urlsCalled.length, 2)
    assert.ok(urlsCalled[0].includes('primary-model'))
    assert.ok(urlsCalled[1].includes('fallback-model'))
    assert.deepEqual(sleepDelays, [], 'Should not have slept before switching to fallback on 429')
  })

  it('throws GeminiUnavailableError when everything fails', async () => {
    globalThis.fetch = async () => {
      return makeErrorResponse(500)
    }

    const env = {
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'primary-model',
      GEMINI_FALLBACK_MODEL: 'fallback-model',
    }

    await assert.rejects(
      async () => {
        await generatePlanText({
          systemText: 'System instructions',
          userText: 'User details',
          env,
          sleep: instantSleep,
        })
      },
      (err) => {
        assert.equal(err.name, 'GeminiUnavailableError')
        assert.ok(!err.message.includes('test-key'))
        return true
      }
    )
  })
})
