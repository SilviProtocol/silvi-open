This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


What the species page should accomplish:
1. display all of the species konwledge data we have in our species database in a user freindly, neat, clean UI similar to Wikipedia pages. 
2. disntinguish between data fields we already have populated, the fields that are researched during the AI research process, and empty fields that don't currently have data but are still apart of our schema and may be populated in the future. 
3. distinguish between 'researched' vs 'unresearched' species pages, where 'unresearched' includes visable cues and messages that encourage users to sponsor that species to fund the AI research process. After the research process is completed (the fund-research API call), the species should be changed to 'researched' and the page should just present all the data in a clean way.
4. some fields have too much data, for example 'common_name' for very popular species can have dozens of entries that turn into a giant text block. The way this was addressed in our old version was having an expand arrow that opens to a heigh restricted scrollable container to display the contents. I think that still makes sense. 
5. it's important we have visiable loading indiactors when the research process is happening, as it takes about 20-30 seconds. It would be awesome if we could have it cycle through messages like "scanning the forest..." "calling my botanist neighbor..." "sifting through the soil..."
6. some fields will have base data or human researched data as well as AI researched data. This is why we've duplicated these fields into _ai and _human suffixed field names. We want to display both fields in the same place on the frontend, but with a subtle visual cue indicating the difference. One approach is to color code the text and then add a key at the top of the container somewhere that explains what the color code means. If there is a better way to make this clear, please explore it. 
7. please maintain the categories: Overview, Geographic Distribution, Ecological Characteristics, Physical Characteristics, Stewardship & Utility, and Research & Data

--------------------------------------

# Species Page Rebuild Plan

## Architecture Overview

We'll rebuild the Species Page with a focus on modularity, maintainability, and user experience following these high-level principles:

1. **Component-based architecture** with clear separation of concerns
2. **Data management** that handles AI/human field variants efficiently
3. **UI/UX improvements** for better information hierarchy and user guidance
4. **Performance optimizations** to ensure smooth experience
5. **Responsive design** using a mobile-first approach

## Technical Context (Based on Database and API Review)

### Database Schema Analysis
- Species table has both base fields and AI/human-specific variants (`*_ai` and `*_human` suffixes)
- The `researched` boolean flag on the species table indicates if a species has undergone AI research
- The database uses numeric types for measurements (e.g., `maximum_height_ai` as numeric(10,2)) 
- Ginkgo biloba example (`AngGiGiGN21141-00`) shows some fields have AI data but is marked as `researched: false`

### Research Process Understanding
- The research process is initiated via the `/research/fund-research` endpoint
- Research data is generated using Perplexity API for raw data and ChatGPT for structuring
- Data is saved specifically to `*_ai` suffixed fields in the database (never legacy fields)
- The API sets `researched: true` flag during the update process
- The process takes approximately 20-30 seconds to complete

### API Integration Points
- Species data retrieval: `getSpeciesById(taxon_id)` → `/species/:taxon_id`
- Research data retrieval: `getResearchData(taxon_id)` → `/research/research/:taxon_id`
- Fund research: `fundResearch(taxon_id, wallet_address, chain, transaction_hash, ipfs_cid, scientific_name)` → POST `/research/fund-research`
- Both species and research data need to be fetched independently and merged on the frontend

## File Structure

```
/app/species/[taxon_id]/
├── page.tsx (main container)
├── components/
│   ├── SpeciesHeader.tsx (title, scientific name, common names)
│   ├── ResearchStatusBanner.tsx (researched/unresearched indicator)
│   ├── ResearchCard.tsx (funding card for sidebar)
│   ├── TabContainer.tsx (tab navigation)
│   ├── DataField.tsx (reusable field display with AI/human distinction)
│   ├── ExpandableContent.tsx (for long text with show more/less)
│   ├── ResearchLoadingState.tsx (animated loading indicators)
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── GeographicTab.tsx
│   │   ├── EcologicalTab.tsx
│   │   ├── PhysicalTab.tsx
│   │   ├── StewardshipTab.tsx
│   │   └── ResearchDataTab.tsx
│   └── display/
│       ├── ConservationStatusBadge.tsx
│       ├── FieldsProgressIndicator.tsx
│       └── EmptyStateMessage.tsx
└── hooks/
    ├── useSpeciesData.ts (data fetching and state management)
    ├── useResearchStatus.ts (determines if species is researched)
    └── useResearchProcess.ts (handles research funding flow)
```

