import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { getDb } from "./index.js";
import { admins, showrooms, categories, products, siteSettings } from "./schema.js";
import { eq } from "drizzle-orm";

export async function runSeed() {
  const db = getDb();

  console.log("Starting DB seeding check...");

  try {
    // 1. Check if Admin exists
    const existingAdmins = await db.select().from(admins).limit(1);
    if (existingAdmins.length === 0) {
      console.log("No admin found. Creating default admin...");
      const randomPass = "admin123";
      console.log(`[FIRST RUN] Admin password: ${randomPass}`);
      const hashedPassword = await bcryptjs.hash(randomPass, 12);
      await db.insert(admins).values({
        username: "admin",
        password: hashedPassword,
      });
    } else {
      console.log("Admin already exists.");
    }

    // 2. Check and Seed Categories
    const existingCategories = await db.select().from(categories).limit(1);
    let sofaCategoryId = "";
    let comfortSofaCategoryId = "";
    let tableCategoryId = "";
    let bedroomCategoryId = "";

    if (existingCategories.length === 0) {
      console.log("Seeding categories...");
      const cats = [
        {
          name: "کاناپه لوکس",
          slug: "sofa",
          sortOrder: 1,
          image:
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80",
        },
        {
          name: "مبل راحتی",
          slug: "comfort-sofa",
          sortOrder: 2,
          image:
            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500&auto=format&fit=crop&q=80",
        },
        {
          name: "میز مدرن",
          slug: "table",
          sortOrder: 3,
          image:
            "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=80",
        },
        {
          name: "سرویس خواب",
          slug: "bedroom-set",
          sortOrder: 4,
          image:
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop&q=80",
        },
      ];

      for (const cat of cats) {
        const inserted = await db.insert(categories).values(cat).returning();
        if (cat.slug === "sofa") sofaCategoryId = inserted[0]?.id || "";
        if (cat.slug === "comfort-sofa") comfortSofaCategoryId = inserted[0]?.id || "";
        if (cat.slug === "table") tableCategoryId = inserted[0]?.id || "";
        if (cat.slug === "bedroom-set") bedroomCategoryId = inserted[0]?.id || "";
      }
      console.log("Categories seeded successfully.");
    } else {
      const allCats = await db.select().from(categories);
      sofaCategoryId = allCats.find((c: any) => c.slug === "sofa")?.id || "";
      comfortSofaCategoryId =
        allCats.find((c: any) => c.slug === "comfort-sofa")?.id || "";
      tableCategoryId = allCats.find((c: any) => c.slug === "table")?.id || "";
      bedroomCategoryId =
        allCats.find((c: any) => c.slug === "bedroom-set")?.id || "";
    }

    // 3. Check and Seed Showrooms
    const existingShowrooms = await db.select().from(showrooms).limit(1);
    let afraShowroomId = "";
    let araxShowroomId = "";

    if (existingShowrooms.length === 0) {
      console.log("Seeding showrooms...");
      const afra = await db
        .insert(showrooms)
        .values({
          name: "نمایشگاه مبل افرا",
          city: "تهران",
          contactPhone: "09123456789",
          contactName: "علیرضا رضایی",
          commissionRate: "10.00",
          address: "تهران، بازار مبل یافت‌آباد، خیابان فلان، پلاک ۴۰",
          notes: "یکی از بزرگترین نمایشگاه‌های مبل کلاسیک تهران با کیفیت ممتاز",
          isActive: true,
        })
        .returning();
      afraShowroomId = afra[0]?.id || "";

      const arax = await db
        .insert(showrooms)
        .values({
          name: "نمایشگاه مبل آراکس",
          city: "تبریز",
          contactPhone: "09149876543",
          contactName: "مهندس تبریزی",
          commissionRate: "15.00",
          address: "تبریز، خیابان آزادی، پاساژ مبل آراکس",
          notes:
            "تولیدکننده تخصصی مبل‌های مدرن و کاناپه راحتی با چرم طبیعی درجه یک",
          isActive: true,
        })
        .returning();
      araxShowroomId = arax[0]?.id || "";

      console.log("Showrooms seeded successfully.");
    } else {
      const allShowrooms = await db.select().from(showrooms);
      afraShowroomId =
        allShowrooms.find((s: any) => s.name === "نمایشگاه مبل افرا")?.id || "";
      araxShowroomId =
        allShowrooms.find((s: any) => s.name === "نمایشگاه مبل آراکس")?.id ||
        "";
    }

    // 4. Check and Seed Products
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0 && afraShowroomId && araxShowroomId) {
      console.log("Seeding featured products...");
      const sampleProducts = [
        {
          name: "مبل راحتی چستر لوکس افرا",
          slug: "chesterfield-luxury-sofa",
          description:
            "مبل راحتی مدل چستر با کوسن‌های تمام پر، پارچه نانو ضد لک، اسفنج ۳۵ کیلویی یورتان و اسکلت چوب چنار محکم. انتخابی بی‌نظیر برای دکوراسیون‌های شیک و امروزی.",
          basePrice: 65000000,
          images: [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&auto=format&fit=crop&q=80",
          ],
          colors: ["کرم", "طوسی تیره", "یشمی"],
          material: "چوب چنار و پارچه مسکو نانو",
          dimensions: "طول: ۲۲۰ سانتی‌متر - عرض: ۹۰ سانتی‌متر",
          fabricType: "میکروفایبر ضد لک",
          innerFrame: "روس چنار خشک",
          seatSponge: "۳۵ کیلویی ویژه ویژه",
          baseMaterial: "راش گرجستان",
          isFeatured: true,
          isActive: true,
          categoryId: comfortSofaCategoryId || sofaCategoryId,
          showroomId: afraShowroomId,
        },
        {
          name: "کاناپه چرم طبیعی آراکس",
          slug: "arax-leather-sofa",
          description:
            "کاناپه چرمی با طراحی مینیمال ایتالیایی، استفاده از چرم طبیعی ایتالیایی دست‌دوز، پایه‌های فلزی آبکاری شده ضد زنگ و نشیمن بسیار راحت با فنربندی پاکتی.",
          basePrice: 120000000,
          images: [
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
          ],
          colors: ["قهوه‌ای شکلاتی", "مشکی مات", "عسلی"],
          material: "چرم طبیعی گاو و فلز تیتانیوم",
          dimensions: "طول: ۲۴۰ سانتی‌متر - عرض: ۹۵ سانتی‌متر",
          fabricType: "چرم گاو درجه یک ایتالیایی",
          innerFrame: "فلز و چوب جک",
          seatSponge: "اسفنج اچ‌آر (HR)",
          baseMaterial: "استیل ۳۰۴ ضد زنگ",
          isFeatured: true,
          isActive: true,
          categoryId: sofaCategoryId,
          showroomId: araxShowroomId,
        },
        {
          name: "مبل راحتی مینیمال جولی",
          slug: "jolly-minimalist-sofa",
          description:
            "طراحی کژوال اسکاندیناوی فاقد زوایای تیز، نرمی فوق‌العاده برای استراحت روزمره. انتخابی ایده‌آل برای خانه‌های آپارتمانی شیک و جوان‌پسند.",
          basePrice: 48000000,
          images: [
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80",
          ],
          colors: ["سفید استخوانی", "سبز زیتونی", "طوسی روشن"],
          material: "پارچه تدی درجه یک و پایه چوب راش",
          dimensions: "طول: ۲۰۰ سانتی‌متر - عرض: ۸۵ سانتی‌متر",
          fabricType: "پارچه گونی‌باف تدی لوکس",
          innerFrame: "نراد روسی با مقاومت بالا",
          seatSponge: "یورتان نرم ویژه",
          baseMaterial: "راش طبیعی نقاشی شده",
          isFeatured: true,
          isActive: true,
          categoryId: comfortSofaCategoryId,
          showroomId: afraShowroomId,
        },
        {
          name: "میز جلومبلی کلاسیک چوب گردو آراکس",
          slug: "arax-walnut-coffee-table",
          description:
            "میز پذیرایی سلطنتی با ممرز گردوی طبیعی دست‌ساز. نقوش زیبای چوب طبیعی روی صفحه میز به کاراکتر خانه شما اصالت می‌بخشد.",
          basePrice: 18000000,
          images: [
            "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80",
          ],
          colors: ["خود رنگ گردویی", "فندقی تیره"],
          material: "چوب ۱۰۰٪ گردو جنگلی",
          dimensions: "۱۰۰ در ۱۰۰ سانتی‌متر - ارتفاع: ۴۰ سانتی‌متر",
          fabricType: "فاقد پارچه",
          innerFrame: "کلاف یکپارچه گردو",
          seatSponge: "ندارد",
          baseMaterial: "چوب درخت گردو کهنه شده",
          isFeatured: true,
          isActive: true,
          categoryId: tableCategoryId,
          showroomId: araxShowroomId,
        },
        {
          name: "سرویس خواب امپراتور پرنسس افرا",
          slug: "princess-luxury-bedroom-set",
          description:
            "تخت دو نفره به همراه دو عدد میز پاتختی، آینه قدی و صندلی آرایش. لمس‌دوزی‌های چرمی روی تاج تخت با جزئیات نقره‌کوب دست‌ساز خیره‌کننده.",
          basePrice: 95000000,
          images: [
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80",
          ],
          colors: ["صدفی طلایی", "کرم نقره‌کوب"],
          material: "ام‌دی‌اف وارداتی و امپریال پی‌وی‌سی و پارچه مخمل لوکس",
          dimensions: "تخت: ۲۰۰ در ۱۸۰ سانتی‌متر",
          fabricType: "مخمل کوبیده بلژیکی",
          innerFrame: "چوب سفید چندلایی ضد رطوبت",
          seatSponge: "اسفنج دانسیته بالا روی بدنه تخت",
          baseMaterial: "راش با پاشنه برنجی طلایی",
          isFeatured: true,
          isActive: true,
          categoryId: bedroomCategoryId,
          showroomId: afraShowroomId,
        },
      ];

      for (const prod of sampleProducts) {
        await db.insert(products).values(prod);
      }
      console.log("5 sample products seeded successfully.");
    } else {
      console.log("5 sample products seeded successfully.");
    }

    // 5. Check and Seed Site Settings
    const existingSettings = await db.select().from(siteSettings).limit(1);
    if (existingSettings.length === 0) {
      console.log("Seeding site settings...");
      const defaultSettings = [
        { key: "site_name", value: "خانه مبل | گالری مبلمان لوکس" },
        { key: "site_logo", value: "/khane_mobl_logo.jpg" },
        { key: "about_title", value: "درباره گالری مبلمان خانه مبل" },
        { key: "about_desc", value: "ما محصول عینی نمی‌فروشیم — ما حلقه ارتباطی امن و وکیل شما با نمایشگا‌ه‌های ممتاز مبلمان کشور هستیم." },
        { key: "about_content", value: "در مدل سنتی خرید مبل، مشتریان معمولاً با چالش‌های بزرگی نظیر قیمت‌های نامتعادل دلالان، تنوع پایین، تحویل دیرهنگام و عدم همخوانی متریال اسفنج کلاف و چوب با ادعای فروشنده مواجه می‌شوند.\n\nپلتفرم خانه مبل به عنوان مرجع تخصصی دکوراسیون، این خلأ را به شیوه‌ای مدرن پوشش می‌دهد. ما با بیش از ۲۵ کارگاه مبل‌سازی و نمایشگاه‌های برند مبل در بازارهای تخصصی ایران از جمله یافت‌آباد، دلاوران و جاجرود هماهنگ هستیم." },
        { key: "contact_address", value: "تهران، بازار مبل یافت‌آباد غربی، بلوار معلم، ساختمان دیزاین فضا، پلاک ۱۸۰، طبقه ۳" },
        { key: "contact_phone", value: "۰۲۱-۶۶۵۴۳۲۱۰ / ۰۹۱۲۳۴۵۶۷۸۹" },
        { key: "contact_email", value: "management@modern-home.ir" },
        { key: "instagram", value: "modern_home_gallery" },
        { key: "telegram", value: "modern_home_admin" },
        { key: "bale", value: "@modern_home" },
        { key: "hero_images", value: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1600&auto=format&fit=crop&q=80" },
      ];

      for (const setting of defaultSettings) {
        await db.insert(siteSettings).values({ ...setting, updatedAt: new Date() });
      }
      console.log("Site settings seeded successfully.");
    }

    console.log("Database seed check and setup completed successfully.");
  } catch (error) {
    console.error("Error running DB seed:", error);
  }
}

// Automatically run seed when executed directly as a script via CLI
if (
  process.argv[1] &&
  (process.argv[1].includes("seed.ts") || process.argv[1].endsWith("seed.js"))
) {
  runSeed()
    .then(() => {
      console.log("Seeding process completed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding command failure:", err);
      process.exit(1);
    });
}
