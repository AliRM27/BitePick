import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { apiRouter } from "./routes";

const app = express();

app.use(compression());
app.use(cors());
app.use(helmet());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BitePick API is running.",
  });
});

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);

export { app };
