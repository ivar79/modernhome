const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Update /api/customer/verify-otp to generate a token
const verifyOtpRegex = /return res\.json\(\{\n\s*success: true,\n\s*customer: \{([\s\S]*?)\},\n\s*orders: ordersWithProducts,\n\s*\}\);/;

const newVerifyOtp = `const customerToken = jwt.sign(
      { phone: cleanPhone, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token: customerToken,
      customer: {$1},
      orders: ordersWithProducts,
    });`;

code = code.replace(verifyOtpRegex, newVerifyOtp);

// 2. Add customerAuthMiddleware
const authMiddlewareRegex = /export const JWT_SECRET[\s\S]*?\n\}/;

let middlewareCode = fs.readFileSync('src/middleware.ts', 'utf8');
middlewareCode += `\nexport function customerAuthMiddleware(req: Request, res: Response, next: NextFunction): any {
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
}`;
fs.writeFileSync('src/middleware.ts', middlewareCode);

// Add import in server.ts
code = code.replace('import { adminAuthMiddleware }', 'import { adminAuthMiddleware, customerAuthMiddleware }');

// 3. Update /api/customer/portal
const portalRegex = /app\.post\("\/api\/customer\/portal", async \(req, res\) => \{\n\s*try \{\n\s*const db = getDb\(\);\n\s*const \{ phone \} = req\.body;\n\s*if \(!phone\) \{[\s\S]*?cleanPhone = phone\.trim\(\);/;

const newPortal = `app.get("/api/customer/portal", customerAuthMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const cleanPhone = (req as any).customerUser.phone || (req as any).customerUser.username; // fallback for admin
`;

// Wait, the frontend is currently calling POST /api/customer/portal with body { phone }.
// I should keep it POST but ignore the body, or change frontend to GET. It's safer to change frontend too.
// Let's just ignore req.body.phone and use the token's phone.
const newPortalPost = `app.post("/api/customer/portal", customerAuthMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const cleanPhone = (req as any).customerUser.phone;
    if (!cleanPhone) return res.status(403).json({ success: false, error: "Forbidden" });
`;

code = code.replace(portalRegex, newPortalPost);

fs.writeFileSync('server.ts', code);