## Core Components and Their Responsibilities

### 1. Main Container (`page.tsx`)
- Overall page layout (two-column on desktop, stacked on mobile)
- Error, loading, and empty states
- Context providers for species data
- Mobile/desktop layout switching

### 2. SpeciesHeader Component
- Displays scientific name with proper formatting
- Expandable common names with show more/less functionality
- Basic taxonomy fields (family, genus)

### 3. TabContainer Component
- Tab navigation for the different categories
- Handles responsive behavior (horizontal tabs on desktop, dropdown on mobile)
- Lazy loading of tab content for performance

### 4. DataField Component (core reusable component)
- Handles display of field data with AI/human variants 
- Visual distinction between AI and human data
- Proper formatting of different data types (strings, lists, etc.)
- Empty state handling

### 5. ResearchCard Component
- Status indicator (researched/unresearched)
- Funding form with wallet connection check
- Progress indicators for research in progress
- Research process explainer

## Data Management Strategy

### 1. Custom Hook: `useSpeciesData`
```typescript
function useSpeciesData(taxonId: string) {
  // Fetch both species base data and research data in parallel
  const speciesQuery = useQuery({
    queryKey: ['species', taxonId],
    queryFn: () => getSpeciesById(taxonId),
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
  
  const researchQuery = useQuery({
    queryKey: ['research', taxonId],
    queryFn: () => getResearchData(taxonId),
    staleTime: 5000, // Consider research data fresh for only 5 seconds
    // Don't retry on 404 - it means research not available yet
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });
  
  // Derived state - unified data access with proper fallbacks
  const isResearched = useMemo(() => { 
    // First check explicit researched flag (most reliable)
    if (speciesQuery.data?.researched === true) {
      return true;
    }
    
    // Fallback: check if any AI research fields are populated 
    const hasAnyAiData = Object.keys(speciesQuery.data || {})
      .some(key => 
        key.endsWith('_ai') && 
        speciesQuery.data[key] !== null && 
        speciesQuery.data[key] !== '' &&
        typeof speciesQuery.data[key] === 'string' &&
        speciesQuery.data[key].trim() !== ''
      );
      
    return hasAnyAiData;
  }, [speciesQuery.data, researchQuery.data]);
  
  // Helper for accessing field values with precedence:
  // 1. Human data (if available)
  // 2. AI data (if available)
  // 3. Legacy data (if available)
  const getFieldValue = useCallback((fieldName) => {
    const humanField = `${fieldName}_human`;
    const aiField = `${fieldName}_ai`;
    let value = null;
    let source = null;
    
    // Check human data first (highest priority)
    if (speciesQuery.data?.[humanField] || researchQuery.data?.[humanField]) {
      value = speciesQuery.data?.[humanField] || researchQuery.data?.[humanField];
      source = 'human';
    }
    // Then check AI data
    else if (speciesQuery.data?.[aiField] || researchQuery.data?.[aiField]) {
      value = speciesQuery.data?.[aiField] || researchQuery.data?.[aiField];
      source = 'ai';
    }
    // Finally check legacy data (lowest priority)
    else if (speciesQuery.data?.[fieldName]) {
      value = speciesQuery.data?.[fieldName];
      source = 'legacy';
    }
    
    return { value, source };
  }, [speciesQuery.data, researchQuery.data]);
  
  return {
    species: speciesQuery.data,
    researchData: researchQuery.data,
    isLoading: speciesQuery.isLoading || researchQuery.isLoading,
    isError: speciesQuery.isError || researchQuery.isError,
    isResearched,
    getFieldValue,
    refetchSpecies: speciesQuery.refetch,
    refetchResearch: researchQuery.refetch
  };
}
```

