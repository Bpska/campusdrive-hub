# VPS Deployment Guide for CampusDrive Hub

This guide walks you through deploying the **CampusDrive Hub** application (consisting of the TanStack Start frontend, Express API backend, PostgreSQL database, and Nginx proxy) onto your Virtual Private Server (VPS) using Docker Compose and securing it with Let's Encrypt SSL (HTTPS).

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Setup Project on VPS](#2-setup-project-on-vps)
3. [Environment Configuration](#3-environment-configuration)
4. [Step 1: Start Services (HTTP Mode)](#4-step-1-start-services-http-mode)
5. [Step 2: Database Initialization & Seeding](#5-step-2-database-initialization--seeding)
6. [Step 3: Setup Let's Encrypt SSL Certificates](#6-step-3-setup-lets-encrypt-ssl-certificates)
7. [Step 4: Enable HTTPS in Nginx](#7-step-4-enable-https-in-nginx)
8. [Common Commands & Maintenance](#8-common-commands--maintenance)

---

## 1. Prerequisites

Before starting, connect to your VPS via SSH and ensure the following are installed:

### Install Docker and Docker Compose (Ubuntu)
```bash
# Update package database
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Install Docker Compose (v2)
sudo apt install -y docker-compose-v2

# Start and enable Docker service
sudo systemctl enable --now docker
```

### Domain Configuration
Map your domain (e.g., `campusdrive.yourdomain.com`) to the public IP address of your VPS using an **A Record** in your DNS management console.

### Firewall Setup
Ensure ports **80** (HTTP) and **443** (HTTPS) are open on your VPS firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp # Double check SSH port is open before enabling!
sudo ufw enable
```

---

## 2. Setup Project on VPS

Clone your repository directly onto the VPS:
```bash
git clone https://github.com/your-username/campusdrive-hub.git /var/www/campusdrive-hub
cd /var/www/campusdrive-hub
```

---

## 3. Environment Configuration

Create a `.env` file in the root folder of the project (`/var/www/campusdrive-hub/.env`) to store production secrets securely:

```env
# Database Credentials
DB_PASSWORD=your_secure_db_password_here

# Backend JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
```

*Note: Docker Compose automatically reads this file and passes these variables into the database and backend services.*

---

## 4. Step 1: Start Services (HTTP Mode)

Before configuring SSL, Nginx needs to boot successfully over HTTP (port 80) so that Let's Encrypt can complete its domain verification challenge.

Run the build and start command:
```bash
docker compose up -d --build
```

### Verify Status
Ensure all containers are running successfully:
```bash
docker compose ps
```
You should see:
- `campusdrive-db` (healthy)
- `campusdrive-backend`
- `campusdrive-frontend`
- `campusdrive-nginx`

If everything is running, you can test access to the app by visiting `http://<your-vps-ip>` in your web browser. You should see the frontend load.

---

## 5. Step 2: Database Initialization & Seeding

The database starts empty. You must create the tables and insert initial users/roles.

To safely run the schema creation and initial seeding inside the running backend container, run:
```bash
docker compose exec backend node dist/db/seed.js
```

This runs the compiled script that reads `schema.sql`, creates all tables, and seeds the default admin user and initial records.

### Default Admin Logins:
- **Email:** `admin@crm.com`
- **Password:** `admin123`
*Remember to change your admin password from the dashboard settings immediately after logging in.*

---

## 6. Step 3: Setup Let's Encrypt SSL Certificates

Once Nginx is up, request an SSL certificate from Let's Encrypt using the Certbot container.

Run the following command, replacing `campusdrive.yourdomain.com` with your actual domain and `your-email@example.com` with your email:

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d campusdrive.yourdomain.com
```

If successful, Certbot will save your certificates on the VPS at `/var/lib/docker/volumes/campusdrive-hub_certbot-etc/_data/live/campusdrive.yourdomain.com/`.

---

## 7. Step 4: Enable HTTPS in Nginx

Now that SSL certificates exist, update Nginx to force HTTPS.

1. Open `nginx/nginx.conf` in your editor (e.g., `nano nginx/nginx.conf`).
2. Update the domain names: Replace all instances of `campusdrive.yourdomain.com` with your actual domain name.
3. Edit the file to:
   - Comment out (or modify) the default port 80 proxy blocks, and uncomment the port 80 redirect block.
   - Uncomment the entire `server` block for port 443 (HTTPS).
4. Save and close the file.

### Recommended HTTPS `nginx/nginx.conf` Layout:
```nginx
# ... (events, http headers, gzip settings remain the same) ...

    # HTTP - Redirect all traffic to HTTPS
    server {
        listen 80;
        listen [::]:80;
        server_name campusdrive.yourdomain.com; # <--- YOUR DOMAIN

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server Configuration
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name campusdrive.yourdomain.com; # <--- YOUR DOMAIN

        ssl_certificate /etc/letsencrypt/live/campusdrive.yourdomain.com/fullchain.pem; # <--- YOUR DOMAIN
        ssl_certificate_key /etc/letsencrypt/live/campusdrive.yourdomain.com/privkey.pem; # <--- YOUR DOMAIN

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval';" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # Proxy backend API requests
        location /api/ {
            proxy_pass http://backend:5000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Proxy frontend SSR & client assets
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

### Reload Nginx Configuration
Validate and reload Nginx configuration without stopping the container:
```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

Now you can visit `https://campusdrive.yourdomain.com` in your browser. You should see a secure padlock and be routed cleanly through Nginx.

---

## 8. Common Commands & Maintenance

### Check Logs
View real-time logs for all services or a specific container:
```bash
# All services logs
docker compose logs -f

# Specific container logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Pull Code Updates and Re-build
To deploy updates to the application:
```bash
# Pull new commits
git pull

# Rebuild and start container updates in background
docker compose up -d --build
```

### Stop Services
```bash
docker compose down
```

### PostgreSQL Database Backups
To backup your database to a SQL dump file on the host VPS:
```bash
docker compose exec db pg_dump -U postgres campusdrive_hub > backup.sql
```
To restore a backup:
```bash
docker compose exec -T db psql -U postgres -d campusdrive_hub < backup.sql
```
