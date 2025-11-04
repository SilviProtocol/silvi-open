#!/bin/bash
# Run complete pipeline for 10 species

SPECIES=(
    "Quercus alba"
    "Prunus serotina"
    "Liquidambar styraciflua"
    "Ulmus americana"
    "Pinus taeda"
    "Nyssa sylvatica"
    "Quercus stellata"
    "Fraxinus pennsylvanica"
    "Juniperus virginiana"
    "Quercus nigra"
)

PARQUET="Treekipedia_occ_YEAR_LatLong_October30d.parquet"
SCRIPT="archive/complete_pipeline_drive_only.py"

cd /Users/jeremicarose/Downloads/GEE

for i in "${!SPECIES[@]}"; do
    species="${SPECIES[$i]}"
    num=$((i + 1))

    echo "========================================"
    echo "SPECIES $num/10: $species"
    echo "========================================"

    PYTHONPATH=/Users/jeremicarose/Downloads/GEE/scripts/extraction:$PYTHONPATH \
        python "$SCRIPT" "$species" \
        --max-samples 5000 \
        --check-interval 30 \
        --parquet "$PARQUET"

    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS: $species"
    else
        echo "❌ FAILED: $species"
    fi

    echo ""
done

echo "========================================"
echo "✅ ALL 10 SPECIES COMPLETED!"
echo "========================================"