### 2. Research Process Hook: `useResearchProcess`

```typescript
function useResearchProcess(taxonId: string, species, address) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchStatus, setResearchStatus] = useState('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const pollIntervalRef = useRef(null);
  const { refetchSpecies, refetchResearch } = useSpeciesData(taxonId);
  
  // Cycling research messages
  const researchMessages = [
    "Scanning the forest canopy...",
    "Consulting botanical references...",
    "Exploring native habitats...",
    "Analyzing growth patterns...",
    "Documenting ecological relationships...",
    "Examining soil preferences...",
    "Cataloging cultural significance...",
    "Mapping geographical distribution..."
  ];
  
  const startResearch = useCallback(async () => {
    if (!species || !address || isResearching) return;
    
    setIsResearching(true);
    setResearchStatus('starting');
    
    try {
      // Use a randomly generated transaction hash for testing
      // In production, this would come from an actual blockchain transaction
      const transactionHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      const tempIpfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const scientificName = species.species_scientific_name || species.species;
      
      setResearchStatus('processing');
      // Start cycling through messages
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setProgressMessage(researchMessages[messageIndex % researchMessages.length]);
        messageIndex++;
      }, 3000);
      
      // Call the fundResearch API
      const response = await fundResearch(
        taxonId, 
        address, 
        "celo", // Default to Celo for now
        transactionHash, 
        tempIpfsCid, 
        scientificName
      );
      
      // Start polling for research completion
      startPollingForResearch();
      
      // Clean up message cycling
      clearInterval(messageInterval);
    } catch (error) {
      setResearchStatus('error');
      console.error('Research error:', error);
      toast.error(error.message || 'Failed to start research');
      setIsResearching(false);
    }
  }, [taxonId, species, address, isResearching]);
  
  // Polling implementation with exponential backoff
  const startPollingForResearch = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const baseInterval = 3000; // Start with 3 seconds
    
    const pollForData = async () => {
      if (attempts >= maxAttempts) {
        setResearchStatus('timeout');
        setIsResearching(false);
        return;
      }
      
      attempts++;
      const backoffFactor = Math.min(1.5, 1 + (attempts / 10)); // Gradual backoff
      const nextInterval = baseInterval * backoffFactor;
      
      try {
        // Refetch both data sources
        const [speciesResult, researchResult] = await Promise.all([
          refetchSpecies(),
          refetchResearch()
        ]);
        
        // Check if research completed
        if (speciesResult.data?.researched === true || 
            researchResult.data?.general_description_ai) {
          setResearchStatus('complete');
          setIsResearching(false);
          return;
        }
        
        // Schedule next poll with increasing interval
        pollIntervalRef.current = setTimeout(pollForData, nextInterval);
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling despite errors
        pollIntervalRef.current = setTimeout(pollForData, nextInterval);
      }
    };
    
    // Start polling after initial delay
    pollIntervalRef.current = setTimeout(pollForData, 2000);
  }, [refetchSpecies, refetchResearch]);
  
  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
    };
  }, []);
  
  return {
    isResearching,
    researchStatus,
    progressMessage,
    startResearch
  };
}
```

## UI Approaches

### 1. AI vs Human Data Distinction
- Use a subtle border-left color indicator for AI data (green) vs human data (blue)
- Include a legend at the top of the page showing what the colors mean
- For each field, order human data first, then AI data if both exist

### 2. Research Status Indicators
- Clear banner at the top for unresearched species
- Visual progress indicator showing how many fields have been researched
- Call-to-action buttons integrated naturally into the content flow

### 3. Expandable Content
- For long text fields: show first 2-3 lines with "Show more" toggle
- For list fields (like common names): show first 3-5 items with expandable view
- Use height-restricted containers with subtle scrollbars for expanded content

