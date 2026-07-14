import { MapPin, Instagram, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-stone-100 text-stone-900 pt-24 pb-12 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 pb-16 border-b border-stone-200">
          
          {/* Brand */}
          <div className="md:col-span-5 space-y-8 flex flex-col items-center md:items-start text-center md:text-right">
            <span className="font-bold text-3xl tracking-tight text-stone-900">
              Modern Home
            </span>
            <p className="text-sm text-stone-500 leading-relaxed max-w-sm font-light">
              Modern Home؛ تجلی هنر و مهندسی در خلق فضاهای زیستی. 
              ما مجموعه‌ای از برترین طراحی‌های مبلمان لوکس را برای شما گردآوری کرده‌ایم.
            </p>
          </div>

          {/* Visit Us */}
          <div className="md:col-span-4 space-y-6 flex flex-col items-center md:items-start text-center md:text-right">
            <h4 className="text-xs font-semibold tracking-widest text-stone-900 uppercase">بازدید از Modern Home</h4>
            <ul className="space-y-4 text-sm text-stone-500 font-light">
              <li className="flex flex-col md:flex-row gap-3 items-center md:items-start">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>تهران، فرمانیه، طبقه همکف، پلاک ۲۴</span>
              </li>
              <li className="flex gap-3 items-center justify-center md:justify-start">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span dir="ltr" className="tracking-widest">۰۲۱-۲۲۳۳۴۴۵۵</span>
              </li>
              <li className="pt-2">
                <span className="text-stone-400 text-xs">ساعات کاری: ۱۰ صبح الی ۲۲ شب</span>
              </li>
            </ul>
          </div>

          {/* Social & Links */}
          <div className="md:col-span-3 space-y-6 flex flex-col items-center md:items-start text-center md:text-right">
            <h4 className="text-xs font-semibold tracking-widest text-stone-900 uppercase">ارتباطات</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 transition-all"
                aria-label="Instagram Link"
              >
                <Instagram className="w-4 h-4" />
              </a>
              {/* WhatsApp custom icon */}
              <a
                href="https://wa.me/123456789"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 transition-all"
                aria-label="WhatsApp Link"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
            <Link to="/contact" className="inline-block mt-4 text-xs font-medium tracking-widest text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors uppercase">
              ارسال پیام مستقیم
            </Link>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-400 gap-4 font-light">
          <p>© {new Date().getFullYear()} گالری مبلمان Modern Home. تمامی حقوق محفوظ است.</p>
        </div>

      </div>
    </footer>
  );
}
