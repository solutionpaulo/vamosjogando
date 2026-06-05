# Melhorias - Vamos Jogando

Baseado na análise das skills disponíveis em `E:\Antigravity\skills\`.

---

## ✅ 1. Parse de JSON do Gemini

**Skill:** `llm-structured-output`

O crash do `article.tags || []` mostrou que o JSON do Gemini às vezes vem sem campos esperados. Essa skill ensina a usar `responseSchema` do Google pra garantir que a LLM sempre retorne a estrutura exata que esperamos.

**Feito:** Schema validation implementado em `cron/llm.js` (`buildGeminiSchema`, `buildOpenAiSchema`), `cron/generate-post.js` (`ARTICLE_SCHEMA`) e `cron/generate-review.js` (`REVIEW_SCHEMA`).

---

## ✅ 2. Prompts de Geração de Conteúdo

**Skill:** `llm-application-dev-prompt-optimize`

Os prompts que geram artigos e reviews podem ser otimizados com chain-of-thought, constitutional AI e exemplos few-shot pra melhorar consistência e qualidade.

**Feito:** Prompts reescritos com chain-of-thought, few-shot examples e self-review checklist em `cron/generate-post.js` (`buildPrompt`) e `cron/generate-review.js` (`buildReviewPrompt`).

---

## ✅ 3. Imagens de Herói

**Skills:** `seo-images`, `seo-image-gen`, `image-studio`

A substituição manual de imagens mostrou que o fallback atual (OG tags + Wikipedia) é frágil. Podemos usar o Gemini pra gerar imagens de herói sob medida pra cada artigo, ou melhorar a lógica de busca.

**Feito:** Pipeline de busca aprimorado: Wikipedia PT primeiro → EN → sub-tópicos, `findTopicOverride` com fallback por título, `sharp` para WebP (q80, max 1200×900, validação >5KB).

---

## ✅ 4. SEO do Conteúdo Gerado

**Skills:** `seo-content-writer`, `seo-content`, `seo-meta-optimizer`, `programmatic-seo`

O site é 100% gerado por IA. Podemos garantir que cada artigo siga boas práticas de E-E-A-T, tenha meta descriptions otimizadas, estrutura de headings correta, e que as páginas geradas em escala (categorias, tags) sejam indexáveis sem ser thin content.

**Feito:** OG tags (og:image, og:title, og:description) e Twitter cards em `BaseHead.astro`, `robots.txt`, `sitemap.xml` estático com 425 URLs, canonical URLs, `heroImage` passado ao BaseHead.

---

## ✅ 5. Performance Web

**Skill:** `web-performance-optimization`

Site Astro com muitas imagens e conteúdo dinâmico. Podemos auditar Core Web Vitals (LCP, CLS, INP) e otimizar carregamento de imagens, lazy loading, e bundle JS.

**Feito:** WebP com `sharp` (q80, max 1200×900, `fit: inside`), `loading="lazy"` em PostCard e FeaturedCard, `loading="eager" fetchpriority="high"` no hero do artigo (LCP). Sem JS bundle, CSS mínimo (~10KB).

---

## ✅ 6. Workflows do GitHub Actions

**Skill:** `github-actions-templates`

Os workflows atuais (`auto-publish.yml`, `deploy.yml`) podem ser melhorados com patterns testados: caching de dependências, matrix builds, validação de qualidade.

**Feito:** Concurrency groups, timeouts (15min publish, 10min deploy), shallow clones (`fetch-depth: 1`), `defaults.shell: bash`, `workflow_dispatch` inputs, `conventional commits` nas mensagens, scheduling fix (separação news/review por `github.event.schedule`).

---

## ✅ 7. Integração com Gemini API

**Skill:** `gemini-api-integration`

Cobre boas práticas de produção: rate limiting, retry com backoff, streaming, function calling. O código atual em `cron/llm.js` pode se beneficiar.

**Feito:** `isTransientError` para classificar erros (rate limit, timeout, 5xx, rede), `callWithRetry` com exponential backoff + jitter (3 retries, 1s→2s→4s base), `RateLimiter` com intervalo mínimo de 500ms entre chamadas, `AbortSignal.timeout` de 60s, e integração com os clients Gemini e Groq.

---

## ✅ 8. Promoção nas Redes Sociais

**Skill:** `social-post-writer-seo`

Cada artigo gerado poderia ter um post correspondente pra Instagram/LinkedIn/Facebook gerado automaticamente.

**Feito:** `cron/social-promote.js` gera posts curtos (X/Twitter), médios (LinkedIn/Facebook) e hashtags via LLM, salvos em `src/content/social/`. Publicação real desativada (`PUBLISH_ENABLED = false`) com stubs prontos para Twitter, LinkedIn e Facebook. Integrado ao `auto-publish.yml` como passo pós-geração. Script: `npm run social`.

---

## ✅ 9. Analytics

**Skill:** `analytics-tracking`

Sem medição não dá pra saber se o site está tendo tração. Implementar um sistema de analytics (Google Analytics, Plausible, ou similar).

**Feito:** Componente GA4 em `src/components/BaseHead.astro` com script condicional (`ANALYTICS_ID` vindo de `PUBLIC_GA_ID` env var). Sem env var configurado, nada é injetado (opt-in).

---

## ✅ 10. Commits Padronizados

**Skill:** `commit`

Os commits atuais são descritivos mas sem formato padrão. Adotar conventional commits facilita gerar changelog e rastrear mudanças.

**Feito:** Padrão adotado e documentado abaixo.

### Formato

```
tipo(escopo): descrição curta (máx 72 chars)

