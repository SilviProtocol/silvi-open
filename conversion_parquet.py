import pandas as pd

# Convert CSV to Parquet
print("Converting 432MB CSV to Parquet...")
df = pd.read_csv('analyze.csv')
df.to_parquet('species_data.parquet', compression='snappy')

# Check results
import os
csv_size = os.path.getsize('analyze.csv') / 1024 / 1024
parquet_size = os.path.getsize('species_data.parquet') / 1024 / 1024

print(f"CSV size: {csv_size:.1f} MB")
print(f"Parquet size: {parquet_size:.1f} MB") 
print(f"Size reduction: {((csv_size - parquet_size) / csv_size * 100):.1f}%")