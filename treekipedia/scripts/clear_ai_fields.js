/**
 * Script to clear all _ai fields in the species table
 * 
 * This script connects to the database and sets all _ai fields to NULL.
 * This is useful when you want to reset all AI-generated data and
 * prepare for a fresh import of human-verified data.
 * 
 * Usage: node clear_ai_fields.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create a pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function clearAiFields() {
  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');
    console.log('Transaction started');

    // Get all columns from the species table
    const schemaQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'species'
      ORDER BY ordinal_position;
    `;
    const { rows } = await client.query(schemaQuery);
    console.log(`Found ${rows.length} columns in the species table`);

    // Filter out only the _ai fields
    const aiFields = rows
      .map(row => row.column_name)
      .filter(name => name.endsWith('_ai'));
    
    console.log(`Found ${aiFields.length} _ai fields to clear:`);
    console.log(aiFields);

    if (aiFields.length === 0) {
      console.log('No _ai fields found. Nothing to do.');
      return;
    }

    // Build the update query
    const updates = aiFields.map(field => `${field} = NULL`).join(', ');
    const updateQuery = `
      UPDATE species
      SET ${updates},
          researched = FALSE
    `;

    console.log('Executing update query...');
    const result = await client.query(updateQuery);
    console.log(`Successfully cleared ${aiFields.length} _ai fields and reset researched flag in ${result.rowCount} rows.`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing _ai fields:', err);
    throw err;
  } finally {
    client.release();
    console.log('Database connection released.');
  }
}

// Run the function and handle errors
clearAiFields()
  .then(() => {
    console.log('Successfully cleared all _ai fields.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  });