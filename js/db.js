// Camada de dados — IndexedDB via Dexie. Tudo local, zero custo, zero servidor.
export const db = new Dexie('englishbuddy');

db.version(1).stores({
  profile: 'id',
  progress: 'id',
  sessionResults: '++id, sessaoId, data',
  srsItems: 'itemId, proximaRevisao',
  gamification: 'id'
});

const PROFILE_ID = 'perfil-unico';
const PROGRESS_ID = 'progresso-unico';
const GAMIFICATION_ID = 'gamificacao-unica';

export const DEFAULT_PROFILE = {
  id: PROFILE_ID,
  onboardingCompleto: false,
  generoUtilizador: null,
  areasInteresse: [],
  sotaque: 'en-GB',
  generoInterlocutor: 'F',
  tempoDiarioMin: 10,
  nivelAtual: 'basico'
};

const DEFAULT_PROGRESS = {
  id: PROGRESS_ID,
  nivel: 'basico',
  sessaoIndice: 0, // próxima sessão a fazer (0-based) dentro do nível atual
  sessoesConcluidasTotal: 0
};

const DEFAULT_GAMIFICATION = {
  id: GAMIFICATION_ID,
  streakAtual: 0,
  streakMaximo: 0,
  ultimaSessaoData: null,
  pontosTotais: 0,
  badges: []
};

export async function getProfile() {
  const p = await db.profile.get(PROFILE_ID);
  return p || DEFAULT_PROFILE;
}

export async function saveProfile(partial) {
  const atual = await getProfile();
  const novo = { ...atual, ...partial, id: PROFILE_ID };
  await db.profile.put(novo);
  return novo;
}

export async function getProgress() {
  const p = await db.progress.get(PROGRESS_ID);
  return p || DEFAULT_PROGRESS;
}

export async function saveProgress(partial) {
  const atual = await getProgress();
  const novo = { ...atual, ...partial, id: PROGRESS_ID };
  await db.progress.put(novo);
  return novo;
}

export async function getGamification() {
  const g = await db.gamification.get(GAMIFICATION_ID);
  return g || DEFAULT_GAMIFICATION;
}

export async function saveGamification(partial) {
  const atual = await getGamification();
  const novo = { ...atual, ...partial, id: GAMIFICATION_ID };
  await db.gamification.put(novo);
  return novo;
}

export async function registarResultadoSessao(resultado) {
  await db.sessionResults.add({ ...resultado, data: new Date().toISOString() });
}

export async function getSrsItem(itemId) {
  return db.srsItems.get(itemId);
}

export async function saveSrsItem(item) {
  await db.srsItems.put(item);
}

export async function getSrsItensPendentes(hojeISO) {
  return db.srsItems.where('proximaRevisao').belowOrEqual(hojeISO).toArray();
}

/** Exporta todo o progresso do utilizador para um objeto serializável em JSON. */
export async function exportarProgresso() {
  const [profile, progress, gamification, sessionResults, srsItems] = await Promise.all([
    db.profile.toArray(),
    db.progress.toArray(),
    db.gamification.toArray(),
    db.sessionResults.toArray(),
    db.srsItems.toArray()
  ]);
  return {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    profile, progress, gamification, sessionResults, srsItems
  };
}

/** Importa um objeto anteriormente exportado, substituindo os dados atuais. */
export async function importarProgresso(dados) {
  if (!dados || dados.versao !== 1) {
    throw new Error('Ficheiro de progresso inválido ou de uma versão incompatível.');
  }
  await db.transaction('rw', db.profile, db.progress, db.gamification, db.sessionResults, db.srsItems, async () => {
    await Promise.all([
      db.profile.clear(), db.progress.clear(), db.gamification.clear(),
      db.sessionResults.clear(), db.srsItems.clear()
    ]);
    await Promise.all([
      db.profile.bulkAdd(dados.profile || []),
      db.progress.bulkAdd(dados.progress || []),
      db.gamification.bulkAdd(dados.gamification || []),
      db.sessionResults.bulkAdd(dados.sessionResults || []),
      db.srsItems.bulkAdd(dados.srsItems || [])
    ]);
  });
}
