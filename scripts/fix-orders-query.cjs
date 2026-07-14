const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /let query = db[\s\S]*?return res\.json\(\{ success: true, orders: list \}\);/m;

const replacement = `let query = db
      .select({
        order: schema.orders,
        productName: schema.products.name,
        showroomName: schema.showrooms.name,
      })
      .from(schema.orders)
      .innerJoin(
        schema.products,
        eq(schema.orders.productId, schema.products.id),
      )
      .innerJoin(
        schema.showrooms,
        eq(schema.orders.showroomId, schema.showrooms.id),
      )
      .$dynamic();

    const filters = [];

    if (status && status !== "ALL") {
      filters.push(eq(schema.orders.status, String(status)));
    }
    
    if (showroomId && showroomId !== "ALL") {
      filters.push(eq(schema.orders.showroomId, String(showroomId)));
    }
    
    if (search) {
      const searchStr = \`%\${String(search).toLowerCase()}%\`;
      filters.push(
        or(
          ilike(schema.orders.customerName, searchStr),
          ilike(schema.orders.customerPhone, searchStr),
          ilike(schema.products.name, searchStr)
        )
      );
    }
    
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const list = await query.orderBy(desc(schema.orders.createdAt));

    return res.json({ success: true, orders: list });`;

code = code.replace(regex, replacement);

if (!code.includes('import { eq, desc, and, or, ilike, like, inArray }')) {
  code = code.replace('import { eq, desc, inArray, like } from "drizzle-orm";', 'import { eq, desc, and, or, ilike, like, inArray } from "drizzle-orm";');
}

fs.writeFileSync('server.ts', code);
