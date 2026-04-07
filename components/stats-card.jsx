'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export const StatsCard = memo(function StatsCard({ label, value, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-sky-400',
    green: 'from-emerald-500 to-teal-400',
    red: 'from-rose-500 to-orange-400',
    neutral: 'from-slate-400 to-slate-200',
    amber: 'from-amber-400 to-yellow-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 bg-slate-950/75 shadow-sm ring-1 ring-white/5 transition duration-300 group-hover:ring-white/12">
        <CardContent className="relative overflow-hidden rounded-[inherit] border border-white/8 bg-slate-950/90 p-6">
          <motion.div
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${colorClasses[color]}`}
            initial={{ scaleX: 0.5, opacity: 0.7 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            aria-hidden="true"
            className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-3xl`}
            animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.18, 0.12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
            </div>
            {icon && (
              <motion.div
                whileHover={{ rotate: -6, scale: 1.05 }}
                className={`rounded-2xl border border-white/12 bg-gradient-to-br ${colorClasses[color]} p-3 text-white shadow-sm`}
              >
                {icon}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
