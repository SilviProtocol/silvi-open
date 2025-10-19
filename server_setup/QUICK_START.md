# Quick Start - Caddy HTTPS Setup

## On Your Server (167.172.143.162)

### Step 1: Stop nginx and run the installer

```bash
# Stop nginx first
sudo systemctl stop nginx
sudo systemctl disable nginx

# Navigate to setup directory
cd ~/server_setup

# Run installation
sudo ./install_caddy.sh
```

### Step 2: Verify Caddy is running

```bash
# Check status
systemctl status caddy

# Watch logs (look for "certificate obtained successfully")
journalctl -u caddy -f
```

### Step 3: Test

```bash
# Test HTTP redirect
curl -I http://treekipedia-graph-flow.silvi.earth

# Test HTTPS
curl -I https://treekipedia-graph-flow.silvi.earth
```

## If Installation Already Failed

```bash
# Stop Caddy
sudo systemctl stop caddy

# Stop nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Remove old Caddyfile
sudo rm -f /etc/caddy/Caddyfile

# Copy new service file
sudo cp ~/server_setup/caddy.service /etc/systemd/system/caddy.service

# Copy JSON config
sudo cp ~/server_setup/caddy.json /etc/caddy/caddy.json

# Reload systemd
sudo systemctl daemon-reload

# Start Caddy
sudo systemctl start caddy

# Check status
systemctl status caddy
```

## Manual nginx Stop

If you want to manually stop nginx before running the script:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## Port Configuration

- **Caddy:** Ports 80 and 443 (HTTP/HTTPS)
- **Backend:** 167.172.143.162:80 (your Flask app via nginx internally)
- **Admin API:** localhost:2019

## Troubleshooting

**Error: "address already in use"**
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop it (usually nginx)
sudo systemctl stop nginx
```

**Error: "using config from Caddyfile"**
```bash
# Remove Caddyfile
sudo rm /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy
```

**Certificate not obtained**
```bash
# Check DNS
nslookup treekipedia-graph-flow.silvi.earth

# Should return your server IP
# If not, configure DNS first
```

## Success Indicators

✅ `systemctl status caddy` shows "active (running)"
✅ Logs show "certificate obtained successfully"
✅ `curl -I http://treekipedia-graph-flow.silvi.earth` returns 308 redirect
✅ `curl -I https://treekipedia-graph-flow.silvi.earth` returns 200 OK
✅ Browser shows 🔒 lock icon on `https://treekipedia-graph-flow.silvi.earth`

## Your Setup

```
User → https://treekipedia-graph-flow.silvi.earth
       ↓
     Caddy (ports 80/443) - HTTPS termination
       ↓
     Flask App at 167.172.143.162:80 (HTTP)
```

Caddy handles HTTPS, proxies HTTP to your Flask app.
