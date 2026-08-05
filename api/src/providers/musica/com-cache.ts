import type { Album, Artista, Faixa, MusicProvider } from "./contrato.ts";

/**
 * Cache em memória por cima de qualquer MusicProvider.
 *
 * POR QUE É NECESSÁRIO, não opcional:
 * a curadoria tem ~150 artistas fixos, e as top faixas deles não mudam de
 * minuto a minuto. Sem cache, cada análise dispara ~16 chamadas de rede
 * (4 tags × 4 artistas) e o provider bate no limite de taxa — nos nossos
 * testes a Deezer começou a devolver vazio, o que zerou uma recomendação.
 *
 * Implementa a mesma interface, então o motor não sabe que existe.
 * Trocar por Redis depois é implementar esta mesma classe de novo.
 */

type Entrada<T> = { valor: T; expiraEm: number };

const TTL_PADRAO_MS = 6 * 60 * 60 * 1000; // 6h — catálogo muda devagar
const MAX_ENTRADAS = 2_000;

export class MusicProviderComCache implements MusicProvider {
  readonly nome: string;

  private readonly cache = new Map<string, Entrada<unknown>>();
  private acertos = 0;
  private faltas = 0;

  constructor(
    private readonly interno: MusicProvider,
    private readonly ttlMs = TTL_PADRAO_MS,
  ) {
    this.nome = interno.nome;
  }

  get estatisticas() {
    const total = this.acertos + this.faltas;
    return {
      acertos: this.acertos,
      faltas: this.faltas,
      taxaAcerto: total === 0 ? 0 : Number((this.acertos / total).toFixed(2)),
      entradas: this.cache.size,
    };
  }

  private async memoizar<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
    const guardado = this.cache.get(chave);

    if (guardado && Date.now() < guardado.expiraEm) {
      this.acertos++;
      return guardado.valor as T;
    }

    this.faltas++;
    const valor = await buscar();

    // Descarta a entrada mais antiga quando lota (FIFO simples: o primeiro
    // item de um Map é o mais antigo inserido).
    if (this.cache.size >= MAX_ENTRADAS) {
      const maisAntiga = this.cache.keys().next().value;
      if (maisAntiga !== undefined) {
        this.cache.delete(maisAntiga);
      }
    }

    this.cache.set(chave, { valor, expiraEm: Date.now() + this.ttlMs });
    return valor;
  }

  buscarFaixa(titulo: string, artista?: string, market?: string): Promise<Faixa[]> {
    return this.memoizar(`faixa:${titulo}:${artista ?? ""}:${market ?? ""}`, () =>
      this.interno.buscarFaixa(titulo, artista, market),
    );
  }

  buscarArtista(nome: string, market?: string): Promise<Artista[]> {
    return this.memoizar(`artista:${nome}:${market ?? ""}`, () =>
      this.interno.buscarArtista(nome, market),
    );
  }

  buscarAlbum(termo: string, market?: string): Promise<Album[]> {
    return this.memoizar(`album:${termo}:${market ?? ""}`, () =>
      this.interno.buscarAlbum(termo, market),
    );
  }

  obterFaixa(providerId: string): Promise<Faixa | null> {
    return this.memoizar(`obter:${providerId}`, () => this.interno.obterFaixa(providerId));
  }

  obterFaixaPorISRC(isrc: string, market?: string): Promise<Faixa | null> {
    return this.memoizar(`isrc:${isrc}:${market ?? ""}`, () =>
      this.interno.obterFaixaPorISRC(isrc, market),
    );
  }

  topFaixasDoArtista(nome: string, limite?: number, market?: string): Promise<Faixa[]> {
    return this.memoizar(`top:${nome}:${limite ?? 5}:${market ?? ""}`, () =>
      this.interno.topFaixasDoArtista(nome, limite, market),
    );
  }
}
