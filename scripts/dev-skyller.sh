#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Skyller Development Script (PM2 + Hot Reload)
# ══════════════════════════════════════════════════════════════════════════════
# Este script roda o Skyller em modo DEV com PM2, sem precisar de rebuild
#
# Uso:
#   ./scripts/dev-skyller.sh [start|stop|restart|logs|status]
#
# Comandos:
#   start    - Inicia Skyller em modo DEV
#   stop     - Para o Skyller
#   restart  - Reinicia o Skyller
#   logs     - Mostra logs em tempo real
#   status   - Mostra status do PM2
#
# Diferenças para produção:
#   - Usa `pnpm dev` em vez de `pnpm build` + `pnpm start`
#   - Hot Module Replacement (HMR) automático
#   - Não limpa cache .next
#   - NODE_ENV=development
# ══════════════════════════════════════════════════════════════════════════════

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="skyller-dev"
PORT=3005

# Função de log
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Diretório do projeto
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
cd "${PROJECT_DIR}"

# Criar config PM2 para dev se não existir
create_ecosystem_dev() {
  log_info "Criando config PM2 para ambiente de desenvolvimento..."

  cat > ecosystem.config.dev.js <<EOF
module.exports = {
  apps: [
    {
      name: "${APP_NAME}",
      cwd: "${PROJECT_DIR}",
      script: "node_modules/.bin/next",
      args: "dev --port ${PORT}",
      instances: 1,
      exec_mode: "fork",

      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",

      // Logs
      error_file: "/root/.pm2/logs/${APP_NAME}-error.log",
      out_file: "/root/.pm2/logs/${APP_NAME}-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: "development",
        PORT: ${PORT},
      },

      // Health monitoring
      kill_timeout: 10000,
      listen_timeout: 5000,

      // Watch mode (opcional - reinicia se alterar arquivos)
      // watch: true,
      // ignore_watch: ["node_modules", ".next", ".git"],
    },
  ],
};
EOF

  log_success "Config criada: ecosystem.config.dev.js"
}

# Comando: start
cmd_start() {
  log_info "Iniciando Skyller em modo DEV..."
  
  # Criar config se não existir
  if [ ! -f ecosystem.config.dev.js ]; then
    create_ecosystem_dev
  fi

  # Instalar dependências se necessário
  if [ ! -d node_modules ]; then
    log_info "Instalando dependências..."
    pnpm install
  fi

  # Iniciar PM2
  pm2 start ecosystem.config.dev.js
  pm2 save

  log_success "Skyller DEV iniciado em http://localhost:${PORT}"
  log_info "Logs: pm2 logs ${APP_NAME}"
  log_info "Status: pm2 status"
}

# Comando: stop
cmd_stop() {
  log_info "Parando Skyller DEV..."
  pm2 stop ${APP_NAME} || true
  log_success "Skyller DEV parado"
}

# Comando: restart
cmd_restart() {
  log_info "Reiniciando Skyller DEV..."
  cmd_stop
  cmd_start
}

# Comando: logs
cmd_logs() {
  log_info "Mostrando logs em tempo real (Ctrl+C para sair)..."
  pm2 logs ${APP_NAME}
}

# Comando: status
cmd_status() {
  pm2 status
  echo ""
  pm2 describe ${APP_NAME} || echo "App ${APP_NAME} não está rodando"
}

# Menu principal
case "${1:-start}" in
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    cmd_restart
    ;;
  logs)
    cmd_logs
    ;;
  status)
    cmd_status
    ;;
  *)
    echo "Uso: $0 [start|stop|restart|logs|status]"
    echo ""
    echo "Comandos:"
    echo "  start    - Inicia Skyller em modo DEV"
    echo "  stop     - Para o Skyller"
    echo "  restart  - Reinicia o Skyller"
    echo "  logs     - Mostra logs em tempo real"
    echo "  status   - Mostra status do PM2"
    exit 1
    ;;
esac
