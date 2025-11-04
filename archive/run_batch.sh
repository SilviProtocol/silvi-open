#!/bin/bash
#
# Batch Process Multiple Species
#
# This script processes 3 additional species using your gee-env
#

echo "======================================================================"
echo "BATCH PROCESSING: 3 Additional Species"
echo "======================================================================"
echo ""
echo "This will process:"
echo "  1. Quercus ilex (Holm oak)"
echo "  2. Pinus halepensis (Aleppo pine)"
echo "  3. Olea europaea (Olive tree)"
echo ""
echo "Each will have 7 yearly CSVs exported (21 files total)"
echo ""
echo "Press Enter to start, or Ctrl+C to cancel..."
read

echo ""
echo "Starting batch processing..."
echo ""

# Run with gee-env (adjust activation command if needed)
source activate gee-env 2>/dev/null || conda activate gee-env 2>/dev/null || true

python3 process_multiple_species.py

echo ""
echo "======================================================================"
echo "Batch processing script finished!"
echo "Check output above for status."
echo "======================================================================"
