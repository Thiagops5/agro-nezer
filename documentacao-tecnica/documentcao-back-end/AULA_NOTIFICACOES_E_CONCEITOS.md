# 🎓 Aula Sênior: Dominando o Módulo `notificacao/` e os Próximos Conceitos do Back-end

> **Como usar este guia:**
> Este arquivo foi escrito como uma conversa direta de **Sênior para Júnior**, usando exemplos reais do dia a dia da fazenda para gravar na sua mente cada peça do `notificacao/` — e já te preparar para o que vem pela frente em `aplicacao/`, `colheita/`, `acerto/` e upload de imagens.

---

## 1. A Parábola do Correio da Fazenda (Por que não existe `POST /notificacoes`?)

Imagine uma fazenda grande.  
Se um meeiro quisesse avisar o dono que colheu 50 caixas de goiaba, ele **não** sai andando até a sala dos Correios para escrever uma carta dizendo *"Oi, eu mesmo estou mandando uma carta de notificação"*.

Na prática:
* Ele vai direto ao **Balcão de Colheitas** (`POST /v1/colheitas`) e entrega as 50 caixas + a foto.
* O **próprio funcionário do Balcão** (`colheita.service.js`), assim que anota as caixas no caderno, pega um bilhete interno (`notificacaoService.notificarAdmins(...)`) e coloca na caixa de entrada do dono!

**Tradução para o código:**
1. O Front-end (celular) bate em **UMA única rota**: `POST /v1/colheitas`.
2. Por isso, o `notificacao.router.js` **NÃO tem rota `POST`** — porque quem fabrica notificações são os outros serviços por dentro do servidor (`colheita`, `aplicacao`, `ocorrencia`, `acerto`, `insumo`).
3. O usuário só usa o router de notificações para **ler a caixa de entrada dele** (`GET /`) e **marcar os bilhetes como lidos** (`PATCH /:id/lida` e `PATCH /ler-todas`).

---

## 2. Dissecando o `notificar` Linha por Linha

Olhe para a assinatura da função que está no seu `notificacao.service.js`:

```javascript
notificar: async (
    { usuarioId, tipo, titulo, mensagem, referenciaTipo = null, referenciaId = null, dadosExtras = null },
    transaction = null
) => {
    return await Notificacao.create(
        { usuarioId, tipo, titulo, mensagem, referenciaTipo, referenciaId, dadosExtras },
        transaction ? { transaction } : {}
    );
}
```

### 2.1. Por que tem chaves `{ ... }` dentro dos parênteses `( { usuarioId, tipo, ... } )`?
Isso se chama **Desestruturação de Objeto**.

Imagine a diferença entre entregar **7 caixas soltas na mão de alguém** vs. entregar **1 caixote fechado com etiquetas**:
* **Sem chaves** `notificar(usuarioId, tipo, titulo, mensagem, ...)`: você seria obrigado a lembrar a **ordem exata** dos 7 parâmetros! Se trocasse o `titulo` com a `mensagem`, o sistema salvava tudo invertido.
* **Com chaves `{ ... }`**: você passa **um único objeto** com os nomes etiquetados! Pode passar em qualquer ordem que o JavaScript encaixa cada etiqueta no lugar certo:
  ```javascript
  await notificacaoService.notificar({
      titulo: 'Colheita Aprovada!',
      usuarioId: 3,
      tipo: 'COLHEITA_APROVADA',
      mensagem: 'Suas 40 caixas foram conferidas.'
  });
  ```

### 2.2. O que significa `= null` (ex: `referenciaTipo = null`)?
É um **valor padrão de segurança** (se não me derem nada, eu assumo `null` — vazio).
* Nem toda notificação precisa de `dadosExtras`. Por exemplo, *"Seu acerto foi pago!"* não tem `{ antes, depois }`.
* Colocando `= null`, quem chama o `notificar` **não é obrigado** a preencher `dadosExtras` quando não precisar!

### 2.3. Para que servem `referenciaTipo`, `referenciaId` e `dadosExtras`?
Pense no WhatsApp ou no Instagram: quando você recebe *"João comentou na sua foto"*, você **clica no aviso** e o app abre direto naquela foto, certo?
* **`referenciaTipo`** (`'COLHEITA'`, `'ACERTO'`, `'OCORRENCIA'`, `'INSUMO'`) diz **em qual tela** o Front-end deve abrir.
* **`referenciaId`** (ex: `15`) diz **qual é o ID** do item que deve abrir lá dentro.
* **`dadosExtras`** (`DataTypes.JSON`) é uma "bolsa flexível" para guardar informações extras só daquele caso — por exemplo, quando o Admin ajusta a quantidade de caixas na conferência, você manda `{ antes: 40, depois: 38 }`, e o celular mostra os dois números bonitinhos na tela de notificação!

### 2.4. O que é `transaction ? { transaction } : {}`?
É um **if de uma linha só** (Operador Ternário):
* **Pergunta:** *"Quem me chamou me passou uma `transaction` (um pacote Tudo ou Nada)?"*
* **Se SIM (`?`)**: passa `{ transaction }` para o `Notificacao.create(...)` entrar no mesmo pacote.
* **Se NÃO (`:`)**: passa `{}` (objeto vazio) e salva a notificação normalmente sozinha.

