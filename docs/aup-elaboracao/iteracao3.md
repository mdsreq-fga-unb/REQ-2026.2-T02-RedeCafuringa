# Evidências da Iteração 3

## Elicitação e Descoberta 

??? info "Valor de Negócio e Esforço Técnico - Requisitos Funcionais"  
    A escala de 1 a 4 apresentada em ferramentas de priorização e estimativa de requisitos costuma representar o grau de dificuldade, tempo de desenvolvimento ou incerteza técnica associada à entrega. Geralmente, os valores indicam:

    **1 - Muito Baixo:** tarefas simples que exigem até 2 horas de trabalho, soluções conhecidas e domínio pleno por parte da equipa.

    **2 - Baixo:** trabalho moderado (2 a 6 horas), que exige alguma investigação ou integração, mas onde a equipa já possui conhecimento suficiente

    **3 - Alto:** tarefas exigentes (6 a 12 horas), com várias incertezas técnicas e a necessidade de desenvolver novas competências.

    **4 - Muito Alto:** grande desafio (mais de 12 horas), caracterizado por elevada incerteza técnica, tecnologias não dominadas e a atual ausência de conhecimentos ou recursos para a sua execução.

    | Código | Requisito | Esforço | Complexidade | Capacidade | Esforço Técnico |
    |---|---|---:|---:|---:|---:|
    | **RF01** | Cadastrar perfil de consumidor | 2 | 1 | 1 | **1,3 → 1** |
    | **RF02** | Cadastrar perfil de produtor | 2 | 1 | 1 | **1,3 → 1** |
    | **RF03** | Cadastrar usuário admin | 2 | 1 | 1 | **1,3 → 1** |
    | **RF04** | Consultar usuários cadastrados | 2 | 2 | 1 | **1,7 → 2** |
    | **RF05** | Desativar usuário | 1 | 2 | 1 | **1,3 → 1** |
    | **RF06** | Consultar conteúdos cadastrados | 2 | 3 | 1 | **2,0 → 2** |
    | **RF07** | Remover conteúdo inadequado | 2 | 3 | 1 | **2,0 → 2** |
    | **RF08** | Atualizar informações institucionais | 1 | 1 | 1 | **1,0 → 1** |
    | **RF09** | Autenticar usuário | 2 | 3 | 2 | **2,3 → 2** |
    | **RF10** | Recuperar acesso à conta | 2 | 3 | 1 | **2,0 → 2** |
    | **RF11** | Excluir conta | 2 | 3 | 1 | **2,0 → 2** |
    | **RF12** | Registrar trajetória do produtor | 1 | 2 | 1 | **1,3 → 1** |
    | **RF13** | Atualizar perfil de produtor | 2 | 2 | 1 | **1,7 → 2** |
    | **RF14** | Consultar perfil de produtor | 2 | 2 | 1 | **1,7 → 2** |
    | **RF15** | Informar certificação | 2 | 4 | 3 | **3,0 → 3** |
    | **RF16** | Preencher questionário do produtor | 2 | 3 | 3 | **2,6 → 3** |
    | **RF17** | Cadastrar produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF18** | Atualizar produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF19** | Excluir produto | 1 | 2 | 1 | **1,3 → 1** |
    | **RF20** | Informar disponibilidade de produto | 2 | 3 | 1 | **2,0 → 2** |
    | **RF21** | Consultar catálogo de produtos | 2 | 2 | 1 | **1,7 → 2** |
    | **RF22** | Consultar detalhes do produto | 2 | 2 | 1 | **1,7 → 2** |
    | **RF23** | Cadastrar experiência | 2 | 2 | 2 | **2,0 → 2** |
    | **RF24** | Atualizar experiência | 2 | 2 | 2 | **2,0 → 2** |
    | **RF25** | Consultar experiência | 2 | 3 | 2 | **2,3 → 2** |
    | **RF26** | Excluir experiência | 1 | 2 | 1 | **1,3 → 1** |
    | **RF27** | Cadastrar evento | 2 | 2 | 2 | **2,0 → 2** |
    | **RF28** | Atualizar evento | 2 | 2 | 1 | **1,7 → 2** |
    | **RF29** | Consultar evento | 1 | 2 | 1 | **1,3 → 1** |
    | **RF30** | Excluir evento | 1 | 2 | 1 | **1,3 → 1** |
    | **RF31** | Auxiliar cadastro de atividade | 4 | 4 | 4 | **4 → 4** |
    | **RF32** | Apresentar informações da Cafuringa | 1 | 1 | 1 | **1,0 → 1** |
    | **RF33** | Consultar guia de boas práticas | 1 | 2 | 2 | **1,7 → 2** |
    | **RF34** | Notificar eventos | 3 | 3 | 3 | **3,0 → 3** |
    | **RF35** | Visualizar ofertas no mapa | 4 | 4 | 2 | **3,3 → 3** |
    | **RF36** | Buscar ofertas | 3 | 3 | 2 | **2,6 → 3** |
    | **RF37** | Buscar locais por proximidade | 4 | 3 | 4 | **3,6 → 4** |
    | **RF38** | Filtrar resultados de busca | 2 | 3 | 2 | **2,3 → 2** |
    | **RF39** | Disponibilizar contato direto | 4 | 4 | 4 | **4,0 → 4** |
    | **RF40** | Enviar feedback ao fornecedor | 3 | 3 | 2 | **2,6 → 3** |
    | **RF41** | Visualizar feedback | 2 | 2 | 1 | **1,7 → 2** |
    | **RF42** | Editar feedback | 1 | 2 | 1 | **1,3 → 1** |
    | **RF43** | Excluir feedback ao fornecedor | 1 | 2 | 2 | **1,7 → 2** |
    | **RF44** | Solicitar pré-reserva de experiência | 4 | 3 | 3 | **3,3 → 3** |
    | **RF45** | Consultar pré-reserva | 2 | 2 | 2 | **2,0 → 2** |
    | **RF46** | Cancelar solicitação de pré-reserva | 2 | 3 | 2 | **2,3 → 2** |
    | **RF47** | Responder pré-reserva de experiência | 3 | 3 | 3 | **3,0 → 3** |
    | **RF48** | Notificar alteração de pré-reserva | 3 | 4 | 3 | **3,3 → 3** |

