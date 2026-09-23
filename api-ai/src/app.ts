import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
  type Response,
} from "express";
import cors, { type CorsOptions } from "cors";
import { openApiDocument } from "./config/openapi.js";
import chatRoutes from "./routes/chatRoutes.js";

const app: Express = express();
const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ["*"];

const corsOptions: CorsOptions = {
  origin: configuredOrigins.includes("*") ? true : configuredOrigins,
};

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "Local AI Chat API",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      chat: "/api/v1/chat",
      openapi: "/openapi.json",
    },
  });
});

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "Local AI Chat API",
    version: "1.0.0",
  });
});

app.get("/openapi.json", (_req: Request, res: Response) => {
  res.status(200).json(openApiDocument);
});

app.use("/api/v1", chatRoutes);

// Backward-compatible route for existing clients.
app.use("/api", chatRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({
      success: false,
      error: "Request body contains invalid JSON.",
    });
    return;
  }

  console.error("Unhandled API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error.",
  });
};

app.use(errorHandler);

export default app;
