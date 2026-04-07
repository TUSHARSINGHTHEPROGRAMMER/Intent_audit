import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import {
  classifyAuditResult,
  generateBulkIntentRecommendations,
  generateUnhandledIntentWatchlist,
  isAccurateAuditResult,
  isNoneIntent,
} from '@/lib/intent-analysis'
import { writeResultsAsJSONL, formatBytes } from '@/lib/large-data-handler'

const MONGO_URI = process.env.MONGODB_URI || ''
const DB_NAME = process.env.MONGODB_DB_NAME || 'ori-vodafone-dev'
const COLLECTION = process.env.MONGODB_COLLECTION || 'AiApiLogs'
const PRIMARY_API_URL = process.env.PRIMARY_API_URL || 'http://ai.vodafone-elb.oriserve.in:5000/results'
const SECONDARY_API_URL = process.env.SECONDARY_API_URL || ''
const NLP_API_TIMEOUT_MS = Number(process.env.NLP_API_TIMEOUT_MS || process.env.LLM_API_TIMEOUT_MS || 12000)

const BATCH_SIZE = Number(process.env.AUDIT_BATCH_SIZE || 100)
const API_CONCURRENCY = Math.max(1, Number(process.env.AUDIT_API_CONCURRENCY || 8))
const STAGGER_DELAY = Math.max(0, Number(process.env.AUDIT_STAGGER_DELAY || Math.floor(300 / Math.max(BATCH_SIZE, 1))))
const BATCH_DELAY = Number(process.env.AUDIT_BATCH_DELAY || 150)
const PROGRESS_INTERVAL = Number(process.env.AUDIT_PROGRESS_INTERVAL || 25)
const AUDIT_COUNT_TOTALS = String(process.env.AUDIT_COUNT_TOTALS || 'true').toLowerCase() !== 'false'
const AUDIT_WINDOW_MINUTES = Math.max(5, Number(process.env.AUDIT_WINDOW_MINUTES || 180))
const SESSION_LOOKUP_BATCH_SIZE = Math.max(25, Number(process.env.AUDIT_SESSION_LOOKUP_BATCH_SIZE || 250))
const AUDIT_HISTORY_BUCKET_MINUTES = Math.max(5, Number(process.env.AUDIT_HISTORY_BUCKET_MINUTES || 60))
const MIN_API_CONCURRENCY = Math.max(1, Math.min(API_CONCURRENCY, Number(process.env.AUDIT_MIN_API_CONCURRENCY || 2)))
const THROTTLE_TIMEOUT_RATIO = Math.max(0.05, Number(process.env.AUDIT_THROTTLE_TIMEOUT_RATIO || 0.2))
const THROTTLE_RECOVERY_RATIO = Math.max(0, Number(process.env.AUDIT_THROTTLE_RECOVERY_RATIO || 0.05))
const THROTTLE_MIN_BATCH_SIZE = Math.max(3, Number(process.env.AUDIT_THROTTLE_MIN_BATCH_SIZE || 8))
const THROTTLE_EXTRA_DELAY_MS = Math.max(0, Number(process.env.AUDIT_THROTTLE_EXTRA_DELAY_MS || 400))
const CACHE_DIR = path.join(os.tmpdir(), 'audit-cache')

function objectIdFromDate(date) {
  const hexSeconds = Math.floor(date.getTime() / 1000).toString(16)
  return new ObjectId(hexSeconds + '0000000000000000')
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function runWithConcurrency(items, worker, concurrency = API_CONCURRENCY) {
  if (!items.length) return

  let nextIndex = 0
  const workerCount = Math.min(Math.max(1, concurrency), items.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex
        nextIndex += 1
        await worker(items[currentIndex], currentIndex)
      }
    })
  )
}

