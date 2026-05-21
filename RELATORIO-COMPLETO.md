# Vamos Jogando - Relatório Completo de Refatoração

> Data: 21 de Maio de 2026
> Projeto: Blog Autônomo de Notícias de Games

---

## 1. Resumo do Projeto

O **Vamos Jogando** é um portal de notícias sobre videogames completamente autossuficiente e gratuito. Utiliza **Astro 6** para build estático ultra-rápido, **GitHub Pages** para hospedagem gratuita e **GitHub Actions + API Gemini (Google)** para buscar e redigir novos artigos diariamente de forma autônoma.

### Tecnologias
- **Astro 6.3.6** - Framework web estático
- **TypeScript** - Tipagem segura
- **Google Gemini API** - Geração de artigos por IA
- **RSS Parser** - Coleta de feeds de notícias
- **GitHub Actions** - CI/CD e automação
- **GitHub Pages** - Hospedagem gratuita

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
- **Busca client-side** (`/search`) - busca instantânea por título, descrição e tags
- **Filtro por tags** (`/blog/tag/[tag]`) - páginas dinâmicas para cada tag
- **Artigos relacionados** no final de cada post (baseado em tags compartilhadas)
- **JSON-LD** estruturado para SEO (Schema.org NewsArticle)
- **Página 404** personalizada com tema neon
- **Tags visíveis** nos artigos, com links para filtro

### 2.3 Melhorias de Código
- **Slug corrigido** para Astro 6: `post.id` em vez de `post.slug`
- **`utils/posts.ts`** - funções utilitárias centralizadas (`getAllPosts`, `getAllTags`, `getRelatedPosts`, etc.)
- **6 feeds RSS** (antes 3): Eurogamer.pt, GameBlast, Combo Infinito, Adrenaline, Meu PS4, The Enemy
- **Geração de múltiplos artigos** por execução (até 2)
- **Prompt do Gemini** mais robusto e estruturado
- **Modo MOCK** para testes locais sem API Key
- **Variáveis CSS** organizadas, classes utilitárias (`glass-panel`, `badge`, `text-gradient`)

### 2.4 Páginas Geradas (23 no total)
```
/ (index.html)
/404.html
/about/index.html
/blog/index.html
/blog/brasil-quer-mais-carinho-da-xbox/index.html
/blog/first-post/index.html
/blog/markdown-style-guide/index.html
/blog/produtora-de-detroit-encerra-jogo-multiplayer/index.html
/blog/second-post/index.html
/blog/third-post/index.html
/blog/using-mdx/index.html
/blog/xbox-game-pass-jamais-tera-plano-familiar/index.html
/blog/tag/brasil/index.html
/blog/tag/comunidade-gamer/index.html
/blog/tag/ea/index.html
/blog/tag/eurogamerpt/index.html
/blog/tag/game-pass/index.html
/blog/tag/games/index.html
/blog/tag/microsoft/index.html
/blog/tag/novidades/index.html
/blog/tag/servios-de-assinatura/index.html
/blog/tag/xbox/index.html
/search/index.html
/rss.xml
```

### 2.5 Estrutura de Arquivos (Após Refatoração)
```
.vscode/
.github/workflows/
  deploy.yml              # Deploy para GitHub Pages
  auto-publish.yml        # Geração automática de artigos (cron)
cron/
  feeds.js                # Fontes RSS
  generate-post.js        # Geração de artigos via Gemini
src/
  assets/
    fonts/                # Fontes Atkinson
    blog-placeholder-*.jpg
  components/
    BaseHead.astro        # Meta tags, OG, Twitter Card
    FeaturedCard.astro    # Card de post em destaque
    Footer.astro          # Rodapé
    FormattedDate.astro   # Formatação de data
    Header.astro          # Cabeçalho com navegação + busca
    HeaderLink.astro      # Link de navegação
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
  consts.ts               # Constantes do site
  content.config.js       # Configuração de coleção de conteúdo
  env.d.ts                # Declaração de tipos
package.json              # Dependências e scripts
astro.config.mjs          # Configuração Astro
tsconfig.json             # Configuração TypeScript
.gitignore                # Arquivos ignorados pelo git
```

---

## 3. Passo a Passo para Publicar no GitHub Pages (Gratuito)

