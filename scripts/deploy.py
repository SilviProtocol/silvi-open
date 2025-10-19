#!/usr/bin/env python3
"""
Biodiversity Ontology Deployment Script
=======================================
This script automates the deployment of the Biodiversity Ontology Generator
to a DigitalOcean droplet or any other Ubuntu-based server.

Usage:
  python deploy.py --host YOUR_DROPLET_IP --user root --key /path/to/ssh_key

Requirements:
  - paramiko (pip install paramiko)
  - scp (pip install scp)
"""

import argparse
import os
import sys
import time
import paramiko
from scp import SCPClient
from pathlib import Path

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Deploy Biodiversity Ontology to a server')
    parser.add_argument('--host', required=True, help='Server IP address or hostname')
    parser.add_argument('--user', default='root', help='SSH username (default: root)')
    parser.add_argument('--port', type=int, default=22, help='SSH port (default: 22)')
    parser.add_argument('--key', help='Path to SSH private key')
    parser.add_argument('--password', help='SSH password (not recommended, use key instead)')
    parser.add_argument('--project-dir', default='.', help='Local project directory (default: current directory)')
    parser.add_argument('--server-dir', default='/var/www/biodiversity-ontology', help='Server directory for deployment')
    parser.add_argument('--domain', help='Domain name for the application (optional)')
    parser.add_argument('--setup-blazegraph', action='store_true', help='Set up Blazegraph triple store')
    parser.add_argument('--blazegraph-port', type=int, default=9999, help='Port for Blazegraph (default: 9999)')
    parser.add_argument('--app-port', type=int, default=8000, help='Port for the application (default: 8000)')
    parser.add_argument('--secret-key', help='Secret key for Flask application (will generate if not provided)')
    return parser.parse_args()

def create_ssh_client(host, port, user, key_filename=None, password=None):
    """Create an SSH client connected to the remote server."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if key_filename:
            client.connect(host, port=port, username=user, key_filename=key_filename)
        else:
            client.connect(host, port=port, username=user, password=password)
        print(f"✅ Connected to {user}@{host}:{port}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to {user}@{host}:{port}: {str(e)}")
        sys.exit(1)

def run_ssh_command(client, command, check_error=True):
    """Run a command on the remote server and print output."""
    print(f"🔄 Running: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out:
        print(f"📤 Output: {out}")
    if err:
        print(f"📥 Error: {err}")
    
    if check_error and exit_status != 0:
        print(f"❌ Command failed with status: {exit_status}")
        if not err:
            err = "Unknown error"
        return False, err
    
    return True, out

def create_scp_client(ssh_client):
    """Create an SCP client for file transfers."""
    return SCPClient(ssh_client.get_transport())

def deploy_files(ssh_client, scp_client, local_dir, remote_dir, excludes=None):
    """Copy project files to the remote server."""
    if excludes is None:
        excludes = ['.git', '__pycache__', 'venv', 'env', '.env', '.vscode', '.idea', '.DS_Store']
    
    # Create the remote directory if it doesn't exist
    print(f"🔄 Creating remote directory: {remote_dir}")
    run_ssh_command(ssh_client, f"mkdir -p {remote_dir}", check_error=False)
    
    # Get all files in the project directory
    local_path = Path(local_dir).resolve()
    
    # Helper function to check if a path should be excluded
    def should_exclude(path):
        rel_path = path.relative_to(local_path)
        for excl in excludes:
            if excl in str(rel_path) or str(rel_path).startswith(excl) or excl in str(path):
                return True
        return False
    
    files_to_copy = []
    directories_to_create = set()
    
    for item in local_path.glob('**/*'):
        if item.is_file() and not should_exclude(item):
            rel_path = item.relative_to(local_path)
            remote_path = f"{remote_dir}/{rel_path}"
            directories_to_create.add(str(Path(remote_path).parent))
            files_to_copy.append((str(item), str(rel_path)))
    
    # Create required directories on the remote
    for directory in sorted(directories_to_create):
        run_ssh_command(ssh_client, f"mkdir -p '{directory}'", check_error=False)
    
    # Copy each file
    total_files = len(files_to_copy)
    print(f"🔄 Copying {total_files} files to {remote_dir}...")
    
    for i, (local_file, rel_path) in enumerate(files_to_copy):
        try:
            remote_path = f"{remote_dir}/{rel_path}"
            print(f"[{i+1}/{total_files}] 📂 Copying {rel_path}")
            scp_client.put(local_file, remote_path)
        except Exception as e:
            print(f"❌ Failed to copy {local_file}: {str(e)}")

def setup_server(ssh_client, args):
    """Set up the server environment."""
    print("\n🔄 Setting up server environment...")
    
    # Update and install dependencies
    run_ssh_command(ssh_client, "apt update && apt upgrade -y")
    run_ssh_command(ssh_client, "apt install -y python3 python3-pip python3-venv nginx supervisor")
    
    # Set up a Python virtual environment
    venv_path = f"{args.server_dir}/venv"
    run_ssh_command(ssh_client, f"cd {args.server_dir} && python3 -m venv {venv_path}")
    
    # Install Python dependencies
    run_ssh_command(ssh_client, f"cd {args.server_dir} && {venv_path}/bin/pip install -r requirements.txt")
    run_ssh_command(ssh_client, f"cd {args.server_dir} && {venv_path}/bin/pip install gunicorn")
    
    # Set up proper permissions
    run_ssh_command(ssh_client, f"chmod 640 {args.server_dir}/service_account.json")
    run_ssh_command(ssh_client, f"chmod +x {args.server_dir}/combined_automation.sh")

def configure_supervisor(ssh_client, args):
    """Configure Supervisor to manage the application."""
    print("\n🔄 Setting up Supervisor...")
    
    # Create log directories
    run_ssh_command(ssh_client, f"mkdir -p /var/log/biodiversity-ontology")
    
    # Create Supervisor configuration
    supervisor_config = f"""[program:biodiversity-ontology]
