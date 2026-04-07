# Intent Audit System 🎯# Intent Audit System 🎯



A **powerful, production-grade intent classification audit platform** that analyzes conversation logs, compares LLM vs NLP intent classifications, and provides actionable insights for improving AI model accuracy.A **powerful, production-grade intent classification audit platform** that analyzes conversation logs, compares LLM vs NLP intent classifications, and provides actionable insights for improving AI model accuracy.



## 📋 Overview## � Overview



The Intent Audit System is a comprehensive solution for auditing and analyzing intent classification in AI conversations. It identifies mismatches between LLM (Large Language Model) and NLP (Natural Language Processing) classifications, recommends intent description updates, and tracks model quality metrics across time.The Intent Audit System is a comprehensive solution for auditing and analyzing intent classification in AI conversations. It identifies mismatches between LLM (Large Language Model) and NLP (Natural Language Processing) classifications, recommends intent description updates, and tracks model quality metrics across time.



### ✨ Key Features### ✨ Key Features



- **Large-Scale Data Processing** - Handles **10,000+ records** without crashes (JSONL streaming)- **Large-Scale Data Processing** - Handles **10,000+ records** without crashes (JSONL streaming format)

- **Intelligent Analysis** - Automatic intent classification with multi-level accuracy scoring- **Intelligent Analysis** - Automatic intent classification with multi-level accuracy scoring

- **Professional UI** - Dark theme with table/card views, real-time progress streaming- **Professional UI** - Dark theme with table/card views, real-time progress streaming

- **Google Sheets Integration** - Batch push recommendations to collaborative sheets- **Google Sheets Integration** - Batch push recommendations to collaborative sheets

- **Excel Export** - Download formatted audit summaries with color-coded results- **Excel Export** - Download formatted audit summaries with color-coded results

- **Real-time Streaming** - SSE-based progress updates during audit execution- **Real-time Streaming** - SSE-based progress updates during audit execution

- **Advanced Filtering** - Search, paginate, and filter results by status/intent- **Advanced Filtering** - Search, paginate, and filter results by status/intent

- **Accuracy Tracking** - Historical trend analysis across time buckets- **Accuracy Tracking** - Historical trend analysis across time buckets  



------



## 🏗️ Architecture## 🏗️ Architecture



### Tech Stack### Tech Stack



``````

Frontend:Frontend:

- Next.js 14+ (React 18)- Next.js 14+ (React 18)

- TailwindCSS + Radix UI components (50+ components)- TailwindCSS + Radix UI components (50+ components)

- Framer Motion (smooth animations)- Framer Motion (smooth animations)

- Lucide React (icons)- Lucide React (icons)



Backend:Backend:

- Next.js API Routes (Node.js runtime)- Next.js API Routes (Node.js runtime)

- MongoDB (primary data source)- MongoDB (primary data source)

- Server-Sent Events (SSE) for streaming- Server-Sent Events (SSE) for streaming

- Batch processing utilities- Batch processing utilities



Data Handling:Data Handling:

- JSONL format for large datasets (avoids JSON.stringify limits)- JSONL format for large datasets (avoids JSON.stringify limits)

- Efficient pagination with filtering- Efficient pagination with filtering

- In-memory analytics aggregation- In-memory analytics aggregation

``````



### Project Structure### Project Structure



``````

App_analytics_v2/App_analytics_v2/

├── app/├── app/

│   ├── api/audit/│   ├── api/audit/

│   │   ├── route.js              # Main audit processor (755 lines)│   │   ├── route.js              # Main audit processor (755 lines)

│   │   └── results/route.js      # Results pagination/filtering│   │   └── results/route.js      # Results pagination/filtering (137 lines)

│   ├── api/intents/│   ├── api/intents/

│   │   ├── route.js              # Load intent descriptions│   │   ├── route.js              # Load intent descriptions

│   │   └── update/route.js       # Batch Google Sheets updates│   │   └── update/route.js       # Batch Google Sheets updates

