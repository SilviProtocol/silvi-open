# Treekipedia API Configuration

## Current API Access Setup

Based on our testing, the following API URL is currently working:
- ✅ `http://167.172.143.162:3000` (Direct IP with HTTP)

The following configurations did not work:
- ❌ `https://167.172.143.162:3000` (Direct IP with HTTPS)
- ❌ `http://treekipedia-api.silvi.earth` (Domain with HTTP)
- ❌ `https://treekipedia-api.silvi.earth` (Domain with HTTPS)

## SSL/HTTPS Configuration

For proper production use, it's recommended to:

1. Ensure your domain `treekipedia-api.silvi.earth` points to the correct IP address
2. Configure Nginx or Apache as a reverse proxy to forward requests to your Node.js app
3. Set up SSL certificates properly with Let's Encrypt/Certbot
4. Use the secure HTTPS version in production

## CORS Configuration

This document explains the Cross-Origin Resource Sharing (CORS) setup for the Treekipedia backend API.

## What Is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature implemented by browsers that restricts web pages from making requests to a different domain than the one that served the original page. This is a security feature to prevent malicious websites from accessing sensitive data from other sites.

## Our CORS Configuration

We've configured CORS on the backend server to allow specific origins to access our API. The configuration is in `server.js`:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Next.js dev server
    'http://localhost:8000',           // Alternative port if needed
    'https://treekipedia.silvi.earth', // Production frontend
    /\.vercel\.app$/                   // Vercel preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
```

## Testing CORS Setup

To verify that CORS is working correctly:

1. Start the backend server:
   ```bash
   cd /root/silvi-open/treekipedia-new/backend
   node server.js
   ```

2. Start the frontend development server:
   ```bash
   cd /root/silvi-open/treekipedia-new/frontend
   yarn dev
   ```

3. Open your browser to the frontend app (usually `http://localhost:3000`)

4. Open the browser developer console (F12 or right-click > Inspect > Console)

5. Run the following test code in the console:
   ```javascript
   // Test the API root endpoint
   fetch('https://treekipedia-api.silvi.earth/', {
     method: 'GET',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   .then(response => response.json())
   .then(data => console.log('API response:', data))
   .catch(error => console.error('Error:', error));
   
   // Test species suggestions endpoint
   fetch('https://treekipedia-api.silvi.earth/species/suggest?query=oak', {
     method: 'GET',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   .then(response => response.json())
   .then(data => console.log('Species suggestions:', data))
   .catch(error => console.error('Error:', error));
   ```

6. You should see successful responses without any CORS errors.

## Troubleshooting CORS Issues

If you're still encountering CORS errors:

### 1. Check Server Logs

Look for any error messages in your backend terminal.

### 2. Verify the Origin

Make sure the origin of your request is in the allowed list. You can check your current origin by running this in the browser console:
```javascript
console.log(window.location.origin);
```

### 3. Inspect the Network Request

In the browser's developer tools, go to the Network tab and look for:
- The HTTP status code of the preflight OPTIONS request
- The response headers on both OPTIONS and the main request

### 4. Temporary Looser Configuration

For testing purposes only, you can temporarily allow all origins:
```javascript
app.use(cors({ origin: true }));
```

**Important:** Don't use this in production!

### 5. Common CORS Errors

- `Access to fetch at '...' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
  - The server isn't returning the correct CORS headers.

- `Access to fetch at '...' from origin '...' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`
  - You're using credentials but setting Origin to '*' which is not allowed.

## Updating CORS Configuration

If you need to add new origins to the allowed list, update the `origin` array in the corsOptions object in `server.js`, then restart the server.

## Resources

- [Express CORS middleware documentation](https://github.com/expressjs/cors)
- [MDN CORS documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)