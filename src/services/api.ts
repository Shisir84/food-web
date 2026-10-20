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
  CustomerRecord,
  CustomerStats,
  BackgroundConfig,
  MediaItem,
  ContactInquiry,
  ChatbotSettings,
  EmailSettings,
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

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && window.location.pathname.startsWith('/admin')) {
          this.clearToken();
          window.dispatchEvent(new CustomEvent('nova_admin_session_expired'));
        }
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Network failure: Unable to establish connection with Nova Hunger server. Please check your connection.');
      }
      throw err;
    }
  },

  // Auth
  async login(payload: { email: string; password: string; portal?: string; rememberMe?: boolean }) {
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

  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyEmail(email: string, code: string) {
    return this.request<{ success: boolean; message: string; user?: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  async resendVerification(email: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async socialLogin(payload: { provider: string; name: string; email: string; avatarUrl?: string }) {
    const res = await this.request<{
      token: string;
      user: User;
      riderProfile?: RiderProfile;
      restaurantProfile?: RestaurantProfile;
      provider: string;
    }>('/api/auth/social-login', {
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
  async getRestaurants(params?: { search?: string; category?: string; city?: string; vegOnly?: boolean | string }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      if (params.search) cleanParams.search = params.search;
      if (params.category && params.category !== 'all' && params.category !== 'all flavors') {
        cleanParams.category = params.category;
      }
      if (params.city) cleanParams.city = params.city;
      if (params.vegOnly) cleanParams.vegOnly = 'true';
    }
    const query = new URLSearchParams(cleanParams).toString();
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

  async submitContact(payload: { name: string; email: string; subject?: string; message: string; hp?: string }) {
    return this.request<{
      success: boolean;
      ticketNumber: string;
      message: string;
      destinationEmail: string;
      emailDeliveryStatus: string;
    }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // AI Customer Chatbot
  async getChatbotPublicSettings() {
    return this.request<{
      enabled: boolean;
      botName: string;
      welcomeMessage: string;
      suggestedPrompts: string[];
    }>('/api/chatbot/public-settings');
  },

  async sendChatMessage(payload: { message: string; history?: any[] }) {
    return this.request<{
      reply: string;
      suggestedAction?: {
        type: 'navigate' | 'cart' | 'contact_form';
        label: string;
        target: string;
        payload?: any;
      };
      model?: string;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin AI Chatbot & Gmail Settings
  async getAdminChatbotSettings() {
    return this.request<{
      settings: ChatbotSettings;
      geminiApiKeyConfigured: boolean;
      geminiModel: string;
    }>('/api/admin/chatbot/settings');
  },

  async saveAdminChatbotSettings(settings: Partial<ChatbotSettings>) {
    return this.request<{ success: boolean; settings: ChatbotSettings }>('/api/admin/chatbot/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async getAdminEmailSettings() {
    return this.request<{
      settings: EmailSettings;
      firebaseAppletConfigured: boolean;
    }>('/api/admin/email/settings');
  },

  async saveAdminEmailSettings(settings: Partial<EmailSettings>) {
    return this.request<{ success: boolean; settings: EmailSettings }>('/api/admin/email/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async getAdminInquiries(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ContactInquiry[]>(`/api/admin/inquiries${query ? `?${query}` : ''}`);
  },

  async updateAdminInquiryStatus(id: string, status: string, adminNotes?: string) {
    return this.request<{ success: boolean; inquiry: ContactInquiry }>(`/api/admin/inquiries/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  async getAdminSystemHealth() {
    return this.request<{
      status: string;
      timestamp: string;
      database: { status: string; type: string; usersCount: number; ordersCount: number; restaurantsCount: number };
      geminiAi: { status: string; model: string; chatbotEnabled: boolean };
      gmail: { status: string; configuredInbox: string };
    }>('/api/admin/system/health');
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

  async resetAdminTheme() {
    return this.request<{ success: boolean; theme: ThemeSettings }>('/api/admin/theme/reset', {
      method: 'POST',
    });
  },

  // Admin Customers
  async getAdminCustomers(params?: {
    search?: string;
    status?: string;
    dateRange?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{
      customers: CustomerRecord[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      stats: CustomerStats;
    }>(`/api/admin/customers${query ? `?${query}` : ''}`);
  },

  async getAdminCustomer(id: string) {
    return this.request<{
      customer: CustomerRecord;
      orders: Order[];
      savedAddresses: any[];
    }>(`/api/admin/customers/${id}`);
  },

  async updateAdminCustomer(id: string, data: Partial<CustomerRecord>) {
    return this.request<{ success: boolean; customer: CustomerRecord }>(`/api/admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateAdminCustomerStatus(id: string, status: string, reason?: string) {
    return this.request<{ success: boolean; customer: CustomerRecord }>(
      `/api/admin/customers/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      }
    );
  },

  async deleteAdminCustomer(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/customers/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminCustomerExportUrl() {
    const token = this.getToken();
    return `/api/admin/customers/export${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Admin Media Library
  async getAdminMedia(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<MediaItem[]>(`/api/admin/media${query}`);
  },

  async uploadAdminMedia(data: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
    category?: string;
  }) {
    return this.request<{ success: boolean; media: MediaItem }>('/api/admin/media/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminMedia(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/admin/media/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Security & Profile
  async changeAdminPassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/admin/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateAdminProfile(data: { name: string; phone?: string }) {
    return this.request<{ success: boolean; user: User }>('/api/admin/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdminUsers(params?: { role?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<User[]>(`/api/admin/users${query ? `?${query}` : ''}`);
  },

  async createAdminUser(data: {
    name: string;
    email: string;
    role: string;
    password: string;
    phone?: string;
  }) {
    return this.request<{ success: boolean; user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
