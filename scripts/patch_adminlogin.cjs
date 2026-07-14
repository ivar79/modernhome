const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf-8');

code = code.replace(
  'className="max-w-md w-full bg-white border border-stone-200 shadow-xl rounded-3xl p-8 space-y-6"',
  'className="max-w-md w-full bg-white border border-stone-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 mx-4"'
);

fs.writeFileSync('src/pages/AdminLogin.tsx', code);
