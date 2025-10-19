# Caddy HTTPS Setup for Treekipedia GraphFlow

This guide will help you set up Caddy as a reverse proxy with automatic HTTPS for your Treekipedia GraphFlow application.

## 🎯 What This Does

- Provides **automatic HTTPS** with Let's Encrypt certificates
- Redirects **HTTP → HTTPS** automatically
- Proxies requests from `treekipedia-graph-flow.silvi.earth` to your Flask app at `167.172.143.162:5001`
- Auto-renews SSL certificates before expiration
- Provides health checks and logging

## 📋 Prerequisites

- Ubuntu/Debian server with root access
- Domain `treekipedia-graph-flow.silvi.earth` pointing to your server IP
- Flask app running on `167.172.143.162:5001`
- Ports 80 and 443 open in firewall

## 🚀 Quick Installation

### Step 1: Upload Files to Server

Upload the `server_setup` directory to your server:

```bash
# From your local machine
scp -r server_setup root@YOUR_SERVER_IP:/root/
```

### Step 2: Run Installation Script

SSH into your server and run:

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Navigate to setup directory
cd /root/server_setup

# Make script executable (if not already)
chmod +x install_caddy.sh

# Run installation
sudo ./install_caddy.sh
```

The script will:
1. ✅ Install Caddy
2. ✅ Configure reverse proxy
3. ✅ Enable HTTPS
4. ✅ Start service
5. ✅ Enable auto-start on boot

### Step 3: Configure DNS

Make sure your DNS A record is set:

```
treekipedia-graph-flow.silvi.earth → YOUR_SERVER_IP
```

**How to verify:**
```bash
nslookup treekipedia-graph-flow.silvi.earth
# Should return your server IP
```

### Step 4: Wait for SSL Certificate

Caddy will automatically obtain an SSL certificate from Let's Encrypt. This takes 1-2 minutes on first run.

**Check certificate status:**
```bash
journalctl -u caddy -f
# Look for "certificate obtained successfully"
```

### Step 5: Test

Visit your site:
```
https://treekipedia-graph-flow.silvi.earth
```

## 📁 Files Included

```
server_setup/
├── caddy.service          # Systemd service configuration
├── caddy.json            # Caddy reverse proxy config
├── install_caddy.sh      # Automated installation script
└── README.md             # This file
```

## ⚙️ Configuration Details

### Caddy JSON Configuration

The `caddy.json` file configures:

**Domain Handling:**
- Primary: `treekipedia-graph-flow.silvi.earth`
- WWW: `www.treekipedia-graph-flow.silvi.earth`

**Backend:**
- Target: `167.172.143.162:5001` (your Flask app)
- Protocol: HTTP (Caddy handles HTTPS)

**Features:**
- Automatic HTTPS with Let's Encrypt
- HTTP to HTTPS redirect
- Request header forwarding (X-Forwarded-For, X-Real-IP, etc.)
- Health checks (passive monitoring)
- Admin API on port 2019

### Systemd Service

The `caddy.service` file configures:
- Auto-start on boot
- Automatic restart on failure
- Logging to `/var/log/caddy/`
- Admin API access

## 🔧 Common Commands

### Service Management

```bash
# Check status
systemctl status caddy

# Start service
systemctl start caddy

# Stop service
systemctl stop caddy

# Restart service
systemctl restart caddy

# Reload configuration (no downtime)
systemctl reload caddy
```

### Logs

```bash
# View live logs
journalctl -u caddy -f

# View recent logs
journalctl -u caddy -n 100

# View error logs only
journalctl -u caddy -p err
```

### Configuration

```bash
# Validate config before applying
caddy validate --config /etc/caddy/caddy.json

# Test config
caddy run --config /etc/caddy/caddy.json --adapter json

# Edit config
nano /etc/caddy/caddy.json

# After editing, reload
systemctl reload caddy
```

### Admin API

Caddy provides an admin API on port 2019:

```bash
# Check current config
curl http://localhost:2019/config/

# View certificates
curl http://localhost:2019/pki/certificates/

