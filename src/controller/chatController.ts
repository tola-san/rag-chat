import type { Request, Response } from "express";
import { runRagQuery } from "../services/ragService.js";
import type {
  ChatRequestBody,
  ChatSuccessResponse,
  ChatErrorResponse,
} from "../types/chat.js";

export const handleChat = async (
  req: Request<Record<string, never>, ChatSuccessResponse | ChatErrorResponse, ChatRequestBody>,
  res: Response<ChatSuccessResponse | ChatErrorResponse>
): Promise<void> => {
  try {
    const { question, history = [] } = req.body;

    if (!question || typeof question !== "string") {
      res.status(400).json({
        success: false,
        error: "A valid 'question' string is required.",
      });
      return;
    }

    const answer = await runRagQuery(question, history);
    res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat query.",
    });
  }
};