# Validação das HU19, HU20 e HU21

[Voltar para a Iteração 7](iteracao7.md)

Registro da verificação feita antes da integração das histórias **HU19 — Consultar catálogo de produtos**, **HU20 — Consultar detalhes do produto** e **HU21 — Cadastrar experiência** na branch `dev`. Cada critério de aceitação foi conferido de três formas: teste automatizado, teste manual no ambiente Docker com a API real (sem dados de demonstração) e, quando aplicável, consulta direta ao banco.

---

## 1. Escopo e ambiente

| Item | Valor |
|---|---|
| Data | 16/11/2026 |
| Branch validada | `feat/hu21`, atualizada com a `dev` e com a `feat/hu20` |
| Ambiente | `docker compose` do repositório, imagens construídas sem cache, banco vazio (projeto isolado) |
| Modo do app | API real (`VITE_USE_MOCK_AUTH=false`) |
| Contrato da API | OpenAPI **0.9.0** |
| Navegadores | Desktop (1024 px) e celular (375 px) |

---

## 2. Achados da integração

| # | Achado | Tratamento |
|---|---|---|
| 1 | A `feat/hu20` **não** estava contida na `feat/hu21`: 14 commits (backend da HU20, testes e2e, contrato 0.8.0) estavam fora. A HU21 tinha um front próprio para os detalhes do produto. | `feat/hu20` mergeada. Mantido o front de detalhes da HU21 (segue o contrato real da HU19); o front antigo da `feat/hu20` usava o contrato anterior e foi descartado. |
| 2 | A HU21 **não tinha backend**: o cadastro só funcionava no modo de demonstração e o próprio código dizia que `/experiences` não existia. CA03 e CA05 não eram cumpridos com dados reais. | Criado o módulo `experiences` na API (cadastro, catálogo, detalhe e foto), com testes de unidade e e2e. |
| 3 | A `feat/hu21` estava 18 commits atrás da `dev` (HU14 e documentação). | `dev` mergeada; 8 conflitos resolvidos. Regra adotada: comportamento da HU14 segue a `dev`; acréscimos das HU19–21 seguem a `feat/hu21`. |
| 4 | Na tela aberta logo após publicar uma oferta, a propriedade do responsável não aparecia. | Corrigido durante o teste manual. |

---

## 3. Matriz de rastreabilidade

Legenda: ✅ atendido e comprovado.

### HU19 — Consultar catálogo de produtos

| CA | Teste automatizado | Evidência manual | Status |
|---|---|---|---|
| CA01 Acesso ao catálogo | `app/tests/integration/ProductCatalogFlow.test.tsx` | [Catálogo de produtos](../../img/evidencias/iteracao7/hu19-ca01-catalogo-produtos.jpg) | ✅ |
| CA02 Apresentação dos produtos | `backend/test/products-hu19.e2e-spec.ts` | [Prévia na tela inicial](../../img/evidencias/iteracao7/hu19-ca02-ca03-previa-visitante.jpg) | ✅ |
| CA03 Informações resumidas | `app/tests/unit/features/offers/productAdapter.test.ts` | [Prévia na tela inicial](../../img/evidencias/iteracao7/hu19-ca02-ca03-previa-visitante.jpg) | ✅ |
| CA04 Indisponíveis não aparecem | `backend/test/products-hu19.e2e-spec.ts` | Produto marcado `disponivel: false` no banco sumiu da lista e da API | ✅ |
| CA05 Acesso aos detalhes | `app/tests/integration/hu20-product-details.test.tsx` | Clique no card abre o detalhe (HU20) | ✅ |
| CA06 Catálogo vazio | `app/tests/components/features/offers/ProductCatalogPage.test.tsx` | [“Não há ofertas disponíveis no momento”](../../img/evidencias/iteracao7/hu19-ca06-catalogo-vazio.jpg) | ✅ |
| CA07 Sem autenticação | `backend/test/products-hu19.e2e-spec.ts` | Todo o roteiro de visitante foi feito sem login | ✅ |
| CA08 Falha no carregamento | `app/tests/integration/ProductCatalogFlow.test.tsx`; `ProductCatalogPage.test.tsx` | [API desligada](../../img/evidencias/iteracao7/hu19-ca08-falha-carregamento.jpg) | ✅ |

### HU20 — Consultar detalhes do produto

| CA | Teste automatizado | Evidência manual | Status |
|---|---|---|---|
| CA01 Acesso aos detalhes | `app/tests/integration/hu20-product-details.test.tsx` | [Detalhe do produto](../../img/evidencias/iteracao7/hu20-ca01-ca05-detalhe-produto.jpg) | ✅ |
| CA02 Descrição | idem + `backend/test/products-hu20.e2e-spec.ts` | idem | ✅ |
| CA03 Produtor ou propriedade | `products-hu20.e2e-spec.ts`; teste “CA03: identifica a propriedade” no front | “Produtor: …” e “Propriedade: …” no detalhe | ✅ |
| CA04 Preço | `hu20-product-details.test.tsx` | “R$ 35,90 / unidade” | ✅ |
| CA05 Só dados públicos | `products-hu20.e2e-spec.ts` (e-mail, CPF, CNPJ e telefone ausentes) | Resposta da API conferida | ✅ |
| CA06 Produto indisponível | `products-hu20.e2e-spec.ts`; `hu20-product-details.test.tsx` | [“Produto indisponível”](../../img/evidencias/iteracao7/hu20-ca06-ca08-produto-indisponivel.jpg) | ✅ |
| CA07 Sem autenticação | `hu20-product-details.test.tsx` (sem cabeçalho `Authorization`) | Consulta feita como visitante | ✅ |
| CA08 Produto não localizado | `products-hu20.e2e-spec.ts` (id inexistente e inválido) | idem CA06 | ✅ |
| CA09 Falha no carregamento | `hu20-product-details.test.tsx` | [API desligada](../../img/evidencias/iteracao7/hu20-ca09-falha-carregamento.jpg) | ✅ |

