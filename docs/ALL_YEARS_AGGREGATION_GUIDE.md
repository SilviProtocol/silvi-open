# All Years Aggregation Guide (2018-2024)

## 🎯 Goal

Combine all 7 yearly CSVs into a single **256-band signature** representing the complete temporal profile for Quercus coccifera.

---

## 📋 Prerequisites

1. ✅ All 7 yearly CSVs exported from GEE (DONE!)
2. ✅ Files downloaded from Google Drive to local directory

---

## 🚀 Quick Start

### Step 1: Download All Yearly CSVs

Go to **Google Drive** → `species_yearly_embeddings/` and download:

```
✓ Quercus_coccifera_year_2018_embeddings_64d.csv
✓ Quercus_coccifera_year_2019_embeddings_64d.csv
✓ Quercus_coccifera_year_2020_embeddings_64d.csv
✓ Quercus_coccifera_year_2021_embeddings_64d.csv
✓ Quercus_coccifera_year_2022_embeddings_64d.csv
✓ Quercus_coccifera_year_2023_embeddings_64d.csv
✓ Quercus_coccifera_year_2024_embeddings_64d.csv
```

Place all files in: `/Users/jeremicarose/Downloads/GEE/`

---

### Step 2: Run Aggregation Script

```bash
cd /Users/jeremicarose/Downloads/GEE
python3 aggregate_all_years_local.py
```

---

### Step 3: Upload Result to Google Drive

The script will create:
```
Quercus_coccifera_2018-2024_signature_256d_LOCAL.csv
```

Upload this file to: **Google Drive** → `species_signatures/`

---

## 📊 What You'll Get

### Input
- **7 yearly CSVs** (~4,885 samples each)
- **Total: ~34,000 samples** across all years

### Output
- **1 signature CSV** with 265 columns:
  - 5 metadata: `species`, `years`, `num_years`, `total_samples`, `computation_method`
  - 256 statistics: `mean_A00` through `p90_A63`

### Example Output

| Column | Value |
|--------|-------|
| species | Quercus coccifera |
| years | 2018-2024 |
| num_years | 7 |
| total_samples | ~34,000 |
| mean_A00 | 0.092... |
| std_A00 | 0.080... |
| p10_A00 | -0.017... |
| p90_A00 | 0.179... |
| ... | ... |
| p90_A63 | 0.234... |

---

## 🔍 Script Features

### 1. Automatic Validation
- ✅ Checks all 7 files exist
- ✅ Validates 64 bands present in each
- ✅ Counts valid vs null samples
- ✅ Shows missing files with download instructions

### 2. Smart Concatenation
- ✅ Loads each year separately
- ✅ Adds year column if missing
- ✅ Concatenates into single DataFrame
- ✅ Removes rows with NaN values

### 3. Comprehensive Statistics
- ✅ Mean (central tendency)
- ✅ Std (variability)
- ✅ P10 (lower bound)
- ✅ P90 (upper bound)

### 4. Detailed Output
```
📊 Sample statistics (A00):
   Mean:  0.092521
   Std:   0.080833
   P10:   -0.017778
   P90:   0.179377

📅 Samples per year:
   • 2018: 4,885 samples
   • 2019: 4,885 samples
   • 2020: 4,885 samples
   • 2021: 4,885 samples
   • 2022: 4,885 samples
   • 2023: 4,885 samples
   • 2024: 4,885 samples
```

---

## ⚙️ Customization

### Process Different Species

Edit the script to change species name:

```python
# Line 13-14
species_name = "Quercus ilex"  # Change here

# Also update filenames accordingly
filename = f"{species_name.replace(' ', '_')}_year_{year}_embeddings_64d.csv"
```

### Include Fewer Years

To use only recent years (e.g., 2020-2024):

```python
# Line 16
years = [2020, 2021, 2022, 2023, 2024]  # Only 5 years
```

### Adjust Sample Filtering

To keep NaN values instead of dropping:

```python
# Comment out lines 232-236
# band_data = band_data.dropna()
# combined_df = combined_df.loc[band_data.index]
```

---

## 🎓 Understanding the Output

### Why Multi-Year Aggregation?

**Single Year (2024 only):**
- ✅ Captures one temporal snapshot
- ❌ May miss seasonal/yearly variation
- ~4,885 samples

**All Years (2018-2024):**
- ✅ Captures temporal dynamics
- ✅ More robust to outliers (larger sample)
- ✅ Better represents species niche
- ~34,000 samples

### Statistics Interpretation

| Stat | What It Tells You |
|------|-------------------|
| **Mean** | Typical satellite signature for this species |
| **Std** | How variable the signature is (habitat diversity) |
| **P10** | Lower bound (shaded/stressed vegetation) |
| **P90** | Upper bound (optimal growing conditions) |

---

## 🔄 Workflow Summary

```
Google Drive (yearly CSVs)
         ↓ Download
Local Machine
         ↓ aggregate_all_years_local.py
Signature CSV
         ↓ Upload
Google Drive (species_signatures/)
         ↓ Use for ML/Analysis
Species Classification Model
```

---

## ✅ Advantages of This Approach

| Aspect | Benefit |
|--------|---------|
| **No GEE timeout** | All computation local |
| **Full control** | Exact percentile algorithm |
| **Reproducible** | Same input → same output |
| **Scalable** | Can handle millions of samples |
| **Flexible** | Easy to customize statistics |

---

## 📈 Next Steps

### 1. Validate Output
```bash
# Check file size (should be ~1 KB)
ls -lh Quercus_coccifera_2018-2024_signature_256d_LOCAL.csv

# Check structure
head -2 Quercus_coccifera_2018-2024_signature_256d_LOCAL.csv
```

### 2. Load and Verify
```python
import pandas as pd

sig = pd.read_csv('Quercus_coccifera_2018-2024_signature_256d_LOCAL.csv')
print(f"Shape: {sig.shape}")  # Should be (1, 265)
print(f"Samples: {sig['total_samples'].iloc[0]}")  # Should be ~34,000
print(f"Years: {sig['num_years'].iloc[0]}")  # Should be 7
```

### 3. Use for Machine Learning
- Load multiple species signatures
- Create feature matrix (rows = species, cols = 256 features)
- Train classifier (Random Forest, SVM, Neural Network, etc.)

---

## 🎉 You're Done!

You now have a complete **256-band temporal signature** for Quercus coccifera spanning 2018-2024!

This represents the **satellite-derived ecological niche** of the species across:
- 7 years of observations
- ~34,000 occurrence locations
- 64 embedding dimensions × 4 statistics

Perfect for species distribution modeling, classification, or ecological analysis! 🌳
