# LavaCar 🚗💧

App simples para **controlar o caixa do seu lava-rápido** pelo celular. Registre cada lavagem em 2 toques, anote despesas e fiados, e veja no fim do dia (e do mês) **quanto entrou, quanto saiu e quanto sobrou**.

- Feito para usar no celular (mas funciona no computador também).
- Tudo em português, com botões grandes e linguagem simples.
- Cada lava-rápido tem seus próprios dados, protegidos e separados (multi-empresa).

---

## O que dá para fazer

- **Início (painel):** saldo de hoje, entradas, saídas, lavagens do dia, resumo do mês e um gráfico dos últimos 14 dias.
- **Nova lavagem:** escolhe o serviço, a forma de pagamento e pronto. Já entra no caixa automaticamente.
- **Nova despesa:** anota o que gastou (produtos, água/luz, aluguel, etc.).
- **Fiado:** registrou uma lavagem que o cliente vai pagar depois? Marque como "fiado". Quando ele pagar, é só apertar **Receber**.
- **Caixa:** lista de todas as movimentações por dia, com filtro por período.
- **Relatórios:** mês a mês, com lucro, gráficos por categoria, por forma de pagamento e os serviços que mais venderam.
- **Ajustes:** muda o nome do lava-rápido e edita seus serviços e categorias.

---

## Como colocar no ar (passo a passo)

Você vai usar dois serviços **gratuitos**: o **Supabase** (banco de dados) e a **Vercel** (para publicar o app na internet). Não precisa saber programar.

> ⚠️ **Atenção — o app já vem no "modo sem login"** (`MODO_SEM_LOGIN=true`). Isso significa que **qualquer pessoa com o link acessa os seus dados**, sem pedir e-mail ou senha. É ótimo para uso próprio de **um único lava-rápido**. Se um dia você quiser **vender o app para outros lava-rápidos**, basta **desligar o modo sem login** (remova a variável `MODO_SEM_LOGIN` ou deixe-a diferente de `true`): o app volta a **exigir conta** e a separar os dados de cada empresa.

### Parte 1 — Criar seu banco grátis do zero (Supabase)

Se você **ainda não tem** um projeto no Supabase, faça assim:

1. Acesse **https://supabase.com** e clique em **Start your project** / **Sign up**. Crie a conta (dá para entrar com o Google/GitHub).
2. Clique em **New project**.
3. Preencha:
   - **Name (nome):** algo como `lavacar`.
   - **Database Password (senha do banco):** crie uma senha forte e **guarde**.
   - **Region (região):** escolha *South America (São Paulo)* (mais perto = mais rápido).
4. Clique em **Create new project** e espere ~1 minuto até o projeto ficar pronto.
5. No menu da esquerda, clique em **SQL Editor** (ícone de terminal) → **New query**.
6. Abra o arquivo **`supabase/schema.sql`** deste projeto, **copie todo o conteúdo** e **cole** na caixa de texto.
7. Clique em **Run** (ou aperte Ctrl+Enter). Deve aparecer *Success*. Pronto: as tabelas foram criadas.
8. Agora pegue suas chaves: menu da esquerda → **Project Settings** (engrenagem) → **API**. Deixe essa página aberta — você vai precisar de **três** valores:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public** key (uma chave longa — pode ficar no navegador)
   - **service_role** key (na seção *Project API keys*; é **secreta**, usada só no servidor — **nunca** exponha no navegador)

### Parte 2 — Publicar o app na Vercel

1. Coloque este projeto no **GitHub** (se ainda não estiver). Na Vercel dá para importar de várias formas — o mais comum é ter o código no GitHub.
2. Acesse **https://vercel.com** e entre com sua conta do GitHub.
3. Clique em **Add New...** → **Project** e **importe** o repositório do LavaCar.
4. Antes de finalizar, abra **Environment Variables** e adicione as **quatro** variáveis (use os valores da Parte 1, item 8):
   - Nome: `NEXT_PUBLIC_SUPABASE_URL` — Valor: a **Project URL**
   - Nome: `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Valor: a chave **anon public**
   - Nome: `SUPABASE_SERVICE_ROLE_KEY` — Valor: a chave **service_role** (secreta)
   - Nome: `MODO_SEM_LOGIN` — Valor: `true`
5. Clique em **Deploy** e espere terminar.
6. A Vercel vai te dar um endereço (ex.: `https://lavacar-seu-nome.vercel.app`). Abra no celular: o app entra **direto**, sem tela de login, e pede o **nome do seu lava-rápido** no primeiro acesso. Pronto! 🎉

> Dica: adicione o site à tela inicial do celular (menu do navegador → "Adicionar à tela de início") para abrir como se fosse um aplicativo.

### E quando eu quiser vender para outros lava-rápidos?

O caminho de login continua pronto no código. Para reativá-lo:

