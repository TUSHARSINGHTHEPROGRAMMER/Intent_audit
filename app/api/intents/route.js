function normalizeIntentDescriptions(intents = {}) {
  return Object.fromEntries(
    Object.entries(intents).map(([intentName, value]) => {
      const description = value || {}

      return [
        intentName,
        {
          old: description.old || '',
          updated: description.updated || '',
          v2: description.v2 || '',
          v3: description.v3 || '',
          appAnalytics:
            description.appAnalytics ||
            description.updatedByAppAnalytics ||
            description.updated_description_by_app_analytics ||
            description.modelSuggested ||
            '',
        },
      ]
    })
  )
}

export async function GET() {
  try {
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL

    if (!webhook) {
      console.log("[v0] Webhook not configured, using mock data")

      return Response.json({
        intents: normalizeIntentDescriptions({
          greeting: {
            old: "User greets the bot",
            updated: "User provides a greeting",
            v2: "User initiates conversation",
            v3: "hello, hi, hey",
            appAnalytics: "",
          },
        }),
        source: "mock",
      })
    }

    const res = await fetch(webhook)
    if (!res.ok) {
      console.error('[sheet-fetch] Webhook responded with non-200 status', {
        status: res.status,
      })
      throw new Error(`sheet_fetch_status_${res.status}`)
    }

    const data = await res.json()
    console.log('[sheet-fetch] Loaded intent descriptions', {
      count: Object.keys(data.intents || {}).length,
    })

    return Response.json({
      intents: normalizeIntentDescriptions(data.intents || {}),
      source: "apps-script",
    })
  } catch (error) {
    console.error("[sheet-fetch] Route failed:", {
      message: error?.message,
      stack: error?.stack,
    })

    return Response.json({
      intents: {},
      source: "error",
    })
  }
}
