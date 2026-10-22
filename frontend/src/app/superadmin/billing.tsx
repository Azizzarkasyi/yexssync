import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Layers,
  PieChart,
  Building2,
  Users,
  CreditCard,
  Headphones,
  Server,
  Sliders,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  LogOut,
  Menu,
  X,
  Coins,
  FileText,
  Clock,
  Download,
  Pen,
  FileDown,
  Sun,
  Moon,
  Settings,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SuperAdminTopHeader from '@/components/SuperAdminTopHeader';
import api from '@/lib/api';

// Interfaces
interface PlanData {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  period: string;
  activeTenants: number;
  maxUsers: string;
  isPopular?: boolean;
}

interface BillingItem {
  id: number;
  tenantId: number;
  month: number;
  year: number;
  amount: number;
  userCount: number;
  costPerUser: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  dueDate?: string | null;
  gracePeriodDays?: number | null;
  deadlineDate?: string | null;
  isOverdue?: boolean;
  isInGrace?: boolean;
  isBlocked?: boolean;
  daysLeftInGrace?: number;
  daysOverdue?: number;
  paymentProof?: string | null;
  paidAt?: string | null;
  createdAt: string;
  tenant?: {
    id: number;
    name: string;
    slug: string;
    plan?: string | null;
    customGracePeriodDays?: number | null;
  };
}

interface BillingSettings {
  defaultGracePeriodDays: number;
  billingDueDay: number;
  blockAttendanceOnOverdue: boolean;
  costPerUser: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
}

const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 'Rp 500k',
    priceNum: 500000,
    period: '/bulan',
    activeTenants: 0,
    maxUsers: 'Maks 20 User',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 'Rp 1.5M',
    priceNum: 1500000,
    period: '/bulan',
    activeTenants: 0,
    maxUsers: 'Maks 100 User',
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 'Custom',
    priceNum: 5000000,
    period: '/bulan',
    activeTenants: 0,
    maxUsers: 'Tak Terbatas (Unlimited)',
  },
];

