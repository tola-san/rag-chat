export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSuccessResponse {
  success: true;
  answer: string;
}

interface ChatErrorResponse {
  success: false;
  error: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5051";

export const sendChatMessage = async (
  question: string,
  history: ChatMessage[]
): Promise<string> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
    });
  } catch {
    throw new Error(
      `Could not reach the Gemini API at ${API_BASE_URL}. Make sure api-ai is running.`
    );
  }

  const data = (await response.json().catch(() => null)) as
    | ChatSuccessResponse
    | ChatErrorResponse
    | null;

  if (!response.ok || !data || !data.success) {
    throw new Error(
      data && "error" in data ? data.error : `Request failed (${response.status}).`
    );
  }

  return data.answer;
};
