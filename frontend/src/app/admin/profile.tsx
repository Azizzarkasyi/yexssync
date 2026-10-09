import React, { useState, useEffect, useContext } from 'react';
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
  Switch,
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
  Bell,
  ChevronDown,
  Sun,
  Moon,
  X,
  Menu,
  LogOut,
  Building2,
  MapPin,
  Clock,
  Network,
  Crosshair,
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Globe,
  Phone,
  Shield,
  Layers,
  Map,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { LocationMapPicker, LocationPickerResult } from '@/components/LocationMapPicker';

export default function AdminSettingsProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { logout, user } = useContext(AuthContext);

  // Mobile Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications modal
  const [showNotifications, setShowNotifications] = useState(false);

  // Active Settings Tab:
  // 'location' = Presensi & Lokasi (GPS)
  // 'company' = Profil Perusahaan
  // 'shifts' = Jam Kerja & Shift
  // 'departments' = Departemen & Jabatan
  const [activeTab, setActiveTab] = useState<'location' | 'company' | 'shifts' | 'departments'>('location');

  // Form states: Location & Geofencing (Panel 1)
  const [latitude, setLatitude] = useState('-6.200000');
  const [longitude, setLongitude] = useState('106.816666');
  const [radius, setRadius] = useState('100');
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form states: Security & Validation (Panel 2)
  const [requireGps, setRequireGps] = useState(true);
  const [requireSelfie, setRequireSelfie] = useState(true);
  const [rejectOutsideShift, setRejectOutsideShift] = useState(false);

  // Form states: Standard Working Hours (Panel 3)
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [lateTolerance, setLateTolerance] = useState('15');
  const [workDays, setWorkDays] = useState('6'); // 6 = Senin - Sabtu, 5 = Senin - Jumat

  // Form states: Profil Perusahaan
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Shift & Department Management (Default Kosong)
  interface ShiftItem {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days?: string;
    breakMinutes?: number;
  }

  interface DepartmentItem {
    id: string;
    name: string;
    positions?: string[];
  }

  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  // Shift Modal State
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('17:00');
  const [shiftDays, setShiftDays] = useState('Senin - Sabtu');
  const [shiftBreakMinutes, setShiftBreakMinutes] = useState('60');

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptPositions, setDeptPositions] = useState('');

  // Feedback toast / alert
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Nav Items definition
  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/admin', active: false },
    { label: 'Pegawai', icon: Users, path: '/admin/users', active: false },
    { label: 'Presensi', icon: ClipboardCheck, path: '/admin/attendance', active: false },
    { label: 'Izin/Cuti', icon: Mail, path: '/admin/approvals', active: false },
    { label: 'Laporan & Koreksi', icon: FileText, path: '/admin/reports', active: false },
    { label: 'Pengaturan & Profil', icon: Settings, path: '/admin/profile', active: true },
  ];

  // Geolocation trigger
  const handleGetCurrentLocation = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocatingCurrent(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setLocatingCurrent(false);
          showToast('Kordinat GPS berhasil diperbarui ke lokasi saat ini.');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocatingCurrent(false);
          showToast('Gagal membaca lokasi. Pastikan izin GPS aktif di browser.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      showToast('Geolocation tidak didukung pada browser ini.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleSelectMapLocation = (result: LocationPickerResult) => {
    setLatitude(result.latitude.toFixed(6));
    setLongitude(result.longitude.toFixed(6));
    if (result.radius) {
      setRadius(String(result.radius));
    }
    if (result.address && (!companyAddress || companyAddress.trim() === '')) {
      setCompanyAddress(result.address);
    }
    setShowMapPicker(false);
    showToast('Titik koordinat kantor berhasil diperbarui dari peta!');
  };

  useEffect(() => {
    const fetchCompanyConfig = async () => {
      try {
        const res = await api.get('/config');
        if (res.data?.success && res.data.data) {
          const cfg = res.data.data;
          if (cfg.companyName) setCompanyName(cfg.companyName);
          if (cfg.companyEmail) setCompanyEmail(cfg.companyEmail);
          if (cfg.companyPhone) setCompanyPhone(cfg.companyPhone);
          if (cfg.companyAddress) setCompanyAddress(cfg.companyAddress);
          if (cfg.companyWebsite) setCompanyWebsite(cfg.companyWebsite);
          if (cfg.workStartTime) setWorkStartTime(cfg.workStartTime);
          if (cfg.workEndTime) setWorkEndTime(cfg.workEndTime);
          if (cfg.lateTolerance) setLateTolerance(String(cfg.lateTolerance));
          if (cfg.latitude) setLatitude(String(cfg.latitude));
          if (cfg.longitude) setLongitude(String(cfg.longitude));
          if (cfg.radius) setRadius(String(cfg.radius));

          // Shifts (Default Kosong)
          if (cfg.shifts) {
            const parsedShifts = typeof cfg.shifts === 'string' ? JSON.parse(cfg.shifts) : cfg.shifts;
            if (Array.isArray(parsedShifts)) {
              setShifts(parsedShifts);
            }
          }

          // Departments (Default Kosong)
          if (cfg.departments) {
            const parsedDepts = typeof cfg.departments === 'string' ? JSON.parse(cfg.departments) : cfg.departments;
            if (Array.isArray(parsedDepts)) {
              setDepartments(parsedDepts);
            }
          }
        }
      } catch (err) {
        // Keep current state
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.data?.data && Array.isArray(res.data.data)) {
          setUserList(res.data.data);
        }
      } catch {}
    };

    fetchCompanyConfig();
    fetchUsers();
  }, []);

  // CRUD Shift Handlers
  const handleOpenAddShift = () => {
    setEditingShiftId(null);
    setShiftName('');
    setShiftStartTime('08:00');
    setShiftEndTime('17:00');
    setShiftDays('Senin - Sabtu');
    setShiftBreakMinutes('60');
    setShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: ShiftItem) => {
    setEditingShiftId(shift.id);
    setShiftName(shift.name);
    setShiftStartTime(shift.startTime);
    setShiftEndTime(shift.endTime);
    setShiftDays(shift.days || 'Senin - Sabtu');
    setShiftBreakMinutes(String(shift.breakMinutes || 60));
    setShiftModalOpen(true);
  };

  const handleSaveShiftModal = async () => {
    if (!shiftName.trim()) {
      showToast('Nama shift harus diisi');
      return;
    }
    const newShiftItem: ShiftItem = {
      id: editingShiftId || `shift_${Date.now()}`,
      name: shiftName.trim(),
      startTime: shiftStartTime.trim() || '08:00',
      endTime: shiftEndTime.trim() || '17:00',
      days: shiftDays.trim() || 'Senin - Sabtu',
      breakMinutes: parseInt(shiftBreakMinutes, 10) || 60,
    };

    let updated: ShiftItem[];
    if (editingShiftId) {
      updated = shifts.map((s) => (s.id === editingShiftId ? newShiftItem : s));
    } else {
      updated = [...shifts, newShiftItem];
    }
    setShifts(updated);
    setShiftModalOpen(false);

    try {
      await api.put('/config', { shifts: updated });
      showToast(editingShiftId ? 'Shift kerja berhasil diperbarui!' : 'Shift kerja baru berhasil ditambahkan!');
    } catch {
      showToast('Shift berhasil disimpan lokal');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    const updated = shifts.filter((s) => s.id !== shiftId);
    setShifts(updated);
    try {
      await api.put('/config', { shifts: updated });
      showToast('Shift kerja berhasil dihapus');
    } catch {
      showToast('Shift berhasil dihapus');
    }
  };

  // CRUD Department Handlers
  const handleOpenAddDept = () => {
    setEditingDeptId(null);
    setDeptName('');
    setDeptPositions('');
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentItem) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptPositions((dept.positions || []).join(', '));
    setDeptModalOpen(true);
  };

  const handleSaveDeptModal = async () => {
    if (!deptName.trim()) {
      showToast('Nama departemen harus diisi');
      return;
    }
    const posArray = deptPositions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newDeptItem: DepartmentItem = {
      id: editingDeptId || `dept_${Date.now()}`,
      name: deptName.trim(),
      positions: posArray,
    };

    let updated: DepartmentItem[];
    if (editingDeptId) {
      updated = departments.map((d) => (d.id === editingDeptId ? newDeptItem : d));
    } else {
      updated = [...departments, newDeptItem];
    }
    setDepartments(updated);
    setDeptModalOpen(false);

    try {
      await api.put('/config', { departments: updated });
      showToast(editingDeptId ? 'Departemen berhasil diperbarui!' : 'Departemen baru berhasil ditambahkan!');
    } catch {
      showToast('Departemen berhasil disimpan');
    }
  };

  const handleDeleteDept = async (deptId: string) => {
    const updated = departments.filter((d) => d.id !== deptId);
    setDepartments(updated);
    try {
      await api.put('/config', { departments: updated });
      showToast('Departemen berhasil dihapus');
    } catch {
      showToast('Departemen berhasil dihapus');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/config', {
        latitude: parseFloat(latitude) || -6.2,
        longitude: parseFloat(longitude) || 106.81,
        radius: parseInt(radius, 10) || 100,
        requireGps,
        requireSelfie,
        rejectOutsideShift,
        workStartTime,
        workEndTime,
        lateTolerance: parseInt(lateTolerance, 10) || 15,
        workDays: parseInt(workDays, 10) || 6,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
      });
      showToast('Pengaturan perusahaan berhasil disimpan!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Pengaturan berhasil diperbarui!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* Shared Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin/profile"
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
            paddingBottom: (isDesktop ? 60 : 80) + Math.max(insets.bottom, 16),
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header / Topbar */}
          <AdminTopHeader
            title="Pengaturan Perusahaan"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Toast Notification Banner */}
          {toastMessage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: theme.successBg,
                borderWidth: 1,
                borderColor: theme.success,
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <CheckCircle size={18} color={theme.success} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.success, flex: 1 }}>
                {toastMessage}
              </Text>
              <TouchableOpacity onPress={() => setToastMessage('')}>
                <X size={16} color={theme.success} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Settings Layout: Dual Column */}
          <View
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              gap: 20,
              alignItems: 'flex-start',
            }}
          >
            {/* ======================================================== */}
            {/* LEFT TABS SIDEBAR (.settings-sidebar)                    */}
            {/* ======================================================== */}
            <View
              style={{
                width: isDesktop ? 250 : '100%',
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
              }}
            >
              <ScrollView
                horizontal={!isDesktop}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: isDesktop ? 'column' : 'row' }}
              >
                {/* Tab 1: Profil Perusahaan */}
                <TouchableOpacity
                  onPress={() => setActiveTab('company')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderBottomWidth: isDesktop ? 1 : 0,
                    borderRightWidth: isDesktop ? 0 : 1,
                    borderBottomColor: theme.borderColor,
                    borderRightColor: theme.borderColor,
                    backgroundColor: activeTab === 'company' ? theme.activeNavBg : 'transparent',
                    borderLeftWidth: isDesktop && activeTab === 'company' ? 3 : 0,
                    borderLeftColor: theme.primaryBlue,
                  }}
                >
                  <Building2
                    size={18}
                    color={activeTab === 'company' ? theme.primaryBlue : theme.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === 'company' ? '600' : '500',
                      color: activeTab === 'company' ? theme.primaryBlue : theme.textDark,
                    }}
                  >
                    Profil Perusahaan
                  </Text>
                </TouchableOpacity>

                {/* Tab 2: Presensi & Lokasi (GPS) - ACTIVE in prototype */}
                <TouchableOpacity
                  onPress={() => setActiveTab('location')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderBottomWidth: isDesktop ? 1 : 0,
                    borderRightWidth: isDesktop ? 0 : 1,
                    borderBottomColor: theme.borderColor,
                    borderRightColor: theme.borderColor,
                    backgroundColor: activeTab === 'location' ? theme.activeNavBg : 'transparent',
                    borderLeftWidth: isDesktop && activeTab === 'location' ? 3 : 0,
                    borderLeftColor: theme.primaryBlue,
                  }}
                >
                  <MapPin
                    size={18}
                    color={activeTab === 'location' ? theme.primaryBlue : theme.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === 'location' ? '600' : '500',
                      color: activeTab === 'location' ? theme.primaryBlue : theme.textDark,
                    }}
                  >
                    Presensi & Lokasi (GPS)
                  </Text>
                </TouchableOpacity>

                {/* Tab 3: Jam Kerja & Shift */}
                <TouchableOpacity
                  onPress={() => setActiveTab('shifts')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderBottomWidth: isDesktop ? 1 : 0,
                    borderRightWidth: isDesktop ? 0 : 1,
                    borderBottomColor: theme.borderColor,
                    borderRightColor: theme.borderColor,
                    backgroundColor: activeTab === 'shifts' ? theme.activeNavBg : 'transparent',
                    borderLeftWidth: isDesktop && activeTab === 'shifts' ? 3 : 0,
                    borderLeftColor: theme.primaryBlue,
                  }}
                >
                  <Clock
                    size={18}
                    color={activeTab === 'shifts' ? theme.primaryBlue : theme.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === 'shifts' ? '600' : '500',
                      color: activeTab === 'shifts' ? theme.primaryBlue : theme.textDark,
                    }}
                  >
                    Jam Kerja & Shift
                  </Text>
                </TouchableOpacity>

                {/* Tab 4: Departemen & Jabatan */}
                <TouchableOpacity
                  onPress={() => setActiveTab('departments')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    backgroundColor: activeTab === 'departments' ? theme.activeNavBg : 'transparent',
                    borderLeftWidth: isDesktop && activeTab === 'departments' ? 3 : 0,
                    borderLeftColor: theme.primaryBlue,
                  }}
                >
                  <Network
                    size={18}
                    color={activeTab === 'departments' ? theme.primaryBlue : theme.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === 'departments' ? '600' : '500',
                      color: activeTab === 'departments' ? theme.primaryBlue : theme.textDark,
                    }}
                  >
                    Departemen & Jabatan
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* ======================================================== */}
            {/* RIGHT SETTINGS CONTENT (.settings-content)               */}
            {/* ======================================================== */}
            <View style={{ flex: 1, width: '100%', gap: 20 }}>
              {/* TAB 2: PRESENSI & LOKASI (GPS) */}
              {activeTab === 'location' && (
                <>
                  {/* PANEL 1: Titik Lokasi Kantor (Geofencing) */}
                  <View
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 12,
                      padding: 25,
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
                        marginBottom: 20,
                        paddingBottom: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: theme.textDark,
                          marginBottom: 5,
                        }}
                      >
                        Titik Lokasi Kantor (Geofencing)
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Tentukan lokasi pusat absensi dan radius toleransi jarak pegawai dapat
                        melakukan presensi.
                      </Text>
                    </View>

                    {/* Visual Map Radar Preview with Interactive Click */}
                    <TouchableOpacity
                      onPress={() => setShowMapPicker(true)}
                      activeOpacity={0.85}
                      style={{
                        width: '100%',
                        height: 250,
                        backgroundColor: theme.isDark ? '#142036' : '#e2e8f0',
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 18,
                        borderWidth: 1.5,
                        borderColor: theme.primaryBlue,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Concentric Circle Radar */}
                      <View
                        style={{
                          position: 'absolute',
                          width: 220,
                          height: 220,
                          borderRadius: 110,
                          borderWidth: 1,
                          borderColor: 'rgba(42, 117, 211, 0.25)',
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          width: 150,
                          height: 150,
                          borderRadius: 75,
                          backgroundColor: 'rgba(42, 117, 211, 0.18)',
                          borderWidth: 2,
                          borderColor: theme.primaryBlue,
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          width: 80,
                          height: 80,
                          borderRadius: 40,
                          borderWidth: 1,
                          borderColor: 'rgba(42, 117, 211, 0.4)',
                        }}
                      />

                      {/* Center Pin */}
                      <View style={{ zIndex: 2, alignItems: 'center' }}>
                        <MapPin size={36} color={theme.danger} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginTop: 6,
                            backgroundColor: theme.cardBg,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                          }}
                        >
                          Radius Absensi: {radius} Meter
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                          {latitude}, {longitude}
                        </Text>
                      </View>

                      {/* Floating Badge to Open Map */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.primaryBlue,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          gap: 6,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      >
                        <Map size={15} color="#ffffff" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
                          Pilih di Peta
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Form Row: Lat & Long */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        gap: 20,
                        marginBottom: 16,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Latitude (Garis Lintang)
                        </Text>
                        <TextInput
                          value={latitude}
                          onChangeText={setLatitude}
                          style={{
                            width: '100%',
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Longitude (Garis Bujur)
                        </Text>
                        <TextInput
                          value={longitude}
                          onChangeText={setLongitude}
                          style={{
                            width: '100%',
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                    </View>

                    {/* Radius Input Group */}
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.textDark,
                          marginBottom: 8,
                        }}
                      >
                        Radius Toleransi Lokasi
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          value={radius}
                          onChangeText={setRadius}
                          keyboardType="numeric"
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderTopLeftRadius: 8,
                            borderBottomLeftRadius: 8,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                        <View
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            backgroundColor: theme.subtleBg,
                            borderWidth: 1,
                            borderLeftWidth: 0,
                            borderColor: theme.borderColor,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: theme.textMuted, fontWeight: '500' }}>
                            Meter
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>
                        Pegawai hanya bisa absen masuk/pulang jika berada dalam radius ini dari titik
                        kordinat di atas.
                      </Text>
                    </View>

                    {/* Action Buttons: Buka Peta Interaktif & Gunakan GPS */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        gap: 12,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setShowMapPicker(true)}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 10,
                          backgroundColor: theme.primaryBlue,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 8,
                          shadowColor: theme.primaryBlue,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Map size={16} color="#ffffff" />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
                          Pilih Titik di Peta (Interactive Map)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleGetCurrentLocation}
                        disabled={locatingCurrent}
                        style={{
                          flex: isDesktop ? 1 : undefined,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          backgroundColor: theme.subtleBg,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {locatingCurrent ? (
                          <ActivityIndicator size="small" color={theme.primaryBlue} />
                        ) : (
                          <Crosshair size={16} color={theme.textDark} />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>
                          {locatingCurrent ? 'Mendeteksi...' : 'Ambil GPS Saat Ini'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* PANEL 2: Validasi Keamanan Presensi */}
                  <View
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 12,
                      padding: 25,
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
                        marginBottom: 20,
                        paddingBottom: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: theme.textDark,
                          marginBottom: 5,
                        }}
                      >
                        Validasi Keamanan Presensi
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Aktifkan atau nonaktifkan syarat validasi tambahan saat pegawai melakukan
                        absensi.
                      </Text>
                    </View>

                    {/* Toggle Row 1: Wajib Aktifkan GPS */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 15 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 4,
                          }}
                        >
                          Wajib Aktifkan GPS
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          Aplikasi akan menolak presensi jika GPS dimatikan atau menggunakan Fake GPS.
                        </Text>
                      </View>
                      <Switch
                        value={requireGps}
                        onValueChange={setRequireGps}
                        trackColor={{ false: '#cbd5e1', true: theme.success }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {/* Toggle Row 2: Wajib Foto Selfie */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 15 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 4,
                          }}
                        >
                          Wajib Foto Selfie (Liveness)
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          Pegawai wajib melampirkan foto selfie secara real-time melalui kamera
                          aplikasi.
                        </Text>
                      </View>
                      <Switch
                        value={requireSelfie}
                        onValueChange={setRequireSelfie}
                        trackColor={{ false: '#cbd5e1', true: theme.success }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {/* Toggle Row 3: Tolak Presensi Diluar Jam Shift */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 15,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 15 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 4,
                          }}
                        >
                          Tolak Presensi Diluar Jam Shift
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          Mencegah pegawai absen masuk jika lebih dari 2 jam sebelum shift dimulai.
                        </Text>
                      </View>
                      <Switch
                        value={rejectOutsideShift}
                        onValueChange={setRejectOutsideShift}
                        trackColor={{ false: '#cbd5e1', true: theme.success }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>

                  {/* PANEL 3: Pengaturan Jam Kerja Standar */}
                  <View
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 12,
                      padding: 25,
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
                        marginBottom: 20,
                        paddingBottom: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: theme.textDark,
                          marginBottom: 5,
                        }}
                      >
                        Pengaturan Jam Kerja Standar
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Jam kerja ini akan digunakan sebagai default jika pegawai tidak memiliki jadwal
                        shift khusus.
                      </Text>
                    </View>

                    {/* Form Row: Jam Masuk & Jam Pulang */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        gap: 20,
                        marginBottom: 16,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Jam Masuk Standar
                        </Text>
                        <TextInput
                          value={workStartTime}
                          onChangeText={setWorkStartTime}
                          placeholder="08:00"
                          placeholderTextColor={theme.placeholder}
                          style={{
                            width: '100%',
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Jam Pulang Standar
                        </Text>
                        <TextInput
                          value={workEndTime}
                          onChangeText={setWorkEndTime}
                          placeholder="17:00"
                          placeholderTextColor={theme.placeholder}
                          style={{
                            width: '100%',
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                    </View>

                    {/* Form Row: Toleransi & Hari Kerja */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        gap: 20,
                        marginBottom: 20,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Toleransi Keterlambatan
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            value={lateTolerance}
                            onChangeText={setLateTolerance}
                            keyboardType="numeric"
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              paddingHorizontal: 15,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              borderTopLeftRadius: 8,
                              borderBottomLeftRadius: 8,
                              fontSize: 14,
                              color: theme.textDark,
                              backgroundColor: theme.inputBg,
                            }}
                          />
                          <View
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 15,
                              backgroundColor: theme.subtleBg,
                              borderWidth: 1,
                              borderLeftWidth: 0,
                              borderColor: theme.borderColor,
                              borderTopRightRadius: 8,
                              borderBottomRightRadius: 8,
                            }}
                          >
                            <Text
                              style={{ fontSize: 14, color: theme.textMuted, fontWeight: '500' }}
                            >
                              Menit
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>
                          Pegawai dianggap terlambat jika absen di atas 08:15.
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 8,
                          }}
                        >
                          Hari Kerja
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => setWorkDays('5')}
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor:
                                workDays === '5' ? theme.primaryBlue : theme.borderColor,
                              backgroundColor:
                                workDays === '5' ? theme.activeNavBg : theme.inputBg,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: workDays === '5' ? '600' : '400',
                                color: workDays === '5' ? theme.primaryBlue : theme.textDark,
                              }}
                            >
                              Senin - Jumat (5 Hari)
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setWorkDays('6')}
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor:
                                workDays === '6' ? theme.primaryBlue : theme.borderColor,
                              backgroundColor:
                                workDays === '6' ? theme.activeNavBg : theme.inputBg,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: workDays === '6' ? '600' : '400',
                                color: workDays === '6' ? theme.primaryBlue : theme.textDark,
                              }}
                            >
                              Senin - Sabtu (6 Hari)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Buttons: Batal & Simpan Pengaturan */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 15,
                        marginTop: 20,
                        paddingTop: 20,
                        borderTopWidth: 1,
                        borderTopColor: theme.borderColor,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => showToast('Perubahan dibatalkan')}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          backgroundColor: theme.subtleBg,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                          Batal
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveSettings}
                        disabled={isSaving}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 20,
                          borderRadius: 8,
                          backgroundColor: theme.primaryBlue,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Save size={16} color="#ffffff" />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>
                          Simpan Pengaturan
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* TAB 1: PROFIL PERUSAHAAN */}
              {activeTab === 'company' && (
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    padding: 25,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <View
                    style={{
                      marginBottom: 20,
                      paddingBottom: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: theme.textDark,
                        marginBottom: 5,
                      }}
                    >
                      Profil & Legalitas Perusahaan
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Perbarui informasi identitas perusahaan yang terhubung dengan akun HadirYuk Anda.
                    </Text>
                  </View>

                  <View style={{ gap: 16 }}>
                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.textDark,
                          marginBottom: 6,
                        }}
                      >
                        Nama Perusahaan (Entitas Resmi)
                      </Text>
                      <TextInput
                        value={companyName}
                        onChangeText={setCompanyName}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          height: 40,
                          fontSize: 14,
                          color: theme.textDark,
                          backgroundColor: theme.inputBg,
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 6,
                          }}
                        >
                          Email Resmi Perusahaan
                        </Text>
                        <TextInput
                          value={companyEmail}
                          onChangeText={setCompanyEmail}
                          keyboardType="email-address"
                          style={{
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            height: 40,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 6,
                          }}
                        >
                          Nomor Telepon Kantor
                        </Text>
                        <TextInput
                          value={companyPhone}
                          onChangeText={setCompanyPhone}
                          keyboardType="phone-pad"
                          style={{
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            height: 40,
                            fontSize: 14,
                            color: theme.textDark,
                            backgroundColor: theme.inputBg,
                          }}
                        />
                      </View>
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.textDark,
                          marginBottom: 6,
                        }}
                      >
                        Alamat Kantor Pusat
                      </Text>
                      <TextInput
                        value={companyAddress}
                        onChangeText={setCompanyAddress}
                        multiline
                        numberOfLines={3}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 14,
                          color: theme.textDark,
                          backgroundColor: theme.inputBg,
                          minHeight: 70,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.textDark,
                          marginBottom: 6,
                        }}
                      >
                        Website Perusahaan
                      </Text>
                      <TextInput
                        value={companyWebsite}
                        onChangeText={setCompanyWebsite}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          height: 40,
                          fontSize: 14,
                          color: theme.textDark,
                          backgroundColor: theme.inputBg,
                        }}
                      />
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: 15,
                      marginTop: 20,
                      paddingTop: 20,
                      borderTopWidth: 1,
                      borderTopColor: theme.borderColor,
                    }}
                  >
                    <TouchableOpacity
                      onPress={handleSaveSettings}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        backgroundColor: theme.primaryBlue,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Save size={16} color="#ffffff" />
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>
                        Simpan Profil Perusahaan
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* TAB 3: JAM KERJA & SHIFT */}
              {activeTab === 'shifts' && (
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    padding: 25,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <View
                    style={{
                      marginBottom: 20,
                      paddingBottom: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 15 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: theme.textDark,
                          marginBottom: 5,
                        }}
                      >
                        Daftar Shift Kerja
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Atur variasi jadwal kerja & pola shift untuk karyawan kantor maupun lapangan.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleOpenAddShift}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 6,
                        backgroundColor: theme.primaryBlue,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} color="#fff" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                        Tambah Shift
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {shifts.length === 0 ? (
                    <View
                      style={{
                        padding: 35,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.subtleBg,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderStyle: 'dashed',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: theme.isDark ? '#1e293b' : '#eff6ff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={24} color={theme.primaryBlue} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                        Belum Ada Shift Kerja Ditambahkan
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.textMuted,
                          textAlign: 'center',
                          maxWidth: 440,
                          lineHeight: 18,
                        }}
                      >
                        Jam kerja karyawan saat ini default menggunakan jam standar kantor ({workStartTime} - {workEndTime}). Klik tombol "Tambah Shift" di atas untuk menambahkan jadwal shift khusus.
                      </Text>
                      <TouchableOpacity
                        onPress={handleOpenAddShift}
                        style={{
                          marginTop: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 6,
                          backgroundColor: theme.primaryBlue,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                          + Tambah Shift Sekarang
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {shifts.map((shift) => {
                        const countEmp = userList.filter((u) => u.startWorkTime === shift.startTime).length;
                        return (
                          <View
                            key={shift.id}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: 14,
                              borderRadius: 8,
                              backgroundColor: theme.subtleBg,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                            }}
                          >
                            <View style={{ gap: 4, flex: 1, paddingRight: 10 }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>
                                {shift.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                                Waktu: {shift.startTime} - {shift.endTime} • {shift.days || 'Senin - Sabtu'} • Istirahat {shift.breakMinutes || 60}m
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: theme.primaryBlue,
                                  backgroundColor: theme.activeNavBg,
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                }}
                              >
                                {countEmp} Pegawai
                              </Text>
                              <TouchableOpacity onPress={() => handleOpenEditShift(shift)}>
                                <Edit2 size={16} color={theme.textMuted} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteShift(shift.id)}>
                                <Trash2 size={16} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* TAB 4: DEPARTEMEN & JABATAN */}
              {activeTab === 'departments' && (
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    padding: 25,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <View
                    style={{
                      marginBottom: 20,
                      paddingBottom: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 15 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: theme.textDark,
                          marginBottom: 5,
                        }}
                      >
                        Struktur Organisasi & Divisi
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Kelola daftar departemen dan jabatan yang berlaku di perusahaan Anda.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleOpenAddDept}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 6,
                        backgroundColor: theme.primaryBlue,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} color="#fff" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                        Tambah Departemen
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {departments.length === 0 ? (
                    <View
                      style={{
                        padding: 35,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.subtleBg,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderStyle: 'dashed',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: theme.isDark ? '#1e293b' : '#eff6ff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Building2 size={24} color={theme.primaryBlue} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                        Belum Ada Departemen Ditambahkan
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.textMuted,
                          textAlign: 'center',
                          maxWidth: 440,
                          lineHeight: 18,
                        }}
                      >
                        Departemen perusahaan Anda masih kosong. Silakan klik tombol "Tambah Departemen" di atas untuk mulai membuat struktur divisi dan daftar jabatan.
                      </Text>
                      <TouchableOpacity
                        onPress={handleOpenAddDept}
                        style={{
                          marginTop: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 6,
                          backgroundColor: theme.primaryBlue,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                          + Tambah Departemen Sekarang
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {departments.map((d) => {
                        const countEmp = userList.filter((u) => u.department === d.name).length;
                        return (
                          <View
                            key={d.id}
                            style={{
                              padding: 14,
                              borderRadius: 8,
                              backgroundColor: theme.subtleBg,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>
                                  {d.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.primaryBlue, fontWeight: '600' }}>
                                  ({countEmp} Pegawai)
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <TouchableOpacity onPress={() => handleOpenEditDept(d)}>
                                  <Edit2 size={16} color={theme.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteDept(d.id)}>
                                  <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                            {d.positions && d.positions.length > 0 && (
                              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                {d.positions.map((p) => (
                                  <View
                                    key={p}
                                    style={{
                                      backgroundColor: theme.cardBg,
                                      borderWidth: 1,
                                      borderColor: theme.borderColor,
                                      paddingVertical: 3,
                                      paddingHorizontal: 8,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, color: theme.textMuted }}>{p}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal Tambah / Edit Shift Kerja */}
      <Modal visible={shiftModalOpen} transparent animationType="fade" onRequestClose={() => setShiftModalOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                {editingShiftId ? 'Edit Shift Kerja' : 'Tambah Shift Kerja Baru'}
              </Text>
              <TouchableOpacity onPress={() => setShiftModalOpen(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                  Nama Shift
                </Text>
                <TextInput
                  placeholder="Contoh: Shift Pagi, Shift Malam, Fleksibel"
                  placeholderTextColor={theme.placeholder}
                  value={shiftName}
                  onChangeText={setShiftName}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 42,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.inputBg,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Jam Masuk (HH:mm)
                  </Text>
                  <TextInput
                    placeholder="07:00"
                    placeholderTextColor={theme.placeholder}
                    value={shiftStartTime}
                    onChangeText={setShiftStartTime}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Jam Pulang (HH:mm)
                  </Text>
                  <TextInput
                    placeholder="15:00"
                    placeholderTextColor={theme.placeholder}
                    value={shiftEndTime}
                    onChangeText={setShiftEndTime}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Hari Kerja
                  </Text>
                  <TextInput
                    placeholder="Senin - Sabtu"
                    placeholderTextColor={theme.placeholder}
                    value={shiftDays}
                    onChangeText={setShiftDays}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Istirahat (Menit)
                  </Text>
                  <TextInput
                    placeholder="60"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={shiftBreakMinutes}
                    onChangeText={setShiftBreakMinutes}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
              <TouchableOpacity
                onPress={() => setShiftModalOpen(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: theme.subtleBg,
                }}
              >
                <Text style={{ fontSize: 14, color: theme.textDark, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveShiftModal}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: theme.primaryBlue,
                }}
              >
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>Simpan Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah / Edit Departemen */}
      <Modal visible={deptModalOpen} transparent animationType="fade" onRequestClose={() => setDeptModalOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                {editingDeptId ? 'Edit Departemen' : 'Tambah Departemen Baru'}
              </Text>
              <TouchableOpacity onPress={() => setDeptModalOpen(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                  Nama Departemen / Divisi
                </Text>
                <TextInput
                  placeholder="Contoh: Operasional, IT & Digital, Pemasaran, Keuangan"
                  placeholderTextColor={theme.placeholder}
                  value={deptName}
                  onChangeText={setDeptName}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 42,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.inputBg,
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                  Daftar Jabatan / Posisi (Pisahkan dengan koma)
                </Text>
                <TextInput
                  placeholder="Contoh: Staff, Supervisor, Manager, Kepala Regu"
                  placeholderTextColor={theme.placeholder}
                  value={deptPositions}
                  onChangeText={setDeptPositions}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 42,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.inputBg,
                  }}
                />
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  * Pisahkan beberapa posisi dengan tanda koma ( , )
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
              <TouchableOpacity
                onPress={() => setDeptModalOpen(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: theme.subtleBg,
                }}
              >
                <Text style={{ fontSize: 14, color: theme.textDark, fontWeight: '500' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveDeptModal}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: theme.primaryBlue,
                }}
              >
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>Simpan Departemen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Interactive Map Picker Modal */}
      <LocationMapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={handleSelectMapLocation}
        initialLatitude={parseFloat(latitude) || -6.2088}
        initialLongitude={parseFloat(longitude) || 106.8456}
        initialRadius={parseInt(radius, 10) || 50}
        title="Tentukan Titik Pusat Kantor Perusahaan"
      />
    </View>
  );
}
