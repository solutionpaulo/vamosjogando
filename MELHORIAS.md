# Melhorias - Vamos Jogando

Baseado na análise das skills disponíveis em `E:\Antigravity\skills\`.

---

## 1. Parse de JSON do Gemini

**Skill:** `llm-structured-output`

O crash do `article.tags || []` mostrou que o JSON do Gemini às vezes vem sem campos esperados. Essa skill ensina a usar `responseSchema` do Google pra garantir que a LLM sempre retorne a estrutura exata que esperamos.

**Ação:** Aplicar schema validation tipado no `generate-post.js` e `generate-review.js` usando a API de `responseSchema` do `@google/genai`.

---

## 2. Prompts de Geração de Conteúdo

**Skill:** `llm-application-dev-prompt-optimize`

Os prompts que geram artigos e reviews podem ser otimizados com chain-of-thought, constitutional AI e exemplos few-shot pra melhorar consistência e qualidade.

**Ação:** Revisar e otimizar os prompts em `cron/generate-post.js` e `cron/generate-review.js`.

---

## 3. Imagens de Herói

**Skills:** `seo-images`, `seo-image-gen`, `image-studio`

A substituição manual de imagens mostrou que o fallback atual (OG tags + Wikipedia) é frágil. Podemos usar o Gemini pra gerar imagens de herói sob medida pra cada artigo, ou melhorar a lógica de busca.

**Ação:** Integrar geração de imagens por IA no pipeline de criação de posts, ou melhorar o `fetchOgImage`/`fetchWikipediaImage` com busca semântica via Gemini.

---

## 4. SEO do Conteúdo Gerado

**Skills:** `seo-content-writer`, `seo-content`, `seo-meta-optimizer`, `programmatic-seo`

O site é 100% gerado por IA. Podemos garantir que cada artigo siga boas práticas de E-E-A-T, tenha meta descriptions otimizadas, estrutura de headings correta, e que as páginas geradas em escala (categorias, tags) sejam indexáveis sem ser thin content.

**Ação:** Adicionar validação de qualidade SEO pós-geração e instruções de estrutura nos prompts.

---

## 5. Performance Web

**Skill:** `web-performance-optimization`

Site Astro com muitas imagens e conteúdo dinâmico. Podemos auditar Core Web Vitals (LCP, CLS, INP) e otimizar carregamento de imagens, lazy loading, e bundle JS.

**Ação:** Rodar auditoria Lighthouse e implementar otimizações.

---

## 6. Workflows do GitHub Actions

**Skill:** `github-actions-templates`

Os workflows atuais (`auto-publish.yml`, `deploy.yml`) podem ser melhorados com patterns testados: caching de dependências, matrix builds, validação de qualidade.

**Ação:** Revisar e otimizar os workflows.

---

## 7. Integração com Gemini API

**Skill:** `gemini-api-integration`

Cobre boas práticas de produção: rate limiting, retry com backoff, streaming, function calling. O código atual em `cron/llm.js` pode se beneficiar.

**Ação:** Revisar `cron/llm.js` à luz das práticas recomendadas.

---

## 8. Promoção nas Redes Sociais

**Skill:** `social-post-writer-seo`

Cada artigo gerado poderia ter um post correspondente pra Instagram/LinkedIn/Facebook gerado automaticamente.

**Ação:** Criar um script `cron/social-promote.js` que gera posts de divulgação.

---

## 9. Analytics

**Skill:** `analytics-tracking`

Sem medição não dá pra saber se o site está tendo tração. Implementar um sistema de analytics (Google Analytics, Plausible, ou similar).

**Ação:** Adicionar tracking ao site Astro.

---

## 10. Commits Padronizados

**Skill:** `commit`

Os commits atuais são descritivos mas sem formato padrão. Adotar conventional commits facilita gerar changelog e rastrear mudanças.

**Ação:** Seguir padrão `tipo(escopo): descrição` nos commits.
