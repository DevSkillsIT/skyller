# SPEC-ORGS-001: Configuração de Variáveis de Ambiente

**Data:** 2026-01-18
**Versão:** 1.0.0
**Status:** ⚠️ AÇÃO MANUAL NECESSÁRIA

---

## ⚠️ IMPORTANTE: Ação Manual Necessária

O arquivo `.env.local` está protegido contra edição automática por conter secrets.

**VOCÊ PRECISA ADICIONAR MANUALMENTE** a seguinte variável ao arquivo:

---

## 📝 Alteração Necessária

### Arquivo: `skyller/.env.local`

**Adicionar após a linha 20 (após `KEYCLOAK_BASE_URL`):**

```bash
# SPEC-ORGS-001: Realm padrão (unificado) - não mais multi-realm
KEYCLOAK_DEFAULT_REALM=Skyller
```

---

## 📋 Arquivo Completo Atualizado

Para referência, o arquivo `.env.local` completo deve ficar assim:

```bash
# ══════════════════════════════════════════════════════════════════════════════
# SKYLLER - Variaveis de Ambiente Multi-Tenant
# ══════════════════════════════════════════════════════════════════════════════

# Nexus Core Backend (AG-UI Protocol)
NEXUS_API_URL=http://localhost:8000

# ══════════════════════════════════════════════════════════════════════════════
# NextAuth v5 (Auth.js)
# ══════════════════════════════════════════════════════════════════════════════

# NEXTAUTH_URL removido - multi-tenant usa AUTH_TRUST_HOST
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=yFSFtc+Tj0AngQ0nmI9WyWJfpk0QAj708gwoM8aD0VU=

# ══════════════════════════════════════════════════════════════════════════════
# Keycloak Base URL
# ══════════════════════════════════════════════════════════════════════════════

KEYCLOAK_BASE_URL=https://idp.servidor.one

# SPEC-ORGS-001: Realm padrão (unificado) - não mais multi-realm
KEYCLOAK_DEFAULT_REALM=Skyller

# ══════════════════════════════════════════════════════════════════════════════
# Multi-Tenant Client Secrets (7 tenants)
# Ref: KEYCLOAK-MULTI-TENANT-AD.md Section 12
# ══════════════════════════════════════════════════════════════════════════════

# Skills IT (26 usuarios) - Tenant padrao
KEYCLOAK_CLIENT_SECRET_SKILLS=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp

# Ramada Atacadista (111 usuarios)
KEYCLOAK_CLIENT_SECRET_RAMADA=8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4

# Lindacor (24 usuarios)
KEYCLOAK_CLIENT_SECRET_LINDACOR=YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ

# WGA Contabil (16 usuarios)
KEYCLOAK_CLIENT_SECRET_WGA=OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU

# Grupo Wink (44 usuarios)
KEYCLOAK_CLIENT_SECRET_GRUPOWINK=tKHc1etMgnVZbszPOh7xdF0a90jMqoQp

# G. Santo Expedito (20 usuarios)
KEYCLOAK_CLIENT_SECRET_GSANTOEXPEDITO=W5ZemzD289TcKbg8WJ80Wqv9Gy8C4qgo

# ServCont (19 usuarios)
KEYCLOAK_CLIENT_SECRET_SERVCONT=hngZOe9KCTNBTYpqkQGIdHooraj3vSvd

# ══════════════════════════════════════════════════════════════════════════════
# Platform Admin (nexus-admin client)
# ══════════════════════════════════════════════════════════════════════════════

KEYCLOAK_ADMIN_CLIENT_SECRET=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp

# ══════════════════════════════════════════════════════════════════════════════
# Tenant padrao para desenvolvimento local
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_TENANT=skills
```

---

## ✅ O Que Foi Alterado

### 1. **keycloak-factory.ts** (Automático ✅)
- `admin.skyller.ai` agora usa realm `Skyller` ao invés de `master`
- Suporte a `KEYCLOAK_DEFAULT_REALM` com fallback para "Skyller"
- Extração do claim `organization` (array legado ou objeto Keycloak 26) em ambos providers

### 2. **callbacks/jwt.ts** (Atual ✅)
- Extração do claim `organization` do access_token (Keycloak 26: objeto)
- Popula `organizations[]` e `organizationObject` na session
- `tenant_id` vem de `tenant_uuid` (UUID canônico)

### 3. **Tipos TypeScript** (Atual ✅)
- `lib/auth/types/index.ts`: `organizations[]` e `organizationObject`
- `types/next-auth.d.ts`: `organizations[]` e `organizationObject` em Session/User/JWT

### 4. **extract-claims.ts** (Atual ✅)
- `extractOrganization()` lida com array legado ou objeto Keycloak 26
- `extractTenant()` usa `organization[0]` apenas para `tenant_slug` (UI), nunca para UUID

### 5. **OrganizationSelector** (Novo ✅)
- Componente React para usuários multi-org selecionarem organization ativa
- Persiste seleção em localStorage
- Oculto automaticamente para usuários single-org

---

## 🔍 Validação

Após adicionar a variável, verifique:

```bash
# No diretório skyller/
grep "KEYCLOAK_DEFAULT_REALM" .env.local

# Deve retornar:
# KEYCLOAK_DEFAULT_REALM=Skyller
```

---

## 🚀 Próximos Passos

1. **Adicionar variável ao .env.local** (manual)
2. **Reiniciar servidor Next.js:**
   ```bash
   cd skyller
   npm run dev
   ```

3. **Testar login em admin.skyller.ai:**
   - Deve autenticar usando realm "Skyller"
   - Deve extrair claim `organization` do JWT (array legado ou objeto Keycloak 26)
   - Session deve conter `user.organizations` (aliases)

4. **Testar usuário multi-org:**
   - Verificar se `<OrganizationSelector />` aparece no header
   - Selecionar organization diferente
   - Verificar se localStorage persiste seleção

---

## 📚 Referências

- **SPEC-ORGS-001**: Migração de 7 realms → 1 realm "Skyller" + 7 Organizations
- **Backend RBACMiddleware**: Valida `X-Tenant-ID` contra claim `organization`
- **Keycloak Organizations**: [Documentação](https://www.keycloak.org/docs/latest/server_admin/#organizations)

---

**Autor:** Claude Sonnet 4.5
**Revisão:** Adriano Fante
**Empresa:** Skills IT - Soluções em TI
