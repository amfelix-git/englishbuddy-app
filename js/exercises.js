// Renderização e avaliação dos tipos de exercício definidos em CONTEUDO_SCHEMA.md.
import { falar, ouvir, suportaReconhecimentoFala, compararTexto } from './voice.js';

function limpar(container) {
  container.innerHTML = '';
}

function botao(texto, onClick, classe = 'botao-primario') {
  const b = document.createElement('button');
  b.textContent = texto;
  b.className = classe;
  b.addEventListener('click', onClick);
  return b;
}

function paragrafo(texto, classe = '') {
  const p = document.createElement('p');
  p.textContent = texto;
  if (classe) p.className = classe;
  return p;
}

/** Renderiza um exercício e devolve uma Promise que resolve com { acertou, tentativas, semPontuacao }. */
export function renderExercicio(container, exercicio, ctx) {
  limpar(container);
  const renderer = RENDERERS[exercicio.tipo];
  if (!renderer) {
    container.appendChild(paragrafo(`Tipo de exercício desconhecido: ${exercicio.tipo}`));
    return Promise.resolve({ acertou: true, tentativas: 1, semPontuacao: true });
  }
  return renderer(container, exercicio, ctx);
}

const RENDERERS = {
  explicacao(container, ex) {
    container.appendChild(paragrafo(ex.regra, 'explicacao-regra'));
    const listaExemplos = document.createElement('ul');
    ex.exemplos.forEach((e) => {
      const li = document.createElement('li');
      li.textContent = e;
      listaExemplos.appendChild(li);
    });
    container.appendChild(listaExemplos);

    if (ex.erroComum) {
      const bloco = document.createElement('div');
      bloco.className = 'erro-comum';
      bloco.appendChild(paragrafo('Erro comum para falantes de português:', 'erro-comum-titulo'));
      bloco.appendChild(paragrafo(`❌ ${ex.erroComum.errado}`));
      bloco.appendChild(paragrafo(`✅ ${ex.erroComum.correto}`));
      bloco.appendChild(paragrafo(ex.erroComum.descricaoPT));
      container.appendChild(bloco);
    }

    return new Promise((resolve) => {
      container.appendChild(botao('Entendido, continuar', () => resolve({ acertou: true, tentativas: 1, semPontuacao: true })));
    });
  },

  escolha_multipla(container, ex) {
    container.appendChild(paragrafo(ex.pergunta, 'pergunta'));
    return new Promise((resolve) => {
      let tentativas = 0;
      ex.opcoes.forEach((opcao, indice) => {
        const b = botao(opcao, () => {
          tentativas += 1;
          const acertou = indice === ex.correta;
          mostrarFeedbackEContinuar(container, acertou, ex.explicacao, () => resolve({ acertou, tentativas }));
        }, 'botao-opcao');
        container.appendChild(b);
      });
    });
  },

  preenchimento_espaco(container, ex) {
    container.appendChild(paragrafo(ex.frase.replace('___', '_____'), 'pergunta'));
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Escreve a palavra em falta';
    container.appendChild(input);
    return new Promise((resolve) => {
      let tentativas = 0;
      container.appendChild(botao('Confirmar', () => {
        tentativas += 1;
        const acertou = compararTexto(input.value, ex.resposta);
        mostrarFeedbackEContinuar(container, acertou, ex.explicacao, () => resolve({ acertou, tentativas }));
      }));
    });
  },

  async ditado(container, ex, ctx) {
    container.appendChild(paragrafo('Ouve a frase e escreve o que ouviste.', 'instrucao'));
    const { aviso } = await falar(ex.textoParaOuvir, ctx.sotaque, ctx.generoInterlocutor);
    if (aviso) container.appendChild(paragrafo(`ℹ️ ${aviso}`, 'aviso'));
    container.appendChild(botao('🔊 Ouvir de novo', () => falar(ex.textoParaOuvir, ctx.sotaque, ctx.generoInterlocutor), 'botao-secundario'));

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'O que ouviste?';
    container.appendChild(input);

    return new Promise((resolve) => {
      let tentativas = 0;
      container.appendChild(botao('Confirmar', () => {
        tentativas += 1;
        const acertou = compararTexto(input.value, ex.respostaEsperada);
        mostrarFeedbackEContinuar(container, acertou, `Frase correta: "${ex.textoParaOuvir}"`, () => resolve({ acertou, tentativas }));
      }));
    });
  },

  async oral(container, ex, ctx) {
    container.appendChild(paragrafo('Vais ouvir uma pergunta/frase — responde em voz alta.', 'instrucao'));
    await falar(ex.promptTTS, ctx.sotaque, ctx.generoInterlocutor);
    container.appendChild(paragrafo(`"${ex.promptTTS}"`, 'frase-alvo'));
    container.appendChild(botao('🔊 Ouvir de novo', () => falar(ex.promptTTS, ctx.sotaque, ctx.generoInterlocutor), 'botao-secundario'));

    if (!suportaReconhecimentoFala()) {
      container.appendChild(paragrafo('ℹ️ O teu telemóvel/navegador não suporta reconhecimento de fala em tempo real (é o caso do iPhone/Safari). Usa o ditado do teclado para falares e depois confirma o texto abaixo.', 'aviso'));
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Escreve (ou dita pelo teclado) a tua resposta';
      container.appendChild(input);
      return new Promise((resolve) => {
        let tentativas = 0;
        container.appendChild(botao('Confirmar', () => {
          tentativas += 1;
          const acertou = compararTexto(input.value, ex.respostaEsperada);
          mostrarFeedbackEContinuar(container, acertou, `Resposta esperada: "${Array.isArray(ex.respostaEsperada) ? ex.respostaEsperada[0] : ex.respostaEsperada}"`, () => resolve({ acertou, tentativas }));
        }));
      });
    }

    return new Promise((resolve) => {
      let tentativas = 0;
      const status = paragrafo('', 'status-gravacao');
      container.appendChild(status);
      container.appendChild(botao('🎤 Gravar resposta', async () => {
        status.textContent = 'A ouvir...';
        try {
          const transcricao = await ouvir(ctx.sotaque);
          tentativas += 1;
          status.textContent = `Ouvi: "${transcricao}"`;
          const acertou = compararTexto(transcricao, ex.respostaEsperada);
          mostrarFeedbackEContinuar(container, acertou, `Resposta esperada: "${Array.isArray(ex.respostaEsperada) ? ex.respostaEsperada[0] : ex.respostaEsperada}"`, () => resolve({ acertou, tentativas }));
        } catch (erro) {
          status.textContent = 'Não percebi — tenta outra vez.';
        }
      }));
    });
  },

  traducao(container, ex) {
    const instrucao = ex.direcao === 'pt-en' ? 'Traduz para inglês:' : 'Traduz para português:';
    container.appendChild(paragrafo(instrucao, 'instrucao'));
    container.appendChild(paragrafo(ex.origem, 'frase-alvo'));
    const input = document.createElement('input');
    input.type = 'text';
    container.appendChild(input);
    return new Promise((resolve) => {
      let tentativas = 0;
      container.appendChild(botao('Confirmar', () => {
        tentativas += 1;
        const alvo = [ex.destino, ...(ex.alternativas || [])];
        const acertou = compararTexto(input.value, alvo);
        mostrarFeedbackEContinuar(container, acertou, `Tradução: "${ex.destino}"`, () => resolve({ acertou, tentativas }));
      }));
    });
  },

  escrita_livre(container, ex) {
    container.appendChild(paragrafo(ex.instrucao, 'instrucao'));
    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    container.appendChild(textarea);
    return new Promise((resolve) => {
      let tentativas = 0;
      container.appendChild(botao('Confirmar', () => {
        tentativas += 1;
        const textoNormalizado = textarea.value.toLowerCase();
        const acertou = ex.palavrasChaveEsperadas.some((k) => textoNormalizado.includes(k.toLowerCase()));
        container.appendChild(paragrafo('Nota: aqui só verifico se usaste as palavras-chave esperadas — não avalio estilo ou originalidade como um professor humano faria.', 'aviso'));
        mostrarFeedbackEContinuar(container, acertou, `Exemplo de resposta: "${ex.respostaModelo}"`, () => resolve({ acertou, tentativas }));
      }));
    });
  },

  dialogo(container, ex) {
    return new Promise((resolve) => {
      let tentativas = 0;
      function mostrarNo(idNo) {
        limpar(container);
        const no = ex.nos.find((n) => n.id === idNo);
        container.appendChild(paragrafo(no.interlocutorFala, 'frase-alvo'));
        no.opcoes.forEach((opcao) => {
          container.appendChild(botao(opcao.texto, () => {
            tentativas += 1;
            if (opcao.proximoNo) mostrarNo(opcao.proximoNo);
            else resolve({ acertou: true, tentativas });
          }, 'botao-opcao'));
        });
      }
      mostrarNo(ex.nos[0].id);
    });
  }
};

function mostrarFeedbackEContinuar(container, acertou, explicacao, prosseguir) {
  const feedback = document.createElement('div');
  feedback.className = acertou ? 'feedback-acerto' : 'feedback-erro';
  feedback.appendChild(paragrafo(acertou ? '✅ Certo!' : '❌ Não foi desta vez.'));
  if (explicacao) feedback.appendChild(paragrafo(explicacao));
  container.appendChild(feedback);
  container.appendChild(botao('Continuar', prosseguir));
}
