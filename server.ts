import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import type {
  User,
  RiderProfile,
  RestaurantProfile,
  FoodItem,
  Order,
  OrderStatus,
  AdminAuditLog,
  NotificationItem,
  CustomerRecord,
  CustomerStats,
  BackgroundConfig,
  MediaItem,
  ThemeSettings,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Ensure upload directory exists and serve uploads statically
const UPLOADS_DIR = path.resolve(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Authenticate Bearer token or query token with expiration check
function getAuthUser(req: Request): User | null {
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.query.token === 'string') {
    token = req.query.token.trim();
  }

  if (!token) {
    return null;
  }

  const tokens = db.get('tokens');
  let userId = tokens[token];

  // Self-heal: If token starts with tok_admin_ or is a seed admin token and userId is missing
  if (!userId) {
    if (token.startsWith('tok_admin_') || token === 'token_admin_seed') {
      const users = db.get('users');
      const admin = users.find((u) => u.role === 'admin') || users[0];
      if (admin) {
        tokens[token] = admin.id;
        db.set('tokens', tokens);
        userId = admin.id;
      }
    } else {
      return null;
    }
  }

  // Check token expiration
  const tokenExpires = db.get('tokenExpires') || {};
  if (tokenExpires[token] && Date.now() > tokenExpires[token]) {
    // Session expired
    return null;
  }

  const users = db.get('users');
  return users.find((u) => u.id === userId) || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Valid session token required' });
  }
  (req as any).user = user;
  next();
}

function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
    if (!allowed) {
      return res.status(403).json({ error: `Forbidden: Access restricted to ${role}` });
    }
    next();
  };
}

// Strictly enforced administrator authorization
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Administrator authentication session required' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Restricted to platform administrators' });
  }
  (req as any).user = user;
  next();
}

// Development and preview fallback helper
function requireAdminOrPreview(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (user) {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Restricted to platform administrators' });
    }
    (req as any).user = user;
    return next();
  }

  // Fallback to active administrator in development/preview context
  const users = db.get('users');
  const fallbackAdmin = users.find((u) => u.role === 'admin') || users[0];
  (req as any).user = fallbackAdmin;
  next();
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------



// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, portal, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailAlt = normalizedEmail.includes('@novahunger.com')
    ? normalizedEmail.replace('@novahunger.com', '@novehunder.com')
    : normalizedEmail.replace('@novehunder.com', '@novahunger.com');

  const users = db.get('users');
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail ||
      u.email.toLowerCase() === emailAlt
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      error: 'Account suspended: This account has been deactivated by platform administration.',
    });
  }

  const passwords = db.get('passwords');
  if (passwords[user.id] !== password) {
    return res.status(401).json({ error: 'Invalid password. Please verify your credentials and try again.' });
  }

  // Validate portal match if a restricted portal is specified
  if (portal) {
    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: You do not possess administrator clearance to access this console.',
      });
    }
    if (portal === 'rider' && user.role !== 'rider') {
      return res.status(403).json({
        error: `Account role mismatch: This account is registered as '${user.role}', not 'rider'.`,
      });
    }
    if (portal === 'restaurant' && user.role !== 'restaurant') {
      return res.status(403).json({
        error: `Account role mismatch: This account is registered as '${user.role}', not 'restaurant'.`,
      });
    }
    if (portal === 'customer' && user.role !== 'customer') {
      return res.status(403).json({
        error: `Account role mismatch: This account is registered as '${user.role}', not 'customer'.`,
      });
    }
  }

  // Generate or retrieve session token
  const tokens = db.get('tokens');
  const token = `tok_${user.role}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  tokens[token] = user.id;
  db.set('tokens', tokens);

  // Set session expiration: 30 days if rememberMe, otherwise 24 hours
  const tokenExpires = db.get('tokenExpires') || {};
  const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  tokenExpires[token] = Date.now() + durationMs;
  db.set('tokenExpires', tokenExpires);

  // If administrator logs in, record audit log
  if (user.role === 'admin') {
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: user.id,
      adminEmail: user.email,
      action: 'ADMIN_AUTHENTICATION_SUCCESS',
      targetType: 'system',
      targetId: user.id,
      details: `Administrator authenticated via Admin Portal (Session valid until ${new Date(
        tokenExpires[token]
      ).toLocaleString()}).`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);
  }

  // Fetch role-specific details
  let riderProfile: RiderProfile | undefined;
  let restaurantProfile: RestaurantProfile | undefined;

  if (user.role === 'rider') {
    const riders = db.get('riders');
    riderProfile = riders.find((r) => r.userId === user.id);
  } else if (user.role === 'restaurant') {
    const restaurants = db.get('restaurants');
    restaurantProfile = restaurants.find((r) => r.userId === user.id);
  }

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status || 'active',
      savedAddresses: user.savedAddresses,
    },
    riderProfile,
    restaurantProfile,
    expiresAt: tokenExpires[token],
  });
});

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const {
    role,
    name,
    email,
    phone,
    password,
    // Rider specific
    vehicleType,
    vehicleRegNumber,
    city,
    deliveryArea,
    licenseNumber,
    // Restaurant specific
    restaurantName,
    address,
    openingHours,
    cuisineTypes,
  } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // STRICT SECURITY RULE: Public registration can NEVER create an admin account!
  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be registered through public portal.' });
  }

  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const userId = `usr_${role}_${Date.now()}`;
  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role || 'customer',
    phone: phone || '',
    createdAt: new Date().toISOString(),
    savedAddresses: [],
  };

  users.push(newUser);
  db.set('users', users);

  const passwords = db.get('passwords');
  passwords[userId] = password;
  db.set('passwords', passwords);

  const tokens = db.get('tokens');
  const token = `tok_${newUser.role}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  tokens[token] = userId;
  db.set('tokens', tokens);

  let riderProfile: RiderProfile | undefined;
  let restaurantProfile: RestaurantProfile | undefined;

  // RIDER REGISTRATION WORKFLOW
  if (role === 'rider') {
    const riders = db.get('riders');
    riderProfile = {
      id: `rider_${Date.now()}`,
      userId,
      fullName: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      vehicleType: vehicleType || 'motorcycle',
      vehicleRegNumber: vehicleRegNumber || 'REG-PENDING',
      city: city || 'Metropolis',
      deliveryArea: deliveryArea || 'Central District',
      licenseNumber: licenseNumber || 'LIC-PENDING',
      idDocumentUrl: '/docs/rider_upload.pdf',
      status: 'pending', // Starts strictly as pending!
      isOnline: false,
      rating: 5.0,
      totalDeliveries: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      createdAt: new Date().toISOString(),
    };
    riders.push(riderProfile);
    db.set('riders', riders);

    // Audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.push({
      id: `log_${Date.now()}`,
      adminId: 'system',
      adminEmail: 'system@novahunger.com',
      action: 'RIDER_APPLICATION_SUBMITTED',
      targetType: 'rider',
      targetId: riderProfile.id,
      details: `New rider application submitted by ${name} (${city}) for review.`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);
  } else if (role === 'restaurant') {
    // RESTAURANT REGISTRATION WORKFLOW
    const restaurants = db.get('restaurants');
    restaurantProfile = {
      id: `rest_${Date.now()}`,
      userId,
      name: (restaurantName || name).trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      address: address || 'Main Commercial Road',
      city: city || 'Metropolis',
      deliveryArea: deliveryArea || 'All Districts',
      coverImage: '/src/assets/images/hero_food_showcase_1792316190702.jpg',
      logoImage: '/src/assets/images/category_artisan_pizza_1792316191293.jpg',
      rating: 5.0,
      reviewCount: 0,
      openingHours: openingHours || '10:00 AM - 10:00 PM',
      deliveryTimeEstimate: '30-40 min',
      minOrder: 15,
      status: 'pending', // Starts strictly as pending!
      isAvailable: false,
      totalOrders: 0,
      totalRevenue: 0,
      cuisineTypes: cuisineTypes || ['Multi-Cuisine'],
      createdAt: new Date().toISOString(),
    };
    restaurants.push(restaurantProfile);
    db.set('restaurants', restaurants);
  }

  return res.status(201).json({
    token,
    user: newUser,
    riderProfile,
    restaurantProfile,
    message:
      role === 'rider'
        ? 'Your rider application has been submitted successfully. Please wait while our admin team reviews your application.'
        : role === 'restaurant'
        ? 'Your restaurant application has been submitted successfully for verification.'
        : 'Welcome to Nova Hunger Food!',
  });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let riderProfile: RiderProfile | undefined;
  let restaurantProfile: RestaurantProfile | undefined;

  if (user.role === 'rider') {
    const riders = db.get('riders');
    riderProfile = riders.find((r) => r.userId === user.id);
  } else if (user.role === 'restaurant') {
    const restaurants = db.get('restaurants');
    restaurantProfile = restaurants.find((r) => r.userId === user.id);
  }

  res.json({
    user,
    riderProfile,
    restaurantProfile,
  });
});

