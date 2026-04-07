'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Zap, TrendingUp, Brain } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b immersive-header">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent glow-primary">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">Intent Audit Pro</span>
              </motion.div>
              <Link href="/audit">
                <Button className="bg-gradient-to-r from-primary to-accent glow-primary cursor-pointer">Get Started</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-8 text-center"
            >
              <motion.h1 variants={item} className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl gradient-text">
                Audit & Perfect Your <br /> Intent Detection System
              </motion.h1>

              <motion.p variants={item} className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                Compare NLP and LLM models side-by-side, identify mismatches with surgical precision, and automatically generate description improvements to supercharge your intent detection.
              </motion.p>

              <motion.div variants={item} className="flex flex-wrap justify-center gap-4">
                <Link href="/audit">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent glow-primary text-white px-8">
                    Launch Audit Tool
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-primary/20 hover:border-primary/50 glow-primary">
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-12">
              <div className="text-center">
                <h2 className="text-4xl font-bold">Powerful Features</h2>
                <p className="mt-3 text-muted-foreground text-lg">Everything you need to dominate your NLP pipeline</p>
              </div>

              <motion.div variants={container} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Zap, title: 'Real-time Streaming', desc: 'Watch progress live as audits process', color: 'from-primary to-primary/50' },
                  { icon: TrendingUp, title: 'Comparative Analysis', desc: 'See which model performs better', color: 'from-accent to-accent/50' },
                  { icon: CheckCircle, title: 'Auto Suggestions', desc: 'Get AI-powered description improvements', color: 'from-secondary to-secondary/50' },
                  { icon: Brain, title: 'Smart Matching', desc: 'Match utterances across intents', color: 'from-primary to-accent' },
                ].map((feature, i) => (
                  <motion.div key={i} variants={item} className="group floating-card">
                    <Card className="h-full immersive-card hover:border-primary/30 cursor-pointer">
                      <CardContent className="space-y-4 pt-8">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all`}>
                          <feature.icon className="h-full w-full text-white" />
                        </div>
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-12">
              <div className="text-center">
                <h2 className="text-4xl font-bold">How It Works</h2>
              </div>

              <motion.div variants={container} className="grid gap-8 md:grid-cols-3">
                {[
                  { num: '1', title: 'Select Date Range', desc: 'Pick the time period for your audit' },
                  { num: '2', title: 'Run Comparison', desc: 'System fetches logs and compares models' },
                  { num: '3', title: 'Analyze & Improve', desc: 'Review mismatches and apply suggestions' },
                ].map((step, i) => (
                  <motion.div key={i} variants={item} className="relative">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-xl glow-primary">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="absolute right-0 top-7 hidden h-0.5 w-1/3 -translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-primary/50 to-accent/30 md:block" />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-2xl immersive-card p-8 text-center md:p-12 border-primary/20 glow-primary"
          >
            <h2 className="text-4xl font-bold">Ready to Transform Your Intent System?</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">Start auditing and comparing your models with precision analytics and actionable insights</p>
            <Link href="/audit">
              <Button size="lg" className="mt-8 bg-gradient-to-r from-primary to-accent glow-primary text-white">
                Open Audit Tool
                <Zap className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-primary/10 px-4 py-12 sm:px-6 lg:px-8 bg-background/50">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
            <p>Intent Audit Pro • Precision NLP Analytics • v1.0</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
