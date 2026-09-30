/**
 * Tipos do contrato com o backend.
 *
 * Espelham o que a API devolve. Mantidos aqui e não em `data/` porque agora a
 * fonte da verdade é o servidor — o app não decide mais nada disso.
 */

export type Energia = "low" | "medium" | "high";

export type PerfilEmocional = {
  emotion: string;
  /** O assunto do que a pessoa contou — término, luto, conquista... */
  theme: string;
  context: string;
  energy: Energia;
  tags: string[];
  keywords: string[];
  confidence: number;
  /** Já traduzidos pelo backend, prontos para exibir. */
  emocaoNome: string;
  emocaoEmoji: string;
  temaNome: string;
  contextoNome: string;
  energiaNome: string;
};

export type Intencao = "acolher" | "levantar";

export type Escolha = {
  intencao: Intencao;
  rotulo: string;
  descricao: string;
};

/**
 * Etapa 1: a leitura do momento e a pergunta.
 *
 * Chega em milissegundos porque nenhuma busca de catálogo acontece ainda —
 * a pessoa lê o acolhimento e escolhe sem esperar.
 */
export type RespostaAcolhimento = {
  tipo: "acolhimento";
  perfil: PerfilEmocional;
  mensagem: string;
  pergunta: string;
  escolhas: [Escolha, Escolha];
  diagnostico: { providerIa: string; latenciaMs: number };
};

export type Faixa = {
  providerId: string;
  provider: string;
  titulo: string;
  artista: string;
  album?: string;
  duracaoSegundos?: number;
  /** Identificador canônico da gravação. */
  isrc?: string;
  /** Trecho de 30s, quando o provider oferece. */
  previewUrl?: string;
  capaUrl?: string;
  urls: { web: string; app?: string };
  /** Tags que trouxeram esta faixa — o "porquê" da recomendação. */
  motivos: string[];
  score: number;
};

export type Diagnostico = {
  providerIa: string;
  providerMusica: string;
  tagsConsultadas: string[];
  latenciaMs: number;
};

/** Etapa 2: as faixas, já com a intenção que a pessoa escolheu. */
export type RespostaRecomendacao = {
  tipo: "recomendacao";
  id: string;
  intencao: Intencao;
  perfil: PerfilEmocional;
  mensagem: string;
  faixas: Faixa[];
  diagnostico: Diagnostico;
};

export type RecursoDeApoio = {
  nome: string;
  descricao: string;
  telefone?: string;
  url?: string;
};

/**
 * Resposta quando a triagem detecta risco de autoagressão.
 * Nunca traz faixas — playlist não é a resposta certa aqui.
 */
export type RespostaApoio = {
  tipo: "apoio";
  mensagem: string;
  recursos: RecursoDeApoio[];
};

export type RespostaAnalise = RespostaAcolhimento | RespostaApoio;

/** Estreitamento de tipo para as telas decidirem o que renderizar. */
export function ehApoio(resposta: RespostaAnalise): resposta is RespostaApoio {
  return resposta.tipo === "apoio";
}

export type Taxonomia = {
  emocoes: { slug: string; nome: string; emoji: string }[];
  contextos: { slug: string; nome: string }[];
  energias: { slug: string; nome: string }[];
  tags: string[];
};

export type TipoEvento =
  | "exibida"
  | "aberta"
  | "favoritada"
  | "descartada"
  | "preview"
  | "analise_iniciada"
  | "analise_concluida"
  | "analise_falhou"
  | "analise_abandonada";

export type Evento = {
  analiseId: string;
  faixaChave?: string;
  isrc?: string;
  tipo: TipoEvento;
  latenciaMs?: number;
  motivo?: string;
};

/** Chave canônica de faixa — a mesma regra usada no backend. */
export function chaveDeFaixa(faixa: Pick<Faixa, "artista" | "titulo">): string {
  const normalizar = (texto: string) =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  return `${normalizar(faixa.artista)}::${normalizar(faixa.titulo)}`;
}
