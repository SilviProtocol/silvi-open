# 🌲 Treekipedia GraphFlow

**Smart Ontology Generator for Biodiversity Data**

A comprehensive platform for generating OWL ontologies from biodiversity data sources, with automatic field detection, categorization, and integration with Apache Fuseki triple store.

---

## 🚀 Features

### Core Capabilities
- **Multi-Source Data Import**: CSV files, Google Sheets, PostgreSQL databases
- **Smart Ontology Generation**: Automatic field analysis and categorization
- **Flexible Schema Formats**:
  - Traditional MVP + Option Set sheets
  - Direct schema format (column names as field definitions)
  - Transposed format (field names in rows)
- **Advanced Biodiversity Support**:
  - 8+ ontology classes (Taxonomic, Geographic, Ecological, etc.)
  - 120+ field patterns recognized
  - Option set enumeration support
- **Triple Store Integration**: Direct import to Apache Fuseki
- **Version Management**: Track changes and manage versions
- **Change Detection**: Only process updated data

### Ontology Classes
1. **TaxonomicRank** - Species classification, scientific names, taxonomic hierarchy
2. **GeographicDistribution** - Countries, regions, native/introduced ranges
3. **EcologicalInformation** - Biomes, habitats, elevation ranges, soil types
4. **ConservationInformation** - IUCN status, threats, climate vulnerability
5. **MorphologicalCharacteristics** - Physical attributes, growth forms, leaf types
6. **EconomicValue** - Timber value, non-timber products, agroforestry potential
7. **CulturalSignificance** - Traditional uses, cultural importance
8. **ManagementInformation** - Stewardship, planting, maintenance guidelines

---

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL (optional, for database integration)
- Apache Fuseki (optional, for triple store functionality)
- Google Cloud Service Account (optional, for Google Sheets integration)

---

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd biodiversity-ontology-automation
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
Create a `config.py` file or set environment variables:

```python
# config.py
BLAZEGRAPH_ENDPOINT = "http://localhost:3030"
BLAZEGRAPH_DATASET = "biodiversity"
BLAZEGRAPH_ENABLED = True

POSTGRESQL_ENABLED = True
POSTGRESQL_HOST = "localhost"
POSTGRESQL_PORT = 5432
POSTGRESQL_DATABASE = "biodiversity"
POSTGRESQL_USER = "your_user"
POSTGRESQL_PASSWORD = "your_password"

USE_GOOGLE_SHEETS = True
GOOGLE_SERVICE_ACCOUNT_FILE = "service_account.json"
```

### 5. Google Sheets Setup (Optional)
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a service account
4. Download the service account JSON file as `service_account.json`
5. Share your Google Sheets with the service account email

---

## 🎯 Quick Start

### Run the Application
```bash
python app.py
```

The application will be available at `http://localhost:5001`

### Basic Workflow

1. **Choose Your Data Source**
   - Upload CSV files directly
   - Connect to Google Sheets
   - Import from PostgreSQL

2. **Automatic Processing**
   - System detects field types and categories
   - Analyzes option sets and enumerations
   - Generates OWL ontology structure

3. **Review and Download**
   - View ontology preview
   - Check quality metrics
   - Download OWL file or import to Fuseki

---

## 📊 Data Format

### Option 1: Direct Schema Format (Recommended)

Your data can have two sheets:

**Species Sheet** (Field Definitions)
- Column names OR single column with field names as rows
- Examples: `species_scientific_name`, `family`, `genus`, `biomes`, `conservation_status`

**Optionset Sheet** (Enumerations)
- Each column represents an option set
- Rows contain possible values
- Examples: `Biomes` column with values like "Tropical Rainforest", "Temperate Forest"

### Option 2: MVP + Option Set Format

**MVP Sheet** (Field Metadata)
```csv
Field,Schema (revised),option set,ai researched,manual calculation,Exists
Scientific Name,species_scientific_name,,,TRUE,TRUE
Family,family,,,TRUE,TRUE
Biomes,biomes,Biome values,Ecological,TRUE,TRUE
```

