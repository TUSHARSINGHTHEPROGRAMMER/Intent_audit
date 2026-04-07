# 📖 Complete Documentation Index

Welcome to Intent Audit Pro! Here's everything you need to know, organized by what you need to do right now.

---

## 🚀 I Want to Get Started NOW (5 minutes)

**Start with:** [`QUICKSTART.md`](./QUICKSTART.md)
- Install dependencies
- Create `.env.local`
- Start MongoDB
- Run dev server
- Access the application

👉 **Then open:** http://localhost:3000

---

## 🎨 I Want to See What I Built

**Read:** [`VISUAL_SUMMARY.txt`](./VISUAL_SUMMARY.txt)
- Beautiful ASCII overview
- Feature list
- Quick commands
- Dark theme details

**Or:** [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)
- Complete built features
- Architecture overview
- Performance metrics
- Next steps

---

## 📚 I Want a Complete Setup Guide

**Read:** [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) (375 lines!)
- Prerequisites & installation
- Step-by-step setup
- MongoDB 4.4 configuration
- All environment variables
- Data management
- Comprehensive troubleshooting
- Performance optimization

**Topics covered:**
- Local MongoDB setup
- MongoDB Atlas (cloud)
- Database schema
- Sample data insertion
- Backup & restore
- Security considerations

---

## 🎯 I Want to Learn How to Use It

**Read:** [`UI_GUIDE.md`](./UI_GUIDE.md) (261 lines!)
- Landing page walkthrough
- Audit dashboard features
- Running your first audit
- Understanding results
- Mismatch analysis dialog
- Filtering & exporting data
- Session history
- Tips & tricks

**Then:**
1. Click "Launch Audit Tool"
2. Select a date range
3. Click "Run Audit"
4. Watch real-time progress
5. Explore the results

---

## 💾 I Need MongoDB Help

**Read:** [`MONGODB_GUIDE.md`](./MONGODB_GUIDE.md) (440 lines!)
- MongoDB 4.4 version info
- Installation for every OS
- Local vs cloud (Atlas) options
- Docker setup
- Database & collection creation
- Sample data insertion
- Querying examples
- Indexes & performance
- Backup & restore
- Troubleshooting

**Quick version check:**
```bash
mongosh
> db.version()
```

---

## 🔍 I'm Debugging or Stuck

**Check:** [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) - "Common Errors & Fixes" section
- Covers 7 common errors with solutions

**Or:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Common Issues & Quick Fixes" table

**Common issues:**
```
Connection refused       → Start MongoDB
MONGODB_URI not set     → Add to .env.local
API endpoint error      → Verify URL is correct
Audit is slow          → Use smaller date range
No records found       → Insert test data
```

---

## ⚡ I Want Quick Commands

**Read:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)
- Development commands
- MongoDB commands
- Environment setup
- Git workflow
- File locations
- Common issues table
- UI navigation
- Data flow diagram

**Print this page!** 📋

---

## 🏗️ I Want to Understand the Architecture

**Read:** [`README.md`](./README.md) - "System Architecture" section
- Frontend (Next.js + React)
- Backend (Node.js API)
- Database (MongoDB)
- Data flow diagram
- Tech stack details
- Performance optimization

---

## 🎓 I Want to Learn Everything

**Read in this order:**

1. [`VISUAL_SUMMARY.txt`](./VISUAL_SUMMARY.txt) (2 min) - Get hyped!
2. [`QUICKSTART.md`](./QUICKSTART.md) (5 min) - Get running
3. [`README.md`](./README.md) (10 min) - Understand what you have
4. [`UI_GUIDE.md`](./UI_GUIDE.md) (15 min) - Learn the interface
5. [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) (30 min) - Deep dive into setup
6. [`MONGODB_GUIDE.md`](./MONGODB_GUIDE.md) (30 min) - Master the database

**Total time:** ~90 minutes to fully understand everything!

---

## 📋 Documentation Files Overview

| File | Lines | Purpose | Read When |
|------|-------|---------|-----------|
| **QUICKSTART.md** | 80 | 5-min setup | Starting |
| **README.md** | 436 | Project overview | Learning |
| **SETUP_GUIDE.md** | 375 | Full setup + troubleshooting | Setting up or stuck |
| **UI_GUIDE.md** | 261 | How to use every feature | Learning the interface |
| **MONGODB_GUIDE.md** | 440 | Database setup & queries | Database issues |
| **QUICK_REFERENCE.md** | 323 | Commands & quick fixes | Quick lookup |
| **PROJECT_SUMMARY.md** | 373 | What was built | Reviewing completed work |
| **VISUAL_SUMMARY.txt** | 210 | ASCII overview | Getting excited! |
| **This file** | Current | Documentation index | Finding what you need |

**Total:** 2,500+ lines of documentation!

---

## 🎯 Find Documentation by Task

### I want to...

**...get it running immediately**
→ [`QUICKSTART.md`](./QUICKSTART.md)

**...understand what was built**
→ [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)

