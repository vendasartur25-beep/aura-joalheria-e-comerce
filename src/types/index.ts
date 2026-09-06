export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  is_default: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  price?: number;
  stock_quantity: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  promo_price?: number;
  pix_price: number;
  sku: string;
  stock_quantity: number;
  available_stock?: number;
  category_id: string;
  category_name?: string;
  material: string;
  color: string;
  size?: string;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  rating_avg: number;
  rating_count: number;
  images: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unit_price: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  min_order_value: number;
  usage_limit: number;
  times_used: number;
  expires_at: string;
  active: boolean;
}

export type OrderStatus =
  | 'Aguardando pagamento'
  | 'Pago'
  | 'Em preparação'
  | 'Enviado'
  | 'Entregue'
  | 'Cancelado'
  | 'Reembolsado';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  coupon_code?: string;
  shipping_cost: number;
  shipping_method: string;
  total: number;
  shipping_address: Address;
  tracking_code?: string;
  tracking_url?: string;
  pix_qr_code?: string;
  pix_copia_e_cola?: string;
  pix_expires_at?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  product_id: string;
  product_name?: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  link: string;
  display_order: number;
  active: boolean;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVATION';
  quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details?: string;
  created_at: string;
}

export interface ShippingQuote {
  code: string;
  name: string;
  price: number;
  delivery_days: number;
  company: string;
}
