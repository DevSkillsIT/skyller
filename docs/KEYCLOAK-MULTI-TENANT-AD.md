# Keycloak Multi-Tenant com Active Directory

**Documento**: Configuracao Completa Multi-Tenant
**Versao**: 1.0.0
**Data**: 2025-12-19
**Status**: IMPLEMENTADO

---

## 1. Visao Geral da Arquitetura

```
+------------------------------------------------------------------+
|                    KEYCLOAK (idp.servidor.one)                     |
+------------------------------------------------------------------+
|                                                                    |
|  +-- Realm: master (admin do Keycloak)                            |
|  |   Usuario: skills-admin / Sk@2024,TI                           |
|  |                                                                 |
|  +-- Realm: skills <-- Skills IT (43 usuarios)                    |
|  |   +-- User Federation: AD 172.16.1.10                          |
|  |   +-- OU: OU=_Empresas,DC=ad,DC=skillsit,DC=com,DC=br          |
|  |   +-- Usuarios locais: admin123, operator, user                |
|  |                                                                 |
|  +-- Realm: ramada <-- Ramada (199 usuarios)                      |
|  |   +-- User Federation: AD 172.16.100.10                        |
|  |   +-- OU: OU=Ramada,OU=_Empresas,DC=RAMADA,DC=LOCAL            |
|  |   +-- Usuarios locais: admin123, operator, user                |
|  |                                                                 |
|  +-- Realm: lindacor <-- Lindacor (46 usuarios)                   |
|  |   +-- User Federation: AD 172.16.100.10 (mesmo AD Ramada)      |
|  |   +-- OU: OU=Lindacor,OU=_Empresas,DC=RAMADA,DC=LOCAL          |
|  |   +-- Usuarios locais: admin123, operator, user                |
|  |                                                                 |
|  +-- Realm: wga <-- WGA Contabil (21 usuarios)                    |
|      +-- User Federation: AD wgpmwescrivm010.wga.local (LDAPS)    |
|      +-- OU: OU=_WGA_Contabil,DC=wga,DC=local                     |
|      +-- Usuarios locais: admin123, operator, user                |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 2. Estrutura de Subdominio -> Realm

| Subdominio | Realm Keycloak | Tenant ID |
|------------|----------------|-----------|
| skills.skyller.ai | skills | skills |
| ramada.skyller.ai | ramada | ramada |
| lindacor.skyller.ai | lindacor | lindacor |
| wga.skyller.ai | wga | wga |
| gsm.skyller.ai | gsm (futuro) | gsm |

**Nota**: Lindacor e Ramada usam o mesmo AD (172.16.100.10), mas sao realms separados com OUs diferentes.

---

## 3. Configuracao dos Active Directories

### 3.1 AD Skills IT

| Campo | Valor |
|-------|-------|
| **IP** | 172.16.1.10 |
| **Dominio** | DC=ad,DC=skillsit,DC=com,DC=br |
| **Bind DN** | CN=Administrator,CN=Users,DC=ad,DC=skillsit,DC=com,DC=br |
| **Bind User** | ad\administrator |
| **Bind Password** | Skills@2017,TI |
| **Users DN** | OU=_Empresas,DC=ad,DC=skillsit,DC=com,DC=br |
| **Realm Keycloak** | skills |

### 3.2 AD Ramada (Ramada + Lindacor)

| Campo | Valor |
|-------|-------|
| **IP** | 172.16.100.10 |
| **Dominio** | DC=RAMADA,DC=LOCAL |
| **Bind DN** | CN=Skills IT Solucoes em TI,OU=Terceirizados,OU=TI,OU=Escritorio_Barra,OU=Ramada,OU=_Empresas,DC=RAMADA,DC=LOCAL |
| **Bind User** | ramada\skills |
| **Bind Password** | Sk@2024,TI |
| **Users DN Ramada** | OU=Ramada,OU=_Empresas,DC=RAMADA,DC=LOCAL |
| **Users DN Lindacor** | OU=Lindacor,OU=_Empresas,DC=RAMADA,DC=LOCAL |
| **Realm Keycloak** | ramada |

### 3.3 AD WGA Contabil

| Campo | Valor |
|-------|-------|
| **IP** | 172.16.85.10 |
| **Dominio** | DC=wga,DC=local |
| **Bind DN** | CN=Skills IT,OU=TI,OU=Palmas,OU=_WGA_Contabil,DC=wga,DC=local |
| **Bind User** | wga\skills |
| **Bind Password** | Sk@2024,TI |
| **Users DN** | OU=_WGA_Contabil,DC=wga,DC=local |
| **Realm Keycloak** | wga |

---

## 4. Campos AD a Mapear

### 4.1 Campos de Identidade

| Campo AD | Atributo LDAP | Mapeamento Keycloak | Claim JWT |
|----------|---------------|---------------------|-----------|
| sAMAccountName | sAMAccountName | username | preferred_username |
| UserPrincipalName | userPrincipalName | attribute | upn |
| givenName | givenName | firstName | given_name |
| sn | sn | lastName | family_name |
| displayName | displayName | attribute | full_name |
| name | name | attribute | cn |
| mail | mail | email | email |

### 4.2 Campos Organizacionais

| Campo AD | Atributo LDAP | Mapeamento Keycloak | Claim JWT |
|----------|---------------|---------------------|-----------|
| company | company | attribute | company |
| department | department | attribute | department |
| title | title | attribute | title |
| description | description | attribute | description |
| physicalDeliveryOfficeName | physicalDeliveryOfficeName | attribute | office |

### 4.3 Campos de Contato

| Campo AD | Atributo LDAP | Mapeamento Keycloak | Claim JWT |
|----------|---------------|---------------------|-----------|
| telephoneNumber | telephoneNumber | attribute | phone |
| mobile | mobile | attribute | mobile |
| ipPhone | ipPhone | attribute | ip_phone |
| wWWHomePage | wWWHomePage | attribute | website |

### 4.4 Campos de Endereco

| Campo AD | Atributo LDAP | Mapeamento Keycloak | Claim JWT |
|----------|---------------|---------------------|-----------|
| streetAddress | streetAddress | attribute | street |
| l | l | attribute | city |
| st | st | attribute | state |
| postalCode | postalCode | attribute | postal_code |

---

## 5. Estrutura de Roles

### 5.1 Realm Roles (RBAC)

| Role | Descricao | Permissoes |
|------|-----------|------------|
| `admin` | Administrador completo | Tudo |
| `operator` | Operador - executa e aprova HITL | Executar agentes, aprovar HITL, ver logs |
| `viewer` | Visualizador - somente leitura | Ver conversas, ver agentes |
| `agent-manager` | Gerenciador de agentes | Criar/editar/deletar agentes |

### 5.2 Permissoes por Role

```
admin
├── agent:create
├── agent:read
├── agent:update
├── agent:delete
├── hitl:approve
├── hitl:reject
├── conversation:read
├── conversation:delete
├── settings:manage
└── users:manage

