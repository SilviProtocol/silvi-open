# 256-Band Signature Aggregation: Local vs GEE Comparison

This folder contains scripts to compute and compare 256-band signatures using two different methods:
1. **Local aggregation** (pandas/numpy)
2. **GEE server-side aggregation**

Both use **2024 data only** to avoid timeout issues.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `aggregate_local_2024.py` | Computes signature locally from 2024 CSV |
| `aggregate_gee_2024.py` | Computes signature on GEE servers (2024 only) |
| `compare_signatures.py` | Compares both signatures and creates visualizations |

---

## 🚀 Workflow

### Step 1: Download 2024 CSV from Google Drive

1. Go to: https://drive.google.com
2. Navigate to: `species_yearly_embeddings/`
3. Download: `Quercus_coccifera_year_2024_embeddings_64d.csv`
4. Place it in: `/Users/jeremicarose/Downloads/GEE/`

---

### Step 2: Run Local Aggregation

```bash
cd /Users/jeremicarose/Downloads/GEE
python3 aggregate_local_2024.py
```

**What it does:**
- Reads the 2024 CSV (~4,885 rows)
- Computes mean, std, p10, p90 for each of 64 bands
- Saves: `Quercus_coccifera_2024_signature_256d_LOCAL.csv`

**Output:**
```
✅ Computed: 256 statistics (64 bands × 4 stats = 256)
📊 Sample statistics (A00):
   Mean:  0.123456
   Std:   0.045678
   P10:   0.089012
   P90:   0.167890
💾 Saved: Quercus_coccifera_2024_signature_256d_LOCAL.csv
```

**Then:**
- Upload `Quercus_coccifera_2024_signature_256d_LOCAL.csv` to Google Drive: `species_signatures/`

---

### Step 3: Run GEE Aggregation

```bash
python3 aggregate_gee_2024.py
```

**What it does:**
- Loads 2024 Alpha Earth data
- Samples at occurrence locations (server-side)
- Computes statistics on GEE servers
- Exports to Google Drive: `species_signatures/`

**Output:**
```
✅ Extracted: 64 means, 64 stds, 64 p10s, 64 p90s
📊 Sample statistics (A00):
   Mean:  0.123457
   Std:   0.045679
   P10:   0.089011
   P90:   0.167891
📤 Export started: Quercus_coccifera_2024_signature_256d_GEE
```

**Then:**
- Wait 2-3 minutes for GEE export to complete
- Monitor: https://code.earthengine.google.com/tasks
- Download `Quercus_coccifera_2024_signature_256d_GEE.csv` from Google Drive
- Place it in: `/Users/jeremicarose/Downloads/GEE/`

---

### Step 4: Compare Signatures

```bash
python3 compare_signatures.py
```

**What it does:**
- Loads both LOCAL and GEE signatures
- Computes differences for all 256 statistics
- Creates comparison plots
- Assesses agreement between methods

**Output:**
```
📊 Overall comparison (256 statistics):
   Max absolute difference:    0.00012345
   Mean absolute difference:   0.00001234
   Max relative difference:    0.1234%
   Mean relative difference:   0.0123%

🎯 Verdict: ✅ EXCELLENT - Methods produce nearly identical results
```

**Files created:**
- `signature_comparison_2024_LOCAL_vs_GEE.csv` - Detailed comparison
- `signature_comparison_2024_LOCAL_vs_GEE.png` - Scatter plots

---

## 📊 Understanding the Results

### Expected Differences

**Small differences are normal** due to:
1. **Numerical precision** - Different computation backends (pandas vs GEE)
2. **Floating point arithmetic** - Rounding differences
3. **Sampling order** - May affect percentile calculations

### Good Agreement Indicators

| Metric | Excellent | Good | Moderate | Poor |
|--------|-----------|------|----------|------|
| Mean relative diff | < 0.1% | < 1% | < 5% | > 5% |
| Max relative diff | < 1% | < 5% | < 10% | > 10% |

---

## 🔍 Troubleshooting

### Local aggregation fails
- **Error:** File not found
- **Fix:** Download 2024 CSV from Google Drive first

### GEE aggregation fails
- **Error:** Computation timed out
- **Fix:** This is expected - the script uses only 2024 data to avoid this
- **If still failing:** Reduce `max_samples` to 1000 in the script

### Comparison shows large differences
- **Issue:** Mean relative difference > 5%
- **Check:** Are you comparing the same year and species?
- **Debug:** Open both CSVs and manually verify a few values

---

## 💡 Key Insights

### Why Use Local Aggregation?

**Pros:**
- ✅ No timeout issues
- ✅ Full control over computation
- ✅ Easy to debug
- ✅ Can handle unlimited data (not limited by GEE quotas)

**Cons:**
- ❌ Requires downloading raw data first
- ❌ Uses local compute resources
- ❌ Need to manually upload results

### Why Use GEE Aggregation?

**Pros:**
- ✅ No need to download raw data
- ✅ Uses Google's server infrastructure
- ✅ Directly exports to Google Drive
- ✅ Parallelized computation

**Cons:**
- ❌ Can timeout with large datasets
- ❌ Limited by GEE quotas
- ❌ Less control over computation

---

## 📈 Next Steps

### If both methods agree well:

1. **Use GEE aggregation for small/medium datasets** (< 10,000 points)
2. **Use local aggregation for large datasets** (> 10,000 points)
3. **For all years (2018-2024):** Download all 7 yearly CSVs, concatenate locally, then aggregate

### To aggregate all years locally:

```python
import pandas as pd

# Load all years
years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]
dfs = []
for year in years:
    df = pd.read_csv(f'Quercus_coccifera_year_{year}_embeddings_64d.csv')
    dfs.append(df)

# Concatenate
all_years_df = pd.concat(dfs, ignore_index=True)
print(f"Total samples: {len(all_years_df):,}")

# Compute signature (same as aggregate_local_2024.py)
# ... (use same logic)
```

---

## 🎯 Summary

This comparison validates that:
1. **Local aggregation works correctly**
2. **GEE aggregation works correctly**
3. **Both methods produce consistent results**

Choose the method that best fits your:
- Dataset size
- Computational resources
- Workflow preferences

Good luck with your species embedding extraction! 🌳