---

## 3. O `for` no `notificarAdmins` (A Parábola do Alto-falante vs. Bilhete Individual)

```javascript
const admins = await Usuario.findAll({
    where: { perfil: 'ADMIN', ativo: true },
    attributes: ['id'],
    transaction: transaction || undefined
});

for (const admin of admins) {
    await notificacaoService.notificar(
        { usuarioId: admin.id, tipo, titulo, mensagem, referenciaTipo, referenciaId, dadosExtras },
        transaction
    );
}
```

* `Usuario.findAll(...)` vai ao banco e traz uma **lista (Array)** com todos os donos/administradores ativos da fazenda. Ex: `[ { id: 1 }, { id: 4 } ]`.
* O **`for (const admin of admins)`** pega um por um dessa lista:
  1. Na 1ª volta, `admin` vale `{ id: 1 }` -> cria uma notificação na caixa do Usuário `1`.
  2. Na 2ª volta, `admin` vale `{ id: 4 }` -> cria uma notificação na caixa do Usuário `4`.
* **Por que criar 1 notificação por Admin?** Porque se o Admin `1` abrir o app e clicar em *"Marcar como lida"*, a notificação do Admin `4` continua **não lida** até ele ver também! Cada pessoa tem o seu próprio controle de `lida: true/false`.

---

## 4. A Ordem "De Trás para Frente" no `update` (`marcarTodasComoLidas`)

```javascript
await Notificacao.update(
    { lida: true },                        // 1º: O QUE eu quero mudar
    { where: { usuarioId, lida: false } }  // 2º: EM QUEM eu quero mudar
);
```

Pense assim para nunca mais esquecer:
> *"Troque o pneu para **novo** (`{ lida: true }`), **apenas nos carros que** (`where`) são do João (`usuarioId`) e ainda estão com pneu **careca** (`lida: false`)."*

E por que no **`marcarComoLida(id, usuarioId)`** nós buscamos `{ where: { id, usuarioId } }` com os **dois** campos juntos?
* Para impedir que um meeiro espertinho mande `PATCH /v1/notificacoes/99/lida` e marque como lida uma notificação que era do Admin! Se a notificação `99` não for daquele `usuarioId`, o `findOne` retorna `null` e devolve **`404 Not Found`**.

---

## 5. O Que Vem Pela Frente (Prepare a Mente Agora!)

Nos próximos módulos (`aplicacao/`, `colheita/`, `acerto/`, `ocorrencia/`), você vai encontrar **3 conceitos novos** que são o coração de um sistema profissional:

### 5.1. `const t = await db.transaction()` (O Pacote "Tudo ou Nada")
Você vai usar isso em **`aplicacao`**, **`acerto`** e **`insumo`**.
Imagine carregar 3 caixas de vidro numa bandeja: se a 2ª cair, você **não** entrega só a 1ª e finge que deu tudo certo — você para tudo e volta do zero.
```javascript
const t = await db.transaction(); // Abre o pacote
try {
    // Passo 1: Cria a aplicacao passando { transaction: t }
    // Passo 2: Subtrai o estoque do insumo passando { transaction: t }
    // Passo 3: Atualiza a carenciaAte do talhao passando { transaction: t }

    await t.commit(); // Tudo deu certo! Grava tudo de uma vez no banco.
} catch (error) {
    await t.rollback(); // Deu erro em qualquer passo! Desfaz TUDO que foi feito acima.
    throw error;
}
```
> **Regra de ouro:** Toda operação dentro de uma transação precisa receber `{ transaction: t }`! Se esquecer de passar `{ transaction: t }` em um dos passos, aquele passo fica fora do pacote e não é desfeito no `rollback()`.

### 5.2. `Multer` + `Sharp` + Nuvem (Como funcionam as fotos no Back-end)
Até aqui todas as requisições eram **JSON puro** (`express.json()`).
Mas quando o meeiro tira uma foto da caixa de goiaba ou da praga, o navegador não manda JSON — ele manda **`multipart/form-data`** (um envelope com texto + arquivo binário da foto!).
1. O **`Multer`** é o middleware que abre esse envelope, pega o arquivo da foto e coloca em `req.file` (e os textos continuam em `req.body`).
2. O **`Sharp`** pega a foto gigante do celular (`8 MB`), redimensiona para `1280px` e converte para **`.webp` (`~100 KB`)** antes de salvar no disco (`uploads/`) ou enviar para o **Cloudflare R2**!
3. No banco de dados (SQLite/PostgreSQL), você **NUNCA salva a foto dentro da tabela** — você salva apenas o **texto do caminho/link** (`urlFoto: '/uploads/colheita-123.webp'` ou `https://...r2.dev/...`).

### 5.3. O Poder do `req.usuario` + Filtro de Segurança em Tudo
Assim como fizemos em `talhao/` e `notificacao/`:
* Em `aplicacao/` e `colheita/`, o **`usuarioId`** de quem registrou **NUNCA vem do `req.body`** (o usuário poderia mentir!). Ele vem sempre do token **`req.usuario.id`**.
* E antes de salvar uma aplicação ou colheita em um `talhaoId`, sempre validamos se o meeiro ou ajudante realmente tem permissão naquele talhão!
