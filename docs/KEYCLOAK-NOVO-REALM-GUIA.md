# Guia: Criar Novo Realm no Keycloak

**Documento**: Passo a passo para adicionar novo tenant
**Versao**: 1.0.0
**Data**: 2025-12-19

---

## Visao Geral

Cada **tenant** (cliente) precisa de:
1. Um **Realm** no Keycloak
2. **User Federation LDAP** conectado ao AD do cliente
3. **Client `skyller`** com Protocol Mappers
4. **Roles** (admin, operator, viewer, agent-manager)
5. **Usuarios locais** de teste (admin123, operator, user)

---

## Passo 1: Criar o Realm

### Via Admin Console

1. Acesse https://idp.servidor.one/admin
2. Login: `skills-admin` / `Sk@2024,TI`
3. No canto superior esquerdo, clique no dropdown do realm
4. Clique em **Create realm**
5. Preencha:
   - **Realm name**: `nome-do-tenant` (ex: gsm, servcont)
   - **Enabled**: ON
6. Clique em **Create**

### Via API (Script)

```bash
TOKEN=$(curl -sk -X POST "https://idp.servidor.one/realms/master/protocol/openid-connect/token" \
  -d "username=skills-admin" -d "password=Sk@2024,TI" \
  -d "grant_type=password" -d "client_id=admin-cli" | jq -r '.access_token')

curl -sk -X POST "https://idp.servidor.one/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "gsm",
    "enabled": true,
    "displayName": "GSM Transportes",
    "loginWithEmailAllowed": true,
    "resetPasswordAllowed": true,
    "bruteForceProtected": true
  }'
```

---

## Passo 2: Configurar LDAP (User Federation)

### Via Admin Console

1. No realm criado, va em **User federation**
2. Clique em **Add LDAP provider**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | AD [Nome do Cliente] |
| **Vendor** | Active Directory |
| **Connection URL** | `ldap://IP_DO_AD:389` ou `ldaps://HOSTNAME:636` |
| **Bind DN** | DN do usuario de servico |
| **Bind Credential** | Senha do usuario de servico |
| **Users DN** | OU onde estao os usuarios |
| **Username LDAP attribute** | sAMAccountName |
| **RDN LDAP attribute** | cn |
| **UUID LDAP attribute** | objectGUID |
| **User object classes** | person, organizationalPerson, user |
| **Edit mode** | READ_ONLY |
| **Trust Email** | ON |
| **Import Users** | ON |
| **Sync Registrations** | OFF |

4. Clique em **Test connection** para validar
5. Clique em **Test authentication** com um usuario real
6. Clique em **Save**
7. Clique em **Sync all users**

### Observacoes Importantes

**Se o AD requer SSL/TLS:**
- Use `ldaps://` ou configure StartTLS
- Se usar IP e o certificado for para hostname:
  - Adicione entrada no `/etc/hosts` do servidor Keycloak
  - Adicione `extra_hosts` no docker-compose.yml
  - Importe o certificado no truststore

**Exemplo WGA (que requer StartTLS):**
```yaml
# docker-compose.yml
keycloak:
  extra_hosts:
    - "wgpmwescrivm010.wga.local:172.16.85.10"
```

---

## Passo 3: Criar Roles

### Via Admin Console

1. Va em **Realm roles**
2. Clique em **Create role**
3. Crie cada uma:

| Role | Descricao |
|------|-----------|
| admin | Administrador completo |
| operator | Operador - executa agentes e aprova HITL |
| viewer | Visualizador - somente leitura |
| agent-manager | Gerenciador de agentes |

### Via API

```bash
for role in admin operator viewer agent-manager; do
  curl -sk -X POST "https://idp.servidor.one/admin/realms/gsm/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$role\"}"
done
```

---

## Passo 4: Criar Usuarios Locais

### Via Admin Console

1. Va em **Users**
2. Clique em **Add user**
3. Crie os usuarios:

