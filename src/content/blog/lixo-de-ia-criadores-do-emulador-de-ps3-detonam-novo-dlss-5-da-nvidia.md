---
title: 'RPCS3 Declara DLSS 5 da NVIDIA como ''Lixo de IA'': Entenda a Polêmica'
description: 'A equipe por trás do emulador de PlayStation 3, RPCS3, não poupou críticas ao novo DLSS 5 da NVIDIA, rotulando-o como ''lixo de IA'' e reacendendo o debate sobre otimização versus upscaling no desenvolvimento de jogos.'
pubDate: 'Thu Sep 03 2026'
heroImage: '../../assets/lixo-de-ia-criadores-do-emulador-de-ps3-detonam-novo-dlss-5-da-nvidia.webp'
ogImage: '../../assets/og-lixo-de-ia-criadores-do-emulador-de-ps3-detonam-novo-dlss-5-da-nvidia.webp'
sourceUrl: 'https://canaltech.com.br/games/lixo-de-ia-criadores-do-emulador-de-ps3-detonam-novo-dlss-5-da-nvidia/'
tags: ['Emulação', 'NVIDIA', 'DLSS', 'Hardware']
imageVerified: 'true'
---
A comunidade gamer está em polvorosa com a recente manifestação dos desenvolvedores do renomado emulador de PlayStation 3, RPCS3. Conhecidos por sua dedicação em trazer clássicos do PS3 para o PC, a equipe agora se volta contra uma das mais badaladas tecnologias da NVIDIA: o DLSS 5. A controvérsia reacende um debate fundamental sobre otimização de jogos e o papel das tecnologias de upscaling.

## A Polêmica do 'Lixo de IA'

A faísca foi acesa após modders testarem uma DLL vazada do DLSS 5 no renderizador do RPCS3. O resultado? Uma reação veemente por parte dos desenvolvedores, que não hesitaram em classificar a tecnologia como "lixo" em uma publicação no X.

> "Algumas pessoas estão testando uma DLL vazada do DLSS 5 em nosso renderer. Nós vimos o slop que ele gera", escreveu a equipe do RPCS3.

A crítica vai além da performance técnica. O time do RPCS3 levantou uma bandeira importante, acusando a indústria de "forçar mais upscalers e frame generation para alucinar jogos e esconder sua falta de otimização". Para eles, o foco deveria ser em hardware que permita a jogabilidade, não em truques para mascarar falhas.

## Motion Vectors: A Chave da Discórdia (e da Incompatibilidade)

A incompatibilidade do DLSS 5 com o RPCS3 tem uma base técnica sólida. Os jogos da era do PlayStation 3, desenvolvidos em uma época diferente, simplesmente não fornecem os "motion vectors" (vetores de movimento) necessários para que upscalers temporais modernos, como o DLSS 2+ ou o vindouro DLSS 5, funcionem corretamente. Sem esses dados, a IA não tem as informações cruciais para reconstruir a imagem de forma precisa, resultando no que o RPCS3 chamou de "slop".

Curiosamente, a equipe foi criticada por alguns usuários por usar o FSR 1 da AMD. A resposta veio rapidamente, explicando a diferença fundamental:

> "O FSR 1 foi adicionado porque é um spatial upscaler, é o algoritmo Lanczos com algumas modificações, você não precisa de motion vectors para ele. O equivalente da NVIDIA para o FSR 1 é o NIS", destacou a equipe do RPCS3.

Isso significa que tecnologias de upscaling *espacial* (que trabalham pixel a pixel na imagem atual) são aceitáveis, enquanto as *temporais* (que usam dados de frames anteriores e motion vectors) não são viáveis nem desejáveis para o propósito do emulador.

## Nossa Análise: Implicações para o Gamer Brasileiro e o Futuro dos Games

A postura dos desenvolvedores do RPCS3 é um lembrete importante em um cenário onde tecnologias de upscaling e geração de frames se tornam cada vez mais centrais. Para o gamer brasileiro, muitas vezes dependente de hardware com menor poder de fogo, a otimização nativa de um jogo é crucial. Confiar excessivamente em DLSS, FSR 2+ ou XeSS pode criar uma ilusão de desempenho, onde jogos mal otimizados "rodam" graças a essas ferramentas, mas a custo de artefatos visuais ou uma experiência comprometida para quem não tem GPUs de ponta.

A crítica do RPCS3 nos faz questionar: estamos nos tornando complacentes com a falta de otimização em prol de tecnologias que "maquiam" os problemas? Em um mercado como o nosso, onde cada frame conta e nem todos podem ter as últimas placas de vídeo, a exigência por jogos bem feitos desde a base se torna ainda mais vital. É um grito de alerta para que a indústria não use a IA como muleta, mas sim como uma ferramenta complementar a um desenvolvimento sólido.
