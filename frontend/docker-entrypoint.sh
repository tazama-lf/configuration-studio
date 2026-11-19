#!/bin/sh
# SPDX-License-Identifier: Apache-2.0

# Generate the runtime configuration consumed by index.html before the web
# server starts, and write serve's security headers config (issue #45) -
# serve sends none by default and has no CLI flag for them.

set -e

cat > /app/dist/runtime-config.js <<EOF
window.RUNTIME_CONFIG = {
  API_BASE_URL: "${VITE_API_BASE_URL:-}",
  APP_TITLE: "${VITE_APP_TITLE:-Tazama Config Studio}",
  APP_ENV: "${VITE_APP_ENV:-production}",
  ALLOWED_HOSTS: "${VITE_ALLOWED_HOSTS:-all}"
};
EOF

cat > /app/serve.json <<EOF
{
  "headers": [
    {
      "source": "**/*",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "no-referrer" }
      ]
    }
  ]
}
EOF

exec "$@"