| Username | Email | First Name | Last Name | Roles |
|----------|-------|------------|-----------|-------|
| admin123 | admin@gsm.local | Admin | Sistema | admin |
| operator | operator@gsm.local | Operador | Sistema | operator, agent-manager |
| user | user@gsm.local | Usuario | Sistema | viewer |

4. Para cada usuario, va em **Credentials** e defina a senha

### Via API

```bash
# Criar usuario
curl -sk -X POST "https://idp.servidor.one/admin/realms/gsm/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin123",
    "enabled": true,
    "emailVerified": true,
    "email": "admin@gsm.local",
    "firstName": "Admin",
    "lastName": "Sistema",
    "credentials": [{"type": "password", "value": "SenhaSegura123", "temporary": false}]
  }'
```

---

## Passo 5: Criar Client Skyller

### Via Admin Console

1. Va em **Clients**
2. Clique em **Create client**
3. Configure:

**General Settings:**
- Client type: OpenID Connect
- Client ID: `skyller`
- Name: Skyller - Frontend AG-UI

**Capability config:**
- Client authentication: ON
- Standard flow: ON
- Direct access grants: OFF

**Login settings:**
- Root URL: `https://gsm.skyller.ai`
- Valid redirect URIs:
  - `http://localhost:3000/api/auth/callback/keycloak`
  - `https://gsm.skyller.ai/api/auth/callback/keycloak`
- Web origins:
  - `http://localhost:3000`
  - `https://gsm.skyller.ai`

4. Apos criar, va em **Credentials** e copie o **Client secret**

---

## Passo 6: Criar Protocol Mappers (OBRIGATORIO!)

**IMPORTANTE: Cada realm precisa ter seus proprios mappers!**

### Via Admin Console

1. No client `skyller`, va em **Client scopes**
2. Clique em **skyller-dedicated**
3. Va em **Mappers** > **Add mapper** > **By configuration**

### Mappers Obrigatorios

| Nome | Tipo | Configuracao |
|------|------|--------------|
| **tenant_id** | Hardcoded claim | claim.name=tenant_id, claim.value=gsm |
| **tenant_name** | Hardcoded claim | claim.name=tenant_name, claim.value=GSM Transportes |
| **groups** | Group Membership | claim.name=groups, full.path=true |
| **department** | User Attribute | user.attribute=department, claim.name=department |
| **full_name** | User Attribute | user.attribute=displayName, claim.name=full_name |
| **company** | User Attribute | user.attribute=company, claim.name=company |
| **title** | User Attribute | user.attribute=title, claim.name=title |
| **phone** | User Attribute | user.attribute=telephoneNumber, claim.name=phone |
| **mobile** | User Attribute | user.attribute=mobile, claim.name=mobile |
| **office** | User Attribute | user.attribute=physicalDeliveryOfficeName, claim.name=office |
| **city** | User Attribute | user.attribute=l, claim.name=city |
| **state** | User Attribute | user.attribute=st, claim.name=state |

### Via API (Script Completo)

