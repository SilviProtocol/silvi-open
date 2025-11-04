# 🌍 Species Habitat Similarity Platform

A comprehensive platform for extracting, analyzing, and querying species habitat signatures using Google Earth Engine satellite imagery and machine learning embeddings.

## 📋 Overview

This project enables:
- **Species Habitat Extraction**: Extract 64D habitat signatures from satellite imagery for any tree species
- **Temporal Alignment**: Match species occurrences to their corresponding satellite imagery year (2018-2024)
- **Similarity Search**: Query any location on Earth to find species with similar habitat characteristics
- **Web Interface**: Interactive map-based interface for exploring species similarity

## 🏗️ Project Structure

```
GEE/
├── scripts/
│   ├── extraction/
│   │   ├── extract_temporal_aligned.py    # Single species extraction
│   │   └── extract_batch_10_species.py    # Batch extraction (10 species)
│   ├── aggregation/
│   │   └── aggregate_signature.py         # Create species signatures from embeddings
│   └── tile_species_similarity.py         # CLI tool for similarity queries
├── web/
│   ├── app.py                             # Flask web application
│   └── templates/
│       └── index.html                     # Interactive map UI
├── data/
│   ├── signatures/                        # Species signature files (256D)
│   └── embeddings/                        # Raw embedding extractions (64D)
├── docs/                                  # Documentation and guides
├── archive/                               # Old/deprecated scripts
├── credentials.json                       # Google API credentials
├── token.pickle                           # Google auth token
├── .gitignore                             # Git ignore rules
└── requirements.txt                       # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Google Earth Engine account with project access
- Google Drive API credentials

### Installation

1. **Clone the repository**
   ```bash
   cd GEE
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv gee-env
   source gee-env/bin/activate  # On Windows: gee-env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Authenticate Google Earth Engine**
   ```bash
   earthengine authenticate
   ```

5. **Set up Google Drive API**
   - Place your `credentials.json` in the project root
   - First run will prompt for Drive authentication

## 📊 Usage

### 1. Extract Species Habitat Signatures

**Single Species Extraction:**
```bash
python scripts/extraction/extract_temporal_aligned.py
```

**Batch Extraction (10 species):**
```bash
python scripts/extraction/extract_batch_10_species.py
```

This will:
- Load species occurrence data (94M records)
- Sample 5,000 occurrences per species with IQR outlier filtering
- Match each occurrence to its corresponding GEE imagery year
- Extract 64D embeddings from Alpha Earth satellite imagery
- Export to Google Drive: `species_year_matched_embeddings/`

### 2. Create Species Signatures

After GEE tasks complete, download CSVs and aggregate:

```bash
python scripts/aggregation/aggregate_signature.py <species_name>_year_matched_embeddings_64d.csv
```

This computes 256D signatures: mean, std, p10, p90 for each of the 64 embedding dimensions.

### 3. Query Similarity (CLI)

```bash
python scripts/tile_species_similarity.py --lat 35.0 --lon -85.0 --year 2024 --top 10
```

### 4. Launch Web Interface

```bash
cd web
python app.py
```

Then open: http://localhost:5002

**Features:**
- Click anywhere on the map to query that location
- View top similar species ranked by habitat similarity
- Interactive results with similarity percentages
- Responsive design for mobile and desktop

## 🔬 How It Works

### Data Pipeline

```
Occurrence Data (lat/lon/year)
    ↓
GEE Alpha Earth Imagery (250m resolution)
    ↓
64D Embeddings per occurrence
    ↓
Aggregate to 256D Species Signature
    (mean, std, p10, p90 × 64 bands)
    ↓
Similarity Search via Euclidean Distance
```

### Similarity Calculation

The platform uses **centroid distance** for similarity:

```python
distance = ||tile_embedding - species_mean||₂
similarity = 1 / (1 + distance)
```

Where:
- `tile_embedding`: 64D vector from queried location
- `species_mean`: 64D mean vector of species habitat
- Result: Similarity score from 0-1 (shown as %)

## 📈 Current Dataset

- **Species**: 10+ tree species with full signatures
- **Occurrences**: 94M tree observations from GBIF/Treekipedia
- **Temporal Range**: 2018-2024 (7 years)
- **Imagery**: Google Alpha Earth (250m resolution, 64D embeddings)

**Top Species:**
1. Acer rubrum (2.3M occurrences)
2. Quercus alba (1.96M occurrences)
3. Prunus serotina (1.89M occurrences)
4. Liquidambar styraciflua (1.88M occurrences)
5. ... and more

## 🛠️ Technologies

- **Google Earth Engine**: Satellite imagery and computation
- **Alpha Earth Dataset**: Pre-trained 64D embeddings from satellite imagery
- **Flask**: Web application framework
- **Leaflet**: Interactive mapping
- **Pandas/NumPy**: Data processing
- **Google Drive API**: Data storage and retrieval

## 📝 Key Features

### Year-Matched Temporal Alignment
- Matches each occurrence to its corresponding satellite imagery year
- Occurrences before 2018 use 2018 imagery (earliest available)
- Occurrences 2018-2024 use exact year match
- Occurrences after 2024 skipped (no imagery yet)

### IQR Outlier Filtering
- Removes geographic outliers using Interquartile Range (IQR)
- Keeps native range while filtering data errors
- Preserves natural distribution patterns

### Server-Side Processing
- All heavy computation on Google Earth Engine servers
- Efficient handling of millions of data points
- Automatic tiling and mosaicking

## 🔮 Future Enhancements

- [ ] Add cosine similarity and Mahalanobis distance options
- [ ] Incorporate std/p10/p90 statistics (currently only using mean)
- [ ] Support for multiple years in web interface
- [ ] Export similarity results as GeoJSON
- [ ] Batch query mode for multiple locations
- [ ] Species distribution visualization on map

## 📄 License

This project uses data from:
- Google Earth Engine
- Alpha Earth Embedding Dataset
- GBIF/Treekipedia species occurrences

## 🤝 Contributing

This is a research project. For questions or contributions, please open an issue.

## 📧 Contact

For questions about this project, please refer to the documentation in the `docs/` folder.

---

**Built with Google Earth Engine and Alpha Earth Embeddings**