operator
├── agent:read
├── agent:execute
├── hitl:approve
├── hitl:reject
├── conversation:read
└── conversation:create

viewer
├── agent:read
├── conversation:read (proprias)
└── dashboard:view
```

---

## 6. Usuarios Locais por Realm

### 6.1 Usuario admin123

| Campo | Valor |
|-------|-------|
| Username | admin123 |
| Password | admin123 |
| Email | admin@{realm}.local |
| Roles | admin |
| Descricao | Admin local para testes e emergencias |

### 6.2 Usuario operator

| Campo | Valor |
|-------|-------|
| Username | operator |
| Password | operator |
| Email | operator@{realm}.local |
| Roles | operator |
| Descricao | Operador para testes |

### 6.3 Usuario user

| Campo | Valor |
|-------|-------|
| Username | user |
| Password | user123 |
| Email | user@{realm}.local |
| Roles | viewer |
| Descricao | Usuario basico para testes |

---

## 7. Client Skyller por Realm

### 7.1 Configuracao do Client

| Campo | Valor |
|-------|-------|
| Client ID | skyller |
| Client Type | OpenID Connect |
| Client Authentication | ON (confidential) |
| Standard Flow | ON |
| Direct Access Grants | OFF |
| Root URL | https://{realm}.skyller.ai |
| Valid Redirect URIs | https://{realm}.skyller.ai/api/auth/callback/keycloak |
| Web Origins | https://{realm}.skyller.ai |

### 7.2 Mappers do Client

| Mapper | Tipo | Claim |
|--------|------|-------|
| tenant_id | Hardcoded Claim | tenant_id = {realm_name} |
| tenant_name | Hardcoded Claim | tenant_name = {realm_display_name} |
| groups | Group Membership | groups (full path) |
| full_name | User Attribute | full_name = displayName |
| department | User Attribute | department |
| company | User Attribute | company |
| title | User Attribute | title |
| phone | User Attribute | phone |
| mobile | User Attribute | mobile |
| office | User Attribute | office |
| city | User Attribute | city |
| state | User Attribute | state |

---

## 8. Headers HTTP Finais

### 8.1 Headers de Identidade (Keycloak)

```
X-Tenant-ID: {tenant_id}              # UUID ou nome do realm
X-Tenant-Name: {tenant_name}          # Nome legivel do tenant
X-User-ID: {sub}                      # UUID do usuario
X-User-Email: {email}                 # Email (pode ser nulo)
X-User-Name: {full_name}              # displayName do AD
X-User-Username: {preferred_username} # sAMAccountName
X-User-Role: {roles}                  # admin,operator,viewer
X-User-Group: {groups}                # /TI/Suporte,/Financeiro
X-User-Department: {department}       # Departamento do AD
X-User-Company: {company}             # Empresa do AD
X-User-Title: {title}                 # Cargo do AD
```

### 8.2 Headers de Sessao (Skyller)

```
X-Agent-ID: {agent_id}                # skyller-chat
X-Session-ID: {conversation_id}       # UUID da conversa
X-Message-ID: {message_id}            # UUID da mensagem
X-Parent-Message-ID: {parent_id}      # UUID da mensagem pai
```

---

## 9. Controle de Acesso a Agentes (Futuro)

### 9.1 Granularidade de Permissoes

```
agent_permissions:
  agent_id: "skyller-chat"
  permissions:
    - type: "realm"          # Nivel mais alto
      allow: ["skills", "ramada"]

    - type: "ou"             # Unidade Organizacional
      allow: ["OU=TI", "OU=Financeiro"]

    - type: "group"          # Grupo especifico
      allow: ["/TI/Suporte", "/TI/Desenvolvimento"]

    - type: "user"           # Usuario especifico
      allow: ["joao.silva", "maria.santos"]
      deny: ["estagiario.teste"]
