import { sendSMSOTP } from "./src/utils/sms.js";
import express from "express";
import path from "path";
import rateLimit from "express-rate-limit";
import { adminAuthMiddleware, customerAuthMiddleware } from "./src/middleware.js";
import fs from "fs";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./src/middleware.js";
import { getDb } from "./src/db/index.js";
import { runSeed } from "./src/db/seed.js";
import * as schema from "./src/db/schema.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { eq, and, or, ilike, desc, sql, inArray, like } from "drizzle-orm";

dotenv.config();

// S3 Storage Configuration
const s3Client = process.env.LIARA_ENDPOINT ? new S3Client({
  region: "default",
  endpoint: process.env.LIARA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY || "",
    secretAccessKey: process.env.LIARA_SECRET_KEY || ""
  }
}) : null;


// Ensure db gets initialized and seeded safely
async function initializeApp() {
  try {
    const db = getDb();
    console.log("Database connected successfully during server boot.");
    await runSeed();
  } catch (err) {
    console.error("Database connection/seeding failed on startup:", err);
  }
}

if (!process.env.VERCEL) {
  initializeApp();
}

const app = express();
app.set("trust proxy", 1); // Trust first proxy (like AI Studio/Cloud Run ingress)
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));


// Serve custom uploaded files statically
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Robust Base64 dynamic local upload endpoint
app.post("/api/upload", async (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "تصویری ارسال نشده است." });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's already a URL or invalid base64, return it as is.
      return res.json({ success: true, url: image });
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

    if (s3Client && process.env.LIARA_BUCKET_NAME) {
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read' 
        }));

        let endpoint = (process.env.LIARA_ENDPOINT || "").replace(/\/$/, "");
        let bucketUrl = "";
        
        if (endpoint.includes("storage.c2.liara.site")) {
          const cleanEndpoint = endpoint.replace(/^https?:\/\//, "");
          bucketUrl = `https://${process.env.LIARA_BUCKET_NAME}.${cleanEndpoint}`;
        } else if (endpoint.includes("liara.run")) {
          bucketUrl = endpoint.replace("://", `://${process.env.LIARA_BUCKET_NAME}.`);
        } else {
          bucketUrl = `${endpoint}/${process.env.LIARA_BUCKET_NAME}`;
        }
            
        console.log(`Successfully uploaded to S3: ${fileName}`);
        return res.json({ success: true, url: `${bucketUrl}/${fileName}` });
      } catch (s3Error: any) {
        console.error("S3 upload failed:", s3Error);
        console.log("Falling back to raw base64 due to S3 failure.");
      }
    } else {
      console.log("S3 not configured. Using raw base64 fallback.");
    }

    // Always fallback to raw base64 if no S3. No local filesystem writes.
    // Local filesystem on serverless/Liara gets wiped, causing broken images.
    return res.json({ success: true, url: image });
  } catch (error: any) {
    console.error("Upload error on backend:", error);
    return res.status(500).json({ success: false, error: "خطا در بارگذاری تصویر." });
  }
});

// Simplistic robust Tokenless Admin auth endpoint for AI Studio Preview
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: "تعداد درخواست‌های ورود بیش از حد مجاز است. لطفا بعدا تلاش کنید." }
});


import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);


const otpStore = new Map<string, { otp: string, expires: number }>();

app.post("/api/auth/google", loginLimiter, async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ success: false, error: "توکن گوگل الزامی است." });
  }

  try {
    let email = "";
    if (process.env.NODE_ENV !== "production" && credential === "demo-google-token") {
      email = "iska1398@gmail.com"; // Test mode bypass
      console.log("[GOOGLE AUTH] Test mode triggered for iska1398@gmail.com");
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload?.email || "";
    }

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "iska1398@gmail.com,www.hosainmahmoudi@gmail.com").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ success: false, error: "دسترسی غیرمجاز. این ایمیل اجازه ورود ندارد." });
    }

    const db = getDb();
    const found = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.username, "admin"))
      .limit(1);

    let adminId = 1;
    if (found.length > 0) {
      adminId = found[0].id;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: adminId, username: "admin", role: "admin", email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: adminId,
        username: "admin",
        name: "مدیر ارشد",
      },
    });

  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(401).json({ success: false, error: "احراز هویت گوگل نامعتبر است." });
  }
});

