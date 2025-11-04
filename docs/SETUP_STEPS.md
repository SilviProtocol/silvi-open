# Step-by-Step Setup Guide

Follow these steps exactly to enable the automated pipeline.

---

## STEP 1: Install Required Packages ✅

Since you're using the `gee-env` conda environment, run:

```bash
# Activate your environment
source activate gee-env

# OR if that doesn't work:
conda activate gee-env

# Install packages
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

**Verify installation:**
```bash
python3 -c "from googleapiclient.discovery import build; print('✅ Google API installed')"
```

---

## STEP 2: Setup Google Cloud Project 🔧

### 2A. Create a Google Cloud Project

1. **Go to:** https://console.cloud.google.com
2. **Click:** "Select a Project" (top bar)
3. **Click:** "NEW PROJECT" (top right)
4. **Enter:**
   - Project name: `gee-species-extraction`
   - Location: Leave as default
5. **Click:** "CREATE"
6. **Wait** ~30 seconds for project creation
7. **Click** the notification bell → Click on your new project

---

### 2B. Enable Google Drive API

1. **In the left menu, click:** "APIs & Services" → "Library"
2. **In the search box, type:** `Google Drive API`
3. **Click** on "Google Drive API"
4. **Click:** "ENABLE"
5. **Wait** ~10 seconds for API to enable

---

### 2C. Configure OAuth Consent Screen

1. **In the left menu, click:** "APIs & Services" → "OAuth consent screen"
2. **Select:** "External"
3. **Click:** "CREATE"

**Fill in the form:**
- App name: `GEE Species Extraction`
- User support email: **[your email]**
- Developer contact information: **[your email]**
- Leave everything else blank
- **Click:** "SAVE AND CONTINUE"

**Scopes page:**
- **Click:** "SAVE AND CONTINUE" (don't add any scopes)

**Test users page:**
- **Click:** "+ ADD USERS"
- **Enter your email address**
- **Click:** "ADD"
- **Click:** "SAVE AND CONTINUE"

**Summary page:**
- **Click:** "BACK TO DASHBOARD"

---

### 2D. Create OAuth Credentials

1. **In the left menu, click:** "APIs & Services" → "Credentials"
2. **Click:** "+ CREATE CREDENTIALS" (top)
3. **Select:** "OAuth client ID"
4. **Application type:** Select "Desktop app"
5. **Name:** `GEE Pipeline`
6. **Click:** "CREATE"

**Download the credentials:**
7. A popup appears with "OAuth client created"
8. **Click:** "DOWNLOAD JSON" (on the right)
9. The file downloads as something like `client_secret_XXX.json`

---

### 2E. Rename and Move Credentials

**In your terminal:**

```bash
cd ~/Downloads

# Find the downloaded file (it has a long name)
ls -la client_secret_*.json

# Rename it to credentials.json
mv client_secret_*.json credentials.json

# Move to GEE directory
mv credentials.json /Users/jeremicarose/Downloads/GEE/credentials.json

# Verify it's there
ls -la /Users/jeremicarose/Downloads/GEE/credentials.json
```

**You should see:**
```
-rw-r--r-- ... credentials.json
```

---

## STEP 3: Test the Setup 🧪

```bash
cd /Users/jeremicarose/Downloads/GEE

# Activate your environment
source activate gee-env  # or: conda activate gee-env

# Run the automated pipeline
python3 automated_pipeline.py
```

**What happens:**
1. Script starts
2. **Browser opens automatically** asking you to sign in to Google
3. **Sign in** with your Google account
4. You'll see a warning: "Google hasn't verified this app"
   - **Click:** "Advanced"
   - **Click:** "Go to GEE Species Extraction (unsafe)"
5. **Click:** "Continue" to grant access
6. Browser shows: "The authentication flow has completed. You may close this window."
7. **Close browser**
8. Script continues automatically!

**After first time:** No browser needed! Credentials saved in `token.pickle`

---

## STEP 4: Monitor Progress 📊

The script will show:

```
======================================================================
AUTOMATED PIPELINE: GEE EXTRACTION → AGGREGATION
======================================================================
Species: Quercus coccifera
Years: 2018-2024
Max samples per year: 5,000