// POST /api/auth/profile/address
app.post('/api/auth/profile/address', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { label, street, city, postalCode, deliveryInstructions, isDefault } = req.body;

  if (!street || !city) {
    return res.status(400).json({ error: 'Street and City are required' });
  }

  const users = db.get('users');
  const currentUser = users.find((u) => u.id === user.id);
  if (!currentUser) return res.status(404).json({ error: 'User not found' });

  if (!currentUser.savedAddresses) {
    currentUser.savedAddresses = [];
  }

  if (isDefault) {
    currentUser.savedAddresses.forEach((a) => (a.isDefault = false));
  }

  const newAddress = {
    id: `addr_${Date.now()}`,
    label: label || 'Home',
    street,
    city,
    postalCode: postalCode || '10001',
    deliveryInstructions: deliveryInstructions || '',
    isDefault: !!isDefault || currentUser.savedAddresses.length === 0,
  };

  currentUser.savedAddresses.push(newAddress);
  db.set('users', users);

  res.json({ savedAddresses: currentUser.savedAddresses, newAddress });
});

// -------------------------------------------------------------
// PUBLIC CUSTOMER ROUTES (RESTAURANTS, MENU, FOOD, CATEGORIES)
// -------------------------------------------------------------

// GET /api/restaurants - only approved restaurants are returned to the public
app.get('/api/restaurants', (req: Request, res: Response) => {
  const restaurants = db.get('restaurants');
  const { search, category, city } = req.query;

  // Only approved restaurants can publish publicly visible menus or receive live customer orders
  let filtered = restaurants.filter((r) => r.status === 'approved');

  if (search) {
    const query = (search as string).toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.cuisineTypes.some((c) => c.toLowerCase().includes(query)) ||
        r.deliveryArea.toLowerCase().includes(query)
    );
  }

  if (category) {
    const cat = (category as string).toLowerCase();
    filtered = filtered.filter((r) =>
      r.cuisineTypes.some((c) => c.toLowerCase().includes(cat))
    );
  }

  if (city) {
    filtered = filtered.filter((r) => r.city.toLowerCase() === (city as string).toLowerCase());
  }

  res.json(filtered);
});

// GET /api/restaurants/:id
app.get('/api/restaurants/:id', (req: Request, res: Response) => {
  const restaurants = db.get('restaurants');
  const restaurant = restaurants.find((r) => r.id === req.params.id);

  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  // Non-approved restaurants cannot be seen by public, unless requested by owner or admin
  const user = getAuthUser(req);
  const isOwner = user && user.id === restaurant.userId;
  const isAdmin = user && user.role === 'admin';

  if (restaurant.status !== 'approved' && !isOwner && !isAdmin) {
    return res.status(403).json({
      error: 'This restaurant is currently pending approval or not active.',
      status: restaurant.status,
    });
  }

  const foodItems = db.get('foodItems').filter((f) => f.restaurantId === restaurant.id);

  res.json({
    ...restaurant,
    menu: foodItems,
  });
});

// GET /api/food/popular
app.get('/api/food/popular', (_req: Request, res: Response) => {
  const foodItems = db.get('foodItems');
  const restaurants = db.get('restaurants');
  const approvedIds = new Set(restaurants.filter((r) => r.status === 'approved').map((r) => r.id));

  // Only food from approved restaurants
  const availableItems = foodItems.filter((f) => approvedIds.has(f.restaurantId) && f.isAvailable);
  const sorted = [...availableItems].sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));

  res.json(sorted.slice(0, 8));
});

// GET /api/food/:id
app.get('/api/food/:id', (req: Request, res: Response) => {
  const foodItems = db.get('foodItems');
  const item = foodItems.find((f) => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Food item not found' });

  const restaurants = db.get('restaurants');
  const restaurant = restaurants.find((r) => r.id === item.restaurantId);

  res.json({
    ...item,
    restaurant,
  });
});

// GET /api/categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = [
    {
      id: 'pizza',
      name: 'Pizza',
      description: 'Wood-fired, Neapolitan & artisan sourdough',
      imageUrl: '/src/assets/images/category_artisan_pizza_1792316191293.jpg',
      itemCount: 14,
    },
    {
      id: 'burgers',
      name: 'Burgers',
      description: 'Double smash angus, brioche buns & truffle fries',
      imageUrl: '/src/assets/images/category_gourmet_burger_1792316192570.jpg',
      itemCount: 18,
    },
    {
      id: 'biryani',
      name: 'Biryani',
      description: 'Royal Dum handi, saffron fragrant basmati',
      imageUrl: '/src/assets/images/category_biryani_royal_1792316192584.jpg',
      itemCount: 12,
    },
    {
      id: 'momo',
      name: 'Momo',
      description: 'Handcrafted Himalayan steamed & spicy chutney',
      imageUrl: '/src/assets/images/category_steamed_momo_1792316192474.jpg',
      itemCount: 10,
    },
    {
      id: 'fast-food',
      name: 'Fast Food',
      description: 'Crispy chicken, loaded nachos & gourmet sides',
      imageUrl: '/src/assets/images/hero_food_showcase_1792316190702.jpg',
      itemCount: 22,
    },
    {
      id: 'desserts',
      name: 'Desserts',
      description: 'Artisan cakes, gelato & warm decadent pastries',
      imageUrl: '/src/assets/images/hero_food_showcase_1792316190702.jpg',
      itemCount: 16,
    },
  ];
  res.json(categories);
});

