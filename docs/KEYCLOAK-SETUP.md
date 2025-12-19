# Configuração do Keycloak para Skyller

**SPEC-006-skyller - Phase 3: US1 - Autenticação Keycloak**
**T021: Documentação de configuração do Keycloak client**

---

## Pré-requisitos

- Keycloak instalado e rodando (versão 26+)
- Acesso admin ao Keycloak
- Realm `skills-it` criado

---

## Passo 1: Criar Client no Keycloak

### 1.1 Acessar Admin Console

1. Acesse o Keycloak Admin Console: `https://idp.servidor.one/admin`
2. Login com credenciais de admin
3. Selecione o realm **skills-it** no dropdown superior esquerdo

### 1.2 Criar novo Client

1. No menu lateral, clique em **Clients**
2. Clique em **Create client**
3. Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Client type** | OpenID Connect |
| **Client ID** | `skyller` |
| **Name** | Skyller - Frontend AG-UI |
| **Description** | Frontend agnóstico do Skills AI Nexus com suporte AG-UI Protocol |

4. Clique em **Next**

### 1.3 Configurar Capability

1. Habilite as seguintes opções:
   - ✅ **Client authentication**: ON (confidential client)
   - ✅ **Authorization**: OFF (não usamos RBAC via Keycloak Authorization Services)
   - ✅ **Standard flow**: ON (Authorization Code Flow)
   - ✅ **Direct access grants**: OFF (não permitir Resource Owner Password Credentials)
   - ✅ **Implicit flow**: OFF (deprecated)
   - ✅ **Service accounts roles**: OFF (não é service account)

2. Clique em **Next**

### 1.4 Configurar Login Settings

Preencha as URLs válidas para o client:

| Campo | Valor (Desenvolvimento) | Valor (Produção) |
|-------|-------------------------|------------------|
| **Root URL** | `http://localhost:3000` | `https://skyller.servidor.one` |
| **Home URL** | `http://localhost:3000` | `https://skyller.servidor.one` |
| **Valid redirect URIs** | `http://localhost:3000/api/auth/callback/keycloak` | `https://skyller.servidor.one/api/auth/callback/keycloak` |
| **Valid post logout redirect URIs** | `http://localhost:3000` | `https://skyller.servidor.one` |
| **Web origins** | `http://localhost:3000` | `https://skyller.servidor.one` |

> **Nota**: Para development, adicione ambas as URLs (localhost E produção) separadas por espaço ou linha.

3. Clique em **Save**

---

## Passo 2: Obter Client Secret

1. Acesse a aba **Credentials** do client `skyller`
2. Copie o **Client secret** gerado
3. Salve em local seguro (será usado no `.env.local`)

---

## Passo 3: Configurar Mappers (Claims Customizados)

Para que o JWT contenha os dados necessários (`tenant_id`, `groups`, `department`), precisamos configurar **Protocol Mappers**.

### 3.1 Mapper: tenant_id

1. Acesse a aba **Client scopes** do client `skyller`
2. Clique no scope **skyller-dedicated**
3. Clique em **Add mapper** > **By configuration** > **Hardcoded claim**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | tenant_id |
| **Token Claim Name** | tenant_id |
| **Claim value** | skills-it |
| **Claim JSON Type** | String |
| **Add to ID token** | ON |
| **Add to access token** | ON |
| **Add to userinfo** | ON |

5. Clique em **Save**

> **Nota**: Em multi-tenant real, esse valor viria de um atributo do usuário ou do realm.

### 3.2 Mapper: groups

1. Novamente em **Client scopes** > **skyller-dedicated**
2. Clique em **Add mapper** > **By configuration** > **Group Membership**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | groups |
| **Token Claim Name** | groups |
| **Full group path** | ON (para incluir hierarquia, ex: `/TI/Suporte`) |
| **Add to ID token** | ON |
| **Add to access token** | ON |
| **Add to userinfo** | ON |

4. Clique em **Save**

### 3.3 Mapper: department (Opcional)

Se quiser adicionar claim de departamento:

1. **Client scopes** > **skyller-dedicated** > **Add mapper** > **User Attribute**
2. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | department |
| **User Attribute** | department |
| **Token Claim Name** | department |
| **Claim JSON Type** | String |
| **Add to ID token** | ON |
| **Add to access token** | ON |
| **Add to userinfo** | ON |

3. Clique em **Save**

> **Nota**: Você precisa adicionar o atributo `department` aos usuários em **Users** > [user] > **Attributes**.

---

## Passo 4: Criar Grupos de Teste

Para testar o claim `groups`:

1. No menu lateral, clique em **Groups**
2. Crie a estrutura de grupos:

```
TI/
├── Suporte
├── Infraestrutura
└── Desenvolvimento
```

