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
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SuperAdminTopHeader from '@/components/SuperAdminTopHeader';
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
  const isDesktop = width >= 768;
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
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
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
    const opacityStyle = isInactive ? { opacity: 0.6 } : {};

    if (role === 'SUPER_ADMIN') {
      return (
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              alignSelf: 'flex-start',
              gap: 6,
            },
            opacityStyle,
          ]}
        >
          <ShieldCheck size={14} color="#8b5cf6" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8b5cf6' }}>Super Admin</Text>
        </View>
      );
    }
    if (role === 'SUPPORT') {
      return (
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              alignSelf: 'flex-start',
              gap: 6,
            },
            opacityStyle,
          ]}
        >
          <Headphones size={14} color="#3b82f6" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Tim Support</Text>
        </View>
      );
    }
    return (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            alignSelf: 'flex-start',
            gap: 6,
          },
          opacityStyle,
        ]}
      >
        <Receipt size={14} color="#10b981" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#10b981' }}>Finance</Text>
      </View>
    );
  };

  // Status Badge Component
  const renderStatusBadge = (status: AdminUser['status']) => {
    if (status === 'Aktif') {
      return (
        <View
          style={{
            backgroundColor: theme.successBg,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ color: theme.success, fontSize: 12, fontWeight: '600' }}>Aktif</Text>
        </View>
      );
    }
    return (
      <View
        style={{
          backgroundColor: theme.subtleBg,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>Non-Aktif</Text>
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
        {/* Scrollable Body */}
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
            title="Manajemen Admin"
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
                  placeholder="Cari nama atau email admin..."
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

              {/* Filter Peran */}
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
                <Text style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>Peran:</Text>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'superadmin', label: 'Super Admin' },
                  { key: 'support', label: 'Support' },
                  { key: 'finance', label: 'Finance' },
                ].map((r) => {
                  const isSelected = selectedRoleFilter === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setSelectedRoleFilter(r.key)}
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
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter Status */}
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
                  { key: 'inactive', label: 'Non-Aktif' },
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

            {/* Tambah Admin Button */}
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.primaryBlue,
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 8,
                alignSelf: isDesktop ? 'auto' : 'flex-end',
                gap: 8,
              }}
            >
              <UserPlus size={16} color="#ffffff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Tambah Admin</Text>
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
                Menampilkan {filteredAdmins.length > 0 ? 1 : 0} - {filteredAdmins.length} dari {admins.length} Admin
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  disabled
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.cardBg,
                    opacity: 0.5,
                  }}
                >
                  <ChevronLeft size={14} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: theme.primaryBlue,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.cardBg,
                    opacity: 0.5,
                  }}
                >
                  <ChevronRight size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* MODAL: TAMBAH ADMIN */}
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
                  <UserPlus size={18} color={theme.primaryBlue} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                  Tambah Admin Pusat
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
                    Nama Lengkap *
                  </Text>
                  <TextInput
                    placeholder="Contoh: Nama Lengkap Admin"
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
                    Email Resmi *
                  </Text>
                  <TextInput
                    placeholder="admin@perusahaan.com"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formEmail}
                    onChangeText={setFormEmail}
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

                {/* Pilih Peran */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Peran (Role)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { key: 'SUPER_ADMIN', label: 'Super Admin' },
                      { key: 'SUPPORT', label: 'Tim Support' },
                      { key: 'FINANCE', label: 'Finance' },
                    ].map((r) => {
                      const isSelected = formRole === r.key;
                      return (
                        <TouchableOpacity
                          key={r.key}
                          onPress={() => setFormRole(r.key as any)}
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
                            {r.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Departemen
                  </Text>
                  <TextInput
                    placeholder="Contoh: Customer Success / IT"
                    placeholderTextColor={theme.placeholder}
                    value={formDepartment}
                    onChangeText={setFormDepartment}
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
                    Password Awal *
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
                onPress={handleCreateAdmin}
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
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Simpan Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT ADMIN */}
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
                  Edit Admin
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
                    Nama Lengkap
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

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    value={formEmail}
                    onChangeText={setFormEmail}
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

                {/* Pilih Peran */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Peran (Role)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { key: 'SUPER_ADMIN', label: 'Super Admin' },
                      { key: 'SUPPORT', label: 'Tim Support' },
                      { key: 'FINANCE', label: 'Finance' },
                    ].map((r) => {
                      const isSelected = formRole === r.key;
                      return (
                        <TouchableOpacity
                          key={r.key}
                          onPress={() => setFormRole(r.key as any)}
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
                            {r.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Departemen
                  </Text>
                  <TextInput
                    value={formDepartment}
                    onChangeText={setFormDepartment}
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
                onPress={handleUpdateAdmin}
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

      {/* MODAL: RESET PASSWORD */}
      <Modal visible={showResetPasswordModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              width: '100%',
              maxWidth: 420,
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
                <KeyRound size={18} color={theme.primaryBlue} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                  Reset Password
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowResetPasswordModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedAdmin && (
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Masukkan password baru untuk admin <Text style={{ fontWeight: '700', color: theme.text }}>{selectedAdmin.name}</Text>:
                </Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    placeholder="Password baru (min 6 karakter)"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry={!showResetPassword}
                    value={newResetPassword}
                    onChangeText={setNewResetPassword}
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
                    onPress={() => setShowResetPassword(!showResetPassword)}
                    style={{ position: 'absolute', right: 10, padding: 4 }}
                  >
                    {showResetPassword ? (
                      <EyeOff size={16} color={theme.textMuted} />
                    ) : (
                      <Eye size={16} color={theme.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowResetPasswordModal(false)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResetPassword}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: theme.primaryBlue,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>Perbarui Password</Text>
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