function createStats() {
  return {
    total: 0,
    match: 0,
    llmHandled: 0,
    generativeHandled: 0,
    updation: 0,
    invalidMessage: 0,
    accurateCount: 0,
    accuracy: '0',
  }
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function chunkArray(items = [], size = SESSION_LOOKUP_BATCH_SIZE) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function buildAuditWindows(startDate, endDate, windowMinutes = AUDIT_WINDOW_MINUTES) {
  const startMs = startDate.getTime()
  const endMs = endDate.getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) {
    return []
  }

  const windowMs = Math.max(1, windowMinutes) * 60 * 1000
  const windows = []
  let currentEnd = endMs

  while (currentEnd > startMs) {
    const currentStart = Math.max(startMs, currentEnd - windowMs)
    windows.push({
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
      startObjectId: objectIdFromDate(new Date(currentStart)),
      endObjectId: objectIdFromDate(new Date(currentEnd)),
    })
    currentEnd = currentStart
  }

  if (windows.length === 0) {
    windows.push({
      startDate,
      endDate,
      startObjectId: objectIdFromDate(startDate),
      endObjectId: objectIdFromDate(endDate),
    })
  }

  return windows
}

function applyStats(stats, result) {
  stats.total += 1
  if (result.status === 'MATCH') stats.match += 1
  else if (result.status === 'LLM_HANDLED') stats.llmHandled += 1
  else if (result.status === 'GENERATIVE_HANDLED') stats.generativeHandled += 1
  else if (result.status === 'UPDATION') stats.updation += 1
  else if (result.status === 'INVALID_MESSAGE') stats.invalidMessage += 1

  if (isAccurateAuditResult(result)) stats.accurateCount += 1
  stats.accuracy = stats.total ? ((stats.accurateCount / stats.total) * 100).toFixed(1) : '0'
}

function getLogTimestamp(log) {
  const timestamp = log?._id?.getTimestamp?.()
  return timestamp instanceof Date && !Number.isNaN(timestamp.getTime()) ? timestamp : null
}

function bucketStartDate(date, bucketMinutes = AUDIT_HISTORY_BUCKET_MINUTES) {
  const bucketMs = Math.max(1, bucketMinutes) * 60 * 1000
  const timestamp = date.getTime()
  return new Date(Math.floor(timestamp / bucketMs) * bucketMs)
}

function createAccuracyHistoryTracker(bucketMinutes = AUDIT_HISTORY_BUCKET_MINUTES) {
  return {
    bucketMinutes,
    buckets: new Map(),
  }
}

