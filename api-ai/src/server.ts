import app from "./app.js";

const PORT: number = parseInt(process.env.PORT || "5000", 10);
const HOST = process.env.HOST || "127.0.0.1";

const startServer = async (): Promise<void> => {
  try {
    app.listen(PORT, HOST, () => {
      const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
      console.log(`Gemini API server ready on http://${displayHost}:${PORT}`);
    });
  } catch (err) {
    console.error("Server boot error:", err);
    process.exit(1);
  }
};

startServer();
