# Plano de Implementacao: JWT Passthrough Skyller -> Backend

**Documento**: Plano para implementar autenticacao JWT entre Skyller e Nexus Core
**Versao**: 1.0.0
**Data**: 2025-12-19
**Status**: PENDENTE IMPLEMENTACAO

---

## 1. Arquivos e Localizacoes Importantes

### 1.1 Servidor Keycloak (idp.servidor.one - 172.16.1.21)

| Arquivo | Localizacao | Descricao |
|---------|-------------|-----------|
| docker-compose.yml | `/opt/keycloak/docker-compose.yml` | Configuracao do container |
| .env | `/opt/keycloak/.env` | Variaveis de ambiente (PostgreSQL) |
| cacerts | `/opt/keycloak/certs/cacerts` | Truststore com certificados SSL |
| wga.crt | `/opt/keycloak/certs/wga.crt` | Certificado do AD WGA |

### 1.2 Documentacao do Projeto

| Arquivo | Localizacao | Descricao |
|---------|-------------|-----------|
| Configuracao Multi-Tenant | `skyller/docs/KEYCLOAK-MULTI-TENANT-AD.md` | Config de realms, ADs, mappers |
| Guia Novo Realm | `skyller/docs/KEYCLOAK-NOVO-REALM-GUIA.md` | Como adicionar novo tenant |
| Deployment | `skyller/docs/KEYCLOAK-DEPLOYMENT.md` | Credenciais e comandos |
| Setup Client | `skyller/docs/KEYCLOAK-SETUP.md` | Configuracao inicial |
| **Este Plano** | `skyller/docs/KEYCLOAK-IMPLEMENTACAO-PLANO.md` | Plano de implementacao |

### 1.3 Credenciais

| Item | Valor |
|------|-------|
| **Admin Console** | https://idp.servidor.one/admin |
| **Usuario Admin** | `skills-admin` |
| **Senha Admin** | `Sk@2024,TI` |
| **SSH Server** | `root@172.16.1.21` / `Sk@2024,TI` |

---

## 2. Status Atual (Dezembro 2025)

### 2.1 Realms Configurados

| Realm | AD | Usuarios | Client Secret |
|-------|-----|----------|---------------|
| skills | 172.16.1.10 | 43 | `nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp` |
| ramada | 172.16.100.10 | 199 | `8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4` |
| lindacor | 172.16.100.10 | 46 | `YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ` |
| wga | wgpmwescrivm010.wga.local | 21 | `OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU` |

### 2.2 Protocol Mappers (Claims no JWT)

Todos os realms tem os seguintes claims configurados:

| Claim | Tipo | Descricao |
|-------|------|-----------|
| `sub` | Padrao OIDC | UUID do usuario |
| `preferred_username` | Padrao OIDC | sAMAccountName |
| `email` | Padrao OIDC | Email do usuario |
| `tenant_id` | Hardcoded | Nome do realm (ex: ramada) |
| `tenant_name` | Hardcoded | Nome legivel (ex: Ramada Atacadista) |
| `groups` | Group Membership | Grupos do AD (full path) |
| `department` | User Attribute | Departamento |
| `company` | User Attribute | Empresa |
| `title` | User Attribute | Cargo |
| `full_name` | User Attribute | displayName |
| `phone` | User Attribute | Telefone |
| `mobile` | User Attribute | Celular |
| `office` | User Attribute | Escritorio |
| `city` | User Attribute | Cidade |
| `state` | User Attribute | Estado |

---

## 3. Arquitetura JWT Passthrough

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Skyller   │────▶│   Nexus     │────▶│   LiteLLM   │
│             │     │  (NextAuth) │     │   Core      │     │   + MCPs    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   │
                    ┌──────▼──────┐            │
                    │  Keycloak   │            │
                    │  (IDP)      │◀───────────┘
                    └─────────────┘      (valida JWT)