function applyAccuracyHistory(tracker, timestamp, result) {
  if (!tracker || !(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) return

  const bucketStart = bucketStartDate(timestamp, tracker.bucketMinutes)
  const bucketKey = bucketStart.toISOString()
  const bucketEnd = new Date(bucketStart.getTime() + tracker.bucketMinutes * 60 * 1000)
  const current =
    tracker.buckets.get(bucketKey) || {
      bucketStart: bucketKey,
      bucketEnd: bucketEnd.toISOString(),
      stats: createStats(),
    }

  applyStats(current.stats, result)
  tracker.buckets.set(bucketKey, current)
}

function finalizeAccuracyHistory(tracker) {
  if (!tracker) return []

  return [...tracker.buckets.values()]
    .sort((a, b) => new Date(a.bucketStart).getTime() - new Date(b.bucketStart).getTime())
    .map((entry) => ({
      bucketStart: entry.bucketStart,
      bucketEnd: entry.bucketEnd,
      accuracy: entry.stats.accuracy,
      total: entry.stats.total,
      accurateCount: entry.stats.accurateCount,
      match: entry.stats.match,
      llmHandled: entry.stats.llmHandled,
      generativeHandled: entry.stats.generativeHandled,
      updation: entry.stats.updation,
      invalidMessage: entry.stats.invalidMessage,
    }))
}

function createAdaptiveThrottleController() {
  return {
    currentConcurrency: API_CONCURRENCY,
    minConcurrency: MIN_API_CONCURRENCY,
    maxConcurrency: API_CONCURRENCY,
    timeoutRatioThreshold: THROTTLE_TIMEOUT_RATIO,
    recoveryRatioThreshold: THROTTLE_RECOVERY_RATIO,
    minBatchSize: THROTTLE_MIN_BATCH_SIZE,
    extraDelayMs: 0,
    maxExtraDelayMs: THROTTLE_EXTRA_DELAY_MS * 4,
    lastAdjustmentReason: 'initial',
  }
}

function createBatchOutcomeTracker() {
  return {
    total: 0,
    timeoutCount: 0,
    apiErrorCount: 0,
  }
}

function applyBatchOutcome(tracker, apiErrorReason = '') {
  tracker.total += 1

  if (!apiErrorReason) return

  tracker.apiErrorCount += 1
  if (String(apiErrorReason).startsWith('timeout_after_')) {
    tracker.timeoutCount += 1
  }
}

function adjustAdaptiveThrottle(throttle, batchOutcome) {
  if (!throttle || !batchOutcome || batchOutcome.total < throttle.minBatchSize) {
    return throttle?.extraDelayMs || 0
  }

  const timeoutRatio = batchOutcome.timeoutCount / batchOutcome.total
  const errorRatio = batchOutcome.apiErrorCount / batchOutcome.total

  if (timeoutRatio >= throttle.timeoutRatioThreshold && throttle.currentConcurrency > throttle.minConcurrency) {
    const previous = throttle.currentConcurrency
    throttle.currentConcurrency = Math.max(
      throttle.minConcurrency,
      throttle.currentConcurrency - Math.max(1, Math.ceil(throttle.currentConcurrency / 3))
    )
    throttle.extraDelayMs = Math.min(
      throttle.maxExtraDelayMs,
      Math.max(THROTTLE_EXTRA_DELAY_MS, throttle.extraDelayMs + THROTTLE_EXTRA_DELAY_MS)
    )
    throttle.lastAdjustmentReason = `timeout_ratio_${timeoutRatio.toFixed(2)}`

    console.warn('[audit] Auto-throttle reduced NLP concurrency', {
      previousConcurrency: previous,
      nextConcurrency: throttle.currentConcurrency,
      timeoutRatio: timeoutRatio.toFixed(2),
      apiErrorRatio: errorRatio.toFixed(2),
      extraDelayMs: throttle.extraDelayMs,
    })

    return throttle.extraDelayMs
  }

  if (
    timeoutRatio <= throttle.recoveryRatioThreshold &&
    errorRatio <= throttle.recoveryRatioThreshold &&
    throttle.currentConcurrency < throttle.maxConcurrency
  ) {
    const previous = throttle.currentConcurrency
    throttle.currentConcurrency += 1
    throttle.extraDelayMs = Math.max(0, throttle.extraDelayMs - THROTTLE_EXTRA_DELAY_MS)
    throttle.lastAdjustmentReason = `recovered_timeout_ratio_${timeoutRatio.toFixed(2)}`

    console.log('[audit] Auto-throttle increased NLP concurrency', {
      previousConcurrency: previous,
      nextConcurrency: throttle.currentConcurrency,
      timeoutRatio: timeoutRatio.toFixed(2),
      apiErrorRatio: errorRatio.toFixed(2),
      extraDelayMs: throttle.extraDelayMs,
    })

    return throttle.extraDelayMs
  }

  if (timeoutRatio > throttle.recoveryRatioThreshold || errorRatio > throttle.recoveryRatioThreshold) {
    throttle.extraDelayMs = Math.min(
      throttle.maxExtraDelayMs,
      Math.max(throttle.extraDelayMs, Math.floor(THROTTLE_EXTRA_DELAY_MS / 2))
    )
  } else {
    throttle.extraDelayMs = Math.max(0, throttle.extraDelayMs - Math.floor(THROTTLE_EXTRA_DELAY_MS / 2))
  }

  return throttle.extraDelayMs
}

async function fetchIntentDescriptions() {
  const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL

  if (!webhook) {
    return {
      greeting: {
        old: 'User greets the bot',
        updated: 'User provides a greeting',
        v2: 'User initiates conversation',
        v3: 'hello, hi, hey',
      },
    }
  }

  try {
    const res = await fetch(webhook)
    if (!res.ok) {
      console.error('[audit] Intent description fetch returned non-200', {
        status: res.status,
      })
      throw new Error(`intent_fetch_status_${res.status}`)
    }
    const data = await res.json()
    console.log('[audit] Loaded intent descriptions for audit', {
      count: Object.keys(data.intents || {}).length,
    })
    return data.intents || {}
  } catch (error) {
    console.error('[v0] Intent fetch failed inside audit route:', error)
    return {}
  }
}

async function callAPI(message, retries = 2, useSecondary = false) {
  const apiUrl = useSecondary && SECONDARY_API_URL ? SECONDARY_API_URL : PRIMARY_API_URL

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NLP_API_TIMEOUT_MS)

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    if (!res.ok) {
      throw new Error(`upstream_status_${res.status}`)
    }

    const data = await res.json()
    return {
      intent: data?.intent?.name || '',
      source: useSecondary ? 'secondary' : 'primary',
      apiErrorReason: '',
    }
  } catch (err) {
    if (!useSecondary && SECONDARY_API_URL) {
      return callAPI(message, retries, true)
    }

    if (retries > 0) {
      await sleep(500)
      return callAPI(message, retries - 1, useSecondary)
    }

    const errorName = err?.name || ''
    const errorMessage = err?.message || ''
    const apiErrorReason =
      errorName === 'AbortError'
        ? `timeout_after_${NLP_API_TIMEOUT_MS}ms`
        : errorMessage || 'unknown_nlp_api_error'

    console.error('[audit] NLP/API call failed:', {
      apiUrl,
      apiErrorReason,
      message,
    })

    return { intent: 'ERROR', source: 'failed', apiErrorReason }
  }
}

