# Intent Audit Pro - Quick Reference Card

Print this or bookmark it! 📋

---

## Development Commands

```bash
# Install dependencies (run once)
pnpm install

# Start development server
pnpm dev
# Opens: http://localhost:3000

# Build for production
pnpm build

# Run production build
pnpm start

# Format code
pnpm format

# Type check (if TypeScript files exist)
pnpm type-check
```

---

## MongoDB Commands

```bash
# Start MongoDB (macOS)
brew services start mongodb-community@4.4

# Stop MongoDB (macOS)
brew services stop mongodb-community@4.4

# Connect to MongoDB shell
mongosh

# Within mongosh:
> use oriserveailogsmaster           # Switch database
> show collections                  # List collections
> db.callLogs.find()               # Show all records
> db.callLogs.countDocuments()     # Count records
> db.stats()                       # Database size
> db.callLogs.deleteMany({})       # Delete all records
> db.createIndex({createdAt: 1})   # Add index
> exit()                           # Quit mongosh
```

---

## Environment Setup

```bash
# Create .env.local with all required vars
cat > .env.local << EOF
MONGODB_URI=mongodb://localhost:27017/oriserveailogsmaster
PRIMARY_API_URL=http://ai.vodafone-elb.oriserve.in:5000/results
SECONDARY_API_URL=http://backup-api.example.com:5000/results
EOF

# Verify it exists
cat .env.local

# NEVER commit this file!
# It's already in .gitignore
```

---

## Git Workflow

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main

# View logs
git log --oneline

# Undo last commit
git reset HEAD~1
```

---

## File Locations

| File | Purpose |
|------|---------|
| `/app/page.tsx` | Home page redirect |
| `/app/landing/page.jsx` | Landing page |
| `/app/audit/page.jsx` | Main dashboard |
| `/app/api/audit/route.js` | Audit SSE API |
| `/app/api/intents/route.js` | Google Sheets API |
| `/app/globals.css` | Dark theme colors |
| `/components/` | Reusable components |
| `.env.local` | Environment variables |
| `SETUP_GUIDE.md` | Full setup guide |
| `QUICKSTART.md` | Quick setup |
| `UI_GUIDE.md` | How to use UI |
| `MONGODB_GUIDE.md` | Database setup |

---

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED 127.0.0.1:27017` | `brew services start mongodb-community@4.4` |
| `MONGODB_URI not set` | Add to `.env.local` |
| `Cannot GET /` | Run `pnpm dev` and visit http://localhost:3000 |
| `API endpoint error` | Check `.env.local` - verify URL is correct |
| `Audit is slow` | Use smaller date range (1-7 days) |
| `No records found` | Insert test data into MongoDB |
| `Export is blank` | Filter to "Mismatches" before exporting |
| `Page refresh clears history` | History is session-only (by design) |

---

## UI Navigation

```
http://localhost:3000/
    ↓
/landing (Landing Page)
    ↓
    [Click "Launch Audit Tool"]
    ↓
/audit (Audit Dashboard)
    ├─ [Select dates]
    ├─ [Click "Run Audit"]
    ├─ [Watch progress]
    ├─ [Click result row for analysis]
    └─ [Export CSV]

[Back button] returns to /landing
[History button] shows session audits
```

---

## Data Flow

```
User Input (Dates)
    ↓
/api/audit (Backend)
    ↓
MongoDB (fetch callLogs)
    ↓
Call PRIMARY_API_URL
    ↓
Stream results (SSE)
    ↓
Display in UI
    ↓
Filter & Export (CSV)
```

---

## Environment Variables Quick Reference

```env
# REQUIRED
MONGODB_URI=mongodb://...         # Database connection
PRIMARY_API_URL=http://...        # Main API endpoint

# OPTIONAL
SECONDARY_API_URL=http://...      # Fallback endpoint
GOOGLE_SHEETS_ID=...              # For intent descriptions
```

---

## Testing

### Manual Testing Checklist
- [ ] Can access http://localhost:3000
- [ ] Landing page loads with animations
- [ ] Can navigate to audit dashboard
- [ ] Can select dates
- [ ] Audit completes successfully
- [ ] Progress bar shows updates
- [ ] Results display in table & card views
- [ ] Can click mismatch for details
- [ ] Can filter to mismatches only
- [ ] Can export CSV file
- [ ] History shows audit entry
- [ ] Dark theme looks good

---

## Performance Tips

```bash
# 1. Reduce date range
# Try 1 day instead of 30 days

# 2. Add MongoDB indexes
mongosh
> use oriserveailogsmaster
> db.callLogs.createIndex({createdAt: 1})

# 3. Increase Node memory
NODE_OPTIONS='--max-old-space-size=2048' pnpm dev

# 4. Monitor progress
# Open browser DevTools → Network tab
# Watch SSE stream coming in
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close dialog |
| `Ctrl+Shift+K` / `Cmd+Shift+K` | Open search (Next.js) |
| `F12` | Open DevTools |
| `Ctrl+L` / `Cmd+L` | Focus address bar |

---

## Project Structure at a Glance

```
next.js app
├─ Landing: /landing
├─ Dashboard: /audit
├─ API
│  ├─ /api/audit (streaming)
│  └─ /api/intents (Google Sheets)
├─ Components
│  ├─ MismatchDialog
│  ├─ StatsCard
│  └─ AnalyticsPanel
├─ Database
│  └─ MongoDB (callLogs)
├─ Styling
│  └─ Dark theme (globals.css)
└─ Docs
   ├─ README.md
   ├─ QUICKSTART.md
   ├─ SETUP_GUIDE.md
   ├─ UI_GUIDE.md
   └─ MONGODB_GUIDE.md
```

---

## MongoDB Connection Strings

```
# Local development
mongodb://localhost:27017/oriserveailogsmaster

# MongoDB Atlas (cloud)
mongodb+srv://user:password@cluster.mongodb.net/oriserveailogsmaster

# Docker
mongodb://host.docker.internal:27017/oriserveailogsmaster

# Remote server
mongodb://user:password@ip:27017/oriserveailogsmaster
```

---

## Need Full Details?

| Guide | Topics |
|-------|--------|
| **README.md** | Overview, architecture, deployment |
| **QUICKSTART.md** | 5-minute setup |
| **SETUP_GUIDE.md** | Full setup, errors, MongoDB options |
| **UI_GUIDE.md** | How to use every feature |
| **MONGODB_GUIDE.md** | Database setup, queries, backup |

---

## Version Requirements

| Tool | Min Version | Recommended |
|------|-------------|-------------|
| Node.js | 18.x | 20.x LTS |
| MongoDB | 4.0 | 4.4 LTS |
| pnpm | 8.x | Latest |
| npm | 9.x | 10.x |

---

## URLs & Resources

```
Local Development:    http://localhost:3000
MongoDB Docs:         https://docs.mongodb.com/
Next.js Docs:         https://nextjs.org/docs
MongoDB Atlas:        https://www.mongodb.com/cloud/atlas
```

---

**Bookmark this file!** 📌  
Print it out, share with your team, and keep it handy while developing.

**Happy auditing!** 🚀
