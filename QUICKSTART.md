# Intent Audit Pro - Quick Start (5 Minutes)

## TL;DR - Just Want to Run It?

### Prerequisites
- Node.js 18+
- MongoDB 4.4 (local or Atlas)
- pnpm (`npm install -g pnpm`)

### 1-2-3 Setup
```bash
# Clone/navigate to project
cd /vercel/share/v0-project

# Install dependencies
pnpm install

# Create .env.local
cat > .env.local << EOF
MONGODB_URI=mongodb://localhost:27017/oriserveailogsmaster
PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results
SECONDARY_API_URL=http://backup-api.example.com:5000/results
EOF

# Start MongoDB (if local)
brew services start mongodb-community@4.4  # macOS
# OR: sudo systemctl start mongod  # Linux

# Run the app
pnpm dev
```

Open **http://localhost:3000** in your browser!

---

## What You'll See

1. **Landing Page** - Overview of the audit system
2. **Audit Dashboard** - Where you run audits
3. **Results** - Real-time comparison of NLP vs LLM models

---

## First Audit (2 minutes)

1. Click **"Launch Audit Tool"** 
2. Select a date range (try last 7 days)
3. Click **"Run Audit"**
4. Watch the real-time progress bar
5. Review results - Green = Match, Red = Mismatch
6. Click any result to see detailed analysis
7. Click **"Export CSV"** to download results

---

## Common Setup Issues

| Error | Quick Fix |
|-------|-----------|
| `MONGODB_URI not set` | Add to `.env.local` |
| `Connection refused` | Start MongoDB: `brew services start mongodb-community@4.4` |
| `API endpoint error` | Verify endpoint is running: `curl http://your-api:5000/health` |
| `No records found` | Populate MongoDB with test data (see SETUP_GUIDE.md) |

---

## Detailed Setup?
See **SETUP_GUIDE.md** for:
- Complete installation guide
- MongoDB setup options
- All environment variables
- Troubleshooting all errors
- Performance optimization
- Database schema details

---

**You're all set! Happy auditing!** 🚀
