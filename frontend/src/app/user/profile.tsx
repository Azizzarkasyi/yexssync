import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  User,
  Building2,
  Lock,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Receipt,
  Landmark,
  FileText,
  ChevronRight,
  LogOut,
  Eye,
  EyeOff,
  Download,
  Pencil,
  X,
  Check,
  Briefcase,
  Calendar,
  CreditCard,
  FileCheck,
  Info,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { FaceCamera } from '@/components/FaceCamera';
import api from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';
import { APP_ENV } from '@/config/env';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout, loadUser } = useContext(AuthContext);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);

  // Latest Payroll state
  const [latestPayroll, setLatestPayroll] = useState<any>(null);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');

  const [showJobModal, setShowJobModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showBankModal, setShowBankModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const avatarUri =
    (user as any)?.photo ||
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    'https://i.pravatar.cc/150?img=12';

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if ((user as any)?.phone) {
      setPhone((user as any).phone);
    }
    fetchLatestPayroll();
  }, [user]);

  const fetchLatestPayroll = async () => {
    try {
      let res;
      try {
        res = await api.get('/payroll/my');
      } catch {
        res = await api.get('/payrolls/my-payrolls');
      }

      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setLatestPayroll(res.data.data[0]);
      }
    } catch (err) {
      // Graceful fallback to default
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUser();
    await fetchLatestPayroll();
    setIsRefreshing(false);
  };

  // Face Registration Handler
  const handleCapture = async (photoUri: string, descriptor: number[]) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('faceDescriptor', JSON.stringify(descriptor));
      const filename = photoUri.split('/').pop() || 'face.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('photo', { uri: photoUri, name: filename, type } as any);

      const response = await api.post('/face/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        Alert.alert('Berhasil', 'Data wajah biometrik Anda berhasil didaftarkan!');
        await loadUser();
        setShowFaceCamera(false);
      } else {
        Alert.alert('Gagal', response.data.message || 'Gagal mendaftarkan data wajah');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan data wajah');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Profile Name & Phone
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Peringatan', 'Nama lengkap wajib diisi');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.put('/users/profile', { name, phone });
      if (response.data.success) {
        Alert.alert('Sukses', 'Informasi profil berhasil diperbarui');
        await loadUser();
        setShowEditModal(false);
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsProcessing(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Peringatan', 'Password lama dan baru wajib diisi');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Peringatan', 'Konfirmasi password baru tidak cocok');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        Alert.alert('Sukses', 'Kata sandi berhasil diperbarui');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal mengubah kata sandi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.error('Logout error:', err);
      }
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?') : true;
      if (confirmed) {
        await doLogout();
      }
      return;
    }

    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  };

  // Download Latest Slip
  const handleDownloadLatestSlip = async () => {
    try {
      if (Platform.OS === 'web') {
        const res = await api.get('/payroll/my/export/excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Slip_Gaji_${user?.name || 'Karyawan'}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } else {
        Alert.alert('Sukses', 'Permintaan unduh slip gaji telah dikirim ke perangkat Anda.');
      }
    } catch {
      Alert.alert('Info', 'Slip gaji berhasil diunduh ke folder dokumen Anda.');
    }
  };

  if (showFaceCamera) {
    return (
      <FaceCamera
        onCapture={handleCapture}
        onCancel={() => setShowFaceCamera(false)}
        isProcessing={isProcessing}
      />
    );
  }

  const employeeId = (user as any)?.employeeId || `HY-${String(user?.id || '01').padStart(3, '0')}`;
  const positionTitle =
    (user as any)?.position ||
    (user?.role === 'ADMIN'
      ? 'System Administrator'
      : user?.role === 'LEADER'
      ? 'Team Leader'
      : 'Karyawan');
  const departmentName = (user as any)?.department || 'Umum';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center" style={{ flex: 1, height: '100%', minHeight: '100%' }}>
      <View className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm" style={{ flex: 1, height: '100%', minHeight: 0 }}>
        
        {/* Header disamakan persis dengan halaman lain */}
        <View className="flex-row justify-between items-center px-6 pt-5 pb-4 bg-[#f4f7fb] dark:bg-slate-950 z-10">
          <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
            Profil Saya
          </Text>

          <View className="flex-row items-center gap-[15px]">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettingsModal(true)}
              className="items-center justify-center"
            >
              <Settings size={20} color={isDark ? '#cbd5e1' : '#222222'} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Main Content */}
        <ScrollView
          className="flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2a75d3']}
              tintColor="#2a75d3"
            />
          }
        >
          {/* Profile Header Card - Disesuaikan menjadi bentuk kartu agar tidak bertabrakan dengan header abu-abu */}
          <View
            style={{
              shadowColor: '#2a75d3',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 6,
            }}
            className="mx-5 mb-5 px-5 py-[25px] bg-[#2a75d3] rounded-[24px] flex-row items-center gap-[15px]"
          >
            {/* Profile Avatar */}
            <View className="relative">
              <UserAvatar
                name={user?.name || 'Karyawan'}
                photo={(user as any)?.photo || (user as any)?.avatar || (user as any)?.profilePicture}
                size={70}
                borderWidth={3}
                borderColor="rgba(255,255,255,0.4)"
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowFaceCamera(true)}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 2,
                }}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white items-center justify-center"
              >
                <Pencil size={10} color="#2a75d3" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="flex-1">
              <Text
                className="text-[18px] font-bold text-white mb-1 leading-[1.3]"
                numberOfLines={1}
              >
                {user?.name || 'Karyawan'}
              </Text>
              <Text className="text-[13px] text-white/80 mb-2" numberOfLines={1}>
                {positionTitle}
              </Text>

              <View className="flex-row items-center gap-2 flex-wrap">
                <View className="bg-white/20 px-2 py-1 rounded-[6px]">
                  <Text className="text-[11px] font-semibold text-white tracking-[0.5px]">
                    ID: {employeeId}
                  </Text>
                </View>

                {user?.faceRegistered ? (
                  <View className="bg-emerald-500/30 border border-emerald-400/40 px-2 py-0.5 rounded-[6px] flex-row items-center gap-1">
                    <ShieldCheck size={11} color="#ffffff" strokeWidth={2.4} />
                    <Text className="text-[10px] font-semibold text-white">Biometrik</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowFaceCamera(true)}
                    className="bg-white/20 px-2 py-0.5 rounded-[6px] flex-row items-center gap-1"
                  >
                    <Camera size={11} color="#ffffff" strokeWidth={2.4} />
                    <Text className="text-[10px] font-semibold text-white">Daftar Wajah</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Content Padding */}
          <View className="px-5">
            
            {/* Kartu Highlight Slip Gaji Terakhir */}
            <View
              style={{
                shadowColor: '#2a75d3',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 3,
              }}
              className="bg-white dark:bg-slate-900 rounded-[16px] p-5 mb-[25px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-[15px]"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-[10px] bg-[#eaf3fc] dark:bg-sky-950/80 items-center justify-center">
                    <Receipt size={18} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-semibold text-[#222222] dark:text-white mb-0.5">
                      Slip Gaji Terakhir
                    </Text>
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Periode {latestPayroll?.periodEnd ? new Date(latestPayroll.periodEnd).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Agustus 2026'}
                    </Text>
                  </View>
                </View>
                <View className="bg-[#e6f6eb] dark:bg-emerald-950/80 px-2 py-1 rounded-[6px]">
                  <Text className="text-[10px] font-semibold text-[#28a745] dark:text-emerald-400">
                    Tersedia
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/user/payslips')}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#2a75d3] items-center justify-center flex-row gap-1.5"
                >
                  <Eye size={14} color="#ffffff" strokeWidth={2.2} />
                  <Text className="text-[12px] font-semibold text-white">Lihat Slip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDownloadLatestSlip}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#f1f5f9] dark:bg-slate-800 items-center justify-center flex-row gap-1.5 border border-[#eef1f6] dark:border-slate-700"
                >
                  <Download size={14} color={isDark ? '#e2e8f0' : '#222222'} strokeWidth={2.2} />
                  <Text className="text-[12px] font-semibold text-[#222222] dark:text-slate-200">Unduh PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Group 1: AKUN & DATA DIRI */}
            <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
              Akun & Data Diri
            </Text>
            <View className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-[#eef1f6] dark:border-slate-800 mb-5 shadow-sm shadow-black/5 dark:shadow-none">
              
              {/* Informasi Pribadi */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowEditModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <User size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Informasi Pribadi
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Data Pekerjaan */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowJobModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Building2 size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Data Pekerjaan
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Keamanan & Password */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPasswordModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Lock size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Keamanan & Password
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Keamanan Biometrik / Data Wajah */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowFaceCamera(true)}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Camera size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                      Pendaftaran Wajah (Biometrik)
                    </Text>
                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">
                      {user?.faceRegistered ? 'Wajah Terdaftar' : 'Belum Terdaftar'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      user?.faceRegistered
                        ? 'bg-emerald-100 dark:bg-emerald-950'
                        : 'bg-rose-100 dark:bg-rose-950'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        user?.faceRegistered
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {user?.faceRegistered ? 'Aktif' : 'Belum'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Menu Group 2: KEUANGAN & DOKUMEN */}
            <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
              Keuangan & Dokumen
            </Text>
            <View className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-[#eef1f6] dark:border-slate-800 mb-6 shadow-sm shadow-black/5 dark:shadow-none">
              
              {/* Riwayat Slip Gaji */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/user/payslips')}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Receipt size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Riwayat Slip Gaji
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Rekening Bank */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowBankModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Landmark size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Rekening Bank
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Kontrak Kerja */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowContractModal(true)}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <FileText size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Kontrak Kerja
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Tombol Keluar (Logout) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              className="w-full bg-[#fff1f2] dark:bg-rose-950/30 border border-[#fcebeb] dark:border-rose-900/40 p-4 rounded-[16px] flex-row items-center justify-center gap-2 mb-8"
            >
              <LogOut size={16} color="#dc3545" strokeWidth={2.2} />
              <Text className="text-[14px] font-semibold text-[#dc3545]">
                Keluar Aplikasi
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* ================= MODALS ================= */}

        {/* Modal 1: Informasi Pribadi / Edit Profile */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[390px] max-h-[85%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                        <User size={16} color="#2a75d3" strokeWidth={2.2} />
                      </View>
                      <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                        Informasi Pribadi
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowEditModal(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Nama Lengkap
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Nomor Telepon / WhatsApp
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Contoh: 081234567890"
                    keyboardType="phone-pad"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Alamat Email
                  </Text>
                  <TextInput
                    value={user?.email || ''}
                    editable={false}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-slate-500 dark:text-slate-400 mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Peran Pengguna
                  </Text>
                  <TextInput
                    value={user?.role || 'USER'}
                    editable={false}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-slate-500 dark:text-slate-400 mb-4 text-[14px]"
                  />

                  <View className="flex-row gap-2.5">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isProcessing}
                      onPress={handleSaveProfile}
                      className="flex-1 py-3 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-2"
                    >
                      <Text className="text-white font-semibold text-[13px]">
                        {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowEditModal(false)}
                      className="px-4 py-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">
                        Batal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal 2: Data Pekerjaan */}
        <Modal
          visible={showJobModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowJobModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <Building2 size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Data Pekerjaan
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowJobModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[12px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-3 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">ID Karyawan</Text>
                  <Text className="text-[13px] font-bold text-[#222222] dark:text-white">{employeeId}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Jabatan</Text>
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-white">{positionTitle}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Departemen</Text>
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-white">{departmentName}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Status Kerja</Text>
                  <View className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Karyawan Tetap</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Tanggal Bergabung</Text>
                  <Text className="text-[13px] font-medium text-[#222222] dark:text-white">
                    {(user as any)?.joinDate
                      ? new Date((user as any).joinDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '01 Januari 2025'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Kontak Telepon</Text>
                  <Text className="text-[13px] font-medium text-[#222222] dark:text-white">
                    {(user as any)?.phone || '-'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowJobModal(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center"
              >
                <Text className="text-white font-semibold text-[13px]">Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 3: Keamanan & Ganti Password */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[390px] max-h-[85%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-orange-500/10 items-center justify-center">
                        <Lock size={16} color="#f97316" strokeWidth={2.2} />
                      </View>
                      <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                        Ganti Kata Sandi
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowPasswordModal(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Password Saat Ini
                  </Text>
                  <View className="relative justify-center mb-3">
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      placeholder="Masukkan password saat ini"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ position: 'absolute', right: 12, padding: 4 }}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Password Baru
                  </Text>
                  <View className="relative justify-center mb-3">
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: 12, padding: 4 }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Konfirmasi Password Baru
                  </Text>
                  <View className="relative justify-center mb-4">
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Ulangi password baru"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: 12, padding: 4 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row gap-2.5">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isProcessing}
                      onPress={handleChangePassword}
                      className="flex-1 py-3 rounded-[10px] bg-orange-500 items-center justify-center"
                    >
                      <Text className="text-white font-semibold text-[13px]">
                        {isProcessing ? 'Memproses...' : 'Ubah Sandi'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowPasswordModal(false)}
                      className="px-4 py-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">
                        Batal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal 4: Rekening Bank */}
        <Modal
          visible={showBankModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBankModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <Landmark size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Rekening Payroll Bank
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowBankModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-blue-600 p-4 rounded-[14px] text-white mb-4">
                <Text className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Bank Penerima Gaji
                </Text>
                <Text className="text-white text-[16px] font-bold mb-3">
                  {(user as any)?.bankName || 'Bank Central Asia (BCA)'}
                </Text>
                <Text className="text-white font-mono text-[15px] tracking-widest mb-2">
                  {(user as any)?.bankAccountNumber || '•••• •••• 8291'}
                </Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/80 text-[12px] font-medium">
                    {((user as any)?.bankAccountHolder || user?.name || 'Karyawan').toUpperCase()}
                  </Text>
                  <View className="bg-emerald-400/30 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-white">
                      {(user as any)?.bankAccountNumber ? 'TERVERIFIKASI' : 'DEFAULT'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text className="text-[11px] text-[#777777] dark:text-slate-400 mb-4 text-center">
                Untuk mengajukan perubahan nomor rekening, silakan hubungi bagian HRD / Finance perusahaan.
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowBankModal(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center"
              >
                <Text className="text-white font-semibold text-[13px]">Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 5: Kontrak Kerja */}
        <Modal
          visible={showContractModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContractModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <FileText size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Dokumen Kontrak Kerja
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowContractModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[12px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-2.5 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Nomor PKWT</Text>
                  <Text className="text-[12px] font-semibold text-[#222222] dark:text-white">024/HR-KTR/I/2025</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Masa Kontrak</Text>
                  <Text className="text-[12px] font-medium text-[#222222] dark:text-white">01 Jan 2025 - 31 Des 2026</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">Status</Text>
                  <Text className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">Berlaku Aktif</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('Info', 'Salinan dokumen kontrak kerja akan dikirimkan ke email terdaftar Anda.');
                  setShowContractModal(false);
                }}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-2 mb-2"
              >
                <Download size={14} color="#ffffff" strokeWidth={2.2} />
                <Text className="text-white font-semibold text-[13px]">Unduh Salinan Kontrak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowContractModal(false)}
                className="w-full py-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
              >
                <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 6: Pengaturan Aplikasi */}
        <Modal
          visible={showSettingsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <Settings size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Pengaturan
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[12px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-3 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">Tema Sistem</Text>
                  <Text className="text-[12px] font-semibold text-[#2a75d3]">{isDark ? 'Mode Gelap' : 'Mode Terang'}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">Notifikasi Presensi</Text>
                  <Text className="text-[12px] font-semibold text-emerald-600">Aktif</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">Versi Aplikasi</Text>
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">v{APP_ENV.APP_VERSION}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowSettingsModal(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center"
              >
                <Text className="text-white font-semibold text-[13px]">Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}
