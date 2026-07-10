# Vamos Jogando - Blog Autônomo de Notícias de Games

Portal de notícias sobre videogames completamente autossuficiente. Usa **Astro** para carregamento rápido, **GitHub Pages** para hospedagem gratuita e **GitHub Actions** + **Gemini (Google)** para buscar e redigir novos artigos diariamente.

---

## Automação

```
[Cron no GitHub Actions] (4x notícias + 1x review por dia)
          │
          ▼
[Script Node.js] ──► Busca feeds RSS (8 fontes)
          │
          ▼
[Validação] ───────► Filtra notícias já publicadas
          │
          ▼
[LLM (Gemini / Groq)] ──► IA escreve artigo + gera imagem de herói
          │                    (retry com backoff, fallback entre providers)
          ▼
[Geração Social] ───► Cria posts para redes sociais (desativado por padrão)
          │
          ▼
[Git Commit] ──────► Commita .md + imagem .webp no repositório
          │
          ▼
[Build + Sitemap] ──► Astro build + geração automática de sitemap.xml
          │
          ▼
[Pages Deploy] ────► Publica o site atualizado
```

---

## Passo a Passo para Colocar o Site no Ar

### 1. Criar um Repositório no GitHub
1. Crie um repositório público chamado `vamosjogando`.
2. Execute no terminal:
```bash
git init
git add .
git commit -m "initial commit: Vamos Jogando blog"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/vamosjogando.git
git push -u origin main
```

### 2. Configurar Permissões do GitHub Actions
**Settings → Actions → General → Workflow permissions → Read and write permissions → Save**

