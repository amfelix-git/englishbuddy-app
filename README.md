# EnglishBuddy

App PWA gratuita para aprender inglês (escrita, oralidade, tradução PT↔EN), com sessões diárias curtas. Ver a raiz do projeto (`../RELATORIO_OPCOES_TECNOLOGICAS.md` e `../PROMPT_CONSTRUCAO_APP.md`) para o porquê de cada decisão técnica.

## Estado atual

Motor completo e funcional + conteúdo real do **Nível Básico, sessões 1 a 10** (ver `content/basico/`). Os níveis Intermédio e Especialista ainda não têm conteúdo — a app avisa o utilizador com uma mensagem simpática quando chega ao fim do que já existe, em vez de mostrar um erro.

## Como testar localmente

Não precisas de instalar nada complexo — só um servidor estático simples, porque o navegador não permite `fetch()` de ficheiros locais (`file://`) por razões de segurança.

Se tiveres Python instalado (a maioria dos computadores tem):
```
cd app
python -m http.server 8080
```
Depois abre `http://localhost:8080` no navegador.

Se tiveres Node.js:
```
cd app
npx serve .
```

**Nota sobre reconhecimento de fala:** os exercícios orais só funcionam com microfone real em Chrome/Android (ou Chrome no computador). No Safari/iPhone, a app usa automaticamente o modo de fallback por teclado.

## Como publicar no GitHub Pages (gratuito)

1. Cria um repositório novo no GitHub (pode ser público).
2. Copia todo o conteúdo desta pasta `app/` para a raiz do repositório (ou usa uma subpasta `docs/`, conforme preferires).
3. No GitHub, vai a **Settings → Pages**, escolhe o branch `main` e a pasta onde ficaram os ficheiros.
4. Ao fim de 1-2 minutos, a app fica disponível em `https://teu-utilizador.github.io/nome-do-repositorio/`.
5. Partilha esse link com quem quiseres — basta abrirem-no no telemóvel e (opcionalmente) usarem "Adicionar ao ecrã principal" para instalar como app.

Se um dia sentires lentidão com muitos utilizadores, migrar para Cloudflare Pages é gratuito e direto — basta ligar o mesmo repositório lá.

## Funcionalidades não incluídas nesta versão (por desenho, não esquecimento)

Ver `RELATORIO_OPCOES_TECNOLOGICAS.md` secção 10 para a justificação completa. Resumo: tradução por câmara, realidade aumentada, modo comunidade/emparelhamento entre utilizadores, e push notifications verdadeiras (app fechada) — todas exigiriam servidor ou complexidade incompatível com o requisito de custo zero desta versão simples. Reconhecimento de imagem→vocabulário por câmara é tecnicamente viável de forma gratuita (ex.: TensorFlow.js) mas fica para uma fase futura.

## Como pedir mais conteúdo (níveis/sessões seguintes)

Consulta `CONTEUDO_SCHEMA.md` para a estrutura de dados exata. Para expandir:
1. Pede a criação de um novo bloco, ex. `content/basico/sessoes-11-20.json`, seguindo o mesmo esquema.
2. Regista o novo bloco em `content/basico/indice.json`.
3. Repete para `content/intermedio/` e `content/especialista/` (criar as pastas e o respetivo `indice.json`) quando chegar a altura.
4. Não é preciso tocar no motor (`js/`) para isto — foi desenhado precisamente para não precisar.

## Estrutura de ficheiros

```
app/
  index.html            — esqueleto da PWA, todos os ecrãs
  manifest.json         — metadados de instalação da PWA
  service-worker.js     — cache-first, funcionamento offline
  css/styles.css
  js/
    db.js               — IndexedDB (Dexie) + exportar/importar
    voice.js            — TTS/STT (Web Speech API) com deteção e fallback
    srs.js              — repetição espaçada (SM-2)
    gamification.js     — streaks, pontos, badges
    sessions.js         — progressão, cálculo de sessões por tempo diário
    exercises.js        — renderização/avaliação por tipo de exercício
    placement-test.js   — teste de nivelamento inicial
    persona-frases.js   — frases do interlocutor "Buddy"
    ai-mode.js           — Modo Conversação com IA (BYOK, opcional)
    app.js              — controlador principal / router de ecrãs
  content/
    basico/indice.json
    basico/sessoes-01-10.json
  icons/icon.svg
  persona.md             — referência de tom completa (inclui system prompt do Modo IA)
  CONTEUDO_SCHEMA.md      — esquema de dados de sessões/exercícios
```
