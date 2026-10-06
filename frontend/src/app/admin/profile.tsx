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
  const [companyName, setCompanyName] = useState('PT HadirYuk Digital Solusi');
  const [companyEmail, setCompanyEmail] = useState('kontak@hadiryuk.id');
  const [companyPhone, setCompanyPhone] = useState('+62 21-5550-1234');
  const [companyAddress, setCompanyAddress] = useState('Jl. Jend. Sudirman Kav. 52-53, SCBD, Jakarta Selatan');
  const [companyWebsite, setCompanyWebsite] = useState('https://hadiryuk.id');

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
        }
      } catch (err) {
        // Keep current state
      }
    };
    fetchCompanyConfig();
  }, []);

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
                    <View>
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
                        Atur variasi jadwal kerja untuk divisi operasional atau karyawan shift.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => showToast('Form shift baru siap dibuat')}
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

                  <View style={{ gap: 12 }}>
                    {[
                      { name: 'Shift Pagi (General)', time: '08:00 - 17:00', days: 'Senin - Sabtu', total: '180 Pegawai' },
                      { name: 'Shift Siang (Operations)', time: '13:00 - 21:00', days: 'Senin - Sabtu', total: '45 Pegawai' },
                      { name: 'Shift Malam (Security / Tech)', time: '21:00 - 06:00', days: 'Senin - Minggu', total: '25 Pegawai' },
                    ].map((shift, i) => (
                      <View
                        key={shift.name}
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
                        <View style={{ gap: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>
                            {shift.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textMuted }}>
                            Waktu: {shift.time} • {shift.days}
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
                            {shift.total}
                          </Text>
                          <TouchableOpacity onPress={() => showToast('Edit ' + shift.name)}>
                            <Edit2 size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
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
                    <View>
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
                        Kelola daftar departemen dan jabatan yang ada di kantor Anda.
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 10 }}>
                    {[
                      { dept: 'IT & Engineering', count: '45 Pegawai', positions: ['System Administrator', 'Senior Staff', 'Fullstack Dev'] },
                      { dept: 'Human Resources', count: '15 Pegawai', positions: ['HR Specialist', 'Talent Acquisition', 'General Affair'] },
                      { dept: 'Finance', count: '22 Pegawai', positions: ['Finance Manager', 'Accountant', 'Billing Officer'] },
                      { dept: 'Operations', count: '168 Pegawai', positions: ['Operations Staff', 'Quality Control', 'Courier'] },
                    ].map((d) => (
                      <View
                        key={d.dept}
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
                            marginBottom: 8,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>
                            {d.dept}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.primaryBlue, fontWeight: '600' }}>
                            {d.count}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                          {d.positions.map((p) => (
                            <View
                              key={p}
                              style={{
                                backgroundColor: theme.cardBg,
                                borderWidth: 1,
                                borderColor: theme.borderColor,
                                paddingVertical: 4,
                                paddingHorizontal: 8,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 11, color: theme.textMuted }}>{p}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

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
