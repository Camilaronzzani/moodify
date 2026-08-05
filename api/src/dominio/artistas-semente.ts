import type { Tag } from "./taxonomia.ts";

/**
 * Semente de artistas por tag — a curadoria manual do Moodify.
 *
 * POR QUE ISTO EXISTE: nenhum provider de catálogo tem mais um endpoint que
 * traduza "estilo" em faixas. Buscar a tag como texto (`track:"chill"`)
 * devolve músicas com a palavra no título — lixo, não recomendação.
 *
 * Então a ponte entre emoção e música real é feita aqui: emoção → tags →
 * ARTISTAS curados → top faixas desses artistas no catálogo.
 *
 * É esta tabela que garante o princípio de que a IA nunca inventa artista:
 * quem escolhe são pessoas, e o catálogo só confirma que a faixa existe.
 *
 * Como crescer: a Last.fm (`tag.getTopArtists`) expande cada tag
 * automaticamente, com peso menor que a curadoria manual.
 */

export const ARTISTAS_POR_TAG: Record<Tag, string[]> = {
  // Clima emocional
  melancholic: ["Bon Iver", "Sufjan Stevens", "Phoebe Bridgers", "The National", "Lana Del Rey", "Elliott Smith"],
  uplifting: ["Coldplay", "The Beatles", "Stevie Wonder", "Earth, Wind & Fire", "Jungle", "Vulfpeck"],
  bittersweet: ["Lord Huron", "Fleet Foxes", "Iron & Wine", "Ben Howard", "Novos Baianos", "Cigarettes After Sex"],
  hopeful: ["Sigur Rós", "Explosions in the Sky", "Sufjan Stevens", "Bon Iver", "Hillsong United"],
  angry: ["Rage Against the Machine", "Metallica", "System of a Down", "Slipknot", "Linkin Park", "Sepultura"],
  romantic: ["Marvin Gaye", "Al Green", "Sade", "D'Angelo", "Djavan", "Tim Maia"],
  dreamy: ["Beach House", "Cocteau Twins", "Slowdive", "Mazzy Star", "Cigarettes After Sex", "Men I Trust"],

  // Momento
  "late night": ["Nujabes", "FKJ", "Tom Misch", "Sade", "Portishead", "Massive Attack"],
  "rainy day": ["Nick Drake", "Sufjan Stevens", "Bon Iver", "Agnes Obel", "Novos Baianos"],
  sunny: ["Jack Johnson", "Vampire Weekend", "Jorge Ben Jor", "Tim Maia", "Beach Boys"],
  roadtrip: ["Fleetwood Mac", "Tom Petty", "Lord Huron", "The War on Drugs", "Creedence Clearwater Revival"],

  // Função
  chill: ["Nujabes", "Bonobo", "Tycho", "Emancipator", "Men I Trust", "FKJ"],
  focus: ["Ludovico Einaudi", "Max Richter", "Ólafur Arnalds", "Nils Frahm", "Hania Rani"],
  study: ["Nujabes", "Idealism", "Ludovico Einaudi", "Max Richter", "Tycho"],
  workout: ["The Prodigy", "Kanye West", "Eminem", "The Weeknd", "Dua Lipa", "Racionais MC's"],
  sleep: ["Max Richter", "Brian Eno", "Nils Frahm", "Ólafur Arnalds", "Sigur Rós"],
  energetic: ["Dua Lipa", "Daft Punk", "Justice", "The Chemical Brothers", "Anitta", "Pabllo Vittar"],

  // Sonoridade
  acoustic: ["José González", "Nick Drake", "Iron & Wine", "Ben Howard", "Marisa Monte", "Djavan"],
  instrumental: ["Ludovico Einaudi", "Explosions in the Sky", "Godspeed You! Black Emperor", "Nils Frahm", "Hermeto Pascoal"],
  ambient: ["Brian Eno", "Aphex Twin", "Stars of the Lid", "Tim Hecker", "Hammock"],
  "lo-fi": ["Nujabes", "Idealism", "Jinsang", "Tomppabeats", "Knxwledge"],
  indie: ["Arctic Monkeys", "The Strokes", "Vampire Weekend", "Phoenix", "Los Hermanos", "Cansei de Ser Sexy"],
  folk: ["Bob Dylan", "Fleet Foxes", "Nick Drake", "Simon & Garfunkel", "Milton Nascimento"],
  "dream pop": ["Beach House", "Cocteau Twins", "Mazzy Star", "Slowdive", "Alvvays"],
  soul: ["Aretha Franklin", "Otis Redding", "Amy Winehouse", "Leon Bridges", "Tim Maia", "Jorge Ben Jor"],
  pop: ["Dua Lipa", "Taylor Swift", "The Weeknd", "Harry Styles", "Anitta", "Ivete Sangalo"],
  dance: ["Daft Punk", "Disclosure", "Calvin Harris", "Fred again..", "Pabllo Vittar"],
  rock: ["Queen", "Led Zeppelin", "Foo Fighters", "Nirvana", "Legião Urbana", "Titãs"],
  metal: ["Metallica", "Iron Maiden", "Black Sabbath", "Slipknot", "Sepultura"],
  jazz: ["Miles Davis", "John Coltrane", "Bill Evans", "Chet Baker", "Hermeto Pascoal"],
  classical: ["Ludovico Einaudi", "Max Richter", "Claude Debussy", "Erik Satie", "Frédéric Chopin"],
};

/**
 * Sorteia artistas de uma tag de forma estável para a mesma semente.
 *
 * Rotação em vez de aleatório puro: o mesmo usuário no mesmo dia recebe o
 * mesmo resultado (previsível, testável, cacheável), mas análises diferentes
 * pegam artistas diferentes — o que evita devolver sempre os mesmos nomes.
 */
export function sortearArtistas(tag: Tag, quantidade: number, semente: number): string[] {
  const todos = ARTISTAS_POR_TAG[tag] ?? [];

  if (todos.length === 0) {
    return [];
  }

  const inicio = semente % todos.length;

  return Array.from({ length: Math.min(quantidade, todos.length) }, (_, i) => {
    return todos[(inicio + i) % todos.length]!;
  });
}
