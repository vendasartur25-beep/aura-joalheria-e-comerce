import fs from 'fs';
import path from 'path';
import {
  User,
  Address,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  InventoryMovement,
  Coupon,
  Order,
  OrderItem,
  Review,
  Banner,
  AuditLog,
} from '../types/index.js';

interface StockReservation {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  expires_at: string; // ISO string
  status: 'ACTIVE' | 'FULFILLED' | 'RELEASED';
  created_at: string;
}

interface PaymentRecord {
  id: string;
  order_id: string;
  transaction_id: string;
  gateway: string;
  method: string;
  status: string;
  amount: number;
  qr_code?: string;
  pix_copia_e_cola?: string;
  payload_json?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  idempotency_key: string;
  payload_json: string;
  processed_at: string;
}

export interface DatabaseSchema {
  users: User[];
  user_passwords: Record<string, string>; // userId -> hashedPassword
  addresses: Address[];
  categories: Category[];
  products: Product[];
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  inventory_movements: InventoryMovement[];
  stock_reservations: StockReservation[];
  coupons: Coupon[];
  orders: Order[];
  payments: PaymentRecord[];
  payment_events: PaymentEvent[];
  reviews: Review[];
  favorites: { id: string; user_id: string; product_id: string; created_at: string }[];
  banners: Banner[];
  newsletter: { id: string; email: string; created_at: string }[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'aura_db.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          user_passwords: parsed.user_passwords || {},
          addresses: parsed.addresses || [],
          categories: parsed.categories || [],
          products: parsed.products || [],
          product_images: parsed.product_images || [],
          product_variants: parsed.product_variants || [],
          inventory_movements: parsed.inventory_movements || [],
          stock_reservations: parsed.stock_reservations || [],
          coupons: parsed.coupons || [],
          orders: parsed.orders || [],
          payments: parsed.payments || [],
          payment_events: parsed.payment_events || [],
          reviews: parsed.reviews || [],
          favorites: parsed.favorites || [],
          banners: parsed.banners || [],
          newsletter: parsed.newsletter || [],
          audit_logs: parsed.audit_logs || [],
        };
      } catch (err) {
        console.error('Error reading database file, initializing empty schema:', err);
      }
    }
    return this.getInitialSchema();
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      users: [],
      user_passwords: {},
      addresses: [],
      categories: [],
      products: [],
      product_images: [],
      product_variants: [],
      inventory_movements: [],
      stock_reservations: [],
      coupons: [],
      orders: [],
      payments: [],
      payment_events: [],
      reviews: [],
      favorites: [],
      banners: [],
      newsletter: [],
      audit_logs: [],
    };
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database file:', err);
    } finally {
      this.isSaving = false;
    }
  }

  public get schema(): DatabaseSchema {
    return this.data;
  }

  // Stock & Concurrency Methods
  public getAvailableStock(productId: string, variantId?: string): number {
    this.cleanupExpiredReservations();
    const product = this.data.products.find((p) => p.id === productId);
    if (!product) return 0;

    let baseStock = product.stock_quantity;
    if (variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) baseStock = variant.stock_quantity;
    }

    // Subtract active non-expired reservations
    const nowISO = new Date().toISOString();
    const reserved = this.data.stock_reservations
      .filter(
        (r) =>
          r.product_id === productId &&
          (variantId ? r.variant_id === variantId : true) &&
          r.status === 'ACTIVE' &&
          r.expires_at > nowISO
      )
      .reduce((acc, r) => acc + r.quantity, 0);

    return Math.max(0, baseStock - reserved);
  }

  public cleanupExpiredReservations() {
    const nowISO = new Date().toISOString();
    let updated = false;
    for (const res of this.data.stock_reservations) {
      if (res.status === 'ACTIVE' && res.expires_at <= nowISO) {
        res.status = 'RELEASED';
        updated = true;
      }
    }
    if (updated) this.save();
  }

  public reserveStock(
    orderId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    ttlMinutes = 15
  ): { success: boolean; message?: string } {
    this.cleanupExpiredReservations();

    // Check availability for all items first
    for (const item of items) {
      const avail = this.getAvailableStock(item.productId, item.variantId);
      if (avail < item.quantity) {
        const prod = this.data.products.find((p) => p.id === item.productId);
        return {
          success: false,
          message: `Estoque insuficiente para o produto "${prod?.name || 'Item'}". Disponível: ${avail}, Solicitado: ${item.quantity}`,
        };
      }
    }

    // Create reservations atomically
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    for (const item of items) {
      this.data.stock_reservations.push({
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        expires_at: expiresAt,
        status: 'ACTIVE',
        created_at: now,
      });

      // Add inventory movement record
      this.data.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        product_id: item.productId,
        variant_id: item.variantId,
        type: 'RESERVATION',
        quantity: item.quantity,
        reason: `Reserva temporária para pedido #${orderId}`,
        created_by: 'SYSTEM_CHECKOUT',
        created_at: now,
      });
    }

    this.save();
    return { success: true };
  }

  public releaseReservations(orderId: string) {
    let count = 0;
    for (const res of this.data.stock_reservations) {
      if (res.order_id === orderId && res.status === 'ACTIVE') {
        res.status = 'RELEASED';
        count++;
      }
    }
    if (count > 0) this.save();
  }

  public fulfillReservations(orderId: string) {
    const reservations = this.data.stock_reservations.filter(
      (r) => r.order_id === orderId && r.status === 'ACTIVE'
    );

    const now = new Date().toISOString();

    for (const res of reservations) {
      res.status = 'FULFILLED';

      // Deduct actual product physical stock
      const product = this.data.products.find((p) => p.id === res.product_id);
      if (product) {
        if (res.variant_id && product.variants) {
          const v = product.variants.find((varItem) => varItem.id === res.variant_id);
          if (v) v.stock_quantity = Math.max(0, v.stock_quantity - res.quantity);
        } else {
          product.stock_quantity = Math.max(0, product.stock_quantity - res.quantity);
        }
      }

      this.data.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        product_id: res.product_id,
        variant_id: res.variant_id,
        type: 'OUT',
        quantity: res.quantity,
        reason: `Baixa definitiva por pagamento confirmado do pedido #${orderId}`,
        created_by: 'SYSTEM_PAYMENT',
        created_at: now,
      });
    }

    this.save();
  }

  public logAudit(userId: string, userEmail: string, action: string, resource: string, details?: any) {
    this.data.audit_logs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      user_email: userEmail,
      action,
      resource,
      details: details ? JSON.stringify(details) : undefined,
      created_at: new Date().toISOString(),
    });
    this.save();
  }
}

export const db = new DatabaseEngine();
