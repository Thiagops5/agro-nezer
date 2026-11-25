# 🌱 Nezer Agro — Gestão de Parcerias Agrícolas ("Acerto a Meia") e Rastreabilidade Sanitária

Repositório oficial do MVP desenvolvido como **Trabalho de Conclusão de Curso (TCC)**. O **Nezer Agro** digitaliza o caderno de campo e automatiza o rateio financeiro de parcerias agrícolas regidas pelo **Estatuto da Terra (Lei nº 4.504/1964)** — nascido da vivência real na produção de **Goiaba, Tomate e Quiabo**, com arquitetura flexível para qualquer cultura agrícola (fruticultura, hortaliças, grãos como soja/milho e tubérculos como batata/mandioca).

---

## 📚 Documentação Técnica (`documentacao-tecnica/`)

Toda a documentação do projeto foi organizada de forma compacta em **1 arquivo principal por camada** (seguindo a hierarquia `1.` -> `1.1` -> `1.1.1` dentro de cada documento):

* 🖥️ **[1. Documentação Técnica do Back-end (`nezer-api`)](./documentacao-tecnica/documentcao-back-end/DOCUMENTACAO_BACKEND.md)**
  * *Arquitetura em camadas, lógica da tabela `Talhao` (`percentualMeeiro`, `carenciaAte`, `ultimoInsumoNome`, `area`), bloqueio `409 Conflict` com usuário vinculado, prevalência de carência, custo congelado e regra dos 7 dias ou > R$ 10.000,00.*
* 📱 **[2. Documentação Técnica do Front-end (`nezer-app`)](./documentacao-tecnica/documentacao-front-end/DOCUMENTACAO_FRONTEND.md)**
  * *Next.js App Router (`Server Components` + `Server Actions`), sessão/refresh token, Alerta Sanitário reativo com Termo de Ciência, câmera traseira, GPS e fila offline no `localStorage`.*
* 📋 **[3. Engenharia de Requisitos (RF, RNF e RN)](./documentacao-tecnica/requisitos/REQUISITOS.md)**
  * *Requisitos Funcionais, Não Funcionais e Regras de Negócio no padrão acadêmico do TCC.*
* 🎭 **[4. Diagramas de Casos de Uso (Pasta para Upload da Imagem UML)](./documentacao-tecnica/diagramas-casos-de-uso/README.md)**
  * *Pasta reservada para salvar `diagrama-casos-de-uso.png` junto com a especificação de atores e casos de uso.*
* 🗄️ **[5. Arquitetura de Dados (DER), Rotas da API e Glossário](./documentacao-tecnica/arquitetura-e-extras/ARQUITETURA_E_EXTRAS.md)**
  * *Diagrama DER em Mermaid, catálogo completo de rotas `/v1/*`, diagrama de sequência e glossário agronômico/jurídico.*
* 🎨 **[6. Design, Identidade Visual, Marca e Guia de Componentes](./documentacao-tecnica/design-e-marca/DESIGN_E_MARCA.md)**
  * *Brief oficial do Agro Nezer, guia rápido da marca (Verde Nezer / Goiaba, DM Sans), aplicações (app, site e caixas), guia de componentes, notificações e telas conceituais iniciais.*

---

## 🗂️ Estrutura do Monorepo

```text
nezer/
├── documentacao-tecnica/
│   ├── documentcao-back-end/DOCUMENTACAO_BACKEND.md
│   ├── documentacao-front-end/DOCUMENTACAO_FRONTEND.md
│   ├── requisitos/REQUISITOS.md
│   ├── diagramas-casos-de-uso/README.md
│   ├── arquitetura-e-extras/ARQUITETURA_E_EXTRAS.md
│   └── design-e-marca/DESIGN_E_MARCA.md
├── nezer-api/                # Back-end REST API (Node.js, Express, Sequelize, SQLite, JWT, Multer)
├── nezer-app/                # Front-end Web Mobile-First (Next.js App Router, TypeScript, Tailwind)
└── README.md
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Back-end (`nezer-api`)
```bash
cd nezer-api
npm install
npm start
```

### 2. Front-end (`nezer-app`)
```bash
cd nezer-app
npm install
npm run dev
```