# Check health
curl http://localhost:2019/reverse_proxy/upstreams
```

## 🐛 Troubleshooting

### Issue: Certificate not obtained

**Symptoms:** HTTPS not working, "certificate not found" errors

**Solutions:**
1. Check DNS is pointing to correct IP:
   ```bash
   nslookup treekipedia-graph-flow.silvi.earth
   ```

2. Verify ports 80 and 443 are open:
   ```bash
   sudo ufw status
   # Should show ports 80 and 443 allowed
   ```

3. Check Caddy logs:
   ```bash
   journalctl -u caddy -f
   ```

4. Manually test ACME challenge:
   ```bash
   curl -I http://treekipedia-graph-flow.silvi.earth/.well-known/acme-challenge/test
   ```

### Issue: Service won't start

**Check logs:**
```bash
systemctl status caddy
journalctl -u caddy -n 50
```

**Common causes:**
- Port 80/443 already in use
- Invalid JSON configuration
- Permissions issues

**Test configuration:**
```bash
caddy validate --config /etc/caddy/caddy.json
```

### Issue: Backend connection fails

**Verify Flask app is running:**
```bash
curl http://167.172.143.162:5001
# Should return HTML response
```

**Check if port 5001 is accessible:**
```bash
netstat -tulpn | grep 5001
```

**View proxy logs:**
```bash
journalctl -u caddy | grep "reverse_proxy"
```

### Issue: HTTP not redirecting to HTTPS

**Check automatic_https is enabled in config:**
```json
"automatic_https": {
    "disable": false,
    "disable_redirects": false
}
```

**Verify with curl:**
```bash
curl -I http://treekipedia-graph-flow.silvi.earth
# Should see 308 redirect to https://
```

## 🔐 Security Features

### Automatic HTTPS

- **Let's Encrypt** certificates (free, trusted)
- **Auto-renewal** 30 days before expiration
- **OCSP Stapling** for faster certificate validation
- **HTTP/2** enabled by default

### Headers Forwarded to Backend

- `X-Forwarded-For`: Client IP address
- `X-Forwarded-Proto`: Original protocol (https)
- `X-Forwarded-Host`: Original hostname
- `X-Real-IP`: Client IP

Your Flask app can access these:
```python
from flask import request

client_ip = request.headers.get('X-Real-IP')
original_proto = request.headers.get('X-Forwarded-Proto')
```

### Health Checks

Passive health checks monitor backend:
- **Fail duration:** 30s
- **Max fails:** 3 attempts
- **Unhealthy count:** 3 failed connections

## 📊 Monitoring

### Check Certificate Expiry

```bash
# Via admin API
curl http://localhost:2019/pki/certificates/ | jq

# Via openssl
echo | openssl s_client -servername treekipedia-graph-flow.silvi.earth \
  -connect treekipedia-graph-flow.silvi.earth:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Monitor Traffic

```bash
# Access logs
tail -f /var/log/caddy/caddy.log

# Error logs
tail -f /var/log/caddy/caddy-error.log
```

### Performance Metrics

```bash
# Connection stats
curl http://localhost:2019/metrics

# Reverse proxy stats
curl http://localhost:2019/reverse_proxy/upstreams
```

## 🔄 Updating Configuration

### Adding New Domain

Edit `/etc/caddy/caddy.json` and add to the `host` array:

```json
"host": [
    "treekipedia-graph-flow.silvi.earth",
    "www.treekipedia-graph-flow.silvi.earth",
    "new-domain.com"  // Add here
]
```

Then reload:
```bash
systemctl reload caddy
```

### Changing Backend Port

Edit the `dial` value:
```json
"upstreams": [
    {
        "dial": "167.172.143.162:NEW_PORT"
    }
]
```

### Adding Multiple Backends (Load Balancing)

```json
"upstreams": [
    {"dial": "167.172.143.162:5001"},
    {"dial": "167.172.143.162:5002"},
    {"dial": "167.172.143.162:5003"}
]
```

## 📧 SSL Certificate Email

The email `admin@silvi.earth` is registered for certificate notifications. Update in `caddy.json`:

```json
"issuers": [
    {
        "module": "acme",
        "email": "your-email@example.com"
    }
]
```

## 🚦 Firewall Configuration

Ensure these ports are open:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 2019/tcp  # Admin API (localhost only recommended)

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 📝 Complete Example Workflow

```bash
# 1. Upload setup files
scp -r server_setup root@YOUR_SERVER:~/

# 2. SSH to server
ssh root@YOUR_SERVER

# 3. Run installation
cd ~/server_setup
chmod +x install_caddy.sh
./install_caddy.sh

# 4. Verify service
systemctl status caddy

# 5. Check logs for certificate
journalctl -u caddy -f

# 6. Test HTTP redirect
curl -I http://treekipedia-graph-flow.silvi.earth

# 7. Test HTTPS
curl -I https://treekipedia-graph-flow.silvi.earth

# 8. Visit in browser
# https://treekipedia-graph-flow.silvi.earth
```

## ✅ Post-Installation Checklist

- [ ] DNS A record configured
- [ ] Ports 80 and 443 open
- [ ] Flask app running on 167.172.143.162:5001
- [ ] Caddy service active (`systemctl status caddy`)
- [ ] SSL certificate obtained (check logs)
- [ ] HTTP redirects to HTTPS (test with curl)
- [ ] Site accessible via browser
- [ ] Admin API accessible (`curl localhost:2019/config/`)

## 🆘 Support

**Caddy Documentation:** https://caddyserver.com/docs/

**View this setup:**
```bash
cat /etc/caddy/caddy.json
cat /etc/systemd/system/caddy.service
```

**Logs location:**
- Service logs: `journalctl -u caddy`
- Access logs: `/var/log/caddy/caddy.log`
- Error logs: `/var/log/caddy/caddy-error.log`

---

**🌲 Treekipedia GraphFlow** - Now with automatic HTTPS! 🔒
