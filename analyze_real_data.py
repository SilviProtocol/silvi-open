import pandas as pd
import numpy as np

# Load your real occurrence data
df = pd.read_csv('test_environmental_data.csv')

print("REAL OCCURRENCE DATA ANALYSIS")
print("="*50)
print(f"Data shape: {df.shape}")
print(f"File size: 432MB")
print(f"Columns: {list(df.columns)}")
print(f"First few rows:")
print(df.head())

# Species analysis
if 'species' in df.columns:
    print(f"\nSpecies diversity:")
    print(f"Unique species: {df['species'].nunique()}")
    print(f"Top 10 species by occurrence count:")
    print(df['species'].value_counts().head(10))

# Geographic extent
if 'decimalLatitude' in df.columns and 'decimalLongitude' in df.columns:
    print(f"\nGeographic extent:")
    print(f"Latitude range: {df['decimalLatitude'].min():.2f} to {df['decimalLatitude'].max():.2f}")
    print(f"Longitude range: {df['decimalLongitude'].min():.2f} to {df['decimalLongitude'].max():.2f}")