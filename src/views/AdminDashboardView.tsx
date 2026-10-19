import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Bike,
  Store,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Clock,
  Eye,
  RotateCw,
  AlertCircle,
  Lock,
  KeyRound,
  Mail,
  ShieldCheck,
  LogOut,
  Download,
  Upload,
  Image as ImageIcon,
  Palette,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Trash2,
  Edit,
  Copy,
  Sun,
  Moon,
  TrendingUp,
  MapPin,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  Check,
  Activity,
  Bell,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  PlatformStats,
  RiderProfile,
  RestaurantProfile,
  Order,
  AdminAuditLog,
  ThemeSettings,
  CustomerRecord,
  CustomerStats,
  BackgroundConfig,
  MediaItem,
  User as UserType,
} from '../types/index.ts';

interface AdminDashboardViewProps {
  onNavigate: (path: string) => void;
}

type AdminTab =
  | 'dashboard'
  | 'customers'
  | 'riders'
  | 'restaurants'
  | 'orders'
  | 'users'
  | 'appearance'
  | 'media'
  | 'logs'
  | 'security';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, previewTheme, saveTheme, resetDefault, toggleMode, getBackgroundStyle, presets } =
    useTheme();

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const path = window.location.pathname;
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/riders')) return 'riders';
    if (path.includes('/restaurants')) return 'restaurants';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/users')) return 'users';
    if (path.includes('/appearance')) return 'appearance';
    if (path.includes('/media')) return 'media';
    if (path.includes('/logs')) return 'logs';
    if (path.includes('/security') || path.includes('/settings')) return 'security';
    return 'dashboard';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Customers State
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all');
  const [customerDateRange, setCustomerDateRange] = useState('all');
  const [customerSortBy, setCustomerSortBy] = useState('createdAt');
  const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerTotalCount, setCustomerTotalCount] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Customer Modals
  const [inspectingCustomer, setInspectingCustomer] = useState<{
    customer: CustomerRecord;
    orders: Order[];
    savedAddresses: any[];
  } | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRecord | null>(null);

  // Riders State
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [riderFilterStatus, setRiderFilterStatus] = useState<string>('all');
  const [riderSearch, setRiderSearch] = useState('');
  const [rejectingRider, setRejectingRider] = useState<RiderProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectingRider, setInspectingRider] = useState<RiderProfile | null>(null);

  // Restaurants State
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [rejectingRestaurant, setRejectingRestaurant] = useState<RestaurantProfile | null>(null);
  const [restaurantRejectionReason, setRestaurantRejectionReason] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // All Users State
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'customer',
    password: '',
    phone: '',
  });

  // Media Library State
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState<{
    file: File;
    preview: string;
    category: 'background' | 'logo' | 'food' | 'general';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Appearance & Backgrounds State
  const [appearanceTab, setAppearanceTab] = useState<'dashboard' | 'login' | 'theme'>('dashboard');
  const [draftTheme, setDraftTheme] = useState<ThemeSettings>(theme);
  const [themeSaving, setThemeSaving] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [logSearch, setLogSearch] = useState('');

  // Security & Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Sync draftTheme whenever theme updates
  useEffect(() => {
    setDraftTheme(theme);
  }, [theme]);

  // Load High-Level Admin Data
  const loadPlatformData = async () => {
    try {
      setIsLoading(true);
      const [s, r, rest, ords, l] = await Promise.all([
        api.getAdminStats(),
        api.getAdminRiders({ status: riderFilterStatus, search: riderSearch }),
        api.getAdminRestaurants(),
        api.getAdminOrders(),
        api.getAdminAuditLogs(),
      ]);
      setStats(s);
      setRiders(r);
      setRestaurants(rest);
      setOrders(ords);
      setLogs(l);
    } catch (err: any) {
      console.warn('Admin platform records notice:', err?.message || err);
      if (err?.message && (err.message.includes('Unauthorized') || err.message.includes('session'))) {
        window.dispatchEvent(new CustomEvent('nova_admin_session_expired'));
      } else {
        setActionError(err.message || 'Failed to retrieve administrative records.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load Customers with filters & pagination
  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const res = await api.getAdminCustomers({
        search: customerSearch,
        status: customerStatusFilter,
        dateRange: customerDateRange,
        sortBy: customerSortBy,
        sortOrder: customerSortOrder,
        page: customerPage,
        limit: 10,
      });
      setCustomers(res.customers);
      setCustomerStats(res.stats);
      setCustomerTotalCount(res.total);
      setCustomerTotalPages(res.totalPages);
    } catch (err: any) {
      console.warn('Admin customer records notice:', err?.message || err);
      if (err?.message && (err.message.includes('Unauthorized') || err.message.includes('session'))) {
        window.dispatchEvent(new CustomEvent('nova_admin_session_expired'));
      } else {
        setActionError(err.message || 'Failed to load customer list.');
      }
    } finally {
      setCustomersLoading(false);
    }
  };

  // Load Media Assets
  const loadMedia = async () => {
    try {
      const data = await api.getAdminMedia(mediaCategoryFilter === 'all' ? undefined : mediaCategoryFilter);
      setMediaList(data);
    } catch (err: any) {
      console.error('Failed to load media assets:', err);
    }
  };

  // Load All Users
  const loadUsers = async () => {
    try {
      const usersData = await api.getAdminUsers({
        role: userRoleFilter === 'all' ? undefined : userRoleFilter,
        search: userSearch,
      });
      setAllUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load user accounts:', err);
    }
  };

  // Initial & Tab-based data loading
  useEffect(() => {
    loadPlatformData();
  }, [riderFilterStatus, riderSearch]);

  useEffect(() => {
    if (activeTab === 'customers' || activeTab === 'dashboard') {
      loadCustomers();
    }
    if (activeTab === 'media' || activeTab === 'appearance') {
      loadMedia();
    }
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [
    activeTab,
    customerSearch,
    customerStatusFilter,
    customerDateRange,
    customerSortBy,
    customerSortOrder,
    customerPage,
    mediaCategoryFilter,
    userRoleFilter,
    userSearch,
  ]);

  // Toast Helpers
  const showSuccess = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  // -------------------------------------------------------------
  // CUSTOMER ACTION HANDLERS
  // -------------------------------------------------------------
  const handleInspectCustomer = async (customerId: string) => {
    try {
      const data = await api.getAdminCustomer(customerId);
      setInspectingCustomer(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load customer profile details.');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await api.updateAdminCustomer(editingCustomer.id, editingCustomer);
      showSuccess(`Profile for ${editingCustomer.name} updated successfully.`);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || 'Failed to update customer profile.');
    }
  };

  const handleToggleCustomerStatus = async (
    customerId: string,
    currentStatus: 'active' | 'inactive' | 'suspended'
  ) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? 'Administrative deactivation' : 'Reactivated by admin';
    try {
      await api.updateAdminCustomerStatus(customerId, nextStatus, reason);
      showSuccess(`Customer account is now ${nextStatus}.`);
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || 'Failed to change customer status.');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      const res = await api.deleteAdminCustomer(deletingCustomer.id);
      showSuccess(res.message);
      setDeletingCustomer(null);
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || 'Failed to delete customer.');
    }
  };

  // -------------------------------------------------------------
  // RIDER ACTION HANDLERS
  // -------------------------------------------------------------
  const handleApproveRider = async (riderId: string) => {
    try {
      await api.approveRider(riderId);
      showSuccess('Rider application approved! Courier can now go online.');
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Failed to approve courier.');
    }
  };

  const handleRejectRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRider || !rejectionReason.trim()) return;
    try {
      await api.rejectRider(rejectingRider.id, rejectionReason.trim());
      showSuccess(`Courier ${rejectingRider.fullName} application rejected.`);
      setRejectingRider(null);
      setRejectionReason('');
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Failed to reject courier.');
    }
  };

  const handleSuspendRider = async (riderId: string, suspend: boolean) => {
    try {
      await api.suspendRider(riderId, suspend);
      showSuccess(`Courier account ${suspend ? 'suspended' : 'reactivated'}.`);
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Action failed.');
    }
  };

  // -------------------------------------------------------------
  // RESTAURANT ACTION HANDLERS
  // -------------------------------------------------------------
  const handleApproveRestaurant = async (restId: string) => {
    try {
      await api.approveRestaurant(restId);
      showSuccess('Restaurant verified and approved for live orders!');
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Failed to approve restaurant.');
    }
  };

  const handleRejectRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRestaurant || !restaurantRejectionReason.trim()) return;
    try {
      await api.rejectRestaurant(rejectingRestaurant.id, restaurantRejectionReason.trim());
      showSuccess(`Restaurant ${rejectingRestaurant.name} rejected.`);
      setRejectingRestaurant(null);
      setRestaurantRejectionReason('');
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Failed to reject restaurant.');
    }
  };

  // -------------------------------------------------------------
  // ORDER DISPATCH HANDLER
  // -------------------------------------------------------------
  const handleReassignOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningOrder || !selectedRiderId) return;
    try {
      await api.reassignOrderRider(reassigningOrder.id, selectedRiderId);
      showSuccess(`Order #${reassigningOrder.orderNumber} reassigned to new courier.`);
      setReassigningOrder(null);
      setSelectedRiderId('');
      await loadPlatformData();
    } catch (err: any) {
      showError(err.message || 'Failed to reassign order.');
    }
  };

  // -------------------------------------------------------------
  // USER PROVISIONING HANDLER
  // -------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newUserData);
      showSuccess(`New account for ${newUserData.name} created successfully.`);
      setNewUserModalOpen(false);
      setNewUserData({ name: '', email: '', role: 'customer', password: '', phone: '' });
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'Failed to create account.');
    }
  };

  // -------------------------------------------------------------
  // IMAGE UPLOADER HANDLERS
  // -------------------------------------------------------------
  const handleFileSelect = (file: File) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      showError('Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(`File exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setStagedFile({
        file,
        preview: reader.result as string,
        category: 'background',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!stagedFile) return;
    setUploadProgress(true);
    try {
      const res = await api.uploadAdminMedia({
        fileName: stagedFile.file.name,
        mimeType: stagedFile.file.type,
        dataUrl: stagedFile.preview,
        category: stagedFile.category,
      });
      showSuccess(`Image "${res.media.originalName}" uploaded to media library!`);
      setStagedFile(null);
      await loadMedia();
    } catch (err: any) {
      showError(err.message || 'Upload failed.');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      await api.deleteAdminMedia(id);
      showSuccess('Media asset removed.');
      await loadMedia();
    } catch (err: any) {
      showError(err.message || 'Failed to delete media asset.');
    }
  };

  // -------------------------------------------------------------
  // APPEARANCE & BACKGROUND SETTINGS HANDLERS
  // -------------------------------------------------------------
  const handleApplyBackgroundToDraft = (
    target: 'dashboard' | 'login',
    config: BackgroundConfig
  ) => {
    if (target === 'dashboard') {
      const updated = { ...draftTheme, dashboardBackground: config };
      setDraftTheme(updated);
      previewTheme(updated);
    } else {
      const updated = { ...draftTheme, loginBackground: config };
      setDraftTheme(updated);
    }
  };

  const handleSaveThemeSettings = async () => {
    setThemeSaving(true);
    try {
      await saveTheme(draftTheme);
      showSuccess('Appearance and background settings saved successfully!');
    } catch (err: any) {
      showError(err.message || 'Failed to persist appearance settings.');
    } finally {
      setThemeSaving(false);
    }
  };

  const handleResetThemeSettings = async () => {
    if (!confirm('Reset all appearance & backgrounds to factory defaults?')) return;
    try {
      await resetDefault();
      showSuccess('Appearance settings reset to factory defaults.');
    } catch (err: any) {
      showError(err.message || 'Failed to reset appearance.');
    }
  };

  // -------------------------------------------------------------
  // PASSWORD CHANGE HANDLER
  // -------------------------------------------------------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('New password and confirmation password do not match.');
      return;
    }
    setPasswordChangeLoading(true);
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      showSuccess('Master administrator password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showError(err.message || 'Failed to update administrator password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STYLING & THEMING HELPERS
  // -------------------------------------------------------------
  const isLight = theme.mode === 'light';
  const dashboardBgStyle = getBackgroundStyle(theme.dashboardBackground);

  // Navigation Links Definition
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
      badge: customerTotalCount > 0 ? customerTotalCount : undefined,
    },
    {
      id: 'riders',
      label: 'Couriers & Fleet',
      icon: <Bike className="w-4 h-4" />,
      badge: stats?.pendingRiders ? stats.pendingRiders : undefined,
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      icon: <Store className="w-4 h-4" />,
      badge: stats?.pendingRestaurants ? stats.pendingRestaurants : undefined,
    },
    {
      id: 'orders',
      label: 'Orders & Dispatch',
      icon: <Package className="w-4 h-4" />,
      badge: stats?.activeDeliveries ? stats.activeDeliveries : undefined,
    },
    { id: 'users', label: 'User Directory', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance & BG', icon: <Palette className="w-4 h-4" /> },
    { id: 'media', label: 'Media Uploader', icon: <Upload className="w-4 h-4" /> },
    { id: 'logs', label: 'System Audit Logs', icon: <Activity className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Profile', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: isLight ? '#F8FAFC' : '#0B0B0D',
        color: isLight ? '#0F172A' : '#FFFFFF',
        ...dashboardBgStyle,
      }}
    >
      {/* ========================================================= */}
      {/* TOP NAVIGATION BAR                                        */}
      {/* ========================================================= */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors ${
          isLight
            ? 'bg-white/90 border-slate-200/80 shadow-sm'
            : 'bg-[#121215]/90 border-[#2B2B30]/80 shadow-md'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-stone-700 text-stone-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 rounded-xl border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white transition-colors"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Application Brand / Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 font-extrabold text-sm shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-tight block">
                {theme.appName || 'Nova Hunger Food'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 block">
                Operations Console
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh Action */}
          <button
            onClick={() => {
              loadPlatformData();
              loadCustomers();
            }}
            title="Reload records"
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-[#151518] border-[#2B2B30] text-stone-300 hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={toggleMode}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-[#151518] border-[#2B2B30] text-amber-400 hover:text-amber-300'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 rounded-xl border relative transition-colors ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#151518] border-[#2B2B30] text-stone-300 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              {stats?.pendingRiders || stats?.pendingRestaurants ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
              ) : null}
            </button>

            {notificationsOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-4 space-y-3 z-50 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-2 text-xs font-bold">
                  <span>System Activity</span>
                  <span className="text-[10px] text-orange-500">Live Feed</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                  {logs.slice(0, 4).map((l) => (
                    <div key={l.id} className="p-2 rounded-xl bg-black/20 text-[11px] space-y-1">
                      <div className="font-semibold text-orange-400">{l.action}</div>
                      <div className="text-stone-400 text-[10px] truncate">{l.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin User Profile Pill */}
          <div
            className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl border text-xs ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500 text-black font-extrabold flex items-center justify-center text-xs">
              A
            </div>
            <div className="hidden lg:block text-left">
              <span className="font-bold block text-[11px] leading-tight truncate max-w-[100px]">
                {user?.name || 'Master Admin'}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold block leading-tight">
                Online • Tier 1
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                onNavigate('/admin/login');
              }}
              title="Secure Sign Out"
              className="p-1 hover:text-rose-400 transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT                         */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside
          className={`hidden md:flex flex-col border-r transition-all duration-300 z-20 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } ${
            isLight
              ? 'bg-white/80 border-slate-200/80 backdrop-blur-md'
              : 'bg-[#121215]/80 border-[#2B2B30]/80 backdrop-blur-md'
          }`}
        >
          {/* Navigation Links */}
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.history.pushState({}, '', `/admin/${item.id}`);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all relative ${
                    active
                      ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {!sidebarCollapsed && item.badge ? (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        active ? 'bg-black text-white' : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Quick Sign Out at Sidebar bottom */}
          <div className="p-3 border-t border-inherit">
            <button
              onClick={() => {
                logout();
                onNavigate('/admin/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>End Admin Session</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div
              className={`relative w-4/5 max-w-xs h-full border-r flex flex-col p-4 shadow-2xl z-10 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-inherit mb-3">
                <span className="font-bold text-sm">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                      window.history.pushState({}, '', `/admin/${item.id}`);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-orange-500 text-black font-bold'
                        : 'text-stone-400 hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Notifications Banner */}
          {actionNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{actionNotice}</span>
              </div>
              <button onClick={() => setActionNotice(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 1: MAIN DASHBOARD OVERVIEW                        */}
          {/* ===================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Platform Overview</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Real-time metrics, customer growth trends, and dispatch activity.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Customers</span>
                  </button>
                </div>
              </div>

              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Customers */}
                <div
                  className={`p-5 rounded-3xl border shadow-sm space-y-2 transition-all ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-400">Total Customers</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-orange-500 tabular-nums">
                    {stats?.totalCustomers || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{customerStats?.activeCustomers || 0} active accounts</span>
                  </div>
                </div>

                {/* New Customers in 30 Days */}
                <div
                  className={`p-5 rounded-3xl border shadow-sm space-y-2 transition-all ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-400">New (Last 30 Days)</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-cyan-400 tabular-nums">
                    {customerStats?.newCustomers || 0}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Recent signups across platform
                  </div>
                </div>

                {/* Active Deliveries */}
                <div
                  className={`p-5 rounded-3xl border shadow-sm space-y-2 transition-all ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-400">Active Deliveries</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
                    {stats?.activeDeliveries || 0}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Live orders in progress
                  </div>
                </div>

                {/* Gross Merchandise Value */}
                <div
                  className={`p-5 rounded-3xl border shadow-sm space-y-2 transition-all ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-400">Gross Platform GMV</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">
                    ${stats?.grossMerchandiseValue?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Platform cut: ${stats?.platformCommission?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Visual Customer Growth Chart & Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Visual Registration Trends */}
                <div
                  className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm">Customer Registration Trends</h3>
                      <p className="text-[11px] text-stone-400">Monthly account creation trajectory</p>
                    </div>
                    <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                      Live Telemetry
                    </span>
                  </div>

                  {/* SVG Bar Visual */}
                  <div className="pt-4 pb-2">
                    <div className="h-44 flex items-end justify-between gap-3 px-2">
                      {customerStats?.registrationTrends?.map((item, idx) => {
                        const maxVal = Math.max(
                          ...customerStats.registrationTrends.map((t) => t.count),
                          1
                        );
                        const heightPercent = Math.max(20, Math.round((item.count / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <span className="text-[10px] font-bold text-orange-400">{item.count}</span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-orange-600 to-amber-400 hover:brightness-125 transition-all shadow-md"
                            />
                            <span className="text-[10px] font-semibold text-stone-400">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Account Health & Status Distribution */}
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div>
                    <h3 className="font-display font-bold text-sm">Account Status Breakdown</h3>
                    <p className="text-[11px] text-stone-400">Total customer health monitor</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-emerald-400">Active Verified</span>
                        <span>{customerStats?.activeCustomers || 0}</span>
                      </div>
                      <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${
                              customerStats?.totalCustomers
                                ? ((customerStats.activeCustomers || 0) / customerStats.totalCustomers) * 100
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-stone-400">Inactive</span>
                        <span>{customerStats?.inactiveCustomers || 0}</span>
                      </div>
                      <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-500 rounded-full"
                          style={{
                            width: `${
                              customerStats?.totalCustomers
                                ? ((customerStats.inactiveCustomers || 0) / customerStats.totalCustomers) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-rose-400">Suspended</span>
                        <span>{customerStats?.suspendedCustomers || 0}</span>
                      </div>
                      <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{
                            width: `${
                              customerStats?.totalCustomers
                                ? ((customerStats.suspendedCustomers || 0) / customerStats.totalCustomers) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="pt-2 border-t border-inherit grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-black/20">
                      <span className="text-[10px] text-stone-400 block">Avg Order Value</span>
                      <span className="font-bold text-amber-400">
                        ${customerStats?.averageOrderValue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/20">
                      <span className="text-[10px] text-stone-400 block">Customer Spend</span>
                      <span className="font-bold text-orange-400">
                        ${customerStats?.totalCustomerSpend?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Customer Registrations Roster */}
              <div
                className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm">Recent Customer Registrations</h3>
                    <p className="text-[11px] text-stone-400">Latest customer accounts created on Nova Hunger</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-xs font-bold text-orange-500 hover:text-orange-400"
                  >
                    View All Customers →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-inherit text-stone-400 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Email & Phone</th>
                        <th className="py-2.5 px-3">Orders</th>
                        <th className="py-2.5 px-3">Spent</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {customers.slice(0, 5).map((c) => (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center text-xs">
                                {c.name.charAt(0)}
                              </div>
                              <span className="font-semibold">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div>{c.email}</div>
                            <div className="text-[10px] text-stone-400">{c.phone || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold tabular-nums">{c.totalOrders}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-400 tabular-nums">
                            ${c.totalSpent?.toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                c.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : c.status === 'suspended'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'
                              }`}
                            >
                              {c.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleInspectCustomer(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500 hover:text-black text-orange-400 text-[11px] font-bold transition-colors"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: FULL CUSTOMER MANAGEMENT                       */}
          {/* ===================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Customer Management</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Search, filter, view profile details, edit, deactivate, or export customer records.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={api.getAdminCustomerExportUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary px-3.5 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Export CSV</span>
                  </a>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div
                className={`p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                }`}
              >
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                    placeholder="Search by customer name, email, or phone number..."
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={customerStatusFilter}
                  onChange={(e) => {
                    setCustomerStatusFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                  className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 shrink-0 w-full md:w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                {/* Date Filter */}
                <select
                  value={customerDateRange}
                  onChange={(e) => {
                    setCustomerDateRange(e.target.value);
                    setCustomerPage(1);
                  }}
                  className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 shrink-0 w-full md:w-auto"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>

                {/* Sort selector */}
                <select
                  value={`${customerSortBy}_${customerSortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split('_');
                    setCustomerSortBy(f);
                    setCustomerSortOrder(o as any);
                  }}
                  className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 shrink-0 w-full md:w-auto"
                >
                  <option value="createdAt_desc">Newest First</option>
                  <option value="createdAt_asc">Oldest First</option>
                  <option value="totalSpent_desc">Highest Spend</option>
                  <option value="totalOrders_desc">Most Orders</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>

              {/* Customers Data Table */}
              <div
                className={`rounded-3xl border shadow-sm overflow-hidden ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-inherit bg-black/10 text-stone-400 font-semibold text-[11px]">
                        <th className="py-3 px-4">Customer Details</th>
                        <th className="py-3 px-4">Phone & City</th>
                        <th className="py-3 px-4 text-center">Orders</th>
                        <th className="py-3 px-4">Total Spend</th>
                        <th className="py-3 px-4">Last Order</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {customersLoading ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-stone-400">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                              <span>Loading customer records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : customers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-stone-400">
                            <Users className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                            <p className="font-semibold text-sm">No customers found</p>
                            <p className="text-xs text-stone-500 mt-1">
                              Try clearing filters or adjusting your search term.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            {/* Customer Avatar & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-orange-500/10 text-orange-400 font-extrabold flex items-center justify-center text-sm border border-orange-500/20 shrink-0">
                                  {c.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold block text-sm">{c.name}</span>
                                  <span className="text-[11px] text-stone-400">{c.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Phone & Saved Addresses */}
                            <td className="py-3.5 px-4 text-stone-400">
                              <div>{c.phone || 'N/A'}</div>
                              <div className="text-[10px] text-stone-500">
                                {(c.savedAddresses || []).length} saved address
                              </div>
                            </td>

                            {/* Orders count */}
                            <td className="py-3.5 px-4 text-center font-bold tabular-nums">
                              {c.totalOrders}
                            </td>

                            {/* Total Spent */}
                            <td className="py-3.5 px-4 font-bold text-emerald-400 tabular-nums">
                              ${c.totalSpent?.toFixed(2)}
                            </td>

                            {/* Last Order Date */}
                            <td className="py-3.5 px-4 text-stone-400">
                              {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}
                            </td>

                            {/* Status badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                  c.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : c.status === 'suspended'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-stone-500/10 text-stone-400 border border-stone-500/30'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    c.status === 'active'
                                      ? 'bg-emerald-400'
                                      : c.status === 'suspended'
                                      ? 'bg-rose-400'
                                      : 'bg-stone-400'
                                  }`}
                                />
                                <span>{c.status || 'active'}</span>
                              </span>
                            </td>

                            {/* Registration Date */}
                            <td className="py-3.5 px-4 text-stone-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions Dropdown / Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleInspectCustomer(c.id)}
                                  title="View Customer Profile"
                                  className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingCustomer(c)}
                                  title="Edit Customer"
                                  className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleCustomerStatus(c.id, c.status || 'active')}
                                  title={c.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    c.status === 'active'
                                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black'
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                                  }`}
                                >
                                  {c.status === 'active' ? (
                                    <UserX className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setDeletingCustomer(c)}
                                  title="Delete Customer"
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-inherit flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
                  <span>
                    Showing {customerTotalCount === 0 ? 0 : (customerPage - 1) * 10 + 1} to{' '}
                    {Math.min(customerPage * 10, customerTotalCount)} of {customerTotalCount} customers
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={customerPage <= 1}
                      onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-inherit disabled:opacity-40 font-semibold hover:border-orange-500"
                    >
                      Previous
                    </button>
                    <span className="font-bold text-white px-2">
                      Page {customerPage} of {customerTotalPages || 1}
                    </span>
                    <button
                      disabled={customerPage >= customerTotalPages}
                      onClick={() => setCustomerPage((p) => Math.min(customerTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-inherit disabled:opacity-40 font-semibold hover:border-orange-500"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 3: COURIER & FLEET MANAGEMENT (PRESERVED)         */}
          {/* ===================================================== */}
          {activeTab === 'riders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Delivery Rider Operations</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Verify applicant identity, approve delivery couriers, and manage operational status.
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-inherit pb-3 text-xs font-semibold overflow-x-auto">
                {['all', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRiderFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition-colors ${
                      riderFilterStatus === st
                        ? 'bg-orange-500 text-black font-bold'
                        : 'text-stone-400 hover:text-white bg-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Riders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riders.map((r) => (
                  <div
                    key={r.id}
                    className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center text-sm border border-orange-500/20">
                          {r.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm leading-tight">{r.fullName}</h4>
                          <span className="text-[11px] text-stone-400 block">{r.email}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          r.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : r.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/20 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Vehicle:</span>
                        <span className="font-semibold capitalize">
                          {r.vehicleType} ({r.vehicleRegNumber})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">City & Zone:</span>
                        <span className="font-semibold">{r.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Deliveries:</span>
                        <span className="font-semibold text-emerald-400">{r.totalDeliveries}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRider(r.id)}
                            className="btn-primary flex-1 py-2 text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingRider(r)}
                            className="btn-secondary flex-1 py-2 text-xs font-bold text-rose-400"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleSuspendRider(r.id, true)}
                          className="btn-secondary w-full py-2 text-xs font-bold text-amber-400"
                        >
                          Suspend Courier
                        </button>
                      )}
                      {r.status === 'suspended' && (
                        <button
                          onClick={() => handleSuspendRider(r.id, false)}
                          className="btn-primary w-full py-2 text-xs font-bold"
                        >
                          Reactivate Courier
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 4: RESTAURANT PARTNERS (PRESERVED)                */}
          {/* ===================================================== */}
          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Restaurant Partners</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Review commercial licenses, kitchen health approvals, and menu publications.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={rest.coverImage}
                          alt={rest.name}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-stone-800"
                        />
                        <div>
                          <h4 className="font-bold text-sm leading-tight">{rest.name}</h4>
                          <span className="text-[11px] text-stone-400">{rest.city}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          rest.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {rest.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/20 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Cuisine:</span>
                        <span className="font-semibold">{rest.cuisineTypes.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Total Orders:</span>
                        <span className="font-semibold">{rest.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Revenue:</span>
                        <span className="font-semibold text-emerald-400">${rest.totalRevenue}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {rest.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApproveRestaurant(rest.id)}
                            className="btn-primary flex-1 py-2 text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingRestaurant(rest)}
                            className="btn-secondary flex-1 py-2 text-xs font-bold text-rose-400"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onNavigate(`/restaurants/${rest.id}`)}
                          className="btn-secondary w-full py-2 text-xs font-bold"
                        >
                          Inspect Public Menu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 5: ORDERS & DISPATCH (PRESERVED)                  */}
          {/* ===================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Live Order Dispatch</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Monitor active meal preparations, courier assignments, and reassign dispatch jobs.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((ord, ordIdx) => (
                  <div
                    key={`${ord.id}-${ordIdx}`}
                    className={`p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-display font-extrabold text-base text-orange-400">
                          #{ord.orderNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold">
                        {ord.restaurantName} → {ord.customerName} ({ord.deliveryAddress.street})
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Total: <strong>${ord.total.toFixed(2)}</strong> • Items: {ord.items.length} • Courier:{' '}
                        <span className="text-cyan-400">{ord.riderName || 'Unassigned'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onNavigate(`/track-order/${ord.id}`)}
                        className="btn-secondary px-3 py-2 text-xs font-bold"
                      >
                        Track Live
                      </button>
                      <button
                        onClick={() => setReassigningOrder(ord)}
                        className="btn-primary px-3 py-2 text-xs font-bold"
                      >
                        Reassign Rider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 6: USER MANAGEMENT & ACCOUNTS                     */}
          {/* ===================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Platform User Accounts</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Manage system administrators, fleet couriers, kitchen managers, and customer accounts.
                  </p>
                </div>
                <button
                  onClick={() => setNewUserModalOpen(true)}
                  className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Internal Account</span>
                </button>
              </div>

              {/* Filter */}
              <div
                className={`p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                }`}
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search accounts by name or email..."
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="customer">Customers</option>
                  <option value="rider">Riders</option>
                  <option value="restaurant">Restaurants</option>
                </select>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center text-sm border border-orange-500/20">
                        {u.name.charAt(0)}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : u.role === 'rider'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : u.role === 'restaurant'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{u.name}</h4>
                      <p className="text-xs text-stone-400">{u.email}</p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Registered: {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 7: APPEARANCE & BACKGROUND SETTINGS               */}
          {/* ===================================================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Appearance & Backgrounds</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Customize solid colors, ambient gradients, and custom background images for Dashboard and Login.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetThemeSettings}
                    className="btn-secondary px-4 py-2.5 text-xs font-bold text-rose-400"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={handleSaveThemeSettings}
                    disabled={themeSaving}
                    className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    {themeSaving ? 'Saving...' : 'Apply & Save Settings'}
                  </button>
                </div>
              </div>

              {/* Section Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-inherit pb-3 text-xs font-semibold">
                <button
                  onClick={() => setAppearanceTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    appearanceTab === 'dashboard' ? 'bg-orange-500 text-black font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Dashboard Background
                </button>
                <button
                  onClick={() => setAppearanceTab('login')}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    appearanceTab === 'login' ? 'bg-orange-500 text-black font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Admin Login Background
                </button>
                <button
                  onClick={() => setAppearanceTab('theme')}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    appearanceTab === 'theme' ? 'bg-orange-500 text-black font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Colors & Brand Presets
                </button>
              </div>

              {/* Tab: Dashboard Background */}
              {appearanceTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div
                    className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <h3 className="font-display font-bold text-base">Dashboard Background Style</h3>

                    {/* Mode buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'gradient', 'image'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            const cur = draftTheme.dashboardBackground || { type: 'solid' };
                            handleApplyBackgroundToDraft('dashboard', { ...cur, type: m });
                          }}
                          className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                            draftTheme.dashboardBackground?.type === m
                              ? 'bg-orange-500 text-black'
                              : 'bg-black/30 border border-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Solid Controls */}
                    {draftTheme.dashboardBackground?.type === 'solid' && (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-stone-400 block">Solid Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={draftTheme.dashboardBackground.color || '#0B0B0D'}
                            onChange={(e) =>
                              handleApplyBackgroundToDraft('dashboard', {
                                ...draftTheme.dashboardBackground!,
                                color: e.target.value,
                              })
                            }
                            className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={draftTheme.dashboardBackground.color || '#0B0B0D'}
                            onChange={(e) =>
                              handleApplyBackgroundToDraft('dashboard', {
                                ...draftTheme.dashboardBackground!,
                                color: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white flex-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gradient Controls */}
                    {draftTheme.dashboardBackground?.type === 'gradient' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">Start Color</label>
                            <input
                              type="color"
                              value={draftTheme.dashboardBackground.gradient?.from || '#0B0B0D'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('dashboard', {
                                  ...draftTheme.dashboardBackground!,
                                  gradient: {
                                    direction: 'to-br',
                                    from: e.target.value,
                                    to: draftTheme.dashboardBackground?.gradient?.to || '#1F1206',
                                  },
                                })
                              }
                              className="w-full h-10 rounded-xl bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">End Color</label>
                            <input
                              type="color"
                              value={draftTheme.dashboardBackground.gradient?.to || '#1F1206'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('dashboard', {
                                  ...draftTheme.dashboardBackground!,
                                  gradient: {
                                    direction: 'to-br',
                                    from: draftTheme.dashboardBackground?.gradient?.from || '#0B0B0D',
                                    to: e.target.value,
                                  },
                                })
                              }
                              className="w-full h-10 rounded-xl bg-transparent"
                            />
                          </div>
                        </div>

                        {/* Presets */}
                        <div>
                          <span className="text-[11px] font-semibold text-stone-400 block mb-2">
                            Curated Gradients
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Deep Ember', from: '#0B0B0D', to: '#251205' },
                              { label: 'Midnight Blue', from: '#060B17', to: '#0F1D38' },
                              { label: 'Emerald Vault', from: '#07150E', to: '#0F2F20' },
                            ].map((g) => (
                              <button
                                key={g.label}
                                onClick={() =>
                                  handleApplyBackgroundToDraft('dashboard', {
                                    type: 'gradient',
                                    gradient: { direction: 'to-br', from: g.from, to: g.to },
                                  })
                                }
                                className="p-2 rounded-xl border border-stone-800 text-[11px] font-medium text-stone-300 hover:border-orange-500"
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Controls */}
                    {draftTheme.dashboardBackground?.type === 'image' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-stone-400 block mb-1">
                            Background Image URL
                          </label>
                          <input
                            type="text"
                            value={draftTheme.dashboardBackground.imageUrl || ''}
                            onChange={(e) =>
                              handleApplyBackgroundToDraft('dashboard', {
                                ...draftTheme.dashboardBackground!,
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="Enter image URL or select from Media Library below"
                            className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">Position</label>
                            <select
                              value={draftTheme.dashboardBackground.position || 'center'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('dashboard', {
                                  ...draftTheme.dashboardBackground!,
                                  position: e.target.value as any,
                                })
                              }
                              className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white"
                            >
                              <option value="center">Center</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">Size</label>
                            <select
                              value={draftTheme.dashboardBackground.size || 'cover'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('dashboard', {
                                  ...draftTheme.dashboardBackground!,
                                  size: e.target.value as any,
                                })
                              }
                              className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white"
                            >
                              <option value="cover">Cover (Fill Screen)</option>
                              <option value="contain">Contain</option>
                              <option value="auto">Auto / Tiled</option>
                            </select>
                          </div>
                        </div>

                        {/* Opacity slider */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-stone-400 mb-1">
                            <span>Image Opacity</span>
                            <span>{Math.round((draftTheme.dashboardBackground.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={draftTheme.dashboardBackground.opacity ?? 1}
                            onChange={(e) =>
                              handleApplyBackgroundToDraft('dashboard', {
                                ...draftTheme.dashboardBackground!,
                                opacity: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-orange-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Miniature Preview */}
                  <div
                    className={`p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-bold text-base">Live Miniature Preview</h3>
                      <p className="text-[11px] text-stone-400">Interactive preview of how the dashboard renders</p>
                    </div>

                    <div
                      className="w-full h-64 rounded-2xl border border-stone-700 relative overflow-hidden p-4 flex flex-col justify-between shadow-inner"
                      style={getBackgroundStyle(draftTheme.dashboardBackground)}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white bg-black/40 p-2 rounded-xl backdrop-blur-sm">
                        <span>Nova Hunger Console Preview</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-xl bg-black/50 backdrop-blur-sm text-[10px]">
                          <span className="text-stone-400 block">Customers</span>
                          <span className="font-bold text-orange-400">{customerTotalCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/50 backdrop-blur-sm text-[10px]">
                          <span className="text-stone-400 block">Orders</span>
                          <span className="font-bold text-cyan-400">{orders.length}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/50 backdrop-blur-sm text-[10px]">
                          <span className="text-stone-400 block">Fleet</span>
                          <span className="font-bold text-emerald-400">{riders.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Login Page Background */}
              {appearanceTab === 'login' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div
                    className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <h3 className="font-display font-bold text-base">Admin Login Screen Background</h3>
                    <p className="text-xs text-stone-400">
                      Configure the backdrop administrators see on the sign-in portal.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'gradient', 'image'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            const cur = draftTheme.loginBackground || { type: 'gradient' };
                            handleApplyBackgroundToDraft('login', { ...cur, type: m });
                          }}
                          className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                            draftTheme.loginBackground?.type === m
                              ? 'bg-orange-500 text-black'
                              : 'bg-black/30 border border-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {draftTheme.loginBackground?.type === 'gradient' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">Start Color</label>
                            <input
                              type="color"
                              value={draftTheme.loginBackground.gradient?.from || '#0B0B0D'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('login', {
                                  ...draftTheme.loginBackground!,
                                  gradient: {
                                    direction: 'to-br',
                                    from: e.target.value,
                                    to: draftTheme.loginBackground?.gradient?.to || '#1F1206',
                                  },
                                })
                              }
                              className="w-full h-10 rounded-xl bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-400 block mb-1">End Color</label>
                            <input
                              type="color"
                              value={draftTheme.loginBackground.gradient?.to || '#1F1206'}
                              onChange={(e) =>
                                handleApplyBackgroundToDraft('login', {
                                  ...draftTheme.loginBackground!,
                                  gradient: {
                                    direction: 'to-br',
                                    from: draftTheme.loginBackground?.gradient?.from || '#0B0B0D',
                                    to: e.target.value,
                                  },
                                })
                              }
                              className="w-full h-10 rounded-xl bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Login Preview */}
                  <div
                    className={`p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-bold text-base">Login Page Preview</h3>
                      <p className="text-[11px] text-stone-400">Miniature mockup of administrator login portal</p>
                    </div>

                    <div
                      className="w-full h-64 rounded-2xl border border-stone-700 relative overflow-hidden flex items-center justify-center p-4 shadow-inner"
                      style={getBackgroundStyle(draftTheme.loginBackground)}
                    >
                      <div className="p-4 rounded-2xl bg-black/75 border border-stone-700 backdrop-blur-md w-48 text-center space-y-2">
                        <Shield className="w-5 h-5 text-orange-500 mx-auto" />
                        <span className="font-bold text-[11px] block text-white">Administrator Sign In</span>
                        <div className="h-4 bg-white/10 rounded-lg" />
                        <div className="h-4 bg-white/10 rounded-lg" />
                        <div className="h-5 bg-orange-500 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Theme Presets & Branding */}
              {appearanceTab === 'theme' && (
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-6 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <h3 className="font-display font-bold text-base">Platform Branding & Color Palette</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-400 block mb-1">
                        Application Brand Name
                      </label>
                      <input
                        type="text"
                        value={draftTheme.appName || ''}
                        onChange={(e) => setDraftTheme({ ...draftTheme, appName: e.target.value })}
                        placeholder="Nova Hunger Food"
                        className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-400 block mb-1">
                        Custom Logo Image URL
                      </label>
                      <input
                        type="text"
                        value={draftTheme.logoUrl || ''}
                        onChange={(e) => setDraftTheme({ ...draftTheme, logoUrl: e.target.value })}
                        placeholder="https://... or select from media uploader"
                        className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-stone-400 block mb-2">Preset Color Themes</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => {
                            const updated = {
                              ...draftTheme,
                              ...p.theme,
                              dashboardBackground: draftTheme.dashboardBackground,
                              loginBackground: draftTheme.loginBackground,
                            };
                            setDraftTheme(updated);
                            previewTheme(updated);
                          }}
                          className={`p-3 rounded-2xl border text-left space-y-2 transition-all ${
                            draftTheme.presetName === p.name
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-stone-800 bg-black/20 hover:border-stone-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: p.theme.accentPrimary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: p.theme.bgPrimary }}
                            />
                          </div>
                          <span className="text-xs font-bold block truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 8: MEDIA UPLOADER & ASSET LIBRARY                 */}
          {/* ===================================================== */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Media Uploader & Library</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Upload images for backgrounds, logos, and promotional food dishes. Enforces 5MB limit and secure storage.
                  </p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setUploadDragOver(true);
                }}
                onDragLeave={() => setUploadDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-8 border-2 border-dashed rounded-3xl text-center space-y-3 transition-all ${
                  uploadDragOver
                    ? 'border-orange-500 bg-orange-500/10'
                    : isLight
                    ? 'border-slate-300 bg-white'
                    : 'border-stone-800 bg-[#151518]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Drag & drop your image file here</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Supports PNG, JPG, WebP, GIF, SVG (Maximum file size: 5.0 MB)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary px-4 py-2 text-xs font-bold shadow-md"
                >
                  Browse Device Files
                </button>
              </div>

              {/* Staged File Confirmation Modal / Banner */}
              {stagedFile && (
                <div
                  className={`p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={stagedFile.preview}
                      alt="Preview"
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-700"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{stagedFile.file.name}</h4>
                      <p className="text-xs text-stone-400">
                        {(stagedFile.file.size / 1024).toFixed(1)} KB • {stagedFile.file.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={stagedFile.category}
                      onChange={(e) =>
                        setStagedFile({ ...stagedFile, category: e.target.value as any })
                      }
                      className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="background">Target: Background</option>
                      <option value="logo">Target: Logo</option>
                      <option value="food">Target: Food Dish</option>
                      <option value="general">Target: General</option>
                    </select>
                    <button
                      onClick={() => setStagedFile(null)}
                      className="btn-secondary px-3 py-2 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      disabled={uploadProgress}
                      className="btn-primary px-4 py-2 text-xs font-bold"
                    >
                      {uploadProgress ? 'Uploading...' : 'Save Image'}
                    </button>
                  </div>
                </div>
              )}

              {/* Media Library Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base">Media Library</h3>
                  <select
                    value={mediaCategoryFilter}
                    onChange={(e) => setMediaCategoryFilter(e.target.value)}
                    className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-1.5 text-xs text-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="background">Backgrounds</option>
                    <option value="logo">Logos</option>
                    <option value="food">Food Items</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {mediaList.length === 0 ? (
                  <div
                    className={`p-12 rounded-3xl border text-center space-y-2 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                    }`}
                  >
                    <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
                    <p className="font-bold text-sm">No uploaded images yet</p>
                    <p className="text-xs text-stone-500">
                      Upload background art or logos above to populate your library.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-3xl border shadow-sm space-y-3 group ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                        }`}
                      >
                        <div className="w-full h-36 rounded-2xl bg-black/40 overflow-hidden relative">
                          <img
                            src={item.url}
                            alt={item.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-black/70 text-orange-400 backdrop-blur-sm">
                            {item.category}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-xs truncate" title={item.originalName}>
                            {item.originalName}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {(item.fileSize / 1024).toFixed(1)} KB • {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Quick 1-click apply actions */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-inherit">
                          <button
                            onClick={() => {
                              handleApplyBackgroundToDraft('dashboard', {
                                type: 'image',
                                imageUrl: item.url,
                                size: 'cover',
                                position: 'center',
                                opacity: 1,
                              });
                              showSuccess('Image applied as Dashboard background draft! Click Save in Appearance.');
                            }}
                            className="py-1 text-[10px] font-bold rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black transition-colors"
                          >
                            Set Dashboard BG
                          </button>
                          <button
                            onClick={() => {
                              handleApplyBackgroundToDraft('login', {
                                type: 'image',
                                imageUrl: item.url,
                                size: 'cover',
                                position: 'center',
                                opacity: 1,
                              });
                              showSuccess('Image applied as Login background draft! Click Save in Appearance.');
                            }}
                            className="py-1 text-[10px] font-bold rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors"
                          >
                            Set Login BG
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.url);
                              showSuccess('Image URL copied to clipboard!');
                            }}
                            className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className="text-stone-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 9: AUDIT LOGS (PRESERVED)                         */}
          {/* ===================================================== */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">System Audit Trail</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Immutable administrative action logs and platform security event stream.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-3xl border shadow-sm ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                }`}
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs by action, administrator, or target..."
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {logs
                  .filter(
                    (l) =>
                      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.adminEmail.toLowerCase().includes(logSearch.toLowerCase())
                  )
                  .map((l) => (
                    <div
                      key={l.id}
                      className={`p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-400">{l.action}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-stone-800 text-stone-300">
                            {l.targetType}
                          </span>
                        </div>
                        <p className="text-stone-300">{l.details}</p>
                      </div>
                      <div className="text-[11px] text-stone-400 shrink-0 text-right">
                        <div>{l.adminEmail}</div>
                        <div>{new Date(l.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 10: SECURITY & ADMIN PROFILE                      */}
          {/* ===================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Security & Administrator Profile</h1>
                  <p className="text-xs text-stone-400 mt-1">
                    Update console credentials, session diagnostics, and security controls.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Change Password Form */}
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm">Update Password</h3>
                      <p className="text-[11px] text-stone-400">Ensure password has at least 6 characters</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Current Master Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordChangeLoading}
                      className="btn-primary w-full py-2.5 text-xs font-bold mt-2"
                    >
                      {passwordChangeLoading ? 'Verifying & Updating...' : 'Save New Password'}
                    </button>
                  </form>
                </div>

                {/* Session Diagnostics */}
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm">Session Diagnostics</h3>
                      <p className="text-[11px] text-stone-400">Authenticated Token & Security Parameters</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/20 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Master Account:</span>
                      <span className="font-semibold text-white">{user?.email || 'admin@novahunger.com'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Security Clearance:</span>
                      <span className="font-semibold text-emerald-400">Level 1 Administrator</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Session Mode:</span>
                      <span className="font-semibold text-orange-400">Bearer Token Verified</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Token Status:</span>
                      <span className="font-semibold text-emerald-400">Active</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      onNavigate('/admin/login');
                    }}
                    className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition-colors"
                  >
                    Terminate Current Admin Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: INSPECT CUSTOMER PROFILE                         */}
      {/* ========================================================= */}
      {inspectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-2xl border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-4 border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 font-extrabold flex items-center justify-center text-lg border border-orange-500/20">
                  {inspectingCustomer.customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{inspectingCustomer.customer.name}</h3>
                  <p className="text-xs text-stone-400">{inspectingCustomer.customer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCustomer(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-black/20">
                <span className="text-[11px] text-stone-400 block">Total Orders</span>
                <span className="font-extrabold text-lg text-orange-400">
                  {inspectingCustomer.orders.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/20">
                <span className="text-[11px] text-stone-400 block">Lifetime Spend</span>
                <span className="font-extrabold text-lg text-emerald-400">
                  ${inspectingCustomer.customer.totalSpent?.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/20">
                <span className="text-[11px] text-stone-400 block">Status</span>
                <span className="font-bold capitalize text-cyan-400">
                  {inspectingCustomer.customer.status || 'active'}
                </span>
              </div>
            </div>

            {/* Past Orders */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500">
                Recent Order History ({inspectingCustomer.orders.length})
              </h4>
              {inspectingCustomer.orders.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No past orders placed yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inspectingCustomer.orders.map((o, oIdx) => (
                    <div
                      key={`${o.id}-${oIdx}`}
                      className="p-3 rounded-xl bg-black/20 border border-stone-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-orange-400">#{o.orderNumber}</span> • {o.restaurantName}
                        <div className="text-[10px] text-stone-400">
                          {new Date(o.createdAt).toLocaleString()} • {o.items.length} items
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400">${o.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500">
                Saved Delivery Addresses ({inspectingCustomer.savedAddresses.length})
              </h4>
              {inspectingCustomer.savedAddresses.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No addresses saved.</p>
              ) : (
                <div className="space-y-1.5">
                  {inspectingCustomer.savedAddresses.map((a: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-black/20 text-xs flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div>
                        <strong>{a.label || 'Address'}:</strong> {a.street}, {a.city} {a.postalCode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT CUSTOMER INFO                               */}
      {/* ========================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="font-display font-bold text-base">Edit Customer Record</h3>
              <button onClick={() => setEditingCustomer(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Account Status</label>
                <select
                  value={editingCustomer.status || 'active'}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, status: e.target.value as any })
                  }
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="btn-secondary flex-1 py-2 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2 font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CUSTOMER CONFIRMATION                     */}
      {/* ========================================================= */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-base">Delete Customer Account?</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Are you sure you want to delete the account for <strong>{deletingCustomer.name}</strong> (
                {deletingCustomer.email})? This action is permanent and recorded in the audit trail.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold flex-1 py-2.5 text-xs rounded-xl transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CREATE INTERNAL USER                             */}
      {/* ========================================================= */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="font-display font-bold text-base">Create Internal User</h3>
              <button onClick={() => setNewUserModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                >
                  <option value="customer">Customer</option>
                  <option value="rider">Rider / Courier</option>
                  <option value="restaurant">Restaurant Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="btn-secondary flex-1 py-2 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2 font-bold">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: REASSIGN ORDER COURIER                           */}
      {/* ========================================================= */}
      {reassigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="font-display font-bold text-base">
                Reassign Order #{reassigningOrder.orderNumber}
              </h3>
              <button onClick={() => setReassigningOrder(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleReassignOrder} className="space-y-4 text-xs">
              <p className="text-stone-400">
                Select an approved courier to take over delivery from {reassigningOrder.restaurantName}.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Assign to Courier
                </label>
                <select
                  required
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="">Select courier...</option>
                  {riders
                    .filter((r) => r.status === 'approved')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName} ({r.city} • {r.vehicleType})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassigningOrder(null)}
                  className="btn-secondary flex-1 py-2 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2 font-bold">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: REJECT RIDER WITH REASON                         */}
      {/* ========================================================= */}
      {rejectingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <h3 className="font-display font-bold text-base">Reject Courier Application</h3>
            <form onSubmit={handleRejectRider} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Specific Rejection Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Driver's license documentation was illegible or vehicle registration has expired."
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl p-3 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRider(null)}
                  className="btn-secondary flex-1 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold flex-1 py-2 rounded-xl"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: REJECT RESTAURANT WITH REASON                    */}
      {/* ========================================================= */}
      {rejectingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
            }`}
          >
            <h3 className="font-display font-bold text-base">Reject Restaurant Application</h3>
            <form onSubmit={handleRejectRestaurant} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={restaurantRejectionReason}
                  onChange={(e) => setRestaurantRejectionReason(e.target.value)}
                  placeholder="e.g. Commercial food license verification failed."
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl p-3 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRestaurant(null)}
                  className="btn-secondary flex-1 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold flex-1 py-2 rounded-xl"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
