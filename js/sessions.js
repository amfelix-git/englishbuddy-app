// Motor de sessões e progressão. Uma "unidade" de conteúdo (~10 min) pode ser servida como
// 1 sessão diária (plano de 10 min) ou dividida em 2 sessões diárias (plano de 5 min),
// cobrindo sempre o MESMO conteúdo total — só fatiado de forma diferente.
import { getProgress, saveProgress } from './db.js';

export const CONTEUDO_UNIDADE_MIN = 10;

// Nº de unidades de conteúdo por nível. Soma = 365 (percurso de referência a 10 min/dia).
// A 5 min/dia, cada unidade vira 2 sessões, logo o percurso equivalente é de 730 sessões.
export const NIVEIS = {
  basico: { unidades: 110, proximo: 'intermedio' },
  intermedio: { unidades: 140, proximo: 'especialista' },
  especialista: { unidades: 115, proximo: null }
};

export function totalSessoesPercurso(tempoDiarioMin) {
  const totalUnidades = Object.values(NIVEIS).reduce((soma, n) => soma + n.unidades, 0);
  return tempoDiarioMin <= 5 ? totalUnidades * 2 : totalUnidades;
}

const indicesCache = {};
async function carregarIndice(nivel) {
  if (indicesCache[nivel]) return indicesCache[nivel];
  const resp = await fetch(`content/${nivel}/indice.json`);
  const indice = resp.ok ? await resp.json() : [];
  indicesCache[nivel] = indice;
  return indice;
}

const blocosCache = {};
async function carregarBloco(nivel, ficheiro) {
  const chave = `${nivel}/${ficheiro}`;
  if (blocosCache[chave]) return blocosCache[chave];
  const resp = await fetch(`content/${nivel}/${ficheiro}`);
  if (!resp.ok) return null;
  const dados = await resp.json();
  blocosCache[chave] = dados;
  return dados;
}

/** Devolve a unidade de conteúdo número `indiceUnidade1based` de um nível, ou null se ainda não existir. */
export async function carregarUnidade(nivel, indiceUnidade1based) {
  const indice = await carregarIndice(nivel);
  const bloco = indice.find((b) => indiceUnidade1based >= b.de && indiceUnidade1based <= b.ate);
  if (!bloco) return null;
  const dados = await carregarBloco(nivel, bloco.ficheiro);
  if (!dados) return null;
  return dados.find((u) => u.id === `${nivel}-${String(indiceUnidade1based).padStart(2, '0')}`) || null;
}

/** Corta os exercícios de uma unidade ao meio, para planos de 5 min/dia. metade: 0 ou 1. */
export function metadeDaUnidade(unidade, metade) {
  const meio = Math.ceil(unidade.exercicios.length / 2);
  const exercicios = metade === 0 ? unidade.exercicios.slice(0, meio) : unidade.exercicios.slice(meio);
  return { ...unidade, exercicios, tituloParte: metade === 0 ? 'Parte 1' : 'Parte 2' };
}

/**
 * Determina a próxima sessão a apresentar ao utilizador, de acordo com o progresso guardado
 * e o tempo diário escolhido. Devolve { nivel, unidade, fimDoConteudoDisponivel, nivelConcluido }.
 */
export async function proximaSessao(tempoDiarioMin) {
  const progresso = await getProgress();
  const config = NIVEIS[progresso.nivel];
  const indiceUnidade1based = progresso.sessaoIndice + 1;

  if (indiceUnidade1based > config.unidades) {
    return { fimDoNivel: true, nivel: progresso.nivel, proximoNivel: config.proximo };
  }

  const unidade = await carregarUnidade(progresso.nivel, indiceUnidade1based);
  if (!unidade) {
    return { fimDoConteudoDisponivel: true, nivel: progresso.nivel };
  }

  if (tempoDiarioMin <= 5) {
    const metade = progresso.metadeAtual || 0;
    return { nivel: progresso.nivel, unidade: metadeDaUnidade(unidade, metade), metade, indiceUnidade1based };
  }
  return { nivel: progresso.nivel, unidade, indiceUnidade1based };
}

/** Avança o progresso depois de uma sessão concluída. Devolve { nivelConcluido } se o nível terminou agora. */
export async function avancarProgresso(tempoDiarioMin) {
  const progresso = await getProgress();

  if (tempoDiarioMin <= 5 && (progresso.metadeAtual || 0) === 0) {
    await saveProgress({ metadeAtual: 1 });
    return { nivelConcluido: null };
  }

  const config = NIVEIS[progresso.nivel];
  const novoIndice = progresso.sessaoIndice + 1;
  const sessoesConcluidasTotal = progresso.sessoesConcluidasTotal + 1;

  if (novoIndice >= config.unidades) {
    if (config.proximo) {
      await saveProgress({ nivel: config.proximo, sessaoIndice: 0, metadeAtual: 0, sessoesConcluidasTotal });
    } else {
      await saveProgress({ sessaoIndice: novoIndice, metadeAtual: 0, sessoesConcluidasTotal });
    }
    return { nivelConcluido: progresso.nivel };
  }

  await saveProgress({ sessaoIndice: novoIndice, metadeAtual: 0, sessoesConcluidasTotal });
  return { nivelConcluido: null };
}
