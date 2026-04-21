import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type ValidatedRequestData = {
  body?: Request["body"];
  query?: Request["query"];
  params?: Request["params"];
};

const validateRequest =
  (schema: ZodType<ValidatedRequestData>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      return next(parsed.error);
    }

    req.body = parsed.data.body ?? req.body;
    req.query = parsed.data.query ?? req.query;
    req.params = parsed.data.params ?? req.params;

    return next();
  };

export { validateRequest };
