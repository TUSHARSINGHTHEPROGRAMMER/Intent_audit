'use client'

import dynamic from 'next/dynamic'
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, Download, Pause, Play, Target, TrendingUp, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

import { StatsCard } from '@/components/stats-card'

const AnalyticsPanel = dynamic(
  () => import('@/components/analytics-panel').then((module) => module.AnalyticsPanel),
  { ssr: false }
)
const MismatchDialog = dynamic(
  () => import('@/components/mismatch-dialog').then((module) => module.MismatchDialog),
  { ssr: false }
)

const STATUS_CONFIG = [
  { key: 'match', label: 'MATCH', filter: 'MATCH', accent: 'bg-emerald-500', badge: 'bg-green-900/30 border-green-600/50 text-green-300' },
  { key: 'llmHandled', label: 'LLM HANDLED', filter: 'LLM_HANDLED', accent: 'bg-blue-500', badge: 'bg-blue-900/30 border-blue-600/50 text-blue-300' },
  { key: 'generativeHandled', label: 'GENERATIVE HANDLED', filter: 'GENERATIVE_HANDLED', accent: 'bg-cyan-500', badge: 'bg-cyan-900/30 border-cyan-600/50 text-cyan-300' },
  { key: 'updation', label: 'UPDATION', filter: 'UPDATION', accent: 'bg-amber-400', badge: 'bg-amber-900/30 border-amber-600/50 text-amber-300' },
  { key: 'invalidMessage', label: 'INVALID', filter: 'INVALID_MESSAGE', accent: 'bg-rose-500', badge: 'bg-rose-900/30 border-rose-600/50 text-rose-300' },
]

function getStatusBadgeClass(status) {
  if (status === 'MATCH') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
  if (status === 'LLM_HANDLED') return 'border-blue-400/30 bg-blue-500/10 text-blue-200'
  if (status === 'GENERATIVE_HANDLED') return 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
  if (status === 'INVALID_MESSAGE') return 'border-rose-400/30 bg-rose-500/10 text-rose-200'
  return 'border-amber-400/30 bg-amber-500/10 text-amber-200'
}

