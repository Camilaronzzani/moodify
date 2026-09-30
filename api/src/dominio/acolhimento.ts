import {
  NOMES_EMOCAO,
  type Emocao,
  type Intencao,
  type Tema,
} from "./taxonomia.ts";

/**
 * Mensagens de acolhimento e as escolhas oferecidas.
 *
 * O app não decide o que a pessoa precisa ouvir — ele reconhece o que ela
 * contou e pergunta. Um app que responde "aqui está sua playlist" a alguém
 * que acabou de terminar um relacionamento presume demais.
 *
 * Este arquivo é a voz do produto. Nenhuma frase aqui promete cura,
 * diagnostica ou minimiza ("vai passar", "pense positivo").
 */

export type Escolha = {
  intencao: Intencao;
  rotulo: string;
  descricao: string;
};

export type Acolhimento = {
  /** Frase que reconhece o que a pessoa contou. */
  mensagem: string;
  /** Pergunta que abre a escolha. */
  pergunta: string;
  escolhas: [Escolha, Escolha];
};

/** Reconhecimento por tema — o mais específico que temos. */
const POR_TEMA: Partial<Record<Tema, { mensagem: string; pergunta: string }>> = {
  termino: {
    mensagem:
      "Sinto muito. Terminar um relacionamento mexe com tudo, e não existe " +
      "jeito certo de atravessar isso.",
    pergunta: "Que tipo de música você quer agora?",
  },
  luto: {
    mensagem:
      "Sinto muito pela sua perda. Não vou tentar dizer nada que conserte " +
      "isso — algumas coisas só se atravessa.",
    pergunta: "Como você quer que a música te acompanhe?",
  },
  solidao: {
    mensagem:
      "Estar sozinho pesa, mesmo quando a gente tenta fingir que não. " +
      "Você não é o único a sentir isso.",
    pergunta: "O que você prefere ouvir?",
  },
  saudade: {
    mensagem:
      "Saudade é estranha assim: dói e ao mesmo tempo a gente não quer " +
      "deixar de sentir.",
    pergunta: "Quer ficar nessa lembrança ou sair um pouco dela?",
  },
  conquista: {
    mensagem: "Que bom! Isso merece ser comemorado do jeito que você quiser.",
    pergunta: "Como você quer celebrar?",
  },
  mudanca: {
    mensagem:
      "Começar algo novo dá uma mistura esquisita de medo e vontade. As duas " +
      "coisas cabem aqui.",
    pergunta: "Que trilha combina com esse momento?",
  },
  sobrecarga: {
    mensagem:
      "Dar conta de tudo cansa de um jeito que nem sempre o descanso resolve. " +
      "Você não precisa render nada agora.",
    pergunta: "Do que você precisa neste momento?",
  },
};

/** Reconhecimento por emoção, quando não há tema identificado. */
const POR_EMOCAO: Partial<Record<Emocao, { mensagem: string; pergunta: string }>> = {
  triste: {
    mensagem: "Dias assim existem, e está tudo bem não estar bem.",
    pergunta: "Que tipo de música você quer agora?",
  },
  melancolico: {
    mensagem: "Aquele peso meio sem nome, que não é exatamente tristeza.",
    pergunta: "Quer ficar nesse clima ou mudar de ar?",
  },
  cansado: {
    mensagem: "Cansaço também precisa de trilha sonora — e não precisa ser animada.",
    pergunta: "O que ajuda mais agora?",
  },
  ansioso: {
    mensagem: "Quando a cabeça acelera, o som certo ajuda a diminuir o ritmo.",
    pergunta: "Como você quer se sentir?",
  },
  irritado: {
    mensagem: "Raiva pede vazão. Pode ser no volume alto ou no silêncio.",
    pergunta: "Por onde você quer ir?",
  },
  feliz: {
    mensagem: "Que bom te encontrar assim.",
    pergunta: "Como você quer manter esse astral?",
  },
  animado: {
    mensagem: "Essa energia merece a trilha certa.",
    pergunta: "Para onde vamos?",
  },
  apaixonado: {
    mensagem: "Esse estado tem música própria.",
    pergunta: "Que tipo de música combina?",
  },
  nostalgico: {
    mensagem: "Aquela sensação de estar em dois tempos ao mesmo tempo.",
    pergunta: "Quer mergulhar na lembrança?",
  },
  calmo: {
    mensagem: "Um momento tranquilo — vamos manter assim.",
    pergunta: "Como você quer seguir?",
  },
  focado: {
    mensagem: "Vamos montar o fundo certo para você render.",
    pergunta: "Que tipo de som ajuda você?",
  },
  reflexivo: {
    mensagem: "Momento de pensar nas coisas.",
    pergunta: "Que tipo de música combina agora?",
  },
};

/** Rótulos da escolha, adaptados ao que a pessoa está sentindo. */
const ESCOLHAS_POR_EMOCAO: Partial<Record<Emocao, [Escolha, Escolha]>> = {
  triste: [
    {
      intencao: "acolher",
      rotulo: "Quero sentir isso",
      descricao: "Músicas que abraçam a tristeza — chorar também resolve",
    },
    {
      intencao: "levantar",
      rotulo: "Quero me levantar",
      descricao: "Músicas que dão força para sair daqui",
    },
  ],
  melancolico: [
    {
      intencao: "acolher",
      rotulo: "Ficar nesse clima",
      descricao: "Músicas que combinam com o peso do momento",
    },
    {
      intencao: "levantar",
      rotulo: "Mudar de ar",
      descricao: "Músicas mais leves, para clarear",
    },
  ],
  cansado: [
    {
      intencao: "acolher",
      rotulo: "Quero desacelerar",
      descricao: "Músicas calmas, sem exigir nada de você",
    },
    {
      intencao: "levantar",
      rotulo: "Preciso de energia",
      descricao: "Músicas para recarregar o ânimo",
    },
  ],
  irritado: [
    {
      intencao: "acolher",
      rotulo: "Quero extravasar",
      descricao: "Peso e volume para descarregar",
    },
    {
      intencao: "levantar",
      rotulo: "Quero me acalmar",
      descricao: "Músicas para baixar a fervura",
    },
  ],
  ansioso: [
    {
      intencao: "acolher",
      rotulo: "Quero respirar",
      descricao: "Sons que ajudam a diminuir o ritmo",
    },
    {
      intencao: "levantar",
      rotulo: "Quero me distrair",
      descricao: "Músicas para tirar a cabeça daí",
    },
  ],
};

/** Escolhas padrão, para emoções que não pedem redação própria. */
const ESCOLHAS_PADRAO: [Escolha, Escolha] = [
  {
    intencao: "acolher",
    rotulo: "Combinar com o momento",
    descricao: "Músicas que acompanham como você está",
  },
  {
    intencao: "levantar",
    rotulo: "Levantar o astral",
    descricao: "Músicas para mudar a energia",
  },
];

export function montarAcolhimento(emocao: Emocao, tema: Tema): Acolhimento {
  // O tema é mais específico que a emoção; quando existe, ele fala primeiro.
  const texto =
    POR_TEMA[tema] ??
    POR_EMOCAO[emocao] ?? {
      mensagem: `Entendi: ${NOMES_EMOCAO[emocao].toLowerCase()}.`,
      pergunta: "Que tipo de música você quer agora?",
    };

  return {
    mensagem: texto.mensagem,
    pergunta: texto.pergunta,
    escolhas: ESCOLHAS_POR_EMOCAO[emocao] ?? ESCOLHAS_PADRAO,
  };
}
