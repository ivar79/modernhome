const fs = require('fs');
let code = fs.readFileSync('src/pages/CustomerClub.tsx', 'utf-8');

code = code.replace(
  'className={`flex gap-2 p-1.5 rounded-2xl w-full max-w-xl mx-auto mb-10 transition-colors border ${',
  'className={`flex gap-2 p-1.5 rounded-2xl w-full max-w-xl mx-auto mb-10 transition-colors border overflow-x-auto whitespace-nowrap hide-scrollbar ${'
);

// We need to add shrink-0 to the buttons so they don't get squished
code = code.replace(
  'className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all ${',
  'className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${'
);
code = code.replace(
  'className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all ${',
  'className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${'
);
code = code.replace(
  'className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all ${',
  'className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${'
);

fs.writeFileSync('src/pages/CustomerClub.tsx', code);
