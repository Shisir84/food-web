import {
  User,
  RiderProfile,
  RestaurantProfile,
  FoodItem,
  Order,
  Coupon,
  AdminAuditLog,
  PlatformStats,
  NotificationItem,
  ThemeSettings,
} from '../types/index.ts';

const TOKEN_KEY = 'nova_hunger_token';
const LEGACY_TOKEN_KEY = 'nove_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  },

  // Auth
  async login(payload: { email: string; password: string; portal?: string }) {
    const res = await this.request<{
      token: string;
      user: User;
      riderProfile?: RiderProfile;
      restaurantProfile?: RestaurantProfile;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  },

  async verifyFirebaseAdmin(idToken: string) {
    const res = await this.request<{
      token: string;
      user: User;
      firebaseUid: string;
      claims: { admin: boolean };
    }>('/api/auth/firebase-verify-admin', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    this.setToken(res.token);
    return res;
  },

  async register(payload: any) {
    const res = await this.request<{
      token: string;
      user: User;
      riderProfile?: RiderProfile;
      restaurantProfile?: RestaurantProfile;
      message: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  },

  async getCurrentUser() {
    return this.request<{
      user: User;
      riderProfile?: RiderProfile;
      restaurantProfile?: RestaurantProfile;
    }>('/api/auth/me');
  },

  async addAddress(payload: any) {
    return this.request<{ savedAddresses: any[]; newAddress: any }>(
      '/api/auth/profile/address',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Public
  async getRestaurants(params?: { search?: string; category?: string; city?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<RestaurantProfile[]>(`/api/restaurants${query ? `?${query}` : ''}`);
  },

  async getRestaurant(id: string) {
    return this.request<RestaurantProfile & { menu: FoodItem[] }>(`/api/restaurants/${id}`);
  },

  async getPopularFood() {
    return this.request<FoodItem[]>('/api/food/popular');
  },

  async getCategories() {
    return this.request<
      { id: string; name: string; description: string; imageUrl: string; itemCount: number }[]
    >('/api/categories');
  },

  async validateCoupon(code: string, subtotal: number) {
    return this.request<{ valid: boolean; code: string; discount: number; description: string }>(
      '/api/coupons/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }
    );
  },

  // Orders
  async createOrder(payload: any) {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyOrders() {
    return this.request<Order[]>('/api/orders/my');
  },

  async getOrder(id: string) {
    return this.request<Order>(`/api/orders/${id}`);
  },

  // Rider
  async getRiderProfile() {
    return this.request<RiderProfile>('/api/rider/profile');
  },

  async toggleRiderOnline() {
    return this.request<{ isOnline: boolean; status: string }>('/api/rider/toggle-online', {
      method: 'POST',
    });
  },

  async getRiderAvailableOrders() {
    return this.request<Order[]>('/api/rider/available-orders');
  },

  async getRiderDeliveries() {
    return this.request<Order[]>('/api/rider/my-deliveries');
  },

  async acceptRiderOrder(orderId: string) {
    return this.request<Order>(`/api/rider/orders/${orderId}/accept`, {
      method: 'POST',
    });
  },

  async pickupRiderOrder(orderId: string) {
    return this.request<Order>(`/api/rider/orders/${orderId}/pickup`, {
      method: 'POST',
    });
  },

  async deliverRiderOrder(orderId: string) {
    return this.request<Order>(`/api/rider/orders/${orderId}/deliver`, {
      method: 'POST',
    });
  },

  // Restaurant
  async getRestaurantMy() {
    return this.request<RestaurantProfile>('/api/restaurant/my');
  },

  async getRestaurantMenu() {
    return this.request<FoodItem[]>('/api/restaurant/menu');
  },

  async addFoodItem(item: Partial<FoodItem>) {
    return this.request<FoodItem>('/api/restaurant/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateFoodItem(id: string, item: Partial<FoodItem>) {
    return this.request<FoodItem>(`/api/restaurant/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteFoodItem(id: string) {
    return this.request<{ success: boolean }>(`/api/restaurant/menu/${id}`, {
      method: 'DELETE',
    });
  },

  async getRestaurantOrders() {
    return this.request<Order[]>('/api/restaurant/orders');
  },

  async updateOrderStatusRestaurant(orderId: string, status: string, note?: string) {
    return this.request<Order>(`/api/restaurant/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    });
  },

  // Admin
  async getAdminStats() {
    return this.request<PlatformStats>('/api/admin/stats');
  },

  async getAdminRiders(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<RiderProfile[]>(`/api/admin/riders${query ? `?${query}` : ''}`);
  },

  async approveRider(riderId: string) {
    return this.request<{ success: boolean; rider: RiderProfile }>(
      `/api/admin/riders/${riderId}/approve`,
      {
        method: 'POST',
      }
    );
  },

  async rejectRider(riderId: string, rejectionReason: string) {
    return this.request<{ success: boolean; rider: RiderProfile }>(
      `/api/admin/riders/${riderId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      }
    );
  },

  async suspendRider(riderId: string, suspend: boolean) {
    return this.request<{ success: boolean; rider: RiderProfile }>(
      `/api/admin/riders/${riderId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ suspend }),
      }
    );
  },

  async getAdminRestaurants(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<RestaurantProfile[]>(`/api/admin/restaurants${query ? `?${query}` : ''}`);
  },

  async approveRestaurant(restaurantId: string) {
    return this.request<{ success: boolean; restaurant: RestaurantProfile }>(
      `/api/admin/restaurants/${restaurantId}/approve`,
      {
        method: 'POST',
      }
    );
  },

  async rejectRestaurant(restaurantId: string, rejectionReason: string) {
    return this.request<{ success: boolean; restaurant: RestaurantProfile }>(
      `/api/admin/restaurants/${restaurantId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      }
    );
  },

  async getAdminOrders() {
    return this.request<Order[]>('/api/admin/orders');
  },

  async getAdminAuditLogs() {
    return this.request<AdminAuditLog[]>('/api/admin/audit-logs');
  },

  async reassignOrderRider(orderId: string, riderId: string) {
    return this.request<Order>(`/api/admin/orders/${orderId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ riderId }),
    });
  },

  // Notifications & Contact
  async getNotifications() {
    return this.request<NotificationItem[]>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async submitContact(payload: { name: string; email: string; subject: string; message: string }) {
    return this.request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Theme & Appearance
  async getTheme() {
    return this.request<ThemeSettings>('/api/theme');
  },

  async saveTheme(theme: ThemeSettings) {
    return this.request<{ success: boolean; theme: ThemeSettings }>('/api/admin/theme', {
      method: 'POST',
      body: JSON.stringify(theme),
    });
  },
};
