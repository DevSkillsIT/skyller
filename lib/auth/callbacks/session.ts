/**
 * Session Callback that populates session with JWT claims.
 *
 * @description Ensures all fields have safe values (not undefined)
 * and exposes necessary data to the client.
 */

import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface SessionCallbackParams {
  session: Session;
  token: JWT;
}

/**
 * Session Callback que popula a session com claims do JWT.
 *
 * Garante que todos os campos tenham valores seguros (nao undefined).
 *
 * @param params - Session callback parameters
 * @returns Updated session
 */
export async function sessionCallback({ session, token }: SessionCallbackParams): Promise<Session> {
  session.user = {
    ...session.user,
    id: (token.sub as string) || "",
    tenant_id: (token.tenant_id as string) || "default",
    tenant_name: (token.tenant_name as string) || "Default Tenant",
    tenant_slug: (token.tenant_slug as string) || "default",
    groups: (token.groups as string[]) || [],
    roles: (token.roles as string[]) || [],
    department: (token.department as string) || "",
    company: (token.company as string) || "",
    email: (token.email as string) || "",
    name: (token.name as string) || "Usuario",
    clientId: (token.clientId as string) || "skyller",
  };

  // Expor access token para API calls (BFF pattern)
  session.accessToken = token.accessToken as string;
  session.error = token.error as string | undefined;

  return session;
}
