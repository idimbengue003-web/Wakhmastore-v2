#!/bin/bash
# Build script for Vercel - forces complete Prisma regeneration
set -e

echo "=== Wakhma Store Build Script ==="
echo "Step 1: Remove ALL Prisma cache"
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf src/generated/prisma

echo "Step 2: Verify schema.prisma has postgresql"
HEAD_LINE=$(head -10 prisma/schema.prisma | grep "provider")
echo "Schema datasource: $HEAD_LINE"

echo "Step 3: Generate Prisma Client"
npx prisma generate

echo "Step 4: Verify generated client has postgresql"
if [ -f "src/generated/prisma/runtime/library.js" ]; then
  if grep -q "sqlite" src/generated/prisma/runtime/library.js 2>/dev/null; then
    echo "ERROR: Generated client still contains sqlite!"
    exit 1
  else
    echo "OK: Generated client does not contain sqlite"
  fi
fi

echo "Step 5: Build Next.js"
npx next build

echo "=== Build Complete ==="
