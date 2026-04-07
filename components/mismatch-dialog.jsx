'use client'

import { memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { compareIntentChoices, generateIntentDescriptionRecommendation } from '@/lib/intent-analysis'

export const MismatchDialog = memo(function MismatchDialog({
  open,
  onOpenChange,
  result,
  intentDescriptions: initialDescriptions,
  auditResults = [],
}) {
  const [descriptions, setDescriptions] = useState(initialDescriptions || {})
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    if (open && Object.keys(descriptions).length === 0) {
      // Fetch intent descriptions from Google Sheets on dialog open
      fetch('/api/intents')
        .then((res) => res.json())
        .then((data) => setDescriptions(data.intents || {}))
        .catch((err) => console.error('[v0] Failed to fetch intents:', err))
    }
  }, [open, descriptions])

  const analysis = useMemo(
    () =>
      result
        ? compareIntentChoices(result.message, descriptions, [result.llmIntent || result.dbIntent, result.nlpIntent || result.newIntent])
        : {
            rankings: [],
            summary: {
              topIntent: null,
              confidence: 'low',
              confidenceGap: 0,
            },
          },
    [descriptions, result]
  )
  const descriptionRecommendation = useMemo(
    () => (result ? generateIntentDescriptionRecommendation(result.nlpIntent || result.newIntent || result.llmIntent || result.dbIntent, descriptions, auditResults) : null),
    [auditResults, descriptions, result]
  )

  if (!result) return null
  const llmIntent = result.llmIntent || result.dbIntent
  const nlpIntent = result.nlpIntent || result.newIntent
  const oldDesc = descriptions[llmIntent]?.old || 'No description available'
  const newDesc =
    descriptions[nlpIntent]?.updated ||
    descriptions[nlpIntent]?.old ||
    'No description available'
  const databaseAnalysis = analysis.rankings.find((entry) => entry.intent === llmIntent)
  const returnedAnalysis = analysis.rankings.find((entry) => entry.intent === nlpIntent)
  const topSuggestions = analysis.rankings.slice(0, 4)

  const primaryRecommendation =
    analysis.summary.topIntent?.intent === llmIntent
      ? `The lexical and semantic signals currently support the stored LLM intent more strongly. This looks closer to an API-side NLP mismatch than a bad stored intent definition.`
      : analysis.summary.topIntent?.intent === nlpIntent
        ? `The message is better explained by the live NLP/API intent. This mismatch likely comes from gaps in the stored LLM intent wording or missing training examples.`
        : `Neither compared intent is a dominant match. The message may fit another intent description better, so this deserves a taxonomy review.`

  const confidenceTone =
    analysis.summary.confidence === 'high'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-50'
      : analysis.summary.confidence === 'medium'
        ? 'border-amber-400/25 bg-amber-500/10 text-amber-50'
        : 'border-white/10 bg-slate-900/80 text-slate-100'

  const copyValue = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(''), 1800)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden border-white/10 bg-slate-950/95 text-card-foreground shadow-[0_30px_80px_rgba(2,8,23,0.5)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-50">Intent Mismatch Analysis</DialogTitle>
          <DialogDescription className="text-slate-400">Hybrid scoring review across stored descriptions, live NLP intent, and recommendation signals.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto overscroll-contain pr-2">
          {/* User Message */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="section-label">User Message</p>
            <Card className="panel-surface p-4">
              <p className="text-slate-100 italic">"{result.message}"</p>
            </Card>
          </motion.div>

          {/* Intent Comparison */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="section-label">LLM Result</p>
                <Badge variant="outline" className="border-blue-400/30 bg-blue-500/10 text-blue-100">{llmIntent}</Badge>
              </div>
              <Card className="border-blue-400/20 bg-blue-500/8 p-3 text-slate-100">
                <p className="text-xs leading-relaxed text-slate-200">{oldDesc}</p>
                {databaseAnalysis && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-400/30 text-blue-100">
                      Relevance {databaseAnalysis.scorePercent}%
                    </Badge>
                    <Badge variant="outline" className="border-blue-400/20 text-blue-200">
                      Fuzzy {(databaseAnalysis.signals.fuzzy * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="section-label">NLP Result</p>
                <Badge variant="outline" className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100">{nlpIntent}</Badge>
              </div>
              <Card className="border-cyan-400/20 bg-cyan-500/8 p-3 text-slate-100">
                <p className="text-xs leading-relaxed text-slate-200">{newDesc}</p>
                {returnedAnalysis && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-cyan-400/30 text-cyan-100">
                      Relevance {returnedAnalysis.scorePercent}%
                    </Badge>
                    <Badge variant="outline" className="border-cyan-400/20 text-cyan-200">
                      Fuzzy {(returnedAnalysis.signals.fuzzy * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Analysis */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            <p className="section-label">Model Decision Readout</p>
            <Card className={`p-4 border ${confidenceTone}`}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="border-white/15 text-current">Top match: {analysis.summary.topIntent?.intent || 'Unknown'}</Badge>
                <Badge variant="outline" className="border-white/15 text-current">Confidence: {analysis.summary.confidence}</Badge>
                <Badge variant="outline" className="border-white/15 text-current">
                  Margin {(analysis.summary.confidenceGap * 100).toFixed(0)} pts
                </Badge>
              </div>
              <p className="text-sm">
                {primaryRecommendation}
              </p>
            </Card>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-2">
              <p className="section-label">Top Candidate Intents</p>
              <div className="space-y-2">
                {topSuggestions.length > 0 ? (
                  topSuggestions.map((entry, index) => (
                    <Card key={`${entry.intent}-${index}`} className="panel-surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={index === 0 ? 'bg-slate-100 text-slate-950' : 'bg-white/8 text-slate-100'}>
                              #{index + 1} {entry.intent}
                            </Badge>
                            <Badge variant="outline" className="text-slate-100">{entry.scorePercent}%</Badge>
                          </div>
                          <p className="text-xs text-slate-300">
                            BM25 {(Math.min(1.5, entry.signals.bm25) / 1.5 * 100).toFixed(0)}% • Phrase {(entry.signals.phrase * 100).toFixed(0)}% • Name {(entry.signals.intentNameBoost * 100).toFixed(0)}%
                          </p>
                          {entry.phrases.length > 0 && (
                            <p className="text-xs text-slate-100">
                              Phrase hits: {entry.phrases.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="panel-muted p-4">
                    <p className="text-sm text-muted-foreground">
                      Intent descriptions are still loading, so there is not enough context to rank candidate intents yet.
                    </p>
                  </Card>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="space-y-2">
              <p className="section-label">Evidence Tokens</p>
              <Card className="panel-surface p-4 space-y-3">
                {analysis.summary.topIntent?.evidence?.length ? (
                  analysis.summary.topIntent.evidence.map((item) => (
                    <div key={`${item.query}-${item.match}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-100">{item.query}</span>
                      <span className="text-slate-400">matched with</span>
                      <Badge variant="outline" className="text-slate-100">{item.match}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">
                    No strong token-level evidence was found. This often means the intent descriptions are too generic or the user phrasing is novel.
                  </p>
                )}
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-2">
            <p className="section-label">What To Improve</p>
            <Card className="panel-surface p-4">
              <p className="text-sm text-slate-200">
                If this intent should map to <strong>{nlpIntent}</strong>, add more examples that resemble
                {' '}<strong>{result.message}</strong>. If <strong>{llmIntent}</strong> is actually correct,
                then this is more of a stored-history mismatch than an NLP training gap.
              </p>
            </Card>
          </motion.div>

          {descriptionRecommendation && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="space-y-2">
              <p className="section-label">Suggested Updated Description</p>
              <Card className="border-emerald-400/20 bg-emerald-500/8 p-4">
                {descriptionRecommendation.oldDescription && (
                  <p className="mb-3 text-xs leading-6 text-emerald-300/90">
                    {descriptionRecommendation.usingSharedAppAnalyticsColumn
                      ? 'Built on the existing shared App Analytics description for the NLP intent, then strengthened with the newly observed utterances.'
                      : 'Built from the current NLP intent description, then strengthened with the newly observed utterances.'}
                  </p>
                )}
                <p className="text-sm leading-6 text-emerald-100">{descriptionRecommendation.recommendation}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    onClick={() => copyValue(descriptionRecommendation.recommendation, 'description')}
                  >
                    {copiedKey === 'description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copy Updated Description
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-500/10"
                    onClick={() =>
                      copyValue(JSON.stringify(descriptionRecommendation.trainingPayload, null, 2), 'payload')
                    }
                  >
                    {copiedKey === 'payload' ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    Copy Update/Train Payload
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {descriptionRecommendation?.representativeUtterances?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
              <p className="section-label">Utterances This Intent Should Handle</p>
              <Card className="panel-surface p-4 space-y-2">
                {descriptionRecommendation.representativeUtterances.map((utterance) => (
                  <p key={utterance} className="text-sm text-slate-200">
                    "{utterance}"
                  </p>
                ))}
              </Card>
            </motion.div>
          )}

          {descriptionRecommendation?.conflictingIntents?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="space-y-2">
              <p className="section-label">Intents This Description Should Avoid</p>
              <Card className="panel-surface p-4">
                <div className="flex flex-wrap gap-2">
                  {descriptionRecommendation.conflictingIntents.map((intent) => (
                    <Badge key={intent} variant="outline" className="border-amber-400/30 text-amber-200">
                      {intent}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})