**...use the system**
→ [`UI_GUIDE.md`](./UI_GUIDE.md)

**...set up MongoDB**
→ [`MONGODB_GUIDE.md`](./MONGODB_GUIDE.md)

**...install and configure everything**
→ [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)

**...find a quick command or fix**
→ [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

**...see the full project**
→ [`README.md`](./README.md)

**...see an overview**
→ [`VISUAL_SUMMARY.txt`](./VISUAL_SUMMARY.txt)

---

## ✅ Pre-Launch Checklist

Before running your first audit:

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] MongoDB 4.4+ installed or Atlas account
- [ ] `.env.local` created with all variables
- [ ] MongoDB is running
- [ ] Development server started (`pnpm dev`)
- [ ] Browser opened to http://localhost:3000
- [ ] Can see landing page

**Done?** Click "Launch Audit Tool" and run your first audit! 🚀

---

## 🆘 Need Help?

**Question Type → Where to Look:**

| Question | File |
|----------|------|
| How do I start? | QUICKSTART.md |
| How do I use it? | UI_GUIDE.md |
| MongoDB won't start | MONGODB_GUIDE.md |
| I'm getting an error | SETUP_GUIDE.md |
| What's the quick command? | QUICK_REFERENCE.md |
| How does it work? | README.md |
| What was built? | PROJECT_SUMMARY.md |

---

## 🚀 Your Next Steps

1. **Right now:** Open [`QUICKSTART.md`](./QUICKSTART.md)
2. **Follow steps:** Get MongoDB running
3. **Start server:** `pnpm dev`
4. **Open browser:** http://localhost:3000
5. **Click button:** "Launch Audit Tool"
6. **Select dates:** Pick 1-7 day range
7. **Run audit:** Click "Run Audit"
8. **Explore results:** Review matches/mismatches
9. **Export data:** Download CSV
10. **Share findings:** Show your team!

---

## 📞 Quick Reference

**Commands:**
```bash
pnpm install                    # Install deps
pnpm dev                        # Start dev server
pnpm build                      # Build for production
brew services start mongodb-community@4.4    # Start MongoDB
mongosh                         # Open MongoDB shell
```

**URLs:**
- Local app: http://localhost:3000
- Landing: http://localhost:3000/landing
- Dashboard: http://localhost:3000/audit

**MongoDB:**
- Local: mongodb://localhost:27017/oriserveailogsmaster
- Atlas: mongodb+srv://user:password@cluster.mongodb.net/database

---

## 🎉 Let's Get Started!

**You're reading this, which means you're ready!**

👉 **Next action:** Open [`QUICKSTART.md`](./QUICKSTART.md) and follow the 3 simple steps.

**Time to get running:** 5 minutes ⏱️

---

## 📚 Document Relationships

```
VISUAL_SUMMARY.txt (Start here for overview)
        ↓
QUICKSTART.md (Get running in 5 min)
        ↓
README.md (Understand the project)
        ├─→ UI_GUIDE.md (Learn to use it)
        ├─→ SETUP_GUIDE.md (Full setup details)
        ├─→ MONGODB_GUIDE.md (Database help)
        └─→ QUICK_REFERENCE.md (Quick lookup)
        ↓
PROJECT_SUMMARY.md (Recap what was built)
```

---

## 💡 Tips

- **Bookmark QUICK_REFERENCE.md** - You'll use it frequently
- **Print VISUAL_SUMMARY.txt** - Share with team
- **Read UI_GUIDE.md first** - Most valuable for daily use
- **Save MONGODB_GUIDE.md** - Essential for database issues
- **Share README.md** - Great for onboarding

---

**Welcome to Intent Audit Pro!** 🚀

Start with [`QUICKSTART.md`](./QUICKSTART.md) and you'll be auditing intents in 5 minutes!

---

**Last Updated:** April 2026  
**Total Documentation:** 2,500+ lines  
**Status:** Production Ready ✅


function doGet() {
  try {
    const SHEET_ID = "1V9WSRxt9I6XWmOIjbA8kwJQJkO6ct5temjSNu9sLsZc"
    const SHEET_NAME = "Sheet1"

    // ✅ THIS LINE WAS MISSING
    const sheet = SpreadsheetApp
      .openById(SHEET_ID)
      .getSheetByName(SHEET_NAME)

    const data = sheet.getDataRange().getValues()

    const headers = data[0]

    const intentCol = headers.indexOf("Intent Name")
    const descCol = headers.indexOf("Description")
    const updatedCol = headers.indexOf("Updated Description")
    const v2Col = headers.indexOf("Updated Description v2")
    const v3Col = headers.indexOf("Updated Description v3")

    const intents = {}

    for (let i = 1; i < data.length; i++) {
      const intentName = data[i][intentCol]

      if (intentName) {
        intents[intentName] = {
          old: data[i][descCol] || "",
          updated: data[i][updatedCol] || "",
          v2: data[i][v2Col] || "",
          v3: v3Col !== -1 ? data[i][v3Col] || "" : "",
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ intents }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}