# MongoDB Setup & Configuration Guide

## Quick Version Check

**Current Recommendation**: MongoDB 4.4 LTS  
**Compatible**: MongoDB 4.0, 4.2, 4.4, 5.0+

```bash
# Check your installed version
mongosh
> db.version()
# Returns: "4.4.0" or similar
```

---

## Installation by OS

### macOS (Homebrew) - RECOMMENDED
```bash
# Add MongoDB tap
brew tap mongodb/brew

# Install MongoDB 4.4
brew install mongodb-community@4.4

# Start the service
brew services start mongodb-community@4.4

# Verify it's running
mongosh
> show dbs
# Should show admin, config, local

# Stop when done
brew services stop mongodb-community@4.4
```

### Windows (MSI Installer)
1. Download: https://www.mongodb.com/try/download/community
2. Choose Version 4.4.x
3. Run installer, accept defaults
4. MongoDB runs as Windows Service automatically
5. Connect: Open "Mongo Shell" from Start Menu

### Linux (Ubuntu/Debian)
```bash
# Add MongoDB repository
curl https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

---

## Connection Options

### Option 1: Local MongoDB (Development)
```
MONGODB_URI=mongodb://localhost:27017/oriserveailogsmaster
```

**Pros**: Fast, no internet needed, full control  
**Cons**: Only works on your machine, no backup

**Test connection**:
```bash
mongosh mongodb://localhost:27017/oriserveailogsmaster
> db.version()
> db.getName()  # Should return: oriserveailogsmaster
```

### Option 2: MongoDB Atlas (Cloud)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oriserveailogsmaster
```

**Setup Steps**:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new project
4. Create M0 (free) cluster
5. Click "Connect" → "Connect with Mongo Shell"
6. Copy connection string
7. Replace `<password>` and add database name: `/oriserveailogsmaster`

**Example URL**:
```
mongodb+srv://user:pass123@cluster0.abc123.mongodb.net/oriserveailogsmaster
```

**Pros**: Cloud-based, automatic backup, shareable  
**Cons**: Requires internet, slower than local

### Option 3: Docker (Any OS)
```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:4.4

# Connect
mongosh mongodb://localhost:27017/oriserveailogsmaster

# Stop
docker stop mongodb
docker rm mongodb
```

---

## Database & Collection Setup

### Create Database & Collection
```bash
mongosh

# Switch to (or create) database
> use oriserveailogsmaster

# Create collection with validation
> db.createCollection("callLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["message", "nlpIntent", "llmIntent", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        message: { bsonType: "string" },
        nlpIntent: { bsonType: "string" },
        llmIntent: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        source: { bsonType: "string", enum: ["PRIMARY", "SECONDARY"] },
        metadata: { bsonType: "object" }
      }
    }
  }
})

# Verify
> show collections
# Should list: callLogs
```

### Insert Sample Data
```bash
# Single insert
> db.callLogs.insertOne({
  message: "I want to pay my bill",
  nlpIntent: "PAYMENT",
  llmIntent: "PAYMENT",
  createdAt: new Date(),
  source: "PRIMARY"
})

# Bulk insert for testing
> db.callLogs.insertMany([
  {
    message: "Help with my connection",
    nlpIntent: "SUPPORT",
    llmIntent: "NETWORK_ISSUE",
    createdAt: new Date(),
    source: "PRIMARY"
  },
  {
    message: "Check my balance",
    nlpIntent: "BALANCE_CHECK",
    llmIntent: "BALANCE_CHECK",
    createdAt: new Date(),
    source: "PRIMARY"
  },
  {
    message: "I have an issue",
    nlpIntent: "GENERAL_SUPPORT",
    llmIntent: "COMPLAINT",
    createdAt: new Date(),
    source: "SECONDARY"
  }
])

# Count records
> db.callLogs.countDocuments()
# Returns: 4 (or however many you inserted)
```

### Create Indexes for Performance
```bash
# Index on creation date (for date range queries)
> db.callLogs.createIndex({ createdAt: 1 })

# Index on intent (for filtering)
> db.callLogs.createIndex({ nlpIntent: 1 })
> db.callLogs.createIndex({ llmIntent: 1 })

# Compound index for common query
> db.callLogs.createIndex({ createdAt: 1, source: 1 })

# View all indexes
> db.callLogs.getIndexes()
```

---

## Querying Data

### Find All Records
```bash
mongosh
> use oriserveailogsmaster
> db.callLogs.find()  # All records
> db.callLogs.find().pretty()  # Formatted output
```

### Find by Date Range
```bash
# Records from April 1-5, 2024
> db.callLogs.find({
  createdAt: {
    $gte: ISODate("2024-04-01"),
    $lt: ISODate("2024-04-06")
  }
})
```