### 4. Research Process Loading States
- Overlay with semi-transparent backdrop
- Animated progress indicator
- Cycling through friendly, engaging messages:
  - "Scanning the forest canopy..."
  - "Consulting botanical references..."
  - "Exploring native habitats..."
  - "Analyzing growth patterns..."
  - "Documenting ecological relationships..."

## Field Mapping by Category

Based on the database schema and frontend requirements, here's how fields will be organized:

### Overview Tab
```typescript
const overviewFields = [
  { label: "Scientific Name", key: "species_scientific_name" },
  { label: "Common Name", key: "common_name" },
  { label: "General Description", key: "general_description", hasAiHuman: true },
  { label: "Accepted Scientific Name", key: "accepted_scientific_name" },
  { label: "Family", key: "family" },
  { label: "Genus", key: "genus" },
  { label: "Subspecies", key: "subspecies" },
  { label: "Specific Epithet", key: "specific_epithet" },
  { label: "Synonyms", key: "synonyms" },
  { label: "Taxonomic Order", key: "taxonomic_order" },
  { label: "Class", key: "class" }
];
```

### Geographic Tab
```typescript
const geographicFields = [
  { label: "Biomes", key: "biomes" },
  { label: "Countries Native", key: "countries_native" },
  { label: "Countries Introduced", key: "countries_introduced" },
  { label: "Countries Invasive", key: "countries_invasive" },
  { label: "Common Countries", key: "common_countries" },
  { label: "Ecoregions", key: "ecoregions" },
  { label: "Elevation Ranges", key: "elevation_ranges", hasAiHuman: true }
];
```

### Ecological Tab
```typescript
const ecologicalFields = [
  { label: "Ecological Function", key: "ecological_function", hasAiHuman: true },
  { label: "Conservation Status", key: "conservation_status", hasAiHuman: true },
  { label: "National Conservation Status", key: "national_conservation_status" },
  { label: "Habitat", key: "habitat", hasAiHuman: true },
  { label: "Native Adapted Habitats", key: "native_adapted_habitats", hasAiHuman: true },
  { label: "Forest Type", key: "forest_type" },
  { label: "Wetland Type", key: "wetland_type" },
  { label: "Urban Setting", key: "urban_setting" },
  { label: "Climate Change Vulnerability", key: "climate_change_vulnerability" },
  { label: "Associated Species", key: "associated_species" },
  { label: "Successional Stage", key: "successional_stage" },
  { label: "Tolerances", key: "tolerances" },
  { label: "Forest Layers", key: "forest_layers" },
  { label: "Threats", key: "threats" }
];
```

### Physical Tab
```typescript
const physicalFields = [
  { label: "Growth Form", key: "growth_form", hasAiHuman: true },
  { label: "Leaf Type", key: "leaf_type", hasAiHuman: true },
  { label: "Deciduous/Evergreen", key: "deciduous_evergreen", hasAiHuman: true },
  { label: "Flower Color", key: "flower_color", hasAiHuman: true },
  { label: "Fruit Type", key: "fruit_type", hasAiHuman: true },
  { label: "Bark Characteristics", key: "bark_characteristics", hasAiHuman: true },
  { label: "Maximum Height (m)", key: "maximum_height", hasAiHuman: true, type: "numeric" },
  { label: "Maximum Diameter (m)", key: "maximum_diameter", hasAiHuman: true, type: "numeric" },
  { label: "Lifespan", key: "lifespan", hasAiHuman: true },
  { label: "Maximum Tree Age (Years)", key: "maximum_tree_age", hasAiHuman: true, type: "numeric" },
  { label: "Allometric Models", key: "allometric_models" },
  { label: "Allometric Curve", key: "allometric_curve" }
];
```