```

### 9.2 Fluxo de Verificacao

```
1. Usuario faz login
2. Skyller extrai claims do JWT (tenant, groups, department)
3. Antes de executar agente:
   - Verificar se tenant tem acesso
   - Verificar se OU tem acesso
   - Verificar se grupo tem acesso
   - Verificar se usuario especifico tem acesso
4. Se permitido: executar agente
5. Se negado: retornar erro 403
```

---

## 10. Fallback e Hierarquia

### 10.1 Ramada + Lindacor (Mesmo AD)

```
Realm: ramada
├── User Federation: AD 172.16.100.10
│   ├── Mapper OU Ramada: OU=Ramada,OU=_Empresas
│   └── Mapper OU Lindacor: OU=Lindacor,OU=_Empresas
│
├── Filtro por subdominio:
│   ├── ramada.skyller.ai -> Usuarios de OU=Ramada
│   └── lindacor.skyller.ai -> Usuarios de OU=Lindacor
│
└── Grupos sincronizados do AD
```

### 10.2 Fallback de Autenticacao

```
1. Tentar autenticar via AD (User Federation)
2. Se AD offline: tentar usuarios locais
3. Se falhar: retornar erro com opcao de retry
```

---

## 11. Comandos de Implementacao

### 11.1 Criar Realm via API

```bash
# Obter token admin
TOKEN=$(curl -sk -X POST "https://idp.servidor.one/realms/master/protocol/openid-connect/token" \
  -d "username=skills-admin" -d "password=Sk@2024,TI" \
  -d "grant_type=password" -d "client_id=admin-cli" \
  | jq -r '.access_token')

