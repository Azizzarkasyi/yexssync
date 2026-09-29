import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  CheckCircle,
  Home,
  Users,
  ClipboardCheck,
  Mail,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronDown,
  List,
  UserCheck,
  Star,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Sun,
  Moon,
  X,
  Menu,
  LogOut,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  ScanFace,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import FaceRecognitionModal from '@/components/FaceRecognitionModal';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AdminUsersScreen() {
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { logout, user } = useContext(AuthContext);

  // Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification Popup State
  const [showNotifications, setShowNotifications] = useState(false);

  // Employees data (loaded from real database API)
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown UI toggles
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Active page
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [viewModalUser, setViewModalUser] = useState<any | null>(null);
  const [editModalUser, setEditModalUser] = useState<any | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('IT & Engineering');
  const [formStatus, setFormStatus] = useState('Aktif');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch from backend on mount
  useEffect(() => {
    fetchUsersFromBackend();
  }, []);

  const fetchUsersFromBackend = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((u: any, idx: number) => {
          let st = 'Aktif';
          if (u.isActive === false || u.status === 'Non-Aktif' || u.status === 'INACTIVE') {
            st = 'Non-Aktif';
          } else if (u.status === 'Cuti' || u.leaveStatus === 'LEAVE' || u.status === 'ON_LEAVE') {
            st = 'Cuti';
          }

          const safeName = (u.name && u.name.trim()) || 'Pegawai';
          const safeEmail = u.email || `${safeName.toLowerCase().replace(/\s+/g, '.')}@yexssync.com`;

          return {
            id: u.id || idx + 1,
            name: safeName,
            employeeId: u.employeeId || `HY${123 + idx}`,
            position: u.position || u.role || 'Staff Pegawai',
            department: u.department || 'IT & Engineering',
            status: st,
            avatar: u.photo ? u.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=2a75d3&color=fff`,
            email: safeEmail,
            phone: u.phone || '+62 812-0000-0000',
            joinDate: u.joinDate
              ? new Date(u.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
              : '01 Jan 2024',
            faceRegistered: !!u.faceRegistered,
            nik: u.nik || '-',
            address: u.address || '-',
            role: u.role || 'USER',
          };
        });
        setEmployees(mapped);
      } else {
        setEmployees([]);
      }
    } catch {
      setEmployees([]);
    }
  };

  // Nav Items definition matching prototype
  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/admin', active: false },
    { label: 'Pegawai', icon: Users, path: '/admin/users', active: true },
    { label: 'Presensi', icon: ClipboardCheck, path: '/admin/attendance', active: false },
    { label: 'Izin/Cuti', icon: Mail, path: '/admin/approvals', active: false },
    { label: 'Laporan & Koreksi', icon: FileText, path: '/admin/reports', active: false },
    { label: 'Pengaturan & Profil', icon: Settings, path: '/admin/profile', active: false },
  ];

  // Distinct departments
  const departmentOptions = ['Semua Departemen', 'IT & Engineering', 'Human Resources', 'Finance', 'Operations'];
  const statusOptions = ['Semua Status', 'Aktif', 'Sedang Cuti', 'Non-Aktif'];

  // Summary counts
  const totalEmployeesCount = employees.length >= 5 ? 250 : employees.length;
  const activeEmployeesCount = 238;
  const newEmployeesCount = 12;

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q);

      const matchDept =
        !departmentFilter ||
        departmentFilter === 'Semua Departemen' ||
        emp.department?.toLowerCase() === departmentFilter.toLowerCase();

      const matchStatus =
        !statusFilter ||
        statusFilter === 'Semua Status' ||
        (statusFilter === 'Aktif' && emp.status === 'Aktif') ||
        (statusFilter === 'Sedang Cuti' && emp.status === 'Cuti') ||
        (statusFilter === 'Non-Aktif' && emp.status === 'Non-Aktif');

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  // Face Recognition Modal State
  const [faceModalUser, setFaceModalUser] = useState<any | null>(null);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextId = employees.length > 0 ? Math.max(...employees.map((e) => Number(e.id) || 0)) + 1 : 1;
    setFormName('');
    setFormEmployeeId(`HY${122 + nextId}`);
    setFormPosition('');
    setFormDepartment('IT & Engineering');
    setFormStatus('Aktif');
    setFormEmail('');
    setFormPhone('');
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: any) => {
    setEditModalUser(emp);
    setFormName(emp.name || '');
    setFormEmployeeId(emp.employeeId || '');
    setFormPosition(emp.position || '');
    setFormDepartment(emp.department || 'IT & Engineering');
    setFormStatus(emp.status || 'Aktif');
    setFormEmail(emp.email || '');
    setFormPhone(emp.phone || '');
    setFormError('');
  };

  // Submit Add
  const handleSaveNewEmployee = async () => {
    if (!formName.trim()) {
      setFormError('Nama lengkap pegawai wajib diisi');
      return;
    }
    setFormSubmitting(true);
    setFormError('');

    try {
      // Try API if available
      try {
        await api.post('/users', {
          name: formName,
          employeeId: formEmployeeId,
          position: formPosition,
          department: formDepartment,
          status: formStatus,
          email: formEmail,
          phone: formPhone,
        });
      } catch {
        // Continue locally
      }

      const newEmp = {
        id: Date.now(),
        name: formName,
        employeeId: formEmployeeId || `HY${Math.floor(100 + Math.random() * 900)}`,
        position: formPosition || 'Staff Pegawai',
        department: formDepartment,
        status: formStatus,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formName || 'Pegawai')}&background=2a75d3&color=fff`,
        email: formEmail || `${(formName || 'pegawai').toLowerCase().replace(/\s+/g, '.')}@yexssync.com`,
        phone: formPhone || '+62 812-0000-0000',
        joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      setEmployees([newEmp, ...employees]);
      setShowAddModal(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit
  const handleSaveEditEmployee = async () => {
    if (!editModalUser) return;
    if (!formName.trim()) {
      setFormError('Nama lengkap pegawai wajib diisi');
      return;
    }
    setFormSubmitting(true);

    try {
      try {
        await api.put(`/users/${editModalUser.id}`, {
          name: formName,
          employeeId: formEmployeeId,
          position: formPosition,
          department: formDepartment,
          status: formStatus,
          email: formEmail,
          phone: formPhone,
        });
      } catch {
        // Continue locally
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editModalUser.id
            ? {
                ...e,
                name: formName,
                employeeId: formEmployeeId,
                position: formPosition,
                department: formDepartment,
                status: formStatus,
                email: formEmail,
                phone: formPhone,
              }
            : e
        )
      );
      setEditModalUser(null);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    try {
      try {
        await api.delete(`/users/${deleteModalUser.id}`);
      } catch {
        // Continue locally
      }
      setEmployees((prev) => prev.filter((e) => e.id !== deleteModalUser.id));
      setDeleteModalUser(null);
    } catch {
      setDeleteModalUser(null);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* Shared Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin/users"
        isDesktop={isDesktop}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <View style={{ flex: 1, height: '100%', minHeight: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: isDesktop ? 24 : 16,
            paddingBottom: 60,
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header / Topbar */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 18,
              marginBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: isDesktop ? 'transparent' : theme.borderColor,
            }}
          >
            {/* Left Page Title + Mobile Burger */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {!isDesktop && (
                <TouchableOpacity
                  onPress={() => setMobileMenuOpen(true)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <Menu size={20} color={theme.textDark} />
                </TouchableOpacity>
              )}
              <View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: theme.primaryBlue,
                    letterSpacing: -0.3,
                  }}
                >
                  Manajemen Pegawai
                </Text>
              </View>
            </View>

            {/* Right: Theme Toggle, Notifications, Profile */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Theme Toggle Sun / Moon */}
              <TouchableOpacity
                onPress={theme.toggleTheme}
                title={`Tema: ${theme.isDark ? 'Gelap' : 'Terang'} (Klik untuk ganti)`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {theme.isDark ? (
                  <Sun size={18} color="#f59e0b" strokeWidth={2.2} />
                ) : (
                  <Moon size={18} color="#64748b" strokeWidth={2.2} />
                )}
              </TouchableOpacity>

              {/* Notifications Bell */}
              <TouchableOpacity
                onPress={() => setShowNotifications(!showNotifications)}
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} color={theme.textMuted} />
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: theme.danger,
                  }}
                />
              </TouchableOpacity>

              {/* User Profile Pill */}
              <TouchableOpacity
                onPress={() => router.push('/admin/profile')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 24,
                  backgroundColor: isDesktop ? 'transparent' : theme.cardBg,
                }}
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                {isDesktop && (
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>
                      {user?.name || 'Andi Setiawan'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>(Admin)</Text>
                  </View>
                )}
                <ChevronDown size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Dropdown Modal / Popover */}
          {showNotifications && (
            <View
              style={{
                position: 'absolute',
                top: 75,
                right: isDesktop ? 24 : 16,
                width: 320,
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                padding: 16,
                zIndex: 999,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>Notifikasi Pegawai</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: theme.subtleBg,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.warning,
                      marginTop: 5,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark }}>
                      Citra Lestari mengajukan cuti
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Hari ini, 09:30 WIB</Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: theme.subtleBg,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.success,
                      marginTop: 5,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark }}>
                      12 Pegawai baru bergabung bulan ini
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>1 September 2023</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Summary Cards */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 20,
              marginBottom: 20,
            }}
          >
            {/* Card 1: Total Pegawai */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                borderWidth: 1,
                borderColor: theme.borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.cardIconBlueBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <List size={22} color={theme.primaryBlue} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>Total Pegawai</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {totalEmployeesCount}
                </Text>
              </View>
            </View>

            {/* Card 2: Pegawai Aktif */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                borderWidth: 1,
                borderColor: theme.borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.successBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <UserCheck size={22} color={theme.success} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>Pegawai Aktif</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {activeEmployeesCount}
                </Text>
              </View>
            </View>

            {/* Card 3: Pegawai Baru (Bulan Ini) */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                borderWidth: 1,
                borderColor: theme.borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.warningBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Star size={22} color={theme.warningText} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Pegawai Baru (Bulan Ini)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {newEmployeesCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions Toolbar */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              padding: 15,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderColor,
              marginBottom: 20,
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'stretch',
              gap: 15,
            }}
          >
            {/* Filters Row */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 12,
                flex: 1,
              }}
            >
              {/* Search Employee Bar */}
              <View
                style={{
                  flex: isDesktop ? 1 : undefined,
                  maxWidth: isDesktop ? 320 : '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  backgroundColor: theme.inputBg,
                  height: 40,
                }}
              >
                <Search size={16} color={theme.textMuted} />
                <TextInput
                  placeholder="Cari nama atau ID pegawai..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    outlineWidth: 0,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Departemen Dropdown */}
              <View style={{ position: 'relative', minWidth: 190 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDeptDropdownOpen(!deptDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                    height: 40,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.inputBg,
                  }}
                >
                  <Text style={{ fontSize: 13, color: departmentFilter ? theme.textDark : theme.textMuted }}>
                    {departmentFilter || 'Semua Departemen'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {deptDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 45,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      zIndex: 100,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 5,
                      overflow: 'hidden',
                    }}
                  >
                    {departmentOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setDepartmentFilter(opt === 'Semua Departemen' ? '' : opt);
                          setDeptDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor:
                            (departmentFilter === '' && opt === 'Semua Departemen') ||
                            departmentFilter === opt
                              ? theme.activeNavBg
                              : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              (departmentFilter === '' && opt === 'Semua Departemen') ||
                              departmentFilter === opt
                                ? theme.primaryBlue
                                : theme.textDark,
                            fontWeight:
                              (departmentFilter === '' && opt === 'Semua Departemen') ||
                              departmentFilter === opt
                                ? '600'
                                : '400',
                          }}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status Dropdown */}
              <View style={{ position: 'relative', minWidth: 160 }}>
                <TouchableOpacity
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setDeptDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                    height: 40,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.inputBg,
                  }}
                >
                  <Text style={{ fontSize: 13, color: statusFilter ? theme.textDark : theme.textMuted }}>
                    {statusFilter || 'Semua Status'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 45,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      zIndex: 100,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 5,
                      overflow: 'hidden',
                    }}
                  >
                    {statusOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setStatusFilter(opt === 'Semua Status' ? '' : opt);
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor:
                            (statusFilter === '' && opt === 'Semua Status') || statusFilter === opt
                              ? theme.activeNavBg
                              : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              (statusFilter === '' && opt === 'Semua Status') || statusFilter === opt
                                ? theme.primaryBlue
                                : theme.textDark,
                            fontWeight:
                              (statusFilter === '' && opt === 'Semua Status') || statusFilter === opt
                                ? '600'
                                : '400',
                          }}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Tambah Pegawai Baru Button */}
            <TouchableOpacity
              onPress={handleOpenAddModal}
              style={{
                backgroundColor: theme.primaryBlue,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 6,
                height: 40,
              }}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                Tambah Pegawai Baru
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel Tabel Pegawai */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
            }}
          >
            {/* Panel Header */}
            <View
              style={{
                marginBottom: 15,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                Daftar Pegawai
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {filteredEmployees.length} pegawai ditampilkan
              </Text>
            </View>

            {/* Table Responsive with horizontal scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 800, width: '100%' }}>
                {/* Table Head */}
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: theme.subtleBg,
                    borderBottomWidth: 2,
                    borderBottomColor: theme.borderColor,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                  }}
                >
                  <Text style={{ flex: 2, fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    Pegawai
                  </Text>
                  <Text style={{ flex: 1.2, fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    ID Pegawai
                  </Text>
                  <Text style={{ flex: 1.8, fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    Jabatan
                  </Text>
                  <Text style={{ flex: 1.8, fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    Departemen
                  </Text>
                  <Text style={{ flex: 1.2, fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    Status
                  </Text>
                  <Text
                    style={{
                      flex: 1.2,
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textAlign: 'center',
                    }}
                  >
                    Aksi
                  </Text>
                </View>

                {/* Table Body */}
                {filteredEmployees.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={40} color={theme.textMuted} />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: theme.textDark,
                        marginTop: 10,
                      }}
                    >
                      Tidak ada data pegawai
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Tidak ditemukan pegawai yang cocok dengan filter atau kata kunci.
                    </Text>
                  </View>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isNonAktif = emp.status === 'Non-Aktif';
                    const isCuti = emp.status === 'Cuti';

                    // Row background
                    const rowBg = isNonAktif ? (theme.isDark ? '#141e33' : '#fafbfe') : theme.cardBg;

                    // Dot & text colors
                    const dotColor = isNonAktif
                      ? theme.danger
                      : isCuti
                      ? theme.warning
                      : theme.success;
                    const statusTextColor = isNonAktif
                      ? theme.danger
                      : isCuti
                      ? theme.warningText
                      : theme.success;
                    const statusLabel = isNonAktif ? 'Non-Aktif' : isCuti ? 'Cuti' : 'Aktif';

                    return (
                      <View
                        key={emp.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor: rowBg,
                        }}
                      >
                        {/* Column 1: Pegawai */}
                        <View
                          style={{
                            flex: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Image
                            source={{ uri: emp.avatar }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: theme.subtleBg,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: isNonAktif ? theme.textMuted : theme.textDark,
                            }}
                            numberOfLines={1}
                          >
                            {emp.name}
                          </Text>
                        </View>

                        {/* Column 2: ID Pegawai */}
                        <View style={{ flex: 1.2 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                              color: theme.textMuted,
                            }}
                          >
                            {emp.employeeId}
                          </Text>
                        </View>

                        {/* Column 3: Jabatan */}
                        <View style={{ flex: 1.8 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              color: isNonAktif ? theme.textMuted : theme.textDark,
                            }}
                            numberOfLines={1}
                          >
                            {emp.position}
                          </Text>
                        </View>

                        {/* Column 4: Departemen */}
                        <View style={{ flex: 1.8 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              color: isNonAktif ? theme.textMuted : theme.textDark,
                            }}
                            numberOfLines={1}
                          >
                            {emp.department}
                          </Text>
                        </View>

                        {/* Column 5: Status with Dot Badge */}
                        <View
                          style={{
                            flex: 1.2,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: dotColor,
                              marginRight: 6,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: statusTextColor,
                            }}
                          >
                            {statusLabel}
                          </Text>
                        </View>

                        {/* Column 6: Action Buttons */}
                        <View
                          style={{
                            flex: 1.2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                          }}
                        >
                          {/* Eye / View */}
                          <TouchableOpacity
                            onPress={() => setViewModalUser(emp)}
                            title="Lihat Profil"
                            style={{ padding: 4 }}
                          >
                            <Eye size={17} color={theme.textMuted} />
                          </TouchableOpacity>

                          {/* Face Recognition Registration */}
                          <TouchableOpacity
                            onPress={() => setFaceModalUser(emp)}
                            title="Daftarkan / Pindai Wajah Biometrik"
                            style={{ padding: 4 }}
                          >
                            <ScanFace
                              size={17}
                              color={emp.faceRegistered ? theme.success : theme.primaryBlue}
                            />
                          </TouchableOpacity>

                          {/* Edit */}
                          <TouchableOpacity
                            onPress={() => handleOpenEditModal(emp)}
                            title="Edit Data"
                            style={{ padding: 4 }}
                          >
                            <Edit2 size={16} color={theme.textMuted} />
                          </TouchableOpacity>

                          {/* Delete (if non-aktif, still can delete or hide) */}
                          {!isNonAktif ? (
                            <TouchableOpacity
                              onPress={() => setDeleteModalUser(emp)}
                              title="Hapus"
                              style={{ padding: 4 }}
                            >
                              <Trash2 size={16} color={theme.danger} />
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: 24 }} />
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Pagination Matching Prototype */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: isDesktop ? 'center' : 'flex-start',
                marginTop: 20,
                paddingTop: 15,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: theme.textMuted }}>
                Menampilkan 1 - {filteredEmployees.length} dari {totalEmployeesCount} pegawai
              </Text>

              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={14} color={theme.textDark} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentPage(1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: currentPage === 1 ? theme.primaryBlue : theme.borderColor,
                    backgroundColor: currentPage === 1 ? theme.primaryBlue : theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: currentPage === 1 ? '#ffffff' : theme.textDark,
                    }}
                  >
                    1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentPage(2)}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: currentPage === 2 ? theme.primaryBlue : theme.borderColor,
                    backgroundColor: currentPage === 2 ? theme.primaryBlue : theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: currentPage === 2 ? '#ffffff' : theme.textDark,
                    }}
                  >
                    2
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentPage(3)}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: currentPage === 3 ? theme.primaryBlue : theme.borderColor,
                    backgroundColor: currentPage === 3 ? theme.primaryBlue : theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: currentPage === 3 ? '#ffffff' : theme.textDark,
                    }}
                  >
                    3
                  </Text>
                </TouchableOpacity>

                <Text style={{ color: theme.textMuted, paddingHorizontal: 4 }}>...</Text>

                <TouchableOpacity
                  onPress={() => setCurrentPage(50)}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: currentPage === 50 ? theme.primaryBlue : theme.borderColor,
                    backgroundColor: currentPage === 50 ? theme.primaryBlue : theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: currentPage === 50 ? '#ffffff' : theme.textDark,
                    }}
                  >
                    50
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentPage(Math.min(50, currentPage + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={14} color={theme.textDark} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ======================================================== */}
      {/* MODAL 1: VIEW PROFIL PEGAWAI                             */}
      {/* ======================================================== */}
      <Modal
        visible={!!viewModalUser}
        transparent
        animationType="fade"
        onRequestClose={() => setViewModalUser(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Profil Pegawai
              </Text>
              <TouchableOpacity onPress={() => setViewModalUser(null)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {viewModalUser && (
              <View>
                {/* Avatar and basic info */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Image
                    source={{ uri: viewModalUser.avatar }}
                    style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
                  />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                    {viewModalUser.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.primaryBlue, fontWeight: '500' }}>
                    {viewModalUser.position}
                  </Text>

                  {/* Status badge */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 8,
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor:
                        viewModalUser.status === 'Aktif'
                          ? theme.successBg
                          : viewModalUser.status === 'Cuti'
                          ? theme.warningBg
                          : theme.dangerBg,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          viewModalUser.status === 'Aktif'
                            ? theme.success
                            : viewModalUser.status === 'Cuti'
                            ? theme.warning
                            : theme.danger,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color:
                          viewModalUser.status === 'Aktif'
                            ? theme.success
                            : viewModalUser.status === 'Cuti'
                            ? theme.warningText
                            : theme.danger,
                      }}
                    >
                      {viewModalUser.status}
                    </Text>
                  </View>
                </View>

                {/* Details list */}
                <View
                  style={{
                    backgroundColor: theme.subtleBg,
                    borderRadius: 10,
                    padding: 14,
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>ID Pegawai</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                        color: theme.textDark,
                      }}
                    >
                      {viewModalUser.employeeId}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Departemen</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewModalUser.department}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Email</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewModalUser.email}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>No. Telepon</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewModalUser.phone}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Tanggal Bergabung</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewModalUser.joinDate || '15 Jan 2023'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => setViewModalUser(null)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>Tutup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const u = viewModalUser;
                      setViewModalUser(null);
                      handleOpenEditModal(u);
                    }}
                    style={{
                      backgroundColor: theme.primaryBlue,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Edit2 size={14} color="#fff" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Edit Data</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: TAMBAH PEGAWAI BARU                             */}
      {/* ======================================================== */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
              maxHeight: '90%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Tambah Pegawai Baru
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: theme.dangerBg,
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={16} color={theme.danger} />
                <Text style={{ fontSize: 12, color: theme.danger, fontWeight: '500' }}>{formError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ gap: 14 }}>
              {/* Nama */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                  Nama Lengkap *
                </Text>
                <TextInput
                  placeholder="Contoh: Andi Setiawan"
                  placeholderTextColor={theme.placeholder}
                  value={formName}
                  onChangeText={setFormName}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    height: 40,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.inputBg,
                  }}
                />
              </View>

              {/* ID & Jabatan row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    ID Pegawai
                  </Text>
                  <TextInput
                    placeholder="HY128"
                    placeholderTextColor={theme.placeholder}
                    value={formEmployeeId}
                    onChangeText={setFormEmployeeId}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                      fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                    }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Jabatan
                  </Text>
                  <TextInput
                    placeholder="Contoh: Senior Staff"
                    placeholderTextColor={theme.placeholder}
                    value={formPosition}
                    onChangeText={setFormPosition}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>

              {/* Departemen & Status row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Departemen
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {['IT & Engineering', 'Human Resources', 'Finance', 'Operations'].map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        onPress={() => setFormDepartment(dept)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: formDepartment === dept ? theme.primaryBlue : theme.borderColor,
                          backgroundColor: formDepartment === dept ? theme.activeNavBg : theme.cardBg,
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: formDepartment === dept ? '600' : '400',
                            color: formDepartment === dept ? theme.primaryBlue : theme.textDark,
                          }}
                        >
                          {dept}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Status
                  </Text>
                  <View style={{ gap: 6 }}>
                    {['Aktif', 'Cuti', 'Non-Aktif'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setFormStatus(st)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: formStatus === st ? theme.primaryBlue : theme.borderColor,
                          backgroundColor: formStatus === st ? theme.activeNavBg : theme.cardBg,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor:
                              st === 'Aktif'
                                ? theme.success
                                : st === 'Cuti'
                                ? theme.warning
                                : theme.danger,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: formStatus === st ? '600' : '400',
                            color: formStatus === st ? theme.primaryBlue : theme.textDark,
                          }}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Email & Telepon */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    placeholder="pegawai@yexssync.com"
                    placeholderTextColor={theme.placeholder}
                    value={formEmail}
                    onChangeText={setFormEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    No. Telepon
                  </Text>
                  <TextInput
                    placeholder="+62 812-xxxx-xxxx"
                    placeholderTextColor={theme.placeholder}
                    value={formPhone}
                    onChangeText={setFormPhone}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewEmployee}
                disabled={formSubmitting}
                style={{
                  backgroundColor: theme.primaryBlue,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {formSubmitting && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Simpan Pegawai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: EDIT PEGAWAI                                    */}
      {/* ======================================================== */}
      <Modal
        visible={!!editModalUser}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalUser(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
              maxHeight: '90%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Edit Data Pegawai
              </Text>
              <TouchableOpacity onPress={() => setEditModalUser(null)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: theme.dangerBg,
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={16} color={theme.danger} />
                <Text style={{ fontSize: 12, color: theme.danger, fontWeight: '500' }}>{formError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ gap: 14 }}>
              {/* Nama */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                  Nama Lengkap *
                </Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    height: 40,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.inputBg,
                  }}
                />
              </View>

              {/* ID & Jabatan row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    ID Pegawai
                  </Text>
                  <TextInput
                    value={formEmployeeId}
                    onChangeText={setFormEmployeeId}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                      fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                    }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Jabatan
                  </Text>
                  <TextInput
                    value={formPosition}
                    onChangeText={setFormPosition}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>

              {/* Departemen & Status row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Departemen
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {['IT & Engineering', 'Human Resources', 'Finance', 'Operations'].map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        onPress={() => setFormDepartment(dept)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: formDepartment === dept ? theme.primaryBlue : theme.borderColor,
                          backgroundColor: formDepartment === dept ? theme.activeNavBg : theme.cardBg,
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: formDepartment === dept ? '600' : '400',
                            color: formDepartment === dept ? theme.primaryBlue : theme.textDark,
                          }}
                        >
                          {dept}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Status
                  </Text>
                  <View style={{ gap: 6 }}>
                    {['Aktif', 'Cuti', 'Non-Aktif'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setFormStatus(st)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: formStatus === st ? theme.primaryBlue : theme.borderColor,
                          backgroundColor: formStatus === st ? theme.activeNavBg : theme.cardBg,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor:
                              st === 'Aktif'
                                ? theme.success
                                : st === 'Cuti'
                                ? theme.warning
                                : theme.danger,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: formStatus === st ? '600' : '400',
                            color: formStatus === st ? theme.primaryBlue : theme.textDark,
                          }}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Email & Telepon */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Email
                  </Text>
                  <TextInput
                    value={formEmail}
                    onChangeText={setFormEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    No. Telepon
                  </Text>
                  <TextInput
                    value={formPhone}
                    onChangeText={setFormPhone}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      height: 40,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              }}
            >
              <TouchableOpacity
                onPress={() => setEditModalUser(null)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEditEmployee}
                disabled={formSubmitting}
                style={{
                  backgroundColor: theme.primaryBlue,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {formSubmitting && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: HAPUS PEGAWAI                                   */}
      {/* ======================================================== */}
      <Modal
        visible={!!deleteModalUser}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalUser(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.dangerBg,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Trash2 size={24} color={theme.danger} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark, marginBottom: 8 }}>
              Hapus Data Pegawai
            </Text>
            <Text style={{ fontSize: 14, color: theme.textMuted, lineHeight: 20, marginBottom: 20 }}>
              Apakah Anda yakin ingin menghapus pegawai{' '}
              <Text style={{ fontWeight: '700', color: theme.textDark }}>
                "{deleteModalUser?.name}"
              </Text>{' '}
              (ID: {deleteModalUser?.employeeId})? Tindakan ini tidak dapat dibatalkan.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDeleteModalUser(null)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={{
                  backgroundColor: theme.danger,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Hapus Pegawai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Face Recognition Biometric Modal for Employee */}
      <FaceRecognitionModal
        visible={!!faceModalUser}
        mode="register"
        userId={faceModalUser?.id}
        userName={faceModalUser?.name}
        onClose={() => setFaceModalUser(null)}
        onSuccess={(result) => {
          if (faceModalUser) {
            setEmployees((prev) =>
              prev.map((e) =>
                e.id === faceModalUser.id
                  ? {
                      ...e,
                      faceRegistered: true,
                      ...(result.photoUri ? { avatar: result.photoUri } : {}),
                    }
                  : e
              )
            );
          }
        }}
      />
    </View>
  );
}
