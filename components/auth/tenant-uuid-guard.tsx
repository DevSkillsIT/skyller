"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { isUuid } from "@/lib/api/auth-headers";

/**
 * Garante que o tenant_id da sessao seja UUID.
 * Se estiver ausente/invalido, força logout para refazer login com token correto.
 */
export default function TenantUuidGuard() {
  const { data: session, status } = useSession();
  const didSignOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session || didSignOut.current) {
      return;
    }

    const tenantId = session.user?.tenant_id;
    const hasError = session.error === "MissingTenantUUID";

    if (hasError || (tenantId && !isUuid(tenantId))) {
      didSignOut.current = true;
      console.error("[tenant-guard] tenant_id invalido - forçando novo login", {
        tenant_id: tenantId,
        error: session.error,
      });
      void signOut({ callbackUrl: "/auth/error?error=MissingTenantUUID" });
    }
  }, [session, status]);

  return null;
}
