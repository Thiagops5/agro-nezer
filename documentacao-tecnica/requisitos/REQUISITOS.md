# 3. Engenharia de Requisitos (RF, RNF e RN) — Nezer Agro

> **O que é este documento e como ele facilita a compreensão do código?**
> Este documento reúne em um único lugar os **Requisitos Funcionais (RF)**, **Requisitos Não Funcionais (RNF)** e **Regras de Negócio (RN)** do TCC. Ele funciona como o "contrato oficial" entre o que foi prometido na monografia e o que está implementado no `nezer-api` e no `nezer-app`.

---

## 3.1. Requisitos Funcionais (RF)

| Código | Requisito Funcional | Perfil | Prioridade |
| :---: | :--- | :---: | :---: |
| **RF01** | **Autenticação, Refresh Token e Primeiro Acesso:** Login via **CPF ou E-mail** e `senha`, com renovação automática de token, bloqueio de usuários com `ativo = false` e troca obrigatória de senha temporária no primeiro acesso (`mustChangePassword`). | Todos | Essencial |
| **RF02** | **Gestão de Usuários e Arquivamento (`Usuario`):** Admin cadastra, lista, edita, arquiva (`ativo = false`, com desvinculação de talhões) e reativa contas (`ADMIN`, `MEEIRO`, `AJUDANTE`); o `MEEIRO` também pode cadastrar seu próprio `AJUDANTE` (notificando o Admin). | Admin / Meeiro (só Ajudante) | Essencial |
| **RF03** | **Gestão de Culturas e 3 Preços (`Cultura`):** Cadastrar e gerenciar culturas (Goiaba, Tomate, Quiabo, grãos, tubérculos, etc.) com preços fixados para **Mercado**, **Atacado** e **Polpa**. | Somente Admin | Essencial |
| **RF04** | **Gestão de Insumos, Estoque e Nota Fiscal (`Insumo`):** Cadastrar defensivos e fertilizantes com unidade de medida, custo unitário, dias de carência da bula (`carenciaDias`) e anexo opcional da **Nota Fiscal (PDF ou imagem)**; marcar como indisponível (`ativo = false`) quando acabar no estoque (ocultando de novas aplicações sem apagar histórico) e confirmar insumos personalizados sugeridos pelos meeiros. | Somente Admin | Essencial |
| **RF05** | **Gestão de Talhões (`Talhao`):** Cadastrar talhões vinculando Cultura, Meeiro responsável, Meeiros Ajudantes (`N:M`), área e `percentualMeeiro` (padrão 50%), permitindo desvincular o meeiro do talhão sem apagar o talhão. | Admin (Escrita) / Todos (Leitura) | Essencial |
| **RF06** | **Monitoramento Visual de Carência:** Exibir selo verde ("Liberado") ou vermelho ("Em carência até DD/MM" + último insumo) nos talhões. | Admin e Meeiro | Essencial |
| **RF07** | **Registro de Aplicação com Múltiplos Insumos (`Aplicacao`):** Registrar aplicação selecionando **1 ou mais insumos** (ou informando um insumo personalizado para confirmação posterior do Admin), quantidades, foto obrigatória (`urlFoto`) e GPS, congelando custos e atualizando a carência pela maior data. | Meeiro e Admin | Essencial |
| **RF08** | **Alerta Sanitário e Termo de Ciência:** Ao selecionar talhão em carência na colheita, exibir card vermelho e exigir aceite do Termo de Ciência. | Meeiro e Admin | Essencial |
| **RF09** | **Registro de Colheita (`Colheita`):** Registrar colheita escolhendo destino (`MERCADO`, `ATACADO`, `POLPA`), caixas, foto obrigatória e GPS, calculando o valor pelo preço da Cultura. | Meeiro e Admin | Essencial |
| **RF10** | **Conferência de Colheita pelo Admin:** Permitir ao Admin visualizar a foto das caixas e aprovar (`APROVADA`), ajustar quantidade com observação ou rejeitar (`REJEITADA`). | Somente Admin | Essencial |
| **RF11** | **Geração do Acerto a Meia (`AcertoFinanceiro`):** Somar colheitas `APROVADA` em aberto, descontar aplicações em aberto e partilhar o saldo líquido pelo `percentualMeeiro`. | Somente Admin | Essencial |
| **RF12** | **Comprovante PIX e Quitação:** Anexar comprovante PIX (`urlComprovantePix`) e atualizar status do acerto para `PAGO`. | Somente Admin | Essencial |
| **RF13** | **Demonstrativo de Rateio da Parceria:** Exibir demonstrativo detalhado do Acerto a Meia respeitando o vocabulário do Estatuto da Terra. | Admin e Meeiro | Essencial |
| **RF14** | **Dashboard de Indicadores:** Exibir cards com talhões em carência, colheitas com alerta sanitário, colheitas pendentes e total partilhado. | Admin e Meeiro | Importante |
| **RF15** | **Fila de Sincronização Offline:** Cache local de talhões/insumos e fila de envio no `localStorage` para uso sem sinal no campo. | Meeiro | Importante |
| **RF16** | **Registro de Ocorrências (Pragas) e Pedido de Insumo (`Ocorrencia`):** Permitir registrar pragas com foto, pedir um insumo existente ou sugerir um nome personalizado ao Admin; o Admin cadastra/confirma e avisa quando o produto chega para o meeiro já puxar os dados prontos na aplicação. | Meeiro/Ajudante e Admin | Importante |
| **RF17** | **Central de Notificações (`Notificacao`):** Notificar usuários sobre conferência/ajuste de colheitas, chegada de insumos, confirmação de insumo personalizado e acertos financeiros. | Todos | Importante |

