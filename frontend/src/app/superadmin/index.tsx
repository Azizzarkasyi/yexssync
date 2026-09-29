import React, { useState, useEffect, useContext } from 'react';
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
  Wallet,
  Ticket,
  TriangleAlert,
  Info,
  Check,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import api from '@/lib/api';

// Interface definitions
interface TenantItem {
  id: number | string;
  name: string;
  code?: string;
  schemaName?: string;
  adminName: string;
  adminEmail: string;
  plan: 'Enterprise' | 'Pro' | 'Basic';
  userCount: number;
  maxUsers: number;
  status: 'Aktif' | 'Tunggakan' | 'Nonaktif';
  registeredDate: string;
  initials: string;
  initialsBg?: string;
  initialsColor?: string;
}

interface TicketItem {
  id: string;
  companyName: string;
  issue: string;
  priority: 'High Priority' | 'Medium Priority' | 'Resolved';
  time: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

const MONTHLY_GROWTH = [
  { month: 'Jan', count: 12, height: '30%' },
  { month: 'Feb', count: 18, height: '45%' },
  { month: 'Mar', count: 10, height: '25%' },
  { month: 'Apr', count: 24, height: '60%' },
  { month: 'Mei', count: 20, height: '50%' },
  { month: 'Jun', count: 32, height: '80%' },
  { month: 'Jul', count: 38, height: '95%', isHighlight: true },
  { month: 'Agu', count: 16, height: '40%' },
];

export default function SuperAdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  // Navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Aktif' | 'Tunggakan' | 'Nonaktif'>('ALL');
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);

  // Data
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>('Jul');

  // Modals
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPlan, setNewPlan] = useState<'Enterprise' | 'Pro' | 'Basic'>('Pro');
  const [newMaxUsers, setNewMaxUsers] = useState('50');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/super-admin/tenants');
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const loaded: TenantItem[] = response.data.data.map((t: any) => {
          const initials = (t.name || 'PT')
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          let planName: 'Enterprise' | 'Pro' | 'Basic' = 'Pro';
          if (t.plan === 'ENTERPRISE' || t.plan === 'Enterprise') planName = 'Enterprise';
          else if (t.plan === 'BASIC' || t.plan === 'Basic') planName = 'Basic';

          let statusName: 'Aktif' | 'Tunggakan' | 'Nonaktif' = 'Aktif';
          if (!t.isActive) statusName = 'Nonaktif';

          let regDate = 'Baru';
          if (t.createdAt) {
            try {
              const d = new Date(t.createdAt);
              regDate = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch {
              regDate = 'Baru';
            }
          }

          return {
            id: t.id,
            name: t.name,
            code: t.code,
            adminName: t.adminName || 'Admin',
            adminEmail: t.adminEmail || '-',
            plan: planName,
            userCount: t.userCount || 0,
            maxUsers: t.maxUsers || 50,
            status: statusName,
            registeredDate: regDate,
            initials: initials || 'PT',
            initialsBg: statusName === 'Nonaktif' ? theme.dangerBg : theme.subtleBg,
            initialsColor: statusName === 'Nonaktif' ? theme.dangerText : theme.accent,
          };
        });
        setTenants(loaded);
      } else {
        setTenants([]);
      }
    } catch {
      setTenants([]);
    }
  };

  const totalUsersCount = tenants.reduce((acc, t) => acc + (t.userCount || 0), 0);
  const totalRevenue = tenants.reduce((acc, t) => {
    const p = (t.plan || '').toLowerCase();
    if (p.includes('enter')) return acc + 5000000;
    if (p.includes('pro')) return acc + 1500000;
    return acc + 500000;
  }, 0);
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      router.replace('/auth/login');
    }
  };

  const handleCreateTenant = () => {
    if (!newCompanyName.trim()) {
      showError('Validasi Gagal', 'Nama perusahaan wajib diisi');
      return;
    }
    const initials = newCompanyName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const created: TenantItem = {
      id: Date.now(),
      name: newCompanyName,
      adminName: newAdminName || 'Admin Baru',
      adminEmail: newAdminEmail || 'admin@perusahaan.co.id',
      plan: newPlan,
      userCount: 1,
      maxUsers: parseInt(newMaxUsers) || 50,
      status: 'Aktif',
      registeredDate: 'Hari ini',
      initials: initials || 'PT',
      initialsBg: theme.subtleBg,
      initialsColor: theme.accent,
    };

    setTenants([created, ...tenants]);
    setShowAddTenantModal(false);
    setNewCompanyName('');
    setNewAdminName('');
    setNewAdminEmail('');
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bg, overflow: 'hidden' }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin"
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
            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>Super Admin Dashboard</Text>
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
                placeholder="Cari perusahaan atau admin..."
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

              {/* Profile Dropdown */}
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

        {/* Summary Cards */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 25,
          }}
        >
          {/* Card 1: Total Perusahaan */}
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
                Total Perusahaan
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>{tenants.length}</Text>
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
              <Building2 size={24} color={theme.infoText} />
            </View>
          </View>

          {/* Card 2: Total Pengguna Aktif */}
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
                Total Pengguna Aktif
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>
                {totalUsersCount.toLocaleString('id-ID')}
              </Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.purpleBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Users size={24} color={theme.purpleText} />
            </View>
          </View>

          {/* Card 3: Pendapatan (Bulan Ini) */}
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
                Pendapatan (Bulan Ini)
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>
                Rp {totalRevenue > 0 ? (totalRevenue / 1000000).toFixed(1) + 'M' : '0'}
              </Text>
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
              <Wallet size={24} color={theme.successText} />
            </View>
          </View>

          {/* Card 4: Tiket Bantuan Terbuka */}
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
                Tiket Bantuan Terbuka
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>{openTicketsCount}</Text>
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
              <Ticket size={24} color={theme.warningText} />
            </View>
          </View>
        </View>

        {/* Middle Section: Chart & Tickets */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 20,
            marginBottom: 20,
          }}
        >
          {/* Chart Panel (2fr) */}
          <View
            style={{
              flex: isDesktop ? 2 : 1,
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                Pertumbuhan Perusahaan (Tenant Baru)
              </Text>
              <TouchableOpacity
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.text }}>Tahun 2026</Text>
                <ChevronDown size={12} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Chart Bars */}
            <View
              style={{
                height: 250,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingTop: 20,
                gap: 12,
              }}
            >
              {MONTHLY_GROWTH.map((item) => {
                const isSelected = selectedChartMonth === item.month;
                const isJul = item.isHighlight;
                const barColor = isJul
                  ? theme.accent
                  : isSelected
                  ? theme.infoText
                  : theme.isDark
                  ? '#334155'
                  : '#dbeafe';

                return (
                  <TouchableOpacity
                    key={item.month}
                    onPress={() => setSelectedChartMonth(item.month)}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          backgroundColor: theme.isDark ? '#334155' : '#1e293b',
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                          {item.month}: {item.count}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: item.height as any,
                        backgroundColor: barColor,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Month Labels */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
                paddingHorizontal: 10,
              }}
            >
              {MONTHLY_GROWTH.map((item) => (
                <Text
                  key={item.month}
                  style={{
                    fontSize: 12,
                    color: selectedChartMonth === item.month ? theme.accent : theme.textMuted,
                    fontWeight: selectedChartMonth === item.month ? '700' : '400',
                  }}
                >
                  {item.month}
                </Text>
              ))}
            </View>
          </View>

          {/* Support Tickets Panel (1fr) */}
          <View
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                Tiket Bantuan Terbaru
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/superadmin/tenants')}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.text }}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {/* Ticket List */}
            <View style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {tickets.length === 0 ? (
                <View style={{ paddingVertical: 35, alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={36} color={theme.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Belum ada tiket bantuan
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Tiket aduan dari tenant akan muncul di sini
                  </Text>
                </View>
              ) : (
                tickets.slice(0, 3).map((item, idx) => (
                  <View
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 12,
                      paddingBottom: idx === Math.min(tickets.length, 3) - 1 ? 0 : 15,
                      borderBottomWidth: idx === Math.min(tickets.length, 3) - 1 ? 0 : 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: item.status === 'OPEN' ? theme.dangerBg : theme.warningBg,
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Ticket size={16} color={item.status === 'OPEN' ? theme.dangerText : theme.warningText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                        {item.companyName}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 5 }}>
                        {item.issue}
                      </Text>
                      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600' }}>{item.priority}</Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>{item.time}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Bottom Section: Tenant Table */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Panel Header */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Perusahaan Terdaftar (Tenants)
            </Text>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowStatusFilterModal(true)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                }}
              >
                <Filter size={14} color={theme.text} />
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                  {statusFilter === 'ALL' ? 'Filter' : statusFilter}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowAddTenantModal(true)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: theme.accent,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Plus size={14} color="#ffffff" />
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '600' }}>Tambah Tenant</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Responsive Table */}
          <View style={{ overflowX: 'auto', width: '100%' } as any}>
            <View style={{ minWidth: 700, width: '100%' }}>
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
                  paddingHorizontal: 16,
                }}
              >
                <View style={{ flex: 2.8, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Nama Perusahaan
                  </Text>
                </View>
                <View style={{ flex: 2.2, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Admin Utama
                  </Text>
                </View>
                <View style={{ flex: 1.5, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Paket Langganan
                  </Text>
                </View>
                <View style={{ flex: 1.2, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Pengguna
                  </Text>
                </View>
                <View style={{ flex: 1.2, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Status
                  </Text>
                </View>
                <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    Aksi
                  </Text>
                </View>
              </View>

              {/* Table Body */}
              {filteredTenants.length === 0 ? (
                <View style={{ paddingVertical: 45, alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={36} color={theme.textMuted} style={{ marginBottom: 10 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    Tidak ada perusahaan yang ditemukan
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Data tenant akan tampil di sini saat terdaftar
                  </Text>
                </View>
              ) : (
                filteredTenants.map((row, idx) => (
                <View
                  key={row.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: idx === filteredTenants.length - 1 ? 0 : 1,
                    borderBottomColor: theme.border,
                    backgroundColor: theme.cardBg,
                  }}
                >
                  {/* Nama Perusahaan */}
                  <View style={{ flex: 2.8, paddingRight: 12, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: row.initialsBg || theme.subtleBg,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontWeight: 'bold', color: row.initialsColor || theme.primaryBlue, fontSize: 13 }}>
                        {row.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>{row.name}</Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Terdaftar: {row.registeredDate}</Text>
                    </View>
                  </View>

                  {/* Admin Utama */}
                  <View style={{ flex: 2.2, paddingRight: 12 }}>
                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>{row.adminName}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>{row.adminEmail}</Text>
                  </View>

                  {/* Paket Langganan */}
                  <View style={{ flex: 1.5, paddingRight: 12 }}>
                    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                        {row.plan}
                      </Text>
                    </View>
                  </View>

                  {/* Pengguna */}
                  <View style={{ flex: 1.2, paddingRight: 12 }}>
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                      {row.userCount} / {row.maxUsers}
                    </Text>
                  </View>

                  {/* Status */}
                  <View style={{ flex: 1.2, paddingRight: 12 }}>
                    <View
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                        backgroundColor:
                          row.status === 'Aktif'
                            ? theme.successBg
                            : row.status === 'Tunggakan'
                            ? theme.warningBg
                            : theme.dangerBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color:
                            row.status === 'Aktif'
                              ? theme.successText
                              : row.status === 'Tunggakan'
                              ? theme.warningText
                              : theme.dangerText,
                        }}
                      >
                        {row.status}
                      </Text>
                    </View>
                  </View>

                  {/* Aksi */}
                  <View style={{ width: 80, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTenant(row);
                        setShowDetailModal(true);
                      }}
                      style={{ padding: 6, borderRadius: 6, backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.border, cursor: 'pointer' } as any}
                    >
                      <Eye size={16} color={theme.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                </View>
              )))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Tambah Tenant */}
      <Modal visible={showAddTenantModal} transparent animationType="fade" onRequestClose={() => setShowAddTenantModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Tambah Tenant Baru</Text>
              <TouchableOpacity onPress={() => setShowAddTenantModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Nama Perusahaan</Text>
                <TextInput
                  placeholder="Contoh: PT Sinar Abadi"
                  placeholderTextColor={theme.placeholder}
                  value={newCompanyName}
                  onChangeText={setNewCompanyName}
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Admin Utama</Text>
                <TextInput
                  placeholder="Nama Lengkap Admin"
                  placeholderTextColor={theme.placeholder}
                  value={newAdminName}
                  onChangeText={setNewAdminName}
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Email Admin</Text>
                <TextInput
                  placeholder="admin@perusahaan.co.id"
                  placeholderTextColor={theme.placeholder}
                  value={newAdminEmail}
                  onChangeText={setNewAdminEmail}
                  keyboardType="email-address"
                  style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                />
              </View>

              <View style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Paket</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
                    {(['Basic', 'Pro', 'Enterprise'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setNewPlan(p)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 6,
                          alignItems: 'center',
                          backgroundColor: newPlan === p ? theme.accent : theme.subtleBg,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: newPlan === p ? '#ffffff' : theme.textSecondary }}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ width: 110 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Kuota User</Text>
                  <TextInput
                    placeholder="50"
                    placeholderTextColor={theme.placeholder}
                    value={newMaxUsers}
                    onChangeText={setNewMaxUsers}
                    keyboardType="numeric"
                    style={{ backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: theme.text }}
                  />
                </View>
              </View>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setShowAddTenantModal(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTenant}
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: theme.accent }}
              >
                <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: '600' }}>Simpan Tenant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Detail Tenant */}
      <Modal visible={showDetailModal} transparent animationType="fade" onRequestClose={() => setShowDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Detail Perusahaan</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedTenant && (
              <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}>
                  <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: selectedTenant.initialsBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: selectedTenant.initialsColor }}>{selectedTenant.initials}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{selectedTenant.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Terdaftar: {selectedTenant.registeredDate}</Text>
                  </View>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Admin Utama:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{selectedTenant.adminName}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Email Kontak:</Text>
                  <Text style={{ fontSize: 13, color: theme.text }}>{selectedTenant.adminEmail}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Paket Langganan:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent }}>{selectedTenant.plan}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Penggunaan Kuota:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{selectedTenant.userCount} / {selectedTenant.maxUsers} Karyawan</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>Status Akun:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selectedTenant.status === 'Aktif' ? theme.successText : theme.warningText }}>
                    {selectedTenant.status}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: theme.accent }}
              >
                <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: '600' }}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Filter Status */}
      <Modal visible={showStatusFilterModal} transparent animationType="fade" onRequestClose={() => setShowStatusFilterModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, width: '100%', maxWidth: 360, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Filter Status Perusahaan</Text>
              <TouchableOpacity onPress={() => setShowStatusFilterModal(false)}>
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Tunggakan', value: 'Tunggakan' },
                { label: 'Nonaktif', value: 'Nonaktif' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setStatusFilter(opt.value as any);
                    setShowStatusFilterModal(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: statusFilter === opt.value ? theme.purpleBg : theme.subtleBg,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: statusFilter === opt.value ? '700' : '500', color: statusFilter === opt.value ? theme.accent : theme.text }}>
                    {opt.label}
                  </Text>
                  {statusFilter === opt.value && <Check size={16} color={theme.accent} />}
                </TouchableOpacity>
              ))}
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
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.successText }}>Tenant Baru Terdaftar</Text>
                <Text style={{ fontSize: 12, color: theme.isDark ? '#34d399' : '#047857', marginTop: 2 }}>CV Tech Indo berhasil mendaftar paket Pro.</Text>
              </View>
              <View style={{ padding: 12, backgroundColor: theme.infoBg, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.infoText }}>Backup Database Otomatis</Text>
                <Text style={{ fontSize: 12, color: theme.isDark ? '#60a5fa' : '#1d4ed8', marginTop: 2 }}>Backup multi-tenant harian berhasil disimpan pada 03:00 WIB.</Text>
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
