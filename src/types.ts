export interface Showroom {
  id: string;
  name: string;
  city: string;
  contactPhone: string;
  contactName: string | null;
  commissionRate: string; // decimal representing rate like "10.00"
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ColorVariant {
  name: string;
  image?: string; // swatches or small color preview
  productImage?: string; // main product image with this color
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  images: string[];
  colors: string[];
  colorVariants?: ColorVariant[] | null;
  material: string | null;
  dimensions: string | null;
  fabricType: string | null;
  innerFrame: string | null;
  seatSponge: string | null;
  baseMaterial: string | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  showroomId: string;
  createdAt: string;
}

export type OrderStatus = "PENDING" | "CONTACTED" | "NEGOTIATING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerMessage: string | null;
  productId: string;
  showroomId: string;
  agreedPrice: number | null;
  commissionRate: string | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  commissionPaidAt: string | null;
  status: OrderStatus;
  adminNotes: string | null;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  orderId: string;
  showroomId: string;
  amount: number;
  rateUsed: string;
  isPaid: boolean;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}
