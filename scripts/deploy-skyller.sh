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

echo "🚀 Iniciando deploy do Skyller..."

# Diretório do projeto
cd /opt/skills-ia-platform/skyller

# 1. Parar PM2
echo "⏸️  Parando PM2..."
pm2 stop skyller || true

# 2. Limpar cache Next.js
echo "🧹 Limpando cache Next.js..."
rm -rf .next

# 3. Rebuild
echo "🔨 Fazendo rebuild..."
pnpm build

# 4. Reiniciar PM2
echo "▶️  Reiniciando PM2..."
pm2 restart skyller || pm2 start ecosystem.config.js

# 5. Salvar configuração PM2
pm2 save

echo "✅ Deploy concluído! Skyller rodando em http://localhost:3004"
echo ""
echo "📋 Logs:"
echo "   pm2 logs skyller --lines 50"
echo ""
echo "📊 Status:"
echo "   pm2 status"
