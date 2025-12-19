# Keycloak Deployment - Skills AI Nexus IDP

**Servidor**: idp.servidor.one (172.16.1.21)
**Data de Instalacao**: 2025-12-19
**Versao**: Keycloak 26.4.7 (latest)

---

## Arquitetura

```
[Internet] --> [Nginx :443] --> [Keycloak :8080] --> [PostgreSQL :5432]
                   |                    |
                   |                    +-- Volume: /data/keycloak/postgres
                   |                    +-- Certs: /opt/keycloak/certs/
                   |
                   +-- SSL: /etc/letsencrypt/idp.servidor.one/
```

---

## Credenciais de Acesso

### Keycloak Admin

| Campo | Valor |
|-------|-------|
| **URL** | https://idp.servidor.one/admin |
| **Usuario** | `skills-admin` |
| **Senha** | `Sk@2024,TI` |

### SSH Servidor

| Campo | Valor |
|-------|-------|
| **Host** | 172.16.1.21 |
| **Usuario** | `root` |
| **Senha** | `Sk@2024,TI` |

### PostgreSQL (Container)

| Campo | Valor |
|-------|-------|
| **Database** | `keycloak` |
| **User** | `keycloak` |
| **Password** | `AW1W1D23wiJwDSZxL4doa9DoAm9KtI` |

---

## Realms Configurados

| Realm | Usuarios | Issuer | Client Secret |
|-------|----------|--------|---------------|
| **skills** | 43 | `https://idp.servidor.one/realms/skills` | `nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp` |
| **ramada** | 199 | `https://idp.servidor.one/realms/ramada` | `8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4` |
| **lindacor** | 46 | `https://idp.servidor.one/realms/lindacor` | `YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ` |
| **wga** | 21 | `https://idp.servidor.one/realms/wga` | `OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU` |

---

## Variaveis de Ambiente por Tenant

### Skills IT

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/skills
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=nyImHonIPvWnAyjpG9qPrOpN3JPvjKFp
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXTAUTH_URL=https://skills.skyller.ai
```

### Ramada Atacadista

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/ramada
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=8QjILBfm5c0rNvTgOmSmUURuFRbvSTh4
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXTAUTH_URL=https://ramada.skyller.ai
```

### Lindacor

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/lindacor
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=YtEiZRiz9As7wA4hwhqD3vzYwhUKcPjQ
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXTAUTH_URL=https://lindacor.skyller.ai
```

### WGA Contabil

```bash
AUTH_KEYCLOAK_ISSUER=https://idp.servidor.one/realms/wga
AUTH_KEYCLOAK_ID=skyller
AUTH_KEYCLOAK_SECRET=OKCUdWYE17YBzn30EdIzlhcIV6vUSXkU
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXTAUTH_URL=https://wga.skyller.ai
```

---

## Arquivos de Configuracao

| Arquivo | Localizacao |
|---------|-------------|
| Docker Compose | `/opt/keycloak/docker-compose.yml` |
| Variaveis | `/opt/keycloak/.env` |
| Truststore | `/opt/keycloak/certs/cacerts` |
| Cert WGA | `/opt/keycloak/certs/wga.crt` |
| Nginx Config | `/etc/nginx/sites-available/idp.servidor.one` |
| Certificado SSL | `/etc/letsencrypt/idp.servidor.one/fullchain.pem` |
| Chave SSL | `/etc/letsencrypt/idp.servidor.one/privkey.pem` |

---

## Comandos Uteis

### Gerenciamento Docker

```bash
cd /opt/keycloak

# Ver status dos containers
docker compose ps

# Ver logs do Keycloak
docker logs -f keycloak

# Reiniciar containers
docker compose restart

# Atualizar para ultima versao
docker compose pull && docker compose up -d
```

### Obter Token Admin via API

```bash
TOKEN=$(curl -sk -X POST "https://idp.servidor.one/realms/master/protocol/openid-connect/token" \
  -d "username=skills-admin" -d "password=Sk@2024,TI" \
  -d "grant_type=password" -d "client_id=admin-cli" | jq -r '.access_token')
```

### Forcar Sincronizacao LDAP

```bash
# Exemplo para realm ramada
LDAP_ID=$(curl -sk "https://idp.servidor.one/admin/realms/ramada/components?type=org.keycloak.storage.UserStorageProvider" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

curl -sk -X POST "https://idp.servidor.one/admin/realms/ramada/user-storage/$LDAP_ID/sync?action=triggerFullSync" \
  -H "Authorization: Bearer $TOKEN"
```

### Backup do PostgreSQL

```bash
docker exec keycloak-postgres pg_dump -U keycloak keycloak > /data/keycloak/backup-$(date +%Y%m%d).sql
```

---

## Documentacao Relacionada

| Documento | Descricao |
|-----------|-----------|
| [KEYCLOAK-MULTI-TENANT-AD.md](./KEYCLOAK-MULTI-TENANT-AD.md) | Configuracao de ADs e realms |
| [KEYCLOAK-NOVO-REALM-GUIA.md](./KEYCLOAK-NOVO-REALM-GUIA.md) | Como adicionar novo tenant |
| [KEYCLOAK-IMPLEMENTACAO-PLANO.md](./KEYCLOAK-IMPLEMENTACAO-PLANO.md) | Plano JWT Passthrough |
| [KEYCLOAK-SETUP.md](./KEYCLOAK-SETUP.md) | Setup inicial do client |

---

## Troubleshooting

### Erro: SSLHandshakeFailed no LDAP

O AD WGA requer SSL. Solucao:
1. Certificado esta em `/opt/keycloak/certs/cacerts`
2. Usar hostname via `extra_hosts` no docker-compose
3. Configurar StartTLS no LDAP federation

### Erro: Cannot parse the JSON (kcadm)

Bug do kcadm.sh quando ha LDAP configurado. Use API REST:
```bash
curl -sk "https://idp.servidor.one/admin/realms/wga/users/count" \
  -H "Authorization: Bearer $TOKEN"
```

### Erro: Invalid redirect_uri

Adicionar URL nas Valid redirect URIs do client skyller no realm.

---

**Skills IT Solucoes em Tecnologia** | Skills AI Nexus | Dezembro 2025
