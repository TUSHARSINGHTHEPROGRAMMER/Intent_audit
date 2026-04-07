# Intent Audit Pro - Complete Setup & Usage Guide

## Overview
Intent Audit Pro is a real-time NLP/LLM comparison system that audits your intent detection models, identifies mismatches, and suggests improvements. Built with Next.js, Framer Motion, and SSE streaming for live progress updates.

---

## Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB 4.0+ (we're using v4.x for compatibility)
- pnpm package manager
- Google Chrome/Firefox (for the web UI)

---

## Installation & Setup

### Step 1: Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### Step 2: Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# MongoDB Connection (Required)
MONGODB_URI=mongodb://username:password@localhost:27017/oriserveailogsmaster

# API Endpoints (Required)
PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results
SECONDARY_API_URL=http://backup-api.example.com:5000/results  # Optional fallback


# Google Sheets (Optional - for intent descriptions)
GOOGLE_SHEETS_ID=1V9WSRxt9I6XWmOIjbA8kwJQJkO6ct5temjSNu9sLsZc
```

### Step 3: MongoDB Setup (Important!)

#### Option A: Local MongoDB (Development)
```bash
# Install MongoDB Community Edition
# macOS
brew tap mongodb/brew
brew install mongodb-community@4.4

# Start MongoDB
brew services start mongodb-community@4.4

# Verify it's running
mongosh
> show dbs
```

#### Option B: Remote MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (M0 free tier is fine)
3. Add your IP to Network Access
4. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/database`

---

## Running the Application

### Development Mode
```bash
pnpm dev
```
Opens at `http://localhost:3000`

### Production Build
```bash
pnpm build
pnpm start
```

---

## How to Use the System

### 1. Landing Page (`/landing`)
- Overview of features
- Links to audit dashboard
- Information about how it works

### 2. Audit Dashboard (`/audit`)

#### Running an Audit:
1. Click "Run Audit" button
2. Select **Start Date & Time**: When to begin analyzing logs
3. Select **End Date & Time**: When to stop analyzing logs
4. Click **"Run Audit"** button
5. Watch real-time progress as records are processed
6. Results appear as they stream in

#### Understanding Results:
- **Table View**: Shows all records with NLP vs LLM intent comparison
- **Card View**: Compact card layout for mobile browsing
- **Match**: Both models detected the same intent
- **Mismatch**: Models disagreed on intent detection

#### Analyzing Mismatches:
1. Click any row with "MISMATCH" status
2. Dialog opens showing:
   - User's original message
   - NLP result + description
   - LLM result + description
   - Key insight about which model was more accurate

#### Exporting Data:
- Click **"Export CSV"** to download results
- Filter to "Mismatches" first if you only want mismatches
- Use in Excel/Google Sheets for analysis

#### Session History:
- Click **"History"** button (top right)
- See all audits run in this session
- Persists while tab is open (clears on page refresh)

---

## Common Errors & Fixes

### Error 1: "MONGODB_URI is not set"
**Cause**: Environment variable not configured
**Fix**:
```bash
# Check your .env.local file exists
cat .env.local

# Verify MongoDB is running (local)
mongosh

# Test connection string
mongosh "mongodb://localhost:27017/oriserveailogsmaster"
```

### Error 2: "Connection refused - MongoDB"
**Cause**: MongoDB service not running
**Fix**:
```bash
# macOS
brew services start mongodb-community@4.4

# Linux (systemd)
sudo systemctl start mongod

# Verify
mongosh
```

### Error 3: "PRIMARY_API_URL is not configured"
**Cause**: Missing API endpoint configuration
**Fix**:
```bash
# Add to .env.local
PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results

# Verify endpoint is reachable
curl http://ai.vodafone-elb.oriserve.in:5000/health
```

### Error 4: "Cannot read property 'getReader' of undefined"
**Cause**: API endpoint returned no response body
**Fix**:
```bash
# Check if API is running
curl -X POST http://your-api:5000/results \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2024-01-01","endDate":"2024-01-31"}'

# If 404 or 500, API needs to be restarted
```

### Error 5: "No records found for date range"
**Cause**: Database has no data in selected date range
**Fix**:
```bash
# Check MongoDB for available data
mongosh
> use oriserveailogsmaster
> db.callLogs.find({}).limit(5)
> db.callLogs.find({createdAt: {$gte: ISODate("2024-01-01")}}).count()

# If empty, populate with test data
# See "Data Management" section below
```

