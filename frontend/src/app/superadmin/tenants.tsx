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
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
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
  Download,
  Plus,
  Eye,
  Edit2,
  Ban,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Building,
  Phone,
  Mail,
  Check,
  Sun,
  Moon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import api from '@/lib/api';

// Interface definitions matching the provided mockup
interface TenantCompany {
  id: number | string;
  tenantCodeId: string; // e.g., HY-SA-001
  name: string;
  code: string;
  schemaName?: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  plan: 'Enterprise' | 'Pro' | 'Basic';
  quota: {
    used: number;
    max: number;
  };
  subscriptionDate: string;
  status: 'Aktif' | 'Tunggakan' | 'Suspended';
  initials: string;
  initialsBg: string;
  initialsColor: string;
  initialsOpacity?: number;
}

export default function TenantManagementScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  // Navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data state
  const [companies, setCompanies] = useState<TenantCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeCompany, setActiveCompany] = useState<TenantCompany | null>(null);

  // Form states (Add / Edit)
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState<'Enterprise' | 'Pro' | 'Basic'>('Pro');
  const [formMaxUsers, setFormMaxUsers] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/super-admin/tenants');
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const loaded: TenantCompany[] = response.data.data.map((t: any, idx: number) => {
          const initials = (t.name || 'PT')
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          const shortCode = (t.code || t.name.slice(0, 2)).toUpperCase().replace(/[^A-Z]/g, '') || 'TN';
          const codeId = `HY-${shortCode}-${String(idx + 1).padStart(3, '0')}`;

          let planName: 'Enterprise' | 'Pro' | 'Basic' = 'Pro';
          if (t.plan === 'ENTERPRISE' || t.plan === 'Enterprise') planName = 'Enterprise';
          else if (t.plan === 'BASIC' || t.plan === 'Basic') planName = 'Basic';

          let statusName: 'Aktif' | 'Tunggakan' | 'Suspended' = 'Aktif';
          if (t.isActive === false) statusName = 'Suspended';

          let dateStr = 'Baru';
          if (t.createdAt) {
            try {
              dateStr = new Date(t.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
            } catch {
              dateStr = 'Baru';
            }
          }

          let initialsBg = '#dbeafe';
          let initialsColor = '#3b82f6';
          if (planName === 'Pro') {
            initialsBg = '#f3e8ff';
            initialsColor = '#9333ea';
          } else if (statusName === 'Suspended') {
            initialsBg = '#fee2e2';
            initialsColor = '#ef4444';
          }

          return {
            id: t.id,
            tenantCodeId: codeId,
            name: t.name,
            code: t.code || t.schemaName?.replace('tenant_', ''),
            schemaName: t.schemaName,
            contactPerson: {
              name: t.adminName || 'Admin Utama',
              email: t.adminEmail || 'admin@' + (t.code || 'tenant') + '.com',
              phone: t.adminPhone || '0812-3456-7890',
            },
            plan: planName,
            quota: {
              used: t.userCount || 0,
              max: t.maxUsers || 50,
            },
            subscriptionDate: dateStr,
            status: statusName,
            initials: initials || 'PT',
            initialsBg,
            initialsColor,
            initialsOpacity: statusName === 'Suspended' ? 0.6 : 1,
          };
        });

        setCompanies(loaded);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.log('Error fetching companies:', err);
      setCompanies([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCompanies();
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    router.replace('/');
  };

  // Filter logic
  const filteredCompanies = companies.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tenantCodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactPerson.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactPerson.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactPerson.phone.includes(searchQuery);

    const matchesPlan =
      selectedPlanFilter === 'ALL' || item.plan.toLowerCase() === selectedPlanFilter.toLowerCase();

    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'active' && item.status === 'Aktif') ||
      (selectedStatusFilter === 'warning' && item.status === 'Tunggakan') ||
      (selectedStatusFilter === 'suspended' && item.status === 'Suspended');

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID,Nama Perusahaan,Kontak Utama,Email,Telepon,Paket,Kuota Digunakan,Batas Kuota,Tgl Berlangganan,Status\n';
    const rows = filteredCompanies
      .map(
        (c) =>
          `"${c.tenantCodeId}","${c.name}","${c.contactPerson.name}","${c.contactPerson.email}","${c.contactPerson.phone}","${c.plan}","${c.quota.used}","${c.quota.max}","${c.subscriptionDate}","${c.status}"`
      )
      .join('\n');

    const csvContent = headers + rows;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `perusahaan-tenants-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export CSV Berhasil', `${filteredCompanies.length} data perusahaan siap diekspor.`);
    }
  };

  // Toggle Suspend / Restore Status
  const handleToggleSuspend = async (company: TenantCompany) => {
    const newStatus: 'Aktif' | 'Suspended' = company.status === 'Suspended' ? 'Aktif' : 'Suspended';
    try {
      if (newStatus === 'Suspended') {
        await api.patch(`/super-admin/tenants/${company.id}/deactivate`);
      } else {
        await api.patch(`/super-admin/tenants/${company.id}/activate`);
      }
    } catch {
      // Local demo fallback
    }

    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, status: newStatus } : c))
    );
    if (activeCompany && activeCompany.id === company.id) {
      setActiveCompany({ ...activeCompany, status: newStatus });
    }
  };

  // Save new Company
  const handleCreateCompany = async () => {
    if (!formName || !formContactEmail || !formPassword) {
      showError('Validasi Gagal', 'Nama Perusahaan, Email Admin, dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const schema = formCode || formName.toLowerCase().replace(/[^a-z0-9]/g, '') || `tenant_${Date.now()}`;

    try {
      const response = await api.post('/super-admin/tenants', {
        name: formName,
        schemaName: schema,
        adminName: formContactName || 'Admin ' + formName,
        adminEmail: formContactEmail,
        adminPassword: formPassword,
        plan: formPlan.toUpperCase(),
        maxUsers: parseInt(formMaxUsers, 10) || 50,
      });

      if (response.data?.success) {
        setShowAddModal(false);
        resetForm();
        fetchCompanies();
      } else {
        throw new Error(response.data?.message || 'Gagal menambahkan perusahaan');
      }
    } catch (err: any) {
      // Local fallback
      const initials = formName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const newComp: TenantCompany = {
        id: Date.now(),
        tenantCodeId: `HY-${initials}-${String(companies.length + 1).padStart(3, '0')}`,
        name: formName,
        code: schema,
        schemaName: `tenant_${schema}`,
        contactPerson: {
          name: formContactName || 'Admin',
          email: formContactEmail,
          phone: formContactPhone || '0812-0000-0000',
        },
        plan: formPlan,
        quota: {
          used: 1,
          max: parseInt(formMaxUsers, 10) || 50,
        },
        subscriptionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Aktif',
        initials: initials || 'PT',
        initialsBg: '#dbeafe',
        initialsColor: '#3b82f6',
      };

      setCompanies((prev) => [newComp, ...prev]);
      setShowAddModal(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (company: TenantCompany) => {
    setActiveCompany(company);
    setFormName(company.name);
    setFormCode(company.code);
    setFormContactName(company.contactPerson.name);
    setFormContactEmail(company.contactPerson.email);
    setFormContactPhone(company.contactPerson.phone);
    setFormPlan(company.plan);
    setFormMaxUsers(String(company.quota.max));
    setShowEditModal(true);
  };

  // Update existing company
  const handleUpdateCompany = async () => {
    if (!activeCompany) return;
    setIsSubmitting(true);

    try {
      await api.put(`/super-admin/tenants/${activeCompany.id}`, {
        name: formName,
        plan: formPlan.toUpperCase(),
        maxUsers: parseInt(formMaxUsers, 10) || 50,
      });
    } catch {
      // Local demo fallback
    }

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === activeCompany.id
          ? {
              ...c,
              name: formName,
              plan: formPlan,
              contactPerson: {
                ...c.contactPerson,
                name: formContactName,
                email: formContactEmail,
                phone: formContactPhone,
              },
              quota: {
                ...c.quota,
                max: parseInt(formMaxUsers, 10) || c.quota.max,
              },
            }
          : c
      )
    );

    setIsSubmitting(false);
    setShowEditModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormContactName('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormPassword('');
    setFormPlan('Pro');
    setFormMaxUsers('50');
    setActiveCompany(null);
  };

  // Badge renderer
  const renderStatusBadge = (status: 'Aktif' | 'Tunggakan' | 'Suspended') => {
    if (status === 'Aktif') {
      return (
        <View className="bg-[#d1fae5] px-3 py-1 rounded-full items-center justify-center min-w-[80px]">
          <Text className="text-[#10b981] text-xs font-semibold">Aktif</Text>
        </View>
      );
    }
    if (status === 'Tunggakan') {
      return (
        <View className="bg-[#fef3c7] px-3 py-1 rounded-full items-center justify-center min-w-[80px]">
          <Text className="text-[#d97706] text-xs font-semibold">Tunggakan</Text>
        </View>
      );
    }
    return (
      <View className="bg-[#fee2e2] px-3 py-1 rounded-full items-center justify-center min-w-[80px]">
        <Text className="text-[#ef4444] text-xs font-semibold">Suspended</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg, height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/tenants"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Page Content */}
      <View style={{ flex: 1, flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Sticky Topbar */}
        <View style={{ backgroundColor: theme.cardBg, paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, zIndex: 10 }}>
          <View className="flex-row items-center">
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => setIsMobileMenuOpen(true)}
                className="mr-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700"
              >
                <Menu size={20} color="#111827" />
              </TouchableOpacity>
            )}
            <Text className="text-xl md:text-2xl font-bold text-[#111827] dark:text-white">
              Manajemen Perusahaan
            </Text>
          </View>

          <View className="flex-row items-center gap-3 md:gap-4">
            {/* Theme Toggle */}
            <TouchableOpacity
              onPress={theme.toggleTheme}
              title={theme.isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="p-2 bg-white dark:bg-slate-900 border border-[#e5e7eb] dark:border-slate-700 rounded-full"
            >
              {theme.isDark ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color="#6b7280" />
              )}
            </TouchableOpacity>

            {/* Notification bell */}
            <TouchableOpacity
              onPress={() => setShowNotifModal(true)}
              className="relative p-2 bg-white dark:bg-slate-900 border border-[#e5e7eb] dark:border-slate-700 rounded-full"
            >
              <Bell size={19} color="#6b7280" />
              <View className="absolute -top-1 -right-1 bg-[#ef4444] rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center">
                <Text className="text-white text-[10px] font-bold">3</Text>
              </View>
            </TouchableOpacity>

            {/* Profile pill */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex-row items-center bg-white dark:bg-slate-900 pl-1.5 pr-3 py-1 rounded-full border border-[#e5e7eb] dark:border-slate-700"
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  className="w-8 h-8 rounded-full mr-2.5"
                />
                <View className="mr-2">
                  <Text className="text-xs font-semibold text-[#111827] dark:text-white">
                    {user?.name || 'Andi Setiawan'}
                  </Text>
                  <Text className="text-[10px] text-[#2a75d3] font-medium">Super Admin</Text>
                </View>
                <ChevronDown size={14} color="#6b7280" />
              </TouchableOpacity>

              {showProfileDropdown && (
                <View className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-[#e5e7eb] dark:border-slate-700 p-2 z-50">
                  <View className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <Text className="text-xs font-bold text-[#111827] dark:text-white">
                      {user?.email || 'admin@hadiryuk.id'}
                    </Text>
                    <Text className="text-[10px] text-[#10b981] font-semibold mt-0.5">● Super Admin</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfileDropdown(false);
                      router.push('/superadmin');
                    }}
                    className="flex-row items-center px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <PieChart size={14} color="#6b7280" className="mr-2" />
                    <Text className="text-xs text-slate-700 dark:text-slate-300 ml-2">Dashboard Ikhtisar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLogout}
                    className="flex-row items-center px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                  >
                    <LogOut size={14} color="#ef4444" className="mr-2" />
                    <Text className="text-xs font-semibold text-red-500 ml-2">Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          className="flex-1 px-4 md:px-6 pt-2 pb-10"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {/* Action Toolbar & Filters */}
          <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-[#e5e7eb] dark:border-slate-800 shadow-sm mb-5 flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Filters */}
            <View className="flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search box */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 flex-1 max-w-full sm:max-w-xs">
                <Search size={16} color="#6b7280" />
                <TextInput
                  placeholder="Cari ID atau nama perusahaan..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="ml-2 flex-1 text-xs md:text-sm text-[#111827] dark:text-white outline-none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter: Paket */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 px-3 py-1.5">
                <Text className="text-xs text-slate-500 mr-2">Paket:</Text>
                {(['ALL', 'Basic', 'Pro', 'Enterprise'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedPlanFilter(p)}
                    className={`px-2 py-1 rounded-md ${
                      selectedPlanFilter === p
                        ? 'bg-[#2a75d3] text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedPlanFilter === p ? 'text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p === 'ALL' ? 'Semua' : p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter: Status */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 px-3 py-1.5">
                <Text className="text-xs text-slate-500 mr-2">Status:</Text>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'active', label: 'Aktif' },
                  { key: 'warning', label: 'Tunggakan' },
                  { key: 'suspended', label: 'Suspended' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSelectedStatusFilter(s.key)}
                    className={`px-2 py-1 rounded-md ${
                      selectedStatusFilter === s.key
                        ? 'bg-[#2a75d3] text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedStatusFilter === s.key ? 'text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Right: Actions */}
            <View className="flex-row items-center gap-2.5 self-end sm:self-auto">
              <TouchableOpacity
                onPress={handleExportCSV}
                className="flex-row items-center px-3.5 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#f9fafb]"
              >
                <Download size={15} color="#111827" className="mr-1.5" />
                <Text className="text-xs font-semibold text-[#111827] dark:text-white ml-1.5">
                  Export CSV
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-row items-center px-4 py-2 rounded-lg bg-[#2a75d3] hover:bg-[#1d4ed8] shadow-sm"
              >
                <Plus size={15} color="#ffffff" className="mr-1.5" />
                <Text className="text-xs font-bold text-white ml-1.5">Tambah Perusahaan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Panel Table: Tenant List */}
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ minWidth: '100%' }}
            >
              <View style={{ minWidth: 960, width: '100%', flex: 1 }}>
                {/* Table Header */}
                <View
                  style={{
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
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Perusahaan / Tenant
                    </Text>
                  </View>
                  <View style={{ flex: 2.2, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Kontak Utama
                    </Text>
                  </View>
                  <View style={{ flex: 1.2, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Paket
                    </Text>
                  </View>
                  <View style={{ flex: 1.6, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Kuota Pengguna
                    </Text>
                  </View>
                  <View style={{ flex: 1.5, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Tgl Berlangganan
                    </Text>
                  </View>
                  <View style={{ flex: 1.2, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Status
                    </Text>
                  </View>
                  <View style={{ width: 90, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                      Aksi
                    </Text>
                  </View>
                </View>

                {/* Table Body */}
                {filteredCompanies.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={40} color={theme.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                      Tidak ada perusahaan yang ditemukan
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Coba ganti filter atau kata kunci pencarian Anda
                    </Text>
                  </View>
                ) : (
                  filteredCompanies.map((item, index) => {
                    const isSuspended = item.status === 'Suspended';
                    const quotaPercent = Math.min(100, Math.round((item.quota.used / (item.quota.max || 1)) * 100));

                    // Progress bar color based on percentage
                    let progressBarColor = theme.success;
                    if (quotaPercent >= 90) progressBarColor = theme.warning;
                    if (isSuspended) progressBarColor = theme.textMuted;

                    return (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: index < filteredCompanies.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                          backgroundColor: isSuspended ? (theme.isDark ? '#141e33' : '#fafbfe') : theme.cardBg,
                        }}
                      >
                        {/* Perusahaan / Tenant */}
                        <View style={{ flex: 2.8, paddingRight: 12, flexDirection: 'row', alignItems: 'center' }}>
                          <View
                            style={{
                              backgroundColor: item.initialsBg || theme.subtleBg,
                              opacity: item.initialsOpacity ?? 1,
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 10,
                            }}
                          >
                            <Text
                              style={{ color: item.initialsColor || theme.primaryBlue, fontSize: 13, fontWeight: 'bold' }}
                            >
                              {item.initials}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: isSuspended ? theme.textMuted : theme.text,
                                marginBottom: 2,
                              }}
                            >
                              {item.name}
                            </Text>
                            <View style={{ alignSelf: 'flex-start', backgroundColor: theme.subtleBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: theme.textMuted }}>
                                {item.tenantCodeId}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Kontak Utama */}
                        <View style={{ flex: 2.2, paddingRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: isSuspended ? theme.textMuted : theme.text,
                            }}
                          >
                            {item.contactPerson.name}
                          </Text>
                          <Text numberOfLines={1} style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
                            {item.contactPerson.email}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>
                            {item.contactPerson.phone}
                          </Text>
                        </View>

                        {/* Paket */}
                        <View style={{ flex: 1.2, paddingRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '700',
                              color: item.plan === 'Enterprise' ? theme.primaryBlue : theme.text,
                            }}
                          >
                            {item.plan}
                          </Text>
                        </View>

                        {/* Kuota Pengguna */}
                        <View style={{ flex: 1.6, paddingRight: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: isSuspended ? theme.textMuted : theme.text }}>
                              {item.quota.used}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>
                              {' '}/ {item.quota.max}
                            </Text>
                          </View>
                          {/* Visual progress bar */}
                          <View style={{ width: '100%', height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' }}>
                            <View
                              style={{
                                width: `${quotaPercent}%`,
                                backgroundColor: progressBarColor,
                                height: '100%',
                                borderRadius: 3,
                              }}
                            />
                          </View>
                        </View>

                        {/* Tgl Berlangganan */}
                        <View style={{ flex: 1.5, paddingRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              color: isSuspended ? theme.textMuted : theme.text,
                            }}
                          >
                            {item.subscriptionDate}
                          </Text>
                        </View>

                        {/* Status */}
                        <View style={{ flex: 1.2, paddingRight: 12 }}>{renderStatusBadge(item.status)}</View>

                        {/* Aksi */}
                        <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {/* Lihat Detail */}
                          <TouchableOpacity
                            onPress={() => {
                              setActiveCompany(item);
                              setShowDetailModal(true);
                            }}
                            style={{ padding: 4 }}
                          >
                            <Eye size={17} color={theme.textMuted} />
                          </TouchableOpacity>

                          {/* Edit (if active or warning) */}
                          {!isSuspended && (
                            <TouchableOpacity
                              onPress={() => handleOpenEdit(item)}
                              style={{ padding: 4 }}
                            >
                              <Edit2 size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                          )}

                          {/* Suspend or Pulihkan */}
                          {isSuspended ? (
                            <TouchableOpacity
                              onPress={() => handleToggleSuspend(item)}
                              style={{ padding: 4 }}
                            >
                              <RotateCcw size={16} color={theme.success} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleToggleSuspend(item)}
                              style={{ padding: 4 }}
                            >
                              <Ban size={16} color={theme.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            <View className="flex-row items-center justify-between px-5 py-4 border-t border-[#e5e7eb] dark:border-slate-800 bg-white dark:bg-slate-900">
              <Text className="text-xs text-[#6b7280] dark:text-slate-400">
                Menampilkan {filteredCompanies.length > 0 ? 1 : 0} - {filteredCompanies.length} dari {companies.length} Perusahaan
              </Text>

              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  disabled
                  className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800 opacity-50"
                >
                  <ChevronLeft size={14} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity className="w-8 h-8 rounded-md bg-[#2a75d3] border border-[#2a75d3] items-center justify-center">
                  <Text className="text-xs font-bold text-white">1</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800">
                  <Text className="text-xs font-medium text-[#111827] dark:text-white">2</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800">
                  <Text className="text-xs font-medium text-[#111827] dark:text-white">3</Text>
                </TouchableOpacity>

                <View className="w-6 items-center justify-center">
                  <Text className="text-xs text-slate-400">...</Text>
                </View>

                <TouchableOpacity className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800">
                  <Text className="text-xs font-medium text-[#111827] dark:text-white">12</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800">
                  <ChevronRight size={14} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* MODAL: TAMBAH PERUSAHAAN */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-2.5">
                  <Building2 size={18} color="#2a75d3" />
                </View>
                <Text className="text-lg font-bold text-[#111827] dark:text-white">
                  Tambah Perusahaan Baru
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[460px] pr-1" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              <View className="gap-3.5">
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan *
                  </Text>
                  <TextInput
                    placeholder="Contoh: PT Surya Kencana"
                    placeholderTextColor="#9ca3af"
                    value={formName}
                    onChangeText={setFormName}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Subdomain / Schema
                  </Text>
                  <TextInput
                    placeholder="suryakencana (tanpa spasi)"
                    placeholderTextColor="#9ca3af"
                    value={formCode}
                    onChangeText={setFormCode}
                    autoCapitalize="none"
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kontak Utama
                    </Text>
                    <TextInput
                      placeholder="Nama PIC"
                      placeholderTextColor="#9ca3af"
                      value={formContactName}
                      onChangeText={setFormContactName}
                      className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      No. Telepon / WhatsApp
                    </Text>
                    <TextInput
                      placeholder="0812-3456-7890"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      value={formContactPhone}
                      onChangeText={setFormContactPhone}
                      className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Admin Utama *
                  </Text>
                  <TextInput
                    placeholder="admin@suryakencana.co.id"
                    placeholderTextColor="#9ca3af"
                    value={formContactEmail}
                    onChangeText={setFormContactEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Awal Admin *
                  </Text>
                  <TextInput
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={formPassword}
                    onChangeText={setFormPassword}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                {/* Pilih Paket */}
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pilih Paket Langganan
                  </Text>
                  <View className="flex-row gap-2">
                    {(['Basic', 'Pro', 'Enterprise'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setFormPlan(p)}
                        className={`flex-1 py-2.5 items-center rounded-xl border ${
                          formPlan === p
                            ? 'bg-[#2a75d3] border-[#2a75d3]'
                            : 'border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            formPlan === p ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Maksimal Kuota Pengguna
                  </Text>
                  <TextInput
                    placeholder="50"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={formMaxUsers}
                    onChangeText={setFormMaxUsers}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-slate-700"
              >
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCompany}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#2a75d3] hover:bg-[#1d4ed8] flex-row items-center"
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
                <Text className="text-xs font-bold text-white">Simpan Perusahaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT PERUSAHAAN */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-2.5">
                  <Edit2 size={18} color="#2a75d3" />
                </View>
                <Text className="text-lg font-bold text-[#111827] dark:text-white">
                  Edit Data Perusahaan
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[460px] pr-1" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              <View className="gap-3.5">
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan
                  </Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kontak Utama
                    </Text>
                    <TextInput
                      value={formContactName}
                      onChangeText={setFormContactName}
                      className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telepon / WA
                    </Text>
                    <TextInput
                      value={formContactPhone}
                      onChangeText={setFormContactPhone}
                      className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Kontak
                  </Text>
                  <TextInput
                    value={formContactEmail}
                    onChangeText={setFormContactEmail}
                    autoCapitalize="none"
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                {/* Pilih Paket */}
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Paket Langganan
                  </Text>
                  <View className="flex-row gap-2">
                    {(['Basic', 'Pro', 'Enterprise'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setFormPlan(p)}
                        className={`flex-1 py-2.5 items-center rounded-xl border ${
                          formPlan === p
                            ? 'bg-[#2a75d3] border-[#2a75d3]'
                            : 'border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            formPlan === p ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Kuota Pengguna
                  </Text>
                  <TextInput
                    value={formMaxUsers}
                    onChangeText={setFormMaxUsers}
                    keyboardType="numeric"
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-slate-700"
              >
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateCompany}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#2a75d3] hover:bg-[#1d4ed8] flex-row items-center"
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
                <Text className="text-xs font-bold text-white">Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: DETAIL PERUSAHAAN */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            {activeCompany && (
              <View>
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: activeCompany.initialsBg }}
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                    >
                      <Text style={{ color: activeCompany.initialsColor }} className="text-sm font-bold">
                        {activeCompany.initials}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-bold text-[#111827] dark:text-white">
                        {activeCompany.name}
                      </Text>
                      <Text className="text-xs text-[#6b7280] font-mono">
                        {activeCompany.tenantCodeId}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <X size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Information rows */}
                <View className="gap-2.5 mb-5">
                  <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500">Status Akun</Text>
                    {renderStatusBadge(activeCompany.status)}
                  </View>
                  <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500">Paket Langganan</Text>
                    <Text className="text-xs font-bold text-[#2a75d3]">{activeCompany.plan}</Text>
                  </View>
                  <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500">Kontak Utama</Text>
                    <View className="items-end">
                      <Text className="text-xs font-semibold text-[#111827] dark:text-white">
                        {activeCompany.contactPerson.name}
                      </Text>
                      <Text className="text-[11px] text-slate-400">
                        {activeCompany.contactPerson.email}
                      </Text>
                      <Text className="text-[11px] text-slate-400">
                        {activeCompany.contactPerson.phone}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500">Penggunaan Kuota</Text>
                    <Text className="text-xs font-semibold text-[#111827] dark:text-white">
                      {activeCompany.quota.used} / {activeCompany.quota.max} Akun
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text className="text-xs text-slate-500">Tanggal Terdaftar</Text>
                    <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {activeCompany.subscriptionDate}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setShowDetailModal(false);
                      handleOpenEdit(activeCompany);
                    }}
                    className="py-2.5 rounded-xl items-center bg-[#2a75d3] hover:bg-[#1d4ed8]"
                  >
                    <Text className="text-xs font-bold text-white">Edit Informasi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleSuspend(activeCompany)}
                    className={`py-2.5 rounded-xl items-center border ${
                      activeCompany.status === 'Suspended'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-600'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        activeCompany.status === 'Suspended' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {activeCompany.status === 'Suspended' ? 'Pulihkan Akun Perusahaan' : 'Suspend Perusahaan'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowDetailModal(false)}
                    className="py-2.5 rounded-xl items-center bg-slate-100 dark:bg-slate-800 mt-1"
                  >
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: NOTIFIKASI */}
      <Modal visible={showNotifModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-5">
            <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
              <View className="flex-row items-center">
                <Bell size={18} color="#2a75d3" className="mr-2" />
                <Text className="text-sm font-bold text-[#111827] dark:text-white ml-2">
                  Notifikasi Sistem (3)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100">
                <Text className="text-xs font-bold text-red-800 dark:text-red-300">
                  Tagihan Belum Dibayar
                </Text>
                <Text className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                  Maju Djaya Corp memiliki tunggakan paket langganan 14 hari.
                </Text>
              </View>
              <View className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100">
                <Text className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  Tenant Baru Terdaftar
                </Text>
                <Text className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                  PT Sinar Jaya berhasil didaftarkan dan schema database aktif.
                </Text>
              </View>
              <View className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100">
                <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Backup Database Otomatis
                </Text>
                <Text className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Backup multi-tenant berhasil diselesaikan pada pukul 03:00 WIB.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowNotifModal(false)}
              className="mt-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
            >
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
