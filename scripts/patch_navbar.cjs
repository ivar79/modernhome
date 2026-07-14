const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// The mobile drawer is currently absolute or relative? It doesn't have absolute/fixed, it's just in the flow or hidden. 
// Let's make it fixed and full-screen for better mobile UX.
// Wait, looking at the code:
/*
      {/* Mobile Drawer * /}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-stone-50 border-b border-stone-200 shadow-2xl"
*/

code = code.replace(
  'className="lg:hidden overflow-hidden bg-stone-50 border-b border-stone-200 shadow-2xl"',
  'className="lg:hidden overflow-hidden bg-stone-50 border-b border-stone-200 shadow-2xl absolute top-full left-0 right-0 z-50 rounded-b-3xl max-h-[calc(100vh-80px)] overflow-y-auto"'
);

// We need to make sure the nav container has relative positioning if we use absolute.
code = code.replace(
  '<nav className={`w-full z-50 transition-all duration-300',
  '<nav className={`relative w-full z-50 transition-all duration-300'
);

fs.writeFileSync('src/components/Navbar.tsx', code);
