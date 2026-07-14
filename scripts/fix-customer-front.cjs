const fs = require('fs');
let code = fs.readFileSync('src/pages/CustomerClub.tsx', 'utf8');

// Save token in verify-otp
code = code.replace(
  'localStorage.setItem("customerClubPhone", phoneInput.trim());',
  'localStorage.setItem("customerClubPhone", phoneInput.trim());\n        localStorage.setItem("customerToken", data.token);'
);

// Add token to portal fetch
const portalRegex = /const res = await fetch\("\/api\/customer\/portal", \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON\.stringify\(\{ phone \}\)\n\s*\}\);/;

const newPortal = `const token = localStorage.getItem("customerToken");
      const res = await fetch("/api/customer/portal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? \`Bearer \${token}\` : ""
        },
        body: JSON.stringify({ phone })
      });`;

code = code.replace(portalRegex, newPortal);

fs.writeFileSync('src/pages/CustomerClub.tsx', code);
