#!/usr/bin/env bash
# FestivAI - Cloudflare Free Tier Provisioning & Setup Script
set -e

echo "======================================================"
echo "  🎉 FestivAI - Cloudflare Provisioning & Setup"
echo "  Challenge 5: Celebration & Event Planner"
echo "======================================================"

# 1. Check Wrangler CLI
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx is not installed. Please install Node.js (v18+) and npm."
  exit 1
fi

echo ""
echo "Step 1: Checking Cloudflare Wrangler Authentication..."
if npx wrangler whoami &> /dev/null; then
  echo "✅ Authenticated with Cloudflare."
else
  echo "⚠️ Not logged in to Cloudflare. Launching login..."
  npx wrangler login
fi

echo ""
echo "Step 2: Creating Cloudflare D1 Database 'festivai-db'..."
D1_OUTPUT=$(npx wrangler d1 create festivai-db || true)
echo "$D1_OUTPUT"

# Extract database_id if possible
DB_ID=$(echo "$D1_OUTPUT" | grep -oE "database_id = \"[^\"]+\"" | cut -d'\"' -f2 || echo "")

if [ -n "$DB_ID" ]; then
  echo "✅ Created D1 database ID: $DB_ID"
  echo "Updating wrangler.jsonc with database_id: $DB_ID..."
  # Replace database_id in wrangler.jsonc
  sed -i "s/\"database_id\": \"[^\"]*\"/\"database_id\": \"$DB_ID\"/g" wrangler.jsonc
  echo "✅ Updated wrangler.jsonc."
else
  echo "ℹ️ Note: If festivai-db already exists, get the ID using 'npx wrangler d1 list' and ensure it's in wrangler.jsonc."
fi

echo ""
echo "Step 3: Creating Cloudflare R2 Bucket 'festivai-assets'..."
npx wrangler r2 bucket create festivai-assets || echo "ℹ️ Bucket may already exist."

echo ""
echo "Step 4: Applying schema.sql to Local D1 database..."
npx wrangler d1 execute festivai-db --local --file=./schema.sql
echo "✅ Local D1 database initialized."

echo ""
read -p "Would you like to apply the schema to Remote D1 production database now? (y/N) " APPLY_REMOTE
if [[ "$APPLY_REMOTE" =~ ^[Yy]$ ]]; then
  echo "Applying schema to Remote D1..."
  npx wrangler d1 execute festivai-db --remote --file=./schema.sql
  echo "✅ Remote D1 schema applied."
fi

echo ""
read -p "Would you like to set your Cloudflare Worker Secret OPENAI_API_KEY now? (y/N) " SET_SECRET
if [[ "$SET_SECRET" =~ ^[Yy]$ ]]; then
  echo "Enter your OpenAI API Key when prompted:"
  npx wrangler secret put OPENAI_API_KEY
  echo "✅ OPENAI_API_KEY secret configured in Cloudflare."
fi

echo ""
echo "======================================================"
echo "🎉 Setup complete! Next steps:"
echo "  1. npm run dev        -> Run Next.js locally (with SQLite fallback)"
echo "  2. npm run preview    -> Preview on local Cloudflare Workers runtime"
echo "  3. npm run deploy     -> Deploy production build to Cloudflare Workers"
echo "======================================================"
