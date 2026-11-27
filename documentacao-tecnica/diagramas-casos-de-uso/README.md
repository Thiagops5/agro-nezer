# 4. Diagramas de Casos de Uso (UML)

> **O que é esta pasta e como ela facilita a compreensão do código?**
> Esta pasta foi reservada para guardar a imagem do **Diagrama de Casos de Uso** do Nezer Agro. O Diagrama de Casos de Uso mostra visualmente quais ações pertencem ao **Produtor/Admin (`perfil = 'ADMIN'`)**, ao **Meeiro Responsável (`perfil = 'MEEIRO'`)** e ao **Meeiro Ajudante (`perfil = 'AJUDANTE'`)**, servindo de guia direto para os middlewares de permissão nas rotas do Back-end.

---

## 🖼️ Como fazer o upload da sua imagem aqui

Quando finalizar o diagrama, salve a imagem **dentro desta pasta** (`documentacao-tecnica/diagramas-casos-de-uso/`) com o nome **`diagrama-casos-de-uso.png`**. Ela aparecerá automaticamente abaixo:

![Diagrama de Casos de Uso - Nezer Agro](./diagrama-casos-de-uso.png)

---

## 📋 Guia Rápido dos Atores e Casos de Uso para o seu Desenho

* **Ator 1:** Produtor Rural / Administrador (`perfil = 'ADMIN'`)
* **Ator 2:** Meeiro / Parceiro Responsável (`perfil = 'MEEIRO'`)
* **Ator 3:** Meeiro Ajudante (`perfil = 'AJUDANTE'`) — *herda os registros de campo do Meeiro, mas sem acesso ao financeiro*

| ID | Caso de Uso | Ator(es) | Relação UML Sugerida |
| :---: | :--- | :--- | :--- |
| **UC01** | Autenticar no Sistema (Login por CPF ou E-mail) | Todos | `<<extend>>` Trocar Senha no 1º Acesso (`mustChangePassword`) |
| **UC02** | Gerenciar Usuários (Cadastrar / Arquivar / Reativar) | Produtor | — |
| **UC03** | Gerenciar Culturas e Preços (Mercado, Atacado, Polpa) | Produtor | — |
| **UC04** | Gerenciar Insumos, Estoque (`ativo`) e Dias de Carência | Produtor | — |
| **UC05** | Gerenciar Talhões, Ajudantes e Desvinculação | Produtor | `<<include>>` Consultar Status de Carência |
| **UC06** | Registrar Aplicação (1+ Insumos) com Foto e GPS | Todos | `<<include>>` Atualizar Carência do Talhão |
| **UC07** | Registrar Colheita por Destino com Foto e GPS | Todos | `<<extend>>` Aceitar Termo de Ciência *(se em carência)* |
| **UC08** | Conferir e Aprovar/Ajustar/Rejeitar Colheita | Produtor | — |
| **UC09** | Gerar Acerto a Meia e Anexar Comprovante PIX | Produtor | `<<include>>` Validar Regra 7 Dias ou > R$ 10.000 |
| **UC10** | Consultar Demonstrativo de Rateio da Parceria | Meeiro e Produtor | — |
| **UC11** | Registrar Praga com Foto e Pedir/Liberar Insumo | Todos | `<<extend>>` Cadastrar Insumo Pedido (Admin) |
| **UC12** | Consultar Central de Notificações | Todos | — |
