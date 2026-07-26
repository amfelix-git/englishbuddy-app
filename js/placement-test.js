// Teste de nivelamento curto — 12 perguntas, sugere nível de partida. O utilizador pode sempre escolher outro.
export const PERGUNTAS_NIVELAMENTO = [
  { pergunta: 'She ___ a doctor.', opcoes: ['is', 'am', 'are'], correta: 0, peso: 'basico' },
  { pergunta: "I ___ 30 years old.", opcoes: ['have', 'am', 'is'], correta: 1, peso: 'basico' },
  { pergunta: 'They ___ to work by car every day.', opcoes: ['go', 'goes', 'going'], correta: 0, peso: 'basico' },
  { pergunta: '___ you like coffee?', opcoes: ['Are', 'Do', 'Does'], correta: 1, peso: 'basico' },
  { pergunta: 'I ___ this city since 2015.', opcoes: ['live in', 'am living in', 'have lived in'], correta: 2, peso: 'intermedio' },
  { pergunta: 'If I ___ more time, I would travel more.', opcoes: ['have', 'had', 'would have'], correta: 1, peso: 'intermedio' },
  { pergunta: 'The report ___ by the team yesterday.', opcoes: ['wrote', 'was written', 'is written'], correta: 1, peso: 'intermedio' },
  { pergunta: 'She said she ___ tired.', opcoes: ['is', 'was', 'be'], correta: 1, peso: 'intermedio' },
  { pergunta: 'Never ___ such a beautiful sunset.', opcoes: ['I have seen', 'have I seen', 'I saw'], correta: 1, peso: 'especialista' },
  { pergunta: 'It is essential that he ___ present at the meeting.', opcoes: ['is', 'be', 'was'], correta: 1, peso: 'especialista' },
  { pergunta: 'Had it not ___ for her help, we would have failed.', opcoes: ['being', 'been', 'be'], correta: 1, peso: 'especialista' },
  { pergunta: 'What I need ___ a bit more time.', opcoes: ['is', 'are', 'be'], correta: 0, peso: 'especialista' }
];

/** Calcula um nível sugerido a partir das respostas (array de índices escolhidos, mesma ordem das perguntas). */
export function sugerirNivel(respostas) {
  let pontos = { basico: 0, intermedio: 0, especialista: 0 };
  PERGUNTAS_NIVELAMENTO.forEach((p, i) => {
    if (respostas[i] === p.correta) pontos[p.peso] += 1;
  });
  const totalCertas = pontos.basico + pontos.intermedio + pontos.especialista;
  if (totalCertas <= 3) return 'basico';
  if (pontos.especialista >= 3) return 'especialista';
  if (pontos.intermedio >= 2) return 'intermedio';
  return 'basico';
}
