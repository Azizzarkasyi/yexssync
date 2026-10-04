import { View, Text, ScrollView, Alert, TouchableOpacity, useWindowDimensions, ActivityIndicator, TextInput } from 'react-native';
import { Header } from '@/components/Header';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/lib/api';
import { 
  User, Mail, Lock, Shield, Banknote, Clock, MapPin, Save, X, 
  Info, Plus, Trash2, Building2, Phone, Calendar, CreditCard, 
  Compass, Map, Eye, EyeOff 
} from 'lucide-react-native';
import { LocationMapPicker, LocationPickerResult } from '@/components/LocationMapPicker';

export interface WorkLocationItem {
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
}

export default function EditEmployeeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { id } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workLocations, setWorkLocations] = useState<WorkLocationItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    
    // Kepegawaian
    employeeId: '',
    department: 'Operasional',
    position: 'Staff',
    phone: '',
    joinDate: '',

    // Rekening Bank
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',

    // Gaji
    salaryType: 'MONTHLY',
    salary: '0',
    latePenalty: '0',
    
    // Waktu
    startWorkTime: '09:00',
    endWorkTime: '17:00',
    maxBreakMinutes: '60',
    
    // Lokasi
    workLatitude: '',
    workLongitude: '',
    workRadius: '50'
  });

  const [showPassword, setShowPassword] = useState(false);

  // Map Picker State
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'PRIMARY' | number | null>(null);
  const [mapPickerTitle, setMapPickerTitle] = useState('');
  const [mapPickerInitialLat, setMapPickerInitialLat] = useState<number | null>(null);
  const [mapPickerInitialLng, setMapPickerInitialLng] = useState<number | null>(null);
  const [mapPickerInitialRadius, setMapPickerInitialRadius] = useState<number | null>(null);

  const openMapForPrimary = () => {
    setMapPickerTarget('PRIMARY');
    setMapPickerTitle('Tentukan Lokasi Utama Kantor');
    setMapPickerInitialLat(formData.workLatitude ? parseFloat(formData.workLatitude) : null);
    setMapPickerInitialLng(formData.workLongitude ? parseFloat(formData.workLongitude) : null);
    setMapPickerInitialRadius(formData.workRadius ? parseInt(formData.workRadius) : 50);
    setMapPickerVisible(true);
  };

  const openMapForBranch = (index: number) => {
    const loc = workLocations[index];
    setMapPickerTarget(index);
    setMapPickerTitle(`Tentukan Titik: ${loc.name || `Cabang #${index + 1}`}`);
    setMapPickerInitialLat(loc.latitude ? parseFloat(loc.latitude) : null);
    setMapPickerInitialLng(loc.longitude ? parseFloat(loc.longitude) : null);
    setMapPickerInitialRadius(loc.radius ? parseInt(loc.radius) : 50);
    setMapPickerVisible(true);
  };

  const handleSelectMapLocation = (result: LocationPickerResult) => {
    if (mapPickerTarget === 'PRIMARY') {
      setFormData((prev) => ({
        ...prev,
        workLatitude: result.latitude.toString(),
        workLongitude: result.longitude.toString(),
        workRadius: result.radius.toString(),
      }));
    } else if (typeof mapPickerTarget === 'number') {
      const idx = mapPickerTarget;
      const next = [...workLocations];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          latitude: result.latitude.toString(),
          longitude: result.longitude.toString(),
          radius: result.radius.toString(),
          name: next[idx].name || (result.address ? result.address.split(',')[0] : `Cabang #${idx + 1}`),
        };
        setWorkLocations(next);
      }
    }
  };

  const addLocation = () => {
    setWorkLocations([
      ...workLocations,
      { name: `Cabang / Site ${workLocations.length + 1}`, latitude: '', longitude: '', radius: '50' }
    ]);
  };

  const removeLocation = (index: number) => {
    setWorkLocations(workLocations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: keyof WorkLocationItem, val: string) => {
    const next = [...workLocations];
    next[index] = { ...next[index], [field]: val };
    setWorkLocations(next);
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      if (response.data.success) {
        const u = response.data.data;
        setFormData({
          name: u.name || '',
          email: u.email || '',
          password: '', // Kosongkan password saat edit
          role: u.role || 'USER',
          employeeId: u.employeeId || '',
          department: u.department || 'Operasional',
          position: u.position || 'Staff',
          phone: u.phone || '',
          joinDate: u.joinDate ? u.joinDate.substring(0, 10) : '',
          bankName: u.bankName || 'BCA',
          bankAccountNumber: u.bankAccountNumber || '',
          bankAccountHolder: u.bankAccountHolder || u.name || '',
          salaryType: u.salaryType || 'MONTHLY',
          salary: u.salary?.toString() || '0',
          latePenalty: u.latePenalty?.toString() || '0',
          startWorkTime: u.startWorkTime || '09:00',
          endWorkTime: u.endWorkTime || '17:00',
          maxBreakMinutes: u.maxBreakMinutes?.toString() || '60',
          workLatitude: u.workLatitude?.toString() || '',
          workLongitude: u.workLongitude?.toString() || '',
          workRadius: u.workRadius?.toString() || '50'
        });

        if (Array.isArray(u.workLocations)) {
          setWorkLocations(
            u.workLocations.map((loc: any) => ({
              name: loc.name || '',
              latitude: loc.latitude?.toString() || '',
              longitude: loc.longitude?.toString() || '',
              radius: loc.radius?.toString() || '50',
            }))
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data karyawan');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Nama dan Email wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedLocations = workLocations
        .filter((loc) => loc.latitude && loc.longitude)
        .map((loc) => ({
          ...(loc.name ? { name: loc.name } : {}),
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          radius: parseInt(loc.radius) || 50,
        }));

      const payload: any = {
        ...formData,
        salary: parseFloat(formData.salary) || 0,
        latePenalty: parseFloat(formData.latePenalty) || 0,
        maxBreakMinutes: parseInt(formData.maxBreakMinutes) || 60,
        workLatitude: formData.workLatitude ? parseFloat(formData.workLatitude) : null,
        workLongitude: formData.workLongitude ? parseFloat(formData.workLongitude) : null,
        workRadius: parseInt(formData.workRadius) || 50,
        joinDate: formData.joinDate ? new Date(formData.joinDate).toISOString() : null,
        bankAccountHolder: formData.bankAccountHolder || formData.name,
        workLocations: parsedLocations,
      };

      if (!formData.password) {
        delete payload.password;
      }

      const response = await api.put(`/users/${id}`, payload);
      if (response.data.success) {
        Alert.alert('Sukses', 'Data karyawan berhasil diperbarui');
        router.back();
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionButton = ({ label, value, selectedValue, onSelect }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onSelect(value)}
      className={`px-4 py-2 rounded-xl border ${selectedValue === value ? 'bg-primary border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} mr-2 mb-2`}
    >
      <Text className={`font-bold ${selectedValue === value ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{label}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <ActivityIndicator size="large" color="#2a75d3" />
        <Text className="text-slate-500 text-sm mt-3">Memuat profil karyawan...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {!isDesktop && <Header title="Edit Karyawan" showBack />}
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ flexGrow: 1, padding: isDesktop ? 32 : 16, paddingBottom: 100, maxWidth: 800, alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        
        {isDesktop && (
          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
                <X size={20} className="text-slate-600 dark:text-slate-300" />
              </TouchableOpacity>
              <View>
                <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Edit Karyawan</Text>
              </View>
            </View>
          </View>
        )}

        {/* 1. Informasi Akun */}
        <Card className="mb-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 flex-row items-center border-b border-blue-100 dark:border-blue-900/50">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 items-center justify-center mr-3">
              <User size={16} className="text-blue-600 dark:text-blue-400" />
            </View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Akun & Keamanan</Text>
          </View>
          <View className="p-6">
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nama Lengkap *</Text>
              <Input 
                placeholder="Contoh: Budi Santoso"
                value={formData.name}
                onChangeText={(val) => setFormData({ ...formData, name: val })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Perusahaan *</Text>
              <Input 
                placeholder="budi@kantor.com"
                value={formData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setFormData({ ...formData, email: val })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ganti Kata Sandi (Opsional)</Text>
              <View className="relative justify-center">
                <TextInput 
                  placeholder="Biarkan kosong jika tidak ingin mengubah password"
                  placeholderTextColor="#94a3b8"
                  value={formData.password}
                  secureTextEntry={!showPassword}
                  onChangeText={(val) => setFormData({ ...formData, password: val })}
                  className="px-5 py-4 pr-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Peran Akses (Role)</Text>
              <View className="flex-row flex-wrap">
                <OptionButton label="Pegawai (User)" value="USER" selectedValue={formData.role} onSelect={(v: any) => setFormData({ ...formData, role: v })} />
                <OptionButton label="Team Leader" value="LEADER" selectedValue={formData.role} onSelect={(v: any) => setFormData({ ...formData, role: v })} />
                <OptionButton label="Administrator" value="ADMIN" selectedValue={formData.role} onSelect={(v: any) => setFormData({ ...formData, role: v })} />
              </View>
            </View>
          </View>
        </Card>

        {/* 2. Data Kepegawaian & Organisasi */}
        <Card className="mb-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 flex-row items-center border-b border-indigo-100 dark:border-indigo-900/50">
            <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800/50 items-center justify-center mr-3">
              <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
            </View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Data Kepegawaian</Text>
          </View>
          <View className="p-6">
            <View className="flex-row gap-4 mb-4 flex-wrap">
              <View className="flex-1 min-w-[240px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">NIP / ID Karyawan</Text>
                <Input 
                  placeholder="Contoh: HY-2025-01"
                  value={formData.employeeId}
                  onChangeText={(val) => setFormData({ ...formData, employeeId: val })}
                />
              </View>
              <View className="flex-1 min-w-[240px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nomor Telepon / WhatsApp</Text>
                <Input 
                  placeholder="Contoh: 08123456789"
                  value={formData.phone}
                  keyboardType="phone-pad"
                  onChangeText={(val) => setFormData({ ...formData, phone: val })}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-4 flex-wrap">
              <View className="flex-1 min-w-[240px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Departemen / Divisi</Text>
                <Input 
                  placeholder="Contoh: Engineering & Technology"
                  value={formData.department}
                  onChangeText={(val) => setFormData({ ...formData, department: val })}
                />
              </View>
              <View className="flex-1 min-w-[240px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Jabatan / Posisi</Text>
                <Input 
                  placeholder="Contoh: Mobile App Developer"
                  value={formData.position}
                  onChangeText={(val) => setFormData({ ...formData, position: val })}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Tanggal Bergabung (YYYY-MM-DD)</Text>
              <Input 
                placeholder="2025-01-01"
                value={formData.joinDate}
                onChangeText={(val) => setFormData({ ...formData, joinDate: val })}
              />
            </View>
          </View>
        </Card>

        {/* 3. Rekening Payroll Bank */}
        <Card className="mb-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 flex-row items-center border-b border-emerald-100 dark:border-emerald-900/50">
            <View className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/50 items-center justify-center mr-3">
              <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
            </View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Rekening Payroll Bank</Text>
          </View>
          <View className="p-6">
            <View className="flex-row gap-4 mb-4 flex-wrap">
              <View className="flex-1 min-w-[200px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nama Bank</Text>
                <Input 
                  placeholder="Contoh: BCA / Mandiri / BRI / BNI"
                  value={formData.bankName}
                  onChangeText={(val) => setFormData({ ...formData, bankName: val })}
                />
              </View>
              <View className="flex-1 min-w-[240px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nomor Rekening</Text>
                <Input 
                  placeholder="Contoh: 1234567890"
                  value={formData.bankAccountNumber}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData({ ...formData, bankAccountNumber: val })}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Atas Nama Rekening</Text>
              <Input 
                placeholder="Contoh: Budi Santoso"
                value={formData.bankAccountHolder}
                onChangeText={(val) => setFormData({ ...formData, bankAccountHolder: val })}
              />
            </View>
          </View>
        </Card>

        {/* 4. Pengaturan Gaji */}
        <Card className="mb-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 flex-row items-center border-b border-amber-100 dark:border-amber-900/50">
            <View className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/50 items-center justify-center mr-3">
              <Banknote size={16} className="text-amber-600 dark:text-amber-400" />
            </View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan Gaji & Kompensasi</Text>
          </View>
          <View className="p-6">
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Tipe Gaji</Text>
              <View className="flex-row flex-wrap">
                <OptionButton label="Bulanan (Monthly)" value="MONTHLY" selectedValue={formData.salaryType} onSelect={(v: any) => setFormData({ ...formData, salaryType: v })} />
                <OptionButton label="Mingguan (Weekly)" value="WEEKLY" selectedValue={formData.salaryType} onSelect={(v: any) => setFormData({ ...formData, salaryType: v })} />
                <OptionButton label="Harian (Daily)" value="DAILY" selectedValue={formData.salaryType} onSelect={(v: any) => setFormData({ ...formData, salaryType: v })} />
                <OptionButton label="Per Jam (Hourly)" value="HOURLY" selectedValue={formData.salaryType} onSelect={(v: any) => setFormData({ ...formData, salaryType: v })} />
              </View>
            </View>

            <View className="flex-row gap-4 mb-2 flex-wrap">
              <View className="flex-1 min-w-[200px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nominal Gaji Pokok (Rp)</Text>
                <Input 
                  placeholder="0"
                  value={formData.salary}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData({ ...formData, salary: val })}
                />
              </View>
              <View className="flex-1 min-w-[200px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Denda Terlambat (Rp/kejadian)</Text>
                <Input 
                  placeholder="0"
                  value={formData.latePenalty}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData({ ...formData, latePenalty: val })}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* 5. Pengaturan Waktu Kerja */}
        <Card className="mb-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 flex-row items-center border-b border-purple-100 dark:border-purple-900/50">
            <View className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800/50 items-center justify-center mr-3">
              <Clock size={16} className="text-purple-600 dark:text-purple-400" />
            </View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Waktu & Istirahat</Text>
          </View>
          <View className="p-6">
            <View className="flex-row gap-4 mb-4 flex-wrap">
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Jam Masuk (HH:mm)</Text>
                <Input 
                  placeholder="09:00"
                  value={formData.startWorkTime}
                  onChangeText={(val) => setFormData({ ...formData, startWorkTime: val })}
                />
              </View>
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Jam Pulang (HH:mm)</Text>
                <Input 
                  placeholder="17:00"
                  value={formData.endWorkTime}
                  onChangeText={(val) => setFormData({ ...formData, endWorkTime: val })}
                />
              </View>
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Batas Istirahat (Menit)</Text>
                <Input 
                  placeholder="60"
                  value={formData.maxBreakMinutes}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData({ ...formData, maxBreakMinutes: val })}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* 6. Lokasi Kerja & Geofence (With Pin Point Maps) */}
        <Card className="mb-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-3xl">
          <View className="bg-rose-50 dark:bg-rose-900/20 px-6 py-4 flex-row items-center justify-between border-b border-rose-100 dark:border-rose-900/50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-800/50 items-center justify-center mr-3">
                <MapPin size={16} className="text-rose-600 dark:text-rose-400" />
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Lokasi Kerja & Geofence</Text>
                <Text className="text-xs text-slate-500">Tentukan titik kantor utama dan cabang presensi.</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={openMapForPrimary}
              className="px-3 py-1.5 bg-[#2a75d3] hover:bg-[#1f5ca8] rounded-xl flex-row items-center shadow-sm"
            >
              <Compass size={14} color="#ffffff" className="mr-1" />
              <Text className="text-xs font-bold text-white">📍 Buka Peta</Text>
            </TouchableOpacity>
          </View>
          <View className="p-6">
            <Text className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">
              Titik Kantor Utama
            </Text>
            <View className="flex-row gap-4 mb-4 flex-wrap">
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Latitude</Text>
                <Input 
                  placeholder="-6.2088"
                  value={formData.workLatitude}
                  onChangeText={(val) => setFormData({ ...formData, workLatitude: val })}
                />
              </View>
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Longitude</Text>
                <Input 
                  placeholder="106.8456"
                  value={formData.workLongitude}
                  onChangeText={(val) => setFormData({ ...formData, workLongitude: val })}
                />
              </View>
              <View className="flex-1 min-w-[140px]">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Radius (Meter)</Text>
                <Input 
                  placeholder="50"
                  value={formData.workRadius}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData({ ...formData, workRadius: val })}
                />
              </View>
            </View>

            {/* Multi-Location Branches */}
            <View className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Cabang Tambahan / Multi-Lokasi
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    Karyawan dapat absen di lokasi-lokasi cabang ini secara sah.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={addLocation}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-row items-center border border-blue-200 dark:border-blue-800"
                >
                  <Plus size={14} color="#2563eb" className="mr-1" />
                  <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">Tambah Cabang</Text>
                </TouchableOpacity>
              </View>

              {workLocations.map((loc, index) => (
                <View key={index} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl mb-3 border border-slate-200 dark:border-slate-700">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Lokasi Cabang #{index + 1}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => openMapForBranch(index)}
                        className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-row items-center"
                      >
                        <Compass size={12} color="#2563eb" className="mr-1" />
                        <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-400">📍 Pin Point</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeLocation(index)} className="p-1 rounded-lg bg-red-50 dark:bg-red-950">
                        <Trash2 size={14} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="mb-3">
                    <Text className="text-[11px] text-slate-400 font-semibold mb-1">Nama Cabang / Titik Proyek</Text>
                    <Input
                      placeholder="Contoh: Kantor Cabang Surabaya / Proyek MRT"
                      value={loc.name}
                      onChangeText={(val) => updateLocation(index, 'name', val)}
                    />
                  </View>

                  <View className="flex-row gap-3 flex-wrap">
                    <View className="flex-1 min-w-[120px]">
                      <Text className="text-[11px] text-slate-400 font-semibold mb-1">Latitude</Text>
                      <Input
                        placeholder="-7.2575"
                        value={loc.latitude}
                        onChangeText={(val) => updateLocation(index, 'latitude', val)}
                      />
                    </View>
                    <View className="flex-1 min-w-[120px]">
                      <Text className="text-[11px] text-slate-400 font-semibold mb-1">Longitude</Text>
                      <Input
                        placeholder="112.7521"
                        value={loc.longitude}
                        onChangeText={(val) => updateLocation(index, 'longitude', val)}
                      />
                    </View>
                    <View className="flex-1 min-w-[100px]">
                      <Text className="text-[11px] text-slate-400 font-semibold mb-1">Radius (m)</Text>
                      <Input
                        placeholder="50"
                        value={loc.radius}
                        keyboardType="numeric"
                        onChangeText={(val) => updateLocation(index, 'radius', val)}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Tombol Simpan Perubahan */}
        <Button 
          onPress={handleUpdate} 
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl shadow-lg shadow-primary/20 flex-row justify-center items-center"
        >
          <Save size={18} className="text-white mr-2" />
          <Text className="text-white font-bold text-base">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </Button>
      </ScrollView>

      {/* Pin Point Maps Picker Modal */}
      <LocationMapPicker
        visible={mapPickerVisible}
        title={mapPickerTitle}
        initialLatitude={mapPickerInitialLat}
        initialLongitude={mapPickerInitialLng}
        initialRadius={mapPickerInitialRadius}
        onClose={() => setMapPickerVisible(false)}
        onSelectLocation={handleSelectMapLocation}
      />
    </ScreenWrapper>
  );
}
