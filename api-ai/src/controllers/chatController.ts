import type { Request, Response } from "express";
import { runGeminiChat } from "../services/geminiService.js";
import type {
  ChatRequestBody,
  ChatSuccessResponse,
  ChatErrorResponse,
} from "../types/chat.js";

export const handleChat = async (
  req: Request<
    Record<string, never>,
    ChatSuccessResponse | ChatErrorResponse,
    ChatRequestBody
  >,
  res: Response<ChatSuccessResponse | ChatErrorResponse>
): Promise<void> => {
  try {
    const { question, history = [] } = req.body;

    if (typeof question !== "string" || question.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "A non-empty 'question' string is required.",
      });
      return;
    }

    const hasInvalidHistory =
      !Array.isArray(history) ||
      history.some(
        (message) =>
          !message ||
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          message.content.trim().length === 0
      );

    if (hasInvalidHistory) {
      res.status(400).json({
        success: false,
        error: "'history' must contain non-empty user or assistant messages.",
      });
      return;
    }

    const answer = await runGeminiChat(question.trim(), history);
    res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat query.",
    });
  }
};
