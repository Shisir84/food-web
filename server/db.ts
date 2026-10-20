import fs from 'fs';
import path from 'path';
import type {
  User,
  RiderProfile,
  RestaurantProfile,
  FoodItem,
  Order,
  Coupon,
  AdminAuditLog,
  NotificationItem,
  ThemeSettings,
  MediaItem,
  ContactInquiry,
  ChatbotSettings,
  EmailSettings,
  BackgroundStudioConfig,
  BackgroundRevision,
} from '../src/types/index.ts';

const DB_FILE = path.resolve(process.cwd(), 'data', 'database.json');

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> password (plain for local dev demo or salted)
  tokens: Record<string, string>; // token -> userId
  tokenExpires?: Record<string, number>; // token -> expiry timestamp in ms
  riders: RiderProfile[];
  restaurants: RestaurantProfile[];
  foodItems: FoodItem[];
  orders: Order[];
  coupons: Coupon[];
  auditLogs: AdminAuditLog[];
  notifications: NotificationItem[];
  themeSettings: ThemeSettings;
  mediaLibrary: MediaItem[];
  contactInquiries?: ContactInquiry[];
  chatbotSettings?: ChatbotSettings;
  emailSettings?: EmailSettings;
  backgroundStudio?: Record<string, any>;
  backgroundStudioConfigs?: Record<string, any>;
  backgroundRevisions?: BackgroundRevision[];
}

const INITIAL_FOOD_IMAGES = {
  hero: '/src/assets/images/hero_food_showcase_1792316190702.jpg',
  pizza: '/src/assets/images/category_artisan_pizza_1792316191293.jpg',
  burger: '/src/assets/images/category_gourmet_burger_1792316192570.jpg',
  biryani: '/src/assets/images/category_biryani_royal_1792316192584.jpg',
  momo: '/src/assets/images/category_steamed_momo_1792316192474.jpg',
};

