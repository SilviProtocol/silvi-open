-- Export readable schema summary
\echo 'Treekipedia Database Schema Summary'
\echo '=================================='
\echo ''

-- Table overview with row counts
\echo 'TABLE OVERVIEW:'
\echo '==============='

SELECT
    schemaname,
    tablename,
    'SELECT COUNT(*) FROM ' || tablename || ';' as count_query
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo 'DETAILED TABLE INFORMATION:'
\echo '=========================='

-- Species table detailed info
\echo ''
\echo 'SPECIES TABLE COLUMNS:'
\echo '--------------------'

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'species'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Other important tables
\echo ''
\echo 'GEOHASH_SPECIES_TILES TABLE COLUMNS:'
\echo '-----------------------------------'

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'geohash_species_tiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'COUNTRIES TABLE COLUMNS:'
\echo '----------------------'

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'countries'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Indexes
\echo ''
\echo 'INDEXES:'
\echo '========'

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;