# Esquema de conteúdo — sessões e exercícios

Este ficheiro documenta a estrutura de dados de uma sessão, para que novo conteúdo (mais sessões do Básico, depois Intermédio/Especialista) possa ser gerado em conversas futuras sem alterar o motor da app.

Cada ficheiro de conteúdo em `content/<nivel>/` é um array JSON de objetos "sessão":

```jsonc
{
  "id": "basico-01",              // único, "<nivel>-<numero com 2 dígitos>"
  "nivel": "basico",              // "basico" | "intermedio" | "especialista"
  "titulo": "Verbo To Be",
  "objetivos": [
    "Usar o verbo to be na afirmativa, negativa e interrogativa",
    "Reconhecer e usar contrações (I'm, isn't, aren't)"
  ],
  "duracaoEstimadaMin": 8,        // usado pelo motor de sessões para calcular quantas sessões cabem no tempo diário escolhido
  "temaIntegrador": null,          // preenchido só nas sessões de "situação do dia a dia" (ex.: "socializacao")
  "exercicios": [ /* ver tipos abaixo */ ],
  "srsItens": [                    // itens a entrar no algoritmo de repetição espaçada (srs.js)
    { "id": "gra-basico-tobe-afirmativa", "tipo": "gramatica", "pergunta": "...", "resposta": "..." }
  ],
  "gamificacao": { "pontosBase": 10, "badge": null } // badge: id de badge atribuído ao completar (ou null)
}
```

## Tipos de exercício (campo `tipo` de cada item em `exercicios`)

Segue sempre, para pontos de gramática, o formato de `gramatica-inglesa-niveis.md` §6: **regra + 3 exemplos + 1 erro comum + 1 exercício de produção livre**.

### `explicacao`
```jsonc
{
  "tipo": "explicacao",
  "regra": "Texto curto da regra.",
  "exemplos": ["Exemplo 1.", "Exemplo 2.", "Exemplo 3."],
  "erroComum": {
    "descricaoPT": "Explicação do erro típico de um falante de português.",
    "errado": "I have 20 years.",
    "correto": "I am 20 years old."
  }
}
```

### `escolha_multipla`
```jsonc
{ "tipo": "escolha_multipla", "pergunta": "...", "opcoes": ["A", "B", "C"], "correta": 0, "explicacao": "..." }
```

### `preenchimento_espaco`
```jsonc
{ "tipo": "preenchimento_espaco", "frase": "She ___ a teacher.", "resposta": "is", "explicacao": "..." }
```

### `ditado` (usa TTS)
```jsonc
{ "tipo": "ditado", "textoParaOuvir": "My name is Anna.", "respostaEsperada": "My name is Anna." }
```
O motor de voz (`voice.js`) lê `textoParaOuvir` no sotaque/género escolhidos pelo utilizador; a resposta é comparada com tolerância a maiúsculas/pontuação.

### `oral` (usa TTS + STT, com fallback de teclado no iPhone)
```jsonc
{ "tipo": "oral", "promptTTS": "How are you?", "respostaEsperada": ["I'm fine", "I am fine", "Fine, thanks"] }
```
`respostaEsperada` é um array de variantes aceitáveis (comparação aproximada de texto, não fonética).

### `traducao`
```jsonc
{ "tipo": "traducao", "direcao": "pt-en", "origem": "Bom dia", "destino": "Good morning", "alternativas": ["Good morning."] }
```

### `escrita_livre`
```jsonc
{ "tipo": "escrita_livre", "instrucao": "Escreve 2 frases a apresentares-te.", "palavrasChaveEsperadas": ["I am", "my name"], "respostaModelo": "Hi, I'm ___. I am from Portugal." }
```
Avaliação por correspondência de palavras-chave, não análise de estilo — a app deve dizer isso ao utilizador quando mostra o feedback.

### `dialogo` (árvore ramificada simples)
```jsonc
{
  "tipo": "dialogo",
  "nos": [
    {
      "id": "inicio",
      "interlocutorFala": "Hi! What's your name?",
      "opcoes": [
        { "texto": "My name is ___.", "proximoNo": "seguimento1" },
        { "texto": "I don't understand.", "proximoNo": "ajuda" }
      ]
    }
  ]
}
```

## Campos de repetição espaçada (SRS) por item

Guardados em `srsItems` na base de dados (não no ficheiro de conteúdo), um registo por `srsItens[].id`:
```jsonc
{ "itemId": "gra-basico-tobe-afirmativa", "easeFactor": 2.5, "intervalo": 1, "repeticoes": 0, "proximaRevisao": "2026-07-27" }
```

## Nomenclatura de ficheiros

`content/<nivel>/sessoes-<inicio>-<fim>.json` — ex.: `content/basico/sessoes-01-10.json`. Para expandir, criar `sessoes-11-20.json`, etc., e registar no índice `content/indice.json` (ver esse ficheiro para a lista de blocos de sessões já disponíveis).