**Option Set Sheet** (Enumerations)
```csv
Field Name,Option Value,Description
Biomes,Tropical Rainforest,Tropical rainforest biome
Biomes,Temperate Forest,Temperate forest biome
```

---

## 🔧 API Endpoints

### System Status
```
GET /api/system-status
```
Returns status of all integrations (Fuseki, PostgreSQL, Google Sheets)

### Generate Ontology from Google Sheets
```
POST /import-from-sheets
Form Data:
  - spreadsheet_id: Google Sheets ID
  - spreadsheet_name: Sheet name
  - ontology_name: Output filename
  - force_generation: Override change detection
```

### Upload CSV Files
```
POST /upload
Form Data:
  - files: CSV file(s)
  - ontology_name: Output filename
```

### Preview Ontology
```
POST /preview-multi-sheet-ontology
Form Data:
  - spreadsheet_id: Google Sheets ID
```

### Spreadsheet Metadata
```
GET /spreadsheet-metadata?spreadsheet_name=YourSheet
```
Returns worksheet info, row/column counts, version info

---

## 📁 Project Structure

```
biodiversity-ontology-automation/
├── app.py                              # Flask application
├── config.py                           # Configuration
├── requirements.txt                    # Dependencies
├── routes_main.py                      # Main routes
├── routes_api.py                       # API routes
├── multi_sheet_biodiversity_generator.py  # Core ontology generator
├── sheets_integration.py               # Google Sheets integration
├── postgres_rdf_converter.py           # PostgreSQL integration
├── utils.py                            # Utility functions
├── templates/                          # HTML templates
│   ├── index.html                      # Home page
│   ├── import_sheets.html              # Google Sheets import
│   ├── documentation.html              # Full documentation
│   └── ...
└── static/                             # Static assets
    └── css/
        └── treekipedia-unified.css
```

---

## 🔍 Features in Detail

### Automatic Field Detection

The system automatically recognizes:
- **Taxonomic fields**: species, genus, family, order, class
- **Geographic fields**: countries, regions, ecoregions, distribution
- **Ecological fields**: biomes, habitat, elevation, soil types, pH
- **Conservation fields**: IUCN status, threats, vulnerability
- **Morphological fields**: height, diameter, growth form, leaf type
- **Economic fields**: timber value, agroforestry potential
- **Cultural fields**: traditional uses, cultural significance

### Smart Data Type Inference

- `string`: Names, descriptions, IDs
- `int`: Counts, occurrences, quantities
- `float`: Measurements (elevation, temperature, height)
- `date`: Dates, years, timestamps
- `boolean`: Yes/no flags
- `enumeration`: Fields with option sets

### Quality Assessment

Automatically assesses:
- Completeness score
- Taxonomic completeness (≥3 taxonomic fields)
- Geographic completeness (≥1 geographic field)
- Ecological completeness (≥1 ecological field)
- Enumeration coverage
- Field distribution across categories

---

## 🐛 Troubleshooting

### Common Issues

**"Page not found" alert on load**
- Fixed: Browser/extension requests (favicon, .well-known) are now ignored

**Incorrect row/column counts**
- Fixed: Now shows actual data dimensions, not allocated sheet size

**Small ontology file (< 2KB)**
- Check that species sheet has field names as columns (or single column)
- Verify option set sheet has columns with enumeration values
- Look for errors in console/terminal logs

**Google Sheets connection fails**
- Verify service account JSON file exists
- Check that sheet is shared with service account email
- Ensure Google Sheets API is enabled

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

[Add your license here]

---

## 📧 Contact

[Add contact information]

---

## 🙏 Acknowledgments

- Built with Flask, Owlready2, and gspread
- Apache Fuseki for triple store functionality
- Bootstrap for UI components
