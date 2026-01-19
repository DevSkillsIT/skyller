/**
 * Auth Server Actions
 *
 * Este modulo exporta todas as Server Actions relacionadas a autenticacao.
 * Server Actions sao funcoes async que rodam no servidor e podem ser
 * chamadas diretamente de Client Components ou usadas em form actions.
 *
 * @example
 * // Importar actions especificas
 * import { signInWithKeycloak, signOutFromKeycloak } from "@/lib/auth/actions";
 *
 * // Usar em form action
 * <form action={signInSkyller}>
 *   <button type="submit">Entrar</button>
 * </form>
 */

// Sign-in actions
export {
  type ClientKey,
  signInAdmin,
  signInSkyller,
  signInWithKeycloak,
} from "./sign-in";

// Sign-out actions
export {
  generateKeycloakLogoutUrl,
  getKeycloakLogoutUrl,
  signOutComplete,
  signOutFromKeycloak,
} from "./sign-out";
