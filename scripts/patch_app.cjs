const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'import Navbar from "./components/Navbar";',
  'import Navbar from "./components/Navbar";\nimport BottomNav from "./components/BottomNav";'
);

code = code.replace(
  '{!isLoginPage && <Footer />}',
  '{!isLoginPage && <Footer />}\n      {!isLoginPage && <BottomNav />}'
);

// We need to add padding to the bottom of the layout so the bottom nav doesn't cover content
code = code.replace(
  '<main className="flex-grow">',
  '<main className="flex-grow pb-20 lg:pb-0">'
);

fs.writeFileSync('src/App.tsx', code);