│   ├── audit/page.jsx            # Main dashboard (1282 lines)│   ├── audit/page.jsx            # Main dashboard (1282 lines)

│   ├── landing/page.jsx          # Landing page│   ├── landing/page.jsx          # Landing page

│   ├── globals.css               # Dark theme styles│   ├── globals.css               # Dark theme styles

│   └── layout.tsx                # Root layout│   └── layout.tsx                # Root layout

││

├── components/├── components/

│   ├── analytics-panel.jsx       # Stats visualization│   ├── analytics-panel.jsx       # Stats visualization

│   ├── mismatch-dialog.jsx       # Mismatch detail viewer│   ├── mismatch-dialog.jsx       # Mismatch detail viewer

│   ├── stats-card.jsx            # Metric cards│   ├── stats-card.jsx            # Metric cards

│   ├── theme-provider.tsx        # Theme config│   ├── theme-provider.tsx        # Theme config

│   └── ui/                       # 50+ Radix UI components│   └── ui/                       # 50+ Radix UI components

││

├── lib/├── lib/

│   ├── intent-analysis.js        # Intent classification (1419 lines)│   ├── intent-analysis.js        # Intent classification (1419 lines)

│   ├── large-data-handler.js     # JSONL utilities│   ├── large-data-handler.js     # JSONL utilities

│   └── utils.ts                  # Shared helpers│   └── utils.ts                  # Shared helpers

││

├── public/                       # Assets├── public/                       # Assets

├── styles/globals.css            # Global styles├── styles/globals.css            # Global styles

└── package.json└── package.json

``````



------



## 🚀 Getting Started## 🚀 Getting Started



### Prerequisites### Prerequisites



- **Node.js**: 18+ - **Node.js**: 18+ 

- **MongoDB**: Local or cloud instance- **MongoDB**: Local or cloud instance

- **npm/yarn**: Package manager- **npm/yarn**: Package manager



### Installation### Installation



1. **Clone the repository**1. **Clone the repository**

   ```bash   ```bash

   git clone https://github.com/TUSHARSINGHTHEPROGRAMMER/Intent_audit.git   git clone https://github.com/TUSHARSINGHTHEPROGRAMMER/Intent_audit.git

   cd Intent_audit   cd Intent_audit

   ```   ```



2. **Install dependencies**2. **Install dependencies**

   ```bash   ```bash

   npm install   npm install

   ```   # or

   pnpm install

3. **Configure environment variables**   ```

   ```bash

   cp .env.example .env.local3. **Configure environment variables**

   ```   ```bash

      cp .env.example .env.local

   **Required variables:**   ```

   ```env   

   # MongoDB   **Required variables:**

   MONGODB_URI=mongodb://localhost:27017   ```env

   MONGODB_DB_NAME=ori-vodafone-dev   # MongoDB

   MONGODB_COLLECTION=AiApiLogs   MONGODB_URI=mongodb://localhost:27017

   MONGODB_DB_NAME=ori-vodafone-dev

   # APIs   MONGODB_COLLECTION=AiApiLogs

   PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results

   NLP_API_TIMEOUT_MS=12000   # APIs

   PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results

   # Audit Configuration   NLP_API_TIMEOUT_MS=12000

   AUDIT_BATCH_SIZE=100

   AUDIT_API_CONCURRENCY=8   # Audit Configuration

   AUDIT_WINDOW_MINUTES=180   AUDIT_BATCH_SIZE=100

   ```   AUDIT_API_CONCURRENCY=8

   AUDIT_WINDOW_MINUTES=180

4. **Start MongoDB**   ```

   ```bash

   # macOS4. **Start MongoDB**

   brew services start mongodb-community   ```bash

      # macOS

   # Linux   brew services start mongodb-community

   sudo systemctl start mongod   

      # Linux

   # Docker   sudo systemctl start mongod

   docker run -d -p 27017:27017 mongo:latest   

   ```   # Docker

   docker run -d -p 27017:27017 mongo:latest

5. **Start development server**   ```

   ```bash

   npm run dev5. **Start development server**

   ```   ```bash

      npm run dev

   Open [http://localhost:3000](http://localhost:3000) in your browser.   ```

   

