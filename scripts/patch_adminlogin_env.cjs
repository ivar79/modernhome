const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf-8');

code = code.replace(
  'const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";',
  'const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "";'
);

fs.writeFileSync('src/pages/AdminLogin.tsx', code);
