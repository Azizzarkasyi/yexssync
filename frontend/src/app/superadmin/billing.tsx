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
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
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

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  tenantName: string;
  date: string;
  plan: 'Enterprise' | 'Pro' | 'Basic';
  total: string;
  status: 'Lunas' | 'Pending' | 'Overdue' | 'Baru';
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
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_PLANS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  useEffect(() => {
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
      } catch (err) {
        // Silent fallback
      }
    };
    fetchTenantPlans();
  }, []);

  // Modals
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMaxUsers, setEditMaxUsers] = useState('');

  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      router.replace('/auth/login');
    }
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

  const handleExportCSV = () => {
    try {
      const header = 'No. Invoice,Perusahaan,Tanggal,Paket,Total,Status\n';
      const rows = invoices
        .map((inv) => `"${inv.invoiceNo}","${inv.tenantName}","${inv.date}","${inv.plan}","${inv.total}","${inv.status}"`)
        .join('\n');
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI(header + rows);

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Invoice_HadirYuk_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Fitur ekspor CSV diaktifkan di platform web.');
      }
    } catch (err: any) {
      showError('Ekspor Gagal', 'Gagal mengunduh CSV invoice: ' + (err?.message || 'Terjadi kesalahan sistem.'));
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      searchQuery === '' ||
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.tenantName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'paid') matchesStatus = inv.status === 'Lunas';
    else if (statusFilter === 'pending') matchesStatus = inv.status === 'Pending';
    else if (statusFilter === 'overdue') matchesStatus = inv.status === 'Overdue';

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bg, overflow: 'hidden' }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/billing"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 25, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Header / Topbar */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 20,
            marginBottom: 20,
            backgroundColor: theme.bg,
            zIndex: 10,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => setIsMobileMenuOpen(true)}
                style={{ padding: 8, backgroundColor: theme.cardBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Menu size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
              Paket & Tagihan Langganan
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Search Bar */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.cardBg,
                paddingVertical: 8,
                paddingHorizontal: 15,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                width: isDesktop ? 250 : 160,
              }}
            >
              <Search size={16} color={theme.textMuted} />
              <TextInput
                placeholder="Cari invoice atau tenant..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  borderWidth: 0,
                  outlineStyle: 'none',
                  marginLeft: 10,
                  backgroundColor: 'transparent',
                  width: '100%',
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

            {/* Theme Toggle (Device / Auto / Manual) */}
            <TouchableOpacity
              onPress={theme.toggleTheme}
              title={theme.isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              } as any}
            >
              {theme.isDark ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color={theme.textMuted} />
              )}
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => setShowNotifModal(true)}
              style={{ position: 'relative', cursor: 'pointer' } as any}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} color={theme.textMuted} />
              </View>
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                  minWidth: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>3</Text>
              </View>
            </TouchableOpacity>

            {/* User Profile */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: theme.cardBg,
                  paddingVertical: 5,
                  paddingLeft: 5,
                  paddingRight: 15,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: theme.border,
                  cursor: 'pointer',
                } as any}
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                />
                <View style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    {user?.name || 'Andi Setiawan'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '500' }}>Super Admin</Text>
                </View>
                <ChevronDown size={12} color={theme.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>

              {showProfileDropdown && (
                <View
                  style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    width: 200,
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 5,
                    zIndex: 50,
                  }}
                >
                  <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                      {user?.email || 'andi.admin@hadiryuk.com'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.successText, fontWeight: '500', marginTop: 2 }}>
                      ● Online ({theme.isDark ? 'Mode Gelap' : 'Mode Terang'})
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfileDropdown(false);
                      router.push('/superadmin/admins');
                    }}
                    style={{ padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <Users size={14} color={theme.textMuted} />
                    <Text style={{ fontSize: 13, color: theme.text }}>Kelola Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{ padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <LogOut size={14} color={theme.dangerText} />
                    <Text style={{ fontSize: 13, color: theme.dangerText, fontWeight: '600' }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary Cards Keuangan */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 25,
          }}
        >
          {/* Card 1: MRR */}
          <View
            style={{
              flex: 1,
              minWidth: 220,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                MRR (Pendapatan Bulanan)
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>Rp 145.500.000</Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.successBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Coins size={24} color={theme.successText} />
            </View>
          </View>

          {/* Card 2: Total Langganan Aktif */}
          <View
            style={{
              flex: 1,
              minWidth: 220,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Total Langganan Aktif
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>120</Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.infoBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <FileText size={24} color={theme.infoText} />
            </View>
          </View>

          {/* Card 3: Tagihan Menunggu (Pending) */}
          <View
            style={{
              flex: 1,
              minWidth: 220,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Tagihan Menunggu (Pending)
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>Rp 12.000.000</Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.warningBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Clock size={24} color={theme.warningText} />
            </View>
          </View>

          {/* Card 4: Tunggakan Lewat Jatuh Tempo */}
          <View
            style={{
              flex: 1,
              minWidth: 220,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Tunggakan Lewat Jatuh Tempo
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>2</Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.dangerBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <TriangleAlert size={24} color={theme.dangerText} />
            </View>
          </View>
        </View>

        {/* Manajemen Paket Harga (.plans-section) */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 20,
            marginBottom: 25,
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
                  padding: 25,
                  borderWidth: isPopular ? 2 : 1,
                  borderColor: isPopular ? theme.accent : theme.border,
                  position: 'relative',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      alignSelf: 'center',
                      backgroundColor: theme.accent,
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      Paling Populer
                    </Text>
                  </View>
                )}

                {/* Plan Header */}
                <View
                  style={{
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingBottom: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 10 }}>
                    {plan.name}
                  </Text>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text }}>
                    {plan.price}
                    <Text style={{ fontSize: 14, color: theme.textMuted, fontWeight: '400' }}>{plan.period}</Text>
                  </Text>
                </View>

                {/* Plan Stats */}
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Pelanggan Aktif:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{plan.activeTenants} Tenant</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Batas Pengguna:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{plan.maxUsers}</Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => handleOpenEditPlan(plan)}
                  style={{
                    width: '100%',
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Pen size={14} color={theme.text} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Edit Paket {plan.name.replace(' Plan', '')}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Riwayat Transaksi / Invoice */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Riwayat Transaksi & Invoice
            </Text>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {/* Select Status Filter */}
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
                }}
              >
                {[
                  { label: 'Semua Status', value: 'all' },
                  { label: 'Lunas (Paid)', value: 'paid' },
                  { label: 'Menunggu (Pending)', value: 'pending' },
                  { label: 'Tunggakan (Overdue)', value: 'overdue' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setStatusFilter(opt.value as any)}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 4,
                      backgroundColor: statusFilter === opt.value ? theme.cardBg : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: statusFilter === opt.value ? '600' : '500',
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
                  paddingVertical: 8,
                  paddingHorizontal: 15,
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

          {/* Table Responsive */}
          <View style={{ overflowX: 'auto', width: '100%' } as any}>
            <View style={{ minWidth: 780, width: '100%' }}>
              {/* Table Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.border,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <View style={{ flex: 1.8, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    No. Invoice
                  </Text>
                </View>
                <View style={{ flex: 2.2, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Perusahaan (Tenant)
                  </Text>
                </View>
                <View style={{ flex: 1.5, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Tanggal Tagihan
                  </Text>
                </View>
                <View style={{ flex: 1.2, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Paket
                  </Text>
                </View>
                <View style={{ flex: 1.6, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Pembayaran
                  </Text>
                </View>
                <View style={{ flex: 1.4, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Status
                  </Text>
                </View>
                <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    Aksi
                  </Text>
                </View>
              </View>

              {/* Table Rows */}
              {filteredInvoices.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={40} color={theme.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Belum ada data tagihan / invoice
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Invoice langganan tenant akan ditampilkan di sini secara otomatis
                  </Text>
                </View>
              ) : (
                filteredInvoices.map((inv, idx) => (
                <View
                  key={inv.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderBottomWidth: idx === filteredInvoices.length - 1 ? 0 : 1,
                    borderBottomColor: theme.border,
                    backgroundColor: theme.cardBg,
                  }}
                >
                  {/* No. Invoice */}
                  <View style={{ flex: 1.8, paddingRight: 10 }}>
                    <Text style={{ fontFamily: 'monospace', color: theme.text, fontWeight: '600', fontSize: 13 }}>
                      {inv.invoiceNo}
                    </Text>
                  </View>

                  {/* Perusahaan */}
                  <View style={{ flex: 2.2, paddingRight: 10 }}>
                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>
                      {inv.tenantName}
                    </Text>
                  </View>

                  {/* Tanggal Tagihan */}
                  <View style={{ flex: 1.5, paddingRight: 10 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      {inv.date}
                    </Text>
                  </View>

                  {/* Paket */}
                  <View style={{ flex: 1.2, paddingRight: 10 }}>
                    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                        {inv.plan}
                      </Text>
                    </View>
                  </View>

                  {/* Total Pembayaran */}
                  <View style={{ flex: 1.6, paddingRight: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                      {inv.total}
                    </Text>
                  </View>

                  {/* Status */}
                  <View style={{ flex: 1.4, paddingRight: 10 }}>
                    <View
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                        backgroundColor:
                          inv.status === 'Lunas'
                            ? theme.successBg
                            : inv.status === 'Pending'
                            ? theme.warningBg
                            : inv.status === 'Overdue'
                            ? theme.dangerBg
                            : theme.infoBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color:
                            inv.status === 'Lunas'
                              ? theme.successText
                              : inv.status === 'Pending'
                              ? theme.warningText
                              : inv.status === 'Overdue'
                              ? theme.dangerText
                              : theme.infoText,
                        }}
                      >
                        {inv.status === 'Lunas' && 'Lunas'}
                        {inv.status === 'Pending' && 'Pending'}
                        {inv.status === 'Overdue' && 'Overdue'}
                        {inv.status === 'Baru' && 'Baru'}
                      </Text>
                    </View>
                  </View>

                  {/* Aksi */}
                  <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedInvoice(inv);
                        setShowInvoiceDetailModal(true);
                      }}
                      title="Detail Invoice"
                      style={{ padding: 6, borderRadius: 6, backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.border, cursor: 'pointer' } as any}
                    >
                      <FileDown size={16} color={theme.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                </View>
              )))}
            </View>
          </View>

          {/* Pagination */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: theme.border,
              backgroundColor: theme.cardBg,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Menampilkan {filteredInvoices.length > 0 ? 1 : 0} - {filteredInvoices.length} dari {invoices.length} Invoice (Bulan Ini)
            </Text>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {[1, 2, 3].map((p) => {
                const isActive = currentPage === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setCurrentPage(p)}
                    style={{
                      width: 32,
                      height: 32,
                      borderWidth: 1,
                      borderColor: isActive ? theme.accent : theme.border,
                      backgroundColor: isActive ? theme.accent : theme.cardBg,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: isActive ? '#ffffff' : theme.text,
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setCurrentPage(Math.min(3, currentPage + 1))}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Edit Paket */}
      <Modal visible={showEditPlanModal} transparent animationType="fade" onRequestClose={() => setShowEditPlanModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                Edit {selectedPlan?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowEditPlanModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Harga Langganan</Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Contoh: Rp 1.5M"
                  placeholderTextColor={theme.placeholder}
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Batas Pengguna</Text>
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
                <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePlan}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent }}
              >
                <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: '600' }}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Detail / Unduh Invoice */}
      <Modal visible={showInvoiceDetailModal} transparent animationType="fade" onRequestClose={() => setShowInvoiceDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Faktur Invoice</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>{selectedInvoice?.invoiceNo}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInvoiceDetailModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <View style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: theme.subtleBg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Nama Tenant:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{selectedInvoice.tenantName}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Tanggal Invoice:</Text>
                  <Text style={{ fontSize: 13, color: theme.text }}>{selectedInvoice.date}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Paket Langganan:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.accent }}>{selectedInvoice.plan}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Status Pembayaran:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedInvoice.status === 'Lunas' ? theme.successText : theme.dangerText }}>
                    {selectedInvoice.status}
                  </Text>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Total Tagihan:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.accent }}>{selectedInvoice.total}</Text>
                </View>
              </View>
            )}

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setShowInvoiceDetailModal(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '500' }}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  alert('Mengunduh file PDF ' + selectedInvoice?.invoiceNo);
                  setShowInvoiceDetailModal(false);
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} color="#ffffff" />
                <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: '600' }}>Unduh PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Notifications */}
      <Modal visible={showNotifModal} transparent animationType="fade" onRequestClose={() => setShowNotifModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 420, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Notifikasi Sistem (3)</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <View style={{ padding: 12, backgroundColor: theme.warningBg, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.warningText }}>Tagihan Tertunggak</Text>
                <Text style={{ fontSize: 12, color: theme.isDark ? '#fbbf24' : '#b45309', marginTop: 2 }}>Maju Djaya Corp belum membayar invoice Agustus 2026.</Text>
              </View>
              <View style={{ padding: 12, backgroundColor: theme.successBg, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.successText }}>Pembayaran Diterima</Text>
                <Text style={{ fontSize: 12, color: theme.isDark ? '#34d399' : '#047857', marginTop: 2 }}>PT Sejahtera Abadi telah melunasi INV-2609-001.</Text>
              </View>
              <View style={{ padding: 12, backgroundColor: theme.infoBg, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.infoText }}>Invoice Otomatis Dibuat</Text>
                <Text style={{ fontSize: 12, color: theme.isDark ? '#60a5fa' : '#1d4ed8', marginTop: 2 }}>5 invoice baru bulan September telah diterbitkan sistem.</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowNotifModal(false)}
              style={{ marginTop: 16, paddingVertical: 8, alignItems: 'center', backgroundColor: theme.accent, borderRadius: 8 }}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
