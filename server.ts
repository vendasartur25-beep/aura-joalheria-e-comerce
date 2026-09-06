import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import qrcode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import { seedInitialDatabase } from './src/server/seed.js';
import { User, UserRole, OrderStatus, PaymentStatus } from './src/types/index.js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aura_super_secret_jwt_key_2026_change_in_production';

// Extend Express Request interface for Auth
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  // Seed DB on start
  await seedInitialDatabase();

  // Middleware: Auth Token extractor
  const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies.aura_token;

    if (!token) {
      req.user = undefined;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  };

  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Sessão expirada ou não autenticada. Faça login para continuar.' });
    }
    next();
  };

  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Acesso negado. Autenticação necessária.' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente para este recurso.' });
      }
      next();
    };
  };

  app.use(authenticateToken);

  // ==========================================
  // AUTHENTICATION APIs
  // ==========================================
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password, cpf, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const existing = db.schema.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser: User = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: cpf || undefined,
        phone: phone || undefined,
        role: 'CUSTOMER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.schema.users.push(newUser);
      db.schema.user_passwords[userId] = passwordHash;
      db.save();

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.cookie('aura_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      db.logAudit(newUser.id, newUser.email, 'USER_REGISTER', 'AUTH', { name: newUser.name });

      return res.json({ user: newUser, token });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const user = db.schema.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
      }

      const passwordHash = db.schema.user_passwords[user.id];
      const match = passwordHash ? await bcrypt.compare(password, passwordHash) : false;

      if (!match) {
        return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.cookie('aura_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      db.logAudit(user.id, user.email, 'USER_LOGIN', 'AUTH', { role: user.role });

      return res.json({ user, token });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
  });

  app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const user = db.schema.users.find((u) => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json({ user });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('aura_token');
    return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // ==========================================
  // CUSTOMER ADDRESSES APIs
  // ==========================================
  app.get('/api/addresses', requireAuth, (req: AuthRequest, res: Response) => {
    const addresses = db.schema.addresses.filter((a) => a.user_id === req.user?.id);
    return res.json({ addresses });
  });

  app.post('/api/addresses', requireAuth, (req: AuthRequest, res: Response) => {
    const { recipient_name, cep, state, city, neighborhood, street, number, complement, is_default } = req.body;

    if (!cep || !state || !city || !street || !number) {
      return res.status(400).json({ error: 'Campos de endereço obrigatórios incompletos.' });
    }

    if (is_default) {
      db.schema.addresses.forEach((a) => {
        if (a.user_id === req.user?.id) a.is_default = false;
      });
    }

    const newAddr = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.user!.id,
      recipient_name: recipient_name || req.user!.email,
      cep: cep.replace(/\D/g, ''),
      state: state.toUpperCase(),
      city,
      neighborhood: neighborhood || '',
      street,
      number,
      complement: complement || '',
      is_default: Boolean(is_default),
    };

    db.schema.addresses.push(newAddr);
    db.save();

    return res.json({ address: newAddr });
  });

  app.delete('/api/addresses/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const index = db.schema.addresses.findIndex((a) => a.id === id && a.user_id === req.user?.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Endereço não encontrado ou não pertence a esta conta.' });
    }
    db.schema.addresses.splice(index, 1);
    db.save();
    return res.json({ success: true });
  });

  // ==========================================
  // PRODUCTS & CATALOG APIs
  // ==========================================
  app.get('/api/products', (req: Request, res: Response) => {
    const {
      search,
      category,
      min_price,
      max_price,
      in_stock,
      on_promo,
      sort,
      page = '1',
      limit = '12',
    } = req.query;

    db.cleanupExpiredReservations();

    let list = db.schema.products.filter((p) => p.is_active);

    // Search query
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && typeof category === 'string') {
      const catObj = db.schema.categories.find(
        (c) => c.slug === category || c.id === category || c.name.toLowerCase() === category.toLowerCase()
      );
      if (catObj) {
        list = list.filter((p) => p.category_id === catObj.id);
      }
    }

    // Price range
    if (min_price && !isNaN(Number(min_price))) {
      list = list.filter((p) => (p.promo_price || p.price) >= Number(min_price));
    }
    if (max_price && !isNaN(Number(max_price))) {
      list = list.filter((p) => (p.promo_price || p.price) <= Number(max_price));
    }

    // On Promo
    if (on_promo === 'true') {
      list = list.filter((p) => p.promo_price && p.promo_price < p.price);
    }

    // In Stock
    if (in_stock === 'true') {
      list = list.filter((p) => db.getAvailableStock(p.id) > 0);
    }

    // Sorting
    if (sort === 'price_asc') {
      list.sort((a, b) => (a.promo_price || a.price) - (b.promo_price || b.price));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => (b.promo_price || b.price) - (a.promo_price || a.price));
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (sort === 'bestseller') {
      list.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Attach current dynamic available stock
    const mapped = list.map((p) => ({
      ...p,
      available_stock: db.getAvailableStock(p.id),
    }));

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const total = mapped.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = mapped.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.json({
      products: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
      },
    });
  });

  app.get('/api/products/:slugOrId', (req: Request, res: Response) => {
    const { slugOrId } = req.params;
    const product = db.schema.products.find((p) => p.id === slugOrId || p.slug === slugOrId);

    if (!product || !product.is_active) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const availableStock = db.getAvailableStock(product.id);
    const reviews = db.schema.reviews.filter((r) => r.product_id === product.id && r.status === 'APPROVED');
    const related = db.schema.products
      .filter((p) => p.category_id === product.category_id && p.id !== product.id && p.is_active)
      .slice(0, 4);

    return res.json({
      product: {
        ...product,
        available_stock: availableStock,
      },
      reviews,
      related,
    });
  });

  app.get('/api/categories', (req: Request, res: Response) => {
    const categories = db.schema.categories.filter((c) => c.active).sort((a, b) => a.display_order - b.display_order);
    return res.json({ categories });
  });

  app.get('/api/banners', (req: Request, res: Response) => {
    const banners = db.schema.banners.filter((b) => b.active).sort((a, b) => a.display_order - b.display_order);
    return res.json({ banners });
  });

  // ==========================================
  // REVIEWS APIs
  // ==========================================
  app.get('/api/reviews', (req: Request, res: Response) => {
    const { product_id } = req.query;
    let reviews = db.schema.reviews.filter((r) => r.status === 'APPROVED');
    if (product_id) {
      reviews = reviews.filter((r) => r.product_id === product_id);
    }
    return res.json({ reviews });
  });

  app.post('/api/reviews', requireAuth, (req: AuthRequest, res: Response) => {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating || !comment) {
      return res.status(400).json({ error: 'Produto, nota e comentário são obrigatórios.' });
    }

    // Check if user is a verified buyer
    const userOrders = db.schema.orders.filter(
      (o) => o.user_id === req.user?.id && (o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Em preparação' || o.status === 'Enviado')
    );

    const isVerified = userOrders.some((o) => o.items.some((item) => item.product_id === product_id));

    const userObj = db.schema.users.find((u) => u.id === req.user?.id);
    const prod = db.schema.products.find((p) => p.id === product_id);

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      product_id,
      product_name: prod?.name,
      user_id: req.user!.id,
      user_name: userObj ? `${userObj.name.split(' ')[0]} ${userObj.name.split(' ')[1]?.[0] || ''}.` : 'Cliente Aura',
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      is_verified_buyer: isVerified,
      status: 'APPROVED' as const, // Auto-approve valid buyer reviews
      created_at: new Date().toISOString(),
    };

    db.schema.reviews.unshift(newReview);

    // Update product average rating
    if (prod) {
      const prodReviews = db.schema.reviews.filter((r) => r.product_id === product_id && r.status === 'APPROVED');
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      prod.rating_avg = Number(avg.toFixed(1));
      prod.rating_count = prodReviews.length;
    }

    db.save();

    return res.json({ review: newReview, message: 'Avaliação enviada com sucesso!' });
  });

  // ==========================================
  // SHIPPING & CEP CALCULATOR
  // ==========================================
  app.post('/api/shipping/calculate', (req: Request, res: Response) => {
    const { cep, items_subtotal } = req.body;

    if (!cep) {
      return res.status(400).json({ error: 'Informe um CEP válido para cálculo de frete.' });
    }

    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
      return res.status(400).json({ error: 'CEP deve possuir 8 dígitos.' });
    }

    const subtotal = Number(items_subtotal) || 0;
    const isFreeShippingEligible = subtotal >= 500; // Free shipping above R$500

    const options = [
      {
        code: 'PAC',
        name: 'PAC Correios (Econômico)',
        company: 'Correios',
        price: isFreeShippingEligible ? 0 : 24.90,
        delivery_days: 5,
      },
      {
        code: 'SEDEX',
        name: 'Sedex Expresso (Entrega Rápida)',
        company: 'Correios',
        price: isFreeShippingEligible ? 0 : 38.50,
        delivery_days: 2,
      },
      {
        code: 'AURA_BLACK',
        name: 'Aura VIP Entregas de Luxo (São Paulo)',
        company: 'Aura Logística',
        price: 49.00,
        delivery_days: 1,
      },
    ];

    return res.json({ cep: cleanedCep, options });
  });

  // ==========================================
  // COUPONS API
  // ==========================================
  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Informe o código do cupom.' });
    }

    const coupon = db.schema.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);

    if (!coupon) {
      return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
    }

    if (coupon.expires_at < new Date().toISOString()) {
      return res.status(400).json({ error: 'Este cupom de desconto já expirou.' });
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Este cupom atingiu o limite de utilizações.' });
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (coupon.min_order_value && orderSubtotal < coupon.min_order_value) {
      return res.status(400).json({
        error: `O valor mínimo para utilizar este cupom é de R$ ${coupon.min_order_value.toFixed(2)}.`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    discountAmount = Math.min(discountAmount, orderSubtotal);

    return res.json({
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount_amount: discountAmount,
      },
    });
  });

  // ==========================================
  // CHECKOUT & ORDERS APIs
  // ==========================================
  app.post('/api/checkout/reserve', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { items, shipping_address, shipping_method, payment_method, coupon_code } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
      }

      if (!shipping_address || !shipping_address.street || !shipping_address.number) {
        return res.status(400).json({ error: 'Endereço de entrega é obrigatório.' });
      }

      // Step 1: Validate items stock & calculate subtotal
      let subtotal = 0;
      const reservationItems: Array<{ productId: string; variantId?: string; quantity: number }> = [];
      const orderItems: Array<any> = [];

      for (const item of items) {
        const product = db.schema.products.find((p) => p.id === item.productId && p.is_active);
        if (!product) {
          return res.status(400).json({ error: `Produto não encontrado ou indisponível (ID: ${item.productId})` });
        }

        const unitPrice = product.promo_price || product.price;
        const totalItemPrice = unitPrice * item.quantity;
        subtotal += totalItemPrice;

        reservationItems.push({
          productId: product.id,
          variantId: item.variantId,
          quantity: item.quantity,
        });

        orderItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          product_image: product.images[0]?.image_url || '',
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalItemPrice,
        });
      }

      // Calculate coupon discount
      let discount = 0;
      if (coupon_code) {
        const coupon = db.schema.coupons.find((c) => c.code.toUpperCase() === coupon_code.toUpperCase() && c.active);
        if (coupon && subtotal >= coupon.min_order_value) {
          discount = coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
          discount = Math.min(discount, subtotal);
          coupon.times_used += 1;
        }
      }

      // Pix 5% additional discount
      if (payment_method === 'PIX') {
        const pixDiscount = (subtotal - discount) * 0.05;
        discount += pixDiscount;
      }

      const shippingCost = shipping_method?.price || 0;
      const total = Math.max(0, subtotal - discount + shippingCost);

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderNumber = `AUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Step 2: Atomic Stock Reservation with lock check
      const reservationResult = db.reserveStock(orderId, reservationItems, 15);
      if (!reservationResult.success) {
        return res.status(400).json({ error: reservationResult.message });
      }

      // Step 3: Dynamic Pix QR Code generation
      let pixQrCode = '';
      let pixCopiaECola = '';
      let pixExpiresAt = '';

      if (payment_method === 'PIX') {
        pixExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        pixCopiaECola = `00020126580014br.gov.bcb.pix0136aura-${orderNumber}-pix-key0212PagamentoAura520400005303986540${total.toFixed(2)}5802BR5910AURA JOIAS6009SAO PAULO62070503***6304C8A1`;
        // Generate QR code data URI
        try {
          pixQrCode = await qrcode.toDataURL(pixCopiaECola);
        } catch (qrErr) {
          pixQrCode = '';
        }
      }

      const userObj = db.schema.users.find((u) => u.id === req.user?.id);

      const newOrder = {
        id: orderId,
        order_number: orderNumber,
        user_id: req.user!.id,
        user_name: userObj?.name || 'Cliente Aura',
        user_email: req.user!.email,
        user_phone: userObj?.phone,
        status: 'Aguardando pagamento' as OrderStatus,
        payment_method: (payment_method as any) || 'PIX',
        payment_status: 'PENDING' as PaymentStatus,
        subtotal,
        discount,
        coupon_code,
        shipping_cost: shippingCost,
        shipping_method: shipping_method?.name || 'Sedex Expresso',
        total,
        shipping_address,
        pix_qr_code: pixQrCode,
        pix_copia_e_cola: pixCopiaECola,
        pix_expires_at: pixExpiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderItems,
      };

      db.schema.orders.unshift(newOrder);

      // Create Payment Record
      db.schema.payments.push({
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        order_id: orderId,
        transaction_id: `tx_${Date.now()}`,
        gateway: 'MERCADOPAGO_AURA',
        method: payment_method,
        status: 'PENDING',
        amount: total,
        qr_code: pixQrCode,
        pix_copia_e_cola: pixCopiaECola,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.save();

      db.logAudit(req.user!.id, req.user!.email, 'CREATE_ORDER', 'ORDER', {
        order_id: orderId,
        order_number: orderNumber,
        total,
      });

      return res.json({
        success: true,
        order: newOrder,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      return res.status(500).json({ error: 'Erro ao processar reserva do pedido.' });
    }
  });

  app.get('/api/orders/my', requireAuth, (req: AuthRequest, res: Response) => {
    const orders = db.schema.orders.filter((o) => o.user_id === req.user?.id);
    return res.json({ orders });
  });

  app.get('/api/orders/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const order = db.schema.orders.find((o) => (o.id === id || o.order_number === id) && (o.user_id === req.user?.id || req.user?.role !== 'CUSTOMER'));
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    return res.json({ order });
  });

  // ==========================================
  // REAL WEBHOOK & PAYMENT INTEGRATION
  // ==========================================
  const handlePaymentWebhook = (payload: {
    event_id: string;
    transaction_id?: string;
    order_id: string;
    status: 'APPROVED' | 'REJECTED' | 'EXPIRED';
    payment_method?: string;
  }) => {
    const { event_id, order_id, status } = payload;

    // Idempotency check: Ensure the same event isn't processed twice
    const existingEvent = db.schema.payment_events.find((e) => e.idempotency_key === event_id);
    if (existingEvent) {
      return { duplicate: true, message: 'Evento de webhook já processado anteriormente.' };
    }

    const order = db.schema.orders.find((o) => o.id === order_id || o.order_number === order_id);
    if (!order) {
      return { error: 'Pedido não encontrado no sistema.' };
    }

    // Record payment event for idempotency
    db.schema.payment_events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      payment_id: order.id,
      event_type: `PAYMENT_${status}`,
      idempotency_key: event_id,
      payload_json: JSON.stringify(payload),
      processed_at: new Date().toISOString(),
    });

    if (status === 'APPROVED') {
      order.payment_status = 'APPROVED';
      order.status = 'Pago';
      order.updated_at = new Date().toISOString();

      // Deduct physical inventory & fulfill reservations
      db.fulfillReservations(order.id);
    } else if (status === 'REJECTED' || status === 'EXPIRED') {
      order.payment_status = status;
      order.status = 'Cancelado';
      order.updated_at = new Date().toISOString();

      // Release stock reservation
      db.releaseReservations(order.id);
    }

    db.save();

    return {
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      new_status: order.status,
    };
  };

  app.post('/api/webhooks/payment', (req: Request, res: Response) => {
    const { event_id, order_id, status } = req.body;

    if (!event_id || !order_id || !status) {
      return res.status(400).json({ error: 'Payload do webhook inválido.' });
    }

    const result = handlePaymentWebhook(req.body);
    return res.json(result);
  });

  // Interactive Webhook Sandbox Simulator Endpoint for Admin & Order Testing
  app.post('/api/webhooks/simulator', requireAuth, (req: AuthRequest, res: Response) => {
    const { order_id, action } = req.body;

    if (!order_id || !action) {
      return res.status(400).json({ error: 'Pedido e Ação são obrigatórios para o simulador.' });
    }

    const eventId = `sim_evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const status = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'EXPIRED';

    const result = handlePaymentWebhook({
      event_id: eventId,
      order_id,
      status,
    });

    db.logAudit(req.user!.id, req.user!.email, 'SIMULATE_WEBHOOK', 'PAYMENT', { order_id, action, status });

    return res.json(result);
  });

  // ==========================================
  // PROTECTED ADMIN PANEL APIs (RBAC: ADMIN, MANAGER, SUPPORT)
  // ==========================================
  const adminRouter = express.Router();
  adminRouter.use(requireRole(['ADMIN', 'MANAGER', 'SUPPORT']));

  // Admin Dashboard Metrics
  adminRouter.get('/metrics', (req: Request, res: Response) => {
    const paidOrders = db.schema.orders.filter((o) => o.status === 'Pago' || o.status === 'Em preparação' || o.status === 'Enviado' || o.status === 'Entregue');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = db.schema.orders.length;
    const totalProductsCount = db.schema.products.length;
    const totalCustomersCount = db.schema.users.filter((u) => u.role === 'CUSTOMER').length;

    // Out of stock products
    const outOfStockProducts = db.schema.products.filter((p) => db.getAvailableStock(p.id) === 0);

    return res.json({
      metrics: {
        total_revenue: totalRevenue,
        paid_orders_count: paidOrders.length,
        total_orders_count: totalOrdersCount,
        total_products_count: totalProductsCount,
        total_customers_count: totalCustomersCount,
        out_of_stock_count: outOfStockProducts.length,
      },
      recent_orders: db.schema.orders.slice(0, 5),
    });
  });

  // Products CRUD
  adminRouter.get('/products', (req: Request, res: Response) => {
    return res.json({ products: db.schema.products });
  });

  adminRouter.post('/products', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
    const { name, description, price, promo_price, sku, stock_quantity, category_id, material, color, size, image_url } = req.body;

    if (!name || !price || !sku || !category_id) {
      return res.status(400).json({ error: 'Nome, preço, SKU e categoria são obrigatórios.' });
    }

    const cat = db.schema.categories.find((c) => c.id === category_id);

    const newProd = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description || '',
      price: Number(price),
      promo_price: promo_price ? Number(promo_price) : undefined,
      pix_price: Number(((promo_price || price) * 0.95).toFixed(2)),
      sku: sku.trim().toUpperCase(),
      stock_quantity: Number(stock_quantity) || 0,
      category_id,
      category_name: cat?.name,
      material: material || 'Ouro 18k / Prata 925',
      color: color || 'Dourado',
      size,
      is_active: true,
      is_featured: false,
      is_bestseller: false,
      rating_avg: 5.0,
      rating_count: 0,
      images: [
        {
          id: `img_${Date.now()}`,
          product_id: '',
          image_url: image_url || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
          is_primary: true,
          display_order: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.schema.products.unshift(newProd);
    db.save();

    db.logAudit(req.user!.id, req.user!.email, 'CREATE_PRODUCT', 'PRODUCT', { id: newProd.id, name: newProd.name });

    return res.json({ product: newProd });
  });

  adminRouter.put('/products/:id', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const prod = db.schema.products.find((p) => p.id === id);

    if (!prod) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    Object.assign(prod, req.body, { updated_at: new Date().toISOString() });
    db.save();

    db.logAudit(req.user!.id, req.user!.email, 'UPDATE_PRODUCT', 'PRODUCT', { id });

    return res.json({ product: prod });
  });

  // Stock Adjustment
  adminRouter.post('/products/:id/stock', requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { quantity, reason, type } = req.body;

    const prod = db.schema.products.find((p) => p.id === id);
    if (!prod) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantidade de ajuste deve ser maior que zero.' });
    }

    if (type === 'IN') {
      prod.stock_quantity += qty;
    } else {
      prod.stock_quantity = Math.max(0, prod.stock_quantity - qty);
    }

    db.schema.inventory_movements.unshift({
      id: `mov_${Date.now()}`,
      product_id: prod.id,
      product_name: prod.name,
      type: type === 'IN' ? 'IN' : 'OUT',
      quantity: qty,
      reason: reason || 'Ajuste manual pelo painel administrativo',
      created_by: req.user!.email,
      created_at: new Date().toISOString(),
    });

    db.save();

    db.logAudit(req.user!.id, req.user!.email, 'ADJUST_STOCK', 'PRODUCT', {
      product_id: prod.id,
      type,
      quantity: qty,
      new_stock: prod.stock_quantity,
    });

    return res.json({ product: prod, new_stock: prod.stock_quantity });
  });

  // Orders Admin CRUD
  adminRouter.get('/orders', (req: Request, res: Response) => {
    return res.json({ orders: db.schema.orders });
  });

  adminRouter.put('/orders/:id/status', (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, tracking_code } = req.body;

    const order = db.schema.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (status) order.status = status;
    if (tracking_code) {
      order.tracking_code = tracking_code;
      order.tracking_url = `https://rastreamento.correios.com.br`;
    }

    order.updated_at = new Date().toISOString();
    db.save();

    db.logAudit(req.user!.id, req.user!.email, 'UPDATE_ORDER_STATUS', 'ORDER', {
      order_id: order.id,
      new_status: status,
      tracking_code,
    });

    return res.json({ order });
  });

  // Audit Logs Admin
  adminRouter.get('/audit-logs', requireRole(['ADMIN']), (req: Request, res: Response) => {
    return res.json({ audit_logs: db.schema.audit_logs });
  });

  app.use('/api/admin', adminRouter);

  // ==========================================
  // VITE DEV SERVER OR PRODUCTION STATIC
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
