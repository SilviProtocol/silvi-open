// A minimal HTTP server with no external dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple HTML file with inline styles and scripts
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Absolute Minimal Test</title>
    <style>
        body { 
            font-family: sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f0f0f0; 
            color: #333; 
        }
        h1 { color: #4A6C4B; text-align: center; }
        .box { 
            background-color: white; 
            border: 1px solid #ddd; 
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button {
            background-color: #4A6C4B;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
        }
        .time-display {
            font-size: 24px;
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Treekipedia - Simple Test</h1>
    
    <div class="box">
        <h2>Static Content</h2>
        <p>This content is statically rendered HTML with inline CSS.</p>
    </div>
    
    <div class="box">
        <h2>Dynamic Content</h2>
        <p>The current time below should update every second:</p>
        <div class="time-display" id="time">Loading...</div>
        <button id="test-button">Test JavaScript</button>
        <p id="result"></p>
    </div>

    <script>
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleTimeString();
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        document.getElementById('test-button').addEventListener('click', function() {
            document.getElementById('result').textContent = 'JavaScript is working! Button clicked at ' + new Date().toLocaleTimeString();
        });
        
        console.log('Page loaded successfully');
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'test.html'), htmlContent);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
    console.log(`Received request for: ${req.url}`);
    
    // Serve our HTML file for all requests
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(htmlContent);
});

// Set the port and start the server
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log(`Access via proxy at http://167.172.143.162:8080/proxy/3001/`);
});