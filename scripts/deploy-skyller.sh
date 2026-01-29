#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Skyller Deployment Script
# ══════════════════════════════════════════════════════════════════════════════
# Este script automatiza o deploy do Skyller com limpeza de cache e rebuild
#
# Uso:
#   ./scripts/deploy-skyller.sh
#
# O que faz:
# 1. Para o PM2
# 2. Limpa cache Next.js (.next)
# 3. Faz rebuild completo
# 4. Reinicia PM2
# ══════════════════════════════════════════════════════════════════════════════

set -e  # Sair se qualquer comando falhar

# Debug opcional: DEPLOY_DEBUG=1 bash scripts/deploy-skyller.sh
if [ "${DEPLOY_DEBUG:-0}" = "1" ]; then
  set -x
fi

echo "🚀 Iniciando deploy do Skyller..."

# Diretório do projeto (pode executar o script de qualquer lugar)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
cd "${PROJECT_DIR}"

echo "📌 Versão (git): $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# 1. Parar PM2
echo "⏸️  Parando PM2..."
pm2 stop skyller || true

# 2. Limpar caches de build
echo "🧹 Limpando caches de build (Next/TS/Turbo)..."
rm -rf .next .turbo tsconfig.tsbuildinfo

# 3. Instalar dependências (determinístico)
echo "📦 Instalando dependências (lockfile)..."
set +e
pnpm install --frozen-lockfile
install_exit=$?
set -e

if [ $install_exit -ne 0 ]; then
  echo "⚠️  pnpm-lock.yaml desatualizado em relação ao package.json."
  echo "⚠️  Fazendo fallback para: pnpm install --no-frozen-lockfile"
  pnpm install --no-frozen-lockfile
fi

# Rebuild
echo "🔨 Fazendo rebuild..."
pnpm build

# 5. Reiniciar PM2 garantindo cwd/env do ecosystem
echo "▶️  Reiniciando PM2 (startOrReload com update-env)..."
pm2 startOrReload ecosystem.config.js --only skyller --update-env

# 6. Salvar configuração PM2
pm2 save

# 7. Mostrar status e onde o PM2 está rodando
echo "📊 Status do PM2:"
pm2 status
echo "📍 Detalhes do processo skyller (primeiras linhas):"
pm2 describe skyller | sed -n '1,80p'

echo "✅ Deploy concluído! Skyller rodando em http://localhost:3004"
echo ""
echo "📋 Logs:"
echo "   pm2 logs skyller --lines 50"
echo ""
echo "📊 Status:"
echo "   pm2 status"
