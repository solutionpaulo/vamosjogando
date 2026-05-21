# Vamos Jogando - Relatório Completo

> Data: 21 de Maio de 2026
> Projeto: Blog Autônomo de Notícias de Games

---

## 1. Resumo do Projeto

O **Vamos Jogando** é um portal de notícias sobre videogames completamente autossuficiente e gratuito. Utiliza **Astro 6** para build estático ultra-rápido, **GitHub Pages** para hospedagem gratuita e **GitHub Actions + API Gemini (Google)** para buscar e redigir novos artigos diariamente de forma autônoma.

### Tecnologias
- **Astro 6.3.6** — Framework web estático
- **TypeScript** — Tipagem segura
- **Google Gemini API** — Geração de artigos por IA
- **RSS Parser** — Coleta de feeds de notícias
- **GitHub Actions** — CI/CD e automação
- **GitHub Pages** — Hospedagem gratuita
- **Google AdSense** — Monetização (infraestrutura pronta)

---

## 2. O que foi Feito na Refatoração

### 2.1 Arquitetura
| Antes | Depois |
|-------|--------|
| Header/Footer/BaseHead repetido em toda página | `BaseLayout.astro` centralizado |
| CSS inline duplicado | Componentes extraídos (`PostCard`, `FeaturedCard`, `HeroSection`) |
| Estilos de artigo inline no layout | `prose.css` separado |
| Tudo em páginas monolíticas | Componentes reutilizáveis |

### 2.2 Novas Features
- **Busca client-side** (`/search`) — busca instantânea por título, descrição e tags
- **Filtro por tags** (`/blog/tag/[tag]`) — páginas dinâmicas para cada tag
- **Artigos relacionados** no final de cada post (baseado em tags compartilhadas)
- **JSON-LD** estruturado para SEO (Schema.org NewsArticle)
- **Página 404** personalizada com tema neon
- **Tags visíveis** nos artigos, com links para filtro
- **Imagens reais** nas notícias (og:image baixada automaticamente)
- **Google AdSense** (auto-ads + slots manuais)

### 2.3 Melhorias de Código
- **Slug corrigido** para Astro 6: `post.id` em vez de `post.slug`
- **`utils/posts.ts`** — funções utilitárias centralizadas (`getAllPosts`, `getAllTags`, `getRelatedPosts`, etc.)
- **6 feeds RSS** (antes 3): Eurogamer.pt, GameBlast, Combo Infinito, Adrenaline, Meu PS4, The Enemy
- **Geração de múltiplos artigos** por execução (até 2)
- **Prompt do Gemini** mais robusto e estruturado
- **Modo MOCK** para testes locais sem API Key
- **Variáveis CSS** organizadas, classes utilitárias (`glass-panel`, `badge`, `text-gradient`)
- **Header + Footer** visíveis dentro dos artigos também
- **SITE_BASE** (`/vamosjogando`) em todos os links para GitHub Pages

