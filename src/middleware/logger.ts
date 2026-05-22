import type { NextFunction, Request, Response } from "express";
import { blue, green, italic } from "kleur/colors";

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${green(new Date().toLocaleString())}]`, italic(req.method), blue(req.url));
  next();
};

export default logger;