function buildAnalyticsSummary(results) {
  const nlpGroups = {}
  const llmGroups = {}
  const mismatchesByIntent = {}

  results.forEach((result) => {
    if (result.status === 'INVALID_MESSAGE') return

    nlpGroups[result.nlpIntent] = (nlpGroups[result.nlpIntent] || 0) + 1
    llmGroups[result.llmIntent] = (llmGroups[result.llmIntent] || 0) + 1

    if (result.status !== 'MATCH' && result.status !== 'GENERATIVE_HANDLED') {
      const key = `${result.llmIntent}→${result.nlpIntent}`
      mismatchesByIntent[key] = (mismatchesByIntent[key] || 0) + 1
    }
  })

  return {
    nlpTotal: Object.keys(nlpGroups).length,
    llmTotal: Object.keys(llmGroups).length,
    topMismatches: Object.entries(mismatchesByIntent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => {
        const [from, to] = pattern.split('→')
        return { from, to, count }
      }),
  }
}

function buildInvalidIntentWatchlist(results) {
  const grouped = new Map()

  results
    .filter((result) => result.status === 'INVALID_MESSAGE' && !isNoneIntent(result.llmIntent))
    .forEach((result) => {
      const current = grouped.get(result.llmIntent) || { intent: result.llmIntent, count: 0, samples: [] }
      current.count += 1
      if (result.message && current.samples.length < 3) current.samples.push(result.message)
      grouped.set(result.llmIntent, current)
    })

  return [...grouped.values()].sort((a, b) => b.count - a.count)
}

async function persistAuditPayload(auditId, payload) {
  await mkdir(CACHE_DIR, { recursive: true })
  const { results, ...persistablePayload } = payload
  
  try {
    // Persist metadata separately
    const metadataPath = path.join(CACHE_DIR, `${auditId}-metadata.json`)
    await writeFile(metadataPath, JSON.stringify(persistablePayload), 'utf8')
    
    // Stream results as JSONL (one JSON object per line) for scalability
    if (Array.isArray(results) && results.length > 0) {
      const resultsPath = path.join(CACHE_DIR, `${auditId}-results.jsonl`)
      const writeStats = await writeResultsAsJSONL(resultsPath, results)
      console.log('[audit] Results persisted successfully:', {
        auditId,
        resultCount: writeStats.written,
        chunks: writeStats.chunks,
        size: formatBytes(writeStats.size),
      })
    }
  } catch (error) {
    console.error('[audit] Error persisting payload:', {
      auditId,
      message: error?.message,
      stack: error?.stack,
    })
    // Don't throw - persistence errors shouldn't fail the audit
  }
}

async function populateGenerateResponseCache(collection, sessionIds = [], generateResponseCache) {
  const uncachedSessionIds = uniqueStrings(sessionIds).filter(
    (sessionId) => !generateResponseCache.has(String(sessionId))
  )

  if (!uncachedSessionIds.length) return

  for (const sessionChunk of chunkArray(uncachedSessionIds, SESSION_LOOKUP_BATCH_SIZE)) {
    const generateLogs = await collection
      .find({
        sessionId: { $in: sessionChunk },
        'request.url': { $regex: '/generate' },
        status: '200',
      })
      .project({
        sessionId: 1,
        'response.response': 1,
      })
      .toArray()

    generateLogs.forEach((log) => {
      generateResponseCache.set(String(log.sessionId), log.response?.response || '')
    })

    sessionChunk.forEach((sessionId) => {
      const key = String(sessionId)
      if (!generateResponseCache.has(key)) {
        generateResponseCache.set(key, '')
      }
    })
  }
}