### 2.4 Páginas Geradas (40 no total)
```
/ (index.html)
/404.html
/about/index.html
/blog/index.html
/blog/brasil-quer-mais-carinho-da-xbox/index.html
/blog/remake-de-splinter-cell-nao-aparece-em-relatorio-da-ubisoft/index.html
/blog/state-of-play-sera-transmitido-nos-cinemas-e-da-ultima-vez-que-isso-aconteceu/index.html
/blog/uncharted-colecao-legado-dos-ladroes-ganha-imagem-para-o-hub-do-ps5/index.html
/blog/virtua-fighter-crossroads-aparece-em-video-vazado-e-empolga-fas/index.html
/blog/warhammer-40000-mechanicus-ii-chega-hoje-or-controle-legioes-nekron-e-lidere-os-adeptus-mechanicus/index.html
/blog/xbox-game-pass-jamais-tera-plano-familiar/index.html
/blog/xbox-libera-5-jogos-para-jogar-de-graca-neste-fim-de-semana-confira/index.html
/blog/destiny-2-vai-ganhar-sua-ultima-atualizacao-em-junho/index.html
/blog/flipper-revela-aparelho-portatil-para-hacking-e-tinkering-com-sistema-linux-integrado/index.html
/blog/tag/brasil/index.html
/blog/tag/comunidade-gamer/index.html
/blog/tag/desenvolvimento-de-jogos/index.html
/blog/tag/ea/index.html
/blog/tag/estratgia/index.html
/blog/tag/eventos/index.html
/blog/tag/free-play-days/index.html
/blog/tag/game-pass/index.html
/blog/tag/jogos-grtis/index.html
/blog/tag/jogos-de-luta/index.html
/blog/tag/lanamento/index.html
/blog/tag/lanamentos/index.html
/blog/tag/microsoft/index.html
/blog/tag/naughty-dog/index.html
/blog/tag/playstation/index.html
/blog/tag/ps5/index.html
/blog/tag/remake/index.html
/blog/tag/sega/index.html
/blog/tag/servios-de-assinatura/index.html
/blog/tag/splinter-cell/index.html
/blog/tag/state-of-play/index.html
/blog/tag/ttico/index.html
/blog/tag/ubisoft/index.html
/blog/tag/uncharted/index.html
/blog/tag/virtua-fighter/index.html
/blog/tag/warhammer-40000/index.html
/blog/tag/xbox/index.html
/search/index.html
/rss.xml
```

### 2.5 Estrutura de Arquivos
```
.vscode/
.github/workflows/
  deploy.yml              # Deploy para GitHub Pages
  auto-publish.yml        # Geração automática de artigos (cron)
cron/
  feeds.js                # Fontes RSS (6 portais)
  generate-post.js        # Geração de artigos via Gemini + download de imagens
src/
  adsense.ts              # ID do Google AdSense (configurar depois)
  assets/
    fonts/                # Fontes Atkinson
    blog-placeholder-*.jpg
    *.jpg                 # Imagens baixadas dos artigos
  components/
    AdScript.astro        # Script auto-ads do AdSense
    AdSlot.astro          # Componente de slot de anúncio manual
    BaseHead.astro        # Meta tags, OG, Twitter Card
    FeaturedCard.astro    # Card de post em destaque
    Footer.astro          # Rodapé
    FormattedDate.astro   # Formatação de data
    Header.astro          # Cabeçalho com navegação
    HeaderLink.astro      # Link de navegação com active state
    HeroSection.astro     # Seção hero da home
    PostCard.astro        # Card de post reutilizável
    TagBadge.astro        # Badge de tag com link
  content/
    blog/                 # Posts em Markdown
  layouts/
    BaseLayout.astro      # Layout base (header + main + footer)
    BlogPost.astro        # Layout de artigo
  pages/
    404.astro             # Página não encontrada
    about.astro           # Sobre o projeto
    blog/
      [slug].astro        # Página de post individual
      index.astro         # Feed de notícias
      tag/[tag].astro     # Filtro por tag
    index.astro           # Home page
    rss.xml.js            # Feed RSS
    search.astro          # Busca client-side
  styles/
    global.css            # Estilos globais + design system
    prose.css             # Estilos tipográficos para artigos
  utils/
    posts.ts              # Funções utilitárias (posts, tags, relacionados)
  consts.ts               # Constantes do site (SITE_TITLE, SITE_BASE, etc.)
  content.config.js       # Configuração de coleção de conteúdo
  env.d.ts                # Declaração de tipos
package.json              # Dependências e scripts
astro.config.mjs          # Configuração Astro (site, base, legacy)
tsconfig.json             # Configuração TypeScript
.gitignore                # Arquivos ignorados pelo git
RELATORIO-COMPLETO.md     # Este arquivo
```

---

## 3. Passo a Passo para Publicar no GitHub Pages

