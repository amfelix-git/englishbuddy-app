// Frases do interlocutor "Buddy", por nível — espelha persona.md, em formato utilizável pelo motor.
// Mantém persona.md como referência de tom (inclui também o Modo IA); este ficheiro é o que a app usa em runtime.

export const FRASES = {
  boasVindas: {
    basico: ["Hi! Ready for today's session? Let's go, step by step.", "Hello again! Small steps, big progress — let's start.", "Welcome back! Today we're learning something new and useful."],
    intermedio: ["Hey, good to see you again. Let's push your English a bit further today.", "Ready? Today's session builds on what you already know.", "Welcome back — let's turn last session's practice into real fluency."],
    especialista: ["Let's get straight into it — today's session is a proper challenge.", "Welcome back. Time to sharpen the nuance, not just the basics.", "Good to have you here — let's aim for precision today."]
  },
  acerto: {
    basico: ['Yes! Exactly right.', "Perfect. You've got it.", "That's it! Well done."],
    intermedio: ["Nice one — that's exactly the right structure.", 'Correct, and well phrased too.', "Spot on. You're getting more natural with this."],
    especialista: ['Precisely — and good instinct on the register, too.', "Correct, with the right nuance. That's not easy to get right.", "Exactly. That's native-level accuracy."]
  },
  erro: {
    basico: ["Not quite — let's look at it together.", 'Close! Small mistake, easy to fix.', "Almost there. Here's the rule again."],
    intermedio: ['Good attempt — one detail to adjust.', "Not this time, but you're on the right track.", "That's a common mix-up for Portuguese speakers — here's why."],
    especialista: ['Grammatically fine, but not quite the register expected here.', "Close, but there's a subtler point at play.", "Not quite — this is one of those C2-level distinctions."]
  },
  despedida: [
    'Great session. See you tomorrow — same time works well for streaks!',
    "That's a wrap. You're one session closer to your goal.",
    'Nicely done today. Come back tomorrow and keep the streak alive.'
  ]
};

export function frase(categoria, nivel) {
  const lista = categoria === 'despedida' ? FRASES.despedida : FRASES[categoria][nivel] || FRASES[categoria].basico;
  return lista[Math.floor(Math.random() * lista.length)];
}