```bash
# Obter token
TOKEN=$(curl -sk -X POST "https://idp.servidor.one/realms/master/protocol/openid-connect/token" \
  -d "username=skills-admin" -d "password=Sk@2024,TI" \
  -d "grant_type=password" -d "client_id=admin-cli" | jq -r '.access_token')

REALM="gsm"
TENANT_NAME="GSM Transportes"

# Obter ID do client
CLIENT_ID=$(curl -sk "https://idp.servidor.one/admin/realms/$REALM/clients?clientId=skyller" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Mapper: tenant_id (hardcoded)
curl -sk -X POST "https://idp.servidor.one/admin/realms/$REALM/clients/$CLIENT_ID/protocol-mappers/models" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{
    \"name\": \"tenant_id\",
    \"protocol\": \"openid-connect\",
    \"protocolMapper\": \"oidc-hardcoded-claim-mapper\",
    \"config\": {
      \"claim.name\": \"tenant_id\",
      \"claim.value\": \"$REALM\",
      \"jsonType.label\": \"String\",
      \"id.token.claim\": \"true\",
      \"access.token.claim\": \"true\",
      \"userinfo.token.claim\": \"true\"
    }
  }"

# Mapper: tenant_name (hardcoded)
curl -sk -X POST "https://idp.servidor.one/admin/realms/$REALM/clients/$CLIENT_ID/protocol-mappers/models" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{
    \"name\": \"tenant_name\",
    \"protocol\": \"openid-connect\",
    \"protocolMapper\": \"oidc-hardcoded-claim-mapper\",
    \"config\": {
      \"claim.name\": \"tenant_name\",
      \"claim.value\": \"$TENANT_NAME\",
      \"jsonType.label\": \"String\",
      \"id.token.claim\": \"true\",
      \"access.token.claim\": \"true\",
      \"userinfo.token.claim\": \"true\"
    }
  }"

# Mapper: groups
curl -sk -X POST "https://idp.servidor.one/admin/realms/$REALM/clients/$CLIENT_ID/protocol-mappers/models" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "groups",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-group-membership-mapper",
    "config": {
      "claim.name": "groups",
      "full.path": "true",
      "id.token.claim": "true",
      "access.token.claim": "true",
      "userinfo.token.claim": "true"
    }
  }'

# Mappers de atributos do AD
for mapper in "department:department" "full_name:displayName" "company:company" "title:title" "phone:telephoneNumber" "mobile:mobile" "office:physicalDeliveryOfficeName" "city:l" "state:st"; do
  name=$(echo $mapper | cut -d: -f1)
  attr=$(echo $mapper | cut -d: -f2)

  curl -sk -X POST "https://idp.servidor.one/admin/realms/$REALM/clients/$CLIENT_ID/protocol-mappers/models" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"protocol\": \"openid-connect\",
      \"protocolMapper\": \"oidc-usermodel-attribute-mapper\",
      \"config\": {
        \"claim.name\": \"$name\",
        \"user.attribute\": \"$attr\",
        \"jsonType.label\": \"String\",
        \"id.token.claim\": \"true\",
        \"access.token.claim\": \"true\",
        \"userinfo.token.claim\": \"true\"
      }
    }"
done

echo "Mappers criados para realm $REALM"
```

---

## Passo 7: Configurar Variaveis de Ambiente no Skyller

Adicione ao `.env.local` do Skyller:

```bash
# Keycloak - GSM
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/gsm
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=<client_secret_do_passo_5>
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXTAUTH_URL=https://gsm.skyller.ai
```

---

## Passo 8: Testar

### Testar Login via API

```bash
# Testar com usuario local
curl -sk -X POST "https://idp.servidor.one/realms/gsm/protocol/openid-connect/token" \
  -d "username=admin123" \
  -d "password=SenhaSegura123" \
  -d "grant_type=password" \
  -d "client_id=skyller" \
  -d "client_secret=<client_secret>"
```

### Verificar Claims no JWT

```bash
# Decodificar o access_token (payload)
echo "<access_token>" | cut -d. -f2 | base64 -d 2>/dev/null | jq
```

O JWT deve conter:
```json
{
  "sub": "uuid-do-usuario",
  "preferred_username": "admin123",
  "tenant_id": "gsm",
  "tenant_name": "GSM Transportes",
  "groups": ["/TI/Suporte"],
  "department": "TI",
  "...": "..."
}
```

---

## Checklist Novo Realm

- [ ] Realm criado
- [ ] LDAP User Federation configurado e testado
- [ ] Roles criadas (admin, operator, viewer, agent-manager)
- [ ] Usuarios locais criados (admin123, operator, user)
- [ ] Client skyller criado
- [ ] Client secret copiado
- [ ] Protocol Mappers configurados (TODOS os 12 mappers!)
- [ ] .env.local do Skyller atualizado
- [ ] Login testado
- [ ] Claims JWT verificados

---

**Skills IT Solucoes em Tecnologia** | Skills AI Nexus | Dezembro 2025
