# Treekipedia

Treekipedia is an open-source database for tree data, including species lists, attributes, and complementary resources like species-specific datasets.

## Ontology

The ontology is defined in the `ontology/treekipedia.ttl` file.

## RDF Data

RDF data for tree species is stored in the `data` directory. Each file represents a species.

## Scripts

- `scripts/update_database.py`: Script to add or update RDF data in the database.

## Getting Started

1. Clone the repository.
2. Install required Python packages:
   ```sh
   pip install rdflib
