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

Você vai usar dois serviços **gratuitos**: o **Supabase** (banco de dados + login) e a **Vercel** (para publicar o app na internet). Não precisa saber programar.

### Parte 1 — Criar o banco de dados no Supabase

1. Acesse **https://supabase.com** e clique em **Start your project** / **Sign up**. Crie a conta (dá para entrar com o Google/GitHub).
2. Clique em **New project**.
3. Dê um nome (ex.: `lavacar`), crie uma **senha do banco** (guarde essa senha) e escolha a região mais perto de você (ex.: *South America (São Paulo)*). Clique em **Create new project** e espere ~1 minuto.
4. No menu da esquerda, clique em **SQL Editor** (ícone de terminal).
5. Clique em **New query**.
6. Abra o arquivo **`supabase/schema.sql`** deste projeto, **copie todo o conteúdo** e **cole** na caixa de texto.
7. Clique em **Run** (ou aperte Ctrl+Enter). Deve aparecer *Success*. Pronto: as tabelas foram criadas.
8. Agora pegue suas chaves: menu da esquerda → **Project Settings** (engrenagem) → **API** (ou **Data API**). Deixe essa página aberta, você vai precisar de dois valores:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public** key (uma chave longa)

### Parte 2 — Criar um usuário (seu login)

1. No Supabase, menu da esquerda → **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. Digite seu **e-mail** e uma **senha**. Marque para confirmar o e-mail automaticamente se a opção aparecer. Clique em **Create user**.
4. Esse será o e-mail e senha que você usará para entrar no app.

### Parte 3 — Publicar o app na Vercel

1. Coloque este projeto no **GitHub** (se ainda não estiver). Se não souber, na Vercel dá para importar de várias formas — o mais comum é ter o código no GitHub.
2. Acesse **https://vercel.com** e entre com sua conta do GitHub.
3. Clique em **Add New...** → **Project** e **importe** o repositório do LavaCar.
4. Antes de finalizar, abra **Environment Variables** e adicione as **duas** variáveis (use os valores da Parte 1, item 8):
   - Nome: `NEXT_PUBLIC_SUPABASE_URL` — Valor: a **Project URL**
   - Nome: `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Valor: a chave **anon public**
5. Clique em **Deploy** e espere terminar.
6. A Vercel vai te dar um endereço (ex.: `https://lavacar-seu-nome.vercel.app`). Abra no celular, faça **login** com o e-mail e senha da Parte 2. Pronto! 🎉

> Dica: adicione o site à tela inicial do celular (menu do navegador → "Adicionar à tela de início") para abrir como se fosse um aplicativo.

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
# depois abra .env.local e preencha as duas variáveis do Supabase (sem o # na frente)

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
- A senha/URL do Supabase ficam apenas nas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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
  lib/supabase/       conexão com o Supabase
  app/actions/        ações de servidor (salvar/editar/excluir)
supabase/schema.sql   banco de dados (rode no Supabase)
```
