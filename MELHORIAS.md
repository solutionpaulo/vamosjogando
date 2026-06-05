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