??? info "Valor de Negócio e Esforço Técnico - Requisitos Não Funcionais" 

    O cálculo do Esforço Técnico final na tabela foi feito a partir da média aritmética simples das três variáveis avaliadas (Esforço, Complexidade e Capacidade). O resultado fracionado é então arredondado para o número inteiro mais próximo para definir a pontuação final do requisito.

    | Código | Requisito | Esforço | Complexidade | Capacidade | Esforço Técnico |
    |---|---|---:|---:|---:|---:|
    | **RNF01** | Eficiência de navegação | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF02** | Desempenho na execução de tarefas | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF03** | Prevenção e recuperação de erros | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF04** | Acessibilidade digital | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF05** | Responsividade da interface | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF06** | Desempenho em conectividade limitada | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF07** | Resiliência à perda de conexão | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF08** | Controle de acesso por perfil | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF09** | Privacidade do feedback | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF10** | Proteção da comunicação | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF11** | Proteção de dados pessoais | 3 | 3 | 2 | **2,7 → 3** |
    | **RNF12** | Compatibilidade entre navegadores | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF13** | Baixo custo operacional | 2 | 2 | 1 | **1,7 → 2** |
    | **RNF14** | Disponibilização como aplicação web progressiva | 3 | 3 | 2 | **2,7 → 3** |
        
---

## Declaração de Requisitos

??? info "Priorização MoScoW"
    Reunião de negociação para classificar os requisitos do sistema em quatro níveis de criticidade (Must Have, Should Have, Could Have, Won't Have), visando alinhar as expectativas e definir o escopo do Produto Mínimo Viável.

    - ![MoScoW](../../img/aup-elaboracao/moscow_final.png)

??? info "Histórias de Usuário"
    Tradução e escrita das necessidades elicitadas em formato narrativo sob a perspectiva do usuário final (focando em quem, o que e por que), incluindo a definição dos critérios de aceitação para cada funcionalidade.

    - ![Histórias de Usuário](../../img/aup-elaboracao/historias_usuario.jpeg)

---

## Análise e Consenso

??? info "Matriz de Quadrantes (Valor de Negócio vs. Complexidade Técnica)"
    
    Ponderação entre o valor para os usuários e o esforço de engenharia para delimitar o escopo do MVP.

    - ![Matriz de Quadrantes](../../img/aup-elaboracao/matriz_quadrantes.png)

---

## Vídeos Comprobatórios

O vídeo abaixo registra a primeira visita presencial na Cafuringa, experiência realizada em 21/09/2026 com objetivo de conhecer o lugar, o próprio Jefferson Sooma e discutir os requisitos do projeto.

<video width="100%" controls>
    <source src="../../img/aup-elaboracao/visitacao.mp4" type="video/mp4">
</video>