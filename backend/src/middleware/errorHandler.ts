import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ApiError } from "../lib/apiError";

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed.",
      errors: error.flatten().fieldErrors,
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: error.message || "Internal server error",
    stack: env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

export { errorHandler };
