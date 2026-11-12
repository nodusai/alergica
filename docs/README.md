# Documentação do AlerGica

| Documento | Para quem | Fonte | PDF |
|---|---|---|---|
| Arquitetura do Sistema | Arquitetos, CTOs, due diligence técnica | [01-arquitetura.md](01-arquitetura.md) | [PDF](pdf/01-arquitetura.pdf) |
| Documentação Técnica | Desenvolvedores e operação | [02-documentacao-tecnica.md](02-documentacao-tecnica.md) | [PDF](pdf/02-documentacao-tecnica.pdf) |
| Manual do Usuário | Famílias, pessoas alérgicas, profissionais de saúde | [03-manual-do-usuario.md](03-manual-do-usuario.md) | [PDF](pdf/03-manual-do-usuario.pdf) |

## Como atualizar

1. Edite o `.md` correspondente (os diagramas são blocos ` ```mermaid `).
2. Atualize `versao` e `atualizado` no cabeçalho e acrescente uma linha ao **Histórico de revisões**.
3. Opcional: `layout: continuo` no cabeçalho faz as seções seguirem no fluxo (sem nova página por seção), como no manual.
4. Gere os PDFs: `npm run docs:pdf` (usa Chrome ou Edge; defina `CHROME_PATH` se estiverem em outro local).
5. Faça commit dos `.md` e `.pdf` juntos, no mesmo commit da mudança no sistema.

A tabela "qual documento atualizar para cada tipo de mudança" está na seção **Manutenção da documentação** da Documentação Técnica.
