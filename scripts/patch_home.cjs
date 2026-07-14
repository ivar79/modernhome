const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Replace the featured products grid container
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-8">',
  `<div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>`
);

code = code.replace(
  '{featuredProducts.map((p) => (',
  '{featuredProducts.map((p) => (\n              <div key={p.product.id} className="w-[85vw] sm:w-auto shrink-0 snap-center">'
);

code = code.replace(
  'categoryName={p.categoryName}\n              />',
  'categoryName={p.categoryName}\n              />\n              </div>'
);

// We need to also fix the key prop which is now on the wrapper div
code = code.replace(
  '<ProductCard\n                key={p.product.id}',
  '<ProductCard'
);

// We should also do this for the loading skeletons
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-8">\n            {[1, 2, 3].map((i) => (\n              <div key={i} className="animate-pulse bg-white border border-stone-200 rounded-2xl h-[420px]" />\n            ))}\n          </div>',
  `<div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[85vw] sm:w-auto shrink-0 snap-center animate-pulse bg-white border border-stone-200 rounded-2xl h-[420px]" />
            ))}
          </div>`
);


// Now for the Categories Section
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">',
  `<div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>`
);

code = code.replace(
  '{categories.map((c, i) => (',
  '{categories.map((c, i) => (\n            <div key={c.id} className="w-[80vw] sm:w-auto shrink-0 snap-center">'
);

code = code.replace(
  '</Link>\n            ))}',
  '</Link>\n            </div>\n            ))}'
);

code = code.replace(
  '<Link\n                key={c.id}',
  '<Link'
);

// Now for the 3 steps Section (Features) -> lines 141-177 maybe?
// Wait, categories is `categories.map`? I need to check `Home.tsx` to ensure `categories.map` exists.

fs.writeFileSync('src/pages/Home.tsx', code);
