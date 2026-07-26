// Motor de voz — Web Speech API. Deteção dinâmica de vozes, fallback honesto quando algo falta.

const SOTAQUE_PARA_LANG = { 'en-GB': 'en-GB', 'en-US': 'en-US', 'en-AU': 'en-AU' };

let vozesCache = [];
function carregarVozes() {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) { vozesCache = v; resolve(v); return; }
    let resolvido = false;
    const concluir = () => {
      if (resolvido) return;
      resolvido = true;
      vozesCache = speechSynthesis.getVoices();
      resolve(vozesCache);
    };
    speechSynthesis.onvoiceschanged = concluir;
    // Alguns navegadores (nomeadamente WebViews Android mais antigos) nunca disparam
    // onvoiceschanged quando não há vozes — sem este limite, o exercício ficaria bloqueado para sempre.
    setTimeout(concluir, 1000);
  });
}

function pareceGenero(voice, genero) {
  const nome = voice.name.toLowerCase();
  const femininos = ['female', 'woman', 'zira', 'susan', 'karen', 'samantha', 'tessa', 'moira', 'fiona', 'kate'];
  const masculinos = ['male', 'man', 'david', 'george', 'daniel', 'alex', 'fred', 'lee', 'oliver'];
  if (genero === 'F') return femininos.some((s) => nome.includes(s));
  return masculinos.some((s) => nome.includes(s));
}

/**
 * Escolhe a melhor voz disponível para o sotaque/género pedidos.
 * Devolve { voice, aviso } — aviso é null se a combinação exata foi encontrada,
 * ou uma mensagem honesta em português a explicar a limitação, caso contrário.
 */
export async function escolherVoz(sotaque, genero) {
  const vozes = vozesCache.length ? vozesCache : await carregarVozes();
  const lang = SOTAQUE_PARA_LANG[sotaque] || 'en-GB';

  const doSotaqueEGenero = vozes.filter((v) => v.lang === lang && pareceGenero(v, genero));
  if (doSotaqueEGenero.length) return { voice: doSotaqueEGenero[0], aviso: null };

  const soDoSotaque = vozes.filter((v) => v.lang === lang);
  if (soDoSotaque.length) {
    return {
      voice: soDoSotaque[0],
      aviso: `O teu telemóvel não tem uma voz ${genero === 'F' ? 'feminina' : 'masculina'} para este sotaque — vou usar a voz disponível mais próxima.`
    };
  }

  const soDoIdioma = vozes.filter((v) => v.lang && v.lang.startsWith('en'));
  if (soDoIdioma.length) {
    return {
      voice: soDoIdioma[0],
      aviso: 'O teu telemóvel não tem o sotaque exato que escolheste instalado — vou usar outra voz de inglês disponível.'
    };
  }

  return { voice: null, aviso: 'O teu telemóvel não tem nenhuma voz de inglês instalada — o texto será mostrado sem áudio.' };
}

export async function falar(texto, sotaque, genero) {
  if (!('speechSynthesis' in window)) {
    return { aviso: 'Este navegador não suporta síntese de voz — lê o texto abaixo.' };
  }
  const { voice, aviso } = await escolherVoz(sotaque, genero);
  const utter = new SpeechSynthesisUtterance(texto);
  if (voice) utter.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
  return { aviso };
}

export function suportaReconhecimentoFala() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Ouve uma frase falada. Rejeita com { semSuporte: true } em navegadores sem SpeechRecognition
 * (nomeadamente Safari/iPhone) — o chamador deve então usar o fallback de texto por teclado.
 */
export function ouvir(sotaque) {
  return new Promise((resolve, reject) => {
    if (!suportaReconhecimentoFala()) {
      reject({ semSuporte: true });
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new SpeechRecognition();
    recognizer.lang = SOTAQUE_PARA_LANG[sotaque] || 'en-GB';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;
    recognizer.onresult = (evento) => {
      const transcricao = evento.results[0][0].transcript;
      resolve(transcricao);
    };
    recognizer.onerror = (evento) => reject({ erro: evento.error });
    recognizer.start();
  });
}

/** Comparação aproximada de texto (não fonética) — usada para avaliar ditado/oral. */
export function compararTexto(resposta, esperada) {
  const normalizar = (s) => s.toLowerCase().trim().replace(/[.,!?']/g, '');
  const alvo = Array.isArray(esperada) ? esperada : [esperada];
  return alvo.some((e) => normalizar(e) === normalizar(resposta));
}
