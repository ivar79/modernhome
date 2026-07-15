import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_please_change";
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Using fallback. Please set it in production for security.");
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "دسترسی غیرمجاز. لطفا ابتدا وارد حساب مدیریت خود شوید."
    });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).adminUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: "توکن نامعتبر است یا منقضی گردیده است."
    });
  }
}

export function customerAuthMiddleware(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "دسترسی غیرمجاز." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'customer' && !decoded.username) {
      throw new Error("Invalid role");
    }
    (req as any).customerUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "توکن نامعتبر است." });
  }
}