let mockAdminPassword = "admin123";

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: "نام کاربری و رمز عبور الزامی است." });
  }

  try {
    const db = getDb();
    const found = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.username, username))
      .limit(1);

    let isMatched = false;
    if (found.length > 0) {
      const admin = found[0];
      isMatched = await bcryptjs.compare(password, admin.password);
    } else if (username === "admin" && password === mockAdminPassword) {
      isMatched = true;
      found.push({ id: "mock-admin-id", username: "admin" });
    } else {
      // Dummy compare to prevent timing attacks
      await bcryptjs.compare(password, "$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha");
    }

    if (!isMatched) {
      return res
        .status(401)
        .json({ success: false, error: "نام کاربری یا رمز عبور اشتباه است." });
    }

    const admin = found[0];
    
    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: "مدیر ارشد",
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, error: "خطای سرور" });
  }
});
// SHOWROOMS API
// -----------------------------------------------------------------------------
app.get("/api/showrooms", async (req, res) => {
  try {
    const db = getDb();
    const list = await db
      .select()
      .from(schema.showrooms)
      .orderBy(desc(schema.showrooms.createdAt));
    return res.json({ success: true, showrooms: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/showrooms", adminAuthMiddleware, async (req, res) => {
  const {
    name,
    city,
    contactPhone,
    contactName,
    commissionRate,
    address,
    notes,
    isActive,
  } = req.body;
  if (!name || !city || !contactPhone || commissionRate === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "پر کردن فیلدهای ستاره‌دار الزامی است." });
  }
  try {
    const db = getDb();
    const inserted = await db
      .insert(schema.showrooms)
      .values({
        name,
        city,
        contactPhone,
        contactName,
        commissionRate: commissionRate.toString(),
        address,
        notes,
        isActive: isActive !== false,
      })
      .returning();
    return res.json({ success: true, showroom: inserted[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/showrooms/:id", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    city,
    contactPhone,
    contactName,
    commissionRate,
    address,
    notes,
    isActive,
  } = req.body;
  try {
    const db = getDb();
    const updated = await db
      .update(schema.showrooms)
      .set({
        name,
        city,
        contactPhone,
        contactName,
        commissionRate: commissionRate ? commissionRate.toString() : undefined,
        address,
        notes,
        isActive: isActive === undefined ? undefined : isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.showrooms.id, id))
      .returning();
    return res.json({ success: true, showroom: updated[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/showrooms/:id", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    // Soft toggle isActive instead of hard delete
    const current = await db
      .select()
      .from(schema.showrooms)
      .where(eq(schema.showrooms.id, id))
      .limit(1);
    if (current.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "نمایشگاه یافت نشد." });
    }
    const updated = await db
      .update(schema.showrooms)
      .set({ isActive: !current[0].isActive })
      .where(eq(schema.showrooms.id, id))
      .returning();
    return res.json({ success: true, showroom: updated[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// CATEGORIES API
// -----------------------------------------------------------------------------
app.get("/api/categories", async (req, res) => {
  try {
    const db = getDb();
    const list = await db
      .select()
      .from(schema.categories)
      .orderBy(schema.categories.sortOrder);
    return res.json({ success: true, categories: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// PRODUCTS API
// -----------------------------------------------------------------------------
app.get("/api/products", async (req, res) => {
  const { categorySlug, showcaseOnly } = req.query;
  try {
    const db = getDb();

    // Join products with category and showroom
    const list = await db
      .select({
        product: schema.products,
        showroomName: schema.showrooms.name,
        categoryName: schema.categories.name,
      })
      .from(schema.products)
      .innerJoin(
        schema.showrooms,
        eq(schema.products.showroomId, schema.showrooms.id),
      )
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .orderBy(desc(schema.products.createdAt));

    let filtered = list;
    if (showcaseOnly === "true") {
      filtered = filtered.filter(
        (p) => p.product.isFeatured && p.product.isActive,
      );
    }

    return res.json({ success: true, products: filtered });
  } catch (error: any) {
    console.error("Fetch products error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/products/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const db = getDb();
    const results = await db
      .select({
        product: schema.products,
        showroom: schema.showrooms,
        category: schema.categories,
      })
      .from(schema.products)
      .innerJoin(
        schema.showrooms,
        eq(schema.products.showroomId, schema.showrooms.id),
      )
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(eq(schema.products.slug, slug))
      .limit(1);

    if (results.length === 0) {
      // Try fetching by ID
      const resultsById = await db
        .select({
          product: schema.products,
          showroom: schema.showrooms,
          category: schema.categories,
        })
        .from(schema.products)
        .innerJoin(
          schema.showrooms,
          eq(schema.products.showroomId, schema.showrooms.id),
        )
        .innerJoin(
          schema.categories,
          eq(schema.products.categoryId, schema.categories.id),
        )
        .where(eq(schema.products.id, slug))
        .limit(1);

      if (resultsById.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "محصول مورد نظر یافت نشد." });
      }
      return res.json({ success: true, data: resultsById[0] });
    }

    return res.json({ success: true, data: results[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/products", adminAuthMiddleware, async (req, res) => {
  const {
    name,
    slug,
    description,
    basePrice,
    images,
    colors,
    colorVariants,
    material,
    dimensions,
    fabricType,
    innerFrame,
    seatSponge,
    baseMaterial,
    isFeatured,
    isActive,
    categoryId,
    showroomId,
  } = req.body;

  if (!name || !slug || !basePrice || !categoryId || !showroomId) {
    return res
      .status(400)
      .json({ success: false, error: "فیلدهای اجباری پر نشده‌اند." });
  }

  try {
    const db = getDb();

    // Check slug uniqueness
    const exists = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, slug))
      .limit(1);
    if (exists.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "شناسه یکتا (slug) تکراری است." });
    }

    const parsedImages = Array.isArray(images)
      ? images
      : [images].filter(Boolean);
    const parsedColors = Array.isArray(colors)
      ? colors
      : colors
        ? colors.split("،").map((c: string) => c.trim())
        : [];
    const parsedColorVariants = Array.isArray(colorVariants) ? colorVariants : [];

    const inserted = await db
      .insert(schema.products)
      .values({
        name,
        slug,
        description,
        basePrice: Number(basePrice),
        images: parsedImages,
        colors: parsedColors,
        colorVariants: parsedColorVariants,
        material,
        dimensions,
        fabricType,
        innerFrame,
        seatSponge,
        baseMaterial,
        isFeatured: !!isFeatured,
        isActive: isActive !== false,
        categoryId,
        showroomId,
      })
      .returning();

    return res.json({ success: true, product: inserted[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/products/:id", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    basePrice,
    images,
    colors,
    colorVariants,
    material,
    dimensions,
    fabricType,
    innerFrame,
    seatSponge,
    baseMaterial,
    isFeatured,
    isActive,
    categoryId,
    showroomId,
  } = req.body;

  try {
    const db = getDb();

    const parsedImages = Array.isArray(images) ? images : undefined;
    const parsedColors = Array.isArray(colors)
      ? colors
      : colors
        ? colors.split("،").map((c: string) => c.trim())
        : undefined;
    const parsedColorVariants = Array.isArray(colorVariants) ? colorVariants : undefined;

    const updated = await db
      .update(schema.products)
      .set({
        name,
        slug,
        description,
        basePrice: basePrice ? Number(basePrice) : undefined,
        images: parsedImages,
        colors: parsedColors,
        colorVariants: parsedColorVariants,
        material,
        dimensions,
        fabricType,
        innerFrame,
        seatSponge,
        baseMaterial,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
        categoryId,
        showroomId,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, id))
      .returning();

    return res.json({ success: true, product: updated[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/products/:id", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    // Soft Toggle dynamic state
    const current = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    if (current.length === 0) {
      return res.status(404).json({ success: false, error: "محصول یافت نشد." });
    }
    const updated = await db
      .update(schema.products)
      .set({ isActive: !current[0].isActive })
      .where(eq(schema.products.id, id))
      .returning();
    return res.json({ success: true, product: updated[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// ORDERS API
// -----------------------------------------------------------------------------
app.post("/api/orders", async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerCity,
    customerMessage,
    productId,
  } = req.body;

  if (!customerName || !customerPhone || !customerCity || !productId) {
    return res
      .status(400)
      .json({
        success: false,
        error: "لطفاً تمام فیلدهای ستاره‌دار را تکمیل کنید.",
      });
  }

  // Iranian Phone Regex validation
  const iranPhoneRegex = /^(\+98|0098|98|0)?9[0-9]{9}$/;
  if (!iranPhoneRegex.test(customerPhone)) {
    return res
      .status(400)
      .json({
        success: false,
        error: "شماره موبایل وارد شده معتبر نیست. مثال: 09123456789",
      });
  }

  try {
    const db = getDb();

    // Fetch product to find showroomId and initial commission rate
    const foundProducts = await db
      .select({
        product: schema.products,
        showroom: schema.showrooms,
      })
      .from(schema.products)
      .innerJoin(
        schema.showrooms,
        eq(schema.products.showroomId, schema.showrooms.id),
      )
      .where(eq(schema.products.id, productId))
      .limit(1);

    if (foundProducts.length === 0) {
      return res
        .status(444)
        .json({ success: false, error: "محصول انتخابی وجود ندارد." });
    }

    const matchedProduct = foundProducts[0].product;
    const matchedShowroom = foundProducts[0].showroom;

    // Create Order with base PENDING status, copying showroom commission rate
    const finalOrder = await db
      .insert(schema.orders)
      .values({
        customerName,
        customerPhone,
        customerCity,
        customerMessage,
        productId,
        showroomId: matchedProduct.showroomId,
        commissionRate: matchedShowroom.commissionRate,
        status: "PENDING",
      })
      .returning();

    return res.json({
      success: true,
      message: "درخواست شما ثبت شد. کارشناسان ما ظرف ۲۴ ساعت تماس می‌گیرند.",
      order: finalOrder[0],
    });
  } catch (error: any) {
    console.error("Order submit failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "خطایی پیش آمده: " + error.message });
  }
});

// Admin Filtered Orders API
app.use("/api/admin", adminAuthMiddleware);

app.get("/api/admin/orders", async (req, res) => {
  const { status, showroomId, search } = req.query;
  try {
    const db = getDb();

    let query = db
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
      filters.push(eq(schema.orders.status, String(status) as any));
    }
    
    if (showroomId && showroomId !== "ALL") {
      filters.push(eq(schema.orders.showroomId, String(showroomId)));
    }
    
    if (search) {
      const searchStr = `%${String(search).toLowerCase()}%`;
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

    return res.json({ success: true, orders: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/admin/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const result = await db
      .select({
        order: schema.orders,
        product: schema.products,
        showroom: schema.showrooms,
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
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: "سفارش یافت نشد." });
    }

    // Include the commission relation if exists
    const commissionRec = await db
      .select()
      .from(schema.commissions)
      .where(eq(schema.commissions.orderId, id))
      .limit(1);

    return res.json({
      success: true,
      data: result[0],
      commission: commissionRec[0] || null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update/Edit Order in Admin Panel
app.put("/api/admin/orders/:id", async (req, res) => {
  const { id } = req.params;
  const {
    status,
    adminNotes,
    statusNote,
    agreedPrice,
    commissionPaid,
    paymentMethod,
    commissionNotes,
  } = req.body;

  try {
    const db = getDb();

    // Fetch existing order to verify rate
    const currentOrder = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (currentOrder.length === 0) {
      return res.status(404).json({ success: false, error: "سفارش یافت نشد." });
    }

    const orderData = currentOrder[0];
    const updatedFields: any = {};

    if (status) updatedFields.status = status;
    if (adminNotes !== undefined) updatedFields.adminNotes = adminNotes;
    if (statusNote !== undefined) updatedFields.statusNote = statusNote;

    // Recalculate commission if agreedPrice is set or changed
    let commissionVal: number | null = orderData.commissionAmount;
    if (agreedPrice !== undefined) {
      const priceNum = agreedPrice ? Number(agreedPrice) : null;
      updatedFields.agreedPrice = priceNum;

      if (priceNum && orderData.commissionRate) {
        // commissionAmount = Math.round((agreedPrice * commissionRate) / 100)
        commissionVal = Math.round(
          (priceNum * Number(orderData.commissionRate)) / 100,
        );
        updatedFields.commissionAmount = commissionVal;
      } else {
        updatedFields.commissionAmount = null;
        commissionVal = null;
      }
    }

    if (commissionPaid !== undefined) {
      updatedFields.commissionPaid = !!commissionPaid;
      updatedFields.commissionPaidAt = commissionPaid ? new Date() : null;
    }

    // 1. Update the Order table
    const resultOrder = await db
      .update(schema.orders)
      .set({
        ...updatedFields,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id))
      .returning();

    // 2. Synchronize the Commissions table
    if (commissionVal && commissionVal > 0) {
      // Check if commission table entry exists
      const existingComm = await db
        .select()
        .from(schema.commissions)
        .where(eq(schema.commissions.orderId, id))
        .limit(1);

      if (existingComm.length > 0) {
        await db
          .update(schema.commissions)
          .set({
            amount: commissionVal,
            isPaid: !!commissionPaid,
            paidAt: commissionPaid ? new Date() : null,
            paymentMethod: paymentMethod || existingComm[0].paymentMethod,
            notes: commissionNotes || existingComm[0].notes,
          })
          .where(eq(schema.commissions.orderId, id));
      } else {
        await db.insert(schema.commissions).values({
          orderId: id,
          showroomId: orderData.showroomId,
          amount: commissionVal,
          rateUsed: orderData.commissionRate || "0.00",
          isPaid: !!commissionPaid,
          paidAt: commissionPaid ? new Date() : null,
          paymentMethod: paymentMethod || "ثبت سیستمی",
          notes: commissionNotes || "ثبت خودکار سیستمی",
        });
      }
    }

    return res.json({ success: true, order: resultOrder[0] });
  } catch (error: any) {
    console.error("Order edit in API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// CUSTOMER & VIP CLUB ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/admin/customers", async (req, res) => {
  try {
    const db = getDb();
    const allOrders = await db.select().from(schema.orders);

    // Fetch VIP settings list
    const vipPhonesSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_phones"))
      .limit(1);
    const vipPhones: string[] =
      vipPhonesSetting.length > 0 ? JSON.parse(vipPhonesSetting[0].value) : [];

    const thresholdSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_threshold"))
      .limit(1);
    const vipThreshold =
      thresholdSetting.length > 0
        ? parseInt(thresholdSetting[0].value)
        : 50 * 1000 * 1000; // 50 million tomans default representation

    // Group orders by customer_phone
    const customerMap = new Map<
      string,
      {
        phone: string;
        name: string;
        city: string;
        totalOrders: number;
        totalSpent: number;
        latestOrderDate: string;
        isManualVip: boolean;
        autoEligible: boolean;
      }
    >();

    for (const order of allOrders) {
      const phone = order.customerPhone.trim();
      if (!phone) continue;
      const existing = customerMap.get(phone);

      const orderPrice = order.agreedPrice || 0;
      // count spent if CONFIRMED or DELIVERED, or count all inquiries as potential
      const isConfirmedPurchase = ["CONFIRMED", "DELIVERED"].includes(
        order.status,
      );
      const spentToAdd = isConfirmedPurchase ? orderPrice : 0;

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += spentToAdd;
        if (new Date(order.createdAt) > new Date(existing.latestOrderDate)) {
          existing.latestOrderDate = order.createdAt.toISOString();
          existing.name = order.customerName; // update to latest name
          existing.city = order.customerCity;
        }
      } else {
        customerMap.set(phone, {
          phone,
          name: order.customerName,
          city: order.customerCity,
          totalOrders: 1,
          totalSpent: spentToAdd,
          latestOrderDate: order.createdAt
            ? new Date(order.createdAt).toISOString()
            : new Date().toISOString(),
          isManualVip: vipPhones.includes(phone),
          autoEligible: false, // will check below
        });
      }
    }

    const customersList = Array.from(customerMap.values()).map((c) => {
      c.autoEligible = c.totalSpent >= vipThreshold;

      // Look for orders containing `[کد معرف: phone]`
      const refCode = `[کد معرف: ${c.phone}]`;
      const referredOrders = allOrders.filter(
        (o) => o.customerMessage && o.customerMessage.includes(refCode),
      );
      const referralsCount = referredOrders.length;
      const successfulReferrals = referredOrders.filter((o) =>
        ["CONFIRMED", "DELIVERED"].includes(o.status),
      ).length;
      const referralEarning = successfulReferrals * 250000;

      return {
        ...c,
        isVip: c.isManualVip || c.autoEligible,
        referralsCount,
        successfulReferrals,
        referralEarning,
      };
    });

    return res.json({
      success: true,
      customers: customersList,
      vipThreshold,
      vipPhonesCount: vipPhones.length,
    });
  } catch (error: any) {
    console.error("Customers fetch error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/customers/vip", async (req, res) => {
  try {
    const db = getDb();
    const { phone, isVip } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "شماره تلفن الزامی است." });
    }

    // Fetch existing vip_phones list
    const foundSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_phones"))
      .limit(1);

    let vipPhones: string[] =
      foundSetting.length > 0 ? JSON.parse(foundSetting[0].value) : [];

    const cleanPhone = phone.trim();
    if (isVip) {
      if (!vipPhones.includes(cleanPhone)) {
        vipPhones.push(cleanPhone);
      }
    } else {
      vipPhones = vipPhones.filter((p) => p !== cleanPhone);
    }

    const valueStr = JSON.stringify(vipPhones);

    if (foundSetting.length > 0) {
      await db
        .update(schema.siteSettings)
        .set({ value: valueStr, updatedAt: new Date() })
        .where(eq(schema.siteSettings.key, "vip_phones"));
    } else {
      await db.insert(schema.siteSettings).values({
        key: "vip_phones",
        value: valueStr,
        updatedAt: new Date(),
      });
    }

    return res.json({
      success: true,
      phone: cleanPhone,
      isVip,
      vipPhonesCount: vipPhones.length,
    });
  } catch (error: any) {
    console.error("VIP status update error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/customers/vip-threshold", async (req, res) => {
  try {
    const db = getDb();
    const { threshold } = req.body;
    if (threshold === undefined) {
      return res
        .status(400)
        .json({ success: false, error: "مقدار حد نصاب الزامی است" });
    }

    const foundSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_threshold"))
      .limit(1);

    const valStr = String(threshold);

    if (foundSetting.length > 0) {
      await db
        .update(schema.siteSettings)
        .set({ value: valStr, updatedAt: new Date() })
        .where(eq(schema.siteSettings.key, "vip_threshold"));
    } else {
      await db.insert(schema.siteSettings).values({
        key: "vip_threshold",
        value: valStr,
        updatedAt: new Date(),
      });
    }

    return res.json({ success: true, threshold });
  } catch (error: any) {
    console.error("VIP threshold update error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/change-password", async (req, res) => {
  try {
    const db = getDb();
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "رمز عبور فعلی و جدید الزامی است" });
    }

    const admin = await db.select().from(schema.admins).limit(1);
    if (admin.length === 0) {
      // Fallback for mock DB (AI Studio environment without Postgres)
      if (currentPassword === mockAdminPassword) {
        mockAdminPassword = newPassword;
        return res.json({ success: true, message: "رمز عبور تغییر یافت. این تغییرات موقتی است و روی دیتابیس واقعی اعمال نمی‌شود." });
      }
      return res.status(404).json({ success: false, error: "رمز عبور فعلی اشتباه است" });
    }

    const isMatch = await bcryptjs.compare(currentPassword, admin[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "رمز عبور فعلی اشتباه است" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await db.update(schema.admins).set({ password: hashedPassword }).where(eq(schema.admins.id, admin[0].id));

    return res.json({ success: true, message: "رمز عبور ادمین با موفقیت تغییر کرد" });
  } catch (error: any) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/vip-password", async (req, res) => {
  try {
    const db = getDb();
    const { vipPassword } = req.body;
    
    const foundSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_global_password"))
      .limit(1);

    if (foundSetting.length > 0) {
      await db
        .update(schema.siteSettings)
        .set({ value: vipPassword, updatedAt: new Date() })
        .where(eq(schema.siteSettings.key, "vip_global_password"));
    } else {
      await db.insert(schema.siteSettings).values({
        key: "vip_global_password",
        value: vipPassword,
        updatedAt: new Date(),
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("VIP password update error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/admin/vip-password", async (req, res) => {
  try {
    const db = getDb();
    const foundSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_global_password"))
      .limit(1);

    return res.json({ success: true, vipPassword: foundSetting.length > 0 ? foundSetting[0].value : "" });
  } catch (error: any) {
    console.error("VIP password get error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const vipLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "تعداد تلاش‌ها بیش از حد مجاز است." }
});

app.post("/api/customer/vip-login", vipLoginLimiter, async (req, res) => {
  try {
    const db = getDb();
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: "کلمه عبور وارد نشده است" });
    }

    const foundSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_global_password"))
      .limit(1);

    if (foundSetting.length === 0 || foundSetting[0].value !== password) {
      return res.status(401).json({ success: false, error: "کلمه عبور یکپارچه VIP اشتباه است" });
    }

    return res.json({
      success: true,
      message: "ورود با کلمه عبور VIP موفقیت‌آمیز بود",
      customer: {
        id: "vip-global-user",
        name: "کاربر ویژه (VIP)",
        phone: "VIP-ACCESS",
        email: null,
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        commissionSaved: 0,
        isVip: true,
        nextRankRemaining: 0,
        vipThreshold: 0,
      }
    });
  } catch (error: any) {
    console.error("VIP Login Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// In-Memory SMS OTP Storage for Production & Testing Handshakes

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { success: false, error: "تعداد درخواست‌های پیامک بیش از حد مجاز است." }
});

app.post("/api/customer/send-otp", otpLimiter, async (req, res) => {
  try {
    const db = getDb();
    const { phone } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "شماره همراه ارسال نشده است" });
    }
    const cleanPhone = phone.trim();

    // Check if phone has any active orders or matches customer list
    const customerOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.customerPhone, cleanPhone))
      .limit(1);

    if (customerOrders.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "شماره همراه شما در سیستم باشگاه مبل یافت نشد. لطفاً شماره‌ای را وارد کنید که در هنگام خرید مبل فاکتور کرده‌اید.",
      });
    }

    // Generate a 4 digit OTP code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in memory with 3 minutes expiration
    await db.insert(schema.otps).values({
      phone: cleanPhone,
      code: otpCode,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000)
    }).onConflictDoUpdate({
      target: schema.otps.phone,
      set: { code: otpCode, expiresAt: new Date(Date.now() + 3 * 60 * 1000) }
    });

    // Send real SMS (or simulated if no API key)
    await sendSMSOTP(cleanPhone, otpCode);

    return res.json({
      success: true,
      message: "کد تایید پیامکی با موفقیت ارسال شد.",
      otpCode, // Returning debug code for seamless live preview simulation
    });
  } catch (error: any) {
    console.error("SMS OTP Send error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/customer/verify-otp", async (req, res) => {
  try {
    const db = getDb();
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res
        .status(400)
        .json({
          success: false,
          error: "شماره همراه یا کد تایید ارسال نشده است",
        });
    }

    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    const [record] = await db.select().from(schema.otps).where(eq(schema.otps.phone, cleanPhone)).limit(1);
    if (!record) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "کد تاییدی صادر نشده یا منقضی شده است. لطفا مجدد درخواست پیامکی ارسال کنید.",
        });
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(schema.otps).where(eq(schema.otps.phone, cleanPhone));
      return res
        .status(400)
        .json({
          success: false,
          error: "کد تایید منقضی شده است. لطفا مجدد درخواست پیامکی ارسال کنید.",
        });
    }

    if (record.code !== cleanCode) {
      return res
        .status(400)
        .json({ success: false, error: "کد تایید وارد شده نادرست است." });
    }

    // OTP verified successfully! Delete to prevent reuse
    await db.delete(schema.otps).where(eq(schema.otps.phone, cleanPhone));

    // Prepare full member profile payload
    const customerOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.customerPhone, cleanPhone))
      .orderBy(desc(schema.orders.createdAt));

    // Get VIP system settings
    const vipPhonesSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_phones"))
      .limit(1);
    const vipPhones: string[] =
      vipPhonesSetting.length > 0 ? JSON.parse(vipPhonesSetting[0].value) : [];

    const thresholdSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_threshold"))
      .limit(1);
    const vipThreshold =
      thresholdSetting.length > 0
        ? parseInt(thresholdSetting[0].value)
        : 50 * 1000 * 1000;

    let totalSpentValue = 0;
    let mostRecentName = "";
    let mostRecentCity = "";

    for (const order of customerOrders) {
      if (!mostRecentName && order.customerName)
        mostRecentName = order.customerName;
      if (!mostRecentCity && order.customerCity)
        mostRecentCity = order.customerCity;
      if (["CONFIRMED", "DELIVERED"].includes(order.status)) {
        totalSpentValue += order.agreedPrice || 0;
      }
    }

    const isManualVip = vipPhones.includes(cleanPhone);
    const isAutoVip = totalSpentValue >= vipThreshold;
    const isVip = isManualVip || isAutoVip;

    const productIds = customerOrders.map((o) => o.productId);
    let resolvedProducts: any[] = [];
    if (productIds.length > 0) {
      resolvedProducts = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, productIds));
    }

    const ordersWithProducts = customerOrders.map((order) => {
      const prod = resolvedProducts.find((p) => p.id === order.productId);
      return { ...order, product: prod || null };
    });

    const rewardPoints = Math.floor(totalSpentValue / 1000000);

    const referralOrders = await db
      .select()
      .from(schema.orders)
      .where(like(schema.orders.customerMessage, `%[کد معرف: ${cleanPhone}]%`))
      .orderBy(desc(schema.orders.createdAt));

    const totalReferrals = referralOrders.length;
    const successfulReferrals = referralOrders.filter((o) =>
      ["CONFIRMED", "DELIVERED"].includes(o.status),
    ).length;
    const referralEarning = successfulReferrals * 250000;

    const customerToken = jwt.sign(
      { phone: cleanPhone, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token: customerToken,
      customer: {
        phone: cleanPhone,
        name: mostRecentName || "خریدار عزیز",
        city: mostRecentCity,
        totalOrders: customerOrders.length,
        totalSpent: totalSpentValue,
        isVip,
        rewardPoints,
        vipThreshold,
        nextRankRemaining: Math.max(0, vipThreshold - totalSpentValue),
        totalReferrals,
        successfulReferrals,
        referralEarning,
      },
      orders: ordersWithProducts,
    });
  } catch (error: any) {
    console.error("SMS OTP Verify error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/customer/portal", customerAuthMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const cleanPhone = (req as any).customerUser.phone;
    if (!cleanPhone) return res.status(403).json({ success: false, error: "Forbidden" });


    // Fetch all orders for this buyer phone number
    const customerOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.customerPhone, cleanPhone))
      .orderBy(desc(schema.orders.createdAt));

    if (customerOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          "خریدار یا درخواستی با این شماره یافت نشد. حتما با شماره‌ای وارد شوید که سفارش خود را ثبت کرده‌اید.",
      });
    }

    // Get VIP system settings
    const vipPhonesSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_phones"))
      .limit(1);
    const vipPhones: string[] =
      vipPhonesSetting.length > 0 ? JSON.parse(vipPhonesSetting[0].value) : [];

    const thresholdSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "vip_threshold"))
      .limit(1);
    const vipThreshold =
      thresholdSetting.length > 0
        ? parseInt(thresholdSetting[0].value)
        : 50 * 1000 * 1000;

    // Calculate customer metrics
    let totalOrdersCount = customerOrders.length;
    let totalSpentValue = 0;
    let mostRecentName = "";
    let mostRecentCity = "";

    for (const order of customerOrders) {
      if (!mostRecentName && order.customerName)
        mostRecentName = order.customerName;
      if (!mostRecentCity && order.customerCity)
        mostRecentCity = order.customerCity;
      if (["CONFIRMED", "DELIVERED"].includes(order.status)) {
        totalSpentValue += order.agreedPrice || 0;
      }
    }

    const isManualVip = vipPhones.includes(cleanPhone);
    const isAutoVip = totalSpentValue >= vipThreshold;
    const isVip = isManualVip || isAutoVip;

    // Rich products detail join can be done by fetching products
    const productIds = customerOrders.map((o) => o.productId);
    let resolvedProducts: any[] = [];
    if (productIds.length > 0) {
      resolvedProducts = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, productIds));
    }

    const ordersWithProducts = customerOrders.map((order) => {
      const prod = resolvedProducts.find((p) => p.id === order.productId);
      return {
        ...order,
        product: prod || null,
      };
    });

    // Calculate dynamic points: 1 point per 1,000,000 Tomans
    const rewardPoints = Math.floor(totalSpentValue / 1000000);

    // Dynamic Referral Stats (Scanning customer messages with safe string lookups)
    const referralOrders = await db
      .select()
      .from(schema.orders)
      .where(like(schema.orders.customerMessage, `%[کد معرف: ${cleanPhone}]%`))
      .orderBy(desc(schema.orders.createdAt));

    const totalReferrals = referralOrders.length;
    const successfulReferrals = referralOrders.filter((o) =>
      ["CONFIRMED", "DELIVERED"].includes(o.status),
    ).length;
    const referralEarning = successfulReferrals * 250000; // 250k Toman discount/bonus credit per successful conversion

    return res.json({
      success: true,
      customer: {
        phone: cleanPhone,
        name: mostRecentName || "خریدار عزیز",
        city: mostRecentCity,
        totalOrders: totalOrdersCount,
        totalSpent: totalSpentValue,
        isVip,
        rewardPoints,
        vipThreshold,
        nextRankRemaining: Math.max(0, vipThreshold - totalSpentValue),
        totalReferrals,
        successfulReferrals,
        referralEarning,
      },
      orders: ordersWithProducts,
    });
  } catch (error: any) {
    console.error("Customer Portal API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// SOCIAL LOGIN ENDPOINTS
app.post("/api/customer/social-login", async (req, res) => {
  try {
    const db = getDb();
    const { provider, providerId, email, name } = req.body;

    if (!provider || !providerId) {
      return res
        .status(400)
        .json({ success: false, error: "اطلاعات حساب کاربری ناقص است" });
    }

    // Try finding existing connection
    const existingConnections = await db
      .select()
      .from(schema.customerConnections)
      .where(
        and(
          eq(schema.customerConnections.provider, provider),
          eq(schema.customerConnections.providerId, providerId),
        ),
      )
      .limit(1);

    let connection;
    if (existingConnections.length > 0) {
      connection = existingConnections[0];
    } else {
      // Create new connection
      const newId = crypto.randomUUID();
      await db.insert(schema.customerConnections).values({
        id: newId,
        provider,
        providerId,
        email: email || "",
        name: name || "",
      });

      const freshlyCreated = await db
        .select()
        .from(schema.customerConnections)
        .where(eq(schema.customerConnections.id, newId))
        .limit(1);
      connection = freshlyCreated[0];
    }

    // If connection already has a linked phone:
    if (connection.phone) {
      const cleanPhone = connection.phone.trim();
      const customerOrders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customerPhone, cleanPhone))
        .orderBy(desc(schema.orders.createdAt));

      let totalSpentValue = 0;
      let mostRecentName = connection.name || "";
      let mostRecentCity = "";

      for (const order of customerOrders) {
        if (!mostRecentName && order.customerName)
          mostRecentName = order.customerName;
        if (!mostRecentCity && order.customerCity)
          mostRecentCity = order.customerCity;
        if (["CONFIRMED", "DELIVERED"].includes(order.status)) {
          totalSpentValue += order.agreedPrice || 0;
        }
      }

      const thresholdSetting = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, "vip_threshold"))
        .limit(1);
      const vipThreshold =
        thresholdSetting.length > 0
          ? parseInt(thresholdSetting[0].value)
          : 50 * 1000 * 1000;

      const vipPhonesSetting = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, "vip_phones"))
        .limit(1);
      const vipPhones =
        vipPhonesSetting.length > 0
          ? JSON.parse(vipPhonesSetting[0].value)
          : [];

      const isManualVip = vipPhones.includes(cleanPhone);
      const isAutoVip = totalSpentValue >= vipThreshold;
      const isVip = isManualVip || isAutoVip;

      const productIds = customerOrders.map((o) => o.productId);
      let resolvedProducts: any[] = [];
      if (productIds.length > 0) {
        resolvedProducts = await db
          .select()
          .from(schema.products)
          .where(inArray(schema.products.id, productIds));
      }

      const ordersWithProducts = customerOrders.map((order) => {
        const prod = resolvedProducts.find((p) => p.id === order.productId);
        return { ...order, product: prod || null };
      });

      const rewardPoints = Math.floor(totalSpentValue / 1000000);

      const referralOrders = await db
        .select()
        .from(schema.orders)
        .where(
          like(schema.orders.customerMessage, `%[کد معرف: ${cleanPhone}]%`),
        )
        .orderBy(desc(schema.orders.createdAt));

      const totalReferrals = referralOrders.length;
      const successfulReferrals = referralOrders.filter((o) =>
        ["CONFIRMED", "DELIVERED"].includes(o.status),
      ).length;
      const referralEarning = successfulReferrals * 250000;

      return res.json({
        success: true,
        needsPhone: false,
        connection: {
          id: connection.id,
          provider: connection.provider,
          email: connection.email,
          name: connection.name,
          phone: connection.phone,
        },
        customer: {
          phone: cleanPhone,
          name: mostRecentName || "خریدار عزیز",
          city: mostRecentCity || "ثبت‌نشده",
          totalOrders: customerOrders.length,
          totalSpent: totalSpentValue,
          isVip,
          rewardPoints,
          vipThreshold,
          nextRankRemaining: Math.max(0, vipThreshold - totalSpentValue),
          totalReferrals,
          successfulReferrals,
          referralEarning,
        },
        orders: ordersWithProducts,
      });
    }

    // If connection exists but has no phone linked
    return res.json({
      success: true,
      needsPhone: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        email: connection.email,
        name: connection.name,
        phone: null,
      },
    });
  } catch (error: any) {
    console.error("Social login API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/customer/link-phone", async (req, res) => {
  try {
    const db = getDb();
    const { connectionId, phone, code } = req.body;

    if (!connectionId || !phone || !code) {
      return res
        .status(400)
        .json({
          success: false,
          error: "وارد کردن شماره همراه و کد تایید پیامکی الزامی است",
        });
    }

    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    // Verify SMS OTP first to secure the linking procedure
    const [record] = await db.select().from(schema.otps).where(eq(schema.otps.phone, cleanPhone)).limit(1);
    if (!record) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "کد تایید این شماره معتبر نیست یا منقضی شده است. مجدداً ارسال کنید.",
        });
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(schema.otps).where(eq(schema.otps.phone, cleanPhone));
      return res
        .status(400)
        .json({ success: false, error: "زمان ورود کد تایید سپری شده است." });
    }

    if (record.code !== cleanCode) {
      return res
        .status(400)
        .json({
          success: false,
          error: "کد تایید پیامکی وارد شده نادرست است.",
        });
    }

    // OTP succeeded!
    await db.delete(schema.otps).where(eq(schema.otps.phone, cleanPhone));

    // Check if phone has any orders or leads
    const customerOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.customerPhone, cleanPhone))
      .limit(1);

    if (customerOrders.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "خریدار یا سفارشی با این شماره همراه یافت نشد. برای اتصال، شماره‌ای را بنویسید که در هنگام خرید مبل در سیستم فاکتور ثبت شده است.",
      });
    }

    // Update connection phone
    await db
      .update(schema.customerConnections)
      .set({ phone: cleanPhone, updatedAt: new Date() })
      .where(eq(schema.customerConnections.id, connectionId));

    return res.json({
      success: true,
      message: "حساب کاربری با موفقیت به باشگاه مشتریان متصل شد",
    });
  } catch (error: any) {
    console.error("Link phone API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// ADMIN DASHBOARD & FINANCE SUMMARY

// -----------------------------------------------------------------------------
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const db = getDb();

    const allOrders = await db
      .select({
        id: schema.orders.id,
        status: schema.orders.status,
        customerCity: schema.orders.customerCity,
        customerName: schema.orders.customerName,
        customerPhone: schema.orders.customerPhone,
        createdAt: schema.orders.createdAt,
        agreedPrice: schema.orders.agreedPrice,
        commissionAmount: schema.orders.commissionAmount,
        commissionPaid: schema.orders.commissionPaid,
        productId: schema.orders.productId,
        showroomId: schema.orders.showroomId,
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
      );

    const totalOrdersCount = allOrders.length;

    // 1. Live Calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrdersCount = allOrders.filter(
      (o) => new Date(o.createdAt) >= today,
    ).length;
    const pendingCount = allOrders.filter((o) => o.status === "PENDING").length;

    // Commission Metrics
    let totalCommissionMonth = 0;
    let earnedCommissionPaid = 0;
    let earnedCommissionUnpaid = 0;

    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    allOrders.forEach((o) => {
      const amt = Number(o.commissionAmount) || 0;
      if (amt > 0) {
        if (new Date(o.createdAt) >= currentMonthStart) {
          totalCommissionMonth += amt;
        }
        if (o.commissionPaid) {
          earnedCommissionPaid += amt;
        } else {
          earnedCommissionUnpaid += amt;
        }
      }
    });

    // 2. Analytical Chart Values (30 days past)
    const recentDaysChart: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
      );

      const dayLabel = d.toLocaleDateString("fa-IR", {
        day: "numeric",
        month: "short",
      });
      const ordersInDay = allOrders.filter((o) => {
        const cDate = new Date(o.createdAt);
        return cDate >= startOfDay && cDate <= endOfDay;
      }).length;

      recentDaysChart.push({
        date: dayLabel,
        value: ordersInDay,
      });
    }

    // Recent orders table
    const recentOrders = [...allOrders]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return res.json({
      success: true,
      stats: {
        totalOrdersCount,
        todayOrdersCount,
        pendingCount,
        totalCommissionMonth,
        earnedCommissionPaid,
        earnedCommissionUnpaid,
      },
      chartData: recentDaysChart,
      recentOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// COMMISSION REPORT API
// -----------------------------------------------------------------------------
app.get("/api/admin/commissions", async (req, res) => {
  res.redirect(307, "/api/admin/commissions-report");
});

app.get("/api/admin/commissions-report", async (req, res) => {
  try {
    const db = getDb();

    // Fetch showrooms, orders & commissions details
    const allShowrooms = await db.select().from(schema.showrooms);
    const allOrders = await db
      .select({
        id: schema.orders.id,
        agreedPrice: schema.orders.agreedPrice,
        commissionAmount: schema.orders.commissionAmount,
        commissionPaid: schema.orders.commissionPaid,
        showroomId: schema.orders.showroomId,
      })
      .from(schema.orders);

    const report = allShowrooms.map((sr) => {
      const sOrders = allOrders.filter((o) => o.showroomId === sr.id);

      let totalCommission = 0;
      let paidCommission = 0;
      let unpaidCommission = 0;

      sOrders.forEach((o) => {
        const amt = Number(o.commissionAmount) || 0;
        totalCommission += amt;
        if (o.commissionPaid) {
          paidCommission += amt;
        } else {
          unpaidCommission += amt;
        }
      });

      return {
        id: sr.id,
        name: sr.name,
        city: sr.city,
        rate: sr.commissionRate,
        ordersCount: sOrders.length,
        totalCommission,
        paidCommission,
        unpaidCommission,
      };
    });

    // Detailed transactions
    const detailedList = await db
      .select({
        id: schema.commissions.id,
        orderId: schema.commissions.orderId,
        amount: schema.commissions.amount,
        rateUsed: schema.commissions.rateUsed,
        isPaid: schema.commissions.isPaid,
        paidAt: schema.commissions.paidAt,
        paymentMethod: schema.commissions.paymentMethod,
        notes: schema.commissions.notes,
        createdAt: schema.commissions.createdAt,
        customerName: schema.orders.customerName,
        customerPhone: schema.orders.customerPhone,
        showroomName: schema.showrooms.name,
      })
      .from(schema.commissions)
      .innerJoin(
        schema.orders,
        eq(schema.commissions.orderId, schema.orders.id),
      )
      .innerJoin(
        schema.showrooms,
        eq(schema.commissions.showroomId, schema.showrooms.id),
      )
      .orderBy(desc(schema.commissions.createdAt));

    return res.json({ success: true, report, transactions: detailedList });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// DYNAMIC SITE SETTINGS API
// -----------------------------------------------------------------------------
const DEFAULT_SETTINGS: Record<string, string> = {
  about_title: "درباره گالری مبلمان خانه مبل",
  about_desc:
    "ما محصول عینی نمی‌فروشیم — ما حلقه ارتباطی امن و وکیل شما با نمایشگا‌ه‌های ممتاز مبلمان کشور هستیم.",
  about_content:
    "در مدل سنتی خرید مبل، مشتریان معمولاً با چالش‌های بزرگی نظیر قیمت‌های نامتعادل دلالان، تنوع پایین، تحویل دیرهنگام و عدم همخوانی متریال اسفنج کلاف و چوب با ادعای فروشنده مواجه می‌شوند.\n\nپلتفرم خانه مبل به عنوان مرجع تخصصی دکوراسیون، این خلأ را به شیوه‌ای مدرن پوشش می‌دهد. ما با بیش از ۲۵ کارگاه مبل‌سازی و نمایشگاه‌های برند مبل در بازارهای تخصصی ایران از جمله یافت‌آباد، دلاوران و جاجرود هماهنگ هستیم.",
  contact_address:
    "تهران، بازار مبل یافت‌آباد غربی، بلوار معلم، ساختمان دیزاین فضا، پلاک ۱۸۰، طبقه ۳",
  contact_phone: "۰۲۱-۶۶۵۴۳۲۱۰ / ۰۹۱۲۳۴۵۶۷۸۹",
  contact_email: "management@modern-home.ir",
  instagram: "modern_home_gallery",
  telegram: "modern_home_admin",
  bale: "@modern_home",
  hero_images: "",
  site_logo: "/khane_mobl_logo.jpg",
  site_background: "",
};

let inMemorySettings: Record<string, string> = { ...DEFAULT_SETTINGS };
app.get("/api/settings", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.siteSettings);

    const settings = { ...inMemorySettings };
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    return res.json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/settings", async (req, res) => {
  try {
    const db = getDb();
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res
        .status(400)
        .json({
          success: false,
          error: "تنظیمات به شکل صحیح فرستاده نشده است.",
        });
    }

    for (const [key, val] of Object.entries(settings)) {
      if (typeof val === "string") {
        inMemorySettings[key] = val;
        const existing = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.key, key))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(schema.siteSettings)
            .set({ value: val, updatedAt: new Date() })
            .where(eq(schema.siteSettings.key, key));
        } else {
          await db.insert(schema.siteSettings).values({
            key,
            value: val,
            updatedAt: new Date(),
          });
        }
      }
    }

    const rows = await db.select().from(schema.siteSettings);
    const updatedSettings = { ...inMemorySettings };
    for (const r of rows) {
      updatedSettings[r.key] = r.value;
    }

    return res.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------------------
// VITE AND DEVELOPMENT DEV SERVER ENGINE
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only bind port if not on Vercel serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Only run startServer if not in Vercel. Vercel routes handle static files natively.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
