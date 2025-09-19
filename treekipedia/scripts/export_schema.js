#!/usr/bin/env node

/**
 * Export complete database schema to a readable file
 * Extracts all tables, columns, data types, constraints, and indexes
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function exportSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 Extracting database schema...');

    // Get all tables
    const tablesQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tables = await client.query(tablesQuery);
    console.log(`Found ${tables.rows.length} tables`);

    let schemaOutput = `# Treekipedia Database Schema\n\n`;
    schemaOutput += `Generated: ${new Date().toISOString()}\n`;
    schemaOutput += `Database: treekipedia\n`;
    schemaOutput += `Total Tables: ${tables.rows.length}\n\n`;

    // For each table, get detailed information
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`  Processing table: ${tableName}`);

      schemaOutput += `## Table: ${tableName}\n\n`;

      // Get columns with detailed info
      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns
        WHERE table_name = $1
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;

      const columns = await client.query(columnsQuery, [tableName]);

      // Get row count
      const countQuery = `SELECT COUNT(*) as row_count FROM ${tableName};`;
      const rowCount = await client.query(countQuery);

      schemaOutput += `**Rows**: ${parseInt(rowCount.rows[0].row_count).toLocaleString()}\n\n`;

      schemaOutput += `| Column | Type | Length | Nullable | Default | Position |\n`;
      schemaOutput += `|--------|------|--------|----------|---------|----------|\n`;

      for (const col of columns.rows) {
        const length = col.character_maximum_length || '-';
        const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
        const defaultVal = col.column_default || '-';

        schemaOutput += `| ${col.column_name} | ${col.data_type} | ${length} | ${nullable} | ${defaultVal} | ${col.ordinal_position} |\n`;
      }

      // Get indexes
      const indexQuery = `
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1
        AND schemaname = 'public'
        ORDER BY indexname;
      `;

      const indexes = await client.query(indexQuery, [tableName]);

      if (indexes.rows.length > 0) {
        schemaOutput += `\n**Indexes:**\n`;
        for (const idx of indexes.rows) {
          schemaOutput += `- \`${idx.indexname}\`: ${idx.indexdef}\n`;
        }
      }

      // Get constraints
      const constraintQuery = `
        SELECT
          constraint_name,
          constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = $1
        AND table_schema = 'public'
        ORDER BY constraint_type, constraint_name;
      `;

      const constraints = await client.query(constraintQuery, [tableName]);

      if (constraints.rows.length > 0) {
        schemaOutput += `\n**Constraints:**\n`;
        for (const constraint of constraints.rows) {
          schemaOutput += `- \`${constraint.constraint_name}\` (${constraint.constraint_type})\n`;
        }
      }

      schemaOutput += `\n---\n\n`;
    }

    // Get database statistics
    schemaOutput += `## Database Statistics\n\n`;

    const statsQuery = `
      SELECT
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
      AND tablename IN (${tables.rows.map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY tablename, attname;
    `;

    const stats = await client.query(statsQuery, tables.rows.map(t => t.table_name));

    if (stats.rows.length > 0) {
      schemaOutput += `**Column Statistics** (showing distinct values and correlation):\n\n`;

      let currentTable = '';
      for (const stat of stats.rows) {
        if (stat.tablename !== currentTable) {
          currentTable = stat.tablename;
          schemaOutput += `\n### ${currentTable}\n`;
          schemaOutput += `| Column | Distinct Values | Correlation |\n`;
          schemaOutput += `|--------|-----------------|-------------|\n`;
        }

        const distinct = stat.n_distinct || 'N/A';
        const correlation = stat.correlation ? stat.correlation.toFixed(3) : 'N/A';
        schemaOutput += `| ${stat.column_name} | ${distinct} | ${correlation} |\n`;
      }
    }

    // Write to file
    const fs = require('fs');
    const outputPath = '../database/current_schema_export.md';
    fs.writeFileSync(outputPath, schemaOutput);

    console.log(`\n✅ Schema exported to: ${outputPath}`);
    console.log(`📊 Total size: ${(schemaOutput.length / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('❌ Error exporting schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🗄️ Starting database schema export...\n');
    await exportSchema();
    console.log('\n✅ Schema export completed successfully!');
  } catch (error) {
    console.error('\n❌ Schema export failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { exportSchema };