function getInitialDatabase(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'Nova Master Admin',
      email: 'admin@novahunger.com',
      role: 'admin',
      phone: '+1 (555) 019-9000',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_customer_1',
      name: 'Elena Rostova',
      email: 'customer@novahunger.com',
      role: 'customer',
      phone: '+1 (555) 014-4821',
      createdAt: '2026-02-10T11:20:00.000Z',
      savedAddresses: [
        {
          id: 'addr_1',
          label: 'Apartment',
          street: '742 Evergreen Terrace, Apt 4B',
          city: 'Metropolis',
          postalCode: '10001',
          deliveryInstructions: 'Ring bell 4B or leave at reception concierge.',
          isDefault: true,
        },
        {
          id: 'addr_2',
          label: 'Design Studio',
          street: '120 Broadway Blvd, 6th Floor',
          city: 'Metropolis',
          postalCode: '10002',
          deliveryInstructions: 'Call upon arrival at security desk.',
          isDefault: false,
        },
      ],
    },
    {
      id: 'usr_rider_1',
      name: 'Alex Mercer',
      email: 'rider.alex@novahunger.com',
      role: 'rider',
      phone: '+1 (555) 017-3392',
      createdAt: '2026-03-01T09:15:00.000Z',
    },
    {
      id: 'usr_rider_2',
      name: 'David Vance',
      email: 'rider.david@novahunger.com',
      role: 'rider',
      phone: '+1 (555) 019-4411',
      createdAt: '2026-04-12T14:30:00.000Z',
    },
    {
      id: 'usr_rider_3',
      name: 'Marcus Brody',
      email: 'rider.brody@novahunger.com',
      role: 'rider',
      phone: '+1 (555) 018-8822',
      createdAt: '2026-04-10T08:00:00.000Z',
    },
    {
      id: 'usr_rest_1',
      name: 'Marco Bellini',
      email: 'owner.flame@novahunger.com',
      role: 'restaurant',
      phone: '+1 (555) 011-2299',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'usr_rest_2',
      name: 'Rajesh Singhania',
      email: 'owner.saffron@novahunger.com',
      role: 'restaurant',
      phone: '+1 (555) 013-5588',
      createdAt: '2026-01-20T10:00:00.000Z',
    },
    {
      id: 'usr_rest_3',
      name: 'Tenzin Norbu',
      email: 'owner.himalayan@novahunger.com',
      role: 'restaurant',
      phone: '+1 (555) 016-7733',
      createdAt: '2026-02-05T12:00:00.000Z',
    },
    {
      id: 'usr_rest_pending',
      name: 'Chloe Monet',
      email: 'owner.bamboo@novahunger.com',
      role: 'restaurant',
      phone: '+1 (555) 019-1144',
      createdAt: '2026-04-15T16:00:00.000Z',
    },
  ];

  const passwords: Record<string, string> = {
    usr_admin: 'admin123',
    usr_customer_1: 'pass123',
    usr_rider_1: 'pass123',
    usr_rider_2: 'pass123',
    usr_rider_3: 'pass123',
    usr_rest_1: 'pass123',
    usr_rest_2: 'pass123',
    usr_rest_3: 'pass123',
    usr_rest_pending: 'pass123',
  };

  const riders: RiderProfile[] = [
    {
      id: 'rider_1',
      userId: 'usr_rider_1',
      fullName: 'Alex Mercer',
      email: 'rider.alex@novahunger.com',
      phone: '+1 (555) 017-3392',
      vehicleType: 'motorcycle',
      vehicleRegNumber: 'MT-8849-BK',
      city: 'Metropolis',
      deliveryArea: 'Downtown & Arts District',
      licenseNumber: 'DL-NV-992019',
      idDocumentUrl: '/docs/rider_alex_license.pdf',
      status: 'approved',
      isOnline: true,
      approvedBy: 'usr_admin',
      approvedAt: '2026-03-02T11:00:00.000Z',
      rating: 4.95,
      totalDeliveries: 342,
      todayEarnings: 84.5,
      weekEarnings: 520.0,
      createdAt: '2026-03-01T09:15:00.000Z',
    },
    {
      id: 'rider_2',
      userId: 'usr_rider_2',
      fullName: 'David Vance',
      email: 'rider.david@novahunger.com',
      phone: '+1 (555) 019-4411',
      vehicleType: 'bicycle',
      vehicleRegNumber: 'EB-2024-X',
      city: 'Metropolis',
      deliveryArea: 'North End & Midtown',
      licenseNumber: 'ID-NV-481902',
      idDocumentUrl: '/docs/rider_david_id.pdf',
      status: 'pending',
      isOnline: false,
      rating: 5.0,
      totalDeliveries: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      createdAt: '2026-04-12T14:30:00.000Z',
    },
    {
      id: 'rider_3',
      userId: 'usr_rider_3',
      fullName: 'Marcus Brody',
      email: 'rider.brody@novahunger.com',
      phone: '+1 (555) 018-8822',
      vehicleType: 'scooter',
      vehicleRegNumber: 'SC-1002-ZT',
      city: 'Metropolis',
      deliveryArea: 'South Waterfront',
      licenseNumber: 'DL-NV-110022',
      idDocumentUrl: '/docs/rider_brody_id.pdf',
      status: 'rejected',
      isOnline: false,
      rejectionReason: 'Vehicle registration paperwork was expired; please provide current insurance and re-submit.',
      rejectedAt: '2026-04-11T16:00:00.000Z',
      rating: 0,
      totalDeliveries: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      createdAt: '2026-04-10T08:00:00.000Z',
    },
  ];

  const restaurants: RestaurantProfile[] = [
    {
      id: 'rest_1',
      userId: 'usr_rest_1',
      name: 'Flame & Crust Artisan Pizzeria',
      email: 'owner.flame@novahunger.com',
      phone: '+1 (555) 011-2299',
      address: '42 Baker Street, Downtown',
      city: 'Metropolis',
      deliveryArea: 'Downtown, Waterfront, Financial District',
      coverImage: INITIAL_FOOD_IMAGES.pizza,
      logoImage: INITIAL_FOOD_IMAGES.pizza,
      rating: 4.88,
      reviewCount: 420,
      openingHours: '11:00 AM - 11:30 PM',
      deliveryTimeEstimate: '25-35 min',
      minOrder: 15,
      status: 'approved',
      isAvailable: true,
      totalOrders: 1840,
      totalRevenue: 47820,
      cuisineTypes: ['Pizza', 'Italian', 'Wood-Fired'],
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'rest_2',
      userId: 'usr_rest_2',
      name: 'The Royal Dum Darbar',
      email: 'owner.saffron@novahunger.com',
      phone: '+1 (555) 013-5588',
      address: '88 Saffron Lane, North Heritage',
      city: 'Metropolis',
      deliveryArea: 'North End, Midtown, University Campus',
      coverImage: INITIAL_FOOD_IMAGES.biryani,
      logoImage: INITIAL_FOOD_IMAGES.biryani,
      rating: 4.92,
      reviewCount: 680,
      openingHours: '12:00 PM - 11:00 PM',
      deliveryTimeEstimate: '30-40 min',
      minOrder: 20,
      status: 'approved',
      isAvailable: true,
      totalOrders: 2450,
      totalRevenue: 64100,
      cuisineTypes: ['Biryani', 'Mughlai', 'Royal Indian'],
      createdAt: '2026-01-20T10:00:00.000Z',
    },
    {
      id: 'rest_3',
      userId: 'usr_rest_3',
      name: 'Smash & Bun Craft Burgers',
      email: 'owner.himalayan@novahunger.com',
      phone: '+1 (555) 016-7733',
      address: '15 Highline Alley, West Quarter',
      city: 'Metropolis',
      deliveryArea: 'West Quarter, Midtown, Downtown',
      coverImage: INITIAL_FOOD_IMAGES.burger,
      logoImage: INITIAL_FOOD_IMAGES.burger,
      rating: 4.85,
      reviewCount: 395,
      openingHours: '11:30 AM - Midnight',
      deliveryTimeEstimate: '20-30 min',
      minOrder: 12,
      status: 'approved',
      isAvailable: true,
      totalOrders: 1510,
      totalRevenue: 38200,
      cuisineTypes: ['Burgers', 'Fast Food', 'American'],
      createdAt: '2026-02-05T12:00:00.000Z',
    },
    {
      id: 'rest_4',
      userId: 'usr_rest_pending',
      name: 'Himalayan Momo & Steams',
      email: 'owner.bamboo@novahunger.com',
      phone: '+1 (555) 019-1144',
      address: '204 Cedar Ridge, East District',
      city: 'Metropolis',
      deliveryArea: 'East District, Midtown',
      coverImage: INITIAL_FOOD_IMAGES.momo,
      logoImage: INITIAL_FOOD_IMAGES.momo,
      rating: 4.9,
      reviewCount: 12,
      openingHours: '12:00 PM - 10:30 PM',
      deliveryTimeEstimate: '25-35 min',
      minOrder: 15,
      status: 'pending',
      isAvailable: false,
      totalOrders: 0,
      totalRevenue: 0,
      cuisineTypes: ['Momo', 'Tibetan', 'Asian'],
      createdAt: '2026-04-15T16:00:00.000Z',
    },
  ];

  const foodItems: FoodItem[] = [
    {
      id: 'food_1',
      restaurantId: 'rest_1',
      restaurantName: 'Flame & Crust Artisan Pizzeria',
      name: 'Neapolitan Margherita D.O.P.',
      description: 'Charred sourdough crust, San Marzano tomato sauce, fresh buffalo mozzarella, virgin olive oil, and sweet organic basil.',
      price: 18.5,
      category: 'Pizza',
      imageUrl: INITIAL_FOOD_IMAGES.pizza,
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 18,
      rating: 4.9,
      ordersCount: 940,
      customizations: [
        {
          title: 'Extra Toppings',
          required: false,
          options: [
            { name: 'Truffle Glaze', priceModifier: 2.5 },
            { name: 'Kalamata Olives', priceModifier: 1.5 },
            { name: 'Extra Buffalo Mozzarella', priceModifier: 3.0 },
          ],
        },
      ],
    },
    {
      id: 'food_2',
      restaurantId: 'rest_1',
      restaurantName: 'Flame & Crust Artisan Pizzeria',
      name: 'Truffle Wild Mushroom Pizza',
      description: 'Roasted cremini & portobello mushrooms, garlic ricotta cream base, smoked provolone, and fresh thyme.',
      price: 21.0,
      category: 'Pizza',
      imageUrl: INITIAL_FOOD_IMAGES.pizza,
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 20,
      rating: 4.88,
      ordersCount: 520,
    },
    {
      id: 'food_3',
      restaurantId: 'rest_2',
      restaurantName: 'The Royal Dum Darbar',
      name: 'Shahi Lucknowi Chicken Dum Biryani',
      description: 'Slow-cooked aged basmati rice layered with marinated tender chicken, saffron milk, fried shallots, and whole aromatic spices. Served with cucumber mint raita.',
      price: 22.0,
      category: 'Biryani',
      imageUrl: INITIAL_FOOD_IMAGES.biryani,
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 25,
      rating: 4.96,
      ordersCount: 1480,
      customizations: [
        {
          title: 'Spice Level',
          required: true,
          options: [
            { name: 'Mild & Fragrant', priceModifier: 0 },
            { name: 'Medium Authentic', priceModifier: 0 },
            { name: 'Fiery Royal Spice', priceModifier: 0 },
          ],
        },
        {
          title: 'Add-ons',
          required: false,
          options: [
            { name: 'Extra Mirchi Ka Salan', priceModifier: 2.0 },
            { name: 'Boiled Egg (2 pcs)', priceModifier: 2.5 },
          ],
        },
      ],
    },
    {
      id: 'food_4',
      restaurantId: 'rest_2',
      restaurantName: 'The Royal Dum Darbar',
      name: 'Paneer Subz Dum Biryani',
      description: 'Marinated cottage cheese cubes and garden vegetables sealed in a traditional clay handi with saffron, cardamom, and mint.',
      price: 19.5,
      category: 'Biryani',
      imageUrl: INITIAL_FOOD_IMAGES.biryani,
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 22,
      rating: 4.84,
      ordersCount: 460,
    },
    {
      id: 'food_5',
      restaurantId: 'rest_3',
      restaurantName: 'Smash & Bun Craft Burgers',
      name: 'The Nova Signature Double Smash',
      description: 'Two seared angus beef patties, aged Wisconsin cheddar, grilled caramelized shallots, house secret sauce on toasted brioche.',
      price: 16.5,
      category: 'Burgers',
      imageUrl: INITIAL_FOOD_IMAGES.burger,
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 15,
      rating: 4.92,
      ordersCount: 1120,
      customizations: [
        {
          title: 'Sides Choice',
          required: false,
          options: [
            { name: 'Hand-Cut Truffle Herb Fries', priceModifier: 3.5 },
            { name: 'Smoked Jalapeno Poppers', priceModifier: 4.0 },
          ],
        },
      ],
    },
    {
      id: 'food_6',
      restaurantId: 'rest_3',
      restaurantName: 'Smash & Bun Craft Burgers',
      name: 'Crispy Truffle Portobello Burger',
      description: 'Panko-crusted whole portobello mushroom stuffed with fontina, pickled cucumbers, arugula, and roasted garlic aioli.',
      price: 15.5,
      category: 'Burgers',
      imageUrl: INITIAL_FOOD_IMAGES.burger,
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 16,
      rating: 4.82,
      ordersCount: 380,
    },
    {
      id: 'food_7',
      restaurantId: 'rest_1',
      restaurantName: 'Flame & Crust Artisan Pizzeria',
      name: 'Classic Steamed Chicken Momos (10 Pcs)',
      description: 'Hand-pleated delicate dumplings filled with finely seasoned minced chicken, spring onions, ginger, and served with spicy timur sesame chutney.',
      price: 14.0,
      category: 'Momo',
      imageUrl: INITIAL_FOOD_IMAGES.momo,
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 14,
      rating: 4.93,
      ordersCount: 890,
    },
    {
      id: 'food_8',
      restaurantId: 'rest_1',
      restaurantName: 'Flame & Crust Artisan Pizzeria',
      name: 'Himalayan Organic Veg Momos (10 Pcs)',
      description: 'Steamed dumplings packed with minced cabbage, paneer, carrots, scallions, and roasted coriander seeds with tangy chili dip.',
      price: 12.5,
      category: 'Momo',
      imageUrl: INITIAL_FOOD_IMAGES.momo,
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 14,
      rating: 4.86,
      ordersCount: 610,
    },
  ];

  const coupons: Coupon[] = [
    {
      code: 'NOVAFIRST',
      discountPercent: 20,
      maxDiscount: 10,
      minOrder: 25,
      description: '20% off your first order over $25 (Max $10)',
      isActive: true,
    },
    {
      code: 'NOVEFIRST',
      discountPercent: 20,
      maxDiscount: 10,
      minOrder: 25,
      description: '20% off your first order over $25 (Max $10)',
      isActive: true,
    },
    {
      code: 'CRAVINGS15',
      discountPercent: 15,
      maxDiscount: 8,
      minOrder: 20,
      description: '15% discount on all gourmet dishes',
      isActive: true,
    },
    {
      code: 'SUPERNOVA',
      discountPercent: 30,
      maxDiscount: 15,
      minOrder: 40,
      description: '30% VIP discount on orders above $40',
      isActive: true,
    },
    {
      code: 'SUPERNOVE',
      discountPercent: 30,
      maxDiscount: 15,
      minOrder: 40,
      description: '30% VIP discount on orders above $40',
      isActive: true,
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord_1001',
      orderNumber: 'NV-8841',
      customerId: 'usr_customer_1',
      customerName: 'Elena Rostova',
      customerPhone: '+1 (555) 014-4821',
      restaurantId: 'rest_1',
      restaurantName: 'Flame & Crust Artisan Pizzeria',
      restaurantAddress: '42 Baker Street, Downtown',
      riderId: 'rider_1',
      riderName: 'Alex Mercer',
      riderPhone: '+1 (555) 017-3392',
      items: [
        {
          foodId: 'food_1',
          name: 'Neapolitan Margherita D.O.P.',
          unitPrice: 18.5,
          quantity: 1,
          subtotal: 18.5,
          isVeg: true,
        },
        {
          foodId: 'food_7',
          name: 'Classic Steamed Chicken Momos (10 Pcs)',
          unitPrice: 14.0,
          quantity: 1,
          subtotal: 14.0,
          isVeg: false,
        },
      ],
      subtotal: 32.5,
      deliveryFee: 3.5,
      discount: 6.5,
      couponCode: 'NOVEFIRST',
      tax: 2.5,
      total: 32.0,
      paymentMethod: 'card_online',
      paymentStatus: 'paid',
      deliveryAddress: {
        id: 'addr_1',
        label: 'Apartment',
        street: '742 Evergreen Terrace, Apt 4B',
        city: 'Metropolis',
        postalCode: '10001',
        deliveryInstructions: 'Ring bell 4B or leave at reception concierge.',
      },
      status: 'out_for_delivery',
      statusHistory: [
        { status: 'placed', timestamp: '2026-10-18T02:00:00.000Z', note: 'Order placed by customer' },
        { status: 'restaurant_accepted', timestamp: '2026-10-18T02:02:00.000Z', note: 'Kitchen confirmed preparation' },
        { status: 'preparing', timestamp: '2026-10-18T02:05:00.000Z', note: 'Chef baking pizza in wood oven' },
        { status: 'ready_for_pickup', timestamp: '2026-10-18T02:20:00.000Z', note: 'Packaged warmly for rider pickup' },
        { status: 'rider_assigned', timestamp: '2026-10-18T02:22:00.000Z', note: 'Rider Alex Mercer assigned' },
        { status: 'picked_up', timestamp: '2026-10-18T02:28:00.000Z', note: 'Rider picked up thermal package' },
        { status: 'out_for_delivery', timestamp: '2026-10-18T02:30:00.000Z', note: 'Rider is on the way (Est. 8 mins)' },
      ],
      estimatedDeliveryTime: '12-15 minutes',
      createdAt: '2026-10-18T02:00:00.000Z',
      updatedAt: '2026-10-18T02:30:00.000Z',
    },
    {
      id: 'ord_1002',
      orderNumber: 'NV-8842',
      customerId: 'usr_customer_1',
      customerName: 'Elena Rostova',
      customerPhone: '+1 (555) 014-4821',
      restaurantId: 'rest_2',
      restaurantName: 'The Royal Dum Darbar',
      restaurantAddress: '88 Saffron Lane, North Heritage',
      riderId: 'rider_1',
      riderName: 'Alex Mercer',
      riderPhone: '+1 (555) 017-3392',
      items: [
        {
          foodId: 'food_3',
          name: 'Shahi Lucknowi Chicken Dum Biryani',
          unitPrice: 22.0,
          quantity: 2,
          subtotal: 44.0,
          isVeg: false,
        },
      ],
      subtotal: 44.0,
      deliveryFee: 4.0,
      discount: 0,
      tax: 3.5,
      total: 51.5,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      deliveryAddress: {
        id: 'addr_1',
        label: 'Apartment',
        street: '742 Evergreen Terrace, Apt 4B',
        city: 'Metropolis',
        postalCode: '10001',
      },
      status: 'delivered',
      statusHistory: [
        { status: 'placed', timestamp: '2026-10-17T18:10:00.000Z' },
        { status: 'restaurant_accepted', timestamp: '2026-10-17T18:12:00.000Z' },
        { status: 'preparing', timestamp: '2026-10-17T18:15:00.000Z' },
        { status: 'ready_for_pickup', timestamp: '2026-10-17T18:35:00.000Z' },
        { status: 'picked_up', timestamp: '2026-10-17T18:42:00.000Z' },
        { status: 'out_for_delivery', timestamp: '2026-10-17T18:45:00.000Z' },
        { status: 'delivered', timestamp: '2026-10-17T19:05:00.000Z', note: 'Handed to customer at door' },
      ],
      createdAt: '2026-10-17T18:10:00.000Z',
      updatedAt: '2026-10-17T19:05:00.000Z',
    },
  ];

  const auditLogs: AdminAuditLog[] = [
    {
      id: 'log_1',
      adminId: 'usr_admin',
      adminEmail: 'admin@novahunger.com',
      action: 'APPROVE_RIDER',
      targetType: 'rider',
      targetId: 'rider_1',
      details: 'Approved rider application for Alex Mercer after DL verification.',
      timestamp: '2026-03-02T11:00:00.000Z',
    },
    {
      id: 'log_2',
      adminId: 'usr_admin',
      adminEmail: 'admin@novahunger.com',
      action: 'REJECT_RIDER',
      targetType: 'rider',
      targetId: 'rider_3',
      details: 'Rejected rider application for Marcus Brody. Reason: Vehicle registration paperwork expired.',
      timestamp: '2026-04-11T16:00:00.000Z',
    },
    {
      id: 'log_3',
      adminId: 'usr_admin',
      adminEmail: 'admin@novahunger.com',
      action: 'APPROVE_RESTAURANT',
      targetType: 'restaurant',
      targetId: 'rest_1',
      details: 'Approved restaurant Flame & Crust Artisan Pizzeria for food delivery operations.',
      timestamp: '2026-01-16T09:00:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'usr_customer_1',
      title: 'Order Out For Delivery! 🛵',
      message: 'Rider Alex Mercer is en route with your pizza & momos.',
      type: 'order',
      isRead: false,
      link: '/track-order/ord_1001',
      createdAt: '2026-10-18T02:30:00.000Z',
    },
    {
      id: 'notif_2',
      userId: 'usr_rider_2',
      title: 'Application Received',
      message: 'Your rider application is currently under review by our safety operations team.',
      type: 'rider_status',
      isRead: false,
      link: '/rider/pending',
      createdAt: '2026-04-12T14:30:00.000Z',
    },
  ];

  return {
    users,
    passwords,
    tokens: {
      token_admin_seed: 'usr_admin',
      token_customer_seed: 'usr_customer_1',
      token_rider_seed: 'usr_rider_1',
      token_rider_pending_seed: 'usr_rider_2',
      token_rest_seed: 'usr_rest_1',
    },
    riders,
    restaurants,
    foodItems,
    orders,
    coupons,
    auditLogs,
    notifications,
    themeSettings: {
      bgPrimary: '#0B0B0D',
      bgSecondary: '#151518',
      bgCard: '#151518',
      accentPrimary: '#FF7900',
      accentHighlight: '#FF9D00',
      textMain: '#FFFFFF',
      textSecondary: '#B8B8C0',
      borderColor: '#2B2B30',
      presetName: 'Midnight Orange',
    },
    tokenExpires: {},
    mediaLibrary: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        let modified = false;

        if (!parsed.themeSettings) {
          parsed.themeSettings = {
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
          modified = true;
        }

        if (!parsed.mediaLibrary) {
          parsed.mediaLibrary = [];
          modified = true;
        }

        if (!parsed.tokenExpires) {
          parsed.tokenExpires = {};
          modified = true;
        }

        if (!parsed.contactInquiries) {
          parsed.contactInquiries = [];
          modified = true;
        }

        if (!parsed.chatbotSettings) {
          parsed.chatbotSettings = {
            enabled: true,
            botName: 'Nova AI Assistant',
            welcomeMessage:
              'Hello! I am your Nova AI Assistant. How can I assist you with restaurants, delicious menu items, or your delivery today?',
            suggestedPrompts: [
              'Find me a pizza restaurant.',
              'What food can I order?',
              'Recommend something vegetarian.',
              'How do I place an order?',
              'How can I track my order?',
              'How can I contact support?',
            ],
            geminiModel: 'gemini-3.8-flash',
          };
          modified = true;
        }

        if (!parsed.emailSettings) {
          parsed.emailSettings = {
            businessEmail: 'shisirtharu51@gmail.com',
            gmailConnected: false,
            gmailAccount: 'shisirtharu51@gmail.com',
            lastChecked: new Date().toISOString(),
          };
          modified = true;
        }

        // Support both admin@novahunger.com and shisirtharu17@gmail.com
        if (!parsed.users.some((u: any) => u.email.toLowerCase() === 'shisirtharu17@gmail.com')) {
          parsed.users.push({
            id: 'usr_admin_owner',
            name: 'Shisir Tharu (Admin)',
            email: 'shisirtharu17@gmail.com',
            role: 'admin',
            phone: '+1 (555) 019-9000',
            createdAt: '2026-01-01T00:00:00.000Z',
            status: 'active',
          });
          parsed.passwords['usr_admin_owner'] = 'admin123';
          modified = true;
        }

        // Ensure rich realistic customers for admin roster, filtering, and charts
        const seedCustomers = [
          {
            id: 'usr_customer_2',
            name: 'Sophia Martinez',
            email: 'sophia.m@example.com',
            role: 'customer',
            phone: '+1 (555) 012-3849',
            createdAt: '2026-06-14T09:30:00.000Z',
            status: 'active',
            savedAddresses: [
              {
                id: 'addr_c2_1',
                label: 'Loft Residence',
                street: '512 Skyline Ave, Apt 12C',
                city: 'Metropolis',
                postalCode: '10003',
                deliveryInstructions: 'Keycode 8842 on gate panel.',
                isDefault: true,
              },
            ],
          },
          {
            id: 'usr_customer_3',
            name: 'Liam Chen',
            email: 'liam.chen@techfirm.io',
            role: 'customer',
            phone: '+1 (555) 018-9921',
            createdAt: '2026-07-22T14:15:00.000Z',
            status: 'active',
            savedAddresses: [
              {
                id: 'addr_c3_1',
                label: 'Tech Hub Office',
                street: '88 Innovation Way, Suite 400',
                city: 'Metropolis',
                postalCode: '10005',
                deliveryInstructions: 'Deliver to 4th floor reception desk.',
                isDefault: true,
              },
            ],
          },
          {
            id: 'usr_customer_4',
            name: 'Zara Al-Mansoor',
            email: 'zara.mansoor@designco.net',
            role: 'customer',
            phone: '+1 (555) 019-7734',
            createdAt: '2026-08-05T18:45:00.000Z',
            status: 'active',
            savedAddresses: [
              {
                id: 'addr_c4_1',
                label: 'Townhouse',
                street: '230 Heritage Row',
                city: 'Metropolis',
                postalCode: '10007',
                deliveryInstructions: 'Leave on front porch behind planter.',
                isDefault: true,
              },
            ],
          },
          {
            id: 'usr_customer_5',
            name: 'Ethan Gallagher',
            email: 'ethan.g@domain.org',
            role: 'customer',
            phone: '+1 (555) 013-6620',
            createdAt: '2026-09-02T10:00:00.000Z',
            status: 'inactive',
            savedAddresses: [
              {
                id: 'addr_c5_1',
                label: 'Home',
                street: '904 Riverwalk Lane',
                city: 'Metropolis',
                postalCode: '10009',
                deliveryInstructions: 'Ring doorbell twice.',
                isDefault: true,
              },
            ],
          },
          {
            id: 'usr_customer_6',
            name: 'Maya Patel',
            email: 'maya.patel@biomed.edu',
            role: 'customer',
            phone: '+1 (555) 016-5511',
            createdAt: '2026-10-01T16:20:00.000Z',
            status: 'active',
            savedAddresses: [
              {
                id: 'addr_c6_1',
                label: 'Campus Dorm',
                street: '400 University Blvd, Hall B',
                city: 'Metropolis',
                postalCode: '10012',
                deliveryInstructions: 'Call cell phone when in lobby.',
                isDefault: true,
              },
            ],
          },
          {
            id: 'usr_customer_7',
            name: 'Derrick Vance',
            email: 'derrick.v@flaggedaccount.com',
            role: 'customer',
            phone: '+1 (555) 011-9044',
            createdAt: '2026-05-18T11:00:00.000Z',
            status: 'suspended',
            savedAddresses: [
              {
                id: 'addr_c7_1',
                label: 'Apartment',
                street: '15 Harbor View Road',
                city: 'Metropolis',
                postalCode: '10014',
                deliveryInstructions: 'Suspended account.',
                isDefault: true,
              },
            ],
          },
        ];

        for (const cust of seedCustomers) {
          if (!parsed.users.some((u: any) => u.id === cust.id || u.email.toLowerCase() === cust.email.toLowerCase())) {
            parsed.users.push(cust);
            parsed.passwords[cust.id] = 'customer123';
            modified = true;
          }
        }

        // Add sample completed orders for new customers so spend and order counts are realistic
        if (!parsed.orders.some((o: any) => o.customerId === 'usr_customer_2')) {
          parsed.orders.push({
            id: 'ord_1004',
            orderNumber: 'NV-9102',
            customerId: 'usr_customer_2',
            customerName: 'Sophia Martinez',
            customerPhone: '+1 (555) 012-3849',
            restaurantId: 'rest_2',
            restaurantName: 'Saffron & Spice Royal Kitchen',
            restaurantAddress: '15 Heritage Square, Central',
            riderId: 'rider_1',
            riderName: 'Alex Mercer',
            riderPhone: '+1 (555) 017-3392',
            items: [
              {
                foodId: 'food_5',
                name: 'Awadhi Shahi Chicken Dum Biryani',
                unitPrice: 22,
                quantity: 2,
                subtotal: 44,
                isVeg: false,
              },
            ],
            subtotal: 44,
            deliveryFee: 4,
            discount: 0,
            tax: 3.5,
            total: 51.5,
            paymentMethod: 'card_online',
            paymentStatus: 'paid',
            deliveryAddress: {
              id: 'addr_c2_1',
              label: 'Loft Residence',
              street: '512 Skyline Ave, Apt 12C',
              city: 'Metropolis',
              postalCode: '10003',
            },
            status: 'delivered',
            statusHistory: [
              { status: 'placed', timestamp: '2026-10-10T12:00:00.000Z', note: 'Order placed' },
              { status: 'delivered', timestamp: '2026-10-10T12:45:00.000Z', note: 'Delivered' },
            ],
            placedAt: '2026-10-10T12:00:00.000Z',
            deliveredAt: '2026-10-10T12:45:00.000Z',
          });
          modified = true;
        }

        if (!parsed.orders.some((o: any) => o.customerId === 'usr_customer_3')) {
          parsed.orders.push({
            id: 'ord_1003',
            orderNumber: 'NV-9103',
            customerId: 'usr_customer_3',
            customerName: 'Liam Chen',
            customerPhone: '+1 (555) 018-9921',
            restaurantId: 'rest_3',
            restaurantName: 'The Himalayan Steamer & Momo Lounge',
            restaurantAddress: '88 Summit Heights, Uptown',
            riderId: 'rider_2',
            riderName: 'David Vance',
            riderPhone: '+1 (555) 019-4411',
            items: [
              {
                foodId: 'food_7',
                name: 'Classic Steamed Chicken Momos (10 Pcs)',
                unitPrice: 14,
                quantity: 3,
                subtotal: 42,
                isVeg: false,
              },
            ],
            subtotal: 42,
            deliveryFee: 3.5,
            discount: 5,
            couponCode: 'FOODIE10',
            tax: 3,
            total: 43.5,
            paymentMethod: 'card_online',
            paymentStatus: 'paid',
            deliveryAddress: {
              id: 'addr_c3_1',
              label: 'Tech Hub Office',
              street: '88 Innovation Way, Suite 400',
              city: 'Metropolis',
              postalCode: '10005',
            },
            status: 'delivered',
            statusHistory: [
              { status: 'placed', timestamp: '2026-10-12T19:00:00.000Z', note: 'Order placed' },
              { status: 'delivered', timestamp: '2026-10-12T19:40:00.000Z', note: 'Delivered' },
            ],
            placedAt: '2026-10-12T19:00:00.000Z',
            deliveredAt: '2026-10-12T19:40:00.000Z',
          });
          modified = true;
        }

        parsed.users.forEach((u: any) => {
          if (!u.status) {
            u.status = 'active';
            modified = true;
          }
        });

        if (modified) {
          this.save(parsed);
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Failed reading DB file, reinitializing default seed:', e);
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  public save(dataToSave?: DatabaseSchema): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed writing DB file:', e);
    }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  public raw(): DatabaseSchema {
    return this.data;
  }
}

export const db = new Database();
