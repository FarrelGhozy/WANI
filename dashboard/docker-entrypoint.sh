#!/bin/sh
set -e

cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  API_URL: '${VITE_API_URL:-/api}'
};
EOF

exec nginx -g "daemon off;"
