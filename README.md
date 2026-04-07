# Intent Audit Pro - Complete Documentation

> **Professional NLP Intent Detection Audit & Comparison System**  
> Real-time streaming analysis, comparative model insights, and automated improvements

---

## 🚀 Quick Links

| Guide | Purpose |
|-------|---------|
| **[QUICKSTART.md](./QUICKSTART.md)** | ⚡ Get running in 5 minutes |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | 📚 Comprehensive installation & troubleshooting |
| **[UI_GUIDE.md](./UI_GUIDE.md)** | 🎯 Learn how to use the interface |
| **[MONGODB_GUIDE.md](./MONGODB_GUIDE.md)** | 💾 MongoDB setup & configuration |

---

## What is Intent Audit Pro?

A modern web application that audits NLP (Natural Language Processing) and LLM (Large Language Model) intent detection systems by:

1. **Comparing Models** - Run both NLP and LLM on the same messages
2. **Finding Mismatches** - Identify where models disagree
3. **Analyzing Results** - Understand why models differ
4. **Suggesting Improvements** - Auto-generate better intent descriptions
5. **Tracking Progress** - Real-time streaming updates with session history

### Key Features

✅ **Real-time Streaming** - Watch audits process live with progress bar  
✅ **Dark Immersive UI** - Beautiful, modern interface with smooth animations  
✅ **Comparative Analysis** - See NLP vs LLM performance side-by-side  
✅ **Mismatch Dialog** - Deep-dive into why models disagreed  
✅ **Export Results** - Download CSV for team analysis  
✅ **Session History** - Track all audits in current session  
✅ **Mobile Responsive** - Works on desktop, tablet, mobile  
✅ **Zero Authentication** - Start using immediately  

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│      Next.js 15 Frontend (React)            │
│  ├─ Landing Page (/landing)                │
│  ├─ Audit Dashboard (/audit)               │
│  ├─ Framer Motion Animations               │
│  └─ Dark Immersive Theme                   │
└────────────────┬────────────────────────────┘
                 │ HTTP/API Calls
┌────────────────▼────────────────────────────┐
│    Next.js Backend API Routes               │
│  ├─ /api/audit (SSE Streaming)             │
│  ├─ /api/intents (Google Sheets)           │
│  └─ Error Handling & Fallback               │
└────────────────┬────────────────────────────┘
                 │ Queries
┌────────────────▼────────────────────────────┐
│       MongoDB Database (v4.4)               │
│  ├─ callLogs Collection                    │
│  ├─ nlpIntent Field                        │
│  ├─ llmIntent Field                        │
│  └─ Indexed for Performance                │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 15+ |
| **UI Framework** | React | 19+ |
| **Styling** | Tailwind CSS v4 | 4.0+ |
| **Animations** | Framer Motion | 11+ |
| **UI Components** | shadcn/ui | Latest |
| **Backend** | Node.js | 18+ |
| **Database** | MongoDB | 4.4+ |
| **Icons** | Lucide React | 0.56+ |
| **Package Manager** | pnpm | 8+ |

---

## Installation & Running

### 1. Setup (5 minutes)
```bash
# Clone/navigate to project
cd /vercel/share/v0-project

# Install dependencies
pnpm install

# Create environment file
cat > .env.local << EOF
MONGODB_URI=mongodb://localhost:27017/oriserveailogsmaster
PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results
SECONDARY_API_URL=http://backup-api.example.com:5000/results
EOF

# Start MongoDB
brew services start mongodb-community@4.4

# Start dev server
pnpm dev
```

### 2. Access
Open **http://localhost:3000** in your browser

### 3. Run Your First Audit
1. Click "Launch Audit Tool"
2. Select a date range (try 1-7 days)
3. Click "Run Audit"
4. Watch real-time progress
5. Export results as CSV

---

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── page.tsx              # Redirect to landing
│   ├── landing/
│   │   └── page.jsx          # Landing page (features, CTA)
│   ├── audit/
│   │   └── page.jsx          # Main audit dashboard
│   ├── api/
│   │   ├── audit/
│   │   │   └── route.js      # SSE streaming API
│   │   └── intents/
│   │       └── route.js      # Google Sheets integration
│   └── globals.css           # Dark theme definitions
├── components/
│   ├── mismatch-dialog.jsx   # Mismatch analysis modal
│   ├── stats-card.jsx        # Statistics card component
│   └── analytics-panel.jsx   # Insights & analytics
├── QUICKSTART.md             # 5-minute setup guide
├── SETUP_GUIDE.md            # Complete setup manual
├── UI_GUIDE.md               # How to use the interface
├── MONGODB_GUIDE.md          # Database setup guide
└── package.json              # Dependencies

```

---

## Environment Variables

**Required** (.env.local):
```env
# MongoDB connection string
MONGODB_URI=mongodb://username:password@host:port/database

# Primary NLP/LLM API endpoint
PRIMARY_API_URL=http://your-api-server:5000/results

# Optional backup endpoint
SECONDARY_API_URL=http://backup-api:5000/results

