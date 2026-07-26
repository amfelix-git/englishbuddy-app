// Gamificação local — streaks, pontos, badges. Tudo sem servidor.
import { getGamification, saveGamification } from './db.js';

const BADGES = {
  'primeira-sessao': 'Primeira sessão concluída!',
  'streak-7': '7 dias seguidos — hábito a formar-se!',
  'streak-30': '30 dias seguidos — consistência a sério!',
  'nivel-basico-completo': 'Nível Básico concluído!',
  'nivel-intermedio-completo': 'Nível Intermédio concluído!',
  'nivel-especialista-completo': 'Nível Especialista concluído — parabéns!'
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/** Atualiza streak, pontos e badges no final de uma sessão. Devolve os badges novos (se houver). */
export async function registarConclusaoSessao({ pontosGanhos, primeiraSessaoDeSempre, nivelConcluido }) {
  const g = await getGamification();
  const hoje = hojeISO();
  const novosBadges = [];

  let streak = g.streakAtual;
  if (!g.ultimaSessaoData) {
    streak = 1;
  } else {
    const gap = diasEntre(g.ultimaSessaoData, hoje);
    if (gap === 0) streak = g.streakAtual; // mais do que uma sessão no mesmo dia não duplica o streak
    else if (gap === 1) streak = g.streakAtual + 1;
    else streak = 1; // quebrou a sequência
  }

  const badgesAtuais = new Set(g.badges);
  if (primeiraSessaoDeSempre && !badgesAtuais.has('primeira-sessao')) novosBadges.push('primeira-sessao');
  if (streak === 7 && !badgesAtuais.has('streak-7')) novosBadges.push('streak-7');
  if (streak === 30 && !badgesAtuais.has('streak-30')) novosBadges.push('streak-30');
  if (nivelConcluido) {
    const idBadge = `nivel-${nivelConcluido}-completo`;
    if (!badgesAtuais.has(idBadge)) novosBadges.push(idBadge);
  }
  novosBadges.forEach((b) => badgesAtuais.add(b));

  const atualizado = await saveGamification({
    streakAtual: streak,
    streakMaximo: Math.max(g.streakMaximo, streak),
    ultimaSessaoData: hoje,
    pontosTotais: g.pontosTotais + pontosGanhos,
    badges: Array.from(badgesAtuais)
  });

  return { estado: atualizado, novosBadges: novosBadges.map((id) => ({ id, texto: BADGES[id] })) };
}

export function textoBadge(id) {
  return BADGES[id] || id;
}
