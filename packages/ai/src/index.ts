/**
 * Provider-agnostic AI interfaces. Concrete adapters (STT, LLM, TTS, vision)
 * are implemented in Phase 7; every adapter reports usage so cost can be metered.
 */

export type Lang = "en" | "ml" | "hi";
export type AiService = "stt" | "llm_tutor" | "llm_fun" | "tts" | "vision";

export interface Usage {
  service: AiService;
  provider: string;
  model: string;
  /** Unit depends on service: seconds (stt), tokens (llm), characters (tts), images (vision). */
  units: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface SttProvider {
  readonly name: string;
  transcribe(
    audio: AsyncIterable<Uint8Array>,
    opts: { lang: Lang; sampleRate: 16000 },
  ): Promise<{ text: string; usage: Usage }>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  readonly name: string;
  complete(
    messages: ChatMessage[],
    opts?: { maxTokens?: number; temperature?: number; json?: boolean },
  ): Promise<{ text: string; usage: Usage }>;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(
    text: string,
    opts: { lang: Lang; voice: string; format: "mp3" | "opus" },
  ): AsyncIterable<Uint8Array>;
}

export interface VisionProvider {
  readonly name: string;
  explain(image: Uint8Array, prompt: string): Promise<{ text: string; usage: Usage }>;
}

/** Price per unit in INR, keyed by `${provider}:${model}`. */
export type PriceTable = Record<
  string,
  { perUnitInr?: number; perTokenInInr?: number; perTokenOutInr?: number }
>;

/** Compute INR cost for a usage record. Unknown models cost 0 and are flagged by the caller. */
export function costInr(usage: Usage, prices: PriceTable): number {
  const p = prices[`${usage.provider}:${usage.model}`];
  if (!p) return 0;
  if (p.perTokenInInr !== undefined || p.perTokenOutInr !== undefined) {
    const cost =
      (usage.tokensIn ?? 0) * (p.perTokenInInr ?? 0) +
      (usage.tokensOut ?? 0) * (p.perTokenOutInr ?? 0);
    return Math.round(cost * 1e4) / 1e4;
  }
  return Math.round(usage.units * (p.perUnitInr ?? 0) * 1e4) / 1e4;
}
