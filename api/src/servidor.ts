import "dotenv/config";
import { criarApp } from "./app.ts";

const porta = Number(process.env.PORT ?? 3333);

criarApp().listen(porta, () => {
  console.log(`[moodify] API ouvindo em http://localhost:${porta}`);
  console.log(`[moodify] IA: ${process.env.AI_PROVIDER ?? "lexico"}`);
  console.log(`[moodify] Catálogo: ${process.env.MUSIC_PROVIDER ?? "deezer"}`);
});
