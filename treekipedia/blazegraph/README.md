# Blazegraph Setup for Treekipedia

## Overview
Blazegraph is a high-performance RDF database used for storing and querying semantic data in the Treekipedia project.

## Requirements
- Java 8 or higher

## Setup
The Blazegraph setup includes:
- `blazegraph.jar` - The main Blazegraph application
- `RWStore.properties` - Configuration file
- `start-blazegraph.sh` - Startup script

## Usage

### Start Blazegraph (default port 9999)
```bash
./start-blazegraph.sh
```

### Start on custom port
```bash
./start-blazegraph.sh 8080
```

### Using npm scripts
```bash
npm start              # Start on default port
npm run start:port     # Start on port 9999
```

## Accessing Blazegraph
Once started, access the web interface at:
- `http://YOUR_VM_IP:9999/blazegraph/` (default)
- `http://YOUR_VM_IP:[PORT]/blazegraph/` (custom port)

Replace `YOUR_VM_IP` with your DigitalOcean VM's public IP address.

## SPARQL Endpoint
The SPARQL endpoint is available at:
- `http://YOUR_VM_IP:9999/blazegraph/namespace/kb/sparql`

## Firewall Note
Make sure port 9999 (or your chosen port) is open in your DigitalOcean firewall settings.

## Configuration
Edit `RWStore.properties` to modify database settings including:
- Memory allocation
- Journal file location
- Performance parameters