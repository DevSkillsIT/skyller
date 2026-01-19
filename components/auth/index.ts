/**
 * Componentes de Autenticacao - Skyller
 *
 * Conjunto de componentes React para autenticacao com Keycloak
 * usando shadcn/ui e padroes modernos de acessibilidade.
 *
 * @example
 * // Importar componentes individuais
 * import { SignInButton, SignOutButton, UserMenu } from "@/components/auth";
 *
 * @example
 * // Uso no header
 * import { AuthStatus } from "@/components/auth";
 *
 * export function Header() {
 *   return (
 *     <header>
 *       <Logo />
 *       <AuthStatus />
 *     </header>
 *   );
 * }
 *
 * @example
 * // Proteger conteudo
 * import { AuthGuard } from "@/components/auth";
 *
 * export function AdminPage({ user }) {
 *   return (
 *     <AuthGuard user={user} requiredRoles={["admin"]}>
 *       <AdminContent />
 *     </AuthGuard>
 *   );
 * }
 */

// Componentes de botao
export { SignInButton, type SignInButtonProps } from "./sign-in-button";
export { SignOutButton, type SignOutButtonProps } from "./sign-out-button";

// Componente de menu do usuario
export { UserMenu, type UserMenuProps } from "./user-menu";

// Server component para status de autenticacao
export { AuthStatus, type AuthStatusProps } from "./auth-status";

// Client component para protecao de conteudo
export { AuthGuard, type AuthGuardProps } from "./auth-guard";
