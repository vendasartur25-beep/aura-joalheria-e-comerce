import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function seedInitialDatabase() {
  const schema = db.schema;

  // 1. Check if seed is needed
  if (schema.categories.length > 0 && schema.products.length > 0) {
    return;
  }

  console.log('Seeding Aura Joias database with initial data...');

  // 2. Admin Password Hash
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const customerPasswordHash = await bcrypt.hash('Cliente123!', 10);

  // Admin User
  const adminId = 'usr_admin_001';
  schema.users.push({
    id: adminId,
    name: 'Administrador Aura',
    email: 'admin@aurajoias.com.br',
    cpf: '123.456.789-00',
    phone: '(11) 99999-8888',
    role: 'ADMIN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  schema.user_passwords[adminId] = adminPasswordHash;

  // Sample Customer User
  const customerId = 'usr_cust_001';
  schema.users.push({
    id: customerId,
    name: 'Mariana Silva Soares',
    email: 'mariana.silva@exemplo.com.br',
    cpf: '987.654.321-11',
    phone: '(11) 98765-4321',
    role: 'CUSTOMER',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  schema.user_passwords[customerId] = customerPasswordHash;

  // Addresses for customer
  schema.addresses.push({
    id: 'addr_001',
    user_id: customerId,
    recipient_name: 'Mariana Silva Soares',
    cep: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Apto 102',
    is_default: true,
  });

  // 3. Categories
  const categoriesData = [
    {
      id: 'cat_001',
      name: 'Anéis',
      slug: 'aneis',
      description: 'Anéis finos em Ouro 18k e Prata 925 com gemas preciosas.',
      image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
      display_order: 1,
      active: true,
    },
    {
      id: 'cat_002',
      name: 'Correntes & Colares',
      slug: 'correntes-colares',
      description: 'Gargantilhas, ponto de luz e colares sofisticados.',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
      display_order: 2,
      active: true,
    },
    {
      id: 'cat_003',
      name: 'Pulseiras',
      slug: 'pulseiras',
      description: 'Pulseiras delicadas, rivieras e braceletes contemporâneos.',
      image_url: 'https://images.unsplash.com/photo-1611591475172-43a83a93646f?auto=format&fit=crop&q=80&w=600',
      display_order: 3,
      active: true,
    },
    {
      id: 'cat_004',
      name: 'Brincos',
      slug: 'brincos',
      description: 'Brincos cravejados, argolas minimalistas e ear cuffs.',
      image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600',
      display_order: 4,
      active: true,
    },
    {
      id: 'cat_005',
      name: 'Pingentes',
      slug: 'pingentes',
      description: 'Pingentes simbólicos e elegantes para colares e pulseiras.',
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600',
      display_order: 5,
      active: true,
    },
    {
      id: 'cat_006',
      name: 'Kits Especial',
      slug: 'kits',
      description: 'Conjuntos harmônicos em edições limitadas com preços promocionais.',
      image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600',
      display_order: 6,
      active: true,
    },
  ];
  schema.categories.push(...categoriesData);

  // 4. Products & Images
  const productsData = [
    {
      id: 'prod_001',
      name: 'Anel Solitário Aura Diamond Ouro 18k',
      slug: 'anel-solitario-aura-diamond-ouro-18k',
      description: 'Design atemporal com diamante lapidação brilhante 0.50ct engastado em garras duplas de Ouro Amarelo 18k. Acompanha certificado de autenticidade e garantia permanente.',
      price: 3490.00,
      promo_price: 2990.00,
      pix_price: 2840.50,
      sku: 'ANL-AUR-001',
      stock_quantity: 12,
      category_id: 'cat_001',
      category_name: 'Anéis',
      material: 'Ouro Amarelo 18k',
      color: 'Dourado',
      size: 'Ajustável (14-22)',
      is_active: true,
      is_featured: true,
      is_bestseller: true,
      rating_avg: 4.9,
      rating_count: 28,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_001_1',
          product_id: 'prod_001',
          image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
        {
          id: 'img_001_2',
          product_id: 'prod_001',
          image_url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=1000',
          is_primary: false,
          display_order: 2,
        },
      ],
    },
    {
      id: 'prod_002',
      name: 'Colar Riviera Esmeralda Prata 925 Ródio',
      slug: 'colar-riviera-esmeralda-prata-925',
      description: 'Gargantilha estilo Riviera cravejada com zircônias cúbicas na cor verde esmeralda e acabamento nobre em banho de ródio branco antialérgico.',
      price: 890.00,
      promo_price: 749.00,
      pix_price: 711.55,
      sku: 'COL-RIV-002',
      stock_quantity: 25,
      category_id: 'cat_002',
      category_name: 'Correntes & Colares',
      material: 'Prata 925 com Banho de Ródio',
      color: 'Verde / Prateado',
      size: '42cm + 5cm extensor',
      is_active: true,
      is_featured: true,
      is_bestseller: true,
      rating_avg: 4.8,
      rating_count: 42,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_002_1',
          product_id: 'prod_002',
          image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      id: 'prod_003',
      name: 'Pulseira Algema Mamba em Ouro 18k',
      slug: 'pulseira-algema-mamba-ouro-18k',
      description: 'Bracelete rígido moderno com fecho de gaveta duplo de segurança. Design minimalista e acabamento espelhado polido à mão.',
      price: 4200.00,
      promo_price: undefined,
      pix_price: 3990.00,
      sku: 'PUL-ALG-003',
      stock_quantity: 8,
      category_id: 'cat_003',
      category_name: 'Pulseiras',
      material: 'Ouro 18k',
      color: 'Dourado',
      size: '17cm',
      is_active: true,
      is_featured: true,
      is_bestseller: false,
      rating_avg: 5.0,
      rating_count: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_003_1',
          product_id: 'prod_003',
          image_url: 'https://images.unsplash.com/photo-1611591475172-43a83a93646f?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      id: 'prod_004',
      name: 'Brincos Argola Pavê Cristais Swarowski Prata 925',
      slug: 'brincos-argola-pave-cristais-prata-925',
      description: 'Argolas médias cravejadas interna e externamente com mini zircônias em micro pavê. Fecho click anatômico e muito leve.',
      price: 520.00,
      promo_price: 449.00,
      pix_price: 426.55,
      sku: 'BRN-ARG-004',
      stock_quantity: 30,
      category_id: 'cat_004',
      category_name: 'Brincos',
      material: 'Prata 925',
      color: 'Prateado',
      size: '2.2cm diâmetro',
      is_active: true,
      is_featured: false,
      is_bestseller: true,
      rating_avg: 4.7,
      rating_count: 36,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_004_1',
          product_id: 'prod_004',
          image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      id: 'prod_005',
      name: 'Pingente Medalha da Sorte em Ouro 18k e Safira',
      slug: 'pingente-medalha-sorte-ouro-18k-safira',
      description: 'Pingente em formato de medalha com relevo de estrela do norte e safira azul natural cravada no centro.',
      price: 1250.00,
      promo_price: 1090.00,
      pix_price: 1035.50,
      sku: 'PNG-MED-005',
      stock_quantity: 18,
      category_id: 'cat_005',
      category_name: 'Pingentes',
      material: 'Ouro 18k e Safira',
      color: 'Dourado / Azul',
      size: '1.8cm',
      is_active: true,
      is_featured: false,
      is_bestseller: false,
      rating_avg: 4.9,
      rating_count: 19,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_005_1',
          product_id: 'prod_005',
          image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      id: 'prod_006',
      name: 'Kit Luxo Eternitá: Colar + Brincos Pérola de Água Doce',
      slug: 'kit-luxo-eternita-colar-brincos-perola',
      description: 'Conjunto exclusivo com gargantilha de pérolas naturais de água doce e brincos pendentes de prata com banho de ouro 18k.',
      price: 1890.00,
      promo_price: 1490.00,
      pix_price: 1415.50,
      sku: 'KIT-ETE-006',
      stock_quantity: 10,
      category_id: 'cat_006',
      category_name: 'Kits',
      material: 'Prata 925 com Banho Ouro 18k e Pérola Natural',
      color: 'Pérola / Dourado',
      size: 'Único',
      is_active: true,
      is_featured: true,
      is_bestseller: true,
      rating_avg: 5.0,
      rating_count: 52,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: 'img_006_1',
          product_id: 'prod_006',
          image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1000',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
  ];
  schema.products.push(...productsData);

  // 5. Coupons
  schema.coupons.push(
    {
      id: 'coup_001',
      code: 'AURA10',
      type: 'PERCENT',
      value: 10,
      min_order_value: 300,
      usage_limit: 500,
      times_used: 42,
      expires_at: '2028-12-31T23:59:59Z',
      active: true,
    },
    {
      id: 'coup_002',
      code: 'PRIMEIRACOMPRA',
      type: 'FIXED',
      value: 100,
      min_order_value: 800,
      usage_limit: 1000,
      times_used: 118,
      expires_at: '2028-12-31T23:59:59Z',
      active: true,
    }
  );

  // 6. Home Banners
  schema.banners.push(
    {
      id: 'ban_001',
      title: 'Coleção Solitários & Alta Joalheria',
      subtitle: 'Peças em Ouro 18k e Diamantes com design contemporâneo e garantia permanente.',
      image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1600',
      button_text: 'EXPLORAR COLEÇÃO',
      link: '/catalogo',
      display_order: 1,
      active: true,
    },
    {
      id: 'ban_002',
      title: 'Rivieras & Pedras Preciosas',
      subtitle: 'Sinta a elegância das esmeraldas e safiras com até 15% OFF no Pix.',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600',
      button_text: 'VER PROMOÇÕES',
      link: '/catalogo?promocao=true',
      display_order: 2,
      active: true,
    }
  );

  // 7. Verified Reviews
  schema.reviews.push(
    {
      id: 'rev_001',
      product_id: 'prod_001',
      product_name: 'Anel Solitário Aura Diamond Ouro 18k',
      user_id: customerId,
      user_name: 'Mariana S.',
      rating: 5,
      comment: 'O anel é simplesmente espetacular! O brilho do diamante e o acabamento em ouro superaram todas as minhas expectativas. Embalagem de luxo surreal!',
      is_verified_buyer: true,
      status: 'APPROVED',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'rev_002',
      product_id: 'prod_002',
      product_name: 'Colar Riviera Esmeralda Prata 925 Ródio',
      user_id: customerId,
      user_name: 'Fernanda M.',
      rating: 5,
      comment: 'A entrega foi ultra rápida e o colar Riviera tem um caimento perfeito. Recebi dezenas de elogios no evento. Recomendo muito!',
      is_verified_buyer: true,
      status: 'APPROVED',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    }
  );

  // 8. Sample Real Orders
  schema.orders.push({
    id: 'ord_001',
    order_number: 'AUR-2026-8801',
    user_id: customerId,
    user_name: 'Mariana Silva Soares',
    user_email: 'mariana.silva@exemplo.com.br',
    user_phone: '(11) 98765-4321',
    status: 'Pago',
    payment_method: 'PIX',
    payment_status: 'APPROVED',
    subtotal: 2990.00,
    discount: 149.50,
    shipping_cost: 0.00,
    shipping_method: 'Sedex Expresso Grátis',
    total: 2840.50,
    shipping_address: schema.addresses[0],
    tracking_code: 'BR987654321SP',
    tracking_url: 'https://rastreamento.correios.com.br',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item_001',
        order_id: 'ord_001',
        product_id: 'prod_001',
        product_name: 'Anel Solitário Aura Diamond Ouro 18k',
        product_sku: 'ANL-AUR-001',
        product_image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
        quantity: 1,
        unit_price: 2990.00,
        total_price: 2990.00,
      },
    ],
  });

  db.logAudit(adminId, 'admin@aurajoias.com.br', 'INITIALIZE_SEED', 'SYSTEM', { status: 'Database seeded successfully' });
  db.save();
  console.log('Database seeded successfully!');
}
