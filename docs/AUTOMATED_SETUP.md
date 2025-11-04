# Automated Pipeline Setup Guide

## 🎯 Goal

Eliminate manual downloads! Run one script that:
1. ✅ Extracts data from GEE
2. ✅ Waits for tasks to complete
3. ✅ **Auto-downloads** from Google Drive
4. ✅ Aggregates locally
5. ✅ **Auto-uploads** result back to Drive

---

## 📋 Prerequisites

### 1. Install Google Drive API

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. Setup Google Cloud Project

#### A. Create Project
1. Go to: https://console.cloud.google.com
2. Click "Select a Project" → "New Project"
3. Name it: `gee-species-extraction`
4. Click "Create"

#### B. Enable Google Drive API
1. In your project, go to: "APIs & Services" → "Library"
2. Search for: `Google Drive API`
3. Click it, then click "Enable"

#### C. Create OAuth Credentials
1. Go to: "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: `GEE Species Extraction`
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Add your email
   - Click "Save and Continue"
4. Back to Create OAuth client ID:
   - Application type: **Desktop app**
   - Name: `GEE Pipeline`
   - Click "Create"
5. Click "Download JSON"
6. Rename downloaded file to: `credentials.json`
7. Move to: `/Users/jeremicarose/Downloads/GEE/credentials.json`

---

## 🚀 Quick Start

### Option A: Fully Automated (Recommended)

```bash
cd /Users/jeremicarose/Downloads/GEE

# Run the automated pipeline
python3 automated_pipeline.py
```

**First run:** Browser will open for Google authentication
- Click "Allow" to grant Drive access
- Credentials saved to `token.pickle` (reused next time)

**What happens:**
1. Extracts yearly data from GEE → exports to Drive
2. Waits ~5 min for tasks to complete
3. Auto-downloads all 7 yearly CSVs from Drive
4. Aggregates into 256-band signature
5. Auto-uploads signature back to Drive
6. **Done! No manual steps!**

---

## 🔧 Simple Alternative: Use GEE's Built-in Drive Integration

**Even simpler approach** - GEE already handles Drive exports! You just need to:

1. Run `extract_temporal_aligned.py` - exports go to Drive automatically
2. Use the automated pipeline to download and aggregate

This is the **recommended approach** - leverages GEE's existing Drive integration!

---

## 📊 Comparison

### Manual Workflow (Current)
```
1. Run extract_temporal_aligned.py
2. Wait 5 min
3. Open browser → Drive → Download 7 CSVs
4. Run aggregate_all_years_local.py
5. Upload signature
───────────────────────────
Total: ~9 min + clicking
```

### Automated Workflow (New)
```
1. Run automated_pipeline.py
───────────────────────────
Total: ~6 min, zero clicks!
```

**Time saved:** 33% + no manual steps!

---

## 🎉 You're Ready!

Run:
```bash
python3 automated_pipeline.py
```

The script will guide you through setup if credentials are missing.