directory={args.server_dir}
command={args.server_dir}/venv/bin/gunicorn app:app -w 4 -b 127.0.0.1:{args.app_port}
user=root
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/biodiversity-ontology/err.log
stdout_logfile=/var/log/biodiversity-ontology/out.log
"""
    
    # Upload Supervisor configuration
    with open("supervisor_config.tmp", "w") as f:
        f.write(supervisor_config)
    
    scp_client = create_scp_client(ssh_client)
    scp_client.put("supervisor_config.tmp", "/etc/supervisor/conf.d/biodiversity-ontology.conf")
    os.remove("supervisor_config.tmp")
    
    # Reload Supervisor
    run_ssh_command(ssh_client, "supervisorctl reread")
    run_ssh_command(ssh_client, "supervisorctl update")
    run_ssh_command(ssh_client, "supervisorctl restart biodiversity-ontology")

def configure_nginx(ssh_client, args):
    """Configure Nginx as a reverse proxy."""
    print("\n🔄 Setting up Nginx...")
    
    # Determine server name
    server_name = args.domain if args.domain else args.host
    
    # Create Nginx configuration
    nginx_config = f"""server {{
    listen 80;
    server_name {server_name};

    location / {{
        proxy_pass http://127.0.0.1:{args.app_port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 32M;  # Match your app's MAX_CONTENT_LENGTH
    }}

    location /static {{
        alias {args.server_dir}/static;
    }}
}}
"""
    
    # Upload Nginx configuration
    with open("nginx_config.tmp", "w") as f:
        f.write(nginx_config)
    
    scp_client = create_scp_client(ssh_client)
    scp_client.put("nginx_config.tmp", "/etc/nginx/sites-available/biodiversity-ontology")
    os.remove("nginx_config.tmp")
    
    # Enable the site and restart Nginx
    run_ssh_command(ssh_client, "ln -sf /etc/nginx/sites-available/biodiversity-ontology /etc/nginx/sites-enabled/")
    run_ssh_command(ssh_client, "nginx -t")
    run_ssh_command(ssh_client, "systemctl restart nginx")

def setup_blazegraph(ssh_client, args):
    """Set up Blazegraph triple store."""
    if not args.setup_blazegraph:
        return
    
    print("\n🔄 Setting up Blazegraph...")
    
    # Install Java
    run_ssh_command(ssh_client, "apt install -y default-jre")
    
    # Create directory for Blazegraph
    run_ssh_command(ssh_client, "mkdir -p /opt/blazegraph")
    
    # Download Blazegraph
    run_ssh_command(ssh_client, "cd /opt/blazegraph && wget -q https://github.com/blazegraph/database/releases/download/BLAZEGRAPH_2_1_6_RC/blazegraph.jar")
    
    # Create a service file for Blazegraph
    blazegraph_service = f"""[Unit]
