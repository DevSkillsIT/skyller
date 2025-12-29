/**
 * SPEC-006-skyller - Proxy Middleware
 * Validacao de rotas do AG-UI Dojo
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIntegrationValid, isFeatureAvailable } from "./utils/menu";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Check for feature routes: /[integrationId]/feature/[featureId]
  const featureMatch = pathname.match(/^\/([^/]+)\/feature\/([^/]+)\/?$/);

  if (featureMatch) {
    const [, integrationId, featureId] = featureMatch;

    if (!isIntegrationValid(integrationId)) {
      requestHeaders.set("x-not-found", "integration");
    } else if (!isFeatureAvailable(integrationId, featureId)) {
      requestHeaders.set("x-not-found", "feature");
    }
  }

  // Check for integration routes: /[integrationId]
  const integrationMatch = pathname.match(/^\/([^/]+)\/?$/);

  if (integrationMatch) {
    const [, integrationId] = integrationMatch;

    if (integrationId && integrationId !== "") {
      if (!isIntegrationValid(integrationId)) {
        requestHeaders.set("x-not-found", "integration");
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
