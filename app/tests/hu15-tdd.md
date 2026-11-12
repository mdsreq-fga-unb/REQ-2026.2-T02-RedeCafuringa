# HU15: testes do frontend na fase RED

Fontes: PDF “HU15 — Cadastrar produto - Rede Cafuringa” enviado pelo usuário (CA01 a CA08), equivalente a `docs/visao/historias/HU15.md`, e imagem “32 • Cadastrar produto.png”. Somente arquivos de teste foram criados; nenhuma funcionalidade foi implementada.

Executar em `app/`:

```sh
npm test -- tests/integration/hu15-product-registration.test.tsx
```

Os testes devem falhar enquanto a HU15 não estiver implementada. Não usam `skip`, `todo` ou mocks do formulário. Renderizam o `App` existente e simulam somente a fronteira HTTP. O teste de catálogo de consumidor pode passar antes da implementação, pois verifica uma proibição.

Execução inicial: **27 cenários, 26 falhando e 1 passando**. As falhas decorrem da ausência da funcionalidade (entrada de cadastro, formulário e bloqueio orientado na URL proposta); o cenário que passa é a ausência de cadastro no catálogo do consumidor. Esse resultado é esperado na fase RED e faz o comando de testes retornar código diferente de zero.

| Origem | Cobertura |
| --- | --- |
| CA01 | Entrada pelo catálogo do produtor |
| CA02 e protótipo | Título, instrução, seis campos, ordem, preenchimento, foto, ações e navegação inferior |
| CA03, RN09 | Autenticação no envio; responsável resolvido pela sessão, sem identificador arbitrário no formulário |
| CA04, RNF03, RN11 | Obrigatórios, textos vazios, categoria inválida, preço negativo, peso não positivo e ausência de foto; orientação para correção |
| CA05 | Envio de dados/foto, confirmação de sucesso somente após resposta e bloqueio de duplicidade durante envio |
| CA06, RN01, RNF08 | Bloqueio de visitante/consumidor por URL e ausência da ação no catálogo do consumidor |
| CA07, RNF07 | Falha de rede, preservação dos seis campos, reenvio manual e erros HTTP |
| CA08, RN09 | Produto e identificação do responsável após cadastro |
| RNF04 | Labels, obrigatoriedade acessível, mensagens, ordem de teclado e axe WCAG 2.1 A/AA |

## Convenções propostas, não requisitos adicionais da HU

Como não há endpoint de produto no OpenAPI atual, a fixture propõe `#/produtos/novo` e `POST /api/v1/products`, com `FormData`: `nome`, `categoria`, `descricao`, `precoPorUnidade`, `gramasPorUnidade`, `fotos`. Preço e peso são enviados como números em strings, sem `R$` e `g`. A resposta 201 contém os mesmos dados, `id`, URLs em `fotos` e `produtor: { id, nomeIniciativa }`. O vínculo é definido no servidor pelo Bearer token. Essas convenções devem ser alinhadas ao contrato real antes da fase GREEN; não implementam nem verificam autorização no servidor.

O botão de entrada no catálogo aceita “Cadastrar produto” ou “Adicionar produto”. Os campos usam labels do protótipo; textos de exemplo são dados de teste, sem exigir preenchimento inicial. A categoria “Produtos” precisa estar disponível; outras categorias não foram inventadas. A foto de teste é um PNG válido. Não foram fixados quantidade máxima de fotos, formatos permitidos, tamanho de arquivos, limites de caracteres, preço mínimo positivo, política de estoque ou restrição etária: as fontes não definem esses limites. Peso positivo e preço não negativo são interpretações de validade dos campos, explicitadas aqui.

O teste de CA08 pressupõe que o resultado do cadastro apresente produto e responsável. Se o fluxo final exigir abrir os detalhes a partir de uma confirmação, adaptar a navegação desse teste mantendo a verificação da identificação.

O axe em jsdom não comprova contraste, aparência, responsividade ou fidelidade em pixels. A ordem dos elementos e os textos são verificáveis aqui; cores, dimensões e layout móvel exigem validação posterior em navegador. RNF15 é condicional na HU e não define uma regra executável específica para este formulário; nenhuma política foi inventada.