---

## 3.2. Requisitos Não Funcionais (RNF)

| Código | Requisito Não Funcional | Categoria | Implementação no Código |
| :---: | :--- | :---: | :--- |
| **RNF01** | **Atomicidade Transacional (ACID):** Aplicações e Acertos devem gravar múltiplas tabelas em transação única. | Confiabilidade | `await db.transaction()` no Sequelize. |
| **RNF02** | **Segurança e Proteção de Dados Sensíveis (LGPD):** Senhas com hash irreversível `bcrypt` (ocultadas no `toJSON()`) e `cpf`/`telefone` criptografados com `AES-256-CBC` (`config/crypto.js`). | Segurança / LGPD | `bcrypt.hash` + `toJSON()` + `config/crypto.js`. |
| **RNF03** | **Controle de Acesso (RBAC em 3 Perfis):** Rotas administrativas bloqueiam não-admins e rotas financeiras/acertos bloqueiam o perfil `AJUDANTE` retornando `403 Forbidden`. | Segurança | `verifyToken`, `verifyAdmin` e `verifyUser` em `auth.middleware.js`. |
| **RNF04** | **Integridade Referencial:** Bloquear exclusão de registros com vínculos ativos retornando `409 Conflict`. | Integridade | Verificação de vínculos/FKs nos services + `res.status(409)`. |
| **RNF05** | **Usabilidade Mobile-First:** Interface responsiva para uso em celular no campo com abertura direta da câmera traseira. | Usabilidade | Tailwind CSS + `capture="environment"`. |
| **RNF06** | **Conformidade Legal:** Alinhamento ao Estatuto da Terra (Lei nº 4.504/1964) e à INC nº 02/2018 (MAPA/ANVISA). | Legal | Vocabulário de parceria autônoma e rastreabilidade por talhão. |

---

## 3.3. Regras de Negócio (RN)

* **RN01 (Preços Fixados):** O meeiro não digita valor em R$; o preço vem sempre da `Cultura` (`MERCADO`, `ATACADO`, `POLPA`).
* **RN02 (Custo Congelado):** O custo unitário do insumo é congelado na `Aplicacao` no momento do registro.
* **RN03 (Prevalência da Maior Carência):** Insumos de carência menor ou zero nunca reduzem uma carência ativa maior no `Talhao`.
* **RN04 (Termo de Ciência Obrigatório):** Colheitas em talhão com `carenciaAte > hoje` exigem `termoCienciaAceito === true` (senão retorna HTTP `400`).
* **RN05 (Filtro de Conferência):** Apenas colheitas `APROVADA` e com `acertoFinanceiroId === null` entram no Acerto Financeiro.
* **RN06 (Regra dos 7 Dias ou > R$ 10.000,00):** Não é permitido gerar novo acerto para o mesmo talhão com menos de 7 dias desde o último acerto, **exceto** se `valorAcerto > 10000`.
* **RN07 (Confirmação de Insumo Personalizado antes do Acerto):** Se um meeiro registrar uma aplicação com um insumo não cadastrado (personalizado), o valor e a carência definitivos dependem da confirmação do Admin; o sistema não deve fechar o Acerto Financeiro daquele talhão enquanto houver aplicação com insumo pendente de confirmação.
* **RN08 (Arquivamento Seguro de Usuário):** Um usuário só pode ser arquivado (`ativo = false`) se não possuir `AcertoFinanceiro` com `statusPagamento = 'PENDENTE'` nem colheitas/aplicações em aberto (`acertoFinanceiroId = null`). Ao arquivar, o sistema desvincula seus talhões automaticamente e revoga seus tokens, podendo reativá-lo futuramente com o mesmo login e senha.
* **RN09 (Restrição do Perfil Ajudante):** O perfil `AJUDANTE` pode registrar aplicações, colheitas e ocorrências apenas nos talhões em que está vinculado, mas não participa do rateio e é bloqueado de visualizar acertos financeiros.
* **RN10 (Janela de Correção de 48h pelo Admin):** Apenas o Admin pode ajustar registros de colheita na conferência, dentro do prazo de até 48 horas contadas da chegada/sincronização no servidor.