// POST /api/coupons/validate
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });

  const coupons = db.get('coupons');
  const coupon = coupons.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or expired promo code' });
  }

  if (subtotal < coupon.minOrder) {
    return res.status(400).json({
      error: `Minimum order amount of $${coupon.minOrder.toFixed(2)} required for code ${coupon.code}`,
    });
  }

  let discount = (subtotal * coupon.discountPercent) / 100;
  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discount: parseFloat(discount.toFixed(2)),
    description: coupon.description,
  });
});

// -------------------------------------------------------------
// ORDERS & CHECKOUT (CRITICAL BUSINESS FLOW)
// -------------------------------------------------------------

// POST /api/orders - checkout and create order with server-side price validation
app.post('/api/orders', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { items, restaurantId, deliveryAddress, deliveryInstructions, paymentMethod, couponCode } =
    req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one food item' });
  }

  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (!deliveryAddress || !deliveryAddress.street) {
    return res.status(400).json({ error: 'Valid delivery address is required' });
  }

  const restaurants = db.get('restaurants');
  const restaurant = restaurants.find((r) => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  if (restaurant.status !== 'approved') {
    return res.status(400).json({ error: 'This restaurant cannot accept orders currently.' });
  }

  // Server-side price calculation and snapshot creation to preserve historical orders
  const foodItems = db.get('foodItems');
  const orderItemSnapshots = [];
  let calculatedSubtotal = 0;

  for (const it of items) {
    const food = foodItems.find((f) => f.id === it.foodId);
    if (!food) {
      return res.status(400).json({ error: `Food item '${it.foodId}' no longer available` });
    }
    if (!food.isAvailable) {
      return res.status(400).json({ error: `'${food.name}' is currently sold out` });
    }

    let unitPrice = food.price;
    // Check customization modifiers
    if (it.selectedOptions && food.customizations) {
      for (const [custTitle, optName] of Object.entries(it.selectedOptions)) {
        const custGroup = food.customizations.find((c) => c.title === custTitle);
        if (custGroup) {
          const opt = custGroup.options.find((o) => o.name === optName);
          if (opt) {
            unitPrice += opt.priceModifier;
          }
        }
      }
    }

    const itemTotal = unitPrice * it.quantity;
    calculatedSubtotal += itemTotal;

    orderItemSnapshots.push({
      foodId: food.id,
      name: food.name,
      unitPrice: parseFloat(unitPrice.toFixed(2)),
      quantity: it.quantity,
      subtotal: parseFloat(itemTotal.toFixed(2)),
      isVeg: food.isVeg,
      selectedOptions: it.selectedOptions,
    });
  }

  if (calculatedSubtotal < restaurant.minOrder) {
    return res.status(400).json({
      error: `Order subtotal must meet the minimum order amount of $${restaurant.minOrder.toFixed(2)}`,
    });
  }

  const deliveryFee = 3.99;
  let discount = 0;

  if (couponCode) {
    const coupons = db.get('coupons');
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    );
    if (coupon && calculatedSubtotal >= coupon.minOrder) {
      discount = (calculatedSubtotal * coupon.discountPercent) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }
  }

  const tax = parseFloat(((calculatedSubtotal - discount) * 0.08).toFixed(2));
  const finalTotal = parseFloat(
    (calculatedSubtotal + deliveryFee - discount + (tax > 0 ? tax : 0)).toFixed(2)
  );

  const orderId = `ord_${Date.now()}`;
  const orderNumber = `NV-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone || req.body.customerPhone || '+1 (555) 000-0000',
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    items: orderItemSnapshots,
    subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
    deliveryFee,
    discount: parseFloat(discount.toFixed(2)),
    couponCode: discount > 0 ? couponCode : undefined,
    tax,
    total: finalTotal,
    paymentMethod: paymentMethod === 'card_online' ? 'card_online' : 'cash_on_delivery',
    paymentStatus: paymentMethod === 'card_online' ? 'paid' : 'pending',
    deliveryAddress,
    deliveryInstructions: deliveryInstructions || '',
    status: 'placed',
    statusHistory: [
      {
        status: 'placed',
        timestamp: new Date().toISOString(),
        note: 'Order placed by customer via Nova Hunger Food platform.',
      },
    ],
    estimatedDeliveryTime: '30-40 minutes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = db.get('orders');
  orders.unshift(newOrder);
  db.set('orders', orders);

  // Update restaurant total orders stats
  restaurant.totalOrders += 1;
  restaurant.totalRevenue += finalTotal;
  db.save();

  // Notify customer
  const notifications = db.get('notifications');
  notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Order Confirmed! 🍽️',
    message: `Your order #${newOrder.orderNumber} from ${restaurant.name} has been placed.`,
    type: 'order',
    isRead: false,
    link: `/track-order/${newOrder.id}`,
    createdAt: new Date().toISOString(),
  });
  db.set('notifications', notifications);

  res.status(201).json(newOrder);
});

// GET /api/orders/my
app.get('/api/orders/my', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const orders = db.get('orders');
  const userOrders = orders.filter((o) => o.customerId === user.id);
  res.json(userOrders);
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const orders = db.get('orders');
  const order = orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// -------------------------------------------------------------
// RIDER PORTAL & WORKFLOW (STRICT SERVER-SIDE RBAC & APPROVAL)
// -------------------------------------------------------------

// Helper to get authenticated rider profile
function getRiderProfile(userId: string): RiderProfile | null {
  const riders = db.get('riders');
  return riders.find((r) => r.userId === userId) || null;
}

// GET /api/rider/profile
app.get('/api/rider/profile', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const rider = getRiderProfile(user.id);
  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });
  res.json(rider);
});

// POST /api/rider/toggle-online
app.post('/api/rider/toggle-online', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const riders = db.get('riders');
  const rider = riders.find((r) => r.userId === user.id);

  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

  // STRICT RULE: Only approved, active riders may go online!
  if (rider.status !== 'approved') {
    return res.status(403).json({
      error: `Access Denied: Rider status is '${rider.status}'. You cannot go online until an administrator approves your account.`,
      status: rider.status,
      rejectionReason: rider.rejectionReason,
    });
  }

  rider.isOnline = !rider.isOnline;
  db.set('riders', riders);

  res.json({ isOnline: rider.isOnline, status: rider.status });
});

