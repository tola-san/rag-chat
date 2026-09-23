aimport express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.use("/api", chatRoutes);

export default app;