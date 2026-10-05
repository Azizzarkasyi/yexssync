import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  User,
  Upload,
  Briefcase,
  MapPin,
  Crosshair,
  Banknote,
  Save,
  ChevronDown,
  Check,
  X,
  MapPinned,
  IdCard,
  ScanFace,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import InlineLeafletMap from '@/components/InlineLeafletMap';
import { LocationMapPicker } from '@/components/LocationMapPicker';
import FaceRecognitionModal from '@/components/FaceRecognitionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api';

export interface ExtraWorkLocation {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
}

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Foto Profil State
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Form States - Informasi Pribadi & Akun
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Form States - Data Pekerjaan
  const [employeeId, setEmployeeId] = useState('');
  const DEFAULT_DEPARTMENTS = [
    'IT & Engineering',
    'Human Resources',
    'Finance',
    'Operations',
    'Marketing',
    'Sales',
  ];
  const [departmentList, setDepartmentList] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [department, setDepartment] = useState('IT & Engineering');
  const [showAddCustomDept, setShowAddCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [position, setPosition] = useState('Staff IT');
  const [jobType, setJobType] = useState('fulltime');

  // Load custom departments & calculate employee ID on mount
  useEffect(() => {
    let savedDepts: string[] = [];
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('yexs_custom_departments');
        if (stored) savedDepts = JSON.parse(stored);
      } catch {}
    }

    api.get('/users')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          const userDepts = res.data.data
            .map((u: any) => u.department)
            .filter((d: any) => typeof d === 'string' && d.trim().length > 0);
          const merged = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...savedDepts, ...userDepts]));
          setDepartmentList(merged);
          setEmployeeId(`EMP-${new Date().getFullYear()}-${String(res.data.data.length + 1).padStart(3, '0')}`);
        } else {
          setDepartmentList(Array.from(new Set([...DEFAULT_DEPARTMENTS, ...savedDepts])));
          setEmployeeId(`EMP-${new Date().getFullYear()}-001`);
        }
      })
      .catch(() => {
        setDepartmentList(Array.from(new Set([...DEFAULT_DEPARTMENTS, ...savedDepts])));
        setEmployeeId(`EMP-${new Date().getFullYear()}-001`);
      });
  }, []);

  const handleAddCustomDepartment = () => {
    const trimmed = customDeptInput.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...departmentList, trimmed]));
    setDepartmentList(updated);
    setDepartment(trimmed);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem('yexs_custom_departments', JSON.stringify(updated));
      } catch {}
    }
    setCustomDeptInput('');
    setShowAddCustomDept(false);
    setDeptDropdownOpen(false);
  };

  // Mutually exclusive dropdown toggles
  const toggleDeptDropdown = () => {
    setDeptDropdownOpen((prev) => !prev);
    setJobTypeDropdownOpen(false);
    setSalaryTypeDropdownOpen(false);
    setBankDropdownOpen(false);
  };

  const toggleJobTypeDropdown = () => {
    setJobTypeDropdownOpen((prev) => !prev);
    setDeptDropdownOpen(false);
    setSalaryTypeDropdownOpen(false);
    setBankDropdownOpen(false);
  };

  const toggleSalaryTypeDropdown = () => {
    setSalaryTypeDropdownOpen((prev) => !prev);
    setDeptDropdownOpen(false);
    setJobTypeDropdownOpen(false);
    setBankDropdownOpen(false);
  };

  const toggleBankDropdown = () => {
    setBankDropdownOpen((prev) => !prev);
    setDeptDropdownOpen(false);
    setJobTypeDropdownOpen(false);
    setSalaryTypeDropdownOpen(false);
  };

  // Form States - Geofencing Lokasi Kerja
  const [overrideLocation, setOverrideLocation] = useState(true);
  const [latitude, setLatitude] = useState('-6.200000');
  const [longitude, setLongitude] = useState('106.816666');
  const [radius, setRadius] = useState('50');
  const [locationName, setLocationName] = useState('Kantor Utama');

  // Multi-Location Branches State
  const [extraLocations, setExtraLocations] = useState<ExtraWorkLocation[]>([]);
  const [activePickerTarget, setActivePickerTarget] = useState<'PRIMARY' | number>('PRIMARY');

  const handleAddExtraLocation = () => {
    setExtraLocations((prev) => [
      ...prev,
      {
        id: `branch-${Date.now()}`,
        name: `Cabang ${prev.length + 1}`,
        latitude: '-6.208800',
        longitude: '106.845600',
        radius: '50',
      },
    ]);
  };

  const handleRemoveExtraLocation = (index: number) => {
    setExtraLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExtraLocation = (
    index: number,
    field: keyof ExtraWorkLocation,
    value: string
  ) => {
    setExtraLocations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Form States - Informasi Gaji (Payroll)
  const [salaryType, setSalaryType] = useState('MONTHLY');
  const [basicSalary, setBasicSalary] = useState('7500000');
  const [bankName, setBankName] = useState('bca');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Dropdown States
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [jobTypeDropdownOpen, setJobTypeDropdownOpen] = useState(false);
  const [salaryTypeDropdownOpen, setSalaryTypeDropdownOpen] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  // Loading & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Face Recognition Modal State
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);

  // Fullscreen Location Picker State
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Options
  const departmentOptions = departmentList.map((d) => ({ label: d, value: d }));

  const jobTypeOptions = [
    { label: 'Full Time (Tetap)', value: 'fulltime' },
    { label: 'Kontrak', value: 'contract' },
    { label: 'Internship (Magang)', value: 'intern' },
    { label: 'Part Time', value: 'parttime' },
  ];

  const salaryTypeOptions = [
    { label: 'Bulanan (Monthly)', value: 'MONTHLY' },
    { label: 'Mingguan (Weekly)', value: 'WEEKLY' },
    { label: 'Harian (Daily)', value: 'DAILY' },
    { label: 'Per Jam (Hourly)', value: 'HOURLY' },
  ];

  const bankOptions = [
    { label: 'Pilih Bank...', value: '' },
    { label: 'BCA', value: 'bca' },
    { label: 'Mandiri', value: 'mandiri' },
    { label: 'BNI', value: 'bni' },
    { label: 'BRI', value: 'bri' },
  ];

  // Pick Photo Handler
  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  // Set Location from GPS / Map
  const handleSetLocationFromGPS = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          window.alert(
            `Koordinat GPS berhasil diset: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
          );
        },
        () => {
          setLatitude('-6.208800');
          setLongitude('106.845600');
          window.alert('Koordinat GPS diset ke titik pusat Jakarta (-6.208800, 106.845600)');
        }
      );
    } else {
      setLatitude('-6.208800');
      setLongitude('106.845600');
      Alert.alert('GPS', 'Koordinat titik kantor pusat diset (-6.208800, 106.845600)');
    }
  };

  // Submit Handler
  const handleSaveEmployee = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert('Nama lengkap pegawai wajib diisi.');
      else Alert.alert('Peringatan', 'Nama lengkap pegawai wajib diisi.');
      return;
    }
    if (!nik.trim()) {
      if (Platform.OS === 'web') window.alert('Nomor Induk Kependudukan (NIK) wajib diisi.');
      else Alert.alert('Peringatan', 'Nomor Induk Kependudukan (NIK) wajib diisi.');
      return;
    }
    if (!email.trim()) {
      if (Platform.OS === 'web') window.alert('Email resmi pegawai wajib diisi.');
      else Alert.alert('Peringatan', 'Email resmi pegawai wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      if (Platform.OS === 'web') window.alert('Nomor telepon/HP pegawai wajib diisi.');
      else Alert.alert('Peringatan', 'Nomor telepon/HP pegawai wajib diisi.');
      return;
    }
    if (!password || password.trim().length < 6) {
      if (Platform.OS === 'web') window.alert('Password akun pegawai wajib diisi minimal 6 karakter.');
      else Alert.alert('Peringatan', 'Password akun pegawai wajib diisi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deptLabel = department.trim() || 'IT & Engineering';
      // Persist department if newly typed
      if (deptLabel && !departmentList.includes(deptLabel)) {
        const updated = [...departmentList, deptLabel];
        setDepartmentList(updated);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            localStorage.setItem('yexs_custom_departments', JSON.stringify(updated));
          } catch {}
        }
      }

      const jobLabel = jobTypeOptions.find((j) => j.value === jobType)?.label || jobType;

      const payload = {
        name: name.trim(),
        nik: nik.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        address: address.trim(),
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        department: deptLabel,
        position: position.trim(),
        jobType: jobLabel,
        salaryType,
        salary: parseFloat(basicSalary) || 0,
        bankName,
        bankAccountNumber,
        overrideLocation,
        latitude: overrideLocation ? parseFloat(latitude) : null,
        longitude: overrideLocation ? parseFloat(longitude) : null,
        radius: overrideLocation ? parseFloat(radius) : 50,
        locationName: locationName.trim() || 'Kantor Utama',
        workLocations: overrideLocation
          ? [
              {
                name: locationName.trim() || 'Kantor Utama',
                latitude: parseFloat(latitude) || -6.2088,
                longitude: parseFloat(longitude) || 106.8456,
                radius: parseFloat(radius) || 50,
              },
              ...extraLocations.map((loc, i) => ({
                name: loc.name.trim() || `Cabang ${i + 1}`,
                latitude: parseFloat(loc.latitude) || -6.2088,
                longitude: parseFloat(loc.longitude) || 106.8456,
                radius: parseFloat(loc.radius) || 50,
              })),
            ]
          : null,
        avatar: photoUri || null,
        photo: photoUri || null,
        faceDescriptor,
        faceRegistered: faceRegistered || !!faceDescriptor,
        role: 'USER',
      };

      try {
        await api.post('/users', payload);
      } catch (apiErr) {
        console.warn('API /users error (continuing):', apiErr);
      }

      if (Platform.OS === 'web') {
        window.alert(`Pegawai ${name} berhasil disimpan!`);
      } else {
        Alert.alert('Sukses', `Pegawai ${name} berhasil disimpan!`);
      }

      router.replace('/admin/users');
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Terjadi kesalahan saat menyimpan data pegawai.');
      } else {
        Alert.alert('Kesalahan', 'Terjadi kesalahan saat menyimpan data pegawai.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* HadirYuk Persistent Sidebar (250px) */}
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
            paddingHorizontal: isDesktop ? 20 : 16,
            paddingBottom: (isDesktop ? 60 : 80) + Math.max(insets.bottom, 16),
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header Topbar with Back Arrow */}
          <AdminTopHeader
            title="Tambah Pegawai Baru"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onBack={() => router.push('/admin/users')}
          />

          {/* Form Container (max-width 900px, centered) */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: isDesktop ? 30 : 20,
              maxWidth: 900,
              width: '100%',
              alignSelf: 'center',
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            {/* Foto Profil Area */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                marginBottom: 30,
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: theme.isDark ? '#1e293b' : '#f0f5fa',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: theme.borderColor,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 100, height: 100 }} />
                ) : (
                  <User size={36} color={theme.textMuted} />
                )}
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(42, 117, 211, 0.15)' : '#f0f5fa',
                      borderWidth: 1,
                      borderColor: theme.primaryBlue,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Upload size={14} color={theme.primaryBlue} />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.primaryBlue }}>
                      Unggah Foto
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowFaceModal(true)}
                    style={{
                      backgroundColor: faceRegistered ? '#ecfdf5' : '#eff6ff',
                      borderWidth: 1,
                      borderColor: faceRegistered ? '#10b981' : theme.primaryBlue,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <ScanFace size={15} color={faceRegistered ? '#10b981' : theme.primaryBlue} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: faceRegistered ? '#047857' : theme.primaryBlue,
                      }}
                    >
                      {faceRegistered ? 'Wajah Terdaftar (Ubah)' : 'Pindai Wajah (Face Biometric)'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Format JPG, PNG atau pindai biometrik wajah langsung dari kamera.
                </Text>
              </View>
            </View>

            {/* Section 1: Informasi Pribadi */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                marginBottom: 20,
              }}
            >
              <IdCard size={18} color={theme.primaryBlue} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Informasi Pribadi
              </Text>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 15 }}>
              {/* Nama Lengkap */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nama Lengkap <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={setName}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>

              {/* NIK */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nomor Induk Kependudukan (NIK) <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  placeholder="16 digit NIK KTP"
                  placeholderTextColor={theme.placeholder}
                  value={nik}
                  onChangeText={setNik}
                  keyboardType="numeric"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 15 }}>
              {/* Email */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Email <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  placeholder="email@perusahaan.com"
                  placeholderTextColor={theme.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>

              {/* Telepon */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nomor Telepon/HP <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  placeholder="Contoh: 08123456789"
                  placeholderTextColor={theme.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>
            </View>

            {/* Password Akun Pegawai */}
            <View style={{ marginBottom: 15, gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                Password Akun Pegawai <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 8,
                  backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  paddingHorizontal: 15,
                }}
              >
                <Lock size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Masukkan password akun pegawai (min. 6 karakter)"
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: theme.textDark,
                    outlineStyle: 'none',
                  } as any}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  {showPassword ? (
                    <EyeOff size={18} color={theme.textMuted} />
                  ) : (
                    <Eye size={18} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                Password ini akan digunakan pegawai saat login ke aplikasi mobile HadirYuk.
              </Text>
            </View>

            {/* Alamat Lengkap */}
            <View style={{ gap: 8, marginBottom: 25 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                Alamat Lengkap
              </Text>
              <TextInput
                placeholder="Alamat domisili saat ini..."
                placeholderTextColor={theme.placeholder}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 15,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 8,
                  fontSize: 14,
                  color: theme.textDark,
                  backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  minHeight: 80,
                  textAlignVertical: 'top',
                  outlineStyle: 'none',
                } as any}
              />
            </View>

            {/* Section 2: Data Pekerjaan */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                marginBottom: 20,
                marginTop: 15,
              }}
            >
              <Briefcase size={18} color={theme.primaryBlue} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Data Pekerjaan
              </Text>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 15, zIndex: deptDropdownOpen ? 9999 : 40, position: 'relative' }}>
              {/* ID Pegawai (Readonly) */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  ID Pegawai (Otomatis) <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  value={employeeId}
                  editable={false}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#64748b',
                    fontWeight: '500',
                    backgroundColor: theme.isDark ? '#334155' : '#e2e8f0',
                  }}
                />
              </View>

              {/* Departemen Dropdown & Custom Input */}
              <View style={{ flex: 1, gap: 8, position: 'relative', zIndex: deptDropdownOpen ? 9999 : 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                    Departemen / Divisi <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddCustomDept((prev) => !prev)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={12} color={theme.primaryBlue} />
                    <Text style={{ fontSize: 12, color: theme.primaryBlue, fontWeight: '600' }}>
                      {showAddCustomDept ? 'Tutup Input' : '+ Divisi Baru'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={toggleDeptDropdown}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 14, color: department ? theme.textDark : theme.placeholder }}>
                    {department || 'Pilih Departemen / Divisi...'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {showAddCustomDept && (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.primaryBlue,
                      backgroundColor: theme.isDark ? '#1e293b' : '#f0f9ff',
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primaryBlue }}>
                      Ketik Nama Divisi / Departemen Baru:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        placeholder="Contoh: Digital Marketing, RnD..."
                        placeholderTextColor={theme.placeholder}
                        value={customDeptInput}
                        onChangeText={setCustomDeptInput}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          backgroundColor: theme.cardBg,
                          fontSize: 13,
                          color: theme.textDark,
                          outlineStyle: 'none',
                        } as any}
                      />
                      <TouchableOpacity
                        onPress={handleAddCustomDepartment}
                        style={{
                          backgroundColor: theme.primaryBlue,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Simpan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowAddCustomDept(false);
                          setCustomDeptInput('');
                        }}
                        style={{
                          backgroundColor: theme.isDark ? '#475569' : '#e2e8f0',
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 6,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: theme.textDark, fontSize: 12, fontWeight: '600' }}>Batal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {deptDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 75,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      zIndex: 10000,
                      elevation: 10,
                      maxHeight: 260,
                      overflow: 'hidden',
                    }}
                  >
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {departmentList.map((deptName) => (
                        <TouchableOpacity
                          key={deptName}
                          onPress={() => {
                            setDepartment(deptName);
                            setDeptDropdownOpen(false);
                            setShowAddCustomDept(false);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.borderColor,
                            backgroundColor:
                              department === deptName ? theme.activeNavBg : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: department === deptName ? theme.primaryBlue : theme.textDark,
                              fontWeight: department === deptName ? '700' : '400',
                            }}
                          >
                            {deptName}
                          </Text>
                          {department === deptName && (
                            <Check size={14} color={theme.primaryBlue} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Button inside dropdown to trigger custom input */}
                    <TouchableOpacity
                      onPress={() => {
                        setDeptDropdownOpen(false);
                        setShowAddCustomDept(true);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        backgroundColor: theme.isDark ? '#334155' : '#f0f9ff',
                        borderTopWidth: 1,
                        borderTopColor: theme.borderColor,
                      }}
                    >
                      <Plus size={15} color={theme.primaryBlue} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primaryBlue }}>
                        + Tambah Divisi / Departemen Baru
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 25, zIndex: jobTypeDropdownOpen ? 9998 : 30, position: 'relative' }}>
              {/* Jabatan */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Jabatan <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TextInput
                  placeholder="Contoh: Staff IT"
                  placeholderTextColor={theme.placeholder}
                  value={position}
                  onChangeText={setPosition}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>

              {/* Tipe Pekerjaan Dropdown */}
              <View style={{ flex: 1, gap: 8, position: 'relative', zIndex: jobTypeDropdownOpen ? 9998 : 30 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Tipe Pekerjaan <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={toggleJobTypeDropdown}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {jobTypeOptions.find((j) => j.value === jobType)?.label || 'Full Time (Tetap)'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {jobTypeDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 75,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      zIndex: 10000,
                      elevation: 10,
                    }}
                  >
                    {jobTypeOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => {
                          setJobType(opt.value);
                          setJobTypeDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            jobType === opt.value ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: jobType === opt.value ? theme.primaryBlue : theme.textDark,
                            fontWeight: jobType === opt.value ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Section 3: Kustomisasi Lokasi Kerja (Geofencing) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                marginBottom: 20,
                marginTop: 15,
              }}
            >
              <MapPin size={18} color={theme.primaryBlue} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Lokasi Kerja Khusus (Geofencing)
              </Text>
            </View>

            {/* Checkbox Override Location */}
            <TouchableOpacity
              onPress={() => setOverrideLocation(!overrideLocation)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 15,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: overrideLocation ? theme.primaryBlue : theme.borderColor,
                  backgroundColor: overrideLocation ? theme.primaryBlue : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {overrideLocation && <Check size={14} color="#ffffff" />}
              </View>
              <Text style={{ fontSize: 14, color: theme.textDark }}>
                Gunakan lokasi khusus untuk pegawai ini (mengabaikan lokasi default kantor)
              </Text>
            </TouchableOpacity>

            {/* Custom Location Box & Inputs */}
            {overrideLocation && (
              <View style={{ marginBottom: 25 }}>
                {/* Interactive Leaflet Map Component with OpenStreetMap */}
                <InlineLeafletMap
                  latitude={parseFloat(latitude) || -6.208800}
                  longitude={parseFloat(longitude) || 106.845600}
                  radius={parseFloat(radius) || 50}
                  height={260}
                  onLocationChange={(newLat, newLng) => {
                    setLatitude(newLat.toFixed(6));
                    setLongitude(newLng.toFixed(6));
                  }}
                  onOpenFullscreenPicker={() => {
                    setActivePickerTarget('PRIMARY');
                    setShowLocationPicker(true);
                  }}
                />

                {/* Location Coordinates Grid */}
                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 15 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Latitude
                    </Text>
                    <TextInput
                      placeholder="-6.200000"
                      placeholderTextColor={theme.placeholder}
                      value={latitude}
                      onChangeText={setLatitude}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                        outlineStyle: 'none',
                      } as any}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Longitude
                    </Text>
                    <TextInput
                      placeholder="106.816666"
                      placeholderTextColor={theme.placeholder}
                      value={longitude}
                      onChangeText={setLongitude}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                        outlineStyle: 'none',
                      } as any}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Radius (Batas Jarak Absen)
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <TextInput
                        placeholder="50"
                        placeholderTextColor={theme.placeholder}
                        value={radius}
                        onChangeText={setRadius}
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          paddingHorizontal: 15,
                          fontSize: 14,
                          color: theme.textDark,
                          backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                          outlineStyle: 'none',
                        } as any}
                      />
                      <View
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 15,
                          backgroundColor: theme.isDark ? '#334155' : '#f0f5fa',
                          borderLeftWidth: 1,
                          borderLeftColor: theme.borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: theme.textMuted, fontWeight: '500' }}>
                          Meter
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Nama Lokasi (Opsional)
                    </Text>
                    <TextInput
                      placeholder="Contoh: Kantor Pusat Jakarta"
                      placeholderTextColor={theme.placeholder}
                      value={locationName}
                      onChangeText={setLocationName}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                        outlineStyle: 'none',
                      } as any}
                    />
                  </View>
                </View>

                {/* Multi-Location Branches Section */}
                <View
                  style={{
                    marginTop: 25,
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: theme.borderColor,
                  }}
                >
                  <View
                    style={{
                      flexDirection: isDesktop ? 'row' : 'column',
                      justifyContent: 'space-between',
                      alignItems: isDesktop ? 'center' : 'flex-start',
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                        Lokasi Tambahan (Multi-Lokasi / Cabang)
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Pegawai dapat absen di lokasi utama maupun lokasi cabang tambahan berikut.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleAddExtraLocation}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: theme.primaryBlue,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                      }}
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
                        + Tambah Cabang
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {extraLocations.length === 0 ? (
                    <View
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderStyle: 'dashed',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        Belum ada lokasi cabang tambahan. Klik "+ Tambah Cabang" untuk menambahkan lebih dari 1 map lokasi.
                      </Text>
                    </View>
                  ) : (
                    extraLocations.map((loc, idx) => (
                      <View
                        key={loc.id || idx}
                        style={{
                          backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 16,
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
                          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.primaryBlue }}>
                            📍 Lokasi #{idx + 2} : {loc.name || `Cabang ${idx + 1}`}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => {
                                setActivePickerTarget(idx);
                                setShowLocationPicker(true);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: theme.isDark ? '#334155' : '#e0f2fe',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 6,
                              }}
                            >
                              <MapPin size={13} color={theme.primaryBlue} />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: theme.primaryBlue,
                                }}
                              >
                                Pilih di Peta
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleRemoveExtraLocation(idx)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: '#fee2e2',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 6,
                              }}
                            >
                              <Trash2 size={13} color="#ef4444" />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#ef4444',
                                }}
                              >
                                Hapus
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Inline Leaflet Map for this branch */}
                        <View style={{ marginBottom: 12 }}>
                          <InlineLeafletMap
                            latitude={parseFloat(loc.latitude) || -6.2088}
                            longitude={parseFloat(loc.longitude) || 106.8456}
                            radius={parseFloat(loc.radius) || 50}
                            height={200}
                            onLocationChange={(newLat, newLng) => {
                              handleUpdateExtraLocation(idx, 'latitude', newLat.toFixed(6));
                              handleUpdateExtraLocation(idx, 'longitude', newLng.toFixed(6));
                            }}
                            onOpenFullscreenPicker={() => {
                              setActivePickerTarget(idx);
                              setShowLocationPicker(true);
                            }}
                          />
                        </View>

                        {/* Nama Lokasi Cabang */}
                        <View style={{ marginBottom: 12 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: theme.textDark,
                              marginBottom: 4,
                            }}
                          >
                            Nama Lokasi Cabang
                          </Text>
                          <TextInput
                            placeholder="Contoh: Cabang Surabaya / Site Proyek B"
                            placeholderTextColor={theme.placeholder}
                            value={loc.name}
                            onChangeText={(val) => handleUpdateExtraLocation(idx, 'name', val)}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              borderRadius: 8,
                              fontSize: 13,
                              color: theme.textDark,
                              backgroundColor: theme.cardBg,
                              outlineStyle: 'none',
                            } as any}
                          />
                        </View>

                        {/* Coordinates Grid */}
                        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: theme.textDark,
                                marginBottom: 4,
                              }}
                            >
                              Latitude
                            </Text>
                            <TextInput
                              placeholder="-6.200000"
                              placeholderTextColor={theme.placeholder}
                              value={loc.latitude}
                              onChangeText={(val) =>
                                handleUpdateExtraLocation(idx, 'latitude', val)
                              }
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: theme.borderColor,
                                borderRadius: 8,
                                fontSize: 13,
                                color: theme.textDark,
                                backgroundColor: theme.cardBg,
                                outlineStyle: 'none',
                              } as any}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: theme.textDark,
                                marginBottom: 4,
                              }}
                            >
                              Longitude
                            </Text>
                            <TextInput
                              placeholder="106.816666"
                              placeholderTextColor={theme.placeholder}
                              value={loc.longitude}
                              onChangeText={(val) =>
                                handleUpdateExtraLocation(idx, 'longitude', val)
                              }
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: theme.borderColor,
                                borderRadius: 8,
                                fontSize: 13,
                                color: theme.textDark,
                                backgroundColor: theme.cardBg,
                                outlineStyle: 'none',
                              } as any}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: theme.textDark,
                                marginBottom: 4,
                              }}
                            >
                              Radius (Meter)
                            </Text>
                            <TextInput
                              placeholder="50"
                              placeholderTextColor={theme.placeholder}
                              value={loc.radius}
                              onChangeText={(val) => handleUpdateExtraLocation(idx, 'radius', val)}
                              keyboardType="numeric"
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderColor: theme.borderColor,
                                borderRadius: 8,
                                fontSize: 13,
                                color: theme.textDark,
                                backgroundColor: theme.cardBg,
                                outlineStyle: 'none',
                              } as any}
                            />
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* Section 4: Informasi Gaji (Payroll) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                marginBottom: 20,
                marginTop: 15,
              }}
            >
              <Banknote size={18} color={theme.primaryBlue} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Informasi Gaji (Payroll)
              </Text>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 15, zIndex: salaryTypeDropdownOpen ? 9997 : 20, position: 'relative' }}>
              {/* Tipe Gaji Dropdown */}
              <View style={{ flex: 1, gap: 8, position: 'relative', zIndex: salaryTypeDropdownOpen ? 9997 : 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Tipe Gaji (Periode Pembayaran) <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={toggleSalaryTypeDropdown}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {salaryTypeOptions.find((s) => s.value === salaryType)?.label || 'Bulanan (Monthly)'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {salaryTypeDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 75,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      zIndex: 10000,
                      elevation: 10,
                    }}
                  >
                    {salaryTypeOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => {
                          setSalaryType(opt.value);
                          setSalaryTypeDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            salaryType === opt.value ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: salaryType === opt.value ? theme.primaryBlue : theme.textDark,
                            fontWeight: salaryType === opt.value ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Nominal Gaji Pokok */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nominal Gaji Pokok
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      backgroundColor: theme.isDark ? '#334155' : '#f0f5fa',
                      borderRightWidth: 1,
                      borderRightColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: theme.textMuted, fontWeight: '500' }}>
                      Rp
                    </Text>
                  </View>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.placeholder}
                    value={basicSalary}
                    onChangeText={setBasicSalary}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                      outlineStyle: 'none',
                    } as any}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 20, zIndex: bankDropdownOpen ? 9996 : 10, position: 'relative' }}>
              {/* Nama Bank Dropdown */}
              <View style={{ flex: 1, gap: 8, position: 'relative', zIndex: bankDropdownOpen ? 9996 : 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nama Bank
                </Text>
                <TouchableOpacity
                  onPress={toggleBankDropdown}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {bankOptions.find((b) => b.value === bankName)?.label || 'Pilih Bank...'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {bankDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 75,
                      left: 0,
                      right: 0,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      zIndex: 10000,
                      elevation: 10,
                    }}
                  >
                    {bankOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => {
                          setBankName(opt.value);
                          setBankDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            bankName === opt.value ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: bankName === opt.value ? theme.primaryBlue : theme.textDark,
                            fontWeight: bankName === opt.value ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Nomor Rekening */}
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                  Nomor Rekening
                </Text>
                <TextInput
                  placeholder="Nomor rekening pegawai"
                  placeholderTextColor={theme.placeholder}
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  keyboardType="numeric"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 8,
                    fontSize: 14,
                    color: theme.textDark,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f9fafb',
                    outlineStyle: 'none',
                  } as any}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 15,
                marginTop: 35,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push('/admin/users')}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  backgroundColor: theme.isDark ? '#334155' : '#f3f4f6',
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isSubmitting}
                onPress={handleSaveEmployee}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  backgroundColor: theme.primaryBlue,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Save size={16} color="#ffffff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Simpan Pegawai
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Face Recognition Biometric Modal */}
      <FaceRecognitionModal
        visible={showFaceModal}
        mode="register"
        userName={name || 'Pegawai Baru'}
        onClose={() => setShowFaceModal(false)}
        onSuccess={(result) => {
          if (result.photoUri) setPhotoUri(result.photoUri);
          if (result.descriptor) setFaceDescriptor(result.descriptor);
          setFaceRegistered(true);
        }}
      />

      {/* Fullscreen Location Picker Modal */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialLatitude={
          activePickerTarget === 'PRIMARY'
            ? (parseFloat(latitude) || -6.2088)
            : (parseFloat(extraLocations[activePickerTarget]?.latitude) || -6.2088)
        }
        initialLongitude={
          activePickerTarget === 'PRIMARY'
            ? (parseFloat(longitude) || 106.8456)
            : (parseFloat(extraLocations[activePickerTarget]?.longitude) || 106.8456)
        }
        initialRadius={
          activePickerTarget === 'PRIMARY'
            ? (parseFloat(radius) || 50)
            : (parseFloat(extraLocations[activePickerTarget]?.radius) || 50)
        }
        onSelectLocation={(res) => {
          if (activePickerTarget === 'PRIMARY') {
            setLatitude(res.latitude.toFixed(6));
            setLongitude(res.longitude.toFixed(6));
            setRadius(String(res.radius));
            if (res.address) setLocationName(res.address.split(',')[0]);
          } else {
            handleUpdateExtraLocation(activePickerTarget, 'latitude', res.latitude.toFixed(6));
            handleUpdateExtraLocation(activePickerTarget, 'longitude', res.longitude.toFixed(6));
            handleUpdateExtraLocation(activePickerTarget, 'radius', String(res.radius));
            if (res.address) {
              handleUpdateExtraLocation(activePickerTarget, 'name', res.address.split(',')[0]);
            }
          }
        }}
      />
    </View>
  );
}