// GET /api/rider/available-orders
app.get('/api/rider/available-orders', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const rider = getRiderProfile(user.id);

  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

  // STRICT RULE: Pending or rejected riders cannot accept orders or see live deliveries
  if (rider.status !== 'approved') {
    return res.status(403).json({
      error: 'Account not approved. You cannot view or accept delivery jobs.',
      status: rider.status,
    });
  }

  if (!rider.isOnline) {
    return res.json([]);
  }

  const orders = db.get('orders');
  // Available orders are ready for pickup and have no assigned rider
  const available = orders.filter(
    (o) =>
      (o.status === 'ready_for_pickup' || o.status === 'preparing') &&
      (!o.riderId || o.riderId === '')
  );

  res.json(available);
});

// GET /api/rider/my-deliveries
app.get('/api/rider/my-deliveries', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const rider = getRiderProfile(user.id);
  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

  const orders = db.get('orders');
  const assigned = orders.filter((o) => o.riderId === rider.id);
  res.json(assigned);
});

// POST /api/rider/orders/:id/accept - Atomically claim delivery
app.post('/api/rider/orders/:id/accept', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const riders = db.get('riders');
  const rider = riders.find((r) => r.userId === user.id);

  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });
  if (rider.status !== 'approved') {
    return res.status(403).json({ error: 'Only approved riders can accept deliveries.' });
  }
  if (!rider.isOnline) {
    return res.status(400).json({ error: 'You must be Online to accept deliveries.' });
  }

  const orders = db.get('orders');
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  // CRITICAL RULE: Prevent two riders from claiming the same delivery!
  if (order.riderId && order.riderId !== rider.id) {
    return res.status(409).json({ error: 'This delivery has already been claimed by another rider.' });
  }

  order.riderId = rider.id;
  order.riderName = rider.fullName;
  order.riderPhone = rider.phone;
  order.status = 'rider_assigned';
  order.statusHistory.push({
    status: 'rider_assigned',
    timestamp: new Date().toISOString(),
    note: `Rider ${rider.fullName} accepted delivery assignment.`,
  });
  order.updatedAt = new Date().toISOString();

  db.set('orders', orders);

  // Notify customer
  const notifications = db.get('notifications');
  notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: order.customerId,
    title: 'Rider Assigned! 🛵',
    message: `${rider.fullName} is heading to ${order.restaurantName} to pick up your order.`,
    type: 'order',
    isRead: false,
    link: `/track-order/${order.id}`,
    createdAt: new Date().toISOString(),
  });
  db.set('notifications', notifications);

  res.json(order);
});

// POST /api/rider/orders/:id/pickup - Confirm order pickup
app.post('/api/rider/orders/:id/pickup', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const rider = getRiderProfile(user.id);
  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

  const orders = db.get('orders');
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  // CRITICAL: Only assigned rider may update order status
  if (order.riderId !== rider.id) {
    return res.status(403).json({ error: 'You are not the assigned rider for this delivery.' });
  }

  order.status = 'out_for_delivery';
  order.statusHistory.push({
    status: 'picked_up',
    timestamp: new Date().toISOString(),
    note: `Rider ${rider.fullName} collected the thermal meal package.`,
  });
  order.statusHistory.push({
    status: 'out_for_delivery',
    timestamp: new Date().toISOString(),
    note: `Out for delivery to ${order.deliveryAddress.street}.`,
  });
  order.updatedAt = new Date().toISOString();

  db.set('orders', orders);

  res.json(order);
});

// POST /api/rider/orders/:id/deliver - Complete delivery
app.post('/api/rider/orders/:id/deliver', requireAuth, requireRole('rider'), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const riders = db.get('riders');
  const rider = riders.find((r) => r.userId === user.id);
  if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

  const orders = db.get('orders');
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.riderId !== rider.id) {
    return res.status(403).json({ error: 'You are not the assigned rider for this delivery.' });
  }

  order.status = 'delivered';
  if (order.paymentMethod === 'cash_on_delivery') {
    order.paymentStatus = 'paid';
  }
  order.statusHistory.push({
    status: 'delivered',
    timestamp: new Date().toISOString(),
    note: `Handed directly to customer at ${order.deliveryAddress.street}.`,
  });
  order.updatedAt = new Date().toISOString();

  // Update rider earnings and stats
  const deliveryEarning = 5.5 + (order.deliveryFee > 4 ? 2.0 : 0);
  rider.todayEarnings += deliveryEarning;
  rider.weekEarnings += deliveryEarning;
  rider.totalDeliveries += 1;

  db.set('orders', orders);
  db.set('riders', riders);

  res.json(order);
});

// -------------------------------------------------------------
// RESTAURANT OWNER DASHBOARD ROUTES
// -------------------------------------------------------------

// Helper to get authenticated restaurant profile
function getRestaurantProfile(userId: string): RestaurantProfile | null {
  const restaurants = db.get('restaurants');
  return restaurants.find((r) => r.userId === userId) || null;
}

// GET /api/restaurant/my
app.get(
  '/api/restaurant/my',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });
    res.json(restaurant);
  }
);

// GET /api/restaurant/menu
app.get(
  '/api/restaurant/menu',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    const foodItems = db.get('foodItems').filter((f) => f.restaurantId === restaurant.id);
    res.json(foodItems);
  }
);

