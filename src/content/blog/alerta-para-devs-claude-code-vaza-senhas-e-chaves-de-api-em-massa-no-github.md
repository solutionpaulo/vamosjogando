---
title: 'Vazamento Chocante: IA Claude Code Expõe Milhares de Segredos no GitHub'
description: 'Uma falha crítica na ferramenta de IA Claude Code da Anthropic revelou senhas, chaves de API e outras credenciais em massa no GitHub, impactando centenas de organizações. Descubra como essa brecha pode abalar a segurança no desenvolvimento de software e o que isso significa para o futuro da IA.'
pubDate: 'Mon Nov 09 2026'
heroImage: '../../assets/alerta-para-devs-claude-code-vaza-senhas-e-chaves-de-api-em-massa-no-github.webp'
ogImage: '../../assets/og-alerta-para-devs-claude-code-vaza-senhas-e-chaves-de-api-em-massa-no-github.webp'
sourceUrl: 'https://canaltech.com.br/seguranca/alerta-para-devs-claude-code-vaza-senhas-e-chaves-de-api-em-massa-no-github/'
tags: ['Segurança Cibernética', 'Inteligência Artificial', 'Desenvolvimento', 'Vazamento de Dados']
---
A crescente integração da Inteligência Artificial no cotidiano dos desenvolvedores trouxe inúmeros benefícios, mas também novos vetores de risco. Recentemente, o mundo da tecnologia foi sacudido por uma revelação preocupante: o Claude Code, assistente de IA da Anthropic, expôs milhares de senhas, chaves de API e outras credenciais sensíveis em repositórios públicos do GitHub. Este incidente serve como um alerta severo sobre a confiança que depositamos em ferramentas automatizadas, e suas implicações podem ecoar por todo o ecossistema digital, incluindo o desenvolvimento de jogos.

## O Epicentro do Vazamento: Como Aconteceu?

A falha, descoberta pela Apiiro, reside na forma como o Claude Code gerencia comandos autorizados por desenvolvedores. Quando um programador opta por 'Sim, e não pergunte novamente' a uma sugestão do assistente que inclui dados sensíveis (como senhas de banco de dados ou tokens de API), a ferramenta salva esse comando em texto puro no arquivo `.claude/settings.local.json`. O problema se agrava porque:

- O `.claude/settings.local.json` deveria ser ignorado pelo Git através do `.gitignore` global do desenvolvedor.
- No entanto, essa proteção falha se o `.gitignore` do *projeto* não estiver configurado para ignorar esse arquivo.
- Consequentemente, ao compartilhar, clonar ou configurar manualmente o repositório, os dados confidenciais podem ser inadvertidamente enviados para o GitHub.

A Apiiro encontrou mais de 100 mil cópias públicas desse arquivo, com 1.122 delas contendo credenciais reais.

## Dados Expostos e o Cenário de Risco

O levantamento detalhado revelou a magnitude do problema, com um total de 2.539 credenciais reais expostas em quase 2.000 repositórios. A variedade de informações vazadas é alarmante:

- **Tokens de API de serviços e chaves de IA:** 398 e 149 registros, respectivamente.
- **Senhas de bancos de dados:** 379 senhas, sendo 501 delas de bancos de dados de *produção*, incluindo sistemas de prontuários médicos e plataformas de pagamento.
- **Chaves de função de serviço do Supabase e Google API:** 122 e 110 registros.
- **Logins de servidores SSH e tokens de controle de versão (GitHub, GitLab):** 43 e 42 registros.
- **Chaves de nuvem da AWS, senhas de aplicativos e chaves privadas:** Dados altamente sensíveis que conferem acesso profundo a infraestruturas.

O fato de que esses dados incluíam acesso a sistemas críticos de produção sublinha a gravidade da vulnerabilidade.

## Alertas Ignorados e Resposta Pós-Crise

O mais preocupante é que o comportamento problemático do Claude Code já havia sido reportado por usuários desde agosto de 2023. No entanto, esses relatos foram arquivados sem solução. Somente após a divulgação da pesquisa da Apiiro, a Anthropic se manifestou.

> "A equipe estuda formas de evitar novos vazamentos, como o aprimoramento no modo automático e a inclusão de um scanner básico de segredos na ferramenta", afirmou o chefe do Claude Code na Anthropic no fórum Hacker News, em resposta à repercussão do incidente.

Essa resposta tardia levanta questões sobre a proatividade das empresas de IA em relação à segurança de seus produtos, especialmente quando eles lidam com dados tão sensíveis.

## O Impacto para o Ecossistema Tech e o Gamer Brasileiro

Embora o Claude Code seja uma ferramenta de desenvolvimento, não um jogo, este incidente ecoa por todo o universo tech. Para o gamer brasileiro, que talvez não use essa IA diretamente, a falha serve como um lembrete vívido da importância da segurança de dados em toda a cadeia de desenvolvimento de software. Ferramentas como essa podem ser usadas no desenvolvimento de jogos, e vazamentos podem comprometer projetos inteiros, dados de usuários ou infraestruturas críticas.

Este episódio ressalta a necessidade de:
- **Diligência dos desenvolvedores:** Revisar configurações, `.gitignore` e evitar o armazenamento de credenciais em texto puro.
- **Responsabilidade das empresas de IA:** Integrar segurança como prioridade desde o design, não como um adendo pós-crise.
- **Conscientização:** Entender que a IA, apesar de sua capacidade, não está imune a falhas humanas ou de projeto.

O mundo dos games, cada vez mais dependente de tecnologia e APIs, não pode se dar ao luxo de ignorar lições como esta. A segurança é uma responsabilidade compartilhada que começa na ferramenta mais básica e se estende até o usuário final.