### HU21 — Cadastrar experiência

| CA | Teste automatizado | Evidência manual | Status |
|---|---|---|---|
| CA01 Acesso ao cadastro | `hu21-experience-registration.test.tsx` | Produtor abre “Adicionar” e escolhe “Experiência” | ✅ |
| CA02 Preenchimento | `hu21-experience-registration.test.tsx` | [Formulário preenchido](../../img/evidencias/iteracao7/hu21-ca02-formulario-preenchido.jpg) · [celular](../../img/evidencias/iteracao7/hu21-formulario-mobile.jpg) | ✅ |
| CA03 Vínculo ao responsável | `backend/test/experiences-hu21.e2e-spec.ts` (dono vem do token, nunca do corpo) | No banco, `produtor` = id da conta logada | ✅ |
| CA04 Validação | e2e: 10 casos de campo inválido, sem foto, fotos demais, arquivo que não é imagem | [Orientações por campo](../../img/evidencias/iteracao7/hu21-ca04-validacao.jpg) | ✅ |
| CA05 Cadastro concluído | e2e `201` + front | [“Sua oferta está na rede”](../../img/evidencias/iteracao7/hu21-ca05-cadastro-concluido.jpg) | ✅ |
| CA06 Restrição de acesso | e2e: `401` visitante, `403` consumidor e administrador | [Consumidor sem a opção](../../img/evidencias/iteracao7/hu21-ca06-consumidor-sem-acesso.jpg); API devolveu 403 e 401 | ✅ |
| CA07 Falha durante o cadastro | e2e de `Idempotency-Key`; front “dados preservados” | [API desligada no envio](../../img/evidencias/iteracao7/hu21-ca07-falha-dados-preservados.jpg); ao religar, o reenvio criou **um** registro | ✅ |
| CA08 Identificação do responsável | e2e (lista e detalhe públicos só com dados de divulgação); `hu21-experience-details-api.test.tsx` | [Detalhe da experiência](../../img/evidencias/iteracao7/hu21-ca08-detalhe-experiencia.jpg) · [catálogo](../../img/evidencias/iteracao7/hu21-catalogo-experiencias.jpg) · [perfil do produtor](../../img/evidencias/iteracao7/hu21-perfil-produtor-mobile.jpg) | ✅ |

---

## 4. Testes automatizados

| Suíte | Resultado |
|---|---|
| Backend — unidade | 571 testes, todos aprovados |
| Backend — e2e (MongoDB em memória) | 322 testes, todos aprovados (27 novos da HU21) |
| Front — unidade e integração (com cobertura) | 744 testes, todos aprovados |
| Lint, formatação e checagem de tipos | Sem erros (back e front) |
| Build de produção do front | Concluído |
| Contrato OpenAPI | Regenerado (0.9.0), tipos do front sem divergência |

---

## 5. Observações fora do escopo

Pontos notados durante o teste, que não bloqueiam estas histórias e ficam para o backlog:

- Na tela **Conta** do produtor, “Nome da iniciativa” aparece vazio e a categoria aparece como “Produtos”, sem refletir o cadastro.
- Valores inteiros aparecem sem centavos nos cards (“R$ 42 / unidade”).
- A categoria aparece como “Experiência” logo após publicar e “Experiências” ao abrir pelo catálogo.
- A API de produtos ainda aceita a categoria “Experiência” (herança da HU15); com a rota própria de experiências, vale restringir.
- No ambiente de desenvolvimento, com a API fora do ar, as mensagens de falha levam cerca de 20 s para aparecer (tempo do proxy do Vite).

---

## 6. Definition of Done

| Item do DoD | HU19 | HU20 | HU21 |
|---|---|---|---|
| Entrega um incremento do produto | ✅ | ✅ | ✅ |
| Contempla os critérios de aceite | ✅ | ✅ | ✅ |
| Desenvolvimento concluído (front e back) | ✅ | ✅ | ✅ |
| Testes executados e aprovados | ✅ | ✅ | ✅ |
| Aderente aos padrões de código (lint e formatação) | ✅ | ✅ | ✅ |
| Revisado pela equipe | Pull Request para a `dev` | Pull Request para a `dev` | Pull Request para a `dev` |
| Acessibilidade e responsividade (axe nos testes; 375 px sem rolagem lateral) | ✅ | ✅ | ✅ |
| Segurança e privacidade (só dados públicos; cadastro restrito ao produtor) | ✅ | ✅ | ✅ |
| Trata os erros do usuário | ✅ | ✅ | ✅ |
| Sem defeitos críticos conhecidos | ✅ | ✅ | ✅ |
| Documentado | ✅ | ✅ | ✅ |