Corpo opcional com detalhes.
```

### Tipos usados no projeto

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade (artigo, review, script, componente) |
| `fix` | Correção de bug ou problema |
| `docs` | Documentação (MELHORIAS.md, README, etc.) |
| `refactor` | Mudança interna sem alterar comportamento |
| `perf` | Otimização de performance |
| `ci` | Workflows, deploy, GitHub Actions |

### Exemplos

```
feat(content): artigo sobre Summer Game Fest gerado via IA
feat(review): review do Logitech G Pro X Superlight 2
fix(deploy): gerar sitemap no build ao invés de arquivo estático
ci: adicionar concurrency groups aos workflows
docs(MELHORIAS): marcar itens 1-5 como concluídos
```

---

## ✅ 11. PWA / Service Worker

**Feito:** `public/manifest.json` com icons SVG + PNG (192/512), `public/sw.js` com cache-first para assets estáticos e network-first para páginas, `icon-192.png` e `icon-512.png` gerados do favicon via sharp, registro do SW em `BaseHead.astro`.

---

## ✅ 12. Tempo de Leitura

**Feito:** `src/utils/readingTime.js` (contagem de palavras / 200 wpm), exibido em `PostCard.astro`, `FeaturedCard.astro` e `BlogPost.astro` (passado via `[slug].astro`).

---

## ✅ 13. Dark/Light Mode

**Feito:** `ThemeToggle.astro` (ícone sol/lua), `data-theme="light"` com CSS variables completas em `global.css`, persistência em `localStorage` com fallback para `prefers-color-scheme`. Header e cards adaptados com `--text-heading` e `--text-card-title`.

---

## ✅ 14. Open Graph Images Dinâmicas

**Feito:** `cron/generate-og.js` — gera SVG com gradiente + título do artigo (word wrap em 42 chars), converte para WebP 1200×630 via sharp (q85). Integrado ao `generate-post.js` e `generate-review.js`; `ogImage` no frontmatter é priorizado sobre `heroImage` no `BaseHead.astro`.

---

## 15. Busca Full-Text com Pagefind

**Ideia:** Integrar [Pagefind](https://pagefind.app) para busca offline ultra-rápida no site. Muito superior à busca atual.

**Ação:** Adicionar `npx pagefind` ao build, substituir `src/pages/search.astro` para usar a API do Pagefind.

---

## 16. Paginação

**Ideia:** `/blog/page/2/`, `/blog/page/3/` etc. Com 426 artigos crescendo 4/dia, a página inicial de blog já está pesada.

**Ação:** Criar rotas dinâmicas `[page].astro` em `src/pages/blog/`, ajustar `getStaticPaths` para paginar os posts.

---

## 17. Notificações de Publicação

**Ideia:** Enviar notificação quando um novo artigo for gerado — bot do Telegram, webhook Discord, ou e-mail.

**Ação:** Script `cron/notify.js` chamado após geração no workflow, enviando título + link para webhook configurado via env var.

---

## 18. Comentários com Giscus

**Ideia:** Integrar [giscus](https://giscus.app) — sistema de comentários baseado em GitHub Discussions. Gratuito, sem banco de dados.

**Ação:** Criar `src/components/Giscus.astro`, adicionar no final do `BlogPost.astro`. Configurar repositório e categorias no GitHub.

---

## 19. Score de Qualidade

**Ideia:** Avaliar o artigo gerado por IA antes de publicar — legibilidade (Flesch), densidade de SEO, tom consistente.

**Ação:** Script `cron/assess-quality.js` que analisa o texto gerado e atribui nota. Abaixo do threshold, rejeita e tenta gerar novamente com feedback no prompt.```
