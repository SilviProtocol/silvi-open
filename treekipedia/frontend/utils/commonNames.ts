/**
 * Utility function to get the most important common names from a list
 * with priority given to names at the beginning of the list
 * 
 * This utility is critical for:
 * 1. Showing the most relevant common names in the UI
 * 2. Keeping prompt sizes manageable for AI research
 * 3. Prioritizing the most widely used names like "Frangipani" for Plumeria Rubra
 * 
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @param {number} maxCount - Maximum number of names to return
 * @param {number} maxLength - Maximum total length of returned string
 * @returns {string} - Optimized common names string
 */
export function getTopCommonNames(commonNames: string | string[], maxCount = 5, maxLength = 200): string {
  if (!commonNames) return '';

  // Split string into array
  let nameArray: string[] = [];
  
  if (typeof commonNames === 'string') {
    // First split by semicolons (primary delimiter in our database)
    const blocks = commonNames.split(';').map(block => block.trim());
    
    // Process each block to extract valid names
    blocks.forEach(block => {
      if (!block) return; // Skip empty blocks
      
      // Further split by commas within each block
      const blockNames = block.split(',').map(n => n.trim()).filter(Boolean);
      nameArray.push(...blockNames);
    });
  } else {
    nameArray = commonNames;
  }
  
  // Remove any empty strings
  nameArray = nameArray.filter(name => name && name.trim() !== '');
  
  // Log the first few names for debugging
  console.log(`First 5 names after split: ${nameArray.slice(0, 5).map(n => `"${n}"`).join(', ')}`);
  
  // Create a simple scoring system based on:
  // 1. Position in the list (earlier is better)
  // 2. Name length (shorter names preferred)
  // 3. Language marker (no language marker preferred)
  // 4. Well-known names get a bonus
  
  // Create a scored array with the original index preserved
  const scoredNames = nameArray.map((name, index) => {
    let score = 1000 - index; // Position score: earlier = higher score
    
    // First position gets a HUGE bonus
    if (index === 0) {
      score += 5000;
      console.log(`First position bonus for: "${name}"`);
    }
    
    // Second and third positions get smaller bonuses
    if (index === 1) score += 1000;
    if (index === 2) score += 500;
    
    // Shorter names get higher scores (common names tend to be shorter)
    const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim(); // Remove language markers
    if (cleanName.length < 15) {
      score += (15 - cleanName.length) * 20;
    }
    
    // Names without language markers get a bonus
    if (!name.includes('(')) {
      score += 200;
    }
    
    // Well-known common names get a big bonus
    const lowerName = cleanName.toLowerCase();
    const wellKnownNames = [
      'frangipani', 'plumeria', 'temple tree', 'temple flower', 
      'pagoda tree', 'lei flower', 'champa', 'red jasmine'
    ];
    
    if (wellKnownNames.includes(lowerName)) {
      score += 2000;
      console.log(`Well-known name bonus for: "${name}"`);
    }
    
    // Common names in English often contain these words
    const commonTerms = ['flower', 'tree', 'jasmine', 'rose'];
    for (const term of commonTerms) {
      if (lowerName.includes(term)) {
        score += 100;
        break;
      }
    }
    
    return { name, score, original: name };
  });
  
  // Sort by score (highest first)
  scoredNames.sort((a, b) => b.score - a.score);
  
  // Log top names and their scores for debugging
  console.log(`Top 5 scored names: ${scoredNames.slice(0, 5).map(n => 
    `"${n.name}" (${n.score})`).join(', ')}`);
  
  // Now we'll select names to ensure language diversity
  const selectedNames: string[] = [];
  const seenLanguages = new Set<string>();
  
  // Track seen name roots to avoid duplication (e.g., "Red Frangipani" and "Frangipani")
  const seenNameRoots = new Set<string>();
  
  // First pass: take the top N scored names
  const initialTopCount = Math.min(3, scoredNames.length);
  for (let i = 0; i < initialTopCount; i++) {
    if (i < scoredNames.length) {
      const name = scoredNames[i].name;
      selectedNames.push(name);
      
      // Extract language if present
      const langMatch = name.match(/\((.*?)\)/);
      if (langMatch) {
        seenLanguages.add(langMatch[1].toLowerCase());
      }
      
      // Add name root to seen set
      const nameRoot = name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      seenNameRoots.add(nameRoot);
    }
  }
  
  // Second pass: add diverse language names up to maxCount
  for (let i = initialTopCount; i < scoredNames.length && selectedNames.length < maxCount; i++) {
    const item = scoredNames[i];
    const name = item.name;
    
    // Extract language if present
    const langMatch = name.match(/\((.*?)\)/);
    const language = langMatch ? langMatch[1].toLowerCase() : 'unspecified';
    
    // Extract name root
    const nameRoot = name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    
    // Skip if we already have a similar name
    if (seenNameRoots.has(nameRoot)) continue;
    
    // Prioritize names from new languages
    if (!seenLanguages.has(language)) {
      selectedNames.push(name);
      seenLanguages.add(language);
      seenNameRoots.add(nameRoot);
    }
  }
  
  // If we still have room, add remaining top-scoring names
  for (let i = 0; i < scoredNames.length && selectedNames.length < maxCount; i++) {
    const item = scoredNames[i];
    
    // Skip already selected names
    if (selectedNames.includes(item.name)) continue;
    
    // Extract name root
    const nameRoot = item.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    
    // Skip if we already have a similar name
    if (seenNameRoots.has(nameRoot)) continue;
    
    selectedNames.push(item.name);
    seenNameRoots.add(nameRoot);
  }
  
  // Join and enforce character limit
  let result = selectedNames.join(', ');
  if (result.length > maxLength) {
    result = result.substring(0, maxLength) + '...';
  }
  
  return result;
}