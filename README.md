# Vamos Jogando 🎮 - Blog Autônomo de Notícias de Games

Este é o repositório do **Vamos Jogando**, um portal de notícias sobre videogames completamente autossuficiente e gratuito. Ele utiliza **Astro** para um carregamento ultra-rápido, **GitHub Pages** para hospedagem gratuita e **GitHub Actions** + **API do Gemini (Google)** para buscar e redigir novos artigos diariamente de forma autônoma.

---

## 🛠️ Como Funciona a Automação?

```
[Cron no GitHub Actions] (2x ao dia)
          │
          ▼
[Script Node.js] ──► Busca feeds RSS (Eurogamer.pt, GameBlast, etc.)
          │
          ▼
[Validação] ───────► Filtra notícias que já foram publicadas
          │
          ▼
[API do Gemini] ──► IA escreve um artigo exclusivo em Markdown e Português
          │
          ▼
[Git Commit] ──────► Commita o arquivo .md de volta no repositório
          │
          ▼
[Pages Deploy] ────► Aciona o build e publica o site atualizado
```

---

## 🚀 Passo a Passo para Colocar o Site no Ar

Siga estas etapas para implantar o seu blog gratuitamente no GitHub:

### 1. Criar um Repositório no GitHub
1. Acesse o seu GitHub e crie um novo repositório chamado `vamosjogando`.
2. Deixe o repositório como **Público** (necessário para o GitHub Pages gratuito).

### 2. Inicializar o Git Local e Enviar o Código
No seu terminal local, dentro da pasta `/home/prenato/Antigravity/vamosjogando`:
```bash
git init
git add .
git commit -m "Initial commit: Vamos Jogando blog"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/vamosjogando.git
git push -u origin main
```
*(Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub).*

### 3. Configurar Permissões do GitHub Actions
Para que o robô de IA possa salvar novos posts no seu repositório:
1. No seu repositório no GitHub, clique em **Settings** (Configurações).
2. Na barra lateral esquerda, vá em **Actions** > **General**.
3. Role até o final da página até **Workflow permissions**.
4. Selecione **Read and write permissions** (Permissões de leitura e gravação).
5. Clique em **Save**.

### 4. Obter e Configurar a Chave de API do Gemini
O script precisa da chave do Gemini para escrever os artigos.
1. Vá até o [Google AI Studio](https://aistudio.google.com/) e crie uma API Key gratuita.
2. No seu repositório do GitHub, vá em **Settings** > **Secrets and variables** > **Actions**.
3. Clique em **New repository secret** (Novo segredo do repositório).
4. No campo **Name**, digite: `GEMINI_API_KEY`
5. No campo **Secret**, cole a sua chave de API copiada do Google AI Studio.
6. Clique em **Add secret**.

### 5. Ativar o GitHub Pages via GitHub Actions
1. No seu repositório do GitHub, vá em **Settings** > **Pages**.
2. Sob a seção **Build and deployment** > **Source**, mude de "Deploy from a branch" para **GitHub Actions**.

Pronto! Na próxima execução agendada (ou se você acionar manualmente na aba **Actions** > **Auto Publish AI Article** > **Run workflow**), o script coletará as notícias, o Gemini escreverá o post e o deploy será feito de forma 100% automatizada.

---

## 💻 Desenvolvimento Local

Se você quiser testar ou fazer alterações locais:

### Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| `npm install` | Instala as dependências do projeto. |
| `npm run dev` | Inicia o servidor local de desenvolvimento em `http://localhost:4321`. |
| `npm run generate` | Executa o script de IA localmente. (Lê de `process.env.GEMINI_API_KEY` ou usa o modo MOCK se vazio). |
| `npm run build` | Compila o site estático para produção na pasta `/dist`. |
| `npm run preview` | Inicia um servidor local para visualizar a versão compilada de produção. |

---

## 🎨 Design System
O visual foi desenvolvido com foco na estética gamer premium:
* **Tema Escuro Padrão**: Fundo em tons de cinza escuro azulado e carbono.
* **Acentos Neon**: Efeitos de iluminação glow e gradientes em Ciano (`#06b6d4`) e Roxo (`#8b5cf6`).
* **Glassmorphism**: Elementos flutuantes com transparência sutil e efeito de desfoque de fundo (backdrop-filter blur).
* **Tipografia**: Fontes modernas carregadas do Google Fonts: **Outfit** (títulos) e **Plus Jakarta Sans** (corpo de texto).
