# HU01 — Cadastrar perfil de consumidor

## 1. Identificação

| Campo | Informação |
|---|---|
| **ID da História** | HU01 |
| **Requisito Funcional** | RF01 — Cadastrar perfil de consumidor |
| **Prioridade** | A preencher |
| **Estimativa** | A preencher |
| **Data** | A preencher |
| **Status** | A preencher |

---

## 2. História de Usuário

*Como consumidor, eu quero cadastrar um perfil na plataforma para que eu possa acessar as funcionalidades destinadas aos consumidores da Rede Cafuringa.*

---

## 3. Critérios de Aceitação

**CA01 — Cadastro com dados válidos**

- **Dado** que estou na tela de cadastro de consumidor, **quando** informar nome completo, CPF, e-mail e senha válidos, **então** o sistema deve permitir a criação do perfil.

**CA02 — Validação de campos obrigatórios**

- **Dado** que existam campos obrigatórios vazios ou inválidos, **quando** eu tentar concluir o cadastro, **então** o sistema deve impedir a criação do perfil e informar os campos que precisam ser corrigidos.

**CA03 — E-mail já cadastrado**

- **Dado** que o e-mail informado já esteja cadastrado, **quando** eu tentar criar uma nova conta com esse endereço, **então** o sistema deve impedir o cadastro duplicado e informar o problema.

**CA04 — CPF já cadastrado**

- **Dado** que o CPF informado já esteja associado a uma conta, **quando** eu tentar concluir o cadastro, **então** o sistema deve impedir o cadastro duplicado, conforme as regras de unicidade definidas para o sistema.

**CA05 — Cadastro concluído**

- **Dado** que todos os dados obrigatórios sejam válidos e não existam duplicidades, **quando** o cadastro for concluído, **então** o sistema deve registrar o perfil e informar que a operação foi realizada com sucesso.

---

## 4. Requisito Funcional Relacionado

**RF01 — Cadastrar perfil de consumidor**

O sistema deve permitir o cadastro do perfil do consumidor, contendo nome, CPF, telefone e e-mail.

**Observação:** a senha é considerada na história conforme o fluxo de cadastro apresentado, mas deve estar contemplada explicitamente no requisito funcional para manter a rastreabilidade completa entre requisito e critérios de aceitação.

---

## 5. Protótipo


---

## 6. Checklist do Definition of Ready (DoR)

Marque os itens conforme a história atender a cada condição.

- [ ] A HU possui definição clara e informação necessária para ser trabalhada?
- [ ] O requisito está representado por uma história de usuário?
- [ ] A HU está rastreada aos requisitos de origem?
- [ ] A HU faz parte do escopo do MVP?
- [ ] A HU está coberta por critérios de aceite?
- [ ] Os RNFs e as restrições legais aplicáveis estão identificados?
- [ ] A HU está mapeada para uma interface, quando necessário?
- [ ] A HU cabe em uma iteração?
- [ ] As dependências estão mapeadas?
- [ ] Os responsáveis estão definidos?
- [ ] O requisito está implementado no protótipo e validado?

---

## 7. Checklist do Definition of Done (DoD)

Marque os itens após a verificação da entrega.

- [ ] Entrega um incremento do produto?
- [ ] Contempla os critérios de aceite estabelecidos?
- [ ] O desenvolvimento foi concluído integralmente?
- [ ] Os testes foram executados e aprovados?
- [ ] Está aderente aos padrões de codificação?
- [ ] A funcionalidade foi revisada pela equipe?
- [ ] Mantém os índices de performance do produto?
- [ ] Atende aos requisitos de acessibilidade e responsividade?
- [ ] Preserva a segurança e a privacidade dos dados?
- [ ] Trata os erros do usuário?
- [ ] Está livre de defeitos críticos?
- [ ] Está documentado?