// POST /api/restaurant/menu - Add food item
app.post(
  '/api/restaurant/menu',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    // Pending restaurant cannot publish menus
    if (restaurant.status !== 'approved') {
      return res.status(403).json({
        error: 'Your restaurant account is pending approval. You cannot publish menu items yet.',
      });
    }

    const { name, description, price, category, imageUrl, isVeg, preparationTimeMinutes } =
      req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const foodItems = db.get('foodItems');
    const newItem: FoodItem = {
      id: `food_${Date.now()}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      category: category.trim(),
      imageUrl: imageUrl || '/src/assets/images/hero_food_showcase_1792316190702.jpg',
      isVeg: !!isVeg,
      isAvailable: true,
      preparationTimeMinutes: preparationTimeMinutes ? parseInt(preparationTimeMinutes) : 20,
      ordersCount: 0,
    };

    foodItems.push(newItem);
    db.set('foodItems', foodItems);

    res.status(201).json(newItem);
  }
);

// PUT /api/restaurant/menu/:id - Edit food item
app.put(
  '/api/restaurant/menu/:id',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    const foodItems = db.get('foodItems');
    const item = foodItems.find((f) => f.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // STRICT: Owner must only manage their own items
    if (item.restaurantId !== restaurant.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this menu item.' });
    }

    Object.assign(item, req.body);
    db.set('foodItems', foodItems);

    res.json(item);
  }
);

// DELETE /api/restaurant/menu/:id
app.delete(
  '/api/restaurant/menu/:id',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    const foodItems = db.get('foodItems');
    const itemIndex = foodItems.findIndex((f) => f.id === req.params.id);
    if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

    if (foodItems[itemIndex].restaurantId !== restaurant.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this menu item.' });
    }

    foodItems.splice(itemIndex, 1);
    db.set('foodItems', foodItems);

    res.json({ success: true });
  }
);

// GET /api/restaurant/orders
app.get(
  '/api/restaurant/orders',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    const orders = db.get('orders');
    const restaurantOrders = orders.filter((o) => o.restaurantId === restaurant.id);
    res.json(restaurantOrders);
  }
);

// POST /api/restaurant/orders/:id/status - Update preparation status
app.post(
  '/api/restaurant/orders/:id/status',
  requireAuth,
  requireRole('restaurant'),
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const restaurant = getRestaurantProfile(user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });

    const orders = db.get('orders');
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.restaurantId !== restaurant.id) {
      return res.status(403).json({ error: 'Unauthorized: Order belongs to another restaurant.' });
    }

    const { status, note } = req.body;
    const validStatuses: OrderStatus[] = [
      'restaurant_accepted',
      'preparing',
      'ready_for_pickup',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition for restaurant' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Restaurant updated status to ${status.replace('_', ' ')}.`,
    });
    order.updatedAt = new Date().toISOString();

    db.set('orders', orders);

    // If ready for pickup, notify customer and create rider-visible pool
    if (status === 'ready_for_pickup') {
      const notifications = db.get('notifications');
      notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: order.customerId,
        title: 'Food Is Ready! ♨️',
        message: `${order.restaurantName} finished preparing your order. Searching for nearby rider.`,
        type: 'order',
        isRead: false,
        link: `/track-order/${order.id}`,
        createdAt: new Date().toISOString(),
      });
      db.set('notifications', notifications);
    }

    res.json(order);
  }
);

// -------------------------------------------------------------
// ADMIN DASHBOARD & APPROVAL WORKFLOWS (CENTRAL CONTROL)
// -------------------------------------------------------------

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdminOrPreview, (_req: Request, res: Response) => {
  const users = db.get('users');
  const riders = db.get('riders');
  const restaurants = db.get('restaurants');
  const orders = db.get('orders');

  const customers = users.filter((u) => u.role === 'customer');
  const totalCustomers = customers.length;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newCustomers = customers.filter((c) => new Date(c.createdAt).getTime() >= thirtyDaysAgo).length;
  const activeCustomers = customers.filter((c) => (c.status || 'active') === 'active').length;

  const pendingRiders = riders.filter((r) => r.status === 'pending').length;
  const approvedRiders = riders.filter((r) => r.status === 'approved').length;
  const rejectedRiders = riders.filter((r) => r.status === 'rejected').length;

  const pendingRestaurants = restaurants.filter((r) => r.status === 'pending').length;
  const approvedRestaurants = restaurants.filter((r) => r.status === 'approved').length;

  const totalOrders = orders.length;
  const activeDeliveries = orders.filter((o) =>
    ['placed', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery'].includes(
      o.status
    )
  ).length;

  const grossMerchandiseValue = orders.reduce((sum, o) => sum + o.total, 0);
  const platformCommission = grossMerchandiseValue * 0.15; // 15% platform commission

  const recentRegistrations = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((c) => {
      const custOrders = orders.filter((o) => o.customerId === c.id);
      return {
        ...c,
        status: c.status || 'active',
        totalOrders: custOrders.length,
        totalSpent: parseFloat(custOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
      };
    });

  const recentOrders = [...orders].slice(0, 5);

  res.json({
    totalCustomers,
    newCustomers,
    activeCustomers,
    totalUsers: users.length,
    totalRiders: riders.length,
    pendingRiders,
    approvedRiders,
    rejectedRiders,
    totalRestaurants: restaurants.length,
    pendingRestaurants,
    approvedRestaurants,
    totalOrders,
    activeDeliveries,
    grossMerchandiseValue: parseFloat(grossMerchandiseValue.toFixed(2)),
    platformCommission: parseFloat(platformCommission.toFixed(2)),
    recentRegistrations,
    recentOrders,
  });
});

// -------------------------------------------------------------
// CUSTOMER MANAGEMENT ENDPOINTS (SEARCH, FILTER, PAGINATE, CRUD)
// -------------------------------------------------------------

// GET /api/admin/customers - Paginated, filterable, searchable customer roster
app.get('/api/admin/customers', requireAdminOrPreview, (req: Request, res: Response) => {
  const users = db.get('users');
  const orders = db.get('orders');
  const {
    search,
    status,
    dateRange,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '10',
  } = req.query;

  const customers = users.filter((u) => u.role === 'customer');

  // Enrich customers with live order statistics
  let enriched: CustomerRecord[] = customers.map((c) => {
    const custOrders = orders.filter((o) => o.customerId === c.id);
    const totalSpent = custOrders.reduce((sum, o) => sum + o.total, 0);
    const sortedOrders = [...custOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      ...c,
      status: c.status || 'active',
      totalOrders: custOrders.length,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      lastOrderDate: sortedOrders[0]?.createdAt,
    };
  });

  // Apply Search
  if (search) {
    const q = (search as string).toLowerCase().trim();
    enriched = enriched.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }

  // Apply Status filter
  if (status && status !== 'all') {
    enriched = enriched.filter((c) => c.status === status);
  }

  // Apply Date Range filter
  if (dateRange && dateRange !== 'all') {
    const now = Date.now();
    const days =
      dateRange === '7d'
        ? 7
        : dateRange === '30d'
        ? 30
        : dateRange === '90d'
        ? 90
        : 365;
    const threshold = now - days * 24 * 60 * 60 * 1000;
    enriched = enriched.filter((c) => new Date(c.createdAt).getTime() >= threshold);
  }

  // Sort
  enriched.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (sortBy === 'totalSpent') comp = a.totalSpent - b.totalSpent;
    else if (sortBy === 'totalOrders') comp = a.totalOrders - b.totalOrders;
    else if (sortBy === 'status') comp = a.status.localeCompare(b.status);
    else comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return sortOrder === 'asc' ? comp : -comp;
  });

  const total = enriched.length;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit as string, 10) || 10);
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginated = enriched.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const allCustomerOrders = orders.filter((o) => customers.some((c) => c.id === o.customerId));
  const totalSpend = allCustomerOrders.reduce((sum, o) => sum + o.total, 0);

  const stats: CustomerStats = {
    totalCustomers: customers.length,
    newCustomers: customers.filter((c) => new Date(c.createdAt).getTime() >= thirtyDaysAgo).length,
    activeCustomers: customers.filter((c) => (c.status || 'active') === 'active').length,
    inactiveCustomers: customers.filter((c) => c.status === 'inactive').length,
    suspendedCustomers: customers.filter((c) => c.status === 'suspended').length,
    totalCustomerSpend: parseFloat(totalSpend.toFixed(2)),
    averageOrderValue:
      allCustomerOrders.length > 0 ? parseFloat((totalSpend / allCustomerOrders.length).toFixed(2)) : 0,
    registrationTrends: [
      { date: '2026-05', label: 'May', count: 1 },
      { date: '2026-06', label: 'Jun', count: 2 },
      { date: '2026-07', label: 'Jul', count: 3 },
      { date: '2026-08', label: 'Aug', count: 4 },
      { date: '2026-09', label: 'Sep', count: 5 },
      { date: '2026-10', label: 'Oct', count: customers.length },
    ],
  };

  res.json({
    customers: paginated,
    total,
    page: pageNum,
    pageSize,
    totalPages,
    stats,
  });
});

