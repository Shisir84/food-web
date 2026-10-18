import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
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
} from '../types/index.ts';

interface AdminDashboardViewProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { theme, previewTheme, saveTheme, resetDefault, presets } = useTheme();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState<'riders' | 'restaurants' | 'orders' | 'logs' | 'appearance'>('riders');
  const [draftTheme, setDraftTheme] = useState<ThemeSettings>(theme);
  const [themeSaveLoading, setThemeSaveLoading] = useState(false);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string | null>(null);
  const [themeErrorMsg, setThemeErrorMsg] = useState<string | null>(null);

  // Riders state
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [riderFilterStatus, setRiderFilterStatus] = useState<string>('all');
  const [riderSearch, setRiderSearch] = useState('');
  const [rejectingRider, setRejectingRider] = useState<RiderProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectingRider, setInspectingRider] = useState<RiderProfile | null>(null);

  // Restaurants state
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [rejectingRestaurant, setRejectingRestaurant] = useState<RestaurantProfile | null>(null);
  const [restaurantRejectionReason, setRestaurantRejectionReason] = useState('');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Logs state
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAllAdminData = async () => {
    try {
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
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [riderFilterStatus, riderSearch]);

  const handleApproveRider = async (riderId: string) => {
    try {
      await api.approveRider(riderId);
      setActionNotice('Rider application approved! Access granted to rider dashboard.');
      setTimeout(() => setActionNotice(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve rider');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleRejectRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRider || !rejectionReason.trim()) return;

    try {
      await api.rejectRider(rejectingRider.id, rejectionReason.trim());
      setActionNotice(`Rider ${rejectingRider.fullName} has been rejected with recorded reason.`);
      setRejectingRider(null);
      setRejectionReason('');
      setTimeout(() => setActionNotice(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject rider');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleSuspendRider = async (riderId: string, suspend: boolean) => {
    try {
      await api.suspendRider(riderId, suspend);
      setActionNotice(`Rider has been ${suspend ? 'suspended' : 'reactivated'}.`);
      setTimeout(() => setActionNotice(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleApproveRestaurant = async (restId: string) => {
    try {
      await api.approveRestaurant(restId);
      setActionNotice('Restaurant application approved! Live menu enabled.');
      setTimeout(() => setActionNotice(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve restaurant');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleRejectRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRestaurant || !restaurantRejectionReason.trim()) return;

    try {
      await api.rejectRestaurant(rejectingRestaurant.id, restaurantRejectionReason.trim());
      setActionNotice(`Restaurant ${rejectingRestaurant.name} rejected.`);
      setRejectingRestaurant(null);
      setRestaurantRejectionReason('');
      setTimeout(() => setActionNotice(null), 3000);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject restaurant');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">Nova Master Admin</h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                Full Authorization
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Platform governance, rider identity vetting, kitchen approvals, and order dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={loadAllAdminData}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-xs font-semibold text-stone-200 transition-colors shrink-0"
        >
          <RotateCw className="w-3.5 h-3.5 text-orange-400" />
          <span>Refresh Records</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">Pending Riders</span>
            <div className="font-display text-xl font-extrabold text-amber-400 tabular-nums">
              {stats.pendingRiders}
            </div>
            <span className="text-[10px] text-stone-500">Requires review</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">Approved Riders</span>
            <div className="font-display text-xl font-extrabold text-emerald-400 tabular-nums">
              {stats.approvedRiders}
            </div>
            <span className="text-[10px] text-stone-500">Active fleet</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">Pending Kitchens</span>
            <div className="font-display text-xl font-extrabold text-amber-400 tabular-nums">
              {stats.pendingRestaurants}
            </div>
            <span className="text-[10px] text-stone-500">Awaiting audit</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">Active Deliveries</span>
            <div className="font-display text-xl font-extrabold text-cyan-400 tabular-nums">
              {stats.activeDeliveries}
            </div>
            <span className="text-[10px] text-stone-500">En route</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">GMV Revenue</span>
            <div className="font-display text-xl font-extrabold text-white tabular-nums">
              ${stats.grossMerchandiseValue.toFixed(2)}
            </div>
            <span className="text-[10px] text-stone-500">Total volume</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
            <span className="text-[11px] text-stone-400 font-medium">Platform Take (15%)</span>
            <div className="font-display text-xl font-extrabold text-orange-400 tabular-nums">
              ${stats.platformCommission.toFixed(2)}
            </div>
            <span className="text-[10px] text-stone-500">Net commission</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('riders')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'riders' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Rider Applications & Fleet ({riders.length})
          {activeTab === 'riders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'restaurants' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Restaurant Partners ({restaurants.length})
          {activeTab === 'restaurants' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'orders' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Orders & Dispatch ({orders.length})
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'logs' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Audit Logs ({logs.length})
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('appearance');
            setDraftTheme(theme);
          }}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'appearance' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Appearance & Theme Settings
          {activeTab === 'appearance' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {/* TAB 1: RIDER APPLICATIONS & MANAGEMENT (CRITICAL WORKFLOW) */}
      {activeTab === 'riders' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setRiderFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    riderFilterStatus === status
                      ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={riderSearch}
                onChange={(e) => setRiderSearch(e.target.value)}
                placeholder="Search riders by name/city..."
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Rider Table */}
          <div className="rounded-2xl border border-stone-800 overflow-hidden bg-[#121316]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Vehicle & License</th>
                    <th className="py-3 px-4">City / Area</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Performance</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80 text-stone-300">
                  {riders.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="text-stone-100 block">{r.fullName}</strong>
                        <span className="text-[11px] text-stone-400">{r.email}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium block">
                          {r.vehicleType} ({r.vehicleRegNumber})
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Lic: {r.licenseNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span>{r.city}</span>
                        <span className="text-[11px] text-stone-500 block truncate max-w-[140px]">
                          {r.deliveryArea}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : r.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : r.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-stone-700 text-stone-300'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.rejectionReason && (
                          <span
                            className="block text-[10px] text-rose-400 mt-1 truncate max-w-[150px]"
                            title={r.rejectionReason}
                          >
                            Reason: {r.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 tabular-nums">
                        <span>{r.totalDeliveries} orders</span>
                        <span className="text-amber-400 block text-[11px] font-semibold">
                          {r.rating.toFixed(1)} ★
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingRider(r)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                            title="Inspect Documents"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRider(r.id)}
                                className="px-3 py-1 text-[11px] font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingRider(r);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1 text-[11px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/40 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {r.status === 'approved' && (
                            <button
                              onClick={() => handleSuspendRider(r.id, true)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-stone-400 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                            >
                              Suspend
                            </button>
                          )}

                          {r.status === 'suspended' && (
                            <button
                              onClick={() => handleSuspendRider(r.id, false)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 rounded-lg hover:bg-emerald-500 hover:text-black transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESTAURANTS */}
      {activeTab === 'restaurants' && (
        <div className="rounded-2xl border border-stone-800 overflow-hidden bg-[#121316]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Address & City</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 text-stone-300">
                {restaurants.map((rest) => (
                  <tr key={rest.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-stone-100 block">{rest.name}</strong>
                      <span className="text-[11px] text-stone-500">{rest.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span>{rest.address}</span>
                      <span className="text-[11px] text-stone-500 block">{rest.city}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rest.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {rest.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold tabular-nums">
                      ${rest.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rest.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveRestaurant(rest.id)}
                            className="px-3 py-1 text-[11px] font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-400"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingRestaurant(rest);
                              setRestaurantRejectionReason('');
                            }}
                            className="px-3 py-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 rounded-lg hover:bg-rose-500 hover:text-white"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-stone-800 overflow-hidden bg-[#121316]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Kitchen</th>
                  <th className="py-3 px-4">Assigned Rider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Live Tracker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 text-stone-300">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-200">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span>{ord.customerName}</span>
                      <span className="text-[11px] text-stone-500 block">{ord.customerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">{ord.restaurantName}</td>
                    <td className="py-3.5 px-4">
                      {ord.riderName ? (
                        <span className="text-cyan-400 font-medium">{ord.riderName}</span>
                      ) : (
                        <span className="text-stone-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] font-bold uppercase">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold tabular-nums text-orange-400">
                      ${ord.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate(`/track-order/${ord.id}`)}
                        className="px-3 py-1 text-[11px] font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-stone-800 overflow-hidden bg-[#121316]">
          <div className="divide-y divide-stone-800/80 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-800 font-mono text-[10px] text-orange-400 font-bold">
                      {log.action}
                    </span>
                    <span className="text-stone-500 text-[11px]">by {log.adminEmail}</span>
                  </div>
                  <p className="text-stone-200 mt-1">{log.details}</p>
                </div>
                <span className="text-[11px] text-stone-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: APPEARANCE & THEME SETTINGS */}
      {activeTab === 'appearance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-6 rounded-3xl bg-[#151518] border border-[#2B2B30] space-y-2">
            <h2 className="font-display text-xl font-bold text-white">Appearance & Theme Settings</h2>
            <p className="text-xs text-[#B8B8C0] max-w-2xl leading-relaxed">
              Customize the global design system for Nova Hunger Food. Changes are previewed live on your screen and saved to the backend database to apply for all visitors and portal users.
            </p>
          </div>

          {themeSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{themeSuccessMsg}</span>
            </div>
          )}

          {themeErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{themeErrorMsg}</span>
            </div>
          )}

          {/* Theme Presets */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white">Curated Theme Presets</h3>
              <p className="text-xs text-[#B8B8C0]">
                Select a predefined color harmony to instantly preview the look and feel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {presets.map((preset) => {
                const isSelected = draftTheme.presetName === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setDraftTheme(preset.theme);
                      previewTheme(preset.theme);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-[#FF7900] ring-2 ring-[#FF7900]/30 bg-[#151518]'
                        : 'border-[#2B2B30] bg-[#121316] hover:border-[#2B2B30]/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{preset.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF7900]" />}
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.theme.bgPrimary }}
                        title="Main Background"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.theme.bgSecondary }}
                        title="Secondary Background"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.theme.accentPrimary }}
                        title="Accent Primary"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.theme.accentHighlight }}
                        title="Accent Highlight"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Customization Inputs & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Color Controls */}
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[#151518] border border-[#2B2B30] space-y-5">
              <h3 className="font-bold text-sm text-white pb-2 border-b border-[#2B2B30]">
                Individual Color Properties
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Main Website Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Main Website Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.bgPrimary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgPrimary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.bgPrimary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgPrimary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 2. Dashboard / Secondary Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Secondary / Dashboard Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.bgSecondary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgSecondary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.bgSecondary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgSecondary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 3. Card & Panel Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Card & Panel Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.bgCard}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgCard: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.bgCard}
                      onChange={(e) => {
                        const updated = { ...draftTheme, bgCard: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 4. Primary Accent Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.accentPrimary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, accentPrimary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.accentPrimary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, accentPrimary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 5. Highlight Accent Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Highlight / Gradient Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.accentHighlight}
                      onChange={(e) => {
                        const updated = { ...draftTheme, accentHighlight: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.accentHighlight}
                      onChange={(e) => {
                        const updated = { ...draftTheme, accentHighlight: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 6. Border Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Border & Divider Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.borderColor}
                      onChange={(e) => {
                        const updated = { ...draftTheme, borderColor: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.borderColor}
                      onChange={(e) => {
                        const updated = { ...draftTheme, borderColor: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 7. Main Text Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Main Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.textMain}
                      onChange={(e) => {
                        const updated = { ...draftTheme, textMain: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.textMain}
                      onChange={(e) => {
                        const updated = { ...draftTheme, textMain: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {/* 8. Secondary Text Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block">
                    Secondary Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftTheme.textSecondary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, textSecondary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={draftTheme.textSecondary}
                      onChange={(e) => {
                        const updated = { ...draftTheme, textSecondary: e.target.value, presetName: 'Custom' };
                        setDraftTheme(updated);
                        previewTheme(updated);
                      }}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Reset to Default and Save Theme */}
              <div className="pt-6 border-t border-[#2B2B30] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    await resetDefault();
                    setDraftTheme(presets[0].theme);
                    setThemeSuccessMsg('Reset to default Midnight Orange theme!');
                    setTimeout(() => setThemeSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#B8B8C0] hover:text-white bg-[#0B0B0D] border border-[#2B2B30] rounded-xl hover:border-[#FF7900] transition-colors"
                >
                  Reset to Default
                </button>

                <button
                  type="button"
                  disabled={themeSaveLoading}
                  onClick={async () => {
                    setThemeSaveLoading(true);
                    setThemeErrorMsg(null);
                    setThemeSuccessMsg(null);
                    try {
                      await saveTheme(draftTheme);
                      setThemeSuccessMsg('Theme settings successfully saved and applied platform-wide!');
                      setTimeout(() => setThemeSuccessMsg(null), 3500);
                    } catch (e: any) {
                      setThemeErrorMsg(e.message || 'Failed to save theme settings.');
                    } finally {
                      setThemeSaveLoading(false);
                    }
                  }}
                  className="btn-primary px-6 py-2.5 text-xs font-bold shadow-lg shadow-[#FF7900]/20 flex items-center gap-2"
                >
                  <span>{themeSaveLoading ? 'Saving Theme...' : 'Save & Publish Theme'}</span>
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Live Preview Component */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-bold text-sm text-white">Live Theme Preview</h3>

              {/* Simulated Card Preview with Draft Theme Values */}
              <div
                className="p-6 rounded-3xl border shadow-2xl space-y-4 transition-all duration-300"
                style={{
                  backgroundColor: draftTheme.bgCard,
                  borderColor: draftTheme.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs uppercase font-bold tracking-wider"
                    style={{ color: draftTheme.accentPrimary }}
                  >
                    Nova Hunger Food
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: `${draftTheme.accentPrimary}25`,
                      color: draftTheme.accentHighlight,
                    }}
                  >
                    Live Preview
                  </span>
                </div>

                <h4
                  className="font-display text-lg font-bold"
                  style={{ color: draftTheme.textMain }}
                >
                  Your Cravings, Delivered.
                </h4>

                <p
                  className="text-xs leading-relaxed"
                  style={{ color: draftTheme.textSecondary }}
                >
                  This live preview box reflects the selected color variables before you commit and save them.
                </p>

                <div
                  className="p-3 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: draftTheme.bgPrimary,
                    borderColor: draftTheme.borderColor,
                    color: draftTheme.textMain,
                  }}
                >
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums" style={{ color: draftTheme.accentPrimary }}>
                    $34.50
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition-transform hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${draftTheme.accentPrimary}, ${draftTheme.accentHighlight})`,
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-colors"
                    style={{
                      backgroundColor: draftTheme.bgPrimary,
                      borderColor: draftTheme.borderColor,
                      color: draftTheme.textMain,
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL (MANDATORY REQUIREMENT) */}
      {rejectingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121316] border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">
              Reject Application for {rejectingRider.fullName}
            </h3>
            <p className="text-xs text-stone-400">
              A formal rejection reason is strictly required by the safety governance protocol. This explanation will be displayed directly to the applicant.
            </p>

            <form onSubmit={handleRejectRider} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Driver license image is illegible; expired vehicle registration..."
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setRejectingRider(null)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-500 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT INSPECTION MODAL */}
      {inspectingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121316] border border-stone-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-white">
                Rider Documentation Dossier
              </h3>
              <button
                onClick={() => setInspectingRider(null)}
                className="text-stone-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-stone-300">
                <div>
                  <span className="text-stone-500 block text-[11px]">Applicant:</span>
                  <span className="font-bold">{inspectingRider.fullName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Phone:</span>
                  <span>{inspectingRider.phone}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Vehicle Type:</span>
                  <span className="capitalize">{inspectingRider.vehicleType}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Registration No:</span>
                  <span className="font-mono">{inspectingRider.vehicleRegNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Driver's License / ID:</span>
                  <span className="font-mono">{inspectingRider.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Assigned City:</span>
                  <span>{inspectingRider.city}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-stone-700 bg-[#18191E] flex items-center gap-3">
              <FileText className="w-6 h-6 text-orange-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-stone-200 block">
                  Govt Identification Verification File
                </span>
                <span className="text-stone-500 text-[11px]">
                  Uploaded ID verified through secure channel ({inspectingRider.idDocumentUrl})
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingRider(null)}
                className="px-4 py-2 text-xs font-semibold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
