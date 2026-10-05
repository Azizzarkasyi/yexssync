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
  EyeOff,
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
import SuperAdminTopHeader from '@/components/SuperAdminTopHeader';
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
  const isDesktop = width >= 768;
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
  const [showFormPassword, setShowFormPassword] = useState(false);
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

          const shortCode = (t.code || t.name.slice(0, 2)).toUpperCase().replace(/[^A-Z]/g, '') || 'YS';
          const codeId = `YS-${shortCode}-${String(idx + 1).padStart(3, '0')}`;

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
              phone: t.adminPhone || '-',
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
    setShowFormPassword(false);
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
        {/* Scrollable Content Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: isDesktop ? 24 : 16,
            paddingBottom: 60,
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {/* Harmonized Super Admin Header */}
          <SuperAdminTopHeader
            title="Data Perusahaan"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Action Toolbar & Filters */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 20,
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'stretch',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            {/* Left: Filters */}
            <View
              style={{
                flex: 1,
                flexDirection: isDesktop ? 'row' : 'column',
                alignItems: isDesktop ? 'center' : 'stretch',
                gap: 12,
              }}
            >
              {/* Search box */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flex: isDesktop ? 1 : undefined,
                  maxWidth: isDesktop ? 320 : '100%',
                }}
              >
                <Search size={16} color={theme.textMuted} />
                <TextInput
                  placeholder="Cari ID atau nama perusahaan..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    marginLeft: 8,
                    flex: 1,
                    fontSize: 13,
                    color: theme.text,
                    outlineStyle: 'none',
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                  } as any}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter: Paket */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexWrap: 'wrap',
                }}
              >
                <Text style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>Paket:</Text>
                {(['ALL', 'Basic', 'Pro', 'Enterprise'] as const).map((p) => {
                  const isSelected = selectedPlanFilter === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setSelectedPlanFilter(p)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: isSelected ? theme.primaryBlue : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#ffffff' : theme.text,
                        }}
                      >
                        {p === 'ALL' ? 'Semua' : p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter: Status */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexWrap: 'wrap',
                }}
              >
                <Text style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>Status:</Text>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'active', label: 'Aktif' },
                  { key: 'warning', label: 'Tunggakan' },
                  { key: 'suspended', label: 'Suspended' },
                ].map((s) => {
                  const isSelected = selectedStatusFilter === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setSelectedStatusFilter(s.key)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: isSelected ? theme.primaryBlue : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#ffffff' : theme.text,
                        }}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Right: Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: isDesktop ? 'auto' : 'flex-end' }}>
              <TouchableOpacity
                onPress={handleExportCSV}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  gap: 6,
                }}
              >
                <Download size={15} color={theme.text} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                  Export CSV
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.primaryBlue,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 8,
                  gap: 6,
                }}
              >
                <Plus size={15} color="#ffffff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Tambah Perusahaan</Text>
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                backgroundColor: theme.cardBg,
              }}
            >
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                Menampilkan {filteredCompanies.length > 0 ? 1 : 0} - {filteredCompanies.length} dari {companies.length} Perusahaan
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.cardBg,
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {Array.from({ length: Math.max(1, Math.ceil(filteredCompanies.length / 10)) }, (_, i) => i + 1).map((p) => {
                  const isActive = currentPage === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setCurrentPage(p)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: isActive ? theme.primaryBlue : theme.cardBg,
                        borderWidth: 1,
                        borderColor: isActive ? theme.primaryBlue : theme.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: isActive ? '700' : '500', color: isActive ? '#ffffff' : theme.text }}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  disabled={currentPage >= Math.max(1, Math.ceil(filteredCompanies.length / 10))}
                  onPress={() => setCurrentPage(Math.min(Math.max(1, Math.ceil(filteredCompanies.length / 10)), currentPage + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.cardBg,
                    opacity: currentPage >= Math.max(1, Math.ceil(filteredCompanies.length / 10)) ? 0.4 : 1,
                  }}
                >
                  <ChevronRight size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* MODAL: TAMBAH PERUSAHAAN */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: theme.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Building2 size={18} color={theme.primaryBlue} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                  Tambah Perusahaan Baru
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Nama Perusahaan *
                  </Text>
                  <TextInput
                    placeholder="Contoh: PT Nama Perusahaan"
                    placeholderTextColor={theme.placeholder}
                    value={formName}
                    onChangeText={setFormName}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Kode Subdomain / Schema
                  </Text>
                  <TextInput
                    placeholder="suryakencana (tanpa spasi)"
                    placeholderTextColor={theme.placeholder}
                    value={formCode}
                    onChangeText={setFormCode}
                    autoCapitalize="none"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Kontak Utama
                    </Text>
                    <TextInput
                      placeholder="Nama PIC"
                      placeholderTextColor={theme.placeholder}
                      value={formContactName}
                      onChangeText={setFormContactName}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      No. Telepon / WhatsApp
                    </Text>
                    <TextInput
                      placeholder="0812-3456-7890"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="phone-pad"
                      value={formContactPhone}
                      onChangeText={setFormContactPhone}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Email Admin Utama *
                  </Text>
                  <TextInput
                    placeholder="admin@suryakencana.co.id"
                    placeholderTextColor={theme.placeholder}
                    value={formContactEmail}
                    onChangeText={setFormContactEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Password Awal Admin *
                  </Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <TextInput
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={theme.placeholder}
                      secureTextEntry={!showFormPassword}
                      value={formPassword}
                      onChangeText={setFormPassword}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        paddingRight: 40,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                    <TouchableOpacity
                      onPress={() => setShowFormPassword(!showFormPassword)}
                      style={{ position: 'absolute', right: 10, padding: 4 }}
                    >
                      {showFormPassword ? (
                        <EyeOff size={16} color={theme.textMuted} />
                      ) : (
                        <Eye size={16} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Pilih Paket */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Pilih Paket Langganan
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['Basic', 'Pro', 'Enterprise'] as const).map((p) => {
                      const isSelected = formPlan === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setFormPlan(p)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.primaryBlue : theme.border,
                            backgroundColor: isSelected ? theme.primaryBlue : theme.cardBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: isSelected ? '#ffffff' : theme.text,
                            }}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Batas Maksimal Kuota Pengguna
                  </Text>
                  <TextInput
                    placeholder="50"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={formMaxUsers}
                    onChangeText={setFormMaxUsers}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCompany}
                disabled={isSubmitting}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: theme.primaryBlue,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Daftarkan Perusahaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT PERUSAHAAN */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: theme.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Edit2 size={18} color={theme.primaryBlue} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                  Edit Data Perusahaan
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Nama Perusahaan
                  </Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Kontak Utama
                    </Text>
                    <TextInput
                      value={formContactName}
                      onChangeText={setFormContactName}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                      Telepon / WA
                    </Text>
                    <TextInput
                      value={formContactPhone}
                      onChangeText={setFormContactPhone}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Email Kontak
                  </Text>
                  <TextInput
                    value={formContactEmail}
                    onChangeText={setFormContactEmail}
                    autoCapitalize="none"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                {/* Pilih Paket */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Paket Langganan
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['Basic', 'Pro', 'Enterprise'] as const).map((p) => {
                      const isSelected = formPlan === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setFormPlan(p)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.primaryBlue : theme.border,
                            backgroundColor: isSelected ? theme.primaryBlue : theme.cardBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: isSelected ? '#ffffff' : theme.text,
                            }}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Batas Kuota Pengguna
                  </Text>
                  <TextInput
                    value={formMaxUsers}
                    onChangeText={setFormMaxUsers}
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateCompany}
                disabled={isSubmitting}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: theme.primaryBlue,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: DETAIL PERUSAHAAN */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              width: '100%',
              maxWidth: 460,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {activeCompany && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        backgroundColor: activeCompany.initialsBg,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: activeCompany.initialsColor, fontSize: 14, fontWeight: '700' }}>
                        {activeCompany.initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                        {activeCompany.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {activeCompany.tenantCodeId}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <X size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Information rows */}
                <View style={{ gap: 10, marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Status Akun</Text>
                    {renderStatusBadge(activeCompany.status)}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Paket Langganan</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryBlue }}>{activeCompany.plan}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Kontak Utama</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                        {activeCompany.contactPerson.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>
                        {activeCompany.contactPerson.email}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>
                        {activeCompany.contactPerson.phone}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Penggunaan Kuota</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                      {activeCompany.quota.used} / {activeCompany.quota.max} Akun
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Tanggal Terdaftar</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: theme.text }}>
                      {activeCompany.subscriptionDate}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDetailModal(false);
                      handleOpenEdit(activeCompany);
                    }}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: theme.primaryBlue,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Edit Informasi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleSuspend(activeCompany)}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: activeCompany.status === 'Suspended' ? theme.success : theme.danger,
                      backgroundColor: activeCompany.status === 'Suspended' ? theme.successBg : theme.dangerBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: activeCompany.status === 'Suspended' ? theme.success : theme.danger,
                      }}
                    >
                      {activeCompany.status === 'Suspended' ? 'Pulihkan Akun Perusahaan' : 'Suspend Perusahaan'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowDetailModal(false)}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: theme.border,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
