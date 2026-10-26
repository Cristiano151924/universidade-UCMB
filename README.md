# Universidade UCMB

Plataforma de ensino a distância (EAD) para colaboradores de uma empresa. As aulas ficam no YouTube (vídeos não listados); o site controla **quem assiste, quanto assistiu e se aprendeu**.

## O que ela faz

**Gestor**
- Cria o usuário e a senha de cada colaborador (a senha é gerada na hora e aparece uma única vez, com botão para copiar a mensagem pronta).
- Redefine senha e desativa/reativa acessos.
- Painel geral: progresso, aulas concluídas, nota média, reprovações e último acesso de cada colaborador.
- Detalhe por colaborador: % assistido e notas de cada tentativa, aula por aula.

**Colaborador**
- Entra com **usuário e senha** (sem e-mail).
- Assiste às aulas dentro do site. O sistema conta **só os segundos realmente assistidos**; pular trechos não conta.
- As aulas abrem **em sequência**: a próxima só libera depois de concluir a anterior.
- O quiz aparece depois de assistir **90%** da aula. São **3 tentativas**, cada uma com 3 perguntas **diferentes** (9 por aula). Aprova com 2 acertos. Quem gasta as 3 tentativas segue adiante, e o gestor vê a reprovação.

## Tecnologias

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (banco, login) · API do player do YouTube · Vercel (hospedagem).

## Teste rápido, sem configurar nada (modo demonstração)

Usa um banco fictício na memória, só para ver o visual. Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
```

Crie um arquivo chamado `.env.local` com esta linha:

```
DEMO_MODE=true
```

```bash
npm run dev
```

Abra http://localhost:3000. Na tela de login há botões para entrar como gestor ou como colaborador (contas `gestor` e `aluno.demo`, senha `demo1234`). Os dados voltam ao início quando o site reinicia. O modo demonstração só funciona com `npm run dev` e nunca liga junto com um Supabase configurado.

## Instalação de verdade

### 1. Criar o banco (Supabase)

1. Crie uma conta e um projeto grátis em [supabase.com](https://supabase.com).
2. No projeto, abra **SQL Editor > New query**, cole o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) e clique em **Run**. Isso cria as tabelas, as regras de segurança e a pasta privada de PDFs.
3. Em **Project Settings > API Keys**, copie o endereço do projeto (URL), a chave pública (publishable/anon) e a chave secreta (secret/service_role).

### 2. Configurar o site

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
LOGIN_DOMAIN=ucmb.local
```

> **A chave secreta tem poder total sobre o banco.** Nunca a publique, nunca a coloque em código e nunca a compartilhe. O `.env.local` já está no `.gitignore`.

### 3. Criar o primeiro gestor

```bash
npm install
npm run criar-gestor
```

O script pergunta o usuário, o nome e a senha do gestor.

### 4. Cadastrar as aulas

As aulas ficam em arquivos `content/*.json` (um por módulo). Veja o exemplo em [`content/modulo-inicial.json`](content/modulo-inicial.json). Cada aula tem o ID do vídeo do YouTube, a duração em segundos e, opcionalmente, as 9 perguntas (3 conjuntos de 3). O formato completo está no topo de [`scripts/import-content.mjs`](scripts/import-content.mjs).

```bash
npm run importar-conteudo
```

Pode rodar de novo sempre que editar os arquivos: o que já existe é atualizado.

### 5. Rodar

```bash
npm run dev
```

Entre em http://localhost:3000/login com o usuário gestor, cadastre os colaboradores em **Colaboradores** e entregue o usuário e a senha a cada um.

### 6. Publicar (Vercel)

1. Importe este repositório na [Vercel](https://vercel.com).
2. Em **Settings > Environment Variables**, cadastre as mesmas 4 variáveis do `.env.local`. **Não** cadastre `DEMO_MODE`.
3. Faça o deploy.

## Como funciona o login por usuário

O Supabase exige um e-mail, então o site monta um e-mail interno a partir do usuário (`joao.silva` vira `joao.silva@ucmb.local`). O colaborador nunca vê isso, e nenhum e-mail é enviado.

## Estrutura

```
app/            telas (login, aluno, gestor) e ações do servidor
components/     player do YouTube, quiz, cabeçalho
lib/            regras do curso (lib/learning.ts), acesso aos dados (lib/repo), login
content/        módulos, aulas e perguntas (JSON)
supabase/       SQL de criação do banco
scripts/        criar-gestor e importar-conteudo
proxy.ts        renova o login e protege as áreas
```

As regras do curso (90% para o quiz, 3 tentativas, 2 acertos para aprovar) ficam no topo de [`lib/learning.ts`](lib/learning.ts).

## Limites conhecidos

- Só conta o que é assistido **dentro** do site; abrir o vídeo direto no YouTube não conta.
- O envio de PDFs de apoio por aula ainda não está implementado (a tela do gestor é um espaço reservado).
