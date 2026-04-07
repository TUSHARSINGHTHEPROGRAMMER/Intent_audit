import { readFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { existsSync } from 'fs'

const CACHE_DIR = path.join(os.tmpdir(), 'audit-cache')

async function loadAuditResults(auditId) {
  // Try to load new JSONL format first
  const resultsPath = path.join(CACHE_DIR, `${auditId}-results.jsonl`)
  const metadataPath = path.join(CACHE_DIR, `${auditId}-metadata.json`)
  
  let data = {}
  let results = []
  
  // Load metadata
  if (existsSync(metadataPath)) {
    try {
      const raw = await readFile(metadataPath, 'utf8')
      data = JSON.parse(raw)
    } catch (error) {
      console.warn('[audit-results] Error loading metadata:', error?.message)
    }
  }
  
  // Load results from JSONL
  if (existsSync(resultsPath)) {
    try {
      const raw = await readFile(resultsPath, 'utf8')
      results = raw
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line)
          } catch (error) {
            console.warn('[audit-results] Error parsing result line:', error?.message)
            return null
          }
        })
        .filter(Boolean)
    } catch (error) {
      console.warn('[audit-results] Error loading results file:', error?.message)
    }
  } else {
    // Fallback to old format for backward compatibility
    try {
      const oldPath = path.join(CACHE_DIR, `${auditId}.json`)
      if (existsSync(oldPath)) {
        const raw = await readFile(oldPath, 'utf8')
        const oldData = JSON.parse(raw)
        data = oldData
        results = oldData.results || []
      }
    } catch (error) {
      console.warn('[audit-results] Error loading legacy format:', error?.message)
    }
  }
  
  return { data, results }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const auditId = searchParams.get('auditId')
    const filter = searchParams.get('filter') || 'all'
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 25))
    const mode = searchParams.get('mode') || 'page'

    if (!auditId) {
      console.error('[audit-results] Missing auditId')
      return Response.json({ error: 'Missing auditId' }, { status: 400 })
    }

    const { data, results: allResults } = await loadAuditResults(auditId)
    let results = allResults

    if (filter !== 'all') {
      results = results.filter((result) => result.status === filter)
    }

    if (search) {
      results = results.filter((result) =>
        [
          result.message,
          result.llmIntent,
          result.nlpIntent,
          result.dbIntent,
          result.newIntent,
          result.status,
          result.recommendedIntent,
          result.source,
          result.apiErrorReason,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      )
    }

    if (mode === 'all') {
      return Response.json({
        items: results,
        total: results.length,
        totalPages: 1,
        stats: data.stats || null,
        analytics: data.analytics || null,
        accuracyHistory: data.accuracyHistory || [],
      })
    }

    const total = results.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const startIndex = (page - 1) * pageSize
    const items = results.slice(startIndex, startIndex + pageSize)

    return Response.json({
      items,
      total,
      totalPages,
      page,
      pageSize,
      stats: data.stats || null,
      analytics: data.analytics || null,
      accuracyHistory: data.accuracyHistory || [],
    })
  } catch (error) {
    console.error('[audit-results] Route failed:', {
      message: error?.message,
      stack: error?.stack,
    })
    return Response.json({ error: 'Failed to load audit results' }, { status: 500 })
  }
}
