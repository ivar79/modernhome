import { pgTable, text, boolean, timestamp, decimal, integer, bigint, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONTACTED',
  'NEGOTIATING',
  'CONFIRMED',
  'DELIVERED',
  'CANCELLED'
]);

export const showrooms = pgTable('showrooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  city: text('city').notNull(),
  contactPhone: text('contact_phone').notNull(),
  contactName: text('contact_name'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  image: text('image'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  basePrice: bigint('base_price', { mode: 'number' }).notNull(),
  images: text('images').array().notNull().default(sql`'{}'::text[]`),
  colors: text('colors').array().notNull().default(sql`'{}'::text[]`),
  colorVariants: jsonb('color_variants').default(sql`'[]'::jsonb`),
  material: text('material'),
  dimensions: text('dimensions'),
  fabricType: text('fabric_type'),
  innerFrame: text('inner_frame'),
  seatSponge: text('seat_sponge'),
  baseMaterial: text('base_material'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  showroomId: text('showroom_id').references(() => showrooms.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerCity: text('customer_city').notNull(),
  customerMessage: text('customer_message'),
  productId: text('product_id').references(() => products.id).notNull(),
  showroomId: text('showroom_id').references(() => showrooms.id).notNull(),
  agreedPrice: bigint('agreed_price', { mode: 'number' }),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  commissionAmount: bigint('commission_amount', { mode: 'number' }),
  commissionPaid: boolean('commission_paid').default(false).notNull(),
  commissionPaidAt: timestamp('commission_paid_at'),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  adminNotes: text('admin_notes'),
  statusNote: text('status_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commissions = pgTable('commissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').references(() => orders.id).notNull().unique(),
  showroomId: text('showroom_id').references(() => showrooms.id).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  rateUsed: decimal('rate_used', { precision: 5, scale: 2 }).notNull(),
  isPaid: boolean('is_paid').default(false).notNull(),
  paidAt: timestamp('paid_at'),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const admins = pgTable('admins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const showroomsRelations = relations(showrooms, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  commissions: many(commissions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  showroom: one(showrooms, {
    fields: [products.showroomId],
    references: [showrooms.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  showroom: one(showrooms, {
    fields: [orders.showroomId],
    references: [showrooms.id],
  }),
  commission: one(commissions, {
    fields: [orders.id],
    references: [commissions.orderId],
  }),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  order: one(orders, {
    fields: [commissions.orderId],
    references: [orders.id],
  }),
  showroom: one(showrooms, {
    fields: [commissions.showroomId],
    references: [showrooms.id],
  }),
}));

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Social Login Connections mapped to Customer Club profiles (Phones)
export const customerConnections = pgTable('customer_connections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: text('provider').notNull(), // 'google', 'apple', 'github'
  providerId: text('provider_id').notNull(), // Unified user ID
  email: text('email'),
  name: text('name'),
  phone: text('phone'), // Handshake map to store orders of this buyer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const otps = pgTable('otps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  phone: text('phone').notNull().unique(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
