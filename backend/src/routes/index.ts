import { Router } from "express";

import { healthRouter } from "./healthRoutes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);

export { apiRouter };