1. Na Vercel, em **Environment Variables**, **remova** `MODO_SEM_LOGIN` (ou troque o valor para algo diferente de `true`) e faça um novo **Deploy**.
2. Crie o(s) usuário(s) em **Supabase → Authentication → Users → Add user** (e-mail + senha).
3. A partir daí o app volta a pedir **login**, e cada empresa só enxerga os próprios dados (protegido por **RLS**).

---

## Como usar no dia a dia

### Primeiro acesso (uma vez só)
Ao entrar pela primeira vez, o app pede o **nome do seu lava-rápido**. Digite e confirme. Ele já cria alguns **serviços** (Lavagem Simples, Completa, com Cera...) e **categorias** de despesa para você. Você pode mudar tudo depois em **Ajustes**.

### Registrar uma lavagem
1. Aperte o botão redondo **+** no meio da barra de baixo (ou **Nova ação**).
2. Toque em **Nova lavagem**.
3. Escolha o **serviço** (ex.: Lavagem Completa R$ 50).
4. Escolha a **forma de pagamento** (Dinheiro, Pix, Débito ou Crédito).
5. Aperte **Registrar R$ 50,00**. Pronto — já entrou no caixa.

> Precisa de detalhes? Toque em **mais detalhes** para mudar o valor, colocar o nome do cliente, a placa ou marcar como **fiado**.

### Registrar uma despesa
1. Aperte **+** → **Nova despesa**.
2. Digite o **valor**, uma **descrição** e escolha a **categoria** (ex.: Produtos de limpeza).
3. Aperte **Salvar despesa**.

### Receber um fiado
1. Vá em **Início** e toque em ver **lavagens**, ou entre pela seção de lavagens.
2. As lavagens **fiadas (pendentes)** aparecem em destaque.
3. Quando o cliente pagar, aperte **Receber**. O valor entra no caixa na hora.

### Ver relatórios
1. Toque em **Relatórios** na barra de baixo.
2. Use as setas **‹ ›** para trocar de mês.
3. Veja o **lucro** do mês, gráficos por categoria de despesa, por forma de pagamento e os **serviços que mais venderam**.

---

## Rodar no seu computador (opcional, para testar antes)

Precisa ter o **Node.js 18+** instalado.

```bash
# 1. instalar as dependências
npm install

# 2. criar o arquivo de variáveis
cp .env.example .env.local
# depois abra .env.local e preencha as variáveis do Supabase.
# No modo sem login (padrão), preencha: NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY e MODO_SEM_LOGIN=true.

# 3. rodar
npm run dev
```

Abra **http://localhost:3000** no navegador.

---

## Ficha técnica (para quem entende de tecnologia)

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (tema escuro, estética "glass")
- **Supabase** (Auth + Postgres com **RLS** em todas as tabelas)
- Gráficos com **Recharts**, animações com **Framer Motion**, avisos com **Sonner**, ícones **Lucide**
- Todas as tabelas usam o prefixo `lc_` e são criadas de forma **idempotente** por `supabase/schema.sql`
- **Variáveis de ambiente:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secreta, só servidor) e `MODO_SEM_LOGIN`

### Modo sem login (uso pessoal, single-empresa)

Controlado pela função central `modoSemLogin()` em `src/lib/modo.ts`, que lê `MODO_SEM_LOGIN`.

- **`MODO_SEM_LOGIN=true`** (padrão atual): o app **não exige login**. Todo o acesso a dados no servidor passa a usar um client **admin** (`src/lib/supabase/admin.ts`, com a `service_role`, que **bypassa o RLS**). Vira **single-empresa**: `getEmpresaDoUsuario()` retorna a **primeira empresa** criada (papel `dono`); sem nenhuma, cai no onboarding. Autorização é feita em código (o registro tem de pertencer à empresa única). O schema **não muda**.
- **Sem a variável (ou ≠ `true`):** caminho **autenticado** original — Supabase Auth + RLS, multi-empresa via `lc_membros`. Middleware, layout e onboarding voltam a exigir sessão.

> ⚠️ No modo sem login **não há isolamento por usuário**: quem tiver o link vê os dados. Use só para o seu próprio lava-rápido. Para vender a clientes, desligue `MODO_SEM_LOGIN`.

### Estrutura de pastas
```
src/
  app/
    (app)/            painel, caixa, lavagens, relatorios, ajustes (área logada)
    login/            tela de entrada
    onboarding/       primeiro acesso (cria a empresa)
    layout.tsx        layout raiz
    globals.css       tema e estilos
  components/lavacar/ telas e modais do app
  components/ui/      componentes reutilizáveis (modal, etc.)
  lib/lavacar/        tipos, formatação e consultas
  lib/supabase/       conexão com o Supabase (server, client, middleware, admin)
  lib/modo.ts         modoSemLogin() — liga/desliga o modo sem login
  app/actions/        ações de servidor (salvar/editar/excluir)
supabase/schema.sql   banco de dados (rode no Supabase)
```