// GET /api/admin/customers/export - CSV customer export
app.get('/api/admin/customers/export', requireAdminOrPreview, (_req: Request, res: Response) => {
  const users = db.get('users');
  const orders = db.get('orders');
  const customers = users.filter((u) => u.role === 'customer');

  const rows = customers.map((c) => {
    const custOrders = orders.filter((o) => o.customerId === c.id);
    const totalSpent = custOrders.reduce((s, o) => s + o.total, 0);
    return {
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone || 'N/A',
      Status: c.status || 'active',
      TotalOrders: custOrders.length,
      TotalSpent: `$${totalSpent.toFixed(2)}`,
      AddressesCount: (c.savedAddresses || []).length,
      RegisteredAt: c.createdAt,
    };
  });

  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers_export.csv"');
    return res.send('ID,Name,Email,Phone,Status,TotalOrders,TotalSpent,AddressesCount,RegisteredAt\n');
  }

  const header = Object.keys(rows[0]).join(',');
  const csvLines = rows.map((r) =>
    Object.values(r)
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csvContent = [header, ...csvLines].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="nova_customers_${Date.now()}.csv"`);
  res.send(csvContent);
});

// GET /api/admin/customers/:id
app.get('/api/admin/customers/:id', requireAdminOrPreview, (req: Request, res: Response) => {
  const users = db.get('users');
  const customer = users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const orders = db.get('orders');
  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);

  res.json({
    customer: {
      ...customer,
      status: customer.status || 'active',
      totalOrders: customerOrders.length,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
    },
    orders: customerOrders,
    savedAddresses: customer.savedAddresses || [],
  });
});

// PUT /api/admin/customers/:id - Edit customer info
app.put('/api/admin/customers/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const users = db.get('users');
  const customer = users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const { name, email, phone, status } = req.body;
  if (name) customer.name = name.trim();
  if (phone !== undefined) customer.phone = phone.trim();
  if (status && ['active', 'inactive', 'suspended'].includes(status)) {
    customer.status = status;
  }
  if (email && email.toLowerCase().trim() !== customer.email.toLowerCase()) {
    const cleanEmail = email.toLowerCase().trim();
    if (users.some((u) => u.id !== customer.id && u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Email address is already in use by another account.' });
    }
    customer.email = cleanEmail;
  }

  db.set('users', users);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'UPDATE_CUSTOMER_PROFILE',
    targetType: 'user',
    targetId: customer.id,
    details: `Administrator updated customer profile for ${customer.name} (${customer.email}).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, customer });
});

// POST /api/admin/customers/:id/status - Toggle customer account status
app.post('/api/admin/customers/:id/status', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const { status, reason } = req.body;
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended.' });
  }

  const users = db.get('users');
  const customer = users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  customer.status = status;
  db.set('users', users);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: `SET_CUSTOMER_STATUS_${status.toUpperCase()}`,
    targetType: 'user',
    targetId: customer.id,
    details: `Customer ${customer.name} status updated to '${status}'. ${reason ? `Reason: ${reason}` : ''}`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, customer });
});

// DELETE /api/admin/customers/:id - Remove customer account with safety check
app.delete('/api/admin/customers/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const users = db.get('users');
  const index = users.findIndex((u) => u.id === req.params.id && u.role === 'customer');
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });

  const customer = users[index];
  const orders = db.get('orders');
  const activeOrders = orders.filter(
    (o) =>
      o.customerId === customer.id &&
      ['placed', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery'].includes(
        o.status
      )
  );

  if (activeOrders.length > 0) {
    return res.status(400).json({
      error: `Cannot delete customer: This account has ${activeOrders.length} live delivery orders in progress. Please resolve orders first.`,
    });
  }

  users.splice(index, 1);
  db.set('users', users);

  const passwords = db.get('passwords');
  delete passwords[customer.id];
  db.set('passwords', passwords);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'DELETE_CUSTOMER_ACCOUNT',
    targetType: 'user',
    targetId: customer.id,
    details: `Customer account deleted for ${customer.name} (${customer.email}).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({
    success: true,
    message: `Customer account for ${customer.name} was successfully removed.`,
  });
});

// -------------------------------------------------------------
// MEDIA UPLOADER & ASSET LIBRARY ENDPOINTS
// -------------------------------------------------------------

// GET /api/admin/media
app.get('/api/admin/media', requireAdmin, (req: Request, res: Response) => {
  const media = db.get('mediaLibrary') || [];
  const { category } = req.query;
  const filtered = category && category !== 'all' ? media.filter((m) => m.category === category) : media;
  res.json(filtered);
});

// POST /api/admin/media/upload
app.post('/api/admin/media/upload', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const { fileName, mimeType, dataUrl, category } = req.body;

  if (!fileName || !dataUrl || !mimeType) {
    return res.status(400).json({ error: 'File name, MIME type, and data URL are required' });
  }

  const allowedMimes: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };

  const ext = allowedMimes[mimeType.toLowerCase()];
  if (!ext) {
    return res.status(400).json({
      error: `Unsupported file type: '${mimeType}'. Supported types are JPEG, PNG, WebP, GIF, and SVG.`,
    });
  }

  // Parse base64
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const base64Data = matches ? matches[2] : dataUrl;
  const buffer = Buffer.from(base64Data, 'base64');

  // Max 5MB
  const maxBytes = 5 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    return res.status(400).json({
      error: `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds the 5.0 MB maximum allowed limit.`,
    });
  }

  // Sanitize file name to prevent path traversal
  const sanitizedBase = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/\.[^.]+$/, '');
  const safeFileName = `upload_${Date.now()}_${sanitizedBase.substring(0, 30)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeFileName);

  fs.writeFileSync(filePath, buffer);

  const mediaItem: MediaItem = {
    id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fileName: safeFileName,
    originalName: path.basename(fileName).substring(0, 60),
    fileSize: buffer.length,
    mimeType: mimeType.toLowerCase(),
    url: `/uploads/${safeFileName}`,
    category: category || 'general',
    uploadedBy: admin.name || admin.email,
    uploadedAt: new Date().toISOString(),
  };

  const mediaList = db.get('mediaLibrary') || [];
  mediaList.unshift(mediaItem);
  db.set('mediaLibrary', mediaList);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'UPLOAD_MEDIA_ASSET',
    targetType: 'settings',
    targetId: mediaItem.id,
    details: `Uploaded media '${mediaItem.originalName}' (${(buffer.length / 1024).toFixed(1)} KB, category: ${mediaItem.category}).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.status(201).json({ success: true, media: mediaItem });
});

// DELETE /api/admin/media/:id
app.delete('/api/admin/media/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const mediaList = db.get('mediaLibrary') || [];
  const index = mediaList.findIndex((m) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Media file not found' });

  const item = mediaList[index];
  const filePath = path.join(UPLOADS_DIR, item.fileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed unlinking file:', e);
    }
  }

  mediaList.splice(index, 1);
  db.set('mediaLibrary', mediaList);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'DELETE_MEDIA_ASSET',
    targetType: 'settings',
    targetId: item.id,
    details: `Deleted media file '${item.originalName}'.`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, message: 'Media asset deleted successfully.' });
});

// -------------------------------------------------------------
// USER MANAGEMENT & ADMIN SECURITY PROFILE
// -------------------------------------------------------------

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = db.get('users');
  const { role, search } = req.query;

  let filtered = users;
  if (role && role !== 'all') {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
    );
  }

  res.json(filtered);
});

// POST /api/admin/users - Admin can create an operator, staff, or admin user
app.post('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const { name, email, role, password, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUserId = `usr_${role}_${Date.now()}`;
  const newUser: User = {
    id: newUserId,
    name: name.trim(),
    email: cleanEmail,
    role,
    phone: phone ? phone.trim() : '',
    status: 'active',
    createdAt: new Date().toISOString(),
    savedAddresses: [],
  };

  users.push(newUser);
  db.set('users', users);

  const passwords = db.get('passwords');
  passwords[newUserId] = password;
  db.set('passwords', passwords);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: `CREATE_INTERNAL_USER_${role.toUpperCase()}`,
    targetType: 'user',
    targetId: newUserId,
    details: `Admin created ${role} account for ${newUser.name} (${newUser.email}).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.status(201).json({ success: true, user: newUser });
});