### 3. Obter e Configurar a Chave de API do Gemini
1. Crie uma API Key no [Google AI Studio](https://aistudio.google.com/).
2. **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `GEMINI_API_KEY`, Secret: (sua chave)

### 4. (Opcional) Chave do Groq como Fallback
Mesmo caminho, criar secret `GROQ_API_KEY` — quando Gemini falha, tenta Groq automaticamente.

### 5. Ativar o GitHub Pages
**Settings → Pages → Build and deployment → Source → GitHub Actions**

### 6. (Opcional) Ativar Analytics
Criar variável de ambiente (não secret) `PUBLIC_GA_ID=G-XXXXXXXXXX` em **Settings → Secrets and variables → Actions → Variables**.

---

## Comandos

| Comando | Descrição |
| :--- | :--- |
| `npm install` | Instala dependências |
| `npm run dev` | Servidor local em `http://localhost:4321` |
| `npm run build` | Build de produção + sitemap automático |
| `npm run preview` | Preview do build local |
| `npm run generate` | Gera artigo de notícia via IA |
| `npm run review` | Gera review de hardware via IA |
| `npm run social` | Gera posts para redes sociais do último artigo |

---

## Funcionalidades

### Geração de Conteúdo
- **8 feeds RSS** (Eurogamer.pt, GameBlast, Combo Infinito, Adrenaline, Meu PS4, The Enemy, Canaltech, TecMundo)
- **2 tipos de conteúdo**: notícias (4x/dia) e reviews de hardware (1x/dia)
- **LLM com fallback**: Gemini 2.5 Flash (primário) → Groq/Llama (fallback automático)
- **responseSchema**: validação tipada do JSON retornado pela IA (garante campos obrigatórios)
- **Prompts otimizados**: chain-of-thought, few-shot examples, self-review checklist
- **Retry + backoff**: até 3 retries com espera exponencial (1s → 2s → 4s + jitter)
- **Rate limiting**: 500ms mínimo entre chamadas de API
- **Timeout**: 60s por requisição, com AbortSignal

### Imagens
- **Busca inteligente**: Wikipedia PT → EN → sub-tópicos, fallback por palavras do título
- **Conversão automática**: WebP via sharp (qualidade 80, max 1200×900, fit inside)
- **Validação**: imagens < 5KB são rejeitadas (placeholder)
- **OG dinâmicas**: generate-og.js gera imagem 1200×630 com gradiente + título via sharp, integrado ao pipeline de geração

### SEO
- **OG tags**: og:image, og:title, og:description, Twitter cards em todas as páginas
- **OG image dinâmica**: imagem personalizada com gradiente e título do artigo, gerada via sharp (SVG → WebP q85)
- **Sitemap dinâmico**: gerado a cada build a partir dos HTMLs do dist/
- **Sitemap dinâmico**: gerado a cada build a partir dos HTMLs do dist/
- **robots.txt**: permite toda indexação
- **Canonical URLs**: evita conteúdo duplicado
- **Structured data**: JSON-LD (NewsArticle schema)

### Performance
- **Zero JS bundle**: site 100% estático (sem JavaScript de framework)
- **CSS mínimo**: ~10KB total
- **Lazy loading**: imagens em cards carregam sob demanda
- **fetchpriority**: hero image do artigo usa "high" (LCP)
- **Imagens WebP**: formato moderno com compressão eficiente
- **Tempo de leitura**: exibe "X min de leitura" nos cards e artigos (200 palavras/min)

### PWA
- **manifest.json**: nome, ícones SVG + PNG (192/512), theme-color, display standalone
- **Service Worker**: cache-first para assets (CSS/JS/fonts/imagens), network-first para páginas
- **Offline**: navegação básica funciona mesmo sem conexão

### Analytics
- **GA4 integrado**: condicional via env var `PUBLIC_GA_ID`
- **Opt-in**: desligado por padrão, ativa automaticamente se a variável existir

### Redes Sociais
- **Geração automática**: texto curto (X/Twitter) + médio (LinkedIn/Facebook) + hashtags
- **Salvo em src/content/social/**: para revisão antes de publicar
- **Stubs de publicação**: Twitter, LinkedIn e Facebook (desativado, `PUBLISH_ENABLED = false`)

### CI/CD
- **Concurrency groups**: evita execuções sobrepostas
- **Timeouts**: 15min para geração, 10min para build/deploy
- **Shallow clones**: fetch-depth: 1 para checkouts rápidos
- **Workflow dispatch**: inputs para escolher notícia, review ou ambos

---

## Sistema de Afiliados (Amazon + Mercado Livre)

Pronto mas desligado por padrão (`AFFILIATE_ENABLED = false`).

### Como ativar
1. Inscreva-se nos programas: [Amazon Associates](https://associados.amazon.com.br) e [Mercado Livre](https://programa-afiliados.mercadolivre.com.br)
2. Edite `src/affiliates.ts` e `cron/generate-post.js` / `cron/generate-review.js`:
   ```js
   const AFFILIATE_ENABLED = true;
   const AMAZON_TAG = 'seu-tag-20';
   const MERCADOLIVRE_ID = 'seu_id';
   ```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Sim | Chave da API Google Gemini |
| `GROQ_API_KEY` | Não | Fallback via Groq/Llama |
| `PUBLIC_GA_ID` | Não | ID do Google Analytics 4 (ex: G-XXXXXXXXXX) |

Secrets no GitHub: **Settings → Secrets and variables → Actions → Secrets**
Variáveis: **Settings → Secrets and variables → Actions → Variables**

---

## Design System

- **Tema escuro**: fundo cinza azulado/carbono (padrão)
- **Tema claro**: fundo cinza claro com texto escuro — alternável via toggle no header
- **Acentos neon**: glow e gradientes em Ciano (`#06b6d4`) e Roxo (`#8b5cf6`)
- **Glassmorphism**: elementos com backdrop-filter blur
- **Tipografia**: Outfit (títulos) + Plus Jakarta Sans (corpo) via Google Fonts
- **Theme toggle**: botão sol/lua no header, persiste em localStorage, respeita `prefers-color-scheme`

---

## Domínio Personalizado (GitHub Pages)

Para usar um domínio próprio (ex: `www.vamosjogando.com.br`) no lugar de `solutionpaulo.github.io/vamosjogando`:

### 1. Configurar DNS (provedor do domínio)

| Tipo | Nome | Valor |
|---|---|---|
| `CNAME` | `www` | `solutionpaulo.github.io` |

Para domínio **apex** (`vamosjogando.com.br` sem www), crie 4 registros **A**:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
E um **CNAME** de `www` → `solutionpaulo.github.io`.

### 2. Configurar GitHub

1. **Settings** do repositório → **Pages**
2. Em **Custom domain**, digite `www.vamosjogando.com.br` e salve
3. Marque **Enforce HTTPS** (após propagação do DNS)

### 3. Alterar no código (após DNS propagar)

**`astro.config.mjs`:**
```js
site: 'https://www.vamosjogando.com.br',
base: '/',        // ou remova a linha
```

**`src/consts.ts`:**
```ts
export const SITE_BASE = '';
```

Se houver URLs fixas em RSS ou sitemap, atualize também para `https://www.vamosjogando.com.br`.

---

## Padrão de Commits

```
tipo(escopo): descrição (max 72 chars)

tipos: feat | fix | docs | refactor | perf | ci
```

Exemplos:
- `feat(content): artigo sobre Summer Game Fest`
- `feat(ci): adicionar concurrency groups`
- `fix(deploy): gerar sitemap no build`
- `docs(MELHORIAS): marcar itens como concluídos`