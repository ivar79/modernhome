const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!code.includes('import { adminAuthMiddleware } from "./src/middleware.js";')) {
  code = code.replace('import path from "path";', 'import path from "path";\nimport { adminAuthMiddleware } from "./src/middleware.js";');
}

// Add app.use("/api/admin", adminAuthMiddleware); before app.get("/api/admin/orders"
if (!code.includes('app.use("/api/admin", adminAuthMiddleware);')) {
  code = code.replace('app.get("/api/admin/orders"', 'app.use("/api/admin", adminAuthMiddleware);\n\napp.get("/api/admin/orders"');
}

// Protect products and showrooms
const routesToProtect = [
  'app.post("/api/showrooms"',
  'app.put("/api/showrooms/:id"',
  'app.delete("/api/showrooms/:id"',
  'app.post("/api/products"',
  'app.put("/api/products/:id"',
  'app.delete("/api/products/:id"',
  'app.post("/api/settings"' // wait, settings was "/api/admin/settings" which is covered, but let's check
];

routesToProtect.forEach(route => {
  const protectedRoute = route + ', adminAuthMiddleware';
  code = code.replace(route + ', async', protectedRoute + ', async');
});

fs.writeFileSync('server.ts', code);
