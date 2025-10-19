# Temporally-Aligned Species Signature Workflow

## Overview

This workflow extracts Alpha Earth embeddings with temporal alignment and aggregates them into species-level signatures using robust statistics.

## Key Innovation: Temporal Alignment

**Problem with old approach**: Using multi-year averages creates temporal leakage (using future data to explain past observations).

**New approach**: Each occurrence gets embeddings from its observation year.

```
Occurrence from 2015 → Use 2017 embeddings (earliest available)
Occurrence from 2019 → Use 2019 embeddings (exact match)
Occurrence from 2023 → Use 2023 embeddings (exact match)
```

## Two-Step Process

### Step 1: GEE Extraction (Temporal Alignment)
**Script**: `extract_temporal_aligned.py`
**Where**: Google Earth Engine
**Input**: Species occurrence data with year column
**Output**: CSV files with 64-dimensional embeddings per occurrence

**What it does**:
- Groups occurrences by observation year
- Extracts embeddings from Alpha Earth for that specific year
- Samples at exact occurrence location (10m resolution, no buffer)
- Exports one CSV per year

**Output format**:
```
species,occurrence_id,lat,lon,observation_year,embedding_year,A00,A01,...,A63
Quercus coccifera,12345,40.5,15.2,2019,2019,0.45,0.32,...,0.28
```

### Step 2: Python Aggregation (Species Signature)
**Script**: `aggregate_species_signature.py`
**Where**: Local Python (on downloaded CSVs)
**Input**: CSV files from Step 1
**Output**: Single-row CSV with species signature

**What it does**:
- Loads all occurrence embeddings
- For each dimension (A00-A63), calculates:
  - **Median**: Robust central tendency
  - **Std**: Spread/variability
  - **P10**: 10th percentile (lower bound)
  - **P90**: 90th percentile (upper bound)

**Output format**:
```
species,n_occurrences,A00_median,A00_std,A00_p10,A00_p90,...,A63_median,A63_std,A63_p10,A63_p90
Quercus coccifera,5000,0.46,0.03,0.42,0.51,...,0.29,0.05,0.23,0.35
```

**Result**: 256 features (64 dimensions × 4 statistics)

## Why These Statistics?

### Median (50th percentile)
- More robust than mean for skewed distributions
- Represents typical environmental conditions

### Standard Deviation
- Measures environmental variability across species range
- High std = generalist, Low std = specialist

### P10 & P90 (10th and 90th percentiles)
- Captures 80% range of environmental conditions
- Shows environmental niche breadth
- Robust to outliers
- Detects asymmetry that std doesn't capture

### Together: The "Bell Curve"
```
    Environmental Range for Species

    P10            Median            P90
     ▼                ▼                ▼
     ├────────────────●────────────────┤
     │◄──── 80% of occurrences ────►│

     └─────────── Std ──────────┘
         (measures spread)
```

## Expected Outcomes

### 1. Species Environmental Signature
A 256-dimensional vector characterizing the species' environmental niche.

**Interpretation**:
- **High median values**: Prefers certain environmental conditions
- **High std/range**: Generalist (tolerates wide conditions)
- **Low std/range**: Specialist (narrow niche)
- **Asymmetric p10/p90**: Skewed habitat preferences

### 2. Temporal Validity
No temporal leakage - predictions are fair and valid for time-series analysis.

### 3. Downstream Applications

**Species Distribution Modeling**:
```python
# Use signature to predict occurrence probability
X = location_embeddings  # 64 dimensions from new location
y_pred = model.predict_similarity(X, species_signature)
```

**Species Similarity**:
```python
# Find ecologically similar species
from sklearn.metrics.pairwise import cosine_similarity
similarity = cosine_similarity(species_A_signature, species_B_signature)
```

**Habitat Suitability**:
```python
# Check if a location is suitable
location_embedding = get_embedding(lat, lon, year)
is_suitable = (species.p10 <= location_embedding <= species.p90).all()
```

**Niche Breadth Analysis**:
```python
# Quantify generalist vs specialist
niche_breadth = (species.p90 - species.p10).mean()
# High = generalist, Low = specialist
```

## Running the Workflow

### Prerequisites
```bash
# Install dependencies
pip install pandas numpy earthengine-api

# Authenticate GEE (first time only)
earthengine authenticate
```

### Step 1: Run GEE Extraction
```bash
python extract_temporal_aligned.py
```

**Expected**:
- Submits N tasks to GEE (N = number of unique years)
- Tasks complete in 5-10 minutes
- Downloads CSV files to Google Drive/embeddings_temporal_aligned/

### Step 2: Download CSVs
Download all CSV files from Google Drive to a local folder:
```
embeddings_temporal_aligned/
  ├── Quercus_coccifera_year_2017.csv
  ├── Quercus_coccifera_year_2018.csv
  ├── Quercus_coccifera_year_2019.csv
  └── ...
```

### Step 3: Run Aggregation
```bash
python aggregate_species_signature.py
```

**Update the folder path in the script**:
```python
folder_path = "/path/to/embeddings_temporal_aligned"
```

**Expected output**:
```
Quercus_coccifera_signature.csv
```

## Output Details

### File Size
- Occurrence CSVs: ~1-5 MB total
- Species signature: ~50 KB

### Performance Metrics
- GEE extraction: 5-10 minutes for 5000 occurrences
- Python aggregation: <10 seconds

### Validation
Check your signature:
```python
import pandas as pd
sig = pd.read_csv('Quercus_coccifera_signature.csv')

print(f"Features: {len(sig.columns)}")  # Should be 258 (species + n_occurrences + 256 features)
print(f"Occurrences: {sig['n_occurrences'].iloc[0]}")  # Should match your data
```

## Comparison: Old vs New Approach

| Aspect | Old (Multi-year Average) | New (Temporal Alignment) |
|--------|-------------------------|-------------------------|
| **Temporal validity** | ❌ Future leakage | ✅ No leakage |
| **Statistics source** | Temporal (across years) | Spatial (across range) |
| **Interpretation** | Mean conditions over time | Niche breadth in space |
| **Use case** | Climate stability | Habitat suitability |
| **Features** | 256 (temporal stats) | 256 (spatial stats) |

## What the Statistics Mean Ecologically

**For dimension A00 (example)**:

```python
A00_median = 0.46  # Typical environmental condition
A00_std = 0.03     # Low variability → specialist
A00_p10 = 0.42     # Lower bound of niche
A00_p90 = 0.51     # Upper bound of niche
# Range = 0.09 → narrow niche
```

**High std, wide range** = Generalist
- Found in diverse habitats
- Tolerates environmental variation
- Example: Dandelion, House Sparrow

**Low std, narrow range** = Specialist
- Specific habitat requirements
- Sensitive to environmental change
- Example: Endemic orchids, specialist pollinators

## Troubleshooting

### GEE Tasks Fail
- Reduce batch size in script
- Check GEE quota limits
- Verify project name in `ee.Initialize()`

### Missing Embedding Columns
- Ensure GEE export completed successfully
- Check CSV files have A00-A63 columns
- Verify no corrupt downloads

### Year Column Missing
- Ensure `year` column exists in species_data.parquet
- Check column name (case-sensitive)

## Next Steps

1. ✅ Extract embeddings with temporal alignment
2. ✅ Aggregate to species signatures
3. 🔄 Scale to all species (100+)
4. 🔄 Build species similarity matrix
5. 🔄 Train habitat suitability models
6. 🔄 Validate with held-out occurrences

## Contact
For questions about this workflow, refer to the main project documentation.