export async function POST(req) {
  if (!MONGO_URI) {
    console.error('[audit] Missing MONGODB_URI')
    return NextResponse.json({ error: 'MongoDB not configured' }, { status: 500 })
  }

  const { startDate, endDate } = await req.json()

  if (!startDate || !endDate) {
    console.error('[audit] Missing audit dates', { startDate, endDate })
    return NextResponse.json({ error: 'Missing dates' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    async start(controller) {
      const client = new MongoClient(MONGO_URI, { readPreference: 'secondary' })

      try {
        await client.connect()

        const db = client.db(DB_NAME)
        const collection = db.collection(COLLECTION)
        const intentDescriptions = await fetchIntentDescriptions()

        const auditStartDate = new Date(startDate)
        const auditEndDate = new Date(endDate)
        const windows = buildAuditWindows(auditStartDate, auditEndDate)

        const query = {
          _id: { $gte: objectIdFromDate(auditStartDate), $lte: objectIdFromDate(auditEndDate) },
          'request.url': { $regex: '/results' },
          status: '200',
        }

        const total = AUDIT_COUNT_TOTALS ? await collection.countDocuments(query) : null
        console.log('[audit] Starting audit run', {
          startDate,
          endDate,
          total,
          batchSize: BATCH_SIZE,
          apiConcurrency: API_CONCURRENCY,
          countTotals: AUDIT_COUNT_TOTALS,
          windowMinutes: AUDIT_WINDOW_MINUTES,
          windowCount: windows.length,
        })
        const stats = createStats()
        const results = []
        const nlpResponseCache = new Map()
        const generateResponseCache = new Map()
        const accuracyHistoryTracker = createAccuracyHistoryTracker()
        const adaptiveThrottle = createAdaptiveThrottleController()
        let processed = 0

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'total', total })}\n\n`))

        const emitProgress = () => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                processed,
                stats,
              })}\n\n`
            )
          )
        }

        const processBatch = async (items) => {
          const sessionIds = uniqueStrings(items.map((item) => item.sessionId).filter(Boolean))
          await populateGenerateResponseCache(collection, sessionIds, generateResponseCache)
          const batchOutcome = createBatchOutcomeTracker()

          await runWithConcurrency(
            items,
            async (log, index) => {
              try {
                await sleep(index * STAGGER_DELAY)

                const parsed = JSON.parse(log.request?.data || '{}')
                const message = parsed.message
                const llmIntent = log.response?.intent?.name || ''
                const generateResponse = log.sessionId ? generateResponseCache.get(String(log.sessionId)) || '' : ''
                const logTimestamp = getLogTimestamp(log)

                if (!message) {
                  console.warn('[audit] Skipping log with empty message', {
                    logId: String(log?._id || ''),
                  })
                  return
                }

                let apiResultPromise = nlpResponseCache.get(message)

                if (!apiResultPromise) {
                  apiResultPromise = callAPI(message)
                  nlpResponseCache.set(message, apiResultPromise)
                }

                const apiResult = await apiResultPromise

                const { intent: nlpIntent, source, apiErrorReason } = apiResult
                applyBatchOutcome(batchOutcome, apiErrorReason)
                if (apiErrorReason) {
                  console.warn('[audit] NLP/API returned fallback error intent', {
                    logId: String(log?._id || ''),
                    message,
                    llmIntent,
                    apiErrorReason,
                  })
                }
                const classifiedResult = classifyAuditResult(
                  {
                    message,
                    llmIntent,
                    nlpIntent,
                    dbIntent: llmIntent,
                    newIntent: nlpIntent,
                    source,
                    apiErrorReason,
                    generateResponse,
                    sessionId: log.sessionId || null,
                  },
                  intentDescriptions
                )

                if (classifiedResult.status === 'INVALID_MESSAGE' && !classifiedResult.accurate) {
                  console.warn('[audit] Invalid message appears to have shown a real intent flow', {
                    logId: String(log?._id || ''),
                    sessionId: log.sessionId ? String(log.sessionId) : '',
                    message,
                    nlpIntent,
                    invalidHandledReason: classifiedResult.invalidHandledReason,
                  })
                }

                results.push(classifiedResult)
                processed += 1
                applyStats(stats, classifiedResult)
                applyAccuracyHistory(accuracyHistoryTracker, logTimestamp, classifiedResult)

                if (processed % PROGRESS_INTERVAL === 0 || (total !== null && processed === total)) {
                  emitProgress()
                }
              } catch (error) {
                applyBatchOutcome(batchOutcome, error?.message || 'processing_error')
                console.error('[audit] Failed to process log record', {
                  logId: String(log?._id || ''),
                  message: error?.message,
                  stack: error?.stack,
                })
              }
            },
            adaptiveThrottle.currentConcurrency
          )

          adjustAdaptiveThrottle(adaptiveThrottle, batchOutcome)
        }

        for (const window of windows) {
          const windowQuery = {
            ...query,
            _id: { $gte: window.startObjectId, $lte: window.endObjectId },
          }
          const cursor = collection
            .find(windowQuery)
            .project({
              sessionId: 1,
              'request.data': 1,
              'response.intent.name': 1,
            })
            .sort({ _id: -1 })
            .batchSize(BATCH_SIZE)

          let batch = []

          while (await cursor.hasNext()) {
            const log = await cursor.next()
            if (log) batch.push(log)

            if (batch.length === BATCH_SIZE) {
              await processBatch(batch)
              batch = []
              if (BATCH_DELAY + adaptiveThrottle.extraDelayMs > 0) {
                await sleep(BATCH_DELAY + adaptiveThrottle.extraDelayMs)
              }
            }
          }

          if (batch.length > 0) {
            await processBatch(batch)
          }

          if (BATCH_DELAY + adaptiveThrottle.extraDelayMs > 0) {
            await sleep(BATCH_DELAY + adaptiveThrottle.extraDelayMs)
          }
        }

        const auditId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        const analytics = buildAnalyticsSummary(results)
        const accuracyHistory = finalizeAccuracyHistory(accuracyHistoryTracker)
        const throttleSummary = {
          initialConcurrency: API_CONCURRENCY,
          finalConcurrency: adaptiveThrottle.currentConcurrency,
          minConcurrency: adaptiveThrottle.minConcurrency,
          extraDelayMs: adaptiveThrottle.extraDelayMs,
          lastAdjustmentReason: adaptiveThrottle.lastAdjustmentReason,
        }
        const bulkRecommendations = generateBulkIntentRecommendations(results, intentDescriptions)
        const invalidIntentWatchlist = buildInvalidIntentWatchlist(results)
        const unhandledIntentWatchlist = generateUnhandledIntentWatchlist(results)

        await persistAuditPayload(auditId, {
          auditId,
          createdAt: new Date().toISOString(),
          stats,
          analytics,
          accuracyHistory,
          throttleSummary,
          bulkRecommendations,
          invalidIntentWatchlist,
          unhandledIntentWatchlist,
          results,
        })

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              auditId,
              processed,
              stats,
              analytics,
              accuracyHistory,
              throttleSummary,
              bulkRecommendations,
              invalidIntentWatchlist,
              unhandledIntentWatchlist,
            })}\n\n`
          )
        )
        console.log('[audit] Audit completed successfully', {
          auditId,
          processed,
          stats,
          apiConcurrency: API_CONCURRENCY,
          finalApiConcurrency: adaptiveThrottle.currentConcurrency,
          throttleExtraDelayMs: adaptiveThrottle.extraDelayMs,
          throttleLastAdjustmentReason: adaptiveThrottle.lastAdjustmentReason,
          cachedMessageCount: nlpResponseCache.size,
          cachedGenerateCount: generateResponseCache.size,
          accuracyHistoryPoints: accuracyHistory.length,
        })
        controller.close()
      } catch (error) {
        console.error('[audit] Route failed:', {
          message: error?.message,
          stack: error?.stack,
        })
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Audit failed' })}\n\n`)
        )
        controller.close()
      } finally {
        await client.close()
      }
    },
  })

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
