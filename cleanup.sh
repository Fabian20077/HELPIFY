#!/bin/bash
# Helpify — Cleanup Script
# Elimina archivos temporales, caches y dependencias

set -e

echo "🧹 Limpiando proyecto Helpify..."

# Frontend
echo "  📦 Limpiando frontend..."
cd frontend
rm -rf .next .swc node_modules next-env.d.ts 2>/dev/null || true
echo "    ✅ Frontend limpio"
cd ..

# Backend
echo "  📦 Limpiando backend..."
cd backend
rm -rf dist node_modules 2>/dev/null || true
echo "    ✅ Backend limpio"
cd ..

# Root
echo "  🗑️ Eliminando caches root..."
rm -rf .qwen/output-language.md.bak 2>/dev/null || true

echo ""
echo "✅ Limpieza completa!"
echo ""
echo "Para reinstalar dependencias:"
echo "  cd backend && npm install"
echo "  cd ../frontend && npm install"
echo "  docker compose up -d"
echo "  cd backend && npm run db:push && npm run db:seed"