Description=Blazegraph Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/blazegraph
ExecStart=/usr/bin/java -server -Xmx4g -jar blazegraph.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
"""
    
    # Upload Blazegraph service file
    with open("blazegraph_service.tmp", "w") as f:
        f.write(blazegraph_service)
    
    scp_client = create_scp_client(ssh_client)
    scp_client.put("blazegraph_service.tmp", "/etc/systemd/system/blazegraph.service")
    os.remove("blazegraph_service.tmp")
    
    # Enable and start the service
    run_ssh_command(ssh_client, "systemctl daemon-reload")
    run_ssh_command(ssh_client, "systemctl enable blazegraph")
    run_ssh_command(ssh_client, "systemctl start blazegraph")

def setup_cron_jobs(ssh_client, args):
    """Set up cron jobs for automation."""
    print("\n🔄 Setting up cron jobs...")
    
    # Generate a secret key if not provided
    secret_key = args.secret_key
    if not secret_key:
        import random
        import string
        chars = string.ascii_letters + string.digits + '!@#$%^&*()_-+={}[]'
        secret_key = ''.join(random.choice(chars) for _ in range(32))
    
    # Create cron jobs file
    cron_jobs = f"""# Biodiversity Ontology Automation
0 1 * * * root cd {args.server_dir} && bash combined_automation.sh >> /var/log/biodiversity-ontology/automation.log 2>&1

# Cleanup expired files
0 */3 * * * root curl -X POST -d 'secret={secret_key}' http://localhost:{args.app_port}/cleanup
"""
    
    # Upload cron jobs file
    with open("cron_jobs.tmp", "w") as f:
        f.write(cron_jobs)
    
    scp_client = create_scp_client(ssh_client)
    scp_client.put("cron_jobs.tmp", "/etc/cron.d/biodiversity-ontology")
    os.remove("cron_jobs.tmp")
    
    # Create environment file with the secret key
    env_content = f"""SECRET_KEY={secret_key}
SPREADSHEET_ID=
RENDER=false
"""
    
    with open("env_file.tmp", "w") as f:
        f.write(env_content)
    
    scp_client.put("env_file.tmp", f"{args.server_dir}/.env")
    os.remove("env_file.tmp")
    
    # Set proper permissions
    run_ssh_command(ssh_client, f"chmod 640 {args.server_dir}/.env")
    run_ssh_command(ssh_client, "chmod 644 /etc/cron.d/biodiversity-ontology")

def create_deployment_script(ssh_client, args):
    """Create a deployment script for future updates."""
    print("\n🔄 Creating deployment script...")
    
    deploy_script = f"""#!/bin/bash
# Deployment script for biodiversity-ontology

# Navigate to application directory
cd {args.server_dir}

# Update from repository (if using Git)
if [ -d .git ]; then
    git pull
fi

# Activate virtual environment
source venv/bin/activate

# Install or update dependencies
pip install -r requirements.txt

# Restart the application
supervisorctl restart biodiversity-ontology

echo "Deployment completed successfully at $(date)"
"""
    
    # Upload deployment script
    with open("deploy_script.tmp", "w") as f:
        f.write(deploy_script)
    
    scp_client = create_scp_client(ssh_client)
    scp_client.put("deploy_script.tmp", f"{args.server_dir}/deploy.sh")
    os.remove("deploy_script.tmp")
    
    # Set executable permission
    run_ssh_command(ssh_client, f"chmod +x {args.server_dir}/deploy.sh")

def main():
    """Main function to deploy the application."""
    # Parse command line arguments
    args = parse_args()
    
    # Validate arguments
    if not args.key and not args.password:
        print("❌ Either --key or --password must be provided")
        sys.exit(1)
    
    # Create SSH client
    ssh_client = create_ssh_client(
        args.host, 
        args.port, 
        args.user, 
        key_filename=args.key, 
        password=args.password
    )
    
    try:
        # Create SCP client
        scp_client = create_scp_client(ssh_client)
        
        # Deploy project files
        deploy_files(ssh_client, scp_client, args.project_dir, args.server_dir)
        
        # Set up server environment
        setup_server(ssh_client, args)
        
        # Set up Blazegraph if requested
        if args.setup_blazegraph:
            setup_blazegraph(ssh_client, args)
        
        # Configure Supervisor
        configure_supervisor(ssh_client, args)
        
        # Configure Nginx
        configure_nginx(ssh_client, args)
        
        # Set up cron jobs
        setup_cron_jobs(ssh_client, args)
        
        # Create deployment script
        create_deployment_script(ssh_client, args)
        
        print("\n✅ Deployment completed successfully!")
        print(f"🌐 Your application should now be accessible at: http://{args.host}")
        if args.domain:
            print(f"🌐 Once DNS is configured, it will be accessible at: http://{args.domain}")
        
    finally:
        ssh_client.close()

if __name__ == "__main__":
    main()