======================================================================
STEP 1: EXTRACTING YEARLY EMBEDDINGS FROM GEE
======================================================================
✅ GEE initialized
✅ FC created & filtered: 4885 land points

      📤 Started yearly export: Quercus_coccifera_year_2018_embeddings_64d
      📤 Started yearly export: Quercus_coccifera_year_2019_embeddings_64d
      ...

======================================================================
STEP 2: WAITING FOR GEE TASKS TO COMPLETE
======================================================================
⏳ Monitoring GEE tasks (timeout: 10 min)...
   Still waiting... (1.0 min elapsed)
   Still waiting... (1.5 min elapsed)
   ...
   ✅ Tasks should be complete after 5.0 min

======================================================================
STEP 3: DOWNLOADING YEARLY CSVs FROM GOOGLE DRIVE
======================================================================
📥 Downloading 2018 data...
   ✅ Downloaded: Quercus_coccifera_year_2018_embeddings_64d.csv (1.5 MB)
📥 Downloading 2019 data...
   ✅ Downloaded: Quercus_coccifera_year_2019_embeddings_64d.csv (1.5 MB)
   ...
✅ Downloaded 7/7 files

======================================================================
STEP 4: AGGREGATING ALL YEARS LOCALLY
======================================================================
   Loading 2018...
      ✅ 4,885 rows
   Loading 2019...
      ✅ 4,885 rows
   ...
✅ Combined: 34,195 total samples across 7 years

🔢 Computing statistics...
✅ Computed 256 statistics

======================================================================
STEP 5: SAVING AND UPLOADING SIGNATURE
======================================================================
💾 Saved locally: Quercus_coccifera_2018-2024_signature_256d_AUTO.csv
📤 Uploading to Google Drive/species_signatures/...
   ✅ Uploaded: Quercus_coccifera_2018-2024_signature_256d_AUTO.csv
✅ Upload complete!

======================================================================
✅ AUTOMATED PIPELINE COMPLETE!
======================================================================
Output: Quercus_coccifera_2018-2024_signature_256d_AUTO.csv
Location: Google Drive/species_signatures/

📊 Summary:
   • Species: Quercus coccifera
   • Years: 2018-2024 (7 years)
   • Samples: 34,195
   • Statistics: 256 (64 bands × 4 stats)

🎉 No manual downloads needed!
```

---

## 🎯 Quick Reference

**To run the pipeline:**
```bash
cd /Users/jeremicarose/Downloads/GEE
source activate gee-env
python3 automated_pipeline.py
```

**Files needed:**
- ✅ `credentials.json` (from Google Cloud)
- ✅ `token.pickle` (auto-created on first run)
- ✅ `species_data.parquet` (your data)
- ✅ `automated_pipeline.py` (the script)

**Files created:**
- `token.pickle` (auth token - reused)
- `Quercus_coccifera_year_XXXX_embeddings_64d.csv` (7 files, local copies)
- `Quercus_coccifera_2018-2024_signature_256d_AUTO.csv` (final output)

---

## 🐛 Troubleshooting

### "credentials.json not found"
**Fix:** Download OAuth credentials again from Google Cloud Console

### "Module not found: googleapiclient"
**Fix:**
```bash
source activate gee-env
pip install google-api-python-client
```

### Browser doesn't open for authentication
**Fix:** Look for a URL in the terminal output, copy and paste in browser

### "Folder not found" when downloading
**Fix:** The yearly CSVs haven't been created yet. Wait for GEE tasks to complete first.

### Tasks timeout
**Fix:** Increase timeout in script:
```python
# Line ~210 in automated_pipeline.py
self.wait_for_gee_tasks(timeout_minutes=30)  # Increase to 30
```

---

## ✅ Checklist

Before running `automated_pipeline.py`, make sure:

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials downloaded
- [ ] `credentials.json` in `/Users/jeremicarose/Downloads/GEE/`
- [ ] Google API packages installed (`pip list | grep google`)
- [ ] In `gee-env` conda environment

---

## 🎉 You're Ready!

Run:
```bash
python3 automated_pipeline.py
```

The first run will take ~6 minutes. Subsequent runs for other species will be faster (no auth needed).

Good luck! 🚀