### 3.1 Pré-requisitos
- Conta no [GitHub](https://github.com)
- Git instalado localmente
- Node.js >= 20

### 3.2 Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `vamosjogando`
3. Deixe como **Público** (necessário para GitHub Pages gratuito)
4. **Não** inicializar com README, .gitignore ou license
5. Clique em **Create repository**

### 3.3 Enviar o Código para o GitHub
Abra o terminal na pasta do projeto e execute:

```bash
git init
git add .
git commit -m "Refatoracao completa Vamos Jogando v2"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/vamosjogando.git
git push -u origin main
```

**Atenção:** Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub.

### 3.4 Configurar Permissões do GitHub Actions
Para que o robô de IA possa salvar novos posts no repositório:

1. No repositório do GitHub, vá em **Settings** ⚙️
2. Na barra lateral esquerda, clique em **Actions** > **General**
3. Role até **Workflow permissions**
4. Selecione **Read and write permissions**
5. Clique em **Save**

### 3.5 Obter e Configurar a Chave de API do Gemini
O script precisa da chave do Gemini para escrever os artigos:

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Crie uma **API Key** gratuita
3. No repositório do GitHub, vá em **Settings** > **Secrets and variables** > **Actions**
4. Clique em **New repository secret**
5. **Name:** `GEMINI_API_KEY`
6. **Secret:** Cole sua chave de API
7. Clique em **Add secret**

### 3.6 Ativar o GitHub Pages
1. No repositório, vá em **Settings** > **Pages**
2. Em **Build and deployment** > **Source**, selecione **GitHub Actions**
3. Pronto! O deploy será feito automaticamente

### 3.7 Verificar o Deploy
1. Vá até a aba **Actions** do repositório
2. Veja o workflow "Deploy to GitHub Pages" em execução
3. Após alguns minutos, o site estará disponível em:
   `https://SEU-USUARIO.github.io/vamosjogando/`

### 3.8 Agendamento Automático
O workflow `auto-publish.yml` executa automaticamente:
- **09:00 UTC** (06:00 Brasília)
- **18:00 UTC** (15:00 Brasília)

Para executar manualmente:
1. Aba **Actions** > **Auto Publish AI Article**
2. Botão **Run workflow** > **Run workflow**

---

## 4. Comandos Úteis (Desenvolvimento Local)

```bash
npm install              # Instalar dependências
npm run dev              # Servidor local em http://localhost:4321
npm run build            # Compilar para produção em /dist
npm run preview          # Visualizar build de produção
npm run generate         # Gerar artigo via IA (requer GEMINI_API_KEY)
npm run generate:mock    # Gerar artigo MOCK (teste local sem API)
```

---

## 5. Fluxo de Automação

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
[Git Commit] -> Commita o arquivo .md no repositório
          |
          v
[Pages Deploy] -> Aciona build e publica site atualizado
```

---

## 6. Design System

- **Tema escuro**: Fundo `#08090d` com efeitos neon
- **Cores primárias**: Roxo (`#8b5cf6`) e Ciano (`#06b6d4`)
- **Glassmorphism**: Cards com backdrop-filter blur
- **Tipografia**: Outfit (títulos) + Plus Jakarta Sans (corpo)
- **Glass panel**: `.glass-panel` com glow hover
- **Tags**: `.badge` com cores variantes
- **Scrollbar**: Customizada com roxo neon
- **Radial gradients**: Sutis no fundo para profundidade

---

## 7. Histórico da Conversa (Sessão de Refatoração)

### Início
- Usuário solicitou: "leia o projeto VamosJogando que esta na minha pasta Antigravity. refaca ele de uma melhor maneira e preciso que ele fique publicado num servico gratuito."
- Exploração completa do projeto existente (Astro 6 blog com Gemini AI, RSS feeds, GitHub Pages)

### Fases da Refatoração
1. **Análise**: Leitura de todos os arquivos do projeto (pacotes, páginas, componentes, cron jobs, workflows)
2. **Planejamento**: Criação de todo list com 8 itens
3. **Componentes base**: BaseLayout, PostCard, FeaturedCard, HeroSection, TagBadge
4. **CSS**: Separação em global.css + prose.css, variáveis organizadas
5. **Páginas novas**: 404, busca client-side, filtro por tags
6. **Melhorias**: JSON-LD SEO, artigos relacionados, 6 feeds RSS, multi-artigos
7. **Build**: Resolução de problemas com:
   - Astro 6 content config (migração para JS)
   - `legacy.collectionsBackwardsCompat`
   - `post.slug` -> `post.id` (mudança de API no Astro 6)
   - Tag routing encoding
   - Sitemap integration error
8. **Resultado final**: Build limpo com 23 páginas em 3.2s

### Problemas Enfrentados e Soluções
| Problema | Solução |
|----------|---------|
| Content collection vazia no build | `legacy.collectionsBackwardsCompat: true` |
| `post.slug` undefined | Astro 6 usa `post.id` em vez de `post.slug` |
| Tag route encoding | `slugifyTag()` substitui espaços por hífens |
| `[...slug]` conflito com index | Renomeado para `[slug]` (param obrigatório) |
| Sitemap integration crash | Removido temporariamente (a ser resolvido) |
| content.config.ts não compilava | Convertido para `.js` |

---

## 8. Notas Técnicas

### Astro 6.3.6 Especificidades
- Content config em `src/content.config.js` (não `src/content/config.ts`)
- Entradas usam `entry.id` em vez de `entry.slug`
- Necessário `legacy.collectionsBackwardsCompat: true` para coleções de conteúdo
- `getStaticPaths` export function obrigatória para rotas dinâmicas

### API Gemini
- Modelo: `gemini-2.5-flash`
- Resposta em JSON com `responseMimeType: 'application/json'`
- Modo MOCK automático quando `GEMINI_API_KEY` não está definida

### GitHub Actions
- `deploy.yml`: Build + deploy para GitHub Pages
- `auto-publish.yml`: Geração de artigos + commit automático
- Permissão `contents: write` necessária para commit dos artigos

### Feeds RSS (6 portais)
1. Eurogamer.pt
2. GameBlast
3. Combo Infinito
4. Adrenaline
5. Meu PS4
6. The Enemy
