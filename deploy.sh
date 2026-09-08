#!/bin/bash
cd "$(dirname "$0")"
# CLOUDFLARE_API_TOKEN se lee del entorno (fuente: memorias/auth.md). NO se versiona.
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN no esta definido. Configuralo antes de deploy." >&2
  exit 1
fi
[ -z "$CLOUDFLARE_ACCOUNT_ID" ] && export CLOUDFLARE_ACCOUNT_ID=b7ccd04fa7c5cd02effd43406b25e4a7
wrangler pages deploy dist --project-name=cuida-a-any