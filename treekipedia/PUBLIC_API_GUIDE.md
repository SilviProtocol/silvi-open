# Treekipedia Public API Guide

## Overview

Treekipedia provides a public API endpoint for accessing native species recommendations by ecoregion. This endpoint is designed for external partners, researchers, and developers who want to integrate native species data into their applications.

---

## Public Endpoint

### Get Native Species by Ecoregion

**Endpoint:** `GET /api/geospatial/ecoregions/native-species/:ecoregion_name`

**Base URL:** `https://treekipedia-api.silvi.earth`

**Authentication:** Required (API Key via `x-api-key` header)

**Rate Limit:** 60 requests per minute per API key

---

## Authentication

All requests to the public API must include a valid API key in the request headers.

### Header Format
```
x-api-key: treeki_live_xxxxxxxxxxxxxxxx
```

### Getting an API Key

Contact the Treekipedia team to request an API key:
- Website: https://treekipedia.silvi.earth
- Email: info@silvi.earth

---

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ecoregion_name` | string | Yes | Name of the ecoregion (e.g., "Appalachian-Blue Ridge forests") |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `native_only` | boolean | `true` | Filter to species native to the ecoregion's countries |
| `exclude_invasive` | boolean | `true` | Exclude species that are invasive in the ecoregion's countries |
| `limit` | integer | `1000` | Maximum number of species to return (max: 1000) |

---

## Response Format

### Success Response (200 OK)

```json
{
  "ecoregion": {
    "eco_id": 20401,
    "eco_name": "Appalachian-Blue Ridge forests",
    "biome_name": "Temperate Broadleaf & Mixed Forests",
    "realm": "Nearctic",
    "area_km2": 120345.67
  },
  "countries_in_ecoregion": [
    "United States"
  ],
  "filters_applied": {
    "native_only": true,
    "exclude_invasive": true
  },
  "species_count": 342,
  "species": [
    {
      "taxon_id": 47126,
      "taxon_full": "Acer rubrum",
      "scientific_name": "Acer rubrum",
      "common_name": "Red Maple",
      "family": "Sapindaceae",
      "genus": "Acer"
    },
    {
      "taxon_id": 47850,
      "taxon_full": "Quercus rubra",
      "scientific_name": "Quercus rubra",
      "common_name": "Northern Red Oak",
      "family": "Fagaceae",
      "genus": "Quercus"
    }
    // ... more species
  ]
}
```

### Error Responses

#### 401 Unauthorized - Missing API Key
```json
{
  "error": "API key required",
  "message": "Please provide an API key in the x-api-key header. Contact us at https://treekipedia.silvi.earth for access.",
  "documentation": "https://treekipedia.silvi.earth/docs/api"
}
```

#### 403 Forbidden - Invalid API Key
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid or has been revoked."
}
```

#### 404 Not Found - Ecoregion Not Found
```json
{
  "error": "Ecoregion not found or no countries intersect this ecoregion"
}
```

#### 429 Too Many Requests - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute per API key",
  "retryAfter": 45
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

---

## Example Usage

### cURL

```bash
curl "https://treekipedia-api.silvi.earth/api/geospatial/ecoregions/native-species/Appalachian-Blue%20Ridge%20forests?limit=10&native_only=true&exclude_invasive=true" \
  -H "x-api-key: treeki_live_your_api_key_here"
```

### JavaScript (Fetch API)

```javascript
const apiKey = 'treeki_live_your_api_key_here';
const ecoregion = 'Appalachian-Blue Ridge forests';

fetch(`https://treekipedia-api.silvi.earth/api/geospatial/ecoregions/native-species/${encodeURIComponent(ecoregion)}?limit=10`, {
  headers: {
    'x-api-key': apiKey
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.species_count} species in ${data.ecoregion.eco_name}`);
    data.species.forEach(species => {
      console.log(`- ${species.common_name} (${species.scientific_name})`);
    });
  })
  .catch(error => console.error('Error:', error));
```

### Python (requests)

```python
import requests

api_key = 'treeki_live_your_api_key_here'
ecoregion = 'Appalachian-Blue Ridge forests'

headers = {
    'x-api-key': api_key
}

params = {
    'limit': 10,
    'native_only': 'true',
    'exclude_invasive': 'true'
}

response = requests.get(
    f'https://treekipedia-api.silvi.earth/api/geospatial/ecoregions/native-species/{ecoregion}',
    headers=headers,
    params=params
)

data = response.json()
print(f"Found {data['species_count']} species in {data['ecoregion']['eco_name']}")

for species in data['species']:
    print(f"- {species['common_name']} ({species['scientific_name']})")
```

### Node.js (axios)

```javascript
const axios = require('axios');

const apiKey = 'treeki_live_your_api_key_here';
const ecoregion = 'Appalachian-Blue Ridge forests';

axios.get(
  `https://treekipedia-api.silvi.earth/api/geospatial/ecoregions/native-species/${encodeURIComponent(ecoregion)}`,
  {
    headers: {
      'x-api-key': apiKey
    },
    params: {
      limit: 10,
      native_only: true,
      exclude_invasive: true
    }
  }
)
  .then(response => {
    const data = response.data;
    console.log(`Found ${data.species_count} species in ${data.ecoregion.eco_name}`);
    data.species.forEach(species => {
      console.log(`- ${species.common_name} (${species.scientific_name})`);
    });
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

---

## Rate Limiting

- **Limit:** 60 requests per minute per API key
- **Headers:** Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: ISO timestamp when the rate limit resets

---

## CORS Support

This endpoint supports Cross-Origin Resource Sharing (CORS) and can be called from any domain. This allows you to use the API directly from web browsers.

---

## Common Ecoregion Names

Here are some example ecoregion names you can query:

- `Appalachian-Blue Ridge forests`
- `Eastern Cascades forests`
- `California Central Valley grasslands`
- `Puget lowland forests`
- `Southeastern mixed forests`

To find more ecoregion names, you can use the ecoregion boundaries endpoint (contact us for access).

---

## Best Practices

1. **Cache responses** - Species data doesn't change frequently, so cache results locally
2. **Respect rate limits** - Implement exponential backoff if you hit rate limits
3. **Handle errors gracefully** - Always check for error responses
4. **URL encode parameters** - Make sure to URL encode ecoregion names (spaces → %20)
5. **Use appropriate limits** - Request only the data you need to reduce load

---

## API Key Management

### Adding New API Keys

To add a new API key for external partners:

1. Generate a new key:
   ```bash
   node -e "console.log('treeki_live_' + require('crypto').randomBytes(20).toString('hex'))"
   ```

2. Add it to your `.env` file:
   ```bash
   API_KEYS=existing_key1,existing_key2,new_key_here
   ```

3. Restart your backend server:
   ```bash
   pm2 restart server
   ```

### Revoking API Keys

To revoke an API key:

1. Remove it from the `API_KEYS` list in `.env`
2. Restart the backend server
3. The key will be immediately invalidated

---

## Support

For questions, issues, or feature requests:

- GitHub Issues: https://github.com/SilviProtocol/silvi-open/issues
- Website: https://treekipedia.silvi.earth
- Email: info@silvi.earth

---

## Changelog

### 2025-10-20
- Initial public API release
- Native species by ecoregion endpoint
- API key authentication
- Rate limiting (60 req/min per key)
