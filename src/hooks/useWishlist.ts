import { useState, useEffect } from "react";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("mh_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist");
      }
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      let updated;
      if (prev.includes(productId)) {
        updated = prev.filter((id) => id !== productId);
      } else {
        updated = [...prev, productId];
      }
      localStorage.setItem("mh_wishlist", JSON.stringify(updated));
      // Dispatch custom event so other components (like Navbar) can update immediately
      window.dispatchEvent(new Event("wishlist_updated"));
      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return { wishlist, toggleWishlist, isInWishlist };
}
