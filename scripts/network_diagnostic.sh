#!/bin/bash

echo "🌐 Network Connectivity Diagnostic for 167.172.143.162"
echo "======================================================"

HOST="167.172.143.162"
POSTGRES_PORT="5432"
BLAZEGRAPH_PORT="9999"

echo "🔍 Testing Basic Connectivity"
echo "------------------------------"

# Test if host is reachable at all
echo "Testing ping to $HOST..."
if ping -c 3 -W 3000 $HOST >/dev/null 2>&1; then
    echo "✅ Host $HOST is reachable via ping"
else
    echo "❌ Host $HOST is not reachable via ping"
    echo "   This could indicate:"
    echo "   - Server is down"
    echo "   - ICMP is blocked"
    echo "   - Network routing issues"
fi

echo ""
echo "🔌 Testing Port Connectivity"
echo "----------------------------"

# Test PostgreSQL port
echo "Testing PostgreSQL port $POSTGRES_PORT..."
if command -v nc >/dev/null 2>&1; then
    if timeout 10 nc -z $HOST $POSTGRES_PORT 2>/dev/null; then
        echo "✅ Port $POSTGRES_PORT is open and accepting connections"
    else
        echo "❌ Port $POSTGRES_PORT is not accessible"
        echo "   Possible reasons:"
        echo "   - PostgreSQL is not running"
        echo "   - Firewall blocking port $POSTGRES_PORT"
        echo "   - PostgreSQL not configured to accept external connections"
    fi
else
    echo "⚠️  netcat (nc) not available - cannot test port connectivity"
    echo "   Install with: brew install netcat (on macOS)"
fi

# Test Blazegraph port
echo ""
echo "Testing Blazegraph port $BLAZEGRAPH_PORT..."
if command -v nc >/dev/null 2>&1; then
    if timeout 10 nc -z $HOST $BLAZEGRAPH_PORT 2>/dev/null; then
        echo "✅ Port $BLAZEGRAPH_PORT is open (Blazegraph might be running)"
    else
        echo "❌ Port $BLAZEGRAPH_PORT is not accessible"
    fi
fi

echo ""
echo "🌍 Testing HTTP Services"
echo "------------------------"

# Test if Blazegraph web interface is accessible
echo "Testing Blazegraph web interface..."
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 10 "http://$HOST:$BLAZEGRAPH_PORT/blazegraph" >/dev/null 2>&1; then
        echo "✅ Blazegraph web interface is accessible"
        echo "   URL: http://$HOST:$BLAZEGRAPH_PORT/blazegraph"
    else
        echo "❌ Blazegraph web interface is not accessible"
    fi
else
    echo "⚠️  curl not available - cannot test HTTP services"
fi

echo ""
echo "🔧 Suggested Solutions"
echo "----------------------"

echo "1. Contact the server administrator to:"
echo "   - Verify PostgreSQL is running on port $POSTGRES_PORT"
echo "   - Check firewall rules for port $POSTGRES_PORT"
echo "   - Confirm postgresql.conf allows external connections"
echo "   - Verify pg_hba.conf allows your IP address"

echo ""
echo "2. Alternative connection methods to try:"
echo "   - VPN connection if required"
echo "   - SSH tunnel: ssh -L 5432:localhost:5432 user@$HOST"
echo "   - Different ports if PostgreSQL runs on non-standard port"

echo ""
echo "3. Set up local development environment:"
echo "   - Install PostgreSQL locally"
echo "   - Import sample Treekipedia data"
echo "   - Use for development until remote access is resolved"

echo ""
echo "======================================================"
echo "🏁 Diagnostic Complete"
echo "======================================================"
