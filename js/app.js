import { getProfile, saveProfile, getProgress, saveProgress, getGamification, exportarProgresso, importarProgresso, registarResultadoSessao } from './db.js';
import { falar } from './voice.js';
import { renderExercicio } from './exercises.js';
import { frase } from './persona-frases.js';
import { PERGUNTAS_NIVELAMENTO, sugerirNivel } from './placement-test.js';
import { proximaSessao, avancarProgresso, totalSessoesPercurso, NIVEIS } from './sessions.js';
import { registarRevisao, qualidadeParaResultado } from './srs.js';
import { registarConclusaoSessao, textoBadge } from './gamification.js';

const ecras = {};
document.querySelectorAll('[data-ecra]').forEach((el) => { ecras[el.dataset.ecra] = el; });

function mostrarEcra(id) {
  Object.values(ecras).forEach((el) => el.classList.add('escondido'));
  ecras[id].classList.remove('escondido');
}

let perfil = null;
let progresso = null;

async function iniciar() {
  perfil = await getProfile();
  progresso = await getProgress();
  ligarDefinicoes();
  ligarExportarImportar();
  if (!perfil.onboardingCompleto) {
    iniciarOnboarding();
  } else {
    mostrarEcraInicio();
  }
}

// --- Onboarding / teste de nivelamento ---

function iniciarOnboarding() {
  mostrarEcra('boas-vindas');
  document.getElementById('btn-comecar-teste').onclick = () => correrTesteNivelamento();
  document.getElementById('btn-saltar-teste').onclick = () => {
    perfil = { ...perfil, nivelAtual: 'basico' };
    mostrarEcraDefinicoesOnboarding();
  };
}

function correrTesteNivelamento() {
  mostrarEcra('teste-nivelamento');
  const container = document.getElementById('teste-nivelamento-container');
  container.innerHTML = '';
  const respostas = new Array(PERGUNTAS_NIVELAMENTO.length).fill(-1);

  PERGUNTAS_NIVELAMENTO.forEach((p, i) => {
    const bloco = document.createElement('div');
    bloco.className = 'pergunta-teste';
    const titulo = document.createElement('p');
    titulo.textContent = `${i + 1}. ${p.pergunta}`;
    bloco.appendChild(titulo);
    p.opcoes.forEach((opcao, j) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `pergunta-${i}`;
      input.addEventListener('change', () => { respostas[i] = j; });
      label.appendChild(input);
      label.appendChild(document.createTextNode(opcao));
      bloco.appendChild(label);
    });
    container.appendChild(bloco);
  });

  const btnSubmeter = document.createElement('button');
  btnSubmeter.className = 'botao-primario';
  btnSubmeter.textContent = 'Ver o meu nível sugerido';
  btnSubmeter.onclick = () => {
    const nivelSugerido = sugerirNivel(respostas);
    perfil = { ...perfil, nivelAtual: nivelSugerido };
    mostrarResultadoNivelamento(nivelSugerido);
  };
  container.appendChild(btnSubmeter);
}

function mostrarResultadoNivelamento(nivelSugerido) {
  mostrarEcra('resultado-nivelamento');
  document.getElementById('nivel-sugerido-texto').textContent =
    `Com base nas tuas respostas, sugerimos começar no nível: ${nomeNivel(nivelSugerido)}.`;
  document.getElementById('select-nivel-manual').value = nivelSugerido;
  document.getElementById('btn-confirmar-nivel').onclick = () => {
    perfil.nivelAtual = document.getElementById('select-nivel-manual').value;
    mostrarEcraDefinicoesOnboarding();
  };
}

function nomeNivel(nivel) {
  return { basico: 'Básico', intermedio: 'Intermédio', especialista: 'Especialista' }[nivel] || nivel;
}

function mostrarEcraDefinicoesOnboarding() {
  mostrarEcra('definicoes');
  document.getElementById('titulo-definicoes').textContent = 'Antes de começar, configura o teu Buddy';
  preencherFormularioDefinicoes();
  document.getElementById('btn-guardar-definicoes').onclick = async () => {
    await guardarDefinicoesDoFormulario();
    perfil = await saveProfile({ onboardingCompleto: true, nivelAtual: perfil.nivelAtual });
    progresso = await saveProgress({ nivel: perfil.nivelAtual, sessaoIndice: 0, metadeAtual: 0 });
    mostrarEcraInicio();
  };
}

