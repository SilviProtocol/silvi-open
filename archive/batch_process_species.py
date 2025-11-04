#!/usr/bin/env python3
"""
Batch process multiple species to generate signatures

Usage:
    python batch_process_species.py
"""

import subprocess
import time

# List of species to process
SPECIES_LIST = [
    "Sorbus atrata",
    "Acacia aneura",
    "Zanthoxylum fagara",
    "Tetraclinis articulata",
    "Myoporum sandwicense",
    "Lomatia polymorpha",
    "Prunus clarofolia",
    "Camellia lutchuensis",
    "Eucalyptus fastigata",
    "Posoqueria latifolia"
]

PARQUET_FILE = "Treekipedia_occ_YEAR_LatLong_October30d.parquet"
MAX_SAMPLES = 900

print("="*70)
print("BATCH PROCESSING SPECIES SIGNATURES")
print("="*70)
print(f"\nProcessing {len(SPECIES_LIST)} species")
print(f"Max samples per species: {MAX_SAMPLES}")
print("\n" + "="*70 + "\n")

for i, species in enumerate(SPECIES_LIST, 1):
    print(f"\n[{i}/{len(SPECIES_LIST)}] Processing: {species}")
    print("-" * 70)

    cmd = [
        "python3",
        "complete_pipeline_drive_only.py",
        species,
        "--max-samples", str(MAX_SAMPLES),
        "--parquet", PARQUET_FILE,
        "--check-interval", "30"  # Check every 30 seconds
    ]

    try:
        # Run the pipeline
        result = subprocess.run(
            cmd,
            capture_output=False,
            text=True,
            check=False
        )

        if result.returncode == 0:
            print(f"✅ SUCCESS: {species}")
        else:
            print(f"❌ FAILED: {species} (exit code {result.returncode})")

    except Exception as e:
        print(f"❌ ERROR processing {species}: {e}")

    # Small delay between species
    if i < len(SPECIES_LIST):
        print("\nWaiting 5 seconds before next species...")
        time.sleep(5)

print("\n" + "="*70)
print("✅ BATCH PROCESSING COMPLETE")
print("="*70)
print(f"\nProcessed {len(SPECIES_LIST)} species")
print("\nCheck Google Drive folder: species_signatures/")
