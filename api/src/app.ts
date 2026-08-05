import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { RepositorioJsonl, type Repositorio } from "./dados/repositorio.ts";
import { MotorRecomendacao } from "./dominio/motor.ts";
import {
  CONTEXTOS,
  EMOCOES,
  EMOJIS_EMOCAO,
  NOMES_CONTEXTO,
  NOMES_EMOCAO,
  NOMES_ENERGIA,
  TAGS,
} from "./dominio/taxonomia.ts";
import { AIComFallback } from "./providers/ia/com-fallback.ts";
import type { AIProvider } from "./providers/ia/contrato.ts";
import { LexicoProvider } from "./providers/ia/lexico.ts";
import { OllamaProvider } from "./providers/ia/ollama.ts";
import { MusicProviderComCache } from "./providers/musica/com-cache.ts";
import type { MusicProvider } from "./providers/musica/contrato.ts";
import { DeezerProvider } from "./providers/musica/deezer.ts";
import { SpotifyProvider } from "./providers/musica/spotify.ts";
import { MENSAGEM_APOIO, RECURSOS_APOIO, triarRisco } from "./seguranca/crise.ts";

/** Monta a cadeia de IA conforme o ambiente. O léxico é sempre o último. */
function montarIA(): AIComFallback {
  const providers: AIProvider[] = [];

  if ((process.env.AI_PROVIDER ?? "lexico") === "ollama") {
    providers.push(new OllamaProvider());
  }

  providers.push(new LexicoProvider());

  return new AIComFallback(providers);
}

function montarMusica(): MusicProviderComCache {
  let base: MusicProvider = new DeezerProvider();

  if ((process.env.MUSIC_PROVIDER ?? "deezer") === "spotify") {
    const spotify = new SpotifyProvider();

    // Sem credencial o Spotify não serve para nada — cai na Deezer, que
    // não exige autenticação, em vez de derrubar o servidor no boot.
    if (spotify.configurado) {
      base = spotify;
    } else {
      console.warn("[moodify] MUSIC_PROVIDER=spotify mas faltam credenciais. Usando Deezer.");
    }
  }

  // O cache não é opcional: sem ele cada análise dispara ~16 chamadas e o
  // provider começa a limitar a taxa, zerando recomendações.
  return new MusicProviderComCache(base);
}

const AnaliseSchema = z.object({
  texto: z.string().min(3, "Escreva um pouco mais sobre como você está.").max(300),
  /** Id anônimo do aparelho. Não identifica pessoa. */
  dispositivoId: z.string().min(6).max(64),
  limite: z.number().int().min(1).max(30).optional(),
});

/** Eventos de faixa exigem `faixaChave`; eventos de fluxo, não. */
const EventoSchema = z
  .object({
    analiseId: z.string().min(1),
    dispositivoId: z.string().min(6).max(64),
    faixaChave: z.string().min(1).optional(),
    isrc: z.string().optional(),
    tipo: z.enum([
      "exibida",
      "aberta",
      "favoritada",
      "descartada",
      "preview",
      "analise_iniciada",
      "analise_concluida",
      "analise_falhou",
      "analise_abandonada",
    ]),
    latenciaMs: z.number().int().min(0).optional(),
    motivo: z.string().max(200).optional(),
  })
  .refine((e) => e.tipo.startsWith("analise_") || Boolean(e.faixaChave), {
    message: "faixaChave é obrigatória em eventos de faixa",
    path: ["faixaChave"],
  });

