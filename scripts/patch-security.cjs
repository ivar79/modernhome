const fs = require('fs');

// 1. JWT_SECRET Throw
let mwCode = fs.readFileSync('src/middleware.ts', 'utf8');
const oldSecret = 'export const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_please_change";';
const newSecret = `export const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_please_change";\nif (!process.env.JWT_SECRET) {\n  throw new Error("JWT_SECRET must be set in environment variables");\n}`;
if (!mwCode.includes('throw new Error("JWT_SECRET must be set')) {
  mwCode = mwCode.replace(oldSecret, newSecret);
  fs.writeFileSync('src/middleware.ts', mwCode);
}

// 2. VIP Login Rate Limit
let serverCode = fs.readFileSync('server.ts', 'utf8');
const vipLoginRegex = /app\.post\("\/api\/customer\/vip-login", async \(req, res\) => \{/;
const newVipLogin = `const vipLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "تعداد تلاش‌ها بیش از حد مجاز است." }
});

app.post("/api/customer/vip-login", vipLoginLimiter, async (req, res) => {`;
if (!serverCode.includes('vipLoginLimiter')) {
  serverCode = serverCode.replace(vipLoginRegex, newVipLogin);
  fs.writeFileSync('server.ts', serverCode);
}

// 3. Admin Password in Seed
let seedCode = fs.readFileSync('src/db/seed.ts', 'utf8');
if (!seedCode.includes('crypto.randomBytes')) {
  if (!seedCode.includes('import crypto')) {
    seedCode = seedCode.replace('import bcryptjs', 'import crypto from "crypto";\nimport bcryptjs');
  }
  
  const oldSeedPass = /const hashedPassword = await bcryptjs\.hash\("admin123", 12\);\n\s*await db\.insert\(admins\)\.values\(\{\n\s*username: "admin",\n\s*password: hashedPassword,\n\s*\}\);\n\s*console\.log\("Admin created successfully! \(User: admin, Pass: admin123\)"\);/;
  
  const newSeedPass = `const randomPass = crypto.randomBytes(12).toString("base64");
      console.log(\`[FIRST RUN] Admin password: \${randomPass}\`);
      const hashedPassword = await bcryptjs.hash(randomPass, 12);
      await db.insert(admins).values({
        username: "admin",
        password: hashedPassword,
      });`;
      
  seedCode = seedCode.replace(oldSeedPass, newSeedPass);
  fs.writeFileSync('src/db/seed.ts', seedCode);
}

