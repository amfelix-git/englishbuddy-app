// Repetição espaçada — algoritmo SM-2 simplificado. Corre inteiramente no dispositivo.
import { getSrsItem, saveSrsItem, getSrsItensPendentes } from './db.js';

const QUALIDADE_ERRO = 1;
const QUALIDADE_ACERTO_DIFICIL = 3;
const QUALIDADE_ACERTO_FACIL = 5;

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function somarDias(dataISO, dias) {
  const d = new Date(dataISO + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Regista o resultado de uma revisão de um item (gramática ou vocabulário) e agenda a próxima.
 * qualidade: 1 (errou), 3 (acertou com esforço), 5 (acertou facilmente)
 */
export async function registarRevisao(itemId, qualidade) {
  let item = await getSrsItem(itemId);
  if (!item) {
    item = { itemId, easeFactor: 2.5, intervalo: 0, repeticoes: 0, proximaRevisao: hojeISO() };
  }

  if (qualidade < QUALIDADE_ACERTO_DIFICIL) {
    item.repeticoes = 0;
    item.intervalo = 1;
  } else {
    item.repeticoes += 1;
    if (item.repeticoes === 1) item.intervalo = 1;
    else if (item.repeticoes === 2) item.intervalo = 6;
    else item.intervalo = Math.round(item.intervalo * item.easeFactor);
  }

  item.easeFactor = Math.max(1.3, item.easeFactor + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02)));
  item.proximaRevisao = somarDias(hojeISO(), item.intervalo);

  await saveSrsItem(item);
  return item;
}

export function qualidadeParaResultado(acertou, tentativas) {
  if (!acertou) return QUALIDADE_ERRO;
  return tentativas <= 1 ? QUALIDADE_ACERTO_FACIL : QUALIDADE_ACERTO_DIFICIL;
}

/** Devolve os itens de SRS a rever hoje, para intercalar com o conteúdo novo da sessão. */
export async function itensParaReverHoje(limite = 5) {
  const pendentes = await getSrsItensPendentes(hojeISO());
  return pendentes.slice(0, limite);
}
