/**
 * Detecção de sinais de risco de autoagressão.
 *
 * Um campo que convida as pessoas a descreverem momentos difíceis VAI receber
 * texto sobre sofrimento grave. Isso não é hipótese, é estatística. Quando
 * acontece, a resposta correta não é uma playlist — é interromper o fluxo e
 * oferecer ajuda.
 *
 * Isto NÃO é um diagnóstico e não substitui avaliação profissional. É uma rede
 * de segurança deliberadamente sensível: preferimos oferecer ajuda sem
 * necessidade a deixar passar alguém que precisava.
 */

/**
 * Expressões de risco direto. Mantidas explícitas de propósito — um dicionário
 * vago geraria falsos positivos em frases comuns ("morri de rir", "essa música
 * me mata").
 */
const SINAIS_RISCO = [
  "quero morrer",
  "vou me matar",
  "me matar",
  "suicidio",
  "me suicidar",
  "tirar minha vida",
  "acabar com minha vida",
  "acabar com tudo",
  "nao quero mais viver",
  "nao quero viver",
  "nao aguento mais viver",
  "desistir de viver",
  "melhor morrer",
  "queria estar morto",
  "queria nao existir",
  "me cortar",
  "me machucar",
  "sumir do mundo",
  "ninguem vai sentir minha falta",
];

/** Frases que contêm palavras de risco mas são inofensivas. */
const FALSOS_POSITIVOS = [
  "morri de rir",
  "morrendo de rir",
  "morri de vergonha",
  "morrendo de sono",
  "morrendo de fome",
  "morri de amor",
  "essa musica me mata",
  "de matar",
  "matar o tempo",
  "matar a saudade",
  "matar aula",
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export type ResultadoTriagem = {
  risco: boolean;
  /** Qual expressão disparou — para log interno, nunca exibido ao usuário. */
  sinal?: string;
};

export function triarRisco(texto: string): ResultadoTriagem {
  // Remove os trechos inofensivos ANTES de procurar sinais de risco.
  //
  // A versão anterior tratava falso positivo como veto global: qualquer
  // "morri de rir" no texto fazia a função retornar sem risco. Isso engolia
  // o sinal em frases como "morri de rir mais cedo, mas agora quero morrer"
  // — um falso negativo grave, encontrado pelos testes.
  //
  // Recortando só os trechos coloquiais, o que sobra ainda é analisado.
  let limpo = normalizar(texto);

  for (const frase of FALSOS_POSITIVOS) {
    limpo = limpo.split(normalizar(frase)).join(" ");
  }

  const sinal = SINAIS_RISCO.find((frase) => limpo.includes(normalizar(frase)));

  return sinal ? { risco: true, sinal } : { risco: false };
}

export type RecursoDeApoio = {
  nome: string;
  descricao: string;
  telefone?: string;
  url?: string;
};

/** Recursos de apoio no Brasil. */
export const RECURSOS_APOIO: RecursoDeApoio[] = [
  {
    nome: "CVV — Centro de Valorização da Vida",
    descricao: "Apoio emocional gratuito e sigiloso, 24 horas por dia.",
    telefone: "188",
    url: "https://www.cvv.org.br/",
  },
  {
    nome: "CAPS — Centro de Atenção Psicossocial",
    descricao: "Atendimento em saúde mental pelo SUS, sem custo.",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental",
  },
  {
    nome: "SAMU",
    descricao: "Em caso de emergência com risco imediato à vida.",
    telefone: "192",
  },
];

export const MENSAGEM_APOIO =
  "Percebemos que você pode estar passando por um momento muito difícil. " +
  "Você não precisa enfrentar isso sozinho, e conversar com alguém pode ajudar. " +
  "Se quiser, estamos aqui depois — mas agora o mais importante é você.";
