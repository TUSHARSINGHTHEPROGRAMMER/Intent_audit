'use client'

import { memo, useMemo } from 'react'
import { format } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Activity, CalendarRange, Target, TrendingDown, Zap } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

function formatAuditDate(value) {
  if (!value) return 'Not set'

  try {
    return format(new Date(value), 'dd MMM yyyy, hh:mm a')
  } catch {
    return value
  }
}

export const AnalyticsPanel = memo(function AnalyticsPanel({ analytics, stats, accuracyHistory, auditWindow, auditId }) {
  if (!analytics || !stats) return null

  const topMismatches = analytics.topMismatches || []
  const statusMix = useMemo(
    () => [
      { name: 'Match', value: stats.match || 0, fill: '#22c55e' },
      { name: 'LLM Handled', value: stats.llmHandled || 0, fill: '#0ea5e9' },
      { name: 'Generative Handled', value: stats.generativeHandled || 0, fill: '#06b6d4' },
      { name: 'Updation', value: stats.updation || 0, fill: '#f59e0b' },
      { name: 'Invalid', value: stats.invalidMessage || 0, fill: '#f43f5e' },
    ],
    [stats]
  )
  const mismatchChartData = useMemo(
    () =>
      topMismatches.map((item) => ({
        pattern: `${item.from} -> ${item.to}`,
        count: item.count,
      })),
    [topMismatches]
  )
  const statusChartConfig = {
    Match: { label: 'Match', color: '#22c55e' },
    'LLM Handled': { label: 'LLM Handled', color: '#0ea5e9' },
    'Generative Handled': { label: 'Generative Handled', color: '#06b6d4' },
    Updation: { label: 'Updation', color: '#f59e0b' },
    Invalid: { label: 'Invalid', color: '#f43f5e' },
  }
  const mismatchChartConfig = {
    count: { label: 'Count', color: '#3b82f6' },
  }
  const accuracyTrend = useMemo(
    () =>
      (accuracyHistory || [])
        .slice(-12)
        .map((item) => ({
          label: format(new Date(item.bucketStart), 'dd MMM HH:mm'),
          accuracy: Number(item.accuracy || 0),
          total: item.total || 0,
        })),
    [accuracyHistory]
  )
  const accuracyChartConfig = {
    accuracy: { label: 'Accuracy', color: '#22c55e' },
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Audit Window
          </CardTitle>
          <CardDescription>Analytics for the currently selected audit range</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Start</p>
            <p className="mt-2 text-sm font-medium text-foreground">{formatAuditDate(auditWindow?.startDate)}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">End</p>
            <p className="mt-2 text-sm font-medium text-foreground">{formatAuditDate(auditWindow?.endDate)}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{stats.accuracy}%</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Audit Id</p>
            <p className="mt-2 truncate text-sm font-medium text-foreground">{auditId || 'Pending'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Intent Coverage
          </CardTitle>
          <CardDescription>How many intent types each system handled in this date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-background/40 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">LLM Intents</p>
              <p className="text-xs text-muted-foreground">Stored responses from DB</p>
            </div>
            <Badge>{analytics.llmTotal || 0}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-background/40 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">NLP Intents</p>
              <p className="text-xs text-muted-foreground">Fresh responses from API</p>
            </div>
            <Badge variant="outline">{analytics.nlpTotal || 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Model Performance
          </CardTitle>
          <CardDescription>Fast readout of accuracy and actionable volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Accurate Outcomes</p>
              <p className="text-sm font-bold">{stats.accurateCount || 0}</p>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${stats.accuracy}%` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Records</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.total || 0}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Needs Review</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(stats.updation || 0) + (stats.invalidMessage || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Status Mix
          </CardTitle>
          <CardDescription>Distribution of audit outcomes inside this range</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="mx-auto h-[280px] w-full"
            config={statusChartConfig}
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={statusMix}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                strokeWidth={4}
              >
                {statusMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5 xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Mismatch Analytics
          </CardTitle>
          <CardDescription>Top LLM to NLP divergences in the selected range</CardDescription>
        </CardHeader>
        <CardContent>
          {mismatchChartData.length ? (
            <ChartContainer className="h-[320px] w-full" config={mismatchChartConfig}>
              <BarChart accessibilityLayer data={mismatchChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="pattern"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={160}
                  tickFormatter={(value) => (value.length > 28 ? `${value.slice(0, 28)}...` : value)}
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => <span className="font-mono">{value}</span>} />}
                />
                <Bar dataKey="count" radius={8} fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-background/40 p-6 text-sm text-muted-foreground">
              No strong mismatch clusters were found for this date range.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Accuracy History
          </CardTitle>
          <CardDescription>Accuracy trend across time buckets inside the selected audit range</CardDescription>
        </CardHeader>
        <CardContent>
          {accuracyTrend.length ? (
            <ChartContainer className="h-[280px] w-full" config={accuracyChartConfig}>
              <BarChart accessibilityLayer data={accuracyTrend} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={(value) => (value.length > 12 ? value.slice(0, 12) : value)}
                />
                <YAxis
                  dataKey="accuracy"
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  width={44}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _, item) => (
                        <div className="space-y-1">
                          <div className="font-mono">{value}%</div>
                          <div className="text-xs text-muted-foreground">{item?.payload?.total || 0} records</div>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="accuracy" radius={8} fill="var(--color-accuracy)" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-background/40 p-6 text-sm text-muted-foreground">
              Accuracy history will appear after this audit finishes and saves its time-bucket summary.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
