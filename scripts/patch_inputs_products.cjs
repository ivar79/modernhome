const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf-8');

code = code.replace(/<input[^>]*className="[^"]*"/g, (match) => {
  return match.replace(/text-sm/g, 'text-base').replace(/text-xs/g, 'text-base');
});

fs.writeFileSync('src/pages/Products.tsx', code);
