# Music Analyzer Pro

Análise de áudio profissional no navegador. BPM, Key, espectro de frequências, visualização estilo Melodyne, perfil de mix e muito mais.

## Stack

- **Next.js 15** + React 19
- **Tailwind CSS v4** + shadcn/ui
- Análise 100% client-side (Web Audio API)

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build e produção

```bash
npm run build
npm start
```

> **Nota:** Pare o servidor de desenvolvimento (`Ctrl+C`) antes de rodar o build, para evitar conflitos com a pasta `.next`.

## Deploy na Vercel

### 1. Repositório Git

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/music-export.git
git push -u origin main
```

### 2. Conectar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. **Add New** → **Project**
3. Importe o repositório do GitHub
4. A Vercel detecta Next.js automaticamente
5. Clique em **Deploy**

### Configuração

- **Framework Preset:** Next.js (auto-detectado)
- **Build Command:** `npm run build` (padrão)
- **Output Directory:** `.next` (padrão)
- **Install Command:** `npm install` (padrão)

Não é necessário configurar variáveis de ambiente para o funcionamento básico.

### Domínio

Após o deploy, a Vercel fornece uma URL como `seu-projeto.vercel.app`. Você pode adicionar um domínio customizado nas configurações do projeto.
