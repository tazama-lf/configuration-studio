#!/bin/sh

cat > /app/dist/runtime-config.js <<EOF
window.RUNTIME_CONFIG = {
  API_BASE_URL: "${VITE_API_BASE_URL:-}",
  APP_TITLE: "${VITE_APP_TITLE:-Tazama Config Studio}",
  APP_ENV: "${VITE_APP_ENV:-production}",
  ALLOWED_HOSTS: "${VITE_ALLOWED_HOSTS:-all}"
};
EOF

exec "$@"