### Find Mismatches (NLP ≠ LLM)
```bash
> db.callLogs.find({
  $expr: { $ne: ["$nlpIntent", "$llmIntent"] }
})
```

### Find by Intent
```bash
> db.callLogs.find({ nlpIntent: "PAYMENT" })
> db.callLogs.find({ nlpIntent: "PAYMENT", llmIntent: "PAYMENT" })
```

### Count & Statistics
```bash
# Count total records
> db.callLogs.countDocuments()

# Count in date range
> db.callLogs.countDocuments({
  createdAt: { $gte: ISODate("2024-04-01"), $lt: ISODate("2024-04-06") }
})

# Count mismatches
> db.callLogs.countDocuments({
  $expr: { $ne: ["$nlpIntent", "$llmIntent"] }
})

# Aggregation - count by intent
> db.callLogs.aggregate([
  { $group: { _id: "$nlpIntent", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## Backup & Restore

### Backup Collection
```bash
# Export to JSON
mongodump --uri="mongodb://localhost:27017/oriserveailogsmaster" \
  --collection=callLogs \
  --out=./backup

# Export to CSV
mongoexport --uri="mongodb://localhost:27017/oriserveailogsmaster" \
  --collection=callLogs \
  --type=csv \
  --fields=message,nlpIntent,llmIntent,createdAt \
  --out=audit_backup.csv
```

### Restore Collection
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/oriserveailogsmaster" \
  ./backup/oriserveailogsmaster
```

---

## Troubleshooting

### Connection Errors

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`
```bash
# MongoDB not running
brew services start mongodb-community@4.4

# On Linux
sudo systemctl start mongod

# On Windows - Check Services
# Open Services app, look for "MongoDB Server", click "Start"
```

**Error**: `authentication failed`
```bash
# If MongoDB requires authentication (Atlas does)
# Connection string must include credentials:
mongodb+srv://username:password@cluster.mongodb.net/database

# Replace username and password with your actual values
```

**Error**: `database does not exist`
```bash
# Database doesn't exist yet - create it:
mongosh
> use oriserveailogsmaster
> db.createCollection("callLogs")
```

### Performance Issues

**Slow Queries?** Add indexes:
```bash
# Check what's slow
> db.callLogs.find({createdAt: {$gte: ISODate("2024-04-01")}}).explain("executionStats")

# If COLLSCAN - add index
> db.callLogs.createIndex({ createdAt: 1 })

# Verify it uses index now
> db.callLogs.find({createdAt: {$gte: ISODate("2024-04-01")}}).explain("executionStats")
# Should show IXSCAN, not COLLSCAN
```

**Large Collection?** Limit results:
```bash
# Get only first 100 records
> db.callLogs.find().limit(100)

# Skip first 100, get next 100 (pagination)
> db.callLogs.find().skip(100).limit(100)
```

### Storage Issues

**Check Database Size**:
```bash
mongosh
> use oriserveailogsmaster
> db.stats()
# Shows: dataSize, indexSize, storageSize
```

**Delete Old Data**:
```bash
# Remove records older than 1 year
> db.callLogs.deleteMany({
  createdAt: { $lt: ISODate("2023-04-05") }
})
```

---

## Security Notes

### For Production (Important!)

1. **Use Strong Passwords**
   ```
   mongodb+srv://admin:ComplexP@ssw0rd123!@cluster.mongodb.net/database
   ```

2. **Restrict Network Access** (Atlas)
   - Go to Network Access
   - Add only your IP addresses
   - Don't use 0.0.0.0/0

3. **Enable Authentication** (Local)
   ```bash
   mongosh
   > use admin
   > db.createUser({
     user: "appuser",
     pwd: "securepassword",
     roles: ["readWrite"]
   })
   ```

4. **Use Environment Variables**
   - Never commit `.env.local` to git
   - Add to `.gitignore`
   - Store passwords securely

---

## Monitoring

### Check MongoDB Status
```bash
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Connection test
mongosh
> ping()
# Returns: { ok: 1 } if healthy
```

### Monitor Active Operations
```bash
mongosh
> db.currentOp()  # Shows running operations
> db.killOp(123)  # Kill operation by ID
```

---

## References

- **MongoDB Docs**: https://docs.mongodb.com/
- **MongoDB Shell**: https://docs.mongodb.com/mongodb-shell/
- **Atlas**: https://www.mongodb.com/cloud/atlas
- **Version Support**: https://docs.mongodb.com/manual/release-notes/

---

**Need help?** Check SETUP_GUIDE.md for common errors!
