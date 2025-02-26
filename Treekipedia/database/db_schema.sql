-- db_schema.sql
-- PostgreSQL Schema Definitions for DeepTrees AI Research Data

CREATE TABLE ai_research (
    taxon_id VARCHAR(50) PRIMARY KEY,
    general_description TEXT,
    native_adapted_habitats TEXT,
    stewardship_best_practices TEXT,
    planting_methods TEXT,
    ecological_function TEXT,
    agroforestry_use_cases TEXT,
    elevation_ranges TEXT,
    compatible_soil_types TEXT,
    conservation_status TEXT,
    research_status VARCHAR(20) DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revision INT DEFAULT 1,
    revision_history JSONB
);
