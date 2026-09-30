import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { LexicoProvider } from "./lexico.ts";

/**
 * Testes de reconhecimento de TEMA — o assunto do que a pessoa contou.
 *
 * Nasceram de um erro real: "acabei de terminar com a minha namorada" foi
 * classificado como APAIXONADO, porque a palavra "namorada" disparou a pista
 * de paixão e sobrepôs o tema. Responder com música romântica a quem acabou
 * de levar um fora é o tipo de falha que destrói confiança no produto.
 */

const lexico = new LexicoProvider();

describe("temas — término de relacionamento", () => {
  const textos = [
    "acabei de terminar com a minha namorada",
    "terminei com meu namorado ontem",
    "meu namoro acabou",
    "ela terminou comigo",
    "me deixou sem explicação",
    "fui largado",
    "estamos em separação",
  ];

  for (const texto of textos) {
    test(`"${texto}"`, async () => {
      const perfil = await lexico.analisarHumor(texto);
      assert.equal(perfil.theme, "termino", `tema errado para: ${texto}`);
      assert.notEqual(
        perfil.emotion,
        "apaixonado",
        "quem terminou não deve receber música romântica",
      );
    });
  }

  test("traz tags de coração partido, não de romance", async () => {
    const perfil = await lexico.analisarHumor("acabei de terminar com a minha namorada");
    assert.ok(
      perfil.tags.includes("heartbreak"),
      `esperava heartbreak nas tags, veio: ${perfil.tags.join(", ")}`,
    );
    assert.ok(!perfil.tags.includes("romantic"), "romantic não cabe num término");
  });
});

describe("temas — outros assuntos", () => {
  const casos: [string, string, string][] = [
    ["minha avó faleceu semana passada", "luto", "triste"],
    ["consegui o emprego novo!", "conquista", "feliz"],
    ["me mudei para uma nova cidade", "mudanca", "reflexivo"],
    ["não dou conta de tanta coisa", "sobrecarga", "cansado"],
    ["que saudade daquela época", "saudade", "nostalgico"],
    ["me sinto muito sozinho", "solidao", "melancolico"],
  ];

  for (const [texto, tema, emocao] of casos) {
    test(`"${texto}" → ${tema} / ${emocao}`, async () => {
      const perfil = await lexico.analisarHumor(texto);
      assert.equal(perfil.theme, tema);
      assert.equal(perfil.emotion, emocao);
    });
  }
});

describe("temas — emoção explícita ainda prevalece", () => {
  /**
   * O tema não pode atropelar quem foi claro sobre o sentimento. Com muitas
   * pistas de emoção, a pessoa disse o que sente — e isso vale mais.
   */
  test("emoção com muitas pistas vence o tema", async () => {
    const perfil = await lexico.analisarHumor(
      "terminei o namoro e sinceramente estou aliviado, muito feliz, content e leve",
    );
    assert.equal(perfil.theme, "termino", "o tema continua sendo reconhecido");
    assert.equal(perfil.emotion, "feliz", "mas a emoção explícita prevalece");
  });

  test("texto sem tema mantém a emoção detectada", async () => {
    const perfil = await lexico.analisarHumor("estou muito cansado hoje");
    assert.equal(perfil.theme, "nenhum");
    assert.equal(perfil.emotion, "cansado");
  });
});

describe("intenção — acolher x levantar", () => {
  test("acolher mantém as tags da emoção", async () => {
    const perfil = await lexico.analisarHumor("estou muito triste", "acolher");
    assert.ok(
      perfil.tags.includes("melancholic"),
      `esperava melancholic, veio: ${perfil.tags.join(", ")}`,
    );
  });

  test("levantar troca por tags de contraste", async () => {
    const perfil = await lexico.analisarHumor("estou muito triste", "levantar");
    assert.ok(
      perfil.tags.some((t) => ["empowering", "hopeful", "uplifting"].includes(t)),
      `esperava tags de contraste, veio: ${perfil.tags.join(", ")}`,
    );
    assert.ok(
      !perfil.tags.includes("melancholic"),
      "quem quer levantar não deve receber melancolia",
    );
  });

  test("levantar aumenta a energia alvo", async () => {
    const acolher = await lexico.analisarHumor("estou cansado", "acolher");
    const levantar = await lexico.analisarHumor("estou cansado", "levantar");

    assert.equal(acolher.energy, "low");
    assert.notEqual(levantar.energy, "low", "levantar deve pedir mais energia");
  });

  test("a leitura da emoção não muda com a intenção", async () => {
    const acolher = await lexico.analisarHumor("acabei de terminar", "acolher");
    const levantar = await lexico.analisarHumor("acabei de terminar", "levantar");

    // A intenção muda o que toca, não o que a pessoa está sentindo.
    assert.equal(acolher.emotion, levantar.emotion);
    assert.equal(acolher.theme, levantar.theme);
  });
});
