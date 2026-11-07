# HU12 — testes de frontend, fase RED

Somente testes e fixtures: nenhuma tela, rota, serviço de produção ou alteração de backend nesta entrega. Os testes usam o `App` existente e simulam apenas a fronteira HTTP. Não há `skip`, `todo`, `fails` nem componentes falsos implementando a HU.

## Fontes e decisões

- HU12 fornecida em PDF: CA01–CA07, RN01/RN07 e RNF03/04/07/08/11.
- Protótipo fornecido: “Conte sua história”, aviso de privacidade, trajetória e atividades obrigatórias, contato opcional, seleção de foto e ação “Criar conta”.
- Orientação do usuário: após preencher os dados do produtor e clicar “Continuar”, abrir a trajetória. A conta só é finalizada pela ação “Criar conta” na segunda etapa.
- Contrato existente em `shared/openapi.json`, `src/shared/api/schema.ts` e `backend/src/modules/producer-profile/`: GET/PUT `/api/v1/producers/me/trajectory` e GET `/api/v1/producers/{id}/trajectory`.

As rotas de interface propostas pelos testes são `#/cadastro/trajetoria` (segunda etapa), `#/minha-trajetoria` (edição pelo titular) e `#/produtor/:id` (consulta pública). São decisões locais de navegação para a implementação futura; não são rotas declaradas pelo backend ou pelo PDF.

## Cobertura

| Arquivo                                       | Comportamentos                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `integration/hu12-signup.test.tsx`            | Transição entre etapas, retorno com rascunho, criação + autenticação + PUT, recuperação de falha parcial sem duplicar a conta, ausência de dados sensíveis nos storages.                                       |
| `integration/hu12-trajectory.test.tsx`        | Entrada pela conta, carregamento autenticado, campos e aviso, limites de 2000 caracteres, obrigatoriedade, telefone, consentimento, salvamento, erros HTTP, conexão, duplo envio, seleção local de foto e axe. |
| `integration/hu12-public-and-access.test.tsx` | Proteção da edição, consulta pública sem token, contato público somente quando retornado pela API, lista de campos públicos, HTML escapado e perfil 404.                                                       |

## Diferenças entre o protótipo e a API

- A foto passou a ser **opcional**, conforme orientação posterior do usuário. Os testes verificam a conclusão do cadastro sem imagem e a seleção local com rótulo acessível. Nenhum endpoint ou campo de foto existe no contrato HU12; a persistência depende de um contrato de mídia, sem upload simulado como se estivesse publicado.
- `atividades` é opcional na API; na interface desta tela é obrigatório, seguindo o asterisco do protótipo. Trajetória e atividades têm limite de 2000 caracteres pelo contrato.
- O PUT exige um produtor autenticado. O cenário de cadastro prevê criar a conta e autenticar antes de salvar a trajetória. Se o PUT falhar após a criação, a tentativa seguinte deve reutilizar a conta criada e reenviar o PUT, sem repetir o POST de cadastro.
- A opção de consentimento do contato complementa o protótipo conforme `telefonePublico` e RN07. O telefone é privado por padrão.
- Os testes antigos de HU02 ainda descrevem “Continuar → confirmação de cadastro”. Não foram alterados nesta fase: a migração desse comportamento deve acompanhar a implementação da nova etapa.

## Execução e resultado esperado

Na pasta `app`:

```sh
npm test -- tests/integration/hu12-signup.test.tsx tests/integration/hu12-trajectory.test.tsx tests/integration/hu12-public-and-access.test.tsx
```

A fase RED deve falhar por comportamentos ausentes (tela, navegação, salvamento e perfil público), e não por imports inexistentes ou erros de TypeScript. Alguns testes de bloqueio podem passar com a proteção atual; isso não comprova a implementação da HU12. Não alterar os testes para sucesso artificial nem implementar a HU nesta entrega.

Axe verifica parte da acessibilidade. Responsividade, zoom, contraste efetivo e layout mobile/desktop ainda exigirão inspeção em navegador real após implementar a tela. Os testes HTTP simulados não substituem uma validação futura contra a API em execução.
