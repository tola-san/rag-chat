import app from "./app.js";
import { initRagService } from "./services/ragService.js";

const PORT: number = parseInt(process.env.PORT || "5000", 10);

const startServer = async (): Promise<void> => {
  try {
    console.log("Initializing vector store & LangChain pipeline...");
    await initRagService();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`TypeScript Server ready on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Server boot error:", err);
    process.exit(1);
  }
};

startServer();