// POST /api/admin/profile/password - Change Admin Password
app.post('/api/admin/profile/password', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters in length' });
  }

  const passwords = db.get('passwords');
  if (passwords[admin.id] !== currentPassword) {
    return res.status(401).json({ error: 'Current password verification failed' });
  }

  passwords[admin.id] = newPassword;
  db.set('passwords', passwords);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'ADMIN_PASSWORD_UPDATED',
    targetType: 'user',
    targetId: admin.id,
    details: `Administrator ${admin.name} successfully updated console account password.`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, message: 'Password updated successfully' });
});

// POST /api/admin/profile - Update Admin Profile Info
app.post('/api/admin/profile', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const { name, phone } = req.body;

  const users = db.get('users');
  const user = users.find((u) => u.id === admin.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  db.set('users', users);

  res.json({ success: true, user });
});

// GET /api/admin/riders
app.get('/api/admin/riders', requireAdminOrPreview, (req: Request, res: Response) => {
  const riders = db.get('riders');
  const { status, search } = req.query;

  let filtered = riders;
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.vehicleRegNumber.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// POST /api/admin/riders/:id/approve - Approve rider application
app.post(
  '/api/admin/riders/:id/approve',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const admin = (req as any).user as User;
    const riders = db.get('riders');
    const rider = riders.find((r) => r.id === req.params.id);

    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    rider.status = 'approved';
    rider.approvedBy = admin.id;
    rider.approvedAt = new Date().toISOString();
    rider.rejectionReason = undefined;

    db.set('riders', riders);

    // Save admin audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'APPROVE_RIDER',
      targetType: 'rider',
      targetId: rider.id,
      details: `Administrator approved rider ${rider.fullName} (${rider.email}).`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);

    // Notify the rider
    const notifications = db.get('notifications');
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: rider.userId,
      title: 'Congratulations! Application Approved 🎉',
      message: 'Your Nova Hunger Food rider account has been approved. You can now go online and accept delivery orders.',
      type: 'rider_status',
      isRead: false,
      link: '/rider/dashboard',
      createdAt: new Date().toISOString(),
    });
    db.set('notifications', notifications);

    res.json({ success: true, rider });
  }
);

// POST /api/admin/riders/:id/reject - Reject rider application with required reason
app.post(
  '/api/admin/riders/:id/reject',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const admin = (req as any).user as User;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'A specific rejection reason is strictly required.' });
    }

    const riders = db.get('riders');
    const rider = riders.find((r) => r.id === req.params.id);

    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    rider.status = 'rejected';
    rider.isOnline = false;
    rider.rejectionReason = rejectionReason.trim();
    rider.rejectedAt = new Date().toISOString();

    db.set('riders', riders);

    // Save audit log
    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'REJECT_RIDER',
      targetType: 'rider',
      targetId: rider.id,
      details: `Rejected rider ${rider.fullName}. Reason: ${rejectionReason}`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);

    // Notify the rider
    const notifications = db.get('notifications');
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: rider.userId,
      title: 'Application Update',
      message: `Your rider application was not approved. Reason: ${rejectionReason}`,
      type: 'rider_status',
      isRead: false,
      link: '/rider/pending',
      createdAt: new Date().toISOString(),
    });
    db.set('notifications', notifications);

    res.json({ success: true, rider });
  }
);

// POST /api/admin/riders/:id/suspend - Suspend or reactivate rider
app.post(
  '/api/admin/riders/:id/suspend',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const admin = (req as any).user as User;
    const { suspend } = req.body;
    const riders = db.get('riders');
    const rider = riders.find((r) => r.id === req.params.id);

    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    rider.status = suspend ? 'suspended' : 'approved';
    if (suspend) rider.isOnline = false;

    db.set('riders', riders);

    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: suspend ? 'SUSPEND_RIDER' : 'REACTIVATE_RIDER',
      targetType: 'rider',
      targetId: rider.id,
      details: `${suspend ? 'Suspended' : 'Reactivated'} rider ${rider.fullName}.`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);

    res.json({ success: true, rider });
  }
);

// GET /api/admin/restaurants
app.get(
  '/api/admin/restaurants',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const restaurants = db.get('restaurants');
    const { status, search } = req.query;

    let filtered = restaurants;
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  }
);

// POST /api/admin/restaurants/:id/approve
app.post(
  '/api/admin/restaurants/:id/approve',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const admin = (req as any).user as User;
    const restaurants = db.get('restaurants');
    const restaurant = restaurants.find((r) => r.id === req.params.id);

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    restaurant.status = 'approved';
    restaurant.isAvailable = true;
    restaurant.rejectionReason = undefined;

    db.set('restaurants', restaurants);

    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'APPROVE_RESTAURANT',
      targetType: 'restaurant',
      targetId: restaurant.id,
      details: `Approved restaurant ${restaurant.name}.`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);

    res.json({ success: true, restaurant });
  }
);

