# Moodify API

Backend do Moodify — o cérebro do sistema. Interpreta o humor descrito pelo
usuário e devolve recomendações prontas, usando plataformas de streaming apenas
como catálogo.

Arquitetura completa em [`../ARQUITETURA.md`](../ARQUITETURA.md).

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

**Não precisa de nenhuma credencial para começar.** O padrão usa:

- `LexicoProvider` — classificador por palavras-chave, offline, sem custo
- `DeezerProvider` — catálogo público da Deezer, que não exige autenticação

## Endpoints

### `POST /v1/analises`

```bash
curl -X POST http://localhost:3333/v1/analises \
  -H "Content-Type: application/json" \
  -d '{"texto":"Hoje estou cansado, mas queria ouvir algo que me animasse.",
       "dispositivoId":"abc123def","limite":8}'
```

Resposta de recomendação:

```json
{
  "tipo": "recomendacao",
  "id": "analise-1785244022278",
  "perfil": {
    "emotion": "cansado", "context": "qualquer", "energy": "low",
    "tags": ["chill", "lo-fi", "ambient", "instrumental"],
    "confidence": 0.55,
    "emocaoNome": "Cansado", "emocaoEmoji": "😴", "energiaNome": "Baixa"
  },
  "mensagem": "Escolhemos faixas mais calmas...",
  "faixas": [
    {
      "titulo": "Luv (sic)", "artista": "Nujabes",
      "isrc": "JPH491605019",
      "previewUrl": "https://cdnt-preview.dzcdn.net/...",
      "urls": { "web": "https://www.deezer.com/track/...",
                "app": "deezer://www.deezer.com/track/..." },
      "motivos": ["chill", "lo-fi"], "score": 1.155
    }
  ],
  "diagnostico": { "providerIa": "lexico", "latenciaMs": 1356 }
}
```

Quando a triagem detecta risco de autoagressão, a resposta muda de forma —
**`tipo: "apoio"`, sem nenhuma faixa**:

```json
{
  "tipo": "apoio",
  "mensagem": "Percebemos que você pode estar passando por um momento...",
  "recursos": [{ "nome": "CVV — Centro de Valorização da Vida", "telefone": "188" }]
}
```

O app precisa tratar os dois tipos. Playlist nunca é a resposta certa aqui.

### `GET /v1/taxonomia`

Emoções, contextos e tags válidas. O app usa isso para montar os chips sem
duplicar a taxonomia no cliente.

### `POST /v1/eventos`

Telemetria. `tipo`: `exibida` · `aberta` · `favoritada` · `descartada` · `preview`.

Alimenta a anti-repetição hoje e o aprendizado de máquina depois. **Esses dados
não são recuperáveis retroativamente** — por isso são coletados desde já.

### `GET /saude`

Status e estatísticas do cache.

## Trocar de provider

```bash
# IA
AI_PROVIDER=lexico    # padrão: offline, sem custo
AI_PROVIDER=ollama    # exige Ollama rodando local

# Catálogo
MUSIC_PROVIDER=deezer    # padrão: sem credencial, tem ISRC e preview
MUSIC_PROVIDER=spotify   # exige SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET
```

Sem credenciais válidas do Spotify, o servidor avisa e cai na Deezer em vez de
falhar no boot.

## Estrutura

```
src/
├── dominio/              ← o cérebro, sem I/O, testável
│   ├── taxonomia.ts          listas fechadas de emoção, contexto e tag
│   ├── mapa-emocional.ts     emoção + contexto → tags com peso
│   ├── artistas-semente.ts   curadoria: tag → artistas
│   └── motor.ts              pontuação, diversidade, anti-repetição
├── providers/
│   ├── ia/                   AIProvider: lexico, ollama, cadeia com fallback
│   └── musica/               MusicProvider: deezer, spotify, cache
├── seguranca/crise.ts    ← triagem de risco, roda antes de tudo
├── dados/repositorio.ts  ← telemetria (JSONL hoje, Postgres depois)
└── app.ts                ← rotas e validação Zod
```

## LGPD

O texto que o usuário escreve **nunca vai para o disco**. Só o resultado
estruturado da análise é gravado:

```jsonl
{"id":"analise-...","perfil":{"emotion":"cansado",...},"latenciaMs":1356}
```

Texto livre sobre estado emocional é dado pessoal sensível — revela informação
sobre saúde mental. Se um dia for necessário guardá-lo (para treinar modelo,
por exemplo), exige consentimento separado e específico.

## Decisões que os testes forçaram

Três coisas só apareceram quando o fluxo rodou de verdade:

**1. Buscar tag como texto não funciona.** `track:"chill"` devolve músicas com
"chill" no título — a primeira versão recomendou *"Funk & Chill Guitar Backing
Track In D Minor"*. Por isso existe `artistas-semente.ts`: a curadoria diz quais
artistas combinam com a tag, e o catálogo traz as top faixas deles.

**2. Endpoints de "top faixas" omitem o ISRC.** Como o ISRC é o identificador
canônico do sistema, o motor faz um enriquecimento extra — só nas faixas que
sobram após a diversificação, em paralelo.

**3. Cache não é otimização, é requisito.** Cada análise dispara ~16 chamadas
(4 tags × 4 artistas). Sem cache a Deezer limita a taxa e devolve vazio, o que
zerou uma recomendação nos testes. Com cache: **1704ms → 1ms** na segunda
chamada da mesma emoção.

## Limitações conhecidas

- **Artista resolvido por nome é ambíguo.** Buscar "Nirvana" trouxe *Nirvana
  (UK)*, uma banda homônima dos anos 60. A correção é guardar o id do provider
  ou o MBID do MusicBrainz na semente, em vez de só o nome.
- **A semente é pequena** (~150 artistas). Cobre o essencial; a expansão via
  Last.fm (`tag.getTopArtists`) é o próximo passo.
- **Sem `DiscoveryProvider` ainda.** A interface está desenhada no documento de
  arquitetura, mas a implementação Last.fm não foi feita.
- **Telemetria em arquivo.** `RepositorioJsonl` não serve para produção com
  concorrência — é o passo antes do Postgres, atrás da mesma interface.
- **Sem autenticação nas rotas.** Qualquer cliente pode chamar. Antes de expor
  publicamente: rate limit por IP e chave de app.