function escapeExcelCell(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getStatusExcelTheme(status) {
  if (status === 'MATCH') {
    return {
      bg: '#dcfce7',
      text: '#166534',
      border: '#86efac',
    }
  }

  if (status === 'LLM_HANDLED') {
    return {
      bg: '#dbeafe',
      text: '#1d4ed8',
      border: '#93c5fd',
    }
  }

  if (status === 'INVALID_MESSAGE') {
    return {
      bg: '#ffe4e6',
      text: '#be123c',
      border: '#fda4af',
    }
  }

  return {
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fcd34d',
  }
}

function buildExcelDocument(title, sections) {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Calibri, Segoe UI, sans-serif;
            background: #f5f7fb;
            color: #172033;
            margin: 24px;
          }
          .hero {
            padding: 18px 22px;
            border-radius: 20px;
            color: #ffffff;
            background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #0f766e 100%);
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
            margin-bottom: 18px;
          }
          .hero h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .hero p {
            margin: 8px 0 0;
            font-size: 12px;
            opacity: 0.9;
          }
          .section {
            margin-top: 18px;
            background: #ffffff;
            border: 1px solid #dbe5f2;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          }
          .section-title {
            padding: 12px 16px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #0f172a;
            background: linear-gradient(90deg, #e0f2fe 0%, #ecfeff 50%, #ecfdf5 100%);
            border-bottom: 1px solid #dbe5f2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            font-size: 12px;
            border-top: 1px solid #e5edf7;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background: #f8fbff;
          }
          .pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid #cbd5e1;
          }
          .metric-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 12px;
            padding: 12px;
          }
          .metric-card {
            border-radius: 16px;
            padding: 14px;
            color: #ffffff;
          }
          .metric-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.92;
          }
          .metric-value {
            margin-top: 8px;
            font-size: 24px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="hero">
          <h1>${escapeExcelCell(title)}</h1>
          <p>Generated from App Analytics audit export</p>
        </div>
        ${sections.join('')}
      </body>
    </html>`
}

function createEmptyStats() {
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

export default function AuditPage() {
  const PAGE_SIZE_OPTIONS = ['25', '50', '100', '200']
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [results, setResults] = useState([])
  const [auditId, setAuditId] = useState('')
  const [intentDescriptions, setIntentDescriptions] = useState({})
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedMismatch, setSelectedMismatch] = useState(null)
  const [mismatchOpen, setMismatchOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [streamProgress, setStreamProgress] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [audits, setAudits] = useState([])
  const [stats, setStats] = useState(createEmptyStats())
  const [resultsTotal, setResultsTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [analyticsSummary, setAnalyticsSummary] = useState(null)
  const [accuracyHistory, setAccuracyHistory] = useState([])
  const [bulkRecommendations, setBulkRecommendations] = useState([])
  const [invalidIntentWatchlist, setInvalidIntentWatchlist] = useState([])
  const [unhandledIntentWatchlist, setUnhandledIntentWatchlist] = useState([])
  const [sheetSyncState, setSheetSyncState] = useState({ status: 'idle', message: '' })
  const [activeAuditWindow, setActiveAuditWindow] = useState({ startDate: '', endDate: '' })

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const statusSummary = useMemo(
    () =>
      STATUS_CONFIG.map((item) => ({
        ...item,
        value: stats[item.key] || 0,
        percent: stats.total ? Math.round(((stats[item.key] || 0) / stats.total) * 100) : 0,
      })),
    [stats]
  )
  const paginationWindow = useMemo(() => {
    const visiblePages = Math.min(totalPages, 5)
    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - visiblePages + 1))
    return Array.from({ length: visiblePages }, (_, index) => startPage + index)
  }, [currentPage, totalPages])
  const statsCards = useMemo(
    () => [
      { label: 'Total Records', value: stats.total, icon: <TrendingUp className="h-5 w-5" />, color: 'blue' },
      { label: 'Matches', value: stats.match, icon: <Target className="h-5 w-5" />, color: 'green' },
      { label: 'LLM Handled', value: stats.llmHandled, icon: <Zap className="h-5 w-5" />, color: 'blue' },
      { label: 'Generative Handled', value: stats.generativeHandled, icon: <Zap className="h-5 w-5" />, color: 'blue' },
      { label: 'Updation', value: stats.updation, icon: <Zap className="h-5 w-5" />, color: 'amber' },
      { label: 'Invalid Message', value: stats.invalidMessage, icon: <Pause className="h-5 w-5" />, color: 'red' },
      { label: 'Accuracy', value: `${stats.accuracy}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'neutral' },
    ],
    [stats]
  )

  const openMismatch = useCallback((result) => {
    setSelectedMismatch(result)
    setMismatchOpen(true)
  }, [])

  const tableRows = useMemo(
    () =>
      results.map((result, index) => (
        <tr
          key={`${result.message}-${index}`}
          className="cursor-pointer border-t border-white/6 transition-colors hover:bg-white/[0.03]"
          onClick={() => openMismatch(result)}
        >
          <td className="max-w-xs truncate p-3 text-slate-200 font-medium" title={result.message}>
            {result.message}
          </td>
          <td className="p-3 font-semibold text-blue-200">{result.llmIntent || result.dbIntent}</td>
          <td className="p-3 font-semibold text-cyan-200">{result.nlpIntent || result.newIntent}</td>
          <td className="p-3">
            <Badge variant="outline" className={getStatusBadgeClass(result.status)}>
              {result.status}
            </Badge>
          </td>
        </tr>
      )),
    [openMismatch, results]
  )

  const cardRows = useMemo(
    () =>
      results.map((result, index) => (
        <div
          key={`${result.message}-${index}`}
          className="panel-surface floating-card cursor-pointer space-y-3 rounded-2xl p-4"
          onClick={() => openMismatch(result)}
        >
          <p className="line-clamp-2 text-sm font-semibold text-slate-100">{result.message}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Badge className="bg-blue-500/15 text-xs font-medium text-blue-100">{result.llmIntent || result.dbIntent}</Badge>
              <Badge variant="outline" className="border-cyan-400/30 bg-cyan-500/10 text-xs font-medium text-cyan-100">
                {result.nlpIntent || result.newIntent}
              </Badge>
            </div>
            <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(result.status)}`}>
              {result.status}
            </Badge>
          </div>
        </div>
      )),
    [openMismatch, results]
  )

  useEffect(() => {
    const saved = sessionStorage.getItem('audits')
    if (saved) setAudits(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (audits.length > 0) {
      sessionStorage.setItem('audits', JSON.stringify(audits))
    }
  }, [audits])

  useEffect(() => {
    fetch('/api/intents')
      .then((res) => res.json())
      .then((data) => setIntentDescriptions(data.intents || {}))
      .catch((err) => console.error('Failed to load intent descriptions:', err))
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, pageSize, deferredSearchQuery])

  useEffect(() => {
    if (!auditId || loading) return

    const controller = new AbortController()

    const fetchPage = async () => {
      setLoadingResults(true)

      try {
        const params = new URLSearchParams({
          auditId,
          filter,
          search: deferredSearchQuery,
          page: String(currentPage),
          pageSize: String(pageSize),
        })

        const response = await fetch(`/api/audit/results?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch paged results')
        }

        startTransition(() => {
          setResults(data.items || [])
          setResultsTotal(data.total || 0)
          setTotalPages(data.totalPages || 1)
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Paged results fetch failed:', error)
        }
      } finally {
        if (!controller.signal.aborted) setLoadingResults(false)
      }
    }

    fetchPage()
    return () => controller.abort()
  }, [auditId, currentPage, deferredSearchQuery, filter, loading, pageSize])

  const runAudit = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    setLoading(true)
    setAuditId('')
    setResults([])
    setResultsTotal(0)
    setTotalPages(1)
    setCurrentPage(1)
    setSearchQuery('')
    setStats(createEmptyStats())
    setAnalyticsSummary(null)
    setAccuracyHistory([])
    setBulkRecommendations([])
    setInvalidIntentWatchlist([])
    setUnhandledIntentWatchlist([])
    setStreamProgress(0)
    setTotalRecords(0)
    setActiveAuditWindow({ startDate, endDate })

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'total') {
              setTotalRecords(data.total)
            } else if (data.type === 'progress') {
              setStreamProgress(data.processed)
              setStats(data.stats || createEmptyStats())
            } else if (data.type === 'complete') {
              setStreamProgress(data.processed)
              setStats(data.stats || createEmptyStats())
              setAuditId(data.auditId || '')
              setAnalyticsSummary(data.analytics || null)
              setAccuracyHistory(data.accuracyHistory || [])
              setBulkRecommendations(data.bulkRecommendations || [])
              setInvalidIntentWatchlist(data.invalidIntentWatchlist || [])
              setUnhandledIntentWatchlist(data.unhandledIntentWatchlist || [])

              const audit = {
                id: Date.now(),
                auditId: data.auditId,
                startDate,
                endDate,
                timestamp: new Date().toLocaleString(),
                stats: data.stats || createEmptyStats(),
                accuracyHistory: data.accuracyHistory || [],
              }
              setAudits((prev) => [audit, ...prev])
            }
          } catch (error) {
            console.error('Parse error:', error)
          }
        }
      }
    } catch (error) {
      console.error('Audit failed:', error)
      alert('Audit failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    if (!auditId) return

    try {
      const params = new URLSearchParams({
        auditId,
        filter,
        search: deferredSearchQuery,
        mode: 'all',
      })

      const response = await fetch(`/api/audit/results?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to export results')
      }

      const rows = (data.items || [])
        .map(
          (result, index) => `
            <tr style="background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td>${index + 1}</td>
              <td>${escapeExcelCell(result.message)}</td>
              <td>${escapeExcelCell(result.llmIntent || result.dbIntent)}</td>
              <td>${escapeExcelCell(result.nlpIntent || result.newIntent)}</td>
              <td>${escapeExcelCell(result.status)}</td>
              <td>${escapeExcelCell(result.recommendedIntent)}</td>
              <td>${escapeExcelCell(result.confidence)}</td>
              <td>${Math.round((result.decisionScore || 0) * 100)}</td>
            </tr>`
        )
        .join('')

      const workbook = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="UTF-8" />
            <style>
              body {
                font-family: Calibri, Segoe UI, sans-serif;
                margin: 16px;
                color: #172033;
                background: #ffffff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                background: #ffffff;
                border: 1px solid #d6deea;
              }
              th {
                padding: 10px 12px;
                color: #ffffff;
                text-align: left;
                font-size: 11px;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                background: #1d4ed8;
                border: 1px solid #1e40af;
              }
              td {
                padding: 10px 12px;
                border: 1px solid #dbe4ee;
                font-size: 12px;
                vertical-align: top;
              }
            </style>
          </head>
          <body>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Message</th>
                  <th>LLM Intent</th>
                  <th>NLP Intent</th>
                  <th>Status</th>
                  <th>Recommended Intent</th>
                  <th>Confidence</th>
                  <th>Decision Score</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`

      const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `audit_${filter}_${Date.now()}.xls`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Excel export failed:', error)
    }
  }

  const exportAuditSummary = () => {
    const summaryRows = statusSummary
      .map((item) => {
        const theme = getStatusExcelTheme(item.filter)
        return `
          <tr>
            <td>
              <span class="pill" style="background:${theme.bg};color:${theme.text};border-color:${theme.border};">
                ${escapeExcelCell(item.label)}
              </span>
            </td>
            <td>${item.value}</td>
            <td>${item.percent}%</td>
          </tr>`
      })
      .join('')

    const mismatchRows = (analyticsSummary?.topMismatches || [])
      .map(
        (item) => `
          <tr>
            <td>${escapeExcelCell(item.from)}</td>
            <td>${escapeExcelCell(item.to)}</td>
            <td>${item.count}</td>
          </tr>`
      )
      .join('')

    const recommendationRows = bulkRecommendations
      .map(
        (item) => `
          <tr>
            <td>${escapeExcelCell(item.intent)}</td>
            <td>${item.affectedCount}</td>
            <td>${escapeExcelCell(item.oldDescription)}</td>
            <td>${escapeExcelCell(item.recommendation)}</td>
          </tr>`
      )
      .join('')

    const invalidRows = invalidIntentWatchlist
      .map(
        (item) => `
          <tr>
            <td>${escapeExcelCell(item.intent)}</td>
            <td>${item.count}</td>
            <td>${escapeExcelCell(item.samples.join(' | '))}</td>
          </tr>`
      )
      .join('')

    const unhandledRows = unhandledIntentWatchlist
      .map(
        (item) => `
          <tr>
            <td>${escapeExcelCell(item.intent)}</td>
            <td>${item.count}</td>
            <td>${escapeExcelCell(item.samples.join(' | '))}</td>
          </tr>`
      )
      .join('')

    const workbook = buildExcelDocument('Audit Review Summary', [
      `
        <div class="section">
          <div class="section-title">Core Metrics</div>
          <table class="metric-grid">
            <tr>
              <td class="metric-card" style="background:linear-gradient(135deg,#2563eb,#1e3a8a);">
                <div class="metric-label">Total Records</div>
                <div class="metric-value">${stats.total}</div>
              </td>
              <td class="metric-card" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);">
                <div class="metric-label">Accuracy</div>
                <div class="metric-value">${stats.accuracy}%</div>
              </td>
              <td class="metric-card" style="background:linear-gradient(135deg,#0f766e,#065f46);">
                <div class="metric-label">Accurate Outcomes</div>
                <div class="metric-value">${stats.accurateCount}</div>
              </td>
              <td class="metric-card" style="background:linear-gradient(135deg,#0284c7,#1d4ed8);">
                <div class="metric-label">LLM Intent Types</div>
                <div class="metric-value">${analyticsSummary?.llmTotal || 0}</div>
              </td>
              <td class="metric-card" style="background:linear-gradient(135deg,#14b8a6,#0f766e);">
                <div class="metric-label">NLP Intent Types</div>
                <div class="metric-value">${analyticsSummary?.nlpTotal || 0}</div>
              </td>
            </tr>
          </table>
        </div>
      `,
      `
        <div class="section">
          <div class="section-title">Status Distribution</div>
          <table>
            <thead><tr><th>Status</th><th>Count</th><th>Share</th></tr></thead>
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      `,
      `
        <div class="section">
          <div class="section-title">Top Mismatch Patterns</div>
          <table>
            <thead><tr><th>LLM Intent</th><th>NLP Intent</th><th>Count</th></tr></thead>
            <tbody>${mismatchRows || '<tr><td colspan="3">No mismatch patterns found</td></tr>'}</tbody>
          </table>
        </div>
      `,
      `
        <div class="section">
          <div class="section-title">Intent Description Updates</div>
          <table>
            <thead><tr><th>Intent</th><th>Affected Records</th><th>Current Description</th><th>Suggested Description</th></tr></thead>
            <tbody>${recommendationRows || '<tr><td colspan="4">No updates suggested</td></tr>'}</tbody>
          </table>
        </div>
      `,
      `
        <div class="section">
          <div class="section-title">HTTP / Link Watchlist</div>
          <table>
            <thead><tr><th>Intent</th><th>Count</th><th>Samples</th></tr></thead>
            <tbody>${invalidRows || '<tr><td colspan="3">No invalid link-routing issues found</td></tr>'}</tbody>
          </table>
        </div>
      `,
      `
        <div class="section">
          <div class="section-title">Currently Unhandled Intents</div>
          <table>
            <thead><tr><th>Intent</th><th>Count</th><th>Samples</th></tr></thead>
            <tbody>${unhandledRows || '<tr><td colspan="3">No currently unhandled intent clusters found</td></tr>'}</tbody>
          </table>
        </div>
      `,
    ])

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `audit_summary_${Date.now()}.xls`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const pushRecommendationsToSheet = async () => {
    if (bulkRecommendations.length === 0) {
      setSheetSyncState({ status: 'idle', message: 'No updation recommendations available.' })
      return
    }

    setSheetSyncState({ status: 'loading', message: 'Sending updates to Google Sheet...' })

    try {
      const response = await fetch('/api/intents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnName: 'Updated Description by App Analytics',
          updates: bulkRecommendations.map((item) => ({
            intent: item.intent,
            value: item.recommendation,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || data.ok === false) {
        throw new Error(data?.error || data?.data?.error || 'Sheet update failed')
      }

      setSheetSyncState({ status: 'success', message: 'Google Sheet update request sent successfully.' })
    } catch (error) {
      console.error('Sheet sync failed:', error)
      setSheetSyncState({
        status: 'error',
        message: 'Could not update the Google Sheet automatically. The Apps Script webhook may still need POST support.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="immersive-header sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href="/landing">
                  <Button variant="ghost" size="icon" className="text-slate-200 hover:bg-white/8">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <p className="section-label">Conversation Intelligence</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Intent Audit Dashboard</h1>
                  <p className="mt-1 text-sm text-slate-400">Presentation-ready audit review for model quality, mismatch analysis, and description refinement.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:border-blue-400/40 hover:bg-white/6">
                      History ({audits.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full border-white/10 bg-slate-950/95 sm:w-96">
                    <SheetHeader>
                      <SheetTitle className="text-slate-50">Audit History</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                      {audits.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No audits yet</p>
                      ) : (
                        audits.map((audit) => (
                          <Card key={audit.id} className="panel-surface p-3">
                            <p className="text-xs text-muted-foreground">{audit.timestamp}</p>
                            <p className="mt-1 text-sm font-medium text-slate-100">{audit.stats.total} records analyzed</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Accuracy {audit.stats.accuracy}%{audit.accuracyHistory?.length ? ` across ${audit.accuracyHistory.length} time buckets` : ''}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <Badge className="bg-emerald-500/15 text-emerald-100">{audit.stats.match} match</Badge>
                              <Badge className="bg-blue-500/15 text-blue-100">{audit.stats.llmHandled || 0} llm handled</Badge>
                              <Badge className="bg-cyan-500/15 text-cyan-100">{audit.stats.generativeHandled || 0} generative handled</Badge>
                              <Badge className="bg-amber-500/15 text-amber-100">{audit.stats.updation || 0} updation</Badge>
                              <Badge className="bg-rose-500/15 text-rose-100">{audit.stats.invalidMessage || 0} invalid</Badge>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="border-white/10 bg-transparent text-slate-100 hover:border-blue-400/40 hover:bg-white/6">
                      Review Updates ({bulkRecommendations.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full overflow-y-auto border-white/10 bg-slate-950/95 sm:max-w-3xl">
                    <SheetHeader>
                      <SheetTitle className="text-slate-50">Audit Review Sheet</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          Review all status buckets together, export an audit summary sheet, then push only the intent updates you want into your collaborative sheet column.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={exportAuditSummary}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Audit Summary
                          </Button>
                          <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={pushRecommendationsToSheet} disabled={sheetSyncState.status === 'loading'}>
                            {sheetSyncState.status === 'loading' ? 'Pushing...' : 'Push All To Sheet'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statusSummary.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setFilter(item.filter)
                              setReviewOpen(false)
                            }}
                            className="panel-surface overflow-hidden rounded-2xl text-left transition hover:border-blue-400/30 hover:bg-slate-900/80"
                          >
                            <div className={`h-1 w-full ${item.accent}`} />
                            <div className="space-y-2 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <Badge variant="outline" className={item.badge}>
                                  {item.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{item.percent}%</span>
                              </div>
                              <p className="text-3xl font-bold text-foreground">{item.value}</p>
                              <p className="text-xs text-muted-foreground">Tap to filter this status in the main audit view.</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <Card className="overflow-hidden border-white/10 bg-slate-950/80">
                        <div className="border-b border-white/8 px-4 py-3">
                          <h3 className="text-sm font-semibold text-foreground">Audit Snapshot</h3>
                        </div>
                        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total records</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Accurate outcomes</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{stats.accurateCount}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{stats.accuracy}%</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">LLM intent types</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{analyticsSummary?.llmTotal || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">NLP intent types</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{analyticsSummary?.nlpTotal || 0}</p>
                          </div>
                        </div>
                      </Card>

                      {sheetSyncState.message && (
                        <Card className="panel-surface p-4">
                          <p className="text-sm text-foreground">{sheetSyncState.message}</p>
                        </Card>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Top Mismatch Patterns</h3>
                        {analyticsSummary?.topMismatches?.length ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {analyticsSummary.topMismatches.map((item) => (
                              <Card key={`${item.from}-${item.to}`} className="panel-surface p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Badge>{item.from}</Badge>
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <Badge variant="outline">{item.to}</Badge>
                                  </div>
                                  <Badge variant="outline">{item.count}</Badge>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                            <Card className="panel-muted p-4">
                            <p className="text-sm text-muted-foreground">No major mismatch clusters were found in this audit run.</p>
                          </Card>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Currently Unhandled Intents</h3>
                        {unhandledIntentWatchlist.length === 0 ? (
                          <Card className="p-4">
                            <p className="text-sm text-muted-foreground">No uncovered user-intent buckets were found where NLP returned `none` and LLM was not clearly better.</p>
                          </Card>
                        ) : (
                          unhandledIntentWatchlist.map((item) => (
                            <Card key={item.intent} className="panel-surface space-y-3 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
                                  {item.intent}
                                </Badge>
                                <Badge variant="outline">{item.count} currently unhandled</Badge>
                              </div>
                              <div className="space-y-2">
                                {item.samples.map((sample, sampleIndex) => (
                                  <p key={`${item.intent}-unhandled-${sampleIndex}`} className="text-sm text-slate-300">
                                    "{sample}"
                                  </p>
                                ))}
                              </div>
                            </Card>
                          ))
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Intent Description Updates</h3>
                        {bulkRecommendations.length === 0 ? (
                          <Card className="panel-muted p-4">
                            <p className="text-sm text-muted-foreground">No updation intents found in this audit run.</p>
                          </Card>
                        ) : (
                          bulkRecommendations.map((item) => (
                            <Card key={item.intent} className="panel-surface space-y-4 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge>{item.intent}</Badge>
                                <Badge variant="outline">{item.affectedCount} records</Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Description</p>
                                <p className="text-sm text-slate-300">{item.oldDescription || 'No current description available'}</p>
                                {item.usingSharedAppAnalyticsColumn && (
                                  <Badge variant="outline" className="w-fit border-emerald-500/30 text-emerald-300">
                                    using shared app analytics description
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Suggested Update</p>
                                <p className="text-sm text-foreground">{item.recommendation}</p>
                              </div>
                              {item.mismatchTargets?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {item.mismatchTargets.map((intent) => (
                                    <Badge key={intent} variant="outline">
                                      avoid {intent}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </Card>
                          ))
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">HTTP / Link Watchlist</h3>
                        {invalidIntentWatchlist.length === 0 ? (
                          <Card className="panel-muted p-4">
                            <p className="text-sm text-muted-foreground">No link-style messages were routed to live intents in this run.</p>
                          </Card>
                        ) : (
                          invalidIntentWatchlist.map((item) => (
                            <Card key={item.intent} className="panel-surface space-y-3 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-rose-500/40 text-rose-300">
                                  {item.intent}
                                </Badge>
                                <Badge variant="outline">{item.count} link messages</Badge>
                              </div>
                              <div className="space-y-2">
                                {item.samples.map((sample, sampleIndex) => (
                                  <p key={`${item.intent}-invalid-${sampleIndex}`} className="text-sm text-slate-300">
                                    "{sample}"
                                  </p>
                                ))}
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </motion.div>

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="immersive-card overflow-hidden border-0 shadow-2xl">
              <CardHeader className="border-b border-white/8">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="section-label">Audit Control Center</p>
                    <CardTitle className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
                      <Zap className="h-5 w-5 text-blue-300" />
                      Configure Your Audit Window
                    </CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      Select your date range and run the audit to analyze intent classification quality.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                  <div className="space-y-2">
                    <label className="section-label font-semibold">Start Date & Time</label>
                    <Input type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 border-white/10 bg-slate-950/50 text-slate-100 focus:border-blue-400/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="section-label font-semibold">End Date & Time</label>
                    <Input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 border-white/10 bg-slate-950/50 text-slate-100 focus:border-blue-400/50" />
                  </div>
                  <Button onClick={runAudit} disabled={loading} size="lg" className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 sm:w-auto font-semibold">
                    {loading ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Audit
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="immersive-card border-0 shadow-2xl">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-slate-100">Processing records on the server</p>
                      <p className="font-mono text-sm text-slate-400">{streamProgress} / {totalRecords}</p>
                    </div>
                    <Progress value={totalRecords ? (streamProgress / totalRecords) * 100 : 0} className="h-2" />
                    <p className="text-xs text-slate-400">Analyzing data. This may take a few moments.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(loading || auditId) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
                {statsCards.map((item) => (
                  <StatsCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!loading && analyticsSummary && (
              <AnalyticsPanel
                analytics={analyticsSummary}
                stats={stats}
                accuracyHistory={accuracyHistory}
                auditWindow={activeAuditWindow}
                auditId={auditId}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!loading && auditId && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card className="immersive-card overflow-hidden border-0 shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-white/8 pb-4">
                    <div>
                      <p className="section-label">Audit Explorer</p>
                      <CardTitle className="mt-1 text-xl font-bold text-slate-50">Detailed Results</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search message, intent, status..." className="h-9 min-w-[220px] border-white/10 bg-slate-950/50 sm:w-[280px]" />
                      <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-slate-100 text-slate-950 hover:bg-white' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        All ({stats.total})
                      </Button>
                      <Button variant={filter === 'MATCH' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('MATCH')} className={filter === 'MATCH' ? 'bg-emerald-500 text-slate-950' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        Match ({stats.match})
                      </Button>
                      <Button variant={filter === 'LLM_HANDLED' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('LLM_HANDLED')} className={filter === 'LLM_HANDLED' ? 'bg-blue-500 text-white' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        LLM Handled ({stats.llmHandled})
                      </Button>
                      <Button variant={filter === 'GENERATIVE_HANDLED' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('GENERATIVE_HANDLED')} className={filter === 'GENERATIVE_HANDLED' ? 'bg-cyan-500 text-slate-950' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        Generative ({stats.generativeHandled})
                      </Button>
                      <Button variant={filter === 'UPDATION' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('UPDATION')} className={filter === 'UPDATION' ? 'bg-amber-400 text-slate-950' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        Updation ({stats.updation})
                      </Button>
                      <Button variant={filter === 'INVALID_MESSAGE' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('INVALID_MESSAGE')} className={filter === 'INVALID_MESSAGE' ? 'bg-rose-500 text-white' : 'border-white/10 bg-transparent text-slate-200 hover:bg-white/6'}>
                        Invalid ({stats.invalidMessage})
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToExcel} className="border-white/10 bg-transparent text-slate-200 hover:border-blue-400/40 hover:bg-white/6">
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                      </Button>
                      <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                        <SelectTrigger className="h-9 w-[120px] border-white/10 bg-slate-950/50">
                          <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="overflow-hidden rounded-2xl border border-white/10 min-h-[400px]">
                      <Tabs defaultValue="table" className="w-full">
                        <TabsList className="h-auto w-full justify-start rounded-none border-b border-white/8 bg-slate-950/60 p-1">
                          <TabsTrigger value="table" className="rounded-xl text-slate-300 data-[state=active]:bg-white/8 data-[state=active]:text-slate-50">
                            Table View
                          </TabsTrigger>
                          <TabsTrigger value="cards" className="rounded-xl text-slate-300 data-[state=active]:bg-white/8 data-[state=active]:text-slate-50">
                            Card View
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="table" className="mt-0">
                          <div className="w-full overflow-x-auto min-h-[200px]">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 border-b border-white/8 bg-slate-950/95 backdrop-blur">
                                <tr>
                                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">Message</th>
                                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">LLM</th>
                                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">NLP</th>
                                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/6">{tableRows}</tbody>
                            </table>
                          </div>
                        </TabsContent>

                        <TabsContent value="cards">
                          <div className="grid gap-3 p-4">{cardRows}</div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {loadingResults ? (
                      <div className="border-t border-white/8 px-4 py-4">
                        <p className="text-sm font-medium text-slate-400">Loading page...</p>
                      </div>
                    ) : (
                      resultsTotal > pageSize && (
                        <div className="flex flex-col gap-3 border-t border-white/8 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-medium text-slate-400">
                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, resultsTotal)} of {resultsTotal}
                          </p>
                          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    if (currentPage > 1) setCurrentPage((page) => page - 1)
                                  }}
                                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                              {paginationWindow.map((pageNumber) => (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    href="#"
                                    isActive={pageNumber === currentPage}
                                    onClick={(event) => {
                                      event.preventDefault()
                                      setCurrentPage(pageNumber)
                                    }}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    if (currentPage < totalPages) setCurrentPage((page) => page + 1)
                                  }}
                                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && !auditId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <Card className="immersive-card border-0">
                <CardContent className="space-y-4 pb-16 pt-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-blue-600 p-4 shadow-[0_18px_40px_rgba(37,99,235,0.18)]">
                    <Target className="h-full w-full text-white" />
                  </div>
                  <p className="text-lg font-semibold text-slate-100">Ready to analyze your intent system?</p>
                  <p className="text-sm text-slate-400">Select your date range above and run the audit to generate a complete analysis.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

      {mismatchOpen && selectedMismatch ? (
        <MismatchDialog
          open={mismatchOpen}
          onOpenChange={setMismatchOpen}
          result={selectedMismatch}
          intentDescriptions={intentDescriptions}
          auditResults={results}
        />
      ) : null}
    </div>
  )
}
