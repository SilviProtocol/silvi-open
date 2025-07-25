const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection from environment variable
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable not set");
    console.error("Please set it using: export DATABASE_URL='your_database_url'");
    process.exit(1);
}

async function findSpeciesWithoutImages() {
    const client = new Client({
        connectionString: DATABASE_URL
    });

    try {
        await client.connect();
        
        // Query to find species without images
        const query = `
            SELECT 
                s.taxon_id,
                s.species_scientific_name,
                s.species,
                s.genus,
                s.family
            FROM species s
            LEFT JOIN images i ON s.taxon_id = i.taxon_id
            WHERE i.id IS NULL
            ORDER BY s.species_scientific_name;
        `;
        
        const result = await client.query(query);
        
        // Prepare CSV content
        const csvHeader = 'taxon_id,species_scientific_name,species,genus,family\n';
        const csvRows = result.rows.map(row => {
            return [
                row.taxon_id,
                row.species_scientific_name || '',
                row.species || '',
                row.genus || '',
                row.family || ''
            ].map(field => {
                // Escape fields containing commas or quotes
                if (field && field.toString().includes(',') || field.toString().includes('"')) {
                    return `"${field.toString().replace(/"/g, '""')}"`;
                }
                return field || '';
            }).join(',');
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        // Write to CSV file
        const outputFile = 'species_without_images.csv';
        fs.writeFileSync(outputFile, csvContent, 'utf8');
        
        console.log(`Found ${result.rows.length} species without images`);
        console.log(`Results saved to ${outputFile}`);
        
        await client.end();
        
    } catch (error) {
        console.error('Error:', error);
        await client.end();
        process.exit(1);
    }
}

findSpeciesWithoutImages();