// --- Definições (reutilizável a qualquer momento, não só no onboarding) ---

function ligarDefinicoes() {
  document.getElementById('btn-abrir-definicoes').onclick = () => {
    mostrarEcra('definicoes');
    document.getElementById('titulo-definicoes').textContent = 'Definições';
    preencherFormularioDefinicoes();
    document.getElementById('btn-guardar-definicoes').onclick = async () => {
      await guardarDefinicoesDoFormulario();
      mostrarEcraInicio();
    };
  };
  document.getElementById('btn-voltar-definicoes').onclick = () => mostrarEcraInicio();
}

function preencherFormularioDefinicoes() {
  document.getElementById('input-genero-utilizador').value = perfil.generoUtilizador || '';
  document.getElementById('input-sotaque').value = perfil.sotaque;
  document.getElementById('input-genero-interlocutor').value = perfil.generoInterlocutor;
  document.getElementById('input-tempo-diario').value = String(perfil.tempoDiarioMin);
  document.querySelectorAll('#lista-areas-interesse input[type=checkbox]').forEach((cb) => {
    cb.checked = (perfil.areasInteresse || []).includes(cb.value);
  });
  document.getElementById('input-modo-ia-ativo').checked = !!perfil.modoIaAtivo;
  document.getElementById('input-modo-ia-chave').value = perfil.modoIaChave || '';
  document.getElementById('input-modo-ia-fornecedor').value = perfil.modoIaFornecedor || 'google-gemini';
}

async function guardarDefinicoesDoFormulario() {
  const areasSelecionadas = Array.from(document.querySelectorAll('#lista-areas-interesse input[type=checkbox]:checked')).map((cb) => cb.value);
  perfil = await saveProfile({
    generoUtilizador: document.getElementById('input-genero-utilizador').value,
    sotaque: document.getElementById('input-sotaque').value,
    generoInterlocutor: document.getElementById('input-genero-interlocutor').value,
    tempoDiarioMin: Number(document.getElementById('input-tempo-diario').value),
    areasInteresse: areasSelecionadas,
    modoIaAtivo: document.getElementById('input-modo-ia-ativo').checked,
    modoIaChave: document.getElementById('input-modo-ia-chave').value,
    modoIaFornecedor: document.getElementById('input-modo-ia-fornecedor').value
  });
}

// --- Ecrã inicial / dashboard ---

async function mostrarEcraInicio() {
  mostrarEcra('inicio');
  progresso = await getProgress();
  const gam = await getGamification();
  document.getElementById('resumo-nivel').textContent = `Nível atual: ${nomeNivel(progresso.nivel)}`;
  document.getElementById('resumo-streak').textContent = `🔥 Sequência: ${gam.streakAtual} dia(s) (máximo: ${gam.streakMaximo})`;
  document.getElementById('resumo-pontos').textContent = `⭐ Pontos: ${gam.pontosTotais}`;
  document.getElementById('resumo-badges').textContent = gam.badges.length
    ? `Distintivos: ${gam.badges.map(textoBadge).join(', ')}`
    : 'Ainda sem distintivos — a primeira sessão dá logo um!';
  const totalPercurso = totalSessoesPercurso(perfil.tempoDiarioMin);
  document.getElementById('resumo-percurso').textContent = `Sessões concluídas: ${progresso.sessoesConcluidasTotal} de ~${totalPercurso}`;

  document.getElementById('btn-iniciar-sessao').onclick = () => iniciarSessao();
}

// --- Sessão ativa ---

let sessaoAtual = null;

async function iniciarSessao() {
  const dados = await proximaSessao(perfil.tempoDiarioMin);

  if (dados.fimDoNivel) {
    mostrarEcra('inicio');
    alert(dados.proximoNivel
      ? `Parabéns, concluíste o nível ${nomeNivel(dados.nivel)}! O próximo nível (${nomeNivel(dados.proximoNivel)}) vai abrir assim que o conteúdo estiver disponível.`
      : `Parabéns, concluíste TODOS os níveis disponíveis nesta versão da app!`);
    return;
  }
  if (dados.fimDoConteudoDisponivel) {
    mostrarEcra('inicio');
    alert('Ainda estás a par de todo o conteúdo já publicado para este nível — mais sessões chegam em breve.');
    return;
  }

  sessaoAtual = { unidade: dados.unidade, indiceExercicio: 0, acertos: 0, tentativasTotais: 0, inicioMs: Date.now() };
  mostrarEcra('sessao');
  document.getElementById('titulo-sessao').textContent = dados.unidade.tituloParte
    ? `${dados.unidade.titulo} — ${dados.unidade.tituloParte}`
    : dados.unidade.titulo;
  document.getElementById('mensagem-boas-vindas-sessao').textContent = frase('boasVindas', progresso.nivel);
  falar(frase('boasVindas', progresso.nivel), perfil.sotaque, perfil.generoInterlocutor).catch(() => {});

  correrProximoExercicio();
}

