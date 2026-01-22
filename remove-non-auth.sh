#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Script de Remoção Agressiva de Arquivos Não-Auth
# Gerado em: 2026-01-20 15:49:50
# Backup em: ../skyller-backup-20260120-154950
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de remoções
REMOVED_COUNT=0

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  REMOÇÃO AGRESSIVA DE ARQUIVOS NÃO-AUTH DO ALCHIMIE${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Função para remover com log
remove_item() {
    local item="$1"
    if [ -e "$item" ]; then
        echo -e "${RED}🗑️  Removendo:${NC} $item"
        rm -rf "$item"
        ((REMOVED_COUNT++))
    else
        echo -e "${YELLOW}⚠️  Não encontrado:${NC} $item (já removido ou inexistente)"
    fi
}

# ═══════════════════════════════════════════════════════════
# FASE 1: Documentação .MD
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}📋 FASE 1: Removendo documentação .md${NC}"
remove_item "./README.md"
remove_item "./BACKEND_SETUP_GUIDE.md"
remove_item "./AGENT_PROTOCOLS_GUIDE.md"
remove_item "./MULTI_AGENT_ARCHITECTURE.md"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 2: Componentes Não-Auth
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🧩 FASE 2: Removendo componentes não-auth${NC}"
remove_item "./components/agent-chat.tsx"
remove_item "./components/agent-chat.tsx.thesys.bak"
remove_item "./components/home-client.tsx"
remove_item "./components/integration-settings.tsx"
remove_item "./components/mcp-manager.tsx"
remove_item "./components/project-manager.tsx"
remove_item "./components/sidebar.tsx"
remove_item "./components/upload-manager.tsx"
remove_item "./components/theme-provider.tsx"
remove_item "./components/providers"
remove_item "./components/ui"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 3: API Routes Não-Auth
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🔌 FASE 3: Removendo API routes não-auth${NC}"
remove_item "./app/api/agents"
remove_item "./app/api/copilot"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 4: Página Principal
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}📄 FASE 4: Removendo página principal antiga${NC}"
remove_item "./app/page.tsx"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 5: Biblioteca (lib/)
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}📚 FASE 5: Removendo utilitários não-auth${NC}"
remove_item "./lib/api-client.ts"
remove_item "./lib/api-server.ts"
remove_item "./lib/utils.ts"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 6: Testes
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🧪 FASE 6: Removendo testes antigos${NC}"
remove_item "./e2e"
remove_item "./tests"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 7: Scripts
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}📜 FASE 7: Removendo scripts${NC}"
remove_item "./scripts"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 8: Assets Públicos (Placeholders)
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🖼️  FASE 8: Removendo assets placeholders${NC}"
remove_item "./public/placeholder.jpg"
remove_item "./public/placeholder-logo.png"
remove_item "./public/placeholder-logo.svg"
remove_item "./public/placeholder.svg"
remove_item "./public/placeholder-user.jpg"
remove_item "./public/apple-icon.png"
remove_item "./public/icon-dark-32x32.png"
remove_item "./public/icon-light-32x32.png"
remove_item "./public/icon.svg"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 9: Estilos (conflito com v0)
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🎨 FASE 9: Removendo diretório styles/ (v0 trará o seu)${NC}"
remove_item "./styles"
echo ""

# ═══════════════════════════════════════════════════════════
# FASE 10: Temporários
# ═══════════════════════════════════════════════════════════
echo -e "${GREEN}🗑️  FASE 10: Removendo arquivos temporários${NC}"
remove_item "./tsconfig.tsbuildinfo"
echo ""

# ═══════════════════════════════════════════════════════════
# RELATÓRIO FINAL
# ═══════════════════════════════════════════════════════════
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ REMOÇÃO CONCLUÍDA!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📊 ${GREEN}Total de itens removidos:${NC} $REMOVED_COUNT"
echo ""
echo -e "${GREEN}📁 Arquivos mantidos (auth + configs):${NC}"
echo "   - auth.ts, auth.config.ts, proxy.ts"
echo "   - components/auth/* (8 arquivos)"
echo "   - components/organization-selector.tsx"
echo "   - app/api/auth/* (3 routes)"
echo "   - app/auth/* (2 pages)"
echo "   - app/layout.tsx, app/globals.css"
echo "   - lib/auth/* (11 arquivos)"
echo "   - lib/env.ts"
echo "   - types/next-auth.d.ts"
echo "   - Configs: tsconfig, next.config, package.json, etc."
echo ""
echo -e "${YELLOW}🔍 Verificando estrutura final...${NC}"
echo ""

# Mostrar estrutura final
tree -L 2 -I 'node_modules|.git|.next|skyller-frontend-implementation-v0' -a || echo "(tree não disponível - use 'ls -R')"

echo ""
echo -e "${GREEN}✅ Pronto para copiar código v0 para raiz!${NC}"
echo ""