```

### 3.1 Fluxo de Autenticacao

1. Usuario acessa `ramada.skyller.ai`
2. Skyller redireciona para Keycloak (`/realms/ramada/protocol/openid-connect/auth`)
3. Usuario faz login no Keycloak
4. Keycloak retorna JWT (access_token + id_token + refresh_token)
5. NextAuth cria sessao com os tokens
6. Usuario faz requisicao ao agente
7. Skyller envia `Authorization: Bearer <access_token>` para Nexus Core
8. **Nexus Core VALIDA o JWT**:
   - Verifica assinatura usando JWKS do Keycloak
   - Verifica expiracao (exp)
   - Verifica issuer (iss = https://idp.servidor.one/realms/ramada)
   - Verifica audience (aud = skyller)
9. Nexus Core extrai claims do JWT (tenant_id, groups, etc)
10. Processa requisicao com isolamento multi-tenant

---

## 4. Tarefas de Implementacao

### 4.1 Skyller (Frontend)

#### Tarefa S1: Configurar NextAuth Multi-Tenant

**Arquivo**: `skyller/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

// Determinar realm baseado no hostname
function getRealmFromHost(host: string): string {
  const subdomain = host.split('.')[0]
  const realmMap: Record<string, string> = {
    'skills': 'skills',
    'ramada': 'ramada',
    'lindacor': 'lindacor',
    'wga': 'wga',
    'localhost': 'skills', // desenvolvimento
  }
  return realmMap[subdomain] || 'skills'
}

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Salvar access_token na sessao
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      // Expor access_token para o frontend
      session.accessToken = token.accessToken
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### Tarefa S2: Criar Hook para Requisicoes Autenticadas

**Arquivo**: `skyller/src/hooks/useAuthenticatedFetch.ts`

```typescript
import { useSession } from "next-auth/react"

export function useAuthenticatedFetch() {
  const { data: session } = useSession()

  async function authenticatedFetch(url: string, options: RequestInit = {}) {
    if (!session?.accessToken) {
      throw new Error("Not authenticated")
    }

    const headers = new Headers(options.headers)
    headers.set("Authorization", `Bearer ${session.accessToken}`)
    headers.set("Content-Type", "application/json")

    return fetch(url, {
      ...options,
      headers,
    })
  }

  return { authenticatedFetch, isAuthenticated: !!session }
}
```

#### Tarefa S3: Configurar Variaveis por Ambiente

**Arquivo**: `.env.local` (desenvolvimento)

```bash
# Keycloak - Skills (desenvolvimento)
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/skills
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Backend
NEXUS_CORE_URL=http://localhost:8000
```

### 4.2 Nexus Core (Backend)

#### Tarefa N1: Criar Middleware de Validacao JWT

**Arquivo**: `nexus_core/src/middleware/jwt_validator.py`

```python
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import httpx
from functools import lru_cache

# Cache JWKS por 1 hora
@lru_cache(maxsize=10)
async def get_jwks(issuer: str):
    """Busca JWKS do Keycloak"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{issuer}/protocol/openid-connect/certs")
        return response.json()

async def validate_jwt(request: Request) -> dict:
    """Valida JWT e retorna claims"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]

    try:
        # Decodificar header para pegar kid
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.get_unverified_claims(token)

        issuer = unverified_claims.get("iss")
        if not issuer or "idp.servidor.one" not in issuer:
            raise HTTPException(status_code=401, detail="Invalid issuer")

        # Buscar JWKS
        jwks = await get_jwks(issuer)

        # Encontrar chave correta
        key = None
        for k in jwks["keys"]:
            if k["kid"] == unverified_header["kid"]:
                key = k
                break

        if not key:
            raise HTTPException(status_code=401, detail="Key not found")

        # Validar JWT
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="skyller",
            issuer=issuer,
        )

        return claims

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Dependency para FastAPI
async def get_current_user(request: Request) -> dict:
    return await validate_jwt(request)
```

#### Tarefa N2: Criar Context Multi-Tenant

**Arquivo**: `nexus_core/src/context/tenant.py`

```python
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class TenantContext:
    """Contexto do tenant extraido do JWT"""
    tenant_id: str
    tenant_name: str
    user_id: str
    username: str
    email: Optional[str]
    groups: List[str]
    department: Optional[str]
    company: Optional[str]
    roles: List[str]

    @classmethod
    def from_jwt_claims(cls, claims: dict) -> "TenantContext":
        return cls(
            tenant_id=claims.get("tenant_id", "unknown"),
            tenant_name=claims.get("tenant_name", "Unknown"),
            user_id=claims.get("sub"),
            username=claims.get("preferred_username"),
            email=claims.get("email"),
            groups=claims.get("groups", []),
            department=claims.get("department"),
            company=claims.get("company"),
            roles=claims.get("realm_access", {}).get("roles", []),
        )
```