3. Para cada grupo:
   - Clique em **Create group**
   - Nome: `TI` (grupo raiz)
   - Clique em **Create**
   - Selecione o grupo `TI`
   - Clique em **Create child group**
   - Nome: `Suporte`
   - Repita para `Infraestrutura` e `Desenvolvimento`

---

## Passo 5: Criar Usuário de Teste

1. No menu lateral, clique em **Users**
2. Clique em **Add user**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Username** | joao.silva |
| **Email** | joao.silva@skills-it.com.br |
| **First name** | João |
| **Last name** | Silva |
| **Email verified** | ON |
| **Enabled** | ON |

4. Clique em **Create**
5. Na aba **Credentials**, clique em **Set password**:
   - Password: `senha123` (apenas para teste local)
   - Temporary: OFF
   - Clique em **Save**
6. Na aba **Groups**, clique em **Join group**:
   - Selecione `/TI/Suporte`
   - Clique em **Join**
7. Na aba **Role mapping**, clique em **Assign role**:
   - Filtre por realm roles
   - Selecione `operator` e `agent-manager`
   - Clique em **Assign**

---

## Passo 6: Configurar Variáveis de Ambiente no Skyller

Edite o arquivo `.env.local` do Skyller:

```bash
# =============================================================================
# Autenticação Keycloak
# =============================================================================

# Keycloak Issuer (Realm URL)
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/skills-it

# Keycloak Client ID
AUTH_KEYCLOAK_ID=skyller

# Keycloak Client Secret (obtido no Passo 2)
AUTH_KEYCLOAK_SECRET=SEU_CLIENT_SECRET_AQUI

# NextAuth Secret (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET=SUA_SECRET_KEY_AQUI

# NextAuth URL (URL do frontend)
NEXTAUTH_URL=http://localhost:3000
```

---

## Passo 7: Testar Autenticação

### 7.1 Iniciar Skyller

```bash
cd /opt/skills-ia-platform/skyller
pnpm dev
```

### 7.2 Acessar a aplicação

1. Abra o navegador em `http://localhost:3000`
2. Você será redirecionado para `http://localhost:3000/api/auth/signin`
3. Clique em **Sign in with Keycloak**
4. Será redirecionado para o Keycloak
5. Faça login com:
   - Username: `joao.silva`
   - Password: `senha123`
6. Será redirecionado de volta para o Skyller autenticado

### 7.3 Verificar Claims

Abra o DevTools do navegador e verifique os headers nas requisições ao backend:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: skills-it
X-User-ID: 1234-5678-9012-3456
X-Groups: /TI/Suporte
```

---

## Passo 8: Produção - Configurações Adicionais

### 8.1 HTTPS Obrigatório

Em produção, configure:

1. Keycloak: **Realm Settings** > **Login** > **Require SSL**: `all requests`
2. Skyller: Use HTTPS (Nginx reverse proxy recomendado)

### 8.2 Token Lifetime

Configure tempos de vida dos tokens em **Realm Settings** > **Tokens**:

| Token | Recomendado |
|-------|-------------|
| **Access Token Lifespan** | 5 minutos |
| **Access Token Lifespan For Implicit Flow** | N/A (disabled) |
| **Client login timeout** | 1 minuto |
| **Login timeout** | 5 minutos |
| **SSO Session Idle** | 30 minutos |
| **SSO Session Max** | 10 horas |

### 8.3 Multi-Tenancy Real

Para multi-tenancy real (múltiplos realms):

1. Crie um realm por tenant (ex: `skills-it`, `grupo-wink`, `ramada-atacadista`)
2. Configure o mesmo client `skyller` em cada realm
3. No frontend, permita que o usuário escolha o tenant no login
4. Altere dinamicamente o `AUTH_KEYCLOAK_ISSUER` baseado no tenant selecionado

---

## Troubleshooting

### Erro: "Invalid redirect_uri"

**Causa**: URL de callback não está nas **Valid redirect URIs**
**Solução**: Adicione `http://localhost:3000/api/auth/callback/keycloak` no Keycloak

### Erro: "Client authentication failed"

**Causa**: Client secret incorreto no `.env.local`
**Solução**: Copie novamente o secret da aba **Credentials** do client

### Claims não aparecem no JWT

**Causa**: Mappers não configurados ou não adicionados ao scope correto
**Solução**: Verifique que os mappers estão no scope **skyller-dedicated** e que o scope está incluído no client

### Grupos vazios no JWT

**Causa**: Usuário não foi adicionado a nenhum grupo
**Solução**: Vá em **Users** > [user] > **Groups** e adicione o usuário aos grupos

---

## Referências

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [NextAuth.js Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [OpenID Connect Protocol](https://openid.net/connect/)
- [SPEC-006-skyller](/.moai/specs/SPEC-006-skyller/)

---

**Skills IT Soluções em Tecnologia** | Skyller | Dezembro 2025
