const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf-8');

code = code.replace(/<input[^>]*className="[^"]*"/g, (match) => {
  return match.replace(/text-sm/g, 'text-base').replace(/text-xs/g, 'text-base');
});

code = code.replace(/<textarea[^>]*className="[^"]*"/g, (match) => {
  return match.replace(/text-sm/g, 'text-base').replace(/text-xs/g, 'text-base');
});

fs.writeFileSync('src/pages/ProductDetail.tsx', code);