### 3.1 Pré-requisitos
- Conta no [GitHub](https://github.com)
- Git instalado localmente
- Node.js >= 22.12.0

### 3.2 Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `vamosjogando`
3. Deixe como **Público** (necessário para GitHub Pages gratuito)
4. **Não** inicializar com README, .gitignore ou license
5. Clique em **Create repository**

### 3.3 Enviar o Código para o GitHub
```bash
git init
git add .
git commit -m "Vamos Jogando v2 — Blog autônomo de games"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/vamosjogando.git
git push -u origin main
```

### 3.4 Configurar Permissões do GitHub Actions
1. No repositório, vá em **Settings** ⚙️ > **Actions** > **General**
2. Em **Workflow permissions**, selecione **Read and write permissions**
3. Clique em **Save**

### 3.5 Configurar Chave da API Gemini
1. Acesse [Google AI Studio](https://aistudio.google.com/) e crie uma **API Key** gratuita
2. No repositório: **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. **Name:** `GEMINI_API_KEY`
5. **Secret:** Cole sua chave
6. Clique em **Add secret**

### 3.6 Ativar o GitHub Pages
1. **Settings** > **Pages**
2. Em **Build and deployment** > **Source**, selecione **GitHub Actions**
3. Pronto! O deploy será automático

### 3.7 Verificar o Deploy
- Aba **Actions** > workflow "Deploy to GitHub Pages"
- Site publicado em: `https://SEU-USUARIO.github.io/vamosjogando/`

### 3.8 Agendamento Automático
O workflow `auto-publish.yml` executa:
- **09:00 UTC** (06:00 Brasília)
- **18:00 UTC** (15:00 Brasília)

Para executar manualmente: **Actions** > **Auto Publish AI Article** > **Run workflow**

---

## 4. Como Configurar o Google AdSense

### 4.1 Criar Conta no AdSense
1. Acesse https://adsense.google.com e crie uma conta
2. Siga o processo de aprovação do Google
3. Após aprovado, obtenha seu **ID do publisher** (formato `ca-pub-XXXXXXXXXXXXXXX`)

### 4.2 Configurar no Projeto
Edite o arquivo `src/adsense.ts` e cole seu ID:

```ts
export const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXX';
```

### 4.3 Como Funciona
- **Auto-ads**: O Google insere anúncios automaticamente nas páginas (entre parágrafos, no fim dos artigos, etc.)
- **Slots manuais** (opcional): Use `<AdSlot slot="1234567890" />` em qualquer lugar das páginas

### 4.4 Verificar
1. Faça o deploy
2. Aguarde alguns minutos
3. Acesse o site e veja se os anúncios aparecem

---

## 5. Comandos Úteis (Desenvolvimento Local)

```bash
npm install              # Instalar dependências
npm run dev              # Servidor local em http://localhost:4321
npm run build            # Compilar para produção em /dist
npm run preview          # Visualizar build de produção
npm run generate         # Gerar artigo via IA (requer GEMINI_API_KEY)
npm run generate:mock    # Gerar artigo MOCK (teste local sem API)
```

---

## 6. Fluxo de Automação

```
[Cron no GitHub Actions] (2x ao dia: 09:00 e 18:00 UTC)
          |
          v
[Script Node.js] -> Busca feeds RSS (6 portais)
          |
          v
[Validação] -> Filtra notícias já publicadas
          |
          v
[API do Gemini] -> IA escreve artigo em Markdown (PT-BR)
          |
          v
[Download] -> Baixa og:image da notícia original
          |
          v
[Git Commit] -> Commita .md + imagem no repositório
          |
          v
[Pages Deploy] -> Build Astro + publica site atualizado
```

---

## 7. Design System

- **Tema escuro**: Fundo `#08090d` com efeitos neon
- **Cores primárias**: Roxo (`#8b5cf6`) e Ciano (`#06b6d4`)
- **Glassmorphism**: Cards com backdrop-filter blur
- **Tipografia**: Outfit (títulos) + Plus Jakarta Sans (corpo)
- **Glass panel**: `.glass-panel` com glow hover
- **Tags**: `.badge` com cores variantes
- **Scrollbar**: Customizada com roxo neon
- **Radial gradients**: Sutis no fundo para profundidade

---

## 8. Histórico da Conversa — Sessão 1 (Refatoração Inicial)

### Início
Usuário solicitou refatoração completa do blog Vamos Jogando (Astro 6 + Gemini AI) e publicação em serviço gratuito.

### Fases
1. **Análise**: Leitura de todos os arquivos do projeto
2. **Planejamento**: Todo list com 8 itens
3. **Componentes base**: BaseLayout, PostCard, FeaturedCard, HeroSection, TagBadge
4. **CSS**: Separação em global.css + prose.css
5. **Páginas novas**: 404, busca client-side, filtro por tags
6. **Melhorias**: JSON-LD SEO, artigos relacionados, 6 feeds RSS
7. **Build**: Resolução de problemas Astro 6

### Problemas e Soluções
| Problema | Solução |
|----------|---------|
| Content collection vazia | `legacy.collectionsBackwardsCompat: true` |
| `post.slug` undefined | Usar `post.id` (API Astro 6) |
| Tag route encoding | `slugifyTag()` com hífens |
| `[...slug]` conflito com index | Renomeado para `[slug]` |
| Sitemap crash | Removido temporariamente |
| content.config.ts não compilava | Convertido para `.js` |
| Links sem `/vamosjogando/` | `SITE_BASE` em todos os href |
| Menu não destacava ativo no deploy | `import.meta.env.BASE_URL` no HeaderLink |

---

## 9. Histórico da Conversa — Sessão 2 (Ajustes e Melhorias)

### Correções de Links
- Hardcoded `href="/blog"` na página de tag → `href={SITE_BASE + '/blog'}`
- Build limpo com todos os links prefixados

### Remoção de Posts Mock/Teste
- Removidos: `first-post`, `second-post`, `third-post`, `markdown-style-guide`, `using-mdx`, `produtora-de-detroit` (MOCK)
- Build passou de 33 para 24 páginas

### Imagens nas Notícias
- `fetchOgImage(url)`: Extrai `og:image` do HTML da notícia original
- `downloadImage(url, slug)`: Baixa imagem para `src/assets/{slug}.{ext}`
- Fallback para placeholder se falhar

### Correção de YAML no Frontmatter
- Gemini gerava descrições com aspas simples (`'`) dentro de strings com aspas simples
- `escapeYAML()` usa `''` (YAML válido) em vez de `\'` (inválido)
- Workflow `auto-publish.yml` agora commita `src/assets/` também

### JSON Inválido do Gemini
- `cleanJSON()` remove ```json fences, trailing commas e caracteres de controle
- Retry automático com 2 tentativas se JSON for inválido
- Prompt mais rigoroso na segunda tentativa

### Header e Footer nos Posts
- `BlogPost.astro` agora inclui `<Header />` e `<Footer />`

### Google AdSense
- `adsense.ts` — constante com o ID do publisher
- `AdScript.astro` — script de auto-ads no `<head>`
- `AdSlot.astro` — componente para slots manuais

---

## 10. Notas Técnicas

### Astro 6.3.6 Especificidades
- Content config em `src/content.config.js` (não `.ts`)
- Entradas usam `entry.id` em vez de `entry.slug`
- Necessário `legacy.collectionsBackwardsCompat: true`
- `base: '/vamosjogando'` + `site: 'https://solutionpaulo.github.io'`

### API Gemini
- Modelo: `gemini-2.5-flash`
- `responseMimeType: 'application/json'`
- `cleanJSON()` + retry para lidar com JSON mal formatado
- Modo MOCK automático sem API Key

### GitHub Actions
- `deploy.yml`: Build + deploy para GitHub Pages
- `auto-publish.yml`: Geração de artigos + commit (.md + assets)
- Permissão `contents: write` necessária
- Node 22 (compatível com Astro 6.3.6)

### Feeds RSS (6 portais)
1. Eurogamer.pt
2. GameBlast
3. Combo Infinito
4. Adrenaline
5. Meu PS4
6. The Enemy

### SITE_BASE
- `import.meta.env.BASE_URL` = `/vamosjogando/`
- Constante `SITE_BASE` = `/vamosjogando` (sem trailing slash)
- Usar `SITE_BASE + '/caminho'` em todos os href
- HeaderLink usa `import.meta.env.BASE_URL` para active state
