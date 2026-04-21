import { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { ApiError } from "../lib/apiError";

const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

export { notFound };
