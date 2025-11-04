#!/usr/bin/env python3
"""
BATCH PROCESSING: Extract signatures for multiple species

This script processes multiple species automatically:
1. Extracts yearly embeddings from GEE (2018-2024)
2. Waits for GEE tasks to complete
3. Exports to Google Drive

Run this for 3-5 species, then use aggregate_all_years_local.py
for each species to create the final signatures.
"""

import pandas as pd
import ee 
import time
from pathlib import Path

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='treekipedia')
        print("GEE initialized")
        return True
    except Exception as e:
        print(f"GEE initialization failed: {e}")
        return False
    
    
def get_top_species(df, n=10):
    """Get top N species by occurrence count"""
    species_counts = df['species'].value_counts()

    print("\n" + "="*70)
    print(f"TOP {n} SPECIES BY OCCURRENCE COUNT")
    print("="*70)

    for i, (species, count) in enumerate(species_counts.head(n).items(), 1):
        print(f"{i:2}. {species:40} {count:,} occurrences")

    return species_counts.head(n).index.tolist()


def process_species_batch(df, species_list, max_samples=5000, export_yearly=True):
    """
    Process multiple species in batch.

    Parameters:
    ------------
    df : DateFrame
        Species occurrence data
    species_list : list
        List of species names to process
    max_samples : init
        Max samples per species
    export_yearly : bool
        Export yearly CSVs (True) or just signature (False)            
    """

    print("\n" + "="*70)
    print("BATCH PROCESSING: MULTIPLE SPECIES")
    print("="*70)
    print(f"\nProcessing {len(species_list)} species:")
    for i, sp in enumerate(species_list, 1):
        print(f"  {i}. {sp}")
    print(f"\nMax samples per species: {max_samples:,}")
    print(f"Export yearly data: {export_yearly}")
    print("\n" + "="*70)

    # Import extraction function
    from extract_temporal_aligned import extract_server_side_signature

    all_tasks = []

    for i, species_name in enumerate(species_list, 1):
        print(f"\n{'='*70}")
        print(f"SPECIES {i}/{len(species_list)}: {species_name}")
        print(f"{'='*70}")

        try:
            # Extract
            tasks = extract_server_side_signature(
                df,
                species_name,
                max_samples=max_samples,
                export_yearly = export_yearly
            )  

            if tasks:
                all_tasks.extend(tasks if isinstance(tasks, list) else [tasks])
                print(f"\n {species_name}: Export tasks started")
            else:
                print(f"\n {species_name}: No tasks created")

            # Pause between species to avoid overwhelming GEE
            if i < len(species_list):
                pause_seconds = 10
                print(f"\n Pausing {pause_seconds} seconds before next species...")
                time.sleep(pause_seconds)

        except Exception as e:
            print(f"\n {species_name}: Error - {e}")
            continue

    print("\n" + "="*70)
    print("BATCH PROCESSING COMPLETE")
    print("="*70)
    print(f"\nProcessed: {len(species_list)} species")
    print(f"Total export tasks: {len(all_tasks)}")
    print(f"\n Monitor tasks: https://code.earthengine.google.com/tasks")
    print(f"\n Wait ~5-10 minutes for all tasks to complete")
    print(f"Then download from Google Drive/species_yearly_embeddings/")                      

    return all_tasks


def suggest_species(df, criteria='diverse'):
    """
    Suggest species to process based on different criteria.

    Parameters:
    -----------
    df : DateFrame
       Species data
    criteria : str
        'diverse' - geographically diverse species
        'common' - most common species
        'medium' - medium occurrence count (good for testing)   
    """

    species_counts = df['species'].value_counts()

    print("\n" + "="*70)
    print(f"SUGGESTED SPECIES: {criteria.upper()} SELECTION")
    print("="*70)

    if criteria == 'common':
        # Top 5 most common
        suggested = species_counts.head(5).index.tolist()
        print("\nMost common species (best data coverage):")

    elif criteria == 'medium':
        # Medium range (1000-10000 occurrences)
        mask = (species_counts >= 1000) & (species_counts <= 10000)
        suggested = species_counts[mask].head(5).index.tolist()
        print("\nMedium occurrence count (good for testing):")

    elif criteria == 'diverse':
        # Manually curated diverse list
        # You can customize this based on your research needs
        suggested = [
            'Quercus coccifera',   # Mediterranean oak (already processed)
            'Quercus ilex',         # Holm oak
            'Pinus halepensis',     # Aleppo pine
            'Olea europaea',
        ]        

        # Only keep species that exist in dataset
        suggested = [s for s in suggested if s in species_counts.index]
        print("\nGeographically/ecologically diverse species:")

    else:
        suggested = species_counts.head(5).index.tolist()

    for i, sp in enumerate(suggested, 1):
        count = species_counts.get(sp, 0)
        print(f" {i}. {sp:40} {count:,} occurrences")

    return suggested


def main():
    """
    Main batch processing workflow
    """            

    print("="*70)
    print("MULTI-SPECIES BATCH PROCESSING")
    print("="*70)

    # Initialize GEE
    if not initialize_gee():
        return
    
    # Load data
    print("\n Loading species data...")
    try:
        df = pd.read_parquet('species_data.parquet')
        print(f"Loaded: {len(df):,} occurrences, {df['species'].nunique():,} species")
    except Exception as e:
        print(f"Failed: {e}")
        return

    # Show options
    print("\n" + "="*70)
    print("SELECTION OPTIONS")
    print("="*70)

    # Option 1: Pre-selected diverse species
    print("\n OPTION 1: Process 3 diverse Mediterranean species")
    diverse_species = suggest_species(df, 'diverse')

    # Skip Quercus coccifera (already processed)
    if 'Quercus coccifera' in diverse_species:
        diverse_species.remove('Quercus coccifera')

    # Take first 3
    selected_species = diverse_species[:3]

    print(f"\n Selected species (3):")
    for i, sp in enumerate(selected_species, 1):
        count = df[df['species'] == sp].shape[0]
        print(f"  {i}. {sp:40} {count:,} occurrences")

    # Confirm
    print("\n" + "="*70)
    print("Ready to process these 3 species!")
    print("This will:")
    print("  . Extract yearly embeddings (2018-2024)")
    print("  . Export 7 CSVs per species (21 files total)")
    print("  . Take ~10-15 minutes")
    print("\nPress Enter to continue, or Ctrl+C to cancel...")
    input()

    # Process
    all_tasks = process_species_batch(
        df,
        selected_species,
        max_samples=5000,
        export_yearly=True
    )            

    # Next steps
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Wait 10-15 minutes for GEE exports to complete")
    print("  Monitor: https://code.earthengine.google.com/tasks")

    print("\n2. Download yearly CSVs from Google Drive")
    print("  For each species, download from: species_yearly_embeddings/")

    print("\n3 Aggregate each species:")
    print("  Edit aggregate_all_years_local.py and change species name")
    print(". Or use the automated pipeline (if Drive API setup)")

    print("\n4. Result:")
    print("  3 species x 256-band signatures")
    print("  Ready for classification/analyssis!")

    print("\n" + "="*70)
    print("BATCH EXTRACTION STARTED!")
    print("="*70)


if __name__== "__main__":
    main()