# Criar realm
curl -sk -X POST "https://idp.servidor.one/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "skills",
    "enabled": true,
    "displayName": "Skills IT",
    "sslRequired": "all"
  }'
```

### 11.2 Criar User Federation LDAP

```bash
curl -sk -X POST "https://idp.servidor.one/admin/realms/skills/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AD Skills IT",
    "providerId": "ldap",
    "providerType": "org.keycloak.storage.UserStorageProvider",
    "config": {
      "connectionUrl": ["ldap://172.16.1.10:389"],
      "bindDn": ["CN=Administrator,CN=Users,DC=ad,DC=skillsit,DC=com,DC=br"],
      "bindCredential": ["Skills@2017,TI"],
      "usersDn": ["OU=_Empresas,DC=ad,DC=skillsit,DC=com,DC=br"],
      "usernameLDAPAttribute": ["sAMAccountName"],
      "uuidLDAPAttribute": ["objectGUID"],
      "userObjectClasses": ["person, organizationalPerson, user"],
      "vendor": ["ad"],
      "editMode": ["READ_ONLY"],
      "syncRegistrations": ["false"],
      "searchScope": ["2"]
    }
  }'
```

---

## 12. Client Secrets por Realm (IMPORTANTE!)

### 12.1 Realm skills

| Campo | Valor |
|-------|-------|
| **Issuer** | https://idp.servidor.one/realms/skills |
| **Client ID** | skyller |
| **Client Secret** | `nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp` |

### 12.2 Realm ramada

| Campo | Valor |
|-------|-------|
| **Issuer** | https://idp.servidor.one/realms/ramada |
| **Client ID** | skyller |
| **Client Secret** | `8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4` |

### 12.3 Realm lindacor

| Campo | Valor |
|-------|-------|
| **Issuer** | https://idp.servidor.one/realms/lindacor |
| **Client ID** | skyller |
| **Client Secret** | `YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ` |

### 12.4 Realm wga

| Campo | Valor |
|-------|-------|
| **Issuer** | https://idp.servidor.one/realms/wga |
| **Client ID** | skyller |
| **Client Secret** | `OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU` |

---

## 13. Variaveis de Ambiente por Realm

### 13.1 Skills

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/skills
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=https://skills.skyller.ai
```

### 13.2 Ramada

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/ramada
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=https://ramada.skyller.ai
```

### 13.3 Lindacor

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/lindacor
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=https://lindacor.skyller.ai
```

### 13.4 WGA

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/wga
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU
NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
NEXTAUTH_URL=https://wga.skyller.ai
```

---

## 14. Checklist de Implementacao

- [x] Documento de configuracao criado
- [x] Realm skills criado (43 usuarios LDAP)
- [x] Realm ramada criado (199 usuarios LDAP)
- [x] Realm lindacor criado (46 usuarios LDAP)
- [x] Realm wga criado (21 usuarios LDAP + StartTLS)
- [x] Roles (admin, operator, viewer, agent-manager) criadas
- [x] Usuarios locais (admin123, operator, user) criados em cada realm
- [x] User Federation LDAP configurada para cada AD
- [x] Mappers de atributos AD configurados
- [x] Client skyller configurado em cada realm
- [x] Mappers JWT (tenant_id, groups, etc) criados
- [x] LDAP WGA configurado com StartTLS e hostname (certificado SSL)
- [x] Todas as sincronizacoes LDAP testadas e funcionando
- [ ] Configurar DNS para subdomínios (skills.skyller.ai, etc)
- [ ] Configurar Nginx para subdomínios apontarem para Skyller

---

## 15. Testar Login

### 15.1 Login com Usuario Local

```bash
# Testar login com admin123 no realm skills
curl -sk -X POST "https://idp.servidor.one/realms/skills/protocol/openid-connect/token" \
  -d "username=admin123" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=skyller" \
  -d "client_secret=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp"
```

### 15.2 Verificar Token JWT

```bash
# Decodificar token (parte do payload)
echo "<access_token>" | cut -d. -f2 | base64 -d 2>/dev/null | jq
```

---

**Skills IT Solucoes em Tecnologia** | Skills AI Nexus | Dezembro 2025
