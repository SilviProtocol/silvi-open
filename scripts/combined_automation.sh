#!/bin/bash
# enhanced_combined_automation.sh
# This script runs both the configuration automation and ontology generation processes
# with improved error handling and logging, and ensures proper Blazegraph integration

# Set the path to your Python executable and project directory
PYTHON_PATH="/usr/bin/python3"  # Use system Python if virtual env not available
PROJECT_DIR="/var/www/biodiversity-ontology"  # Standard deployment location
CONFIG_FILE="automation_config.json"
LOG_DIR="logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MAIN_LOG="${LOG_DIR}/automation_${TIMESTAMP}.log"

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Log function
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a $MAIN_LOG
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    if [ ! -z "$2" ] && [ "$2" = "fatal" ]; then
        log "Fatal error occurred. Exiting."
        exit 1
    fi
}

# Function to check if a process is running
is_process_running() {
    if pgrep -f "$1" > /dev/null; then
        return 0  # Process is running
    else
        return 1  # Process is not running
    fi
}

# Function to check and ensure Blazegraph is running
check_blazegraph() {
    if grep -q "blazegraph_endpoint" $CONFIG_FILE && ! grep -q "blazegraph_endpoint.*null" $CONFIG_FILE; then
        log "Checking Blazegraph status..."
        
        # Extract the Blazegraph endpoint from the config file
        ENDPOINT=$(grep -o '"blazegraph_endpoint"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
        NAMESPACE=$(echo $ENDPOINT | grep -oP '(?<=namespace/)[^/]+')
        
        # Check if Java process for Blazegraph is running
        if ! is_process_running "blazegraph.jar"; then
            log "Blazegraph process is not running. Attempting to start Blazegraph..."
            
            # Check if running as root or sudo is needed
            if [ "$(id -u)" -eq 0 ]; then
                systemctl start blazegraph || handle_error "Failed to start Blazegraph service" "fatal"
            else
                sudo systemctl start blazegraph || handle_error "Failed to start Blazegraph service with sudo" "fatal"
            fi
            
            # Wait for Blazegraph to start
            log "Waiting for Blazegraph to initialize..."
            WAIT_COUNT=0
            MAX_WAIT=30
            while ! curl -s --head "$ENDPOINT" | grep "200 OK" > /dev/null; do
                WAIT_COUNT=$((WAIT_COUNT + 1))
                if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
                    handle_error "Blazegraph failed to start after waiting $MAX_WAIT seconds" "fatal"
                fi
                sleep 1
            done
            log "Blazegraph started successfully"
        fi
        
        # Check if the endpoint is reachable
        if curl -s --head "$ENDPOINT" | grep "200 OK" > /dev/null; then
            log "Blazegraph endpoint is reachable at $ENDPOINT"
            
            # Verify the namespace exists
            NAMESPACE_URL=$(echo $ENDPOINT | sed 's|/namespace/.*$|/namespace|')
            if curl -s "$NAMESPACE_URL" | grep -q "$NAMESPACE"; then
                log "Blazegraph namespace '$NAMESPACE' exists"
            else
                log "Creating Blazegraph namespace '$NAMESPACE'..."
                # Create basic properties for the namespace
                TEMP_PROPS=$(mktemp)
                echo "com.bigdata.rdf.sail.namespace=$NAMESPACE" > $TEMP_PROPS
                echo "com.bigdata.rdf.store.AbstractTripleStore.textIndex=true" >> $TEMP_PROPS
                echo "com.bigdata.rdf.store.AbstractTripleStore.axiomsClass=com.bigdata.rdf.axioms.OwlAxioms" >> $TEMP_PROPS
                
                # Create the namespace
                if curl -s -X POST --data-binary @$TEMP_PROPS -H 'Content-Type: text/plain' "$NAMESPACE_URL"; then
                    log "Successfully created namespace '$NAMESPACE'"
                else
                    handle_error "Failed to create Blazegraph namespace '$NAMESPACE'"
                fi
                rm $TEMP_PROPS
            fi
        else
            handle_error "Blazegraph endpoint ($ENDPOINT) is not reachable. Check Blazegraph configuration." "fatal"
        fi
    else
        log "Blazegraph integration is not configured in $CONFIG_FILE"
    fi
}

# Function to fix common issues in the ontology files
fix_ontology_issues() {
    log "Checking for common issues in generated ontology files..."
    
    # Get the ontology output directory
    OUTPUT_DIR=$(grep -o '"ontology_output_dir"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
    if [ -z "$OUTPUT_DIR" ]; then
        OUTPUT_DIR="generated_ontologies"  # Default directory
    fi
    
    # Get history directory
    HISTORY_DIR=$(grep -o '"history_dir"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
    if [ -z "$HISTORY_DIR" ]; then
        HISTORY_DIR="ontology_history"  # Default directory
    fi
    
    # Ensure directories exist
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$HISTORY_DIR"
    
    # Check file permissions
    chmod -R 755 "$OUTPUT_DIR" 2>/dev/null
    chmod -R 755 "$HISTORY_DIR" 2>/dev/null
    
    # Log the ontology files found
    ONTOLOGY_FILES=$(find "$OUTPUT_DIR" -name "*.owl" -type f | wc -l)
    log "Found $ONTOLOGY_FILES ontology files in $OUTPUT_DIR"
    
    # Check for specific issues in the latest ontology file
    LATEST_FILE=$(find "$OUTPUT_DIR" -name "*.owl" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -f2- -d" ")
    if [ -n "$LATEST_FILE" ]; then
        log "Latest ontology file: $LATEST_FILE"
        
        # Check if the file is valid XML
        if ! xmllint --noout "$LATEST_FILE" 2>/dev/null; then
            log "WARNING: Latest ontology file is not valid XML. This may cause import issues."
        fi
    else
        log "No ontology files found in $OUTPUT_DIR"
    fi
}

# Change to the project directory
cd $PROJECT_DIR || handle_error "Could not change to project directory ($PROJECT_DIR)" "fatal"

log "Starting enhanced combined automation process"

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    handle_error "Configuration file $CONFIG_FILE not found" "fatal"
fi

log "Using configuration from $CONFIG_FILE"

# Check if dependencies are installed
command -v curl >/dev/null 2>&1 || handle_error "curl is required but not installed" "fatal"
command -v grep >/dev/null 2>&1 || handle_error "grep is required but not installed" "fatal"
command -v xmllint >/dev/null 2>&1 || log "WARNING: xmllint is not installed, skipping XML validation"

# Check if Python executable exists
if [ ! -f "$PYTHON_PATH" ]; then
    log "Python executable not found at $PYTHON_PATH, trying system Python"
    PYTHON_PATH=$(command -v python3 || command -v python)
    if [ -z "$PYTHON_PATH" ]; then
        handle_error "Python executable not found" "fatal"
    fi
    log "Using Python at $PYTHON_PATH"
fi

# Check and initialize Blazegraph if configured
check_blazegraph

# Step 1: Run config automation to detect new spreadsheets/columns
log "Starting configuration automation..."
$PYTHON_PATH config_automation.py --config $CONFIG_FILE 2>&1 | tee -a $MAIN_LOG
CONFIG_STATUS=$?

# Check if the config automation was successful
if [ $CONFIG_STATUS -eq 0 ]; then
    log "Configuration automation completed successfully"
else
    handle_error "Configuration automation failed with status $CONFIG_STATUS! Check logs"
    # You can choose to exit or continue even if config fails
    # Uncomment to exit on failure: exit 1
fi

# Step 2: Run ontology generation & Blazegraph import
log "Starting ontology generation automation..."
$PYTHON_PATH automation_script.py --config $CONFIG_FILE 2>&1 | tee -a $MAIN_LOG
ONTOLOGY_STATUS=$?

# Check if the ontology generation was successful
if [ $ONTOLOGY_STATUS -eq 0 ]; then
    log "Ontology generation completed successfully"
    # Check and fix any issues with the generated ontologies
    fix_ontology_issues
else
    handle_error "Ontology generation failed with status $ONTOLOGY_STATUS! Check logs" "fatal"
fi

# Step 3: Verify Blazegraph import if configured
if grep -q "blazegraph_endpoint" $CONFIG_FILE && ! grep -q "blazegraph_endpoint.*null" $CONFIG_FILE; then
    log "Verifying Blazegraph import..."
    
    # Extract the Blazegraph endpoint from the config file
    ENDPOINT=$(grep -o '"blazegraph_endpoint"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
    
    # Perform a SPARQL query to check if data was imported
    QUERY_URL="${ENDPOINT}?query=SELECT+COUNT(*)+WHERE+{+?s+?p+?o+}"
    RESULT=$(curl -s -H "Accept: application/sparql-results+json" "$QUERY_URL")
    
    # Check if the query was successful
    if echo "$RESULT" | grep -q "results"; then
        TRIPLE_COUNT=$(echo "$RESULT" | grep -o '"value" : "[0-9]*"' | grep -o '[0-9]\+')
        log "Blazegraph contains $TRIPLE_COUNT triples"
        
        if [ -z "$TRIPLE_COUNT" ] || [ "$TRIPLE_COUNT" -eq 0 ]; then
            log "WARNING: No triples found in Blazegraph. Import may have failed."
        else
            log "Blazegraph import verified successfully"
        fi
    else
        handle_error "Failed to query Blazegraph. Response: $RESULT"
    fi
else
    log "Skipping Blazegraph verification as it is not configured"
fi

# Step 4: Create a summary report
SUMMARY_FILE="${LOG_DIR}/summary_${TIMESTAMP}.txt"
{
    echo "======================================="
    echo "  Biodiversity Ontology Automation     "
    echo "  Summary Report - $(date)             "
    echo "======================================="
    echo ""
    echo "Config Automation: $([[ $CONFIG_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")"
    echo "Ontology Generation: $([[ $ONTOLOGY_STATUS -eq 0 ]] && echo "SUCCESS" || echo "FAILED")"
    echo ""
    echo "Generated Files:"
    OUTPUT_DIR=$(grep -o '"ontology_output_dir"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
    if [ -z "$OUTPUT_DIR" ]; then
        OUTPUT_DIR="generated_ontologies"
    fi
    find "$OUTPUT_DIR" -type f -name "*.owl" -mtime -1 -ls | wc -l
    
    # List the most recent ontology files
    echo ""
    echo "Recent Ontology Files:"
    find "$OUTPUT_DIR" -type f -name "*.owl" -mtime -1 -printf "%T@ %TY-%Tm-%Td %TH:%TM:%TS %p\n" | sort -rn | head -5 | cut -d' ' -f2-
    
    echo ""
    if grep -q "blazegraph_endpoint" $CONFIG_FILE && ! grep -q "blazegraph_endpoint.*null" $CONFIG_FILE; then
        ENDPOINT=$(grep -o '"blazegraph_endpoint"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
        if curl -s --head "$ENDPOINT" | grep "200 OK" > /dev/null; then
            echo "Blazegraph Status: RUNNING"
            # Get triple count
            QUERY_URL="${ENDPOINT}?query=SELECT+COUNT(*)+WHERE+{+?s+?p+?o+}"
            RESULT=$(curl -s -H "Accept: application/sparql-results+json" "$QUERY_URL")
            TRIPLE_COUNT=$(echo "$RESULT" | grep -o '"value" : "[0-9]*"' | grep -o '[0-9]\+')
            if [ -n "$TRIPLE_COUNT" ]; then
                echo "Total Triples in Blazegraph: $TRIPLE_COUNT"
            else
                echo "Total Triples in Blazegraph: Unknown (query failed)"
            fi
        else
            echo "Blazegraph Status: NOT RUNNING"
        fi
    else
        echo "Blazegraph: NOT CONFIGURED"
    fi
    
    echo ""
    echo "See detailed logs at: $MAIN_LOG"
    echo "======================================="
} > $SUMMARY_FILE

log "Complete automation process finished successfully"
log "Summary report created at $SUMMARY_FILE"

# Optional: Send notification email with the summary
if [ -x "$(command -v mail)" ] && grep -q '"notify_email"' $CONFIG_FILE && ! grep -q '"notify_email": ""' $CONFIG_FILE; then
    NOTIFY_EMAIL=$(grep -o '"notify_email"[^,]*' $CONFIG_FILE | cut -d'"' -f4)
    if [ ! -z "$NOTIFY_EMAIL" ]; then
        log "Sending notification email to $NOTIFY_EMAIL"
        mail -s "Biodiversity Ontology Automation Completed" $NOTIFY_EMAIL < $SUMMARY_FILE
    fi
fi

exit 0