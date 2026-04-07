# How to Use Intent Audit Pro - UI Guide

## Navigation

### Landing Page (`/landing`)
The first page you see with:
- Feature overview with animated cards
- "How It Works" 3-step process
- Big "Launch Audit Tool" button to get started

**What to do**: Click the button to go to the audit dashboard

---

## Audit Dashboard (`/audit`)

### Top Bar (Header)
- **Back Button** (⬅️) - Returns to landing page
- **Dashboard Title** - Shows "Intent Audit Dashboard"
- **History Button** - Shows all audits you've run in this session

### Main Content Area

#### 1. Configure Your Audit (Purple Card)
```
┌─────────────────────────────────────────┐
│ ⚡ Configure Your Audit                │
│                                         │
│ Start Date & Time:  [2024-04-01 10:00] │
│ End Date & Time:    [2024-04-05 18:00] │
│ [Run Audit]                             │
└─────────────────────────────────────────┘
```

**How to use**:
1. Click the first date field
2. Select start date and time
3. Click the second date field
4. Select end date and time
5. Click **"Run Audit"** button
6. Watch the progress bar appear

#### 2. Real-Time Progress (During Audit)
```
┌─────────────────────────────────────────┐
│ Processing records in real-time...      │
│ 156 / 500                               │
│ ████████░░░░░░░░░░░░░░░░  [31%]       │
│ This will take a few moments. Grab coffee!
└─────────────────────────────────────────┘
```

**What it shows**:
- `156 / 500` = 156 records processed out of 500 total
- Progress bar fills as audit progresses
- Text message for encouragement

#### 3. Statistics Cards (After Audit)
```
┌─────────────┬──────────┬──────────┬──────────┐
│ Total       │ Matches  │ Matches  │ Accuracy │
│ Records     │ (Green)  │ (Red)    │ (Purple) │
│ 500         │ 450      │ 50       │ 90%      │
└─────────────┴──────────┴──────────┴──────────┘
```

**What each means**:
- **Total Records**: All records in date range
- **Matches**: Both NLP and LLM agreed ✓
- **Mismatches**: Models disagreed ✗
- **Accuracy**: Match % = (Matches / Total) × 100

#### 4. Analytics Panel
Shows insights like:
- Top mismatched intents
- Model comparison stats
- Detailed breakdown by intent type

Click on any section to expand details.

#### 5. Detailed Results Table/Cards

**Table View** (Best for full screen):
```
┌──────────────┬──────────┬──────────┬─────────┬────────┐
│ Message      │ NLP      │ LLM      │ Status  │ Source │
├──────────────┼──────────┼──────────┼─────────┼────────┤
│ "Need help"  │ SUPPORT  │ SUPPORT  │ MATCH   │PRIMARY │
│ "Pay bill"   │ PAYMENT  │ BILLING  │MISMATCH │PRIMARY │
└──────────────┴──────────┴──────────┴─────────┴────────┘
```

**Card View** (Best for mobile):
```
┌────────────────────────────┐
│ Need help                  │
│ [SUPPORT] [SUPPORT]        │
│ MATCH        PRIMARY        │
└────────────────────────────┘
```

**Interactive Features**:
- Click any row/card to see **detailed mismatch analysis** in a dialog
- Filter buttons at top:
  - **All (500)** - Show all records
  - **Mismatches (50)** - Show only mismatches
  - **Export CSV** - Download results

---

## Mismatch Analysis Dialog

When you click a mismatched result:

```
┌─────────────────────────────────────────┐
│ Intent Mismatch Analysis                │
│                                         │
│ User Message                            │
│ ┌────────────────────────────────────┐  │
│ │ "I need help with my connection"   │  │
│ └────────────────────────────────────┘  │
│                                         │
│ NLP Result      │  LLM Result          │
│ [SUPPORT]       │  [NETWORK_ISSUE]     │
│ Old description │  Updated description │
│                                         │
│ Key Insight                             │
│ This aligns more with NETWORK_ISSUE    │
└─────────────────────────────────────────┘
```

**What to do**:
1. Read the original message
2. Compare NLP vs LLM predictions
3. Read both descriptions
4. Check the "Key Insight" box
5. Use this to understand why models disagreed
6. Click outside or press ESC to close

---

## Filters & Export

### Filter Results
```
[All (500)] [Mismatches (50)] [Export CSV]
```

- **All** - Show every record
- **Mismatches** - Show only records where models disagree
- **Export CSV** - Download current view as Excel-compatible file

**Pro Tip**: Filter to "Mismatches" before exporting if you only want to analyze failures

### Export Data
1. Click **"Export CSV"** button
2. File `audit_mismatch_1712358934.csv` downloads
3. Open in Excel/Google Sheets
4. Analyze with pivot tables, charts, etc.

**CSV Columns**:
```
Message, NLP Intent, LLM Intent, Status, Source
```

---

## Session History

### Accessing History
1. Click **"History (3)"** button in top right
2. Sidebar slides in showing all audits

### What You See
```
┌────────────────────────────┐
│ Audit History              │
├────────────────────────────┤
│ 2024-04-05 14:30:22        │
│ 500 records analyzed       │
│ ✓ 450 matches  ✗ 50 mismatch
│                            │
│ 2024-04-05 12:15:18        │
│ 250 records analyzed       │
│ ✓ 230 matches  ✗ 20 mismatch
└────────────────────────────┘
```

**Session History Features**:
- Shows all audits from current browser session
- Clears when you refresh the page
- In-memory storage (persists while tab is open)
- Click entries to view old results (coming soon)

---

## Dark Theme UI Elements

### Colors Explained
- **Dark Background** - Easy on eyes, professional look
- **Purple Accent** - Primary action buttons
- **Blue/Cyan** - NLP model results
- **Magenta/Pink** - LLM model results  
- **Green** - Successful matches
- **Red** - Mismatches/failures
- **Glowing Shadows** - Interactive hover effects

### Animations
- Cards fade in when data loads
- Progress bar smoothly animates
- Buttons glow on hover
- Background has subtle animated blobs

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close any open dialog/modal |
| `Ctrl+E` / `Cmd+E` | Export results (if any) |
| `Ctrl+H` / `Cmd+H` | Show history sidebar |
| `←` / Backspace | Go back to landing page |

---

## Tips & Tricks

### ✅ Best Practices
1. **Start small** - Try 1-day date range first
2. **Filter mismatches** - Focus on failures first
3. **Export results** - Save CSV for team analysis
4. **Check history** - Reference past audits
5. **Zoom in on dialog** - Details are in mismatch analysis

### ⚠️ Common Mistakes
- ❌ Selecting year-long date range (too slow)
- ❌ Not exporting results before page refresh
- ❌ Missing key insight in mismatch dialog
- ❌ Forgetting to save notes on critical mismatches

### 🚀 Advanced Usage
- Export multiple audits and merge in Google Sheets
- Use comparisons to train new model descriptions
- Track improvement over time with weekly audits
- Share exported CSVs with your NLP team

---

## Need Help?

- **Setup issues?** → See `QUICKSTART.md`
- **Installation problems?** → See `SETUP_GUIDE.md`
- **Data issues?** → Check MongoDB connection
- **API errors?** → Verify endpoints in `.env.local`

---

**Happy Auditing!** 🎯
