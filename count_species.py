#!/usr/bin/env python3
import pandas as pd

# Read the parquet file
df = pd.read_parquet('species_data.parquet')

# Count unique species
num_species = df['species'].nunique()
total_records = len(df)

print(f"Total unique species: {num_species}")
print(f"Total occurrence records: {total_records}")
print(f"Average records per species: {total_records/num_species:.1f}")

# Show top 10 most common species
print(f"\nTop 10 species by occurrence count:")
print(df['species'].value_counts().head(10))
