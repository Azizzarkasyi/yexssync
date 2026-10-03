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
  UserPlus,
  ShieldCheck,
  Receipt,
  Edit2,
  KeyRound,
  Trash2,
  RotateCcw,
  UserX,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
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

// Interface definitions
interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  initialsBg?: string;
  initialsColor?: string;
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE';
  roleLabel: string;
  department: string;
  lastLogin: {
    timeText: string;
    ipText: string;
  };
  status: 'Aktif' | 'Non-Aktif';
  isCurrentUser?: boolean;
}

export default function CentralAdminManagementScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  // Navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Data state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form states (Add/Edit)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE'>('SUPPORT');
  const [formDepartment, setFormDepartment] = useState('Customer Success');
  const [formPassword, setFormPassword] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Populate with real superadmin user from session
    if (user) {
      const initials = (user.name || 'SA')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      setAdmins([
        {
          id: user.id || 1,
          name: user.name || 'Super Admin',
          email: user.email || '',
          role: 'SUPER_ADMIN',
          roleLabel: 'Super Admin',
          department: 'IT / Super Admin',
          lastLogin: {
            timeText: 'Sesi Aktif',
            ipText: 'Online',
          },
          status: 'Aktif',
          isCurrentUser: true,
          initials,
          initialsBg: '#ede9fe',
          initialsColor: '#8b5cf6',
        },
      ]);
    } else {
      setAdmins([]);
    }
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    router.replace('/');
  };

  // Filtered admin records
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'ALL' ||
      (selectedRoleFilter === 'superadmin' && admin.role === 'SUPER_ADMIN') ||
      (selectedRoleFilter === 'support' && admin.role === 'SUPPORT') ||
      (selectedRoleFilter === 'finance' && admin.role === 'FINANCE');

    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'active' && admin.status === 'Aktif') ||
      (selectedStatusFilter === 'inactive' && admin.status === 'Non-Aktif');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Action: Tambah Admin
  const handleCreateAdmin = () => {
    if (!formName || !formEmail || !formPassword) {
      showError('Validasi Gagal', 'Nama, Email, dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const initials = formName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    let roleLabel = 'Tim Support';
    let initialsColor = '#3b82f6';
    let initialsBg = '#dbeafe';

    if (formRole === 'SUPER_ADMIN') {
      roleLabel = 'Super Admin';
      initialsColor = '#8b5cf6';
      initialsBg = '#ede9fe';
    } else if (formRole === 'FINANCE') {
      roleLabel = 'Finance';
      initialsColor = '#10b981';
      initialsBg = '#d1fae5';
    }

    const newAdmin: AdminUser = {
      id: Date.now(),
      name: formName,
      email: formEmail,
      initials,
      initialsBg,
      initialsColor,
      role: formRole,
      roleLabel,
      department: formDepartment,
      lastLogin: {
        timeText: 'Belum login',
        ipText: '-',
      },
      status: 'Aktif',
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setIsSubmitting(false);
    setShowAddModal(false);
    resetForm();
  };

  // Action: Edit Admin
  const handleOpenEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormRole(admin.role);
    setFormDepartment(admin.department);
    setShowEditModal(true);
  };

  const handleUpdateAdmin = () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);

    let roleLabel = 'Tim Support';
    if (formRole === 'SUPER_ADMIN') roleLabel = 'Super Admin';
    else if (formRole === 'FINANCE') roleLabel = 'Finance';

    setAdmins((prev) =>
      prev.map((a) =>
        a.id === selectedAdmin.id
          ? {
              ...a,
              name: formName,
              email: formEmail,
              role: formRole,
              roleLabel,
              department: formDepartment,
            }
          : a
      )
    );

    setIsSubmitting(false);
    setShowEditModal(false);
    resetForm();
  };

  // Action: Toggle Aktif / Non-Aktif (Pulihkan)
  const handleToggleStatus = (admin: AdminUser) => {
    const nextStatus = admin.status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
    );
  };

  // Action: Reset Password
  const handleResetPassword = () => {
    if (!newResetPassword || newResetPassword.length < 6) {
      showError('Validasi Gagal', 'Password baru minimal 6 karakter.');
      return;
    }
    setShowResetPasswordModal(false);
    setNewResetPassword('');
    if (Platform.OS === 'web') {
      window.alert(`Password untuk ${selectedAdmin?.name} berhasil diperbarui.`);
    } else {
      Alert.alert('Sukses', `Password untuk ${selectedAdmin?.name} berhasil diperbarui.`);
    }
  };

  // Action: Hapus Admin
  const handleDeleteAdmin = (admin: AdminUser) => {
    if (admin.isCurrentUser) {
      showError('Aksi Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const doDelete = () => {
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Yakin ingin menghapus admin ${admin.name}?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Yakin ingin menghapus admin ${admin.name}?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('SUPPORT');
    setFormDepartment('Customer Success');
    setFormPassword('');
    setSelectedAdmin(null);
  };

  // Role Badge Component
  const renderRoleBadge = (role: AdminUser['role'], isInactive: boolean) => {
    const opacityClass = isInactive ? 'opacity-60' : '';

    if (role === 'SUPER_ADMIN') {
      return (
        <View className={`flex-row items-center bg-[#ede9fe] dark:bg-purple-950/40 px-2.5 py-1 rounded-md self-start ${opacityClass}`}>
          <ShieldCheck size={14} color="#8b5cf6" className="mr-1" />
          <Text className="text-xs font-semibold text-[#8b5cf6] ml-1">Super Admin</Text>
        </View>
      );
    }
    if (role === 'SUPPORT') {
      return (
        <View className={`flex-row items-center bg-[#dbeafe] dark:bg-blue-950/40 px-2.5 py-1 rounded-md self-start ${opacityClass}`}>
          <Headphones size={14} color="#3b82f6" className="mr-1" />
          <Text className="text-xs font-semibold text-[#3b82f6] ml-1">Tim Support</Text>
        </View>
      );
    }
    return (
      <View className={`flex-row items-center bg-[#d1fae5] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md self-start ${opacityClass}`}>
        <Receipt size={14} color="#10b981" className="mr-1" />
        <Text className="text-xs font-semibold text-[#10b981] ml-1">Finance</Text>
      </View>
    );
  };

  // Status Badge Component
  const renderStatusBadge = (status: AdminUser['status']) => {
    if (status === 'Aktif') {
      return (
        <View className="bg-[#d1fae5] px-3 py-1 rounded-full items-center justify-center self-start">
          <Text className="text-[#10b981] text-xs font-semibold">Aktif</Text>
        </View>
      );
    }
    return (
      <View className="bg-[#f3f4f6] dark:bg-slate-800 px-3 py-1 rounded-full items-center justify-center self-start">
        <Text className="text-[#6b7280] dark:text-slate-400 text-xs font-semibold">Non-Aktif</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg, height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/admins"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content View */}
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
              Manajemen Admin Pusat
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

            <TouchableOpacity
              onPress={() => setShowNotifModal(true)}
              className="relative p-2 bg-white dark:bg-slate-900 border border-[#e5e7eb] dark:border-slate-700 rounded-full"
            >
              <Bell size={19} color="#6b7280" />
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
                    {user?.name || 'Super Admin'}
                  </Text>
                  <Text className="text-[10px] text-[#2a75d3] font-medium">Super Admin</Text>
                </View>
                <ChevronDown size={14} color="#6b7280" />
              </TouchableOpacity>

              {showProfileDropdown && (
                <View className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-[#e5e7eb] dark:border-slate-700 p-2 z-50">
                  <View className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <Text className="text-xs font-bold text-[#111827] dark:text-white">
                      {user?.email || 'superadmin@yexssync.com'}
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

        {/* Scrollable Body */}
        <ScrollView
          className="flex-1 px-4 md:px-6 pt-2 pb-10"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {/* Action Toolbar & Filters */}
          <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-[#e5e7eb] dark:border-slate-800 shadow-sm mb-5 flex-col md:flex-row md:items-center justify-between gap-4">
            <View className="flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search box */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-slate-700 flex-1 max-w-full sm:max-w-xs">
                <Search size={16} color="#6b7280" />
                <TextInput
                  placeholder="Cari nama atau email admin..."
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

              {/* Filter Peran */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 px-3 py-1.5">
                <Text className="text-xs text-slate-500 mr-2">Peran:</Text>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'superadmin', label: 'Super Admin' },
                  { key: 'support', label: 'Support' },
                  { key: 'finance', label: 'Finance' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => setSelectedRoleFilter(r.key)}
                    className={`px-2.5 py-1 rounded-md ${
                      selectedRoleFilter === r.key
                        ? 'bg-[#2a75d3] text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedRoleFilter === r.key
                          ? 'text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter Status */}
              <View className="flex-row items-center bg-[#f9fafb] dark:bg-slate-800 rounded-lg border border-[#e5e7eb] dark:border-slate-700 px-3 py-1.5">
                <Text className="text-xs text-slate-500 mr-2">Status:</Text>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'active', label: 'Aktif' },
                  { key: 'inactive', label: 'Non-Aktif' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSelectedStatusFilter(s.key)}
                    className={`px-2.5 py-1 rounded-md ${
                      selectedStatusFilter === s.key
                        ? 'bg-[#2a75d3] text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedStatusFilter === s.key
                          ? 'text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tambah Admin Button */}
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center px-4 py-2 rounded-lg bg-[#2a75d3] hover:bg-[#1d4ed8] shadow-sm self-end sm:self-auto"
            >
              <UserPlus size={16} color="#ffffff" className="mr-1.5" />
              <Text className="text-xs font-bold text-white ml-1.5">Tambah Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Panel Table: Admin List */}
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
                      Nama Admin
                    </Text>
                  </View>
                  <View style={{ flex: 1.8, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Peran (Role)
                    </Text>
                  </View>
                  <View style={{ flex: 1.8, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Departemen
                    </Text>
                  </View>
                  <View style={{ flex: 1.8, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Login Terakhir
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

                {/* Table Rows */}
                {filteredAdmins.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={40} color={theme.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                      Tidak ada akun admin yang sesuai filter
                    </Text>
                  </View>
                ) : (
                  filteredAdmins.map((item, index) => {
                    const isInactive = item.status === 'Non-Aktif';

                    return (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: index < filteredAdmins.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                          backgroundColor: isInactive ? (theme.isDark ? '#141e33' : '#fafbfe') : theme.cardBg,
                        }}
                      >
                        {/* Nama Admin */}
                        <View style={{ flex: 2.8, paddingRight: 12, flexDirection: 'row', alignItems: 'center' }}>
                          {item.avatar ? (
                            <Image
                              source={{ uri: item.avatar }}
                              style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: theme.border }}
                            />
                          ) : (
                            <View
                              style={{
                                backgroundColor: item.initialsBg || theme.subtleBg,
                                opacity: isInactive ? 0.6 : 1,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
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
                          )}
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: isInactive ? theme.textMuted : theme.text,
                                marginBottom: 2,
                              }}
                            >
                              {item.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{ fontSize: 11, color: theme.textMuted }}
                            >
                              {item.email}
                            </Text>
                          </View>
                        </View>

                        {/* Peran (Role) */}
                        <View style={{ flex: 1.8, paddingRight: 12 }}>
                          {renderRoleBadge(item.role, isInactive)}
                        </View>

                        {/* Departemen */}
                        <View style={{ flex: 1.8, paddingRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              color: isInactive ? theme.textMuted : theme.text,
                            }}
                          >
                            {item.department}
                          </Text>
                        </View>

                        {/* Login Terakhir */}
                        <View style={{ flex: 1.8, paddingRight: 12 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: isInactive ? theme.textMuted : theme.text,
                            }}
                          >
                            {item.lastLogin.timeText}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                            {item.lastLogin.ipText}
                          </Text>
                        </View>

                        {/* Status */}
                        <View style={{ flex: 1.2, paddingRight: 12 }}>{renderStatusBadge(item.status)}</View>

                        {/* Aksi */}
                        <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {/* Edit */}
                          <TouchableOpacity
                            onPress={() => handleOpenEdit(item)}
                            style={{ padding: 4 }}
                          >
                            <Edit2 size={16} color={theme.textMuted} />
                          </TouchableOpacity>

                          {/* Reset Password */}
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedAdmin(item);
                              setShowResetPasswordModal(true);
                            }}
                            style={{ padding: 4 }}
                          >
                            <KeyRound size={16} color={theme.textMuted} />
                          </TouchableOpacity>

                          {/* Delete or Restore button */}
                          {item.isCurrentUser ? (
                            <View style={{ padding: 4, opacity: 0.3 }}>
                              <Trash2 size={16} color={theme.textMuted} />
                            </View>
                          ) : isInactive ? (
                            <TouchableOpacity
                              onPress={() => handleToggleStatus(item)}
                              style={{ padding: 4 }}
                            >
                              <RotateCcw size={16} color={theme.success} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleDeleteAdmin(item)}
                              style={{ padding: 4 }}
                            >
                              <Trash2 size={16} color={theme.danger} />
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
                Menampilkan {filteredAdmins.length > 0 ? 1 : 0} - {filteredAdmins.length} dari {admins.length} Admin
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

                <TouchableOpacity
                  disabled
                  className="w-8 h-8 rounded-md border border-[#e5e7eb] dark:border-slate-700 items-center justify-center bg-white dark:bg-slate-800 opacity-50"
                >
                  <ChevronRight size={14} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* MODAL: TAMBAH ADMIN */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-2.5">
                  <UserPlus size={18} color="#2a75d3" />
                </View>
                <Text className="text-lg font-bold text-[#111827] dark:text-white">
                  Tambah Admin Pusat
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
                    Nama Lengkap *
                  </Text>
                  <TextInput
                    placeholder="Contoh: Nama Lengkap Admin"
                    placeholderTextColor="#9ca3af"
                    value={formName}
                    onChangeText={setFormName}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi *
                  </Text>
                  <TextInput
                    placeholder="admin@perusahaan.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formEmail}
                    onChangeText={setFormEmail}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                {/* Pilih Peran */}
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Peran (Role)
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { key: 'SUPER_ADMIN', label: 'Super Admin' },
                      { key: 'SUPPORT', label: 'Tim Support' },
                      { key: 'FINANCE', label: 'Finance' },
                    ].map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        onPress={() => setFormRole(r.key as any)}
                        className={`flex-1 py-2.5 items-center rounded-xl border ${
                          formRole === r.key
                            ? 'bg-[#2a75d3] border-[#2a75d3]'
                            : 'border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            formRole === r.key ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departemen
                  </Text>
                  <TextInput
                    placeholder="Contoh: Customer Success / IT"
                    placeholderTextColor="#9ca3af"
                    value={formDepartment}
                    onChangeText={setFormDepartment}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Awal *
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
                onPress={handleCreateAdmin}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#2a75d3] flex-row items-center"
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
                <Text className="text-xs font-bold text-white">Simpan Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT ADMIN */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-2.5">
                  <Edit2 size={18} color="#2a75d3" />
                </View>
                <Text className="text-lg font-bold text-[#111827] dark:text-white">
                  Edit Profil Admin
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
                    Nama Lengkap
                  </Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </Text>
                  <TextInput
                    value={formEmail}
                    onChangeText={setFormEmail}
                    className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </View>

                {/* Pilih Peran */}
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Peran (Role)
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { key: 'SUPER_ADMIN', label: 'Super Admin' },
                      { key: 'SUPPORT', label: 'Tim Support' },
                      { key: 'FINANCE', label: 'Finance' },
                    ].map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        onPress={() => setFormRole(r.key as any)}
                        className={`flex-1 py-2.5 items-center rounded-xl border ${
                          formRole === r.key
                            ? 'bg-[#2a75d3] border-[#2a75d3]'
                            : 'border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            formRole === r.key ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departemen
                  </Text>
                  <TextInput
                    value={formDepartment}
                    onChangeText={setFormDepartment}
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
                onPress={handleUpdateAdmin}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#2a75d3] flex-row items-center"
              >
                {isSubmitting && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
                <Text className="text-xs font-bold text-white">Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: RESET PASSWORD */}
      <Modal visible={showResetPasswordModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-[#e5e7eb] dark:border-slate-800 shadow-2xl p-6">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View className="flex-row items-center">
                <KeyRound size={18} color="#2a75d3" className="mr-2" />
                <Text className="text-base font-bold text-[#111827] dark:text-white ml-2">
                  Reset Password
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowResetPasswordModal(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedAdmin && (
              <View className="gap-3">
                <Text className="text-xs text-slate-500">
                  Masukkan password baru untuk admin <Text className="font-bold text-slate-800 dark:text-white">{selectedAdmin.name}</Text>:
                </Text>
                <TextInput
                  placeholder="Password baru (min 6 karakter)"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={newResetPassword}
                  onChangeText={setNewResetPassword}
                  className="border border-[#e5e7eb] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#111827] dark:text-white bg-slate-50/50 dark:bg-slate-800/50"
                />

                <View className="flex-row justify-end gap-2 pt-3">
                  <TouchableOpacity
                    onPress={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResetPassword}
                    className="px-4 py-2 rounded-xl bg-[#2a75d3]"
                  >
                    <Text className="text-xs font-bold text-white">Perbarui Password</Text>
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
              <View className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100">
                <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Status Sistem Siap
                </Text>
                <Text className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Layanan multi-tenant YexsSync berjalan normal dan optimal.
                </Text>
              </View>
              <View className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100">
                <Text className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  Tenant Pengujian Play Store
                </Text>
                <Text className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                  PT YexsSync Solusi Digital aktif untuk peninjauan aplikasi.
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
