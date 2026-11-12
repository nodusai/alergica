/**
 * Dados legais exibidos na Política de Privacidade, nos Termos de Uso e nas telas de consentimento (LGPD).
 *
 * ⚠️ PREENCHER ANTES DE PUBLICAR: os campos entre colchetes são da empresa que opera o AlerGica
 * (controladora dos dados, art. 5º, VI da LGPD) e do encarregado pelo tratamento (art. 41).
 *
 * Ao alterar o texto da Política ou dos Termos, aumente a versão correspondente: novos aceites
 * passam a registrar a versão nova.
 */
export const LEGAL = {
  controllerName: "[RAZÃO SOCIAL DA EMPRESA]",
  controllerCnpj: "[CNPJ]",
  controllerAddress: "[ENDEREÇO COMPLETO]",
  dpoName: "[NOME DO ENCARREGADO]",
  dpoEmail: "[privacidade@seudominio.com.br]",
  privacyVersion: "1.0",
  termsVersion: "1.0",
  /** Data de vigência exibida nos documentos */
  effectiveDate: "12 de novembro de 2026",
} as const;

/** Tipos de consentimento registrados no cadastro */
export type ConsentType = "termos_uso" | "politica_privacidade" | "dados_saude";
