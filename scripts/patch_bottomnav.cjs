const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf-8');

code = code.replace(
  'const { wishlistCount } = useWishlist();',
  `const { wishlist } = useWishlist();
  const [wishlistCount, setWishlistCount] = React.useState(wishlist.length);
  
  React.useEffect(() => {
    const handleWishlistUpdate = () => {
      const saved = localStorage.getItem("mh_wishlist");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWishlistCount(parsed.length);
        } catch (e) {}
      }
    };
    window.addEventListener("wishlist_updated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlist_updated", handleWishlistUpdate);
  }, []);`
);

fs.writeFileSync('src/components/BottomNav.tsx', code);