export default function SuperAdminBillingScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'grace' | 'blocked'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_PLANS);
  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [isLoadingBillings, setIsLoadingBillings] = useState(false);

  // Settings
  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    defaultGracePeriodDays: 3,
    billingDueDay: 1,
    blockAttendanceOnOverdue: true,
    costPerUser: 10000,
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  });
  const [tempSettings, setTempSettings] = useState<BillingSettings>({
    defaultGracePeriodDays: 3,
    billingDueDay: 1,
    blockAttendanceOnOverdue: true,
    costPerUser: 10000,
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState<number | null>(null);

  // Tenant Grace Period Modal
  const [showTenantGraceModal, setShowTenantGraceModal] = useState(false);
  const [selectedTenantGrace, setSelectedTenantGrace] = useState<{
    id: number;
    name: string;
    customGracePeriodDays: number | null;
  } | null>(null);
  const [tenantGraceDaysInput, setTenantGraceDaysInput] = useState('');

  // Invoice Detail Modal
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingItem | null>(null);

  // Plan Edit Modal
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMaxUsers, setEditMaxUsers] = useState('');

  const fetchBillingsData = async () => {
    setIsLoadingBillings(true);
    try {
      const res = await api.get('/super-admin/billings');
      if (res.data?.success) {
        const rawList: BillingItem[] = res.data.data || [];
        setBillings(rawList);
        if (res.data.settings) {
          setBillingSettings(res.data.settings);
          setTempSettings(res.data.settings);
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch billings:', err);
    } finally {
      setIsLoadingBillings(false);
    }
  };

  const fetchTenantPlans = async () => {
    try {
      const res = await api.get('/super-admin/tenants');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const tenantsList = res.data.data;
        let basic = 0;
        let pro = 0;
        let ent = 0;
        tenantsList.forEach((t: any) => {
          const p = (t.plan || '').toLowerCase();
          if (p.includes('pro')) pro++;
          else if (p.includes('enter')) ent++;
          else basic++;
        });
        setPlans((prev) =>
          prev.map((item) => {
            if (item.id === 'basic') return { ...item, activeTenants: basic };
            if (item.id === 'pro') return { ...item, activeTenants: pro };
            if (item.id === 'enterprise') return { ...item, activeTenants: ent };
            return item;
          })
        );
      }
    } catch {
      // Silent fallback
    }
  };

  useEffect(() => {
    fetchTenantPlans();
    fetchBillingsData();
  }, []);

  // Metrics
  const totalMRR = billings
    .filter((b) => b.status === 'PAID')
    .reduce((acc, b) => acc + (b.amount || 0), 0);

  const pendingBillings = billings.filter((b) => b.status === 'PENDING');
  const pendingTotal = pendingBillings.reduce((acc, b) => acc + (b.amount || 0), 0);
  const graceCount = billings.filter((b) => b.status === 'PENDING' && b.isInGrace).length;
  const blockedCount = billings.filter((b) => b.status === 'PENDING' && b.isBlocked).length;

  const formatRupiah = (amount: number) => {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
  };

  const formatDateIndo = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatInvoiceNumber = (b: BillingItem) => {
    const padId = String(b.id).padStart(4, '0');
    const month = String(b.month).padStart(2, '0');
    return `INV/${b.year}/${month}/${padId}`;
  };

  const handleOpenEditPlan = (plan: PlanData) => {
    setSelectedPlan(plan);
    setEditPrice(plan.price);
    setEditMaxUsers(plan.maxUsers);
    setShowEditPlanModal(true);
  };

  const handleSavePlan = () => {
    if (!selectedPlan) return;
    setPlans(
      plans.map((p) =>
        p.id === selectedPlan.id
          ? { ...p, price: editPrice, maxUsers: editMaxUsers }
          : p
      )
    );
    setShowEditPlanModal(false);
  };

  const handleOpenSettings = () => {
    setTempSettings({ ...billingSettings });
    setShowSettingsModal(true);
  };

  const handleSaveBillingSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await api.put('/super-admin/billing-settings', tempSettings);
      if (res.data?.success) {
        setBillingSettings(res.data.data);
        setShowSettingsModal(false);
        if (Platform.OS === 'web') {
          window.alert('Pengaturan masa tenggat dan penagihan berhasil disimpan!');
        }
        fetchBillingsData();
      }
    } catch (err: any) {
      showError('Gagal Menyimpan', err.response?.data?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenTenantGrace = (b: BillingItem) => {
    if (!b.tenant) return;
    setSelectedTenantGrace({
      id: b.tenant.id,
      name: b.tenant.name,
      customGracePeriodDays: b.tenant.customGracePeriodDays ?? null,
    });
    setTenantGraceDaysInput(
      b.tenant.customGracePeriodDays !== null && b.tenant.customGracePeriodDays !== undefined
        ? String(b.tenant.customGracePeriodDays)
        : ''
    );
    setShowTenantGraceModal(true);
  };

  const handleSaveTenantGrace = async () => {
    if (!selectedTenantGrace) return;
    setIsSavingSettings(true);
    try {
      const parsed = tenantGraceDaysInput.trim() === '' ? null : parseInt(tenantGraceDaysInput, 10);
      const res = await api.put(`/super-admin/tenants/${selectedTenantGrace.id}/grace-period`, {
        customGracePeriodDays: parsed,
      });
      if (res.data?.success) {
        setShowTenantGraceModal(false);
        if (Platform.OS === 'web') {
          window.alert(`Masa tenggat khusus untuk ${selectedTenantGrace.name} berhasil diperbarui!`);
        }
        fetchBillingsData();
      }
    } catch (err: any) {
      showError('Gagal Menyimpan', err.response?.data?.message || 'Gagal memperbarui masa tenggat tenant.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleGenerateBillings = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/super-admin/billings/generate');
      if (res.data?.success) {
        if (Platform.OS === 'web') {
          window.alert(res.data.message || 'Tagihan bulan ini berhasil diproses untuk seluruh tenant.');
        }
        fetchBillingsData();
      }
    } catch (err: any) {
      showError('Gagal Generate', err.response?.data?.message || 'Gagal membuat tagihan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveBilling = async (id: number) => {
    const ok = Platform.OS === 'web'
      ? window.confirm('Apakah Anda yakin ingin memverifikasi pembayaran ini? Seluruh pemblokiran absensi tenant akan langsung dibuka.')
      : true;
    if (!ok) return;

    setIsApprovingId(id);
    try {
      const res = await api.post(`/super-admin/billings/${id}/approve`);
      if (res.data?.success) {
        if (Platform.OS === 'web') {
          window.alert('Pembayaran berhasil disetujui! Status tagihan kini LUNAS dan akses absensi aktif.');
        }
        setShowInvoiceDetailModal(false);
        fetchBillingsData();
      }
    } catch (err: any) {
      showError('Gagal Verifikasi', err.response?.data?.message || 'Gagal menyetujui pembayaran.');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleExportCSV = () => {
    try {
      const header = 'No. Invoice,Perusahaan,Bulan/Tahun,User Aktif,Total Tagihan,Jatuh Tempo,Batas Tenggat,Status\n';
      const rows = filteredBillings
        .map((b) => {
          const invNo = formatInvoiceNumber(b);
          const tenantName = b.tenant?.name || `Tenant #${b.tenantId}`;
          const period = `${b.month}/${b.year}`;
          const statusText = b.status === 'PAID' ? 'LUNAS' : b.isBlocked ? 'TERBLOKIR' : b.isInGrace ? 'MASA TENGGAT' : 'PENDING';
          return `"${invNo}","${tenantName}","${period}","${b.userCount}","${b.amount}","${formatDateIndo(b.dueDate)}","${formatDateIndo(b.deadlineDate)}","${statusText}"`;
        })
        .join('\n');
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI(header + rows);

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Tagihan_YexsSync_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Fitur ekspor CSV diaktifkan di platform web.');
      }
    } catch (err: any) {
      showError('Ekspor Gagal', 'Gagal mengunduh CSV: ' + (err?.message || 'Terjadi kesalahan sistem.'));
    }
  };

  const filteredBillings = billings.filter((b) => {
    const invNo = formatInvoiceNumber(b).toLowerCase();
    const tName = (b.tenant?.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' || invNo.includes(q) || tName.includes(q);

    let matchesStatus = true;
    if (statusFilter === 'paid') matchesStatus = b.status === 'PAID';
    else if (statusFilter === 'pending') matchesStatus = b.status === 'PENDING' && !b.isInGrace && !b.isBlocked;
    else if (statusFilter === 'grace') matchesStatus = b.status === 'PENDING' && !!b.isInGrace;
    else if (statusFilter === 'blocked') matchesStatus = b.status === 'PENDING' && !!b.isBlocked;

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bg, overflow: 'hidden' }}>
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/billing"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 25, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Top Header */}
        <SuperAdminTopHeader
          title="Paket & Tagihan Langganan"
          isDesktop={isDesktop}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Financial & Status Metrics */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Card 1: Total Penerimaan */}
          <View
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.cardBg,
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6, fontWeight: '500' }}>
                Total Diterima (Lunas)
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>{formatRupiah(totalMRR)}</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: theme.successBg, justifyContent: 'center', alignItems: 'center' }}>
              <Coins size={22} color={theme.successText} />
            </View>
          </View>

          {/* Card 2: Menunggu Pembayaran */}
          <View
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.cardBg,
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6, fontWeight: '500' }}>
                Menunggu Pembayaran
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>{formatRupiah(pendingTotal)}</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{pendingBillings.length} tagihan pending</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: theme.infoBg, justifyContent: 'center', alignItems: 'center' }}>
              <Clock size={22} color={theme.infoText} />
            </View>
          </View>

          {/* Card 3: Dalam Masa Tenggat */}
          <View
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.cardBg,
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6, fontWeight: '500' }}>
                Dalam Masa Tenggat
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.warningText }}>{graceCount} Tenant</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Peringatan aktif sebelum blokir</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: theme.warningBg, justifyContent: 'center', alignItems: 'center' }}>
              <Clock size={22} color={theme.warningText} />
            </View>
          </View>

          {/* Card 4: Terblokir Otomatis */}
          <View
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.cardBg,
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6, fontWeight: '500' }}>
                Absensi Terblokir (Overdue)
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.dangerText }}>{blockedCount} Tenant</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Lewat batas masa tenggat</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: theme.dangerBg, justifyContent: 'center', alignItems: 'center' }}>
              <ShieldAlert size={22} color={theme.dangerText} />
            </View>
          </View>
        </View>

        {/* Manajemen Paket Harga */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {plans.map((plan) => {
            const isPopular = plan.isPopular;
            return (
              <View
                key={plan.id}
                style={{
                  flex: 1,
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  padding: 22,
                  borderWidth: isPopular ? 2 : 1,
                  borderColor: isPopular ? theme.accent : theme.border,
                  position: 'relative',
                }}
              >
                {isPopular && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      alignSelf: 'center',
                      backgroundColor: theme.accent,
                      paddingVertical: 3,
                      paddingHorizontal: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                      Paling Populer
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    alignItems: 'center',
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    {plan.name}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                    {plan.price}
                    <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '400' }}>{plan.period}</Text>
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Pelanggan Aktif:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{plan.activeTenants} Tenant</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Batas Pengguna:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{plan.maxUsers}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleOpenEditPlan(plan)}
                  style={{
                    width: '100%',
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Pen size={13} color={theme.text} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                    Edit {plan.name.replace(' Plan', '')}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Action Bar: Pengaturan Masa Tenggat & Generate */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 18,
            marginBottom: 20,
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'center' : 'flex-start',
            gap: 14,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: theme.subtleBg, alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={22} color={theme.accent} />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                Aturan Masa Tenggat & Rekening Bank Resmi
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                Jatuh Tempo: Setiap tanggal <Text style={{ fontWeight: '700', color: theme.text }}>{billingSettings.billingDueDay}</Text> • Masa Tenggat Default: <Text style={{ fontWeight: '700', color: theme.text }}>{billingSettings.defaultGracePeriodDays} Hari</Text> • Blokir Absensi: <Text style={{ fontWeight: '700', color: billingSettings.blockAttendanceOnOverdue ? theme.dangerText : theme.textMuted }}>{billingSettings.blockAttendanceOnOverdue ? 'AKTIF (Otomatis)' : 'NONAKTIF'}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: theme.accent, marginTop: 3, fontWeight: '600' }}>
                🏦 Rekening Tujuan: {billingSettings.bankName ? `${billingSettings.bankName} - ${billingSettings.bankAccount} (a.n ${billingSettings.bankAccountName})` : 'Belum diatur (Klik Kustom Aturan & Rekening Bank)'}
              </Text>
            </View>
          </View>

          <View style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={handleOpenSettings}
              style={{
                backgroundColor: theme.subtleBg,
                borderWidth: 1,
                borderColor: theme.border,
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Settings size={15} color={theme.accent} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                Kustom Aturan & Rekening Bank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGenerateBillings}
              disabled={isGenerating}
              style={{
                backgroundColor: theme.accent,
                paddingVertical: 9,
                paddingHorizontal: 15,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Sparkles size={15} color="#ffffff" />
              )}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                Generate Tagihan Bulan Ini
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabel Tagihan & Invoice */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <View
            style={{
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'flex-start',
              padding: 18,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
              gap: 12,
            }}
          >
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                Daftar Tagihan Langganan Tenant
              </Text>
              <TouchableOpacity onPress={fetchBillingsData} style={{ padding: 4 }}>
                <RefreshCw size={14} color={theme.textMuted} className={isLoadingBillings ? 'animate-spin' : ''} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: isDesktop ? 'auto' : '100%' }}>
              {/* Search */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.border,
                  width: isDesktop ? 220 : '100%',
                }}
              >
                <Search size={14} color={theme.textMuted} />
                <TextInput
                  placeholder="Cari invoice / tenant..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    borderWidth: 0,
                    outlineStyle: 'none',
                    marginLeft: 8,
                    backgroundColor: 'transparent',
                    flex: 1,
                    fontSize: 13,
                    color: theme.text,
                  } as any}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Tabs */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 4,
                  backgroundColor: theme.subtleBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 6,
                  padding: 3,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { label: 'Semua', value: 'all' },
                  { label: 'Lunas', value: 'paid' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Masa Tenggat', value: 'grace' },
                  { label: 'Terblokir', value: 'blocked' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setStatusFilter(opt.value as any)}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                      borderRadius: 4,
                      backgroundColor: statusFilter === opt.value ? theme.cardBg : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: statusFilter === opt.value ? '700' : '500',
                        color: statusFilter === opt.value ? theme.accent : theme.textMuted,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Export Button */}
              <TouchableOpacity
                onPress={handleExportCSV}
                style={{
                  backgroundColor: theme.subtleBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} color={theme.text} />
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Container */}
          <View style={{ overflowX: 'auto', width: '100%' } as any}>
            <View style={{ minWidth: 960, width: '100%' }}>
              {/* Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.border,
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                }}
              >
                <View style={{ flex: 1.5, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    No. Invoice
                  </Text>
                </View>
                <View style={{ flex: 2, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Perusahaan (Tenant)
                  </Text>
                </View>
                <View style={{ flex: 1.3, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    User & Tarif
                  </Text>
                </View>
                <View style={{ flex: 1.5, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Total Tagihan
                  </Text>
                </View>
                <View style={{ flex: 2.2, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Jatuh Tempo & Masa Tenggat
                  </Text>
                </View>
                <View style={{ flex: 1.6, paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Status Absensi
                  </Text>
                </View>
                <View style={{ width: 140, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Aksi
                  </Text>
                </View>
              </View>

              {/* Rows */}
              {isLoadingBillings ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>Memuat data tagihan...</Text>
                </View>
              ) : filteredBillings.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={36} color={theme.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Belum ada data tagihan yang sesuai
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Klik tombol "Generate Tagihan Bulan Ini" untuk membuat tagihan otomatis ke seluruh tenant
                  </Text>
                </View>
              ) : (
                filteredBillings.map((b, idx) => {
                  const invNo = formatInvoiceNumber(b);
                  const isPaid = b.status === 'PAID';
                  const isBlocked = !isPaid && b.isBlocked;
                  const isInGrace = !isPaid && !isBlocked && b.isInGrace;
                  const hasCustomGrace = b.tenant?.customGracePeriodDays !== null && b.tenant?.customGracePeriodDays !== undefined;

                  return (
                    <View
                      key={b.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        borderBottomWidth: idx === filteredBillings.length - 1 ? 0 : 1,
                        borderBottomColor: theme.border,
                        backgroundColor: theme.cardBg,
                      }}
                    >
                      {/* No. Invoice */}
                      <View style={{ flex: 1.5, paddingRight: 8 }}>
                        <Text style={{ fontFamily: 'monospace', color: theme.text, fontWeight: '600', fontSize: 12 }}>
                          {invNo}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          Periode {b.month}/{b.year}
                        </Text>
                      </View>

                      {/* Tenant */}
                      <View style={{ flex: 2, paddingRight: 8 }}>
                        <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>
                          {b.tenant?.name || `Tenant #${b.tenantId}`}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          {b.tenant?.slug || 'tenant'}
                        </Text>
                      </View>

                      {/* User & Tarif */}
                      <View style={{ flex: 1.3, paddingRight: 8 }}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                          {b.userCount} Karyawan
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          @{formatRupiah(b.costPerUser)}
                        </Text>
                      </View>

                      {/* Total */}
                      <View style={{ flex: 1.5, paddingRight: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                          {formatRupiah(b.amount)}
                        </Text>
                        {b.paymentProof && (
                          <Text style={{ fontSize: 10, color: theme.accent, fontWeight: '600' }}>
                            ✓ Bukti Terunggah
                          </Text>
                        )}
                      </View>

                      {/* Jatuh Tempo & Masa Tenggat */}
                      <View style={{ flex: 2.2, paddingRight: 8 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 12, color: theme.text, fontWeight: '500' }}>
                            Due: {formatDateIndo(b.dueDate)}
                          </Text>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Text style={{ fontSize: 11, color: isBlocked ? theme.dangerText : isInGrace ? theme.warningText : theme.textMuted }}>
                            Tenggat: {formatDateIndo(b.deadlineDate)} ({b.gracePeriodDays ?? 3} hr{hasCustomGrace ? ' • Khusus' : ''})
                          </Text>
                        </View>
                      </View>

                      {/* Status */}
                      <View style={{ flex: 1.6, paddingRight: 8 }}>
                        <View
                          style={{
                            paddingVertical: 3,
                            paddingHorizontal: 8,
                            borderRadius: 16,
                            alignSelf: 'flex-start',
                            backgroundColor: isPaid
                              ? theme.successBg
                              : isBlocked
                              ? theme.dangerBg
                              : isInGrace
                              ? theme.warningBg
                              : theme.infoBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: isPaid
                                ? theme.successText
                                : isBlocked
                                ? theme.dangerText
                                : isInGrace
                                ? theme.warningText
                                : theme.infoText,
                            }}
                          >
                            {isPaid
                              ? 'LUNAS'
                              : isBlocked
                              ? `TERBLOKIR (${b.daysOverdue ?? 1} hr)`
                              : isInGrace
                              ? `TENGGAT (Sisa ${b.daysLeftInGrace ?? 0} hr)`
                              : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      {/* Aksi */}
                      <View style={{ width: 140, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* Dispensasi Tenant Button */}
                        <TouchableOpacity
                          onPress={() => handleOpenTenantGrace(b)}
                          title="Atur Masa Tenggat Khusus Tenant"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: hasCustomGrace ? theme.accent : theme.subtleBg,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          <Clock size={14} color={hasCustomGrace ? '#ffffff' : theme.text} />
                        </TouchableOpacity>

                        {/* Setujui Pembayaran */}
                        {!isPaid && (
                          <TouchableOpacity
                            onPress={() => handleApproveBilling(b.id)}
                            disabled={isApprovingId === b.id}
                            title="Setujui Pembayaran & Buka Akses Absensi"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              backgroundColor: theme.successBg,
                              borderWidth: 1,
                              borderColor: theme.border,
                            }}
                          >
                            {isApprovingId === b.id ? (
                              <ActivityIndicator size="small" color={theme.successText} />
                            ) : (
                              <Check size={14} color={theme.successText} />
                            )}
                          </TouchableOpacity>
                        )}

                        {/* Detail Modal */}
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedBilling(b);
                            setShowInvoiceDetailModal(true);
                          }}
                          title="Lihat Rincian / Bukti Bayar"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: theme.subtleBg,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          <Eye size={14} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Pengaturan Masa Tenggat & Penagihan (Global) */}
      <Modal visible={showSettingsModal} transparent animationType="fade" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90%', padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={20} color={theme.accent} />
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>
                  Pengaturan Penagihan & Rekening Bank
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16, lineHeight: 18 }}>
                Kustomisasi tanggal jatuh tempo bulanan, masa tenggat toleransi, serta rekening bank resmi untuk transfer pembayaran langganan oleh tenant.
              </Text>

              <View style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Tanggal Jatuh Tempo */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Tanggal Jatuh Tempo Bulanan (Hari ke-n setiap bulan)
                  </Text>
                  <TextInput
                    value={String(tempSettings.billingDueDay)}
                    onChangeText={(val) => setTempSettings({ ...tempSettings, billingDueDay: parseInt(val, 10) || 1 })}
                    keyboardType="numeric"
                    placeholder="Contoh: 1 (tanggal 1 setiap bulan)"
                    placeholderTextColor={theme.placeholder}
                    style={{
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      fontSize: 14,
                      color: theme.text,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                    Tagihan bulanan akan jatuh tempo pada tanggal ini.
                  </Text>
                </View>

                {/* Masa Tenggat Default */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Masa Tenggat Pembayaran Default (Hari)
                  </Text>
                  <TextInput
                    value={String(tempSettings.defaultGracePeriodDays)}
                    onChangeText={(val) => setTempSettings({ ...tempSettings, defaultGracePeriodDays: parseInt(val, 10) || 0 })}
                    keyboardType="numeric"
                    placeholder="Contoh: 3 hari"
                    placeholderTextColor={theme.placeholder}
                    style={{
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      fontSize: 14,
                      color: theme.text,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                    Karyawan masih dapat absen selama masa tenggat ini dengan peringatan sisa hari.
                  </Text>
                </View>

                {/* Biaya per User */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Biaya Langganan per Karyawan / Bulan (Rp)
                  </Text>
                  <TextInput
                    value={String(tempSettings.costPerUser)}
                    onChangeText={(val) => setTempSettings({ ...tempSettings, costPerUser: parseFloat(val) || 0 })}
                    keyboardType="numeric"
                    placeholder="Contoh: 10000"
                    placeholderTextColor={theme.placeholder}
                    style={{
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      fontSize: 14,
                      color: theme.text,
                    }}
                  />
                </View>

                {/* Toggle Blokir Absensi */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTempSettings({ ...tempSettings, blockAttendanceOnOverdue: !tempSettings.blockAttendanceOnOverdue })}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: theme.subtleBg,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: tempSettings.blockAttendanceOnOverdue ? theme.accent : 'transparent',
                      borderWidth: 2,
                      borderColor: tempSettings.blockAttendanceOnOverdue ? theme.accent : theme.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tempSettings.blockAttendanceOnOverdue && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                      Blokir Seluruh Karyawan Saat Lewat Masa Tenggat
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                      Jika diaktifkan, semua karyawan di perusahaan yang menunggak tidak akan bisa presensi masuk/pulang sampai tagihan dibayar.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Seksi Rekening Bank Transfer */}
                <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16, marginTop: 8 }}>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Building2 size={18} color={theme.accent} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                      Rekening Bank Tujuan Pembayaran Resmi
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 12, lineHeight: 16 }}>
                    Informasi rekening ini akan ditampilkan langsung kepada Admin Tenant pada saat tagihan diterbitkan agar mereka dapat mentransfer dana ke rekening resmi Anda.
                  </Text>

                  {/* Nama Bank */}
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Nama Bank (Contoh: BCA, Mandiri, BRI, BNI)
                    </Text>
                    <TextInput
                      value={tempSettings.bankName || ''}
                      onChangeText={(val) => setTempSettings({ ...tempSettings, bankName: val })}
                      placeholder="Contoh: Bank Central Asia (BCA)"
                      placeholderTextColor={theme.placeholder}
                      style={{
                        backgroundColor: theme.inputBg,
                        borderWidth: 1,
                        borderColor: theme.inputBorder,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    />
                  </View>

                  {/* Nomor Rekening */}
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Nomor Rekening Bank
                    </Text>
                    <TextInput
                      value={tempSettings.bankAccount || ''}
                      onChangeText={(val) => setTempSettings({ ...tempSettings, bankAccount: val })}
                      keyboardType="numeric"
                      placeholder="Contoh: 8830192831"
                      placeholderTextColor={theme.placeholder}
                      style={{
                        backgroundColor: theme.inputBg,
                        borderWidth: 1,
                        borderColor: theme.inputBorder,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    />
                  </View>

                  {/* Atas Nama Pemilik Rekening */}
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Atas Nama Pemilik Rekening
                    </Text>
                    <TextInput
                      value={tempSettings.bankAccountName || ''}
                      onChangeText={(val) => setTempSettings({ ...tempSettings, bankAccountName: val })}
                      placeholder="Contoh: PT YexsSync Indonesia"
                      placeholderTextColor={theme.placeholder}
                      style={{
                        backgroundColor: theme.inputBg,
                        borderWidth: 1,
                        borderColor: theme.inputBorder,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14 }}>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBillingSettings}
                disabled={isSavingSettings}
                style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent, opacity: isSavingSettings ? 0.7 : 1 }}
              >
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}>
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Kustomisasi Masa Tenggat Khusus Tenant */}
      <Modal visible={showTenantGraceModal} transparent animationType="fade" onRequestClose={() => setShowTenantGraceModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>
                  Dispensasi Masa Tenggat Tenant
                </Text>
                <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600', marginTop: 2 }}>
                  {selectedTenantGrace?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTenantGraceModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16, lineHeight: 18 }}>
              Berikan jumlah hari masa tenggat khusus untuk tenant ini jika membutuhkan dispensasi waktu tambahan sebelum seluruh karyawannya diblokir dari absensi.
            </Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                Jumlah Hari Masa Tenggat Khusus (Hari)
              </Text>
              <TextInput
                value={tenantGraceDaysInput}
                onChangeText={setTenantGraceDaysInput}
                keyboardType="numeric"
                placeholder={`Kosongkan untuk ikut default global (${billingSettings.defaultGracePeriodDays} hari)`}
                placeholderTextColor={theme.placeholder}
                style={{
                  backgroundColor: theme.inputBg,
                  borderWidth: 1,
                  borderColor: theme.inputBorder,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 14,
                  color: theme.text,
                }}
              />
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                Contoh: isi <Text style={{ fontWeight: '700' }}>7</Text> untuk dispensasi 1 minggu, atau kosongkan untuk kembali mengikuti default sistem.
              </Text>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setShowTenantGraceModal(false)}
                style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTenantGrace}
                disabled={isSavingSettings}
                style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent, opacity: isSavingSettings ? 0.7 : 1 }}
              >
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}>
                  {isSavingSettings ? 'Menyimpan...' : 'Terapkan Dispensasi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Detail Tagihan & Bukti Bayar */}
      <Modal visible={showInvoiceDetailModal} transparent animationType="fade" onRequestClose={() => setShowInvoiceDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90%', padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Rincian Tagihan & Bukti Pembayaran</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>
                  {selectedBilling ? formatInvoiceNumber(selectedBilling) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowInvoiceDetailModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBilling && (
                <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <View style={{ backgroundColor: theme.subtleBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.border, gap: 8 }}>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Tenant / Perusahaan:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{selectedBilling.tenant?.name || `Tenant #${selectedBilling.tenantId}`}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Periode Tagihan:</Text>
                      <Text style={{ fontSize: 12, color: theme.text }}>Bulan {selectedBilling.month} / {selectedBilling.year}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Jumlah Karyawan Aktif:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{selectedBilling.userCount} Orang</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Tarif per Karyawan:</Text>
                      <Text style={{ fontSize: 12, color: theme.text }}>{formatRupiah(selectedBilling.costPerUser)} / bulan</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Jatuh Tempo:</Text>
                      <Text style={{ fontSize: 12, color: theme.text }}>{formatDateIndo(selectedBilling.dueDate)}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Batas Toleransi Tenggat:</Text>
                      <Text style={{ fontSize: 12, color: selectedBilling.isBlocked ? theme.dangerText : theme.text }}>
                        {formatDateIndo(selectedBilling.deadlineDate)} ({selectedBilling.gracePeriodDays ?? 3} hari)
                      </Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Total Tagihan:</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.accent }}>{formatRupiah(selectedBilling.amount)}</Text>
                    </View>
                  </View>

                  {/* Bukti Bayar */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 }}>
                      Bukti Transfer Pembayaran:
                    </Text>
                    {selectedBilling.paymentProof ? (
                      <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.subtleBg, alignItems: 'center', padding: 8 }}>
                        <Image
                          source={{ uri: selectedBilling.paymentProof.startsWith('http') ? selectedBilling.paymentProof : `${api.defaults.baseURL?.replace('/api', '')}${selectedBilling.paymentProof}` }}
                          style={{ width: '100%', height: 240, resizeMode: 'contain' }}
                        />
                      </View>
                    ) : (
                      <View style={{ padding: 18, borderRadius: 10, backgroundColor: theme.subtleBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                        <CreditCard size={28} color={theme.textMuted} style={{ marginBottom: 6 }} />
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          Tenant belum mengunggah bukti transfer pembayaran
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setShowInvoiceDetailModal(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>Tutup</Text>
              </TouchableOpacity>
              {selectedBilling && selectedBilling.status === 'PENDING' && (
                <TouchableOpacity
                  onPress={() => handleApproveBilling(selectedBilling.id)}
                  disabled={isApprovingId === selectedBilling.id}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: theme.successBg,
                    borderWidth: 1,
                    borderColor: theme.successText,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} color={theme.successText} />
                  <Text style={{ fontSize: 13, color: theme.successText, fontWeight: '700' }}>
                    Verifikasi Lunas
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Edit Plan */}
      <Modal visible={showEditPlanModal} transparent animationType="fade" onRequestClose={() => setShowEditPlanModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>
                Edit {selectedPlan?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowEditPlanModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>Harga Langganan</Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Contoh: Rp 1.5M"
                  placeholderTextColor={theme.placeholder}
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>Batas Pengguna</Text>
                <TextInput
                  value={editMaxUsers}
                  onChangeText={setEditMaxUsers}
                  placeholder="Contoh: Maks 100 User"
                  placeholderTextColor={theme.placeholder}
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setShowEditPlanModal(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePlan}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent }}
              >
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '600' }}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
