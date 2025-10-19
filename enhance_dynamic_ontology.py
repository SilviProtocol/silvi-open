#!/usr/bin/env python3
"""
Exact fixes for incremental_ontology_updater.py
==============================================
Apply these specific changes to fix the HTTP 415 error
"""

# FIX 1: Change the __init__ method (around line 12)
# FIND:
"""
def __init__(self, blazegraph_endpoint: str):
    # FIXED: Separate query and update endpoints
    if blazegraph_endpoint.endswith('/sparql'):
        self.blazegraph_sparql = blazegraph_endpoint  # For SELECT queries
        self.blazegraph_update = blazegraph_endpoint  # For UPDATE queries (same endpoint in Blazegraph)
    else:
        self.blazegraph_sparql = f"{blazegraph_endpoint}/sparql"
        self.blazegraph_update = f"{blazegraph_endpoint}/sparql"
    
    self.blazegraph_data = blazegraph_endpoint.replace('/sparql', '/data')
    
    logger.info(f"Blazegraph Query Endpoint: {self.blazegraph_sparql}")
    logger.info(f"Blazegraph Update Endpoint: {self.blazegraph_update}")
"""

# REPLACE WITH:
"""
def __init__(self, fuseki_endpoint: str):
    # FIXED: Use Fuseki endpoints instead of Blazegraph
    if fuseki_endpoint.endswith('/sparql'):
        base_url = fuseki_endpoint.replace('/sparql', '')
        self.fuseki_sparql = fuseki_endpoint  # For SELECT queries
        self.fuseki_update = f"{base_url}/update"  # For UPDATE queries (different endpoint in Fuseki)
    elif fuseki_endpoint.endswith('/update'):
        base_url = fuseki_endpoint.replace('/update', '')
        self.fuseki_sparql = f"{base_url}/sparql"
        self.fuseki_update = fuseki_endpoint
    else:
        # Assume base URL provided
        self.fuseki_sparql = f"{fuseki_endpoint}/sparql"
        self.fuseki_update = f"{fuseki_endpoint}/update"
    
    self.fuseki_data = f"{fuseki_endpoint}/data"
    
    logger.info(f"Fuseki Query Endpoint: {self.fuseki_sparql}")
    logger.info(f"Fuseki Update Endpoint: {self.fuseki_update}")
"""

# FIX 2: Update the query methods to use Fuseki endpoints
# FIND all instances of "self.blazegraph_sparql" and replace with "self.fuseki_sparql"

# FIX 3: Fix the _insert_triples method (around line 418)
# FIND:
"""
response = requests.post(
    self.blazegraph_update,
    data=query_encoded,  # Send properly encoded UTF-8 data
    headers=headers,
    timeout=600 
)

logger.info(f"Blazegraph response: {response.status_code}")
if response.text:
    logger.debug(f"Response text: {response.text[:200]}...")

if response.status_code not in [200, 204]:
    logger.error(f"Blazegraph error: {response.status_code}")
    logger.error(f"Response: {response.text}")
    return False
"""

# REPLACE WITH:
"""
# Try different content types for Fuseki compatibility
content_types = [
    ('application/sparql-update; charset=utf-8', lambda q: q),
    ('application/x-www-form-urlencoded', lambda q: {'update': q.decode('utf-8')}),
    ('text/plain; charset=utf-8', lambda q: q)
]

response = None
for content_type, data_formatter in content_types:
    headers = {
        'Content-Type': content_type,
        'Accept': 'application/sparql-results+json'
    }
    
    data = data_formatter(query_encoded)
    
    try:
        response = requests.post(
            self.fuseki_update,
            data=data,
            headers=headers,
            timeout=600 
        )
        
        logger.info(f"Fuseki response: {response.status_code}")
        if response.text:
            logger.debug(f"Response text: {response.text[:200]}...")
        
        # FIXED: Both 200 and 204 are success responses
        if response.status_code in [200, 204]:
            return True
        elif response.status_code == 415:
            logger.warning(f"HTTP 415 with {content_type}, trying next content type...")
            continue
        else:
            logger.error(f"Fuseki error: {response.status_code}")
            logger.error(f"Response: {response.text}")
            break
            
    except Exception as e:
        logger.error(f"Request error with {content_type}: {e}")
        if content_type == content_types[-1][0]:  # Last attempt
            raise e
        continue

# If we get here, all attempts failed
return False
"""

print("=" * 70)
print("STEP-BY-STEP FIXES FOR incremental_ontology_updater.py")
print("=" * 70)
print()
print("1. 📝 Open incremental_ontology_updater.py in your editor")
print()
print("2. 🔧 FIX 1: Change the constructor (around line 12)")
print("   FIND: def __init__(self, blazegraph_endpoint: str):")
print("   CHANGE TO: def __init__(self, fuseki_endpoint: str):")
print()
print("3. 🔧 FIX 2: Update endpoint assignments")
print("   FIND: self.blazegraph_sparql = ...")
print("   CHANGE TO: self.fuseki_sparql = ...")
print("   FIND: self.blazegraph_update = ...")  
print("   CHANGE TO: self.fuseki_update = ...")
print()
print("4. 🔧 FIX 3: Fix Fuseki update endpoint (IMPORTANT!)")
print("   In the constructor, make sure update endpoint is:")
print("   self.fuseki_update = f\"{base_url}/update\"")
print("   NOT f\"{base_url}/sparql\"")
print()
print("5. 🔧 FIX 4: Update all method calls")
print("   Find ALL instances of 'self.blazegraph_sparql'")
print("   Replace with 'self.fuseki_sparql'")
print()
print("6. 🔧 FIX 5: Fix the _insert_triples method (around line 418)")
print("   FIND: response = requests.post(self.blazegraph_update, ...)")
print("   REPLACE with the retry logic shown above")
print()
print("7. 🔧 FIX 6: Fix the status code check")
print("   FIND: if response.status_code not in [200, 204]:")
print("   This is actually CORRECT - keep it!")
print("   BUT make sure it's inside the retry loop")
print()
print("8. 💾 Save the file")
print()
print("9. 🔧 FIX 7: Update your calling code")
print("   When you create the updater, use your Fuseki endpoint:")
print("   updater = IncrementalOntologyUpdater('http://167.172.143.162:3030/treekipedia')")
print("   NOT the Blazegraph endpoint!")
print()
print("=" * 70)
print("🚨 CRITICAL: The main issue is using the wrong endpoint type!")
print("   Blazegraph: same endpoint for query/update")  
print("   Fuseki: different endpoints (/sparql vs /update)")
print("=" * 70)