async function correrProximoExercicio() {
  const { unidade, indiceExercicio } = sessaoAtual;
  const barraProgresso = document.getElementById('barra-progresso-sessao');
  barraProgresso.style.width = `${Math.round((indiceExercicio / unidade.exercicios.length) * 100)}%`;

  if (indiceExercicio >= unidade.exercicios.length) {
    return concluirSessao();
  }

  const exercicio = unidade.exercicios[indiceExercicio];
  const container = document.getElementById('area-exercicio');
  const resultado = await renderExercicio(container, exercicio, { sotaque: perfil.sotaque, generoInterlocutor: perfil.generoInterlocutor });

  if (!resultado.semPontuacao) {
    sessaoAtual.tentativasTotais += 1;
    if (resultado.acertou) sessaoAtual.acertos += 1;
  }

  sessaoAtual.indiceExercicio += 1;
  correrProximoExercicio();
}

async function concluirSessao() {
  const { unidade, acertos, tentativasTotais, inicioMs } = sessaoAtual;
  const duracaoSegundos = Math.round((Date.now() - inicioMs) / 1000);

  // Repetição espaçada: regista revisão para cada item SRS da unidade (aproximação: usa a taxa de acerto geral da sessão).
  if (unidade.srsItens) {
    const qualidade = qualidadeParaResultado(tentativasTotais === 0 || acertos / Math.max(1, tentativasTotais) >= 0.6, 1);
    for (const item of unidade.srsItens) {
      await registarRevisao(item.id, qualidade);
    }
  }

  const { nivelConcluido } = await avancarProgresso(perfil.tempoDiarioMin);
  const progressoAnterior = progresso;
  progresso = await getProgress();

  const pontosGanhos = (unidade.gamificacao && unidade.gamificacao.pontosBase) || 10;
  const { novosBadges } = await registarConclusaoSessao({
    pontosGanhos,
    primeiraSessaoDeSempre: progressoAnterior.sessoesConcluidasTotal === 0,
    nivelConcluido
  });

  await registarResultadoSessao({ sessaoId: unidade.id, acertos, tentativasTotais, duracaoSegundos, pontosGanhos });

  mostrarEcra('fim-sessao');
  document.getElementById('mensagem-despedida-sessao').textContent = frase('despedida', progresso.nivel);
  document.getElementById('resumo-fim-sessao').textContent =
    `Acertaste ${acertos} de ${tentativasTotais} exercícios pontuáveis, em ${Math.round(duracaoSegundos / 60)} min. +${pontosGanhos} pontos.`;
  const listaBadges = document.getElementById('novos-badges');
  listaBadges.innerHTML = '';
  novosBadges.forEach((b) => {
    const li = document.createElement('li');
    li.textContent = `🏅 ${b.texto}`;
    listaBadges.appendChild(li);
  });

  document.getElementById('btn-voltar-inicio').onclick = () => mostrarEcraInicio();
  document.getElementById('btn-outra-sessao').onclick = () => iniciarSessao();
}

// --- Exportar / importar progresso ---

function ligarExportarImportar() {
  document.getElementById('btn-exportar-progresso').onclick = async () => {
    const dados = await exportarProgresso();
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `englishbuddy-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  document.getElementById('input-importar-progresso').addEventListener('change', async (evento) => {
    const ficheiro = evento.target.files[0];
    if (!ficheiro) return;
    try {
      const texto = await ficheiro.text();
      await importarProgresso(JSON.parse(texto));
      alert('Progresso importado com sucesso. A app vai recarregar.');
      location.reload();
    } catch (erro) {
      alert(`Não foi possível importar este ficheiro: ${erro.message}`);
    }
  });
}

iniciar();
