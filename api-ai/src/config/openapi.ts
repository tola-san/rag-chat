export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Local AI Chat API",
    version: "1.0.0",
    description: "A frontend-friendly REST API for general-purpose Gemini chat.",
  },
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/chat": {
      post: {
        summary: "Send a general-purpose chat request to Gemini",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Generated answer",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Chat provider error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ChatMessage: {
        type: "object",
        additionalProperties: false,
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string", minLength: 1 },
        },
      },
      ChatRequest: {
        type: "object",
        additionalProperties: false,
        required: ["question"],
        properties: {
          question: { type: "string", minLength: 1 },
          history: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatMessage" },
            default: [],
          },
        },
      },
      ChatSuccessResponse: {
        type: "object",
        required: ["success", "answer"],
        properties: {
          success: { type: "boolean", const: true },
          answer: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", const: false },
          error: { type: "string" },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "status", "service", "version"],
        properties: {
          success: { type: "boolean", const: true },
          status: { type: "string", const: "ok" },
          service: { type: "string" },
          version: { type: "string" },
        },
      },
    },
  },
} as const;
