const fs = require('fs');
let code = fs.readFileSync('src/pages/CustomerClub.tsx', 'utf-8');

code = code.replace(
  'className="max-w-md mx-auto bg-white dark:bg-stone-900/65 p-8 border border-stone-200 dark:border-stone-800 rounded-3xl space-y-6 shadow-xl text-center"',
  'className="max-w-md mx-auto bg-white dark:bg-stone-900/65 p-6 sm:p-8 border border-stone-200 dark:border-stone-800 rounded-3xl space-y-6 shadow-xl text-center"'
);

fs.writeFileSync('src/pages/CustomerClub.tsx', code);
