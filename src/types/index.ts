export type UserRole = 'customer' | 'rider' | 'restaurant' | 'admin';

export type RiderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type RestaurantStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type OrderStatus =
  | 'placed'
  | 'restaurant_accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  savedAddresses?: Address[];
  status?: 'active' | 'inactive' | 'suspended';
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface RiderProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'scooter' | 'car';
  vehicleRegNumber: string;
  city: string;
  deliveryArea: string;
  licenseNumber: string;
  idDocumentUrl: string;
  status: RiderStatus;
  isOnline: boolean;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rating: number;
  totalDeliveries: number;
  todayEarnings: number;
  weekEarnings: number;
  createdAt: string;
}

export interface RestaurantProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  deliveryArea: string;
  coverImage: string;
  logoImage: string;
  rating: number;
  reviewCount: number;
  openingHours: string;
  deliveryTimeEstimate: string;
  minOrder: number;
  status: RestaurantStatus;
  rejectionReason?: string;
  isAvailable: boolean;
  totalOrders: number;
  totalRevenue: number;
  cuisineTypes: string[];
  createdAt: string;
}

export interface FoodCustomizationOption {
  name: string;
  priceModifier: number;
}

export interface FoodCustomization {
  title: string;
  required: boolean;
  options: FoodCustomizationOption[];
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  customizations?: FoodCustomization[];
  rating?: number;
  ordersCount?: number;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  selectedOptions?: Record<string, string>;
  itemTotal: number;
}

export interface OrderItemSnapshot {
  foodId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isVeg: boolean;
  selectedOptions?: Record<string, string>;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'card_online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: Address;
  deliveryInstructions?: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrder: number;
  description: string;
  isActive: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'rider' | 'restaurant' | 'order' | 'settings' | 'user' | 'system';
  targetId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PlatformStats {
  totalCustomers: number;
  totalRiders: number;
  pendingRiders: number;
  approvedRiders: number;
  rejectedRiders: number;
  totalRestaurants: number;
  pendingRestaurants: number;
  approvedRestaurants: number;
  totalOrders: number;
  activeDeliveries: number;
  grossMerchandiseValue: number;
  platformCommission: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'rider_status' | 'restaurant_status' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    direction: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'radial';
    from: string;
    via?: string;
    to: string;
  };
  imageUrl?: string;
  position?: 'center' | 'top' | 'bottom';
  size?: 'cover' | 'contain' | 'auto';
  repeat?: 'no-repeat' | 'repeat';
  opacity?: number;
  overlayColor?: string;
  blur?: number;
}

export interface ThemeSettings {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  accentPrimary: string;
  accentHighlight: string;
  textMain: string;
  textSecondary: string;
  borderColor: string;
  presetName?: string;
  mode?: 'dark' | 'light';
  dashboardBackground?: BackgroundConfig;
  loginBackground?: BackgroundConfig;
  logoUrl?: string;
  appName?: string;
}

export interface CustomerRecord extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  totalCustomerSpend: number;
  averageOrderValue: number;
  registrationTrends: { date: string; label: string; count: number }[];
}

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  category: 'background' | 'logo' | 'food' | 'general';
  uploadedBy: string;
  uploadedAt: string;
}

