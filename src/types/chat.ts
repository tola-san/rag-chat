export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  question: string;
  history?: ChatMessagePayload[];
}

export interface ChatSuccessResponse {
  success: true;
  answer: string;
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}