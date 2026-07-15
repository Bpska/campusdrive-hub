#!/bin/bash
# Full rebuild and restart on VPS
set -e

echo "=== Pulling latest code ==="
cd /root/crm
git pull

echo "=== Rebuilding backend ==="
cd /root/crm/backend
npm install
npm run build

echo "=== Rebuilding frontend ==="
cd /root/crm
npm install
npm run build

echo "=== Restarting PM2 services ==="
pm2 restart all || pm2 start .output/server/index.mjs --name crm-frontend
pm2 restart crm-backend || (cd /root/crm/backend && pm2 start dist/index.js --name crm-backend)

echo "=== Testing /api/students/meta ==="
sleep 2
curl -s "http://localhost:3000/api/students/meta" | head -c 300

echo ""
echo "=== Testing student data sample ==="
curl -s "http://localhost:3000/api/students?limit=2" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(s.get('address','')) for s in d.get('students',[])]" 2>/dev/null || echo "done"

echo ""
echo "=== Deploy complete ==="
pm2 list
