# 2. Documentação Técnica — Front-end (`nezer-app`)

> **O que é este documento e como ele facilita a compreensão do código?**
> Este arquivo concentra toda a arquitetura, fluxos de sessão e lógicas de campo do Front-end (`nezer-app`) em um único documento. Ele segue a hierarquia `2.` Front-end -> `2.1` Arquitetura / `2.2` Lógicas de Campo -> `2.1.1` / `2.2.1` Detalhes de implementação.

---

## Sumário Rápido (Clique para ir direto ao trecho)
- [2. Visão Geral da Estrutura (`nezer-app`)](#2-visao-geral)
- [2.1. Arquitetura Next.js (App Router)](#2-1-arquitetura-nextjs)
  - [2.1.1. Server Components, Server Actions e `useActionState`](#2-1-1-server-components)
  - [2.1.2. Controle de Sessão, Refresh Token e Proteção de Rotas (`proxy.ts`)](#2-1-2-sessao-rotas)
- [2.2. Lógicas de Campo (Mobile-First e Offline)](#2-2-logicas-campo)
  - [2.2.1. Alerta Sanitário Reativo no `<select>` e Termo de Ciência Obrigatório](#2-2-1-alerta-sanitario)
  - [2.2.2. Fila Offline (`localStorage`), Câmera Traseira e GPS](#2-2-2-offline-camera-gps)

---

<a id="2-visao-geral"></a>
## 2. Visão Geral da Estrutura (`nezer-app`)

O `nezer-app` utiliza **Next.js (App Router) + React + TypeScript + Tailwind CSS**, espelhando exatamente a organização da Biblioteca (`jwt-app`), com todas as rotas e Server Actions em português:

```text
nezer-app/
├── actions/                  # Server Actions (login, logout, usuario, cultura, insumo, talhao, aplicacao, colheita, acerto)
├── app/
│   ├── login/page.tsx
│   └── dashboard/
│       ├── page.tsx          # Cards de resumo (Talhões em carência, colheitas pendentes, total partilhado)
│       ├── culturas/         # Culturas e 3 preços (Mercado, Atacado, Polpa) [Admin]
│       ├── insumos/          # Catálogo de insumos e dias de carência [Admin]
│       ├── talhoes/          # Lista com selo VERDE (Liberado) ou VERMELHO (Em carência até DD/MM)
│       ├── meeiros/          # Cadastro e ativação/desativação de meeiros [Admin]
│       ├── aplicacoes/       # Registro de aplicação com câmera traseira e GPS
│       ├── colheitas/        # Registro de colheita + Alerta Sanitário + Conferência do Admin
│       └── acertos/          # Fechamento "Acerto a Meia", comprovante PIX e Demonstrativo de Rateio
├── components/               # Componentes reutilizáveis (ex: LogoutButton.tsx)
├── lib/                      # session.ts, refresh.ts, data.ts, ui.ts
└── proxy.ts                  # Middleware de proteção de rotas por perfil (Admin vs Meeiro)
```

---

<a id="2-1-arquitetura-nextjs"></a>
## 2.1. Arquitetura Next.js (App Router)

<a id="2-1-1-server-components"></a>
### 2.1.1. Server Components, Server Actions e `useActionState`

Cada funcionalidade dentro de `app/dashboard/<modulo>/` separa claramente leitura e escrita:
1. **`page.tsx` (Server Component):** Roda no servidor do Next.js, busca as listas autenticadas no `nezer-api` via `lib/data.ts` e renderiza a tabela na tela.
2. **`<Modulo>Form.tsx` (Client Component `'use client'`):** Recebe as opções auxiliares por props e utiliza o hook `useActionState` conectado a uma *Server Action* da pasta `actions/`:
   * A Server Action envia o `POST`/`PUT`/`PATCH` para o `nezer-api` com o token do cookie, chama `revalidatePath(...)` para atualizar a listagem automaticamente e retorna feedback visual amigável.

<a id="2-1-2-sessao-rotas"></a>
### 2.1.2. Controle de Sessão, Refresh Token e Proteção de Rotas (`proxy.ts`)

* **`lib/session.ts`:** Gerencia os cookies `httpOnly` com `accessToken` e `refreshToken` e extrai os dados da sessão (`id`, `nome`, `identificador`, `perfil`).
* **`lib/refresh.ts`:** Se a API responder `401` por expiração do token de acesso, renova o token automaticamente usando `/v1/auth/refresh` sem deslogar o meeiro no meio do campo.
* **`proxy.ts`:** Bloqueia acesso anônimo a `/dashboard/*`, impede que não-admins (`perfil !== 'ADMIN'`) acessem rotas exclusivas do produtor (`/dashboard/culturas`, `/dashboard/insumos`, `/dashboard/meeiros`) e bloqueia o acesso de `AJUDANTE` à rota financeira (`/dashboard/acertos`).

---

<a id="2-2-logicas-campo"></a>
## 2.2. Lógicas de Campo (Mobile-First e Offline)

<a id="2-2-1-alerta-sanitario"></a>
### 2.2.1. Alerta Sanitário Reativo no `<select>` e Termo de Ciência Obrigatório

Na tela de **Nova Colheita (`/dashboard/colheitas`)**:
1. O primeiro campo do formulário é o `<select>` de **Talhão**. Cada talhão carregado (seja da API ou do cache offline) já possui `carenciaAte` e `ultimoInsumoNome`.
2. Ao selecionar o talhão, o componente verifica imediatamente:
   ```tsx
   const emCarencia =
     talhaoSelecionado?.carenciaAte &&
     new Date(talhaoSelecionado.carenciaAte) > new Date();
   ```
3. Se `emCarencia` for verdadeiro, abre na mesma hora um **Card Vermelho de Alerta Sanitário** mostrando até qual data vai a carência, qual defensivo foi aplicado (`ultimoInsumoNome`) e exigindo a marcação do checkbox obrigatório:
   `[ ] Estou ciente de que este talhão está em período de carência e confirmo o registro desta colheita.`
4. Na tabela do Admin, colheitas registradas nessas condições recebem destaque visual em vermelho (`ALERTA SANITÁRIO`).

<a id="2-2-2-offline-camera-gps"></a>
### 2.2.2. Fila Offline (`localStorage`), Câmera Traseira e GPS

* **Câmera Traseira Nativa:** Os inputs de foto em `AplicacaoForm.tsx` e `ColheitaForm.tsx` usam `accept="image/*" capture="environment" required` para abrir direto a câmera traseira do celular.
* **GPS Automático:** Um `useEffect` aciona `navigator.geolocation.getCurrentPosition` ao abrir o formulário e preenche `latitude` e `longitude` automaticamente.
* **Fila Offline (`localStorage`):** Sempre que há internet, a lista de talhões e insumos é salva no `localStorage`. Se `navigator.onLine === false` na hora do envio, o registro fica salvo na fila local `fila_offline` e um banner no topo permite sincronizar tudo assim que o sinal voltar.
* **Vocabulário Jurídico (Estatuto da Terra):** Todas as telas e impressões usam **"Demonstrativo de Rateio da Parceria (Acerto a Meia)"** e **"Meeiro / Parceiro"** (nunca "Holerite" ou "Salário").