#### Tarefa N3: Usar Context nos Endpoints

**Arquivo**: `nexus_core/src/api/routes.py`

```python
from fastapi import APIRouter, Depends
from ..middleware.jwt_validator import get_current_user
from ..context.tenant import TenantContext

router = APIRouter()

@router.post("/chat")
async def chat(
    message: str,
    claims: dict = Depends(get_current_user)
):
    # Criar contexto do tenant
    ctx = TenantContext.from_jwt_claims(claims)

    # Usar tenant_id para isolamento
    # Ex: filtrar tools por tenant, usar RLS no banco, etc.

    return {
        "tenant_id": ctx.tenant_id,
        "user": ctx.username,
        "message": f"Processando para tenant {ctx.tenant_name}"
    }
```

---

## 5. Checklist de Implementacao

### Keycloak (CONCLUIDO)
- [x] Keycloak instalado em idp.servidor.one
- [x] Realms criados (skills, ramada, lindacor, wga)
- [x] LDAP User Federation configurado
- [x] Protocol Mappers criados em todos realms
- [x] Client skyller configurado em todos realms
- [x] Roles criadas
- [x] Usuarios locais criados
- [x] Documentacao criada

### Skyller (PENDENTE)
- [ ] Tarefa S1: Configurar NextAuth Multi-Tenant
- [ ] Tarefa S2: Criar Hook useAuthenticatedFetch
- [ ] Tarefa S3: Configurar variaveis por ambiente
- [ ] Testar login em cada subdominio
- [ ] Testar refresh token

### Nexus Core (PENDENTE)
- [ ] Tarefa N1: Criar Middleware JWT Validator
- [ ] Tarefa N2: Criar TenantContext
- [ ] Tarefa N3: Integrar nos endpoints
- [ ] Testar validacao JWT
- [ ] Implementar RLS com tenant_id

### Infraestrutura (PENDENTE)
- [ ] Configurar DNS para subdomínios (skills.skyller.ai, etc)
- [ ] Configurar Nginx para subdomínios
- [ ] Configurar SSL para subdomínios

---

## 6. Comandos Uteis

### Acessar servidor Keycloak
```bash
ssh root@172.16.1.21
# Senha: Sk@2024,TI
```

### Gerenciar containers
```bash
cd /opt/keycloak
docker compose ps
docker compose logs -f keycloak
docker compose restart keycloak
```

### Obter token admin via CLI
```bash
TOKEN=$(curl -sk -X POST "https://idp.servidor.one/realms/master/protocol/openid-connect/token" \
  -d "username=skills-admin" -d "password=Sk@2024,TI" \
  -d "grant_type=password" -d "client_id=admin-cli" | jq -r '.access_token')
```

### Listar realms
```bash
curl -sk "https://idp.servidor.one/admin/realms" \
  -H "Authorization: Bearer $TOKEN" | jq '.[].realm'
```

### Forcar sincronizacao LDAP
```bash
# Obter ID do componente LDAP
LDAP_ID=$(curl -sk "https://idp.servidor.one/admin/realms/ramada/components?type=org.keycloak.storage.UserStorageProvider" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Sincronizar
curl -sk -X POST "https://idp.servidor.one/admin/realms/ramada/user-storage/$LDAP_ID/sync?action=triggerFullSync" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Troubleshooting

### Erro: SSLHandshakeFailed no LDAP WGA
- WGA requer LDAPS ou StartTLS
- Certificado esta em `/opt/keycloak/certs/cacerts`
- Hostname mapeado via `extra_hosts` no docker-compose

### Erro: AuthenticationFailure no LDAP
- Verificar senha do bind DN
- Cada AD tem sua propria senha (NAO sao iguais!)

### Erro: Cannot parse the JSON
- Bug do kcadm.sh quando ha LDAP configurado
- Use API REST em vez de kcadm.sh

### Erro: Invalid redirect_uri
- Adicionar URL nas Valid redirect URIs do client skyller
- Incluir tanto localhost quanto producao

---

**Skills IT Solucoes em Tecnologia** | Skills AI Nexus | Dezembro 2025
