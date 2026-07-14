const fs = require('fs');

function fixInputs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // Replace text-sm with text-base inside input classNames
  // This regex matches <input ... className="..." ... /> and replaces text-sm/text-xs with text-base
  
  code = code.replace(/<input[^>]*className="[^"]*"/g, (match) => {
    return match.replace(/text-sm/g, 'text-base').replace(/text-xs/g, 'text-base');
  });

  fs.writeFileSync(filePath, code);
}

fixInputs('src/pages/CustomerClub.tsx');
fixInputs('src/pages/AdminLogin.tsx');
fixInputs('src/pages/Contact.tsx');