export function criarApp(
  opcoes: { repositorio?: Repositorio; musica?: MusicProvider } = {},
) {
  const app = express();
  const repositorio = opcoes.repositorio ?? new RepositorioJsonl();
  const musica = opcoes.musica ?? montarMusica();
  const ia = montarIA();
  const motor = new MotorRecomendacao(musica);

  app.use(cors());
  app.use(express.json({ limit: "16kb" }));

  app.get("/saude", (_req, res) => {
    res.json({
      ok: true,
      ia: ia.nome,
      musica: musica.nome,
      cache: musica instanceof MusicProviderComCache ? musica.estatisticas : undefined,
    });
  });

  /** Alimenta os chips da Home sem o app precisar duplicar a taxonomia. */
  app.get("/v1/taxonomia", (_req, res) => {
    res.json({
      emocoes: EMOCOES.map((slug) => ({
        slug,
        nome: NOMES_EMOCAO[slug],
        emoji: EMOJIS_EMOCAO[slug],
      })),
      contextos: CONTEXTOS.map((slug) => ({ slug, nome: NOMES_CONTEXTO[slug] })),
      energias: Object.entries(NOMES_ENERGIA).map(([slug, nome]) => ({ slug, nome })),
      tags: TAGS,
    });
  });

  app.post("/v1/analises", async (req, res, next) => {
    const inicio = Date.now();

    try {
      const entrada = AnaliseSchema.parse(req.body);

      // Triagem de risco ANTES de qualquer análise musical. Se alguém está
      // em sofrimento grave, a resposta certa não é uma playlist.
      const triagem = triarRisco(entrada.texto);

      if (triagem.risco) {
        await repositorio.salvarAnalise({
          id: `analise-${Date.now()}`,
          dispositivoId: entrada.dispositivoId,
          perfil: {
            emotion: "triste",
            context: "qualquer",
            energy: "low",
            tags: [],
            keywords: [],
            confidence: 0,
          },
          providerIa: "triagem",
          providerMusica: "nenhum",
          quantidadeFaixas: 0,
          latenciaMs: Date.now() - inicio,
          criadaEm: new Date().toISOString(),
          triagemRisco: true,
        });

        // 200, não erro: para o app isto é uma resposta válida e prevista.
        res.json({
          tipo: "apoio",
          mensagem: MENSAGEM_APOIO,
          recursos: RECURSOS_APOIO,
        });
        return;
      }

      const perfil = await ia.analisarHumor(entrada.texto);
      const jaVistas = await repositorio.faixasJaVistas(entrada.dispositivoId);

      const recomendacao = await motor.recomendar(perfil, {
        limite: entrada.limite,
        market: process.env.MUSIC_MARKET ?? "BR",
        jaVistas,
        // Rotaciona a curadoria por análise, então repetir a mesma emoção
        // não devolve exatamente os mesmos artistas.
        semente: jaVistas.size,
      });

      const id = `analise-${Date.now()}`;
      const latenciaMs = Date.now() - inicio;

      // Telemetria: resultado, nunca o texto do usuário.
      await repositorio.salvarAnalise({
        id,
        dispositivoId: entrada.dispositivoId,
        perfil,
        providerIa: ia.ultimoProviderUsado,
        providerMusica: recomendacao.origem.musica,
        quantidadeFaixas: recomendacao.faixas.length,
        latenciaMs,
        criadaEm: new Date().toISOString(),
      });

      res.json({
        tipo: "recomendacao",
        id,
        perfil: {
          ...perfil,
          emocaoNome: NOMES_EMOCAO[perfil.emotion],
          emocaoEmoji: EMOJIS_EMOCAO[perfil.emotion],
          contextoNome: NOMES_CONTEXTO[perfil.context],
          energiaNome: NOMES_ENERGIA[perfil.energy],
        },
        mensagem: recomendacao.mensagem,
        faixas: recomendacao.faixas,
        diagnostico: {
          providerIa: ia.ultimoProviderUsado,
          providerMusica: recomendacao.origem.musica,
          tagsConsultadas: recomendacao.origem.tagsConsultadas,
          falhas: ia.ultimasFalhas,
          latenciaMs,
        },
      });
    } catch (erro) {
      next(erro);
    }
  });

  app.post("/v1/eventos", async (req, res, next) => {
    try {
      const entrada = EventoSchema.parse(req.body);
      await repositorio.salvarEvento({ ...entrada, criadoEm: new Date().toISOString() });
      res.status(204).end();
    } catch (erro) {
      next(erro);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof z.ZodError) {
      res.status(400).json({
        erro: "Dados inválidos",
        detalhes: erro.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })),
      });
      return;
    }

    console.error("[moodify] erro não tratado:", erro);
    res.status(500).json({ erro: "Erro interno" });
  });

  return app;
}
