const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace otpStore usages
code = code.replace('const otpStore = new Map<string, { code: string; expiresAt: number }>();\n', '');

// Send OTP
code = code.replace(/otpStore\.set\(cleanPhone, \{\n\s*code: otpCode,\n\s*expiresAt: Date\.now\(\) \+ 3 \* 60 \* 1000,\n\s*\}\);/g, 
`await db.insert(schema.otps).values({
      phone: cleanPhone,
      code: otpCode,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000)
    }).onConflictDoUpdate({
      target: schema.otps.phone,
      set: { code: otpCode, expiresAt: new Date(Date.now() + 3 * 60 * 1000) }
    });`);

// Verify OTP
code = code.replace(/const record = otpStore\.get\(cleanPhone\);/g, 
`const [record] = await db.select().from(schema.otps).where(eq(schema.otps.phone, cleanPhone)).limit(1);`);

code = code.replace(/if \(!record\) \{/g, `if (!record) {`);

code = code.replace(/if \(Date\.now\(\) > record\.expiresAt\) \{/g, `if (new Date() > new Date(record.expiresAt)) {`);

code = code.replace(/otpStore\.delete\(cleanPhone\);/g, `await db.delete(schema.otps).where(eq(schema.otps.phone, cleanPhone));`);

fs.writeFileSync('server.ts', code);
