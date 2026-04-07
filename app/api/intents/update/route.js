const MAX_UPDATES_PER_BATCH = 100
const BATCH_DELAY_MS = 500

async function sendBatchToSheet(webhook, payload) {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let data = {}

  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  return { ok: res.ok, status: res.status, data }
}

export async function POST(req) {
  try {
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL

    if (!webhook) {
      console.error('[sheet-update] Missing GOOGLE_SHEET_WEBHOOK_URL')
      return Response.json({ error: 'Google Sheet webhook not configured' }, { status: 500 })
    }

    const body = await req.json()
    const updates = Array.isArray(body.updates)
      ? body.updates
          .map((item) => ({
            intent: item?.intent || '',
            value: item?.value || '',
          }))
          .filter((item) => item.intent && item.value)
      : []

    if (!updates.length) {
      return Response.json({ ok: true, sent: 0, batches: 0 })
    }

    // Chunk large update batches
    const chunks = []
    for (let i = 0; i < updates.length; i += MAX_UPDATES_PER_BATCH) {
      chunks.push(updates.slice(i, i + MAX_UPDATES_PER_BATCH))
    }

    console.log('[sheet-update] Processing large update batch', {
      columnName: body.columnName || 'Updated Description by App Analytics',
      totalUpdates: updates.length,
      batches: chunks.length,
      batchSize: MAX_UPDATES_PER_BATCH,
    })

    const results = []
    
    // Send batches with delay to avoid overwhelming the webhook
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const payload = {
        action: 'bulk_update_intent_descriptions',
        columnName: body.columnName || 'Updated Description by App Analytics',
        updates: chunk,
        batchNumber: i + 1,
        totalBatches: chunks.length,
      }

      const result = await sendBatchToSheet(webhook, payload)
      results.push(result)

      if (!result.ok) {
        console.error('[sheet-update] Batch failed', {
          batchNumber: i + 1,
          status: result.status,
          error: result.data,
        })
      }

      // Delay between batches to avoid overwhelming the service
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    const allOk = results.every((r) => r.ok)

    return Response.json({
      ok: allOk,
      sent: updates.length,
      batches: chunks.length,
      results: results.map((r) => ({ ok: r.ok, status: r.status })),
    })
  } catch (error) {
    console.error('[sheet-update] Route failed:', {
      message: error?.message,
      stack: error?.stack,
    })
    return Response.json({ error: 'Failed to update Google Sheet', details: error?.message }, { status: 500 })
  }
}