# Optional: Google Sheets API for intent descriptions
GOOGLE_SHEETS_ID=your-sheet-id
```

---

## Database Schema

### `callLogs` Collection
```javascript
{
  _id: ObjectId,
  message: String,              // User input text
  nlpIntent: String,           // NLP model prediction
  llmIntent: String,           // LLM model prediction  
  createdAt: Date,             // Timestamp of conversation
  source: String,              // "PRIMARY" or "SECONDARY"
  metadata: {
    userId: String,
    sessionId: String,
    confidence: Number,
    model_version: String
  }
}
```

**Indexes** (for performance):
```javascript
db.callLogs.createIndex({ createdAt: 1 })
db.callLogs.createIndex({ nlpIntent: 1 })
db.callLogs.createIndex({ llmIntent: 1 })
db.callLogs.createIndex({ createdAt: 1, source: 1 })
```

---

## Common Workflows

### Workflow 1: Finding Model Disagreements
```
1. Open Audit Dashboard
2. Select date range (1-7 days recommended)
3. Click "Run Audit"
4. Wait for completion
5. Click "Mismatches" filter
6. Export as CSV
7. Analyze in spreadsheet
```

### Workflow 2: Deep Diving into Specific Mismatches
```
1. Run audit (see Workflow 1)
2. Click any "MISMATCH" row
3. Dialog shows:
   - Original message
   - NLP prediction + description
   - LLM prediction + description
   - Key insight
4. Take notes for team discussion
5. Close and review next mismatch
```

### Workflow 3: Tracking Improvement Over Time
```
1. Run audit Monday (e.g., 50 mismatches)
2. Update intent descriptions
3. Run audit Friday (e.g., 30 mismatches)
4. Export both as CSV
5. Create comparison chart
6. Share improvement report
```

---

## API Endpoints

### `POST /api/audit`
Runs an audit with streaming results via Server-Sent Events

**Request**:
```json
{
  "startDate": "2024-04-01T00:00:00Z",
  "endDate": "2024-04-05T23:59:59Z"
}
```

**Response Stream**:
```
data: {"type":"total","total":500}
data: {"type":"result","result":{...},"processed":1}
data: {"type":"result","result":{...},"processed":2}
...
data: {"type":"complete","results":[...],"processed":500}
```

### `GET /api/intents`
Fetches intent descriptions from Google Sheets

**Response**:
```json
{
  "intents": {
    "PAYMENT": {
      "old": "User wants to make payment",
      "updated": "User wants to pay bills, recharge, or make transactions"
    }
  }
}
```

---

## Troubleshooting

### I see "Connection refused"
→ MongoDB not running. See [MONGODB_GUIDE.md](./MONGODB_GUIDE.md#troubleshooting)

### My audit is slow
→ Large date range. Try smaller range. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#performance-tips)

### API endpoint returns error
→ Check endpoint in `.env.local`. Test with: `curl http://your-api/health`

### No data appears
→ Database might be empty. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#data-management)

### Results export is blank
→ Use "Mismatches" filter first, then export

**Still stuck?** See comprehensive troubleshooting in [SETUP_GUIDE.md](./SETUP_GUIDE.md#common-errors--fixes)

---

## Performance Optimization

### Database
- ✅ Indexes created on `createdAt`, `nlpIntent`, `llmIntent`
- ✅ Compound index on `(createdAt, source)`
- ✅ Proper MongoDB 4.4 configuration

### Frontend
- ✅ Next.js 15 with automatic code splitting
- ✅ Framer Motion for smooth 60fps animations
- ✅ SSE streaming prevents blocking UI
- ✅ Lazy loading components

### API
- ✅ Batch processing (100 records at a time)
- ✅ Streaming responses (no loading screens)
- ✅ Fallback to secondary endpoint
- ✅ Error handling & recovery

---

## Security Considerations

### For Development
- ✅ Local MongoDB with no authentication
- ✅ Environment variables in `.env.local` (gitignored)
- ✅ No sensitive data in logs

### For Production
- ⚠️ Use MongoDB Atlas with authentication
- ⚠️ Enable HTTPS/SSL
- ⚠️ Set up IP whitelisting
- ⚠️ Use strong passwords
- ⚠️ Add rate limiting
- ⚠️ Enable audit logging

---

## Contributing & Extending

### Adding a New Feature
1. Create component in `/components/`
2. Import in `/app/audit/page.jsx` or `/app/landing/page.jsx`
3. Use existing patterns (Framer Motion, Tailwind, shadcn)
4. Test in development: `pnpm dev`

### Modifying the Theme
Edit `/app/globals.css`:
```css
:root {
  --primary: oklch(0.65 0.20 280);
  --accent: oklch(0.72 0.24 285);
  /* ... more colors ... */
}
```

### Changing MongoDB Fields
Update schema in `/app/api/audit/route.js`:
```javascript
// Add new field to query
const result = {
  message: record.message,
  dbIntent: record.nlpIntent,
  newIntent: record.llmIntent,
  // Add here:
  myNewField: record.myNewField
}
```

---

## Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# Set env vars in Vercel dashboard
# Done!
```

### Self-Hosted
```bash
# Build
pnpm build

# Start
pnpm start

# Use process manager (PM2)
pm2 start npm --name "audit-pro" -- start
```

---

## Support & Documentation

### Quick Help
- 🚀 **Getting started?** → [QUICKSTART.md](./QUICKSTART.md)
- 🛠️ **Installation issues?** → [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🎯 **How to use?** → [UI_GUIDE.md](./UI_GUIDE.md)
- 💾 **MongoDB help?** → [MONGODB_GUIDE.md](./MONGODB_GUIDE.md)

### Version Info
- **App Version**: 1.0
- **MongoDB Version**: 4.4+ (recommended)
- **Node Version**: 18+
- **Next.js Version**: 15+

---

## License & Credits

Built with ❤️ for NLP teams  
Using Next.js, React, Tailwind CSS, Framer Motion, and MongoDB

---

## What's Next?

1. ✅ Run your first audit
2. ✅ Export results to CSV
3. ✅ Review mismatches
4. ✅ Update intent descriptions
5. ✅ Track improvement over time
6. ✅ Share insights with your team

**Let's improve your intent detection system!** 🎯

---

**Last Updated**: April 2026  
**Status**: Production Ready  
**Questions?** Check the guides above or review code comments in `/app/`
