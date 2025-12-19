/**
 * SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak
 * T016: API Route para NextAuth v5
 *
 * Este arquivo expõe os handlers do NextAuth como rotas API do Next.js 16
 * Endpoints criados: GET/POST /api/auth/signin, /api/auth/signout, /api/auth/callback/keycloak
 */

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
