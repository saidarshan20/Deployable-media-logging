# Watch Log — Personal Recall System

A private, local-first log for movies and TV series.

This exists for one reason: **memory**.

---

## Why This Exists

Most watch trackers optimize for discovery, engagement, or social validation.  
That actively weakens recall.

This system is built on different assumptions:

- You remember things better when you log them deliberately
- Automation trades memory for convenience
- Your watch history should not depend on external services
- A single local database is more durable than any platform

This is not a product.  
This is a **personal memory system**.

---

## Quick Start

### Install Dependencies

**Backend**

```bash
cd server
npm install
```

**Frontend**

```bash
cd client
npm install
```

### Run the App

You need two terminals.

**Terminal 1 — Backend**

```bash
cd server
npm start

```

*Runs on:* `http://localhost:3001`

*Handles all database operations.*

**Terminal 2 — Frontend**

```bash
cd client
npm run dev -- --host

```

*Runs on:* `http://localhost:5173`

---

## Access on Phone (Local Wi-Fi)

### Requirements

* Phone and computer on the same Wi-Fi network
* Backend and frontend running

### Find Local IP Address

**Linux / macOS**

```bash
hostname -I

```

**Windows**

```bash
ipconfig

```

You are looking for something like: `192.168.X.X`

### Update API URL

Edit: `client/src/App.jsx`

```javascript
const API_URL = 'http://192.168.X.X:3001/api';
```

### Open on Phone

In your phone browser visit: `http://192.168.X.X:5173`

---

## Backup & Restore

All data lives in a single SQLite file.

**Database Location:** `server/database.db`

### Backup

1. Stop the backend
2. Copy `database.db`
3. Store it anywhere (USB, external drive, cloud)

### Restore

1. Stop the backend
2. Replace `server/database.db` with your backup
3. Ensure the file name is exactly `database.db`
4. Restart the backend

**No exports. No imports. No migrations.**

---

## Non-Goals

* Accounts
* Recommendations
* Social features
* External metadata
* Cloud sync

If any of those are added, the system has failed.