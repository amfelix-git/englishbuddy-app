// Modo Conversação com IA — totalmente opcional, desligado por omissão.
// A chave é guardada só localmente (perfil no IndexedDB) e nunca enviada para nenhum servidor nosso.
// Consumo de tokens (se algum) é sempre da conta do próprio utilizador.

const SYSTEM_PROMPT_BASE = `You are "Buddy", a friendly, encouraging English tutor for Portuguese speakers.
Tone: pedagogical, warm, light genuine humour, never condescending. Celebrate correct answers explicitly.
When the learner makes a mistake, explain gently and clearly, referencing common Portuguese-English interference when relevant.
Adapt your register to the learner's level (simpler and more patient for Básico, more direct and nuanced for Especialista).
Keep responses reasonably short — this is a mobile chat-style conversation practice, not an essay.`;

export function construirSystemPrompt(nivel, sotaque) {
  return `${SYSTEM_PROMPT_BASE}\nLearner level: ${nivel}.\nSpeak with a ${sotaque} English accent in spirit (word choice/spelling), e.g. British vs. American spelling conventions where relevant.`;
}

/**
 * Chama a API de IA escolhida pelo utilizador (só quando o Modo IA está ativo).
 * `chaveApi` e `fornecedor` vêm das definições do utilizador — nunca de valores embutidos no código.
 * Isolado neste módulo para ser fácil de rever ou trocar de fornecedor.
 */
export async function enviarMensagemIA({ chaveApi, fornecedor, mensagens, nivel, sotaque }) {
  if (!chaveApi) throw new Error('Modo IA ativo mas sem chave de API configurada nas Definições.');

  const systemPrompt = construirSystemPrompt(nivel, sotaque);

  if (fornecedor === 'google-gemini') {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(chaveApi)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: mensagens.map((m) => ({ role: m.autor === 'utilizador' ? 'user' : 'model', parts: [{ text: m.texto }] }))
      })
    });
    if (!resp.ok) throw new Error(`Erro da API Gemini: ${resp.status}`);
    const dados = await resp.json();
    return dados.candidates?.[0]?.content?.parts?.[0]?.text || '(sem resposta)';
  }

  throw new Error(`Fornecedor de IA "${fornecedor}" ainda não está ligado neste módulo — adiciona o caso aqui, sem alterar o resto da app.`);
}

/** Tradução livre de qualquer frase, só disponível com o Modo IA ativo. */
export async function traduzirLivre({ chaveApi, fornecedor, texto, direcao }) {
  const instrucao = direcao === 'pt-en' ? 'Translate this Portuguese sentence to English' : 'Translate this English sentence to Portuguese';
  const resposta = await enviarMensagemIA({
    chaveApi, fornecedor, nivel: 'geral', sotaque: 'en-GB',
    mensagens: [{ autor: 'utilizador', texto: `${instrucao}, and mention if there's a common false-friend trap for Portuguese speakers: "${texto}"` }]
  });
  return resposta;
}
