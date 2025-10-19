import pandas as pd

# Load the results
results = pd.read_csv('species_pca_profiles.csv')

print("🎯 SPECIES LANDSCAPE PROFILES")
print("="*50)

for _, species in results.iterrows():
    print(f"\n🌲 {species['species'].upper()}")
    print(f"Sample size: {species['sample_size']} occurrences")
    print(f"Variance explained: {species['total_explained_variance']:.1%}")
    
    print("\nLandscape Components (PC1-6):")
    for i in range(1, 7):
        median = species[f'pc_{i}_median']
        q25 = species[f'pc_{i}_q25'] 
        q75 = species[f'pc_{i}_q75']
        print(f"  PC{i}: {median:+.3f} (range: {q25:+.3f} to {q75:+.3f})")