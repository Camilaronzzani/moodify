import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { RECURSOS_APOIO, triarRisco } from "./crise.ts";

/**
 * Testes da triagem de risco.
 *
 * Este é o código mais sensível do Moodify. Um falso NEGATIVO aqui significa
 * responder com uma playlist a alguém em sofrimento grave — por isso os testes
 * de "deve detectar" são mais importantes que os de "não deve".
 */

describe("triarRisco — deve detectar", () => {
  const comRisco = [
    "quero morrer",
    "vou me matar",
    "não quero mais viver",
    "nao aguento mais viver",
    "estou pensando em suicídio",
    "queria estar morto",
    "vou acabar com tudo",
    "penso em me machucar",
    "quero sumir do mundo",
    "ninguém vai sentir minha falta",
    "desistir de viver",
    "seria melhor morrer",
  ];

  for (const texto of comRisco) {
    test(`"${texto}"`, () => {
      assert.equal(triarRisco(texto).risco, true, `deveria detectar risco em: ${texto}`);
    });
  }
});

describe("triarRisco — variações de escrita", () => {
  test("ignora caixa alta", () => {
    assert.equal(triarRisco("QUERO MORRER").risco, true);
  });

  test("ignora acentos ausentes", () => {
    assert.equal(triarRisco("nao quero mais viver").risco, true);
    assert.equal(triarRisco("não quero mais viver").risco, true);
  });

  test("detecta no meio de um texto longo", () => {
    const texto =
      "hoje foi um dia terrível no trabalho, briguei com todo mundo e sinceramente " +
      "eu quero morrer, não sei mais o que fazer da minha vida";
    assert.equal(triarRisco(texto).risco, true);
  });

  test("tolera espaços repetidos", () => {
    assert.equal(triarRisco("quero    morrer").risco, true);
  });
});

describe("triarRisco — falsos positivos", () => {
  const semRisco = [
    "morri de rir hoje",
    "estou morrendo de sono",
    "morrendo de fome, vou almoçar",
    "morri de vergonha na apresentação",
    "essa música me mata de saudade",
    "só quero matar o tempo",
    "vou matar a saudade dos amigos",
    "matei aula ontem",
  ];

  for (const texto of semRisco) {
    test(`"${texto}"`, () => {
      assert.equal(triarRisco(texto).risco, false, `não deveria disparar em: ${texto}`);
    });
  }
});

describe("triarRisco — textos comuns do app", () => {
  const semRisco = [
    "hoje estou cansado, mas queria ouvir algo que me animasse",
    "estou muito feliz e animado",
    "preciso estudar e me concentrar",
    "vou treinar na academia",
    "estou triste e um pouco sozinho",
    "meu namoro acabou e estou mal",
    "",
    "   ",
  ];

  for (const texto of semRisco) {
    test(`"${texto.trim() || "(vazio)"}"`, () => {
      assert.equal(triarRisco(texto).risco, false);
    });
  }
});

describe("triarRisco — risco misturado com frase inofensiva", () => {
  /**
   * O caso que realmente importa: a pessoa usa uma expressão coloquial E
   * expressa risco no mesmo texto. Tratar falso positivo como veto global
   * faria o sinal de risco ser engolido — um falso negativo grave.
   */
  test("frase inofensiva não anula o sinal de risco", () => {
    const resultado = triarRisco("morri de rir mais cedo, mas agora eu quero morrer");
    assert.equal(resultado.risco, true, "o sinal de risco deve prevalecer");
  });

  test("ordem inversa também detecta", () => {
    const resultado = triarRisco("quero morrer, e olha que ontem morri de rir");
    assert.equal(resultado.risco, true);
  });

  test("dois inofensivos e um risco", () => {
    const resultado = triarRisco(
      "tava morrendo de sono e morri de rir, mas no fundo não quero mais viver",
    );
    assert.equal(resultado.risco, true);
  });
});

describe("triarRisco — retorno", () => {
  test("informa qual sinal disparou, para log interno", () => {
    const resultado = triarRisco("quero morrer");
    assert.equal(resultado.risco, true);
    assert.equal(typeof resultado.sinal, "string");
  });

  test("não devolve sinal quando não há risco", () => {
    assert.equal(triarRisco("estou feliz").sinal, undefined);
  });
});

describe("RECURSOS_APOIO", () => {
  test("inclui o CVV com o telefone 188", () => {
    const cvv = RECURSOS_APOIO.find((r) => r.nome.includes("CVV"));
    assert.ok(cvv, "o CVV precisa estar na lista");
    assert.equal(cvv.telefone, "188");
  });

  test("todo recurso tem nome e descrição preenchidos", () => {
    for (const recurso of RECURSOS_APOIO) {
      assert.ok(recurso.nome.length > 0);
      assert.ok(recurso.descricao.length > 0);
    }
  });

  test("todo recurso oferece pelo menos um caminho de contato", () => {
    for (const recurso of RECURSOS_APOIO) {
      assert.ok(
        recurso.telefone || recurso.url,
        `${recurso.nome} não tem telefone nem site — o usuário fica sem ação`,
      );
    }
  });
});