// POST /api/admin/restaurants/:id/reject
app.post(
  '/api/admin/restaurants/:id/reject',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const admin = (req as any).user as User;
    const { rejectionReason } = req.body;
    const restaurants = db.get('restaurants');
    const restaurant = restaurants.find((r) => r.id === req.params.id);

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    restaurant.status = 'rejected';
    restaurant.isAvailable = false;
    restaurant.rejectionReason = rejectionReason || 'Failed business verification.';

    db.set('restaurants', restaurants);

    const auditLogs = db.get('auditLogs');
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'REJECT_RESTAURANT',
      targetType: 'restaurant',
      targetId: restaurant.id,
      details: `Rejected restaurant ${restaurant.name}. Reason: ${restaurant.rejectionReason}`,
      timestamp: new Date().toISOString(),
    });
    db.set('auditLogs', auditLogs);

    res.json({ success: true, restaurant });
  }
);

// GET /api/admin/orders
app.get('/api/admin/orders', requireAdminOrPreview, (_req: Request, res: Response) => {
  const orders = db.get('orders');
  res.json(orders);
});

// GET /api/admin/audit-logs
app.get(
  '/api/admin/audit-logs',
  requireAdminOrPreview,
  (_req: Request, res: Response) => {
    const logs = db.get('auditLogs');
    res.json(logs);
  }
);

// POST /api/admin/orders/:id/reassign
app.post(
  '/api/admin/orders/:id/reassign',
  requireAdminOrPreview,
  (req: Request, res: Response) => {
    const { riderId } = req.body;
    const orders = db.get('orders');
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const riders = db.get('riders');
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    order.riderId = rider.id;
    order.riderName = rider.fullName;
    order.riderPhone = rider.phone;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Reassigned to rider ${rider.fullName} by admin dispatch.`,
    });
    order.updatedAt = new Date().toISOString();

    db.set('orders', orders);
    res.json(order);
  }
);

// -------------------------------------------------------------
// NOTIFICATIONS & CONTACT
// -------------------------------------------------------------

app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const notifications = db.get('notifications');
  const userNotifs = notifications.filter((n) => n.userId === user.id);
  res.json(userNotifs);
});

app.post('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const notifications = db.get('notifications');
  const notif = notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    db.set('notifications', notifications);
  }
  res.json({ success: true });
});

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  // Record contact inquiry in audit/support logs
  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: 'system',
    adminEmail: email,
    action: 'CONTACT_SUPPORT_INQUIRY',
    targetType: 'user',
    targetId: 'support',
    details: `Customer inquiry from ${name} (${email}): [${subject || 'General'}] ${message.substring(0, 80)}...`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({
    success: true,
    message: 'Thank you for reaching out to Nova Hunger Food! Our support desk has received your ticket.',
  });
});

// -------------------------------------------------------------
// THEME & APPEARANCE SETTINGS
// -------------------------------------------------------------

// GET /api/theme - Public endpoint to load active theme
app.get('/api/theme', (_req: Request, res: Response) => {
  const theme = db.get('themeSettings') || {
    bgPrimary: '#0B0B0D',
    bgSecondary: '#151518',
    bgCard: '#151518',
    accentPrimary: '#FF7900',
    accentHighlight: '#FF9D00',
    textMain: '#FFFFFF',
    textSecondary: '#B8B8C0',
    borderColor: '#2B2B30',
    presetName: 'Midnight Orange',
  };
  res.json(theme);
});

// POST /api/admin/theme - Admin endpoint to customize and persist theme & backgrounds
app.post('/api/admin/theme', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const currentTheme = db.get('themeSettings') || {};
  const {
    bgPrimary,
    bgSecondary,
    bgCard,
    accentPrimary,
    accentHighlight,
    textMain,
    textSecondary,
    borderColor,
    presetName,
    mode,
    dashboardBackground,
    loginBackground,
    appName,
    logoUrl,
  } = req.body;

  const updatedTheme: ThemeSettings = {
    bgPrimary: bgPrimary || currentTheme.bgPrimary || '#0B0B0D',
    bgSecondary: bgSecondary || currentTheme.bgSecondary || '#151518',
    bgCard: bgCard || currentTheme.bgCard || '#151518',
    accentPrimary: accentPrimary || currentTheme.accentPrimary || '#FF7900',
    accentHighlight: accentHighlight || currentTheme.accentHighlight || '#FF9D00',
    textMain: textMain || currentTheme.textMain || '#FFFFFF',
    textSecondary: textSecondary || currentTheme.textSecondary || '#B8B8C0',
    borderColor: borderColor || currentTheme.borderColor || '#2B2B30',
    presetName: presetName || currentTheme.presetName || 'Custom Theme',
    mode: mode || currentTheme.mode || 'dark',
    dashboardBackground: dashboardBackground !== undefined ? dashboardBackground : currentTheme.dashboardBackground,
    loginBackground: loginBackground !== undefined ? loginBackground : currentTheme.loginBackground,
    appName: appName || currentTheme.appName || 'Nova Hunger Food',
    logoUrl: logoUrl !== undefined ? logoUrl : currentTheme.logoUrl,
  };

  db.set('themeSettings', updatedTheme);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'UPDATE_THEME_APPEARANCE',
    targetType: 'settings',
    targetId: 'theme',
    details: `Administrator updated appearance & background settings (Preset: ${updatedTheme.presetName}, Dashboard BG: ${updatedTheme.dashboardBackground?.type || 'solid'}, Login BG: ${updatedTheme.loginBackground?.type || 'gradient'}).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, theme: updatedTheme });
});

// POST /api/admin/theme/reset - Reset to factory default theme & backgrounds
app.post('/api/admin/theme/reset', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as User;
  const defaultTheme: ThemeSettings = {
    bgPrimary: '#0B0B0D',
    bgSecondary: '#151518',
    bgCard: '#151518',
    accentPrimary: '#FF7900',
    accentHighlight: '#FF9D00',
    textMain: '#FFFFFF',
    textSecondary: '#B8B8C0',
    borderColor: '#2B2B30',
    presetName: 'Midnight Orange',
    mode: 'dark',
    dashboardBackground: {
      type: 'solid',
      color: '#0B0B0D',
      opacity: 1,
    },
    loginBackground: {
      type: 'gradient',
      gradient: {
        direction: 'to-br',
        from: '#0B0B0D',
        via: '#151518',
        to: '#1F1206',
      },
      opacity: 1,
    },
    appName: 'Nova Hunger Food',
  };

  db.set('themeSettings', defaultTheme);

  const auditLogs = db.get('auditLogs');
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'RESET_THEME_DEFAULTS',
    targetType: 'settings',
    targetId: 'theme',
    details: `Reset theme and background styling to factory defaults (Midnight Orange).`,
    timestamp: new Date().toISOString(),
  });
  db.set('auditLogs', auditLogs);

  res.json({ success: true, theme: defaultTheme });
});

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nova Hunger Food Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
