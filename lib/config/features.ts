/**
 * Feature flags do frontend Skyller.
 *
 * Observação: flags com prefixo NEXT_PUBLIC_ são expostas ao browser.
 * O default é "true" para manter o comportamento esperado do plano.
 */
function readBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

export const FEATURES = {
  // Controla a visualização do painel de thinking (Glass Box AI).
  SHOW_THINKING: readBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_THINKING, true),
  // Controla a visualização do indicador de steps.
  SHOW_STEPS: readBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_STEPS, true),
};
