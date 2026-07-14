const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add import jwt
if (!code.includes('import jwt from "jsonwebtoken";')) {
  code = code.replace('import bcryptjs from "bcryptjs";', 'import bcryptjs from "bcryptjs";\nimport jwt from "jsonwebtoken";\nimport { JWT_SECRET } from "./src/middleware.js";');
}

const loginRegex = /app\.post\("\/api\/auth\/login", async \(req, res\) => \{[\s\S]*?\}\);/;

const newLogin = `app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: "نام کاربری و رمز عبور الزامی است." });
  }

  try {
    const db = getDb();
    const found = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.username, username))
      .limit(1);

    let isMatched = false;
    if (found.length > 0) {
      const admin = found[0];
      isMatched = await bcryptjs.compare(password, admin.password);
    } else {
      // Dummy compare to prevent timing attacks
      await bcryptjs.compare(password, "$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha");
    }

    if (!isMatched) {
      return res
        .status(401)
        .json({ success: false, error: "نام کاربری یا رمز عبور اشتباه است." });
    }

    const admin = found[0];
    
    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: "مدیر ارشد",
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, error: "خطای سرور" });
  }
});`;

code = code.replace(loginRegex, newLogin);
fs.writeFileSync('server.ts', code);
