# =============================================================================
# Skyller - Frontend Dockerfile
# SPEC-006: Skyller Frontend com AG-UI Protocol
# =============================================================================

# Estágio 1: Base com Node.js e pnpm
FROM node:20-alpine AS base

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# =============================================================================
# Estágio 2: Instalar dependências
# =============================================================================
FROM base AS deps

# Instalar dependências
RUN pnpm install --frozen-lockfile

# =============================================================================
# Estágio 3: Build da aplicação
# =============================================================================
FROM base AS builder

# Copiar dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Definir variáveis de build (podem ser sobrescritas no docker-compose)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação
RUN pnpm build

# =============================================================================
# Estágio 4: Produção
# =============================================================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public

# Copiar arquivos de build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicialização
CMD ["node", "server.js"]