---   Open [http://localhost:3000](http://localhost:3000) in your browser.



## 📖 Usage Guide6. **Build for production**

   ```bash

### Running an Audit   npm run build

   npm start

1. **Navigate to Audit Dashboard** at `/audit`   ```

2. **Select Date Range** - Choose start and end dates

3. **Click "Run Audit"** - Starts real-time streaming---

4. **Monitor Progress** - Watch processing with live updates

5. **Review Results**:## Database Schema

   - View detailed table with 50 items per page

   - Filter by status (MATCH, LLM_HANDLED, INVALID, etc.)### `callLogs` Collection

   - Search by message, intent, or status```javascript

   - Switch between Table/Card views{

  _id: ObjectId,

### Status Types  message: String,              // User input text

  nlpIntent: String,           // NLP model prediction

| Status | Meaning | Action |  llmIntent: String,           // LLM model prediction  

|--------|---------|--------|  createdAt: Date,             // Timestamp of conversation

| **MATCH** | LLM and NLP both correct ✅ | No action needed |  source: String,              // "PRIMARY" or "SECONDARY"

| **LLM_HANDLED** | LLM correct, NLP wrong | Update NLP/descriptions |  metadata: {

| **GENERATIVE_HANDLED** | Generative AI handled well | Track success |    userId: String,

| **UPDATION** | Intent description needs update | Review & approve |    sessionId: String,

| **INVALID_MESSAGE** | Message/intent pair is bad | Investigate |    confidence: Number,

    model_version: String

### Key Features  }

}

- **Search**: Full-text search across messages, intents, status```

- **Filters**: Quick-filter by status with result counts

- **Pagination**: 25/50/100/200 items per page**Indexes** (for performance):

- **Export**: Download Excel with color-coded results```javascript

- **Sheet Sync**: Push recommendations to Google Sheetsdb.callLogs.createIndex({ createdAt: 1 })

db.callLogs.createIndex({ nlpIntent: 1 })

---db.callLogs.createIndex({ llmIntent: 1 })

db.callLogs.createIndex({ createdAt: 1, source: 1 })

## 🔧 Core Functionality```



### 1. Intent Classification (`lib/intent-analysis.js`)---



Multi-level intent matching:## Common Workflows



```javascript### Workflow 1: Finding Model Disagreements

classifyAuditResult(result, intentDescriptions)```

  ├─ Exact keyword match1. Open Audit Dashboard

  ├─ Semantic similarity (cosine distance > 0.7)2. Select date range (1-7 days recommended)

  ├─ Keyword overlap analysis3. Click "Run Audit"

  ├─ Language-specific normalization (English/Hindi)4. Wait for completion

  └─ Returns: MATCH | LLM_HANDLED | INVALID | UPDATION5. Click "Mismatches" filter

```6. Export as CSV

7. Analyze in spreadsheet

**Detection Keywords** (1419 lines of logic):```

- **Balance Lookup**: "balance", "usage", "remaining", "bacha" (Hindi)

- **Troubleshooting**: "issue", "problem", "fix", "nahi" (Hindi)### Workflow 2: Deep Diving into Specific Mismatches

- **Recharge**: "recharge", "topup", "pack", "plan"```

- **Payment**: "pay", "payment", "refund", "bill"1. Run audit (see Workflow 1)

- And 100+ more intent-specific keyword groups2. Click any "MISMATCH" row

3. Dialog shows:

### 2. Large Data Handling (JSONL Streaming)   - Original message

   - NLP prediction + description

**Problem Solved**: JSON.stringify crashes with 10,000+ records   - LLM prediction + description

   - Key insight

**Solution**: JSONL format (one JSON per line)4. Take notes for team discussion

5. Close and review next mismatch

```javascript```

writeResultsAsJSONL(results, auditId)

  └─ Writes two files:### Workflow 3: Tracking Improvement Over Time

     ├─ metadata.json (stats, analytics, accuracy history)```

     └─ results.jsonl (one result per line, no array)1. Run audit Monday (e.g., 50 mismatches)

2. Update intent descriptions

readResultsAsJSONL(auditId, filter, search)3. Run audit Friday (e.g., 30 mismatches)

  └─ Lazy loads with filtering (memory efficient)4. Export both as CSV

```5. Create comparison chart

6. Share improvement report

**Benefits**:```

- ✅ Unlimited record size (tested with 100k+)

- ✅ Memory efficient (50KB buffer)---

- ✅ Single disk write (no lag)

- ✅ Backward compatible with legacy JSON## API Endpoints



### 3. Audit Processing Pipeline (`/api/audit/route.js`)### `POST /api/audit`

Runs an audit with streaming results via Server-Sent Events

**Flow**:

```**Request**:

1. Validate date range```json

2. Build time windows (180-min chunks){

3. Fetch from MongoDB in batches  "startDate": "2024-04-01T00:00:00Z",

4. Process concurrently (8 parallel)  "endDate": "2024-04-05T23:59:59Z"

5. Classify each result}

6. Aggregate statistics```

7. Persist to JSONL

8. Stream SSE updates**Response Stream**:

9. Return final audit ID```

```data: {"type":"total","total":500}

data: {"type":"result","result":{...},"processed":1}

**Key Optimizations**:data: {"type":"result","result":{...},"processed":2}

- **Windowed Batching**: Splits 30-day audits into 180-minute windows...

- **Concurrent Processing**: 8 parallel API calls with backpressuredata: {"type":"complete","results":[...],"processed":500}

- **Auto-Throttling**: Reduces concurrency on timeout```

- **Progress Streaming**: SSE update every 25 records

- **Batch Delays**: 150ms between batches### `GET /api/intents`

Fetches intent descriptions from Google Sheets

### 4. Pagination & Filtering (`/api/audit/results/route.js`)

**Response**:

```javascript```json

GET /api/audit/results{

  ?auditId=XXX  "intents": {

  &filter=MATCH    "PAYMENT": {

  &search=payment      "old": "User wants to make payment",

  &page=1      "updated": "User wants to pay bills, recharge, or make transactions"

  &pageSize=50    }

  }

Returns:}

{```

  items: [{...}, {...}],

  total: 8920,---

  totalPages: 179,

  stats: {...},## Troubleshooting

  analytics: {...}

}### I see "Connection refused"

```→ MongoDB not running. See [MONGODB_GUIDE.md](./MONGODB_GUIDE.md#troubleshooting)



---### My audit is slow

→ Large date range. Try smaller range. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#performance-tips)

## 📊 Data Format

### API endpoint returns error

### Audit Result Object→ Check endpoint in `.env.local`. Test with: `curl http://your-api/health`



```javascript### No data appears

{→ Database might be empty. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#data-management)

  _id: ObjectId,

  message: "Check my account balance",### Results export is blank

  llmIntent: "BALANCE_CHECK",→ Use "Mismatches" filter first, then export

  nlpIntent: "ACCOUNT_QUERY",

  **Still stuck?** See comprehensive troubleshooting in [SETUP_GUIDE.md](./SETUP_GUIDE.md#common-errors--fixes)

  // Classification results

  status: "MATCH" | "LLM_HANDLED" | "INVALID_MESSAGE",---

  confidence: 0.95,

  similarityScore: 0.87,## Performance Optimization

  matchingKeywords: ["balance", "check"],

  ### Database

  // Source info- ✅ Indexes created on `createdAt`, `nlpIntent`, `llmIntent`

  source: "web" | "ios" | "android",- ✅ Compound index on `(createdAt, source)`

  sessionId: "sess_123",- ✅ Proper MongoDB 4.4 configuration

  timestamp: ISODate,

  ### Frontend

  // Recommendations- ✅ Next.js 15 with automatic code splitting

  recommendedIntent: "BALANCE_CHECK",- ✅ Framer Motion for smooth 60fps animations

  recommendation: "Updated description...",- ✅ SSE streaming prevents blocking UI

  apiErrorReason: null- ✅ Lazy loading components

}

```### API

- ✅ Batch processing (100 records at a time)

### Metadata Format- ✅ Streaming responses (no loading screens)

- ✅ Fallback to secondary endpoint

```javascript- ✅ Error handling & recovery

{

  stats: {---

    total: 10500,

    match: 8920,## Security Considerations

    llmHandled: 1200,

    generativeHandled: 150,### For Development

    updation: 180,- ✅ Local MongoDB with no authentication

    invalidMessage: 50,- ✅ Environment variables in `.env.local` (gitignored)

    accuracy: "86.86"- ✅ No sensitive data in logs

  },

  ### For Production

  analytics: {- ⚠️ Use MongoDB Atlas with authentication

    topMismatches: [- ⚠️ Enable HTTPS/SSL

      { llmIntent, nlpIntent, count, percentage }- ⚠️ Set up IP whitelisting

    ],- ⚠️ Use strong passwords

    topIntents: [...],- ⚠️ Add rate limiting

    bySource: { web: 5000, ios: 3500, android: 2000 }- ⚠️ Enable audit logging

  }

}---

```

## Contributing & Extending

---

### Adding a New Feature

## 🔌 API Endpoints1. Create component in `/components/`

2. Import in `/app/audit/page.jsx` or `/app/landing/page.jsx`

### POST /api/audit3. Use existing patterns (Framer Motion, Tailwind, shadcn)

Runs an audit with streaming results via Server-Sent Events4. Test in development: `pnpm dev`



**Request**:### Modifying the Theme

```jsonEdit `/app/globals.css`:

{```css

  "startDate": "2024-01-01T00:00:00Z",:root {

  "endDate": "2024-01-31T23:59:59Z"  --primary: oklch(0.65 0.20 280);

}  --accent: oklch(0.72 0.24 285);

```  /* ... more colors ... */

}

**Response**: SSE stream with progress updates```

```

data: {"type":"progress","processed":25,"total":1000}### Changing MongoDB Fields

data: {"type":"stats","stats":{...}}Update schema in `/app/api/audit/route.js`:

data: {"type":"complete","auditId":"123abc","stats":{...}}```javascript

```// Add new field to query

const result = {

### GET /api/audit/results  message: record.message,

Fetch paginated audit results  dbIntent: record.nlpIntent,

  newIntent: record.llmIntent,

**Query Parameters**:  // Add here:

- `auditId` (required) - Audit ID  myNewField: record.myNewField

- `page` - Page number (default: 1)}

- `pageSize` - Items per page (default: 50)```

- `filter` - Status filter (MATCH, LLM_HANDLED, etc.)

- `search` - Full-text search---



### GET /api/intents## Deployment

Load all intent descriptions

### Vercel (Recommended)

### POST /api/intents/update```bash

Batch update intents in Google Sheets# Push to GitHub

git push origin main

---

# Vercel auto-deploys on push

## ⚙️ Configuration# Set env vars in Vercel dashboard

# Done!

### Performance Tuning```



| Config | Default | Purpose |### Self-Hosted

|--------|---------|---------|```bash

| `AUDIT_BATCH_SIZE` | 100 | Records per API call |# Build

| `AUDIT_API_CONCURRENCY` | 8 | Parallel API calls |pnpm build

| `AUDIT_STAGGER_DELAY` | 3 | Delay between records |

| `AUDIT_BATCH_DELAY` | 150 | Delay between batches |# Start

| `AUDIT_WINDOW_MINUTES` | 180 | Time window per batch |pnpm start



### MongoDB Optimization# Use process manager (PM2)

pm2 start npm --name "audit-pro" -- start

```javascript```

// Recommended indexes

db.AiApiLogs.createIndex({ "timestamp": -1 })---

db.AiApiLogs.createIndex({ "sessionId": 1 })

db.AiApiLogs.createIndex({ "timestamp": -1, "source": 1 })## Support & Documentation

```

### Quick Help

---- 🚀 **Getting started?** → [QUICKSTART.md](./QUICKSTART.md)

- 🛠️ **Installation issues?** → [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 📈 Performance Metrics- 🎯 **How to use?** → [UI_GUIDE.md](./UI_GUIDE.md)

- 💾 **MongoDB help?** → [MONGODB_GUIDE.md](./MONGODB_GUIDE.md)

### Benchmark Results (10,000 record audit)

### Version Info

| Metric | Value |- **App Version**: 1.0

|--------|-------|- **MongoDB Version**: 4.4+ (recommended)

| Total Time | ~8-12 minutes |- **Node Version**: 18+

| Records/Second | 13-21 |- **Next.js Version**: 15+

| Memory Peak | ~150-200 MB |

| JSONL File Size | ~35-45 MB |---

| Disk Write Time | <2 seconds |

## License & Credits

### Scaling

Built with ❤️ for NLP teams  

- ✅ **100,000 records**: Fully supportedUsing Next.js, React, Tailwind CSS, Framer Motion, and MongoDB

- ✅ **1,000,000 records**: Supported with pagination

- ⚠️ **10M+ records**: Requires window splitting---



---## What's Next?



## 🐛 Troubleshooting1. ✅ Run your first audit

2. ✅ Export results to CSV

### "Invalid string length" Error3. ✅ Review mismatches

4. ✅ Update intent descriptions

**Problem**: Audit crashes with large datasets  5. ✅ Track improvement over time

**Solution**: Already fixed! Uses JSONL streaming instead of JSON.stringify6. ✅ Share insights with your team



### Table Not Displaying**Let's improve your intent detection system!** 🎯



**Problem**: Results show but table appears empty  ---

**Solution**:

- Check page size (default: 50)**Last Updated**: April 2026  

- Verify filter is set to "All"**Status**: Production Ready  

- Clear browser cache**Questions?** Check the guides above or review code comments in `/app/`

- Check browser console for errors

### MongoDB Connection Issues

```bash
# Test connection
mongosh "mongodb://localhost:27017"

# Verify environment variables
echo $MONGODB_URI
echo $MONGODB_DB_NAME
```

### Google Sheets Sync Fails

- Verify webhook URL is accessible
- Check Apps Script logs in Google
- Ensure proper sheet permissions
- Test with 'Export Audit Summary' first

---

## 🔐 Security

### Development
- ✅ Local MongoDB with no authentication
- ✅ Environment variables in `.env.local` (gitignored)
- ✅ No sensitive data in logs

### Production
- ⚠️ Use MongoDB Atlas with authentication
- ⚠️ Enable HTTPS/SSL
- ⚠️ Set up IP whitelisting
- ⚠️ Use strong passwords
- ⚠️ Add rate limiting
- ⚠️ Enable audit logging

---

## 📝 Development

### Building for Production

```bash
npm run build
npm start
```

### Code Guidelines

- **API Routes**: Keep in `app/api/`
- **Components**: Reusable in `components/`
- **Utilities**: Shared logic in `lib/`
- **Styling**: Use Tailwind classes

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👤 Author

**TUSHAR SINGH** - The Programmer

- GitHub: [@TUSHARSINGHTHEPROGRAMMER](https://github.com/TUSHARSINGHTHEPROGRAMMER)
- Repository: [Intent_audit](https://github.com/TUSHARSINGHTHEPROGRAMMER/Intent_audit)

---

## 🆘 Support

For issues or questions:
1. Check MongoDB connection
2. Review environment variables
3. Verify API endpoints are accessible
4. Check browser console for errors
5. Open a GitHub issue with details

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Auditing! 🚀**
