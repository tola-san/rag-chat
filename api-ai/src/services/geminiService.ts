import type { Content } from "@google/genai";
import { GEMINI_MODEL, geminiClient } from "../config/gemini.js";
import type { ChatMessagePayload } from "../types/chat.js";

const SYSTEM_INSTRUCTION =
  "You are a helpful general-purpose assistant. Answer clearly and accurately. " +
  "If you are uncertain, say so instead of inventing information.";
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  return typeof error.status === "number" ? error.status : undefined;
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const runGeminiChat = async (
  question: string,
  chatHistory: ChatMessagePayload[] = []
): Promise<string> => {
  const contents: Content[] = [
    ...chatHistory.map((message): Content => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    {
      role: "user",
      parts: [{ text: question }],
    },
  ];

  let response;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });
      break;
    } catch (error) {
      const status = getErrorStatus(error);
      const shouldRetry =
        status !== undefined &&
        RETRYABLE_STATUSES.has(status) &&
        attempt < MAX_ATTEMPTS;

      if (!shouldRetry) {
        throw error;
      }

      await wait(500 * 2 ** (attempt - 1));
    }
  }

  const answer = response?.text?.trim();
  if (!answer) {
    throw new Error("Gemini returned an empty response.");
  }

  return answer;
};
