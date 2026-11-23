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

4. **Uso do `include` no `talhao.service.js`:**
   Tanto no `findAll` quanto no `findById`, incluímos `{ model: Cultura }` e `{ model: Usuario }` para trazer o nome da cultura, os 3 preços de caixa e o meeiro responsável em uma única chamada.

---

<a id="1-1-2-cultura-insumo"></a>
### 1.1.2. Módulos `cultura/` e `insumo/` (Preços Fixados e Bula Sanitária)

* **`cultura.model.js`:** Possui `nomeCultura` (único) e os **3 preços fixados pelo Admin** por canal de escoamento:
  * `precoMercado` (fruta de mesa / primeira linha, maior valor);
  * `precoAtacado` (CEASA / grandes volumes);
  * `precoPolpa` (fruta madura para indústria / suco / doce).
  * O meeiro nunca digita valor em R$ na colheita; ele escolhe o destino e a API puxa o preço da Cultura.
* **`insumo.model.js`:** Possui `nomeInsumo` (único), `tipoInsumo` (`DEFENSIVO`, `FERTILIZANTE`, `BIOLOGICO`, `OUTRO`), `unidadeMedida` (`L`, `ml`, `Kg`, `g`, `un`), `custoUnitario` (em R$ por 1 unidade da `unidadeMedida`) e `carenciaDias` (dias de carência da bula oficial).

---

<a id="1-1-3-aplicacao-colheita"></a>
### 1.1.3. Módulos `aplicacao/` e `colheita/` (Manejo, Fotos e Conferência)

* **`aplicacao.model.js`:** Registra `dataAplicacao`, `quantidadeAplicada`, `custoUnitarioCongelado`, `custoTotal`, `carenciaDiasAplicada`, `dataFimCarencia`, `urlFoto`, `latitude`, `longitude`, `status` e as FKs `talhaoId`, `insumoId`, `usuarioId` e `acertoFinanceiroId` (nullable: `null` enquanto não entrou em nenhum acerto).
* **`colheita.model.js`:** Registra `dataColheita`, `tipoDestino` (`MERCADO`, `ATACADO`, `POLPA`), `qntCaixas`, `valorCaixaFixado`, `valorTotal`, `urlFoto`, `latitude`, `longitude`, `emCarencia`, `termoCienciaAceito`, `statusConferencia` (`PENDENTE`, `APROVADA`, `REJEITADA`), `observacaoAdmin` e as FKs `talhaoId`, `usuarioId` e `acertoFinanceiroId`.
  * Toda colheita nasce `PENDENTE`. O Admin abre a foto (`urlFoto`), confere a quantidade e chama `PATCH /v1/colheitas/:id/conferir` para aprovar ou rejeitar. **Só colheitas `APROVADA` entram no Acerto Financeiro.**

---

<a id="1-1-4-acerto"></a>
### 1.1.4. Módulo `acerto/` (Fechamento "Acerto a Meia" e PIX)

* **`acerto.model.js`:** Armazena `dataAcerto`, `receitas`, `descontos`, `saldoLiquido`, `percentualMeeiro`, `valorAcerto` (Meeiro), `valorProdutor`, `statusPagamento` (`PENDENTE`, `PAGO`), `urlComprovantePix` (nullable) e as FKs `talhaoId` e `usuarioId`.
* Ao fechar o acerto dentro de `db.transaction()`, todas as colheitas aprovadas e aplicações incluídas têm seu `acertoFinanceiroId` preenchido com o ID do acerto recém-criado — impedindo cobrança ou pagamento duplicado no mês seguinte.

---

<a id="1-1-5-usuario-auth"></a>
### 1.1.5. Módulos `usuario/` e `auth/` (Perfis Admin/Meeiro e JWT)

* **`usuario.model.js`:** Armazena `nome`, `username`, `email`, `cpf`, `telefone`, `senha` (hash bcrypt), `isAdmin` (`true` = Produtor/Admin, `false` = Meeiro/Parceiro) e `ativo` (`false` bloqueia o login preservando o histórico). Sobrescreve `toJSON()` para nunca retornar `senha` no JSON.
* **`auth/`:** Segue exatamente a Biblioteca (`auth.router.js`, `auth.controller.js`, `auth.service.js`, `auth.middleware.js`, `refreshToken.model.js`, `logoutList.model.js`), fornecendo `verifyToken` e `verifyAdmin` (`403 Forbidden` para meeiros em rotas exclusivas de Admin).

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
1. **Custo Unitário Congelado:** Copia `insumo.custoUnitario` para `custoUnitarioCongelado` e calcula `custoTotal = quantidadeAplicada * custoUnitarioCongelado`. Se o preço do insumo subir no mês seguinte, o passado financeiro nunca muda.
2. **Prevalência da Maior Carência:**
   * Se na segunda-feira foi aplicado um defensivo de **10 dias** de carência e na quarta-feira foi aplicado um adubo de **0 dias**, o talhão **não pode cair para 0 dias**!
   * Regra: Só atualiza `talhao.carenciaAte` e `talhao.ultimoInsumoNome` se `insumo.carenciaDias > 0` **E** (`!talhao.carenciaAte` **OU** `dataFimCarencia > new Date(talhao.carenciaAte)`).

---

<a id="1-2-3-acerto-7-dias"></a>
### 1.2.3. Regra do Acerto a Meia: Prazo de 7 Dias ou Exceção > R$ 10.000,00

No `acerto.service.js`, dentro de `db.transaction()`:
1. Soma `receitas` (colheitas `APROVADA` com `acertoFinanceiroId: null`) e `descontos` (aplicações com `acertoFinanceiroId: null`).
2. Calcula `saldoLiquido = receitas - descontos`, `valorAcerto = saldoLiquido * (talhao.percentualMeeiro / 100)` e `valorProdutor = saldoLiquido - valorAcerto`.
3. Busca o `ultimoAcerto` do talhão e calcula `diasPassados`:
   * Se `diasPassados < 7` **E** `valorAcerto <= 10000` -> **Bloqueia (`400 Bad Request`)** com a mensagem: *"O intervalo mínimo entre acertos é de 7 dias. Acertos antecipados só são permitidos quando o valor ultrapassa R$ 10.000,00."*
   * Se `diasPassados >= 7` **OU** `valorAcerto > 10000` -> **Libera o Acerto!**
