#!/bin/bash

# Treekipedia GraphFlow - Caddy HTTPS Setup Script
# This script installs and configures Caddy as a reverse proxy with automatic HTTPS

set -e  # Exit on any error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_and_continue() {
    log_warn "$1 - Continuing anyway..."
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

log_info "Starting Treekipedia GraphFlow Caddy installation..."
echo "=================================================="

# Update system
log_info "Updating system packages..."
apt update || log_and_continue "apt update"

# Install prerequisites
log_info "Installing prerequisites..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl || log_and_continue "Caddy prerequisites"

# Add Caddy repository
log_info "Adding Caddy repository..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg || log_and_continue "Caddy GPG key"
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list || log_and_continue "Caddy sources"

# Update package list
log_info "Updating package list..."
apt update || log_and_continue "apt update for Caddy"

# Install Caddy
log_info "Installing Caddy..."
apt install -y caddy || log_and_continue "Caddy installation"

# Create necessary directories
log_info "Creating directories..."
mkdir -p /var/log/caddy || log_and_continue "Caddy log directory"
mkdir -p /etc/caddy || log_and_continue "Caddy config directory"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy configuration files
log_info "Installing configuration files..."
if [ -f "$SCRIPT_DIR/caddy.service" ]; then
    cp "$SCRIPT_DIR/caddy.service" /etc/systemd/system/caddy.service
    log_info "✓ Caddy service file installed"
else
    log_error "caddy.service not found in $SCRIPT_DIR"
    exit 1
fi

if [ -f "$SCRIPT_DIR/caddy.json" ]; then
    cp "$SCRIPT_DIR/caddy.json" /etc/caddy/caddy.json
    log_info "✓ Caddy configuration installed"
else
    log_error "caddy.json not found in $SCRIPT_DIR"
    exit 1
fi

# Stop and disable nginx if running (to free port 80/443)
log_info "Stopping nginx to free ports 80 and 443..."
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    systemctl disable nginx
    log_info "✓ Nginx stopped and disabled"
else
    log_info "Nginx is not running"
fi

# Remove default Caddyfile if it exists
log_info "Removing default Caddyfile..."
rm -f /etc/caddy/Caddyfile

# Set proper permissions
log_info "Setting permissions..."
chmod 644 /etc/caddy/caddy.json
chmod 644 /etc/systemd/system/caddy.service
chmod 755 /var/log/caddy

# Reload systemd
log_info "Reloading systemd..."
systemctl daemon-reload || log_and_continue "Systemd daemon reload"

# Enable Caddy service
log_info "Enabling Caddy service..."
systemctl enable caddy || log_and_continue "Caddy enable"

# Stop Caddy if already running (for clean restart)
log_info "Stopping existing Caddy service (if running)..."
systemctl stop caddy 2>/dev/null || true

# Start Caddy
log_info "Starting Caddy service..."
if systemctl start caddy; then
    log_info "✓ Caddy started successfully"
else
    log_error "Failed to start Caddy"
    log_info "Checking logs..."
    journalctl -u caddy -n 50 --no-pager
    exit 1
fi

# Wait a moment for Caddy to start
sleep 2

# Check Caddy status
log_info "Checking Caddy status..."
if systemctl is-active --quiet caddy; then
    log_info "✓ Caddy is running"
else
    log_error "Caddy is not running"
    log_info "Checking logs..."
    journalctl -u caddy -n 50 --no-pager
    exit 1
fi

# Display status
echo ""
echo "=================================================="
log_info "Caddy installation complete!"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  • Domain: treekipedia-graph-flow.silvi.earth"
echo "  • HTTP Port: 80 (redirects to HTTPS)"
echo "  • HTTPS Port: 443"
echo "  • Backend: 167.172.143.162:5001"
echo "  • Admin API: http://localhost:2019"
echo ""
echo "Important DNS Configuration:"
echo "  ⚠️  Make sure your DNS A record points to this server's IP:"
echo "  treekipedia-graph-flow.silvi.earth → $(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo ""
echo "Useful Commands:"
echo "  • Check status:  systemctl status caddy"
echo "  • View logs:     journalctl -u caddy -f"
echo "  • Restart:       systemctl restart caddy"
echo "  • Reload config: systemctl reload caddy"
echo "  • Test config:   caddy validate --config /etc/caddy/caddy.json"
echo ""
echo "Certificate Information:"
echo "  • Caddy will automatically obtain Let's Encrypt SSL certificates"
echo "  • This may take a few minutes on first run"
echo "  • Certificates auto-renew before expiration"
echo ""
echo "Next Steps:"
echo "  1. Ensure your Flask app is running on 167.172.143.162:5001"
echo "  2. Configure DNS A record (if not already done)"
echo "  3. Wait 1-2 minutes for SSL certificate provisioning"
echo "  4. Visit: https://treekipedia-graph-flow.silvi.earth"
echo ""
echo "✓ Setup complete!"
