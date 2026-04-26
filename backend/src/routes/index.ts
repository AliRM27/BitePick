import { Router } from "express";

import { healthRouter } from "./healthRoutes";
import { restaurantRouter } from "./restaurantRoutes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/restaurants", restaurantRouter);

export { apiRouter };
