import { Request, Response } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { env } from "../config/env";

const getHealthStatus = (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "API is healthy.",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

export { getHealthStatus };