### Error 6: "Streaming failed - SSE timeout"
**Cause**: Large dataset taking too long
**Fix**:
- Break into smaller date ranges
- Increase Node.js heap: `NODE_OPTIONS='--max-old-space-size=2048' pnpm dev`

### Error 7: "CORS error when fetching from API"
**Cause**: API doesn't allow cross-origin requests
**Fix**: 
- Use backend proxy (API route acts as middleware)
- Or configure CORS on the API server

---

## Data Management

### Adding Test Data to MongoDB
```bash
mongosh

> use oriserveailogsmaster
> db.callLogs.insertMany([
  {
    message: "I want to pay my bill",
    nlpIntent: "PAYMENT",
    llmIntent: "PAYMENT",
    createdAt: new Date(),
    source: "PRIMARY"
  },
  {
    message: "Help with my connection",
    nlpIntent: "SUPPORT",
    llmIntent: "NETWORK_ISSUE",
    createdAt: new Date(),
    source: "PRIMARY"
  }
])

> db.callLogs.countDocuments()  # Verify data exists
```

### Viewing Audit Results
```bash
# MongoDB stores no results - results are in-memory during session
# Results clear when browser tab refreshes
# To save results: Use "Export CSV" button
```

---

## Performance Tips

### 1. Optimize Date Range
- Smaller ranges = faster audits
- Default to 1-7 days per audit
- Aggregate multiple audits for monthly analysis

### 2. Index MongoDB Collection
```bash
mongosh
> use oriserveailogsmaster
> db.callLogs.createIndex({createdAt: 1})
> db.callLogs.createIndex({nlpIntent: 1})
> db.callLogs.getIndexes()
```

### 3. Increase Batch Size
In `/app/api/audit/route.js`, adjust:
```js
const BATCH_SIZE = 100  // Increase for faster processing
```

### 4. Enable Compression
Already enabled in Next.js by default.

---

## Troubleshooting Advanced Issues

### Check Logs
```bash
# View all API requests
curl -v http://localhost:3000/api/audit

# Monitor MongoDB
mongosh
> db.currentOp()

# Check system resources
top  # CPU/Memory usage
```

### Restart Everything
```bash
# Stop Node.js
Ctrl + C

# Stop MongoDB
brew services stop mongodb-community@4.4

# Clear cache
rm -rf .next

# Restart
pnpm dev
```

### Memory Issues
```bash
# Increase Node.js memory
NODE_OPTIONS='--max-old-space-size=4096' pnpm dev

# Check available RAM
free -h  # Linux
vm_stat  # macOS
```

---

## MongoDB Version Info

**Recommended**: MongoDB 4.4 LTS (Long Term Support)
- Stable and widely used
- Good performance
- Backward compatible

**Compatible Versions**:
- MongoDB 4.0+
- MongoDB 4.2
- MongoDB 4.4 (recommended)
- MongoDB 5.0+ (modern but requires Node driver v4+)

**Check Your Version**:
```bash
mongosh
> db.version()
```

---

## Database Schema

### `callLogs` Collection
```javascript
{
  _id: ObjectId,
  message: String,           // User input
  nlpIntent: String,         // NLP model result
  llmIntent: String,         // LLM model result
  createdAt: Date,          // Timestamp
  source: String,           // "PRIMARY" or "SECONDARY"
  metadata: {
    userId: String,
    sessionId: String,
    confidence: Number
  }
}
```

---

## Next Steps

1. **Set up MongoDB**: Choose local or Atlas
2. **Configure .env.local**: Add all required variables
3. **Run development server**: `pnpm dev`
4. **Test an audit**: Use 1-day date range first
5. **Export results**: Download CSV to verify data
6. **Deploy**: Use Vercel deployment or self-host

---

## Support & Resources

- **API Documentation**: See `/app/api/audit/route.js`
- **Component Overview**: See `/components/` folder
- **Styling**: Dark theme in `/app/globals.css`
- **MongoDB Docs**: https://docs.mongodb.com/
- **Next.js Docs**: https://nextjs.org/docs

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Maintainer**: Your Team
