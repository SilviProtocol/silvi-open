#!/bin/bash

echo "🔄 Restarting Treekipedia Flask Application..."

# Kill existing Flask processes
pkill -f "python.*app.py" 2>/dev/null
pkill -f "flask.*run" 2>/dev/null
sleep 2

# Start the application
echo "🚀 Starting Flask app..."
python3 app.py &

sleep 3

echo "✅ Flask app restarted!"
echo "🌐 Check: http://localhost:5001"
echo "📊 Monitor: http://localhost:5001/postgres-monitor"
