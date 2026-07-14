const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import rateLimit from "express-rate-limit";')) {
  code = code.replace('import path from "path";', 'import path from "path";\nimport rateLimit from "express-rate-limit";');
}

const loginRegex = /app\.post\("\/api\/auth\/login", async \(req, res\) => \{/;
const newLogin = `const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: "تعداد درخواست‌های ورود بیش از حد مجاز است. لطفا بعدا تلاش کنید." }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {`;

code = code.replace(loginRegex, newLogin);

const otpRegex = /app\.post\("\/api\/customer\/send-otp", async \(req, res\) => \{/;
const newOtp = `const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { success: false, error: "تعداد درخواست‌های پیامک بیش از حد مجاز است." }
});

app.post("/api/customer/send-otp", otpLimiter, async (req, res) => {`;

code = code.replace(otpRegex, newOtp);

fs.writeFileSync('server.ts', code);
