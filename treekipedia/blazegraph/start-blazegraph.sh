#!/bin/bash

# Blazegraph startup script
# Usage: ./start-blazegraph.sh [port]

PORT=${1:-9999}
JAVA_OPTS="-Xmx4g -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

echo "Starting Blazegraph on port $PORT..."
echo "Access via browser at: http://[YOUR_VM_IP]:$PORT/blazegraph/"
java $JAVA_OPTS -server -Djetty.port=$PORT -Djetty.host=0.0.0.0 -jar blazegraph.jar