### Stewardship Tab
```typescript
const stewardshipFields = [
  { label: "Stewardship Best Practices", key: "stewardship_best_practices", hasAiHuman: true },
  { label: "Agroforestry Use Cases", key: "agroforestry_use_cases", hasAiHuman: true },
  { label: "Compatible Soil Types", key: "compatible_soil_types", hasAiHuman: true },
  { label: "Planting Recipes", key: "planting_recipes", hasAiHuman: true },
  { label: "Pruning & Maintenance", key: "pruning_maintenance", hasAiHuman: true },
  { label: "Disease & Pest Management", key: "disease_pest_management", hasAiHuman: true },
  { label: "Fire Management", key: "fire_management", hasAiHuman: true },
  { label: "Cultural Significance", key: "cultural_significance", hasAiHuman: true },
  { label: "Timber Value", key: "timber_value" },
  { label: "Non-Timber Products", key: "non_timber_products" },
  { label: "Cultivars", key: "cultivars" },
  { label: "Nutritional/Caloric Value", key: "nutritional_caloric_value" },
  { label: "Cultivation Details", key: "cultivation_details" }
];
```

### Research Data Tab
```typescript
const researchDataFields = [
  { label: "Total Occurrences", key: "total_occurrences", type: "numeric" },
  { label: "Verification Status", key: "verification_status" },
  { label: "Data Sources", key: "data_sources" },
  { label: "Reference List", key: "reference_list" },
  { label: "IPFS CID", key: "ipfs_cid" },
  { label: "Last Updated", key: "last_updated_date", type: "date" }
];
```

## Mobile Optimization

- Stack layout: info column first, funding card below on mobile
- Convert horizontal tabs to dropdown selector on small screens
- Collapse longer sections with "Show more" toggles
- Optimize touch targets for better mobile interaction

## Performance Considerations

1. **Code splitting**: Each tab will be a separate dynamic import
2. **Memoization**: Use React.memo and useMemo for expensive renders
3. **Virtualization**: For sections with many fields, use virtualized lists
4. **Skeleton UI**: Show skeleton placeholders during loading
5. **Optimistic UI**: Update UI immediately on research funding, then confirm with backend

## Implementation Plan

### Phase 1: Core Structure
1. Set up basic page layout with responsive design
2. Implement data fetching hooks with proper error handling
3. Create skeleton UI for all main components

### Phase 2: Field Display Components
1. Build the DataField component with AI/human variation handling
2. Implement tab navigation system
3. Create the basic structure for each tab

### Phase 3: Research Process
1. Implement the research card with funding flow
2. Build loading states with animated messages
3. Create the polling mechanism for checking research status

### Phase 4: UI Refinement
1. Add expandable content components
2. Implement progress indicators
3. Add subtle animations and transitions
4. Optimize mobile experience

### Phase 5: Testing & Optimization
1. Test on various devices and screen sizes
2. Performance profiling and optimization
3. Accessibility improvements
4. Final polish on visual elements

## Challenging Areas & Solutions

### 1. Data Field Precedence
**Challenge**: Determining which version of a field to display (human, AI, or legacy)
**Solution**: Create a unified data access layer that applies consistent precedence rules

### 2. Long Polling for Research Status
**Challenge**: Providing feedback during the 20-30 second research process
**Solution**: Implement a robust polling system with exponential backoff and progress indication

### 3. Responsive Layout for Complex Data
**Challenge**: Maintaining usability on small screens with dense information
**Solution**: Progressive disclosure pattern - show essential info first with option to expand

### 4. Performance with Many Fields
**Challenge**: Rendering potentially hundreds of data fields smoothly
**Solution**: Virtualize field rendering and use code splitting for tabs

### 5. Research Status Determination 
**Challenge**: The `researched` flag is the primary indicator, but we need a fallback check
**Solution**: Implement a multi-tier check that first checks the flag, then checks for AI data fields

This plan creates a maintainable, user-friendly species page that addresses all the key requirements while significantly improving code quality and user experience over the previous implementation.

cd /root/silvi-open/treekipedia-new && node
scripts/reset_researched_flags.js