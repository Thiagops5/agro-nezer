# 1. Documentação Técnica — Back-end (`nezer-api`)

> **O que é este documento e como ele facilita a compreensão do código?**
> Este arquivo concentra toda a engenharia, arquitetura e regras de negócio do Back-end (`nezer-api`) em um único lugar. Ele segue uma hierarquia de leitura (`1.` Back-end -> `1.1` Módulo/Lógica -> `1.1.1` Detalhe/Arquivo) para que você ou qualquer avaliador do TCC entenda rapidamente onde está cada regra e o porquê de cada decisão técnica.

---

## Sumário Rápido (Clique para ir direto ao trecho)
- [1. Visão Geral e Arquitetura em Camadas](#1-visao-geral)
- [1.1. Módulos e Entidades do Back-end](#1-1-modulos)
  - [1.1.1. Módulo `talhao/` (Quadras, Percentual, Carência e Área)](#1-1-1-talhao)
  - [1.1.2. Módulos `cultura/` e `insumo/` (Preços Fixados e Bula Sanitária)](#1-1-2-cultura-insumo)
  - [1.1.3. Módulos `aplicacao/` e `colheita/` (Manejo, Fotos e Conferência)](#1-1-3-aplicacao-colheita)
  - [1.1.4. Módulo `acerto/` (Fechamento "Acerto a Meia" e PIX)](#1-1-4-acerto)
  - [1.1.5. Módulos `usuario/` e `auth/` (Perfis Admin/Meeiro e JWT)](#1-1-5-usuario-auth)
- [1.2. Lógicas Complexas de Negócio](#1-2-logicas)
  - [1.2.1. Integridade Referencial e Bloqueio de Exclusão (`409 Conflict`)](#1-2-1-bloqueio-409)
  - [1.2.2. Prevalência da Maior Carência e Custo Congelado (`db.transaction`)](#1-2-2-carencia-custo)
  - [1.2.3. Regra do Acerto a Meia: Prazo de 7 Dias ou Exceção > R$ 10.000,00](#1-2-3-acerto-7-dias)
  - [1.2.4. Decisões de Tipagem no Banco (`ENUM`, `STRING` e `DECIMAL`)](#1-2-4-tipagem-banco)

---

<a id="1-visao-geral"></a>
## 1. Visão Geral e Arquitetura em Camadas

O `nezer-api` é construído com **Node.js + Express 5 + Sequelize + SQLite3 + JWT + Multer**, seguindo exatamente a mesma arquitetura modular em 4 camadas da Biblioteca (`jwt-api`):

```text
modulo/
├── modulo.model.js       # Define a tabela e os tipos de colunas no SQLite via Sequelize
├── modulo.service.js     # Contém TODA a regra de negócio, cálculos, travas e db.transaction()
├── modulo.controller.js  # Recebe req/res do Express e devolve o status HTTP correto (200, 201, 204, 400, 404, 409)
└── modulo.router.js      # Define as rotas REST e aplica middlewares (verifyToken / verifyAdmin)
```

### Por que usamos o estilo enxuto no `service.js` (`findAll` e `findById`)?
Nos métodos de leitura (`findAll` e `findById`), retornamos diretamente a consulta do Sequelize sem envolver em `try/catch` redundante nem lançar `throw new Error` quando não encontra o ID:
* Se o registro não existir, `findByPk` retorna `null` e o `controller` trata `if (!registro) return res.status(404)...`.
* Se usássemos `try/catch` com `throw` no `findById` do service, o erro cairia no `catch` do controller como **`500 Internal Server Error`** em vez de **`404 Not Found`**.

---

<a id="1-1-modulos"></a>
## 1.1. Módulos e Entidades do Back-end

<a id="1-1-1-talhao"></a>
### 1.1.1. Módulo `talhao/` (Quadras, Percentual, Carência e Área)

O projeto nasceu da vivência real no campo com **Goiaba, Tomate e Quiabo** (culturas de ciclo rápido e colheita múltipla), mas como `Talhao` se liga dinamicamente à tabela `Cultura` (`culturaId`), o sistema suporta **qualquer cultura agrícola** — incluindo **grãos (soja, milho)** e **tubérculos (batata, mandioca)**.

#### Por que cada campo mora dentro de `talhao.model.js`?

1. **Por que `percentualMeeiro` fica no `Talhao` (e não no `Usuario`)?**
   * No campo e pelo **Estatuto da Terra (Lei nº 4.504/1964)**, a proporção da parceria é combinada **por quadra plantada (Talhão)**.
   * O padrão é **50% / 50%** (`defaultValue: 50.0`), mas um mesmo meeiro pode cuidar de um talhão de Goiaba a `50%` e de uma estufa de Tomate altamente tecnificada a `40%`. Ao gerar o acerto daquele talhão, o sistema já lê `talhao.percentualMeeiro` direto.

2. **Por que `carenciaAte` e `ultimoInsumoNome` ficam no `Talhao`?**
   * Quem fica em período de carência após a pulverização é a **lavoura (o Talhão)**.
   * Guardar `carenciaAte` e `ultimoInsumoNome` direto no `Talhao` garante:
     * **Leitura instantânea:** Para exibir o selo **VERDE ("Liberado")** ou **VERMELHO ("Em carência até DD/MM")**, o sistema não precisa varrer todo o histórico de aplicações; basta checar `talhao.carenciaAte > hoje`.
     * **Funcionamento Offline:** Quando o celular do meeiro salva a lista de talhões no `localStorage`, o status sanitário e o nome do último defensivo já vão juntos.
     * **Explicação imediata no alerta:** O formulário de colheita já sabe mostrar na hora qual defensivo causou a carência sem precisar fazer `JOIN` pesado.

3. **Por que `area` é uma `STRING` (e não uma URL ou imagem)?**
   * Na agronomia, **`area`** é o tamanho físico do lote plantado — em `STRING` para aceitar tanto `"1.5 ha"` (hectares, comum em grãos/mandioca) quanto `"1.200 pés"` (comum em goiaba/tomate).
   * **Onde ficam as imagens (`urlFoto`)?** Ficam nas operações que exigem auditoria visual:
     * `Aplicacao.urlFoto` (foto da aplicação do defensivo);
     * `Colheita.urlFoto` (foto das caixas colhidas para o Admin conferir);
     * `AcertoFinanceiro.urlComprovantePix` (comprovante do pagamento PIX).

4. **Uso do `include` no `talhao.service.js` e Meeiros Ajudantes (`N:M`):**
   Tanto no `findAll` quanto no `findById`, incluímos `{ model: Cultura }`, `{ model: Usuario }` (o **Meeiro Responsável**, que recebe o Acerto Financeiro) e `{ model: Usuario, as: 'ajudantes' }` (relação `N:M` via tabela `TalhaoAjudante` para os **Meeiros Ajudantes** que também podem registrar aplicações e colheitas naquele talhão).

---

<a id="1-1-2-cultura-insumo"></a>
### 1.1.2. Módulos `cultura/` e `insumo/` (Preços Fixados e Bula Sanitária)

* **`cultura.model.js`:** Possui `nomeCultura` (único) e os **3 preços fixados pelo Admin** por canal de escoamento:
  * `precoMercado` (fruta de mesa / primeira linha, maior valor);
  * `precoAtacado` (CEASA / grandes volumes);
  * `precoPolpa` (fruta madura para indústria / suco / doce).
  * O meeiro nunca digita valor em R$ na colheita; ele escolhe o destino e a API puxa o preço da Cultura.
* **`insumo.model.js`:** Possui `nomeInsumo` (único), `tipoInsumo` (`DEFENSIVO`, `FERTILIZANTE`, `BIOLOGICO`, `OUTRO`), `unidadeMedida` (`L`, `ml`, `Kg`, `g`, `un`), `custoUnitario` (em R$ por 1 unidade da `unidadeMedida`, que será usado nos descontos do Acerto Financeiro), `carenciaDias` (dias de carência da bula oficial), **`urlNotaFiscal`** (caminho opcional da Nota Fiscal em **PDF ou imagem** enviada via `multer` para transparência do custo) e **`statusCadastro`** (`ENUM('CONFIRMADO', 'PENDENTE_CONFIRMACAO')` — permitindo que insumos sugeridos pelo meeiro na hora fiquem aguardando validação e preenchimento de preço/carência pelo Admin).

---

<a id="1-1-3-aplicacao-colheita"></a>
### 1.1.3. Módulos `aplicacao/` e `colheita/` (Manejo, Fotos e Conferência)

* **`aplicacao.model.js` + `aplicacaoInsumo.model.js` (Múltiplos Insumos por Aplicação — "Mistura de Tanque"):**
  * Uma única `Aplicacao` no campo pode conter **1 ou vários insumos** (relação `N:M` via tabela intermediária `AplicacaoInsumo`).
  * **`Aplicacao` (cabeçalho da operação):** Registra `dataAplicacao`, `custoTotal` (soma dos itens da aplicação), `urlFoto`, `latitude`, `longitude`, `status` (`'REGISTRADA'` ou `'PENDENTE_INSUMO'` quando há item personalizado aguardando o Admin) e as FKs `talhaoId`, `usuarioId` e `acertoFinanceiroId` (nullable).
  * **`AplicacaoInsumo` (cada insumo usado naquela mistura):** Registra `aplicacaoId`, `insumoId`, `quantidadeAplicada`, `unMedida`, `custoUnitarioCongelado`, `custoItem`, `carenciaDiasAplicada` e `dataFimCarencia`.
  * **Fluxo do Insumo Personalizado na Hora:** Se o insumo não estiver na lista, o meeiro informa um nome personalizado (sem definir preço/carência). O sistema cria um pré-cadastro com `statusCadastro = 'PENDENTE_CONFIRMACAO'` (ou marca a aplicação como `'PENDENTE_INSUMO'`). Quando o **Admin** confirma o insumo preenchendo os dados completos (custo, carência da bula e Nota Fiscal em PDF/imagem), o sistema recalcula automaticamente o custo da aplicação (para entrar nos descontos do Acerto) e atualiza a carência do talhão!
* **`colheita.model.js`:** Registra `dataColheita`, `tipoDestino` (`MERCADO`, `ATACADO`, `POLPA`), `qntCaixas`, `valorCaixaFixado`, `valorTotal`, `urlFoto`, `latitude`, `longitude`, `emCarencia`, `termoCienciaAceito`, `statusConferencia` (`PENDENTE`, `APROVADA`, `REJEITADA`), `observacaoAdmin` e as FKs `talhaoId`, `usuarioId` e `acertoFinanceiroId`.
  * Toda colheita nasce `PENDENTE`. O Admin abre a foto (`urlFoto`), confere a quantidade e chama `PATCH /v1/colheitas/:id/conferir` para aprovar ou rejeitar. **Só colheitas `APROVADA` entram no Acerto Financeiro.**

---

<a id="1-1-4-acerto"></a>
### 1.1.4. Módulo `acerto/` (Fechamento "Acerto a Meia" e PIX)

* **`acerto.model.js`:** Armazena `dataAcerto`, `receitas`, `descontos`, `saldoLiquido`, `percentualMeeiro`, `valorAcerto` (Meeiro), `valorProdutor`, `statusPagamento` (`PENDENTE`, `PAGO`), `urlComprovantePix` (nullable) e as FKs `talhaoId` e `usuarioId`.
* Ao fechar o acerto dentro de `db.transaction()`, todas as colheitas aprovadas e aplicações incluídas têm seu `acertoFinanceiroId` preenchido com o ID do acerto recém-criado — impedindo cobrança ou pagamento duplicado no mês seguinte.

---

<a id="1-1-5-usuario-auth"></a>
### 1.1.5. Módulos `usuario/` e `auth/` (Perfis Admin/Meeiro/Ajudante, `mustChangePassword` e JWT)

* **`usuario.model.js`:** Armazena `nome`, `email` (opcional, único), `telefone` (`STRING`), `cpf` (obrigatório, único — usado no login), `senha` (hash bcrypt), **`perfil` (`ENUM('ADMIN', 'MEEIRO', 'AJUDANTE')`, default `'MEEIRO'`)**, `ativo` (`false` bloqueia o login preservando o histórico) e **`mustChangePassword`** (`BOOLEAN`, default `true`). Sobrescreve `toJSON()` para nunca retornar `senha` no JSON.
  * **Por que `perfil` (`ENUM`) em vez de `isAdmin` (`BOOLEAN`)?** Como existem 3 níveis de acesso (`ADMIN`, `MEEIRO` e `AJUDANTE`), um booleano não conseguiria separar o `MEEIRO` (que vê demonstrativos financeiros) do `AJUDANTE` (que só lança campo).
* **`auth/` (`auth.router.js`, `auth.controller.js`, `auth.service.js`, `auth.middleware.js`, `refreshToken.model.js`, `logoutList.model.js`):**
  * **Login flexível (`CPF` ou `E-mail`):** Aceita um único campo `identificador`; se contiver `@`, busca por e-mail; caso contrário, limpa a pontuação e busca por CPF.
  * **Fluxo do primeiro acesso (`mustChangePassword`):** Quando o Admin pré-cadastra um meeiro com senha temporária, `mustChangePassword` nasce `true`. O `login` e o `/me` devolvem essa flag para o Front-end redirecionar o usuário à tela de definição de senha, que chama `PATCH /v1/auth/trocar-senha` (atualizando a senha com `bcrypt` e marcando `mustChangePassword = false`).
  * **Por que existem dois middlewares de permissão (`verifyAdmin` e `verifyUser`) além do `verifyToken`?**
    1. `verifyToken`: Garante que o usuário está logado (usado em rotas que todos os 3 perfis usam, como registrar aplicações e colheitas).
    2. `verifyAdmin`: Exige `perfil === 'ADMIN'` (protege cadastros de culturas, preços, insumos, talhões, usuários, conferência de colheitas e criação de acertos).
    3. `verifyUser`: Libera para `ADMIN` e `MEEIRO`, bloqueando `AJUDANTE` (`403 Forbidden`) — usado para proteger a consulta do **Acerto Financeiro / Demonstrativo**, já que o ajudante não pode visualizar valores financeiros da parceria.

---

<a id="1-2-logicas"></a>
## 1.2. Lógicas Complexas de Negócio

<a id="1-2-1-bloqueio-409"></a>
### 1.2.1. Integridade Referencial e Bloqueio de Exclusão (`409 Conflict`)

Nunca podemos excluir uma entidade que esteja vinculada a um usuário ou a registros operacionais, pois isso quebraria a rastreabilidade exigida pela **INC nº 02/2018 (MAPA/ANVISA)** e o histórico financeiro do produtor.

No `talhao.service.js`, o método `delete(id)` executa **duas travas antes de destruir**:
```javascript
delete: async (id) => {
    const talhao = await Talhao.findByPk(id);
    if (!talhao) throw new Error('Talhão não encontrado');

    // 1. Verifica se existe um usuario (meeiro) vinculado a este talhao
    if (talhao.usuarioId) {
        throw new Error('Não foi possível excluir talhão pois possui registros vinculados (meeiro responsável ativo neste talhão).');
    }

    // 2. Verifica se ja existem aplicacoes, colheitas ou acertos registrados neste talhao
    const aplicacaoCount = await Aplicacao.count({ where: { talhaoId: id } });
    const colheitaCount = await Colheita.count({ where: { talhaoId: id } });
    const acertoCount = await AcertoFinanceiro.count({ where: { talhaoId: id } });

    if (aplicacaoCount > 0 || colheitaCount > 0 || acertoCount > 0) {
        throw new Error('Não foi possível excluir talhão pois possui registros vinculados (aplicações, colheitas ou acertos).');
    }

    await talhao.destroy();
}
```
E o `talhao.controller.js` intercepta `'possui registros vinculados'` e devolve **`HTTP 409 Conflict`**. O mesmo padrão de trava `409` se aplica a:
* **`Cultura`:** Bloqueia se `Talhao.count({ where: { culturaId: id } }) > 0`.
* **`Insumo`:** Bloqueia se `Aplicacao.count({ where: { insumoId: id } }) > 0`.
* **`Usuario`:** Bloqueia se possuir `Talhao`, `Aplicacao`, `Colheita` ou `AcertoFinanceiro` vinculados (para encerrar parceria, usa-se `ativo = false`).

---

<a id="1-2-2-carencia-custo"></a>
### 1.2.2. Prevalência da Maior Carência e Custo Congelado (`db.transaction`)

No `aplicacao.service.js`, tudo roda dentro de `const t = await db.transaction()`:
1. **Custo Unitário Congelado (por item):** Para cada insumo da lista enviada na aplicação, copia `insumo.custoUnitario` para `custoUnitarioCongelado` em `AplicacaoInsumo`, calcula `custoItem = quantidadeAplicada * custoUnitarioCongelado` e soma tudo em `aplicacao.custoTotal`. Se o preço do insumo subir no mês seguinte, o passado financeiro nunca muda.
2. **Prevalência da Maior Carência (entre todos os insumos da mistura):**
   * Se na mesma aplicação (ou no mesmo dia) forem usados um defensivo de **10 dias** de carência e um adubo de **0 dias**, o talhão **não pode cair para 0 dias**!
   * Regra: Para cada item da aplicação, calcula `dataFimCarencia` e compara a **maior** delas com `talhao.carenciaAte`. Só atualiza `talhao.carenciaAte` e `talhao.ultimoInsumoNome` se `insumo.carenciaDias > 0` **E** (`!talhao.carenciaAte` **OU** `maiorDataFimCarencia > new Date(talhao.carenciaAte)`).

---

<a id="1-2-3-acerto-7-dias"></a>
### 1.2.3. Regra do Acerto a Meia: Prazo de 7 Dias ou Exceção > R$ 10.000,00

No `acerto.service.js`, dentro de `db.transaction()`:
1. Soma `receitas` (colheitas `APROVADA` com `acertoFinanceiroId: null`) e `descontos` (aplicações com `acertoFinanceiroId: null`).
2. Calcula `saldoLiquido = receitas - descontos`, `valorAcerto = saldoLiquido * (talhao.percentualMeeiro / 100)` e `valorProdutor = saldoLiquido - valorAcerto`.
3. Busca o `ultimoAcerto` do talhão e calcula `diasPassados`:
   * Se `diasPassados < 7` **E** `valorAcerto <= 10000` -> **Bloqueia (`400 Bad Request`)** com a mensagem: *"O intervalo mínimo entre acertos é de 7 dias. Acertos antecipados só são permitidos quando o valor ultrapassa R$ 10.000,00."*
   * Se `diasPassados >= 7` **OU** `valorAcerto > 10000` -> **Libera o Acerto!**

---

<a id="1-2-4-tipagem-banco"></a>
### 1.2.4. Decisões de Tipagem no Banco (`ENUM`, `STRING` e `DECIMAL`)

Decisões aplicadas diretamente nos `.model.js` para garantir integridade e compatibilidade com o SQLite:

1. **O que é `ENUM` e por que ele foi a escolha correta (em vez de `ARRAY`, `STRING` ou `BOOLEAN`)?**
   * **O que é:** `DataTypes.ENUM('OPCAO_A', 'OPCAO_B', ...)` restringe a coluna para aceitar **apenas 1 valor** dentre uma lista fechada de opções pré-definidas.
   * **Por que não `DataTypes.ARRAY`?** Além de só funcionar no PostgreSQL (quebra no SQLite), `ARRAY` serve para guardar *vários itens dentro da mesma célula*, enquanto caixas de seleção (`<select>`) precisam salvar *uma única opção escolhida*.
   * **Onde o `ENUM` resolveu problemas reais do projeto:**
     * **`Usuario.perfil` (`'ADMIN'`, `'MEEIRO'`, `'AJUDANTE'`):** Um `BOOLEAN` (`isAdmin`) não conseguiria distinguir o `MEEIRO` (que vê o financeiro) do `AJUDANTE` (que só lança campo).
     * **Fluxos e opções fixas:** `Colheita.tipoDestino` (`'MERCADO'`, `'ATACADO'`, `'POLPA'`), `Colheita.statusConferencia` (`'PENDENTE'`, `'APROVADA'`, `'REJEITADA'`), `AcertoFinanceiro.statusPagamento` (`'PENDENTE'`, `'PAGO'`) e `Insumo.statusCadastro` (`'CONFIRMADO'`, `'PENDENTE_CONFIRMACAO'`). Assim, o próprio banco impede gravações inválidas vindas de fora do front-end.

2. **Por que `cpf` e `telefone` são `STRING` (e nunca `DECIMAL` ou `INTEGER`)?**
   * Tipos numéricos apagam **zeros à esquerda** (como CPFs iniciados em `0` ou DDDs como `011`) e impedem armazenar formatação. Como `cpf` é usado no login, ele também recebe `unique: true`.

3. **Por que `DECIMAL(10, 2)` em dinheiro e quantidades?**
   * Garante precisão exata de **2 casas decimais (centavos)** em preços, custos congelados e acertos, evitando distorções de arredondamento de ponto flutuante (`FLOAT`) ou truncamento de `DECIMAL` sem escala.


4. **Dados espelhados nos Models para funcionar Offline:**
   * Alguns campos ficam salvos direto nas tabelas principais para o celular conseguir operar sem internet usando apenas o cache local (`localStorage`/IndexedDB):
     * `Talhao.carenciaAte` e `Talhao.ultimoInsumoNome`: o app sabe na hora se o talhão está em carência e qual defensivo causou o bloqueio sem precisar consultar o histórico de `Aplicacao`.
     * `Cultura` (`precoMercado`, `precoAtacado`, `precoPolpa`) e `Insumo` (`unidadeMedida`, `carenciaDias`): permitem calcular estimativas e alertas localmente no campo antes mesmo de sincronizar.

5. **Lembrete de Segurança / LGPD — Dados Sensíveis Criptografados (`Usuario`):**
   * **`senha`:** Sempre armazenada com hash **`bcrypt`** (irreversível) e ocultada no `toJSON()`.
   * **`cpf` e `telefone`:** Por serem dados pessoais sensíveis (LGPD), devem ser **criptografados** no banco (e descriptografados apenas quando necessário no servidor). *(Atenção na hora de implementar o login por CPF: usar hash auxiliar ou criptografia determinística para conseguir buscar o usuário pelo CPF sem guardar o número em texto puro).*
