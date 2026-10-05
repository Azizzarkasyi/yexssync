import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Paperclip,
  Info,
  HeartPulse,
  Umbrella,
  FileText,
  UploadCloud,
  X,
  Check,
  Send,
  ChevronDown,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';

export interface LeaveItem {
  id: string;
  type: string;
  typeCategory: 'sakit' | 'cuti' | 'izin';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusLabel: string;
  dateText: string;
  description: string;
  attachment?: string | null;
  submittedAt: string;
  rejectionReason?: string | null;
}

export default function UserLeaveScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(AuthContext);

  // Segmented Control: 'CREATE' (Buat Pengajuan) | 'HISTORY' (Riwayat Saya)
  const [activeTab, setActiveTab] = useState<'CREATE' | 'HISTORY'>('CREATE');

  // Form State
  const [leaveType, setLeaveType] = useState<'SICK' | 'LEAVE' | 'OTHER'>('SICK');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [description, setDescription] = useState('');

  // Selected file/photo
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    fileObj?: any;
    isPdf?: boolean;
  } | null>(null);

  // History State
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fileInputRef = useRef<any>(null);

  const avatarUri =
    (user as any)?.photo ||
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2a75d3&color=fff`;

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/attendance/history');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const leaveRecords = res.data.data.filter(
          (item: any) =>
            item.status === 'LEAVE' ||
            item.status === 'SICK' ||
            item.leaveApprovalStatus
        );
        setLeaves(leaveRecords);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      console.warn('Failed to fetch leave history:', err);
      setLeaves([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaves();
  };

  // Calculate duration in days
  const leaveDuration = useMemo(() => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  // File Upload Handlers
  const handleUploadClick = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      pickMobileImage();
    }
  };

  const handleWebFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (Platform.OS === 'web') {
        window.alert('Ukuran file maksimal 5MB.');
      } else {
        Alert.alert('Perhatian', 'Ukuran file maksimal 5MB.');
      }
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile({
      uri: objectUrl,
      name: file.name,
      fileObj: file,
      isPdf,
    });
  };

  const pickMobileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'lampiran.jpg',
          isPdf: false,
        });
      }
    } catch {
      Alert.alert('Gagal', 'Tidak dapat membuka galeri foto.');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async () => {
    if (!startDate || !endDate) {
      const msg = 'Tanggal mulai dan selesai wajib diisi.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Perhatian', msg);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      const msg = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Perhatian', msg);
      return;
    }

    if (!description.trim()) {
      const msg = 'Keterangan/alasan pengajuan wajib diisi.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Perhatian', msg);
      return;
    }

    if (leaveType === 'SICK' && !selectedFile) {
      const msg = 'Pengajuan Sakit wajib melampirkan foto Surat Keterangan Dokter.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Perhatian', msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const statusToSend = leaveType === 'SICK' ? 'SICK' : 'LEAVE';
      formData.append('status', statusToSend);
      formData.append('date', startDate);

      const typeLabel =
        leaveType === 'SICK'
          ? 'Sakit'
          : leaveType === 'LEAVE'
          ? 'Cuti Tahunan'
          : 'Izin Lainnya';

      formData.append('leaveType', typeLabel);
      formData.append('leaveDuration', String(leaveDuration));
      formData.append('description', `[${typeLabel}] ${description.trim()}`);

      if (selectedFile) {
        if (Platform.OS === 'web' && selectedFile.fileObj) {
          formData.append('photo', selectedFile.fileObj);
        } else {
          const filename = selectedFile.name || 'lampiran.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append('photo', {
            uri: selectedFile.uri,
            name: filename,
            type,
          } as any);
        }
      }

      const res = await api.post('/attendance/leave', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const successMsg = 'Pengajuan izin berhasil dikirim dan menunggu persetujuan.';
        if (Platform.OS === 'web') window.alert(successMsg);
        else Alert.alert('Sukses', successMsg);

        // Reset form
        setDescription('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Refresh and switch to history tab
        await fetchLeaves();
        setActiveTab('HISTORY');
      } else {
        const err = res.data?.message || 'Gagal mengirim pengajuan.';
        if (Platform.OS === 'web') window.alert(err);
        else Alert.alert('Info', err);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'Terjadi kendala saat mengirim pengajuan. Pastikan tanggal belum terdaftar.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map backend history data
  const displayLeaves: LeaveItem[] = useMemo(() => {
    if (leaves && leaves.length > 0) {
      return leaves.map((item: any) => {
        const isSick = item.status === 'SICK';
        const rawDesc = item.leaveDescription || '';
        let type = isSick ? 'Sakit' : 'Cuti Tahunan';
        let typeCategory: 'sakit' | 'cuti' | 'izin' = isSick ? 'sakit' : 'cuti';

        if (rawDesc.includes('[Izin Lainnya]') || rawDesc.includes('[Izin Penting]')) {
          type = 'Izin Lainnya';
          typeCategory = 'izin';
        } else if (rawDesc.includes('[Cuti Tahunan]')) {
          type = 'Cuti Tahunan';
          typeCategory = 'cuti';
        } else if (rawDesc.includes('[Sakit]')) {
          type = 'Sakit';
          typeCategory = 'sakit';
        }

        const cleanDesc = rawDesc.replace(/^\[(Sakit|Cuti Tahunan|Izin Lainnya|Izin Penting)\]\s*/, '');
        const status = item.leaveApprovalStatus || 'PENDING';
        const statusLabel =
          status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Menunggu';

        const d = new Date(item.date);
        const dateFormatted = isNaN(d.getTime())
          ? String(item.date)
          : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        const duration = item.leaveDuration || 1;

        return {
          id: String(item.id),
          type,
          typeCategory,
          status,
          statusLabel,
          dateText: `${dateFormatted} (${duration} Hari)`,
          description: cleanDesc || 'Tidak ada keterangan.',
          attachment: item.clockInPhoto ? item.clockInPhoto.split('/').pop() : null,
          submittedAt: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Hari ini',
          rejectionReason: item.leaveRejectionReason || null,
        };
      });
    }

    return [];
  }, [leaves]);

  const pendingCount = useMemo(
    () => displayLeaves.filter((i) => i.status === 'PENDING').length,
    [displayLeaves]
  );

  const filteredLeaves = useMemo(() => {
    if (activeFilter === 'ALL') return displayLeaves;
    return displayLeaves.filter((i) => i.status === activeFilter);
  }, [displayLeaves, activeFilter]);

  const filterTabs = [
    { key: 'ALL' as const, label: 'Semua' },
    { key: 'PENDING' as const, label: pendingCount > 0 ? `Menunggu (${pendingCount})` : 'Menunggu' },
    { key: 'APPROVED' as const, label: 'Disetujui' },
    { key: 'REJECTED' as const, label: 'Ditolak' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#2a75d3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center"
      style={{ flex: 1, height: '100%', minHeight: '100%' }}
    >
      {/* Hidden file input for Web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleWebFileChange}
          accept="image/*,.pdf"
          style={{ display: 'none' }}
        />
      )}

      {/* Main Responsive App Container */}
      <View
        className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm"
        style={{ flex: 1, height: '100%', minHeight: 0 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-5 pb-4 bg-[#f4f7fb] dark:bg-slate-950 z-10 border-b border-[#eef1f6] dark:border-slate-800">
          <Text className="text-[20px] font-bold text-[#1e293b] dark:text-white tracking-tight">
            Izin & Cuti
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
          >
            <UserAvatar name={user?.name} photo={user?.photo || user?.avatar} size={36} />
          </TouchableOpacity>
        </View>

        {/* Segmented Control Tabs */}
        <View className="px-6 pt-4 pb-2">
          <View className="bg-[#e2e8f0] dark:bg-slate-800/80 rounded-[14px] p-1 flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('CREATE')}
              className={`flex-1 py-2.5 rounded-[11px] items-center justify-center transition-all ${
                activeTab === 'CREATE'
                  ? 'bg-white dark:bg-slate-900 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  activeTab === 'CREATE'
                    ? 'text-[#2a75d3]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Buat Pengajuan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('HISTORY')}
              className={`flex-1 py-2.5 rounded-[11px] items-center justify-center flex-row gap-1.5 transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-white dark:bg-slate-900 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  activeTab === 'HISTORY'
                    ? 'text-[#2a75d3]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Riwayat Saya
              </Text>
              {pendingCount > 0 && (
                <View className="bg-[#2a75d3] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">
                    {pendingCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          className="flex-1 px-6"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 110, paddingTop: 10 }}
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
          {/* ======================================================== */}
          {/* TAB 1: BUAT PENGAJUAN                                    */}
          {/* ======================================================== */}
          {activeTab === 'CREATE' && (
            <View className="flex-col gap-4">
              {/* Notice Card */}
              <View className="bg-[#fff8e6] dark:bg-amber-950/40 border-l-4 border-[#f59e0b] p-3.5 rounded-[12px] flex-row gap-3 items-start border-y border-r border-[#fef3c7] dark:border-amber-900/40">
                <Info size={18} color="#f59e0b" style={{ marginTop: 2 }} strokeWidth={2.2} />
                <Text className="text-[12px] text-[#926b00] dark:text-amber-200 leading-[1.5] flex-1">
                  Pengajuan <Text className="font-bold">Sakit</Text> wajib melampirkan foto Surat Keterangan Dokter. Pengajuan <Text className="font-bold">Cuti</Text> harap dilakukan minimal H-3.
                </Text>
              </View>

              {/* Form Card */}
              <View className="bg-white dark:bg-slate-900 rounded-[18px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-col gap-4">
                {/* Form Group: Jenis Pengajuan */}
                <View className="flex-col gap-1.5">
                  <Text className="text-[13px] font-bold text-slate-800 dark:text-white">
                    Jenis Pengajuan <Text className="text-rose-500">*</Text>
                  </Text>

                  {/* Jenis Selection Buttons */}
                  <View className="flex-row gap-2">
                    {[
                      { id: 'SICK', label: 'Sakit (Sick Leave)', icon: HeartPulse, color: '#dc3545' },
                      { id: 'LEAVE', label: 'Cuti Tahunan', icon: Umbrella, color: '#2a75d3' },
                      { id: 'OTHER', label: 'Izin Lainnya', icon: FileText, color: '#f59e0b' },
                    ].map((opt) => {
                      const isSelected = leaveType === opt.id;
                      const Icon = opt.icon;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.8}
                          onPress={() => setLeaveType(opt.id as any)}
                          className={`flex-1 p-3 rounded-[12px] border transition-all flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/60 border-[#2a75d3]'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          <Icon size={18} color={isSelected ? '#2a75d3' : opt.color} strokeWidth={2.2} />
                          <Text
                            className={`text-[11px] font-bold text-center leading-[1.2] ${
                              isSelected
                                ? 'text-[#2a75d3]'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date Row: Tanggal Mulai & Tanggal Selesai */}
                <View className="flex-col gap-1.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13px] font-bold text-slate-800 dark:text-white">
                      Rentang Tanggal <Text className="text-rose-500">*</Text>
                    </Text>
                    <View className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                      <Text className="text-[11px] font-bold text-[#2a75d3]">
                        Durasi: {leaveDuration} Hari
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    {/* Tanggal Mulai */}
                    <View className="flex-1 flex-col gap-1">
                      <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Tanggal Mulai
                      </Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e: any) => setStartDate(e.target.value)}
                          className="w-full p-3 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white font-medium outline-none focus:border-[#2a75d3]"
                          style={{
                            boxSizing: 'border-box',
                            fontSize: '13px',
                            color: isDark ? '#ffffff' : '#0f172a',
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#334155' : '#cbd5e1',
                          }}
                        />
                      ) : (
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-[10px] border border-slate-200 dark:border-slate-700">
                          <Calendar size={15} color="#64748b" style={{ marginRight: 6 }} />
                          <TextInput
                            value={startDate}
                            onChangeText={setStartDate}
                            placeholder="YYYY-MM-DD"
                            className="flex-1 text-[13px] text-slate-900 dark:text-white font-medium"
                          />
                        </View>
                      )}
                    </View>

                    {/* Tanggal Selesai */}
                    <View className="flex-1 flex-col gap-1">
                      <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Tanggal Selesai
                      </Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(e: any) => setEndDate(e.target.value)}
                          className="w-full p-3 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white font-medium outline-none focus:border-[#2a75d3]"
                          style={{
                            boxSizing: 'border-box',
                            fontSize: '13px',
                            color: isDark ? '#ffffff' : '#0f172a',
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#334155' : '#cbd5e1',
                          }}
                        />
                      ) : (
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-[10px] border border-slate-200 dark:border-slate-700">
                          <Calendar size={15} color="#64748b" style={{ marginRight: 6 }} />
                          <TextInput
                            value={endDate}
                            onChangeText={setEndDate}
                            placeholder="YYYY-MM-DD"
                            className="flex-1 text-[13px] text-slate-900 dark:text-white font-medium"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Form Group: Keterangan / Alasan */}
                <View className="flex-col gap-1.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13px] font-bold text-slate-800 dark:text-white">
                      Keterangan / Alasan <Text className="text-rose-500">*</Text>
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                      {description.length}/250
                    </Text>
                  </View>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    maxLength={250}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tuliskan alasan lengkap (Maks 250 karakter)..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="p-3.5 rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white min-h-[90px]"
                    textAlignVertical="top"
                    style={{ outlineStyle: 'none' } as any}
                  />
                </View>

                {/* Form Group: Lampiran Pendukung */}
                <View className="flex-col gap-1.5">
                  <Text className="text-[13px] font-bold text-slate-800 dark:text-white">
                    Lampiran Pendukung {leaveType === 'SICK' && <Text className="text-rose-500">*</Text>}
                  </Text>

                  {selectedFile ? (
                    <View className="p-3.5 rounded-[12px] bg-blue-50/70 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View className="w-9 h-9 rounded-lg bg-[#2a75d3]/10 items-center justify-center">
                          <Paperclip size={18} color="#2a75d3" />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-[13px] font-bold text-slate-800 dark:text-white"
                            numberOfLines={1}
                          >
                            {selectedFile.name}
                          </Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                            Lampiran siap diunggah
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={removeSelectedFile}
                        className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center"
                      >
                        <X size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleUploadClick}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[14px] p-5 items-center justify-center bg-slate-50/70 dark:bg-slate-800/40 gap-1.5 hover:bg-slate-100 transition-all"
                    >
                      <UploadCloud size={30} color="#2a75d3" strokeWidth={2} />
                      <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        Ketuk untuk unggah foto/dokumen
                      </Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                        Format: JPG, PNG, PDF (Maks 5MB)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  onPress={handleSubmitLeave}
                  className="w-full bg-[#2a75d3] rounded-[12px] py-3.5 px-4 items-center justify-center flex-row gap-2 shadow-md shadow-[#2a75d3]/25 mt-1"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={16} color="#ffffff" strokeWidth={2.4} />
                      <Text className="text-[15px] font-bold text-white">
                        Kirim Pengajuan
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 2: RIWAYAT SAYA                                      */}
          {/* ======================================================== */}
          {activeTab === 'HISTORY' && (
            <View className="flex-col gap-4">
              {/* Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
              >
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.8}
                      onPress={() => setActiveFilter(tab.key)}
                      className={`py-2 px-4 rounded-full border transition-all ${
                        isActive
                          ? 'bg-[#2a75d3] border-[#2a75d3] shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* History Cards List */}
              {filteredLeaves.length === 0 ? (
                <View className="py-14 items-center bg-white dark:bg-slate-900 rounded-[18px] p-6 border border-slate-200/80 dark:border-slate-800">
                  <View className="w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-800 items-center justify-center mb-3">
                    <FileText size={26} color="#2a75d3" strokeWidth={1.8} />
                  </View>
                  <Text className="text-[16px] font-bold text-slate-800 dark:text-white">
                    Belum Ada Riwayat Pengajuan
                  </Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 text-center max-w-sm">
                    {activeFilter === 'ALL'
                      ? 'Anda belum memiliki riwayat pengajuan izin atau cuti.'
                      : `Tidak ditemukan pengajuan dengan status ${activeFilter.toLowerCase()}.`}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setActiveTab('CREATE')}
                    className="mt-4 px-4 py-2.5 rounded-[10px] bg-[#2a75d3] flex-row items-center gap-2"
                  >
                    <PlusCircle size={15} color="#ffffff" />
                    <Text className="text-[13px] font-bold text-white">
                      Buat Pengajuan Baru
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-col gap-3.5">
                  {filteredLeaves.map((card) => {
                    const isPending = card.status === 'PENDING';
                    const isApproved = card.status === 'APPROVED';
                    const isRejected = card.status === 'REJECTED';

                    return (
                      <View
                        key={card.id}
                        className="bg-white dark:bg-slate-900 rounded-[16px] p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-col gap-3"
                      >
                        {/* Header: Type icon, title, and status badge */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center gap-2.5">
                            <View
                              className={`w-8 h-8 rounded-[9px] items-center justify-center ${
                                card.typeCategory === 'sakit'
                                  ? 'bg-rose-50 dark:bg-rose-950/60'
                                  : card.typeCategory === 'cuti'
                                  ? 'bg-blue-50 dark:bg-blue-950/60'
                                  : 'bg-amber-50 dark:bg-amber-950/60'
                              }`}
                            >
                              {card.typeCategory === 'sakit' ? (
                                <HeartPulse size={16} color="#dc3545" strokeWidth={2.2} />
                              ) : card.typeCategory === 'cuti' ? (
                                <Umbrella size={16} color="#2a75d3" strokeWidth={2.2} />
                              ) : (
                                <FileText size={16} color="#f59e0b" strokeWidth={2.2} />
                              )}
                            </View>

                            <Text className="font-bold text-[15px] text-slate-800 dark:text-white">
                              {card.type}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          <View
                            className={`px-2.5 py-1 rounded-[8px] ${
                              isPending
                                ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60'
                                : isApproved
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60'
                                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60'
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-bold ${
                                isPending
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : isApproved
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {card.statusLabel}
                            </Text>
                          </View>
                        </View>

                        {/* Date info */}
                        <View className="flex-row items-center gap-1.5">
                          <Calendar size={13} color="#64748b" />
                          <Text className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                            {card.dateText}
                          </Text>
                        </View>

                        {/* Description Box */}
                        <View className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-[10px] border border-slate-100 dark:border-slate-800">
                          <Text className="text-[13px] text-slate-700 dark:text-slate-200 leading-[1.4]">
                            {card.description}
                          </Text>
                        </View>

                        {/* Footer info: attachment & date */}
                        <View className="flex-row justify-between items-center pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                          {isRejected && card.rejectionReason ? (
                            <View className="flex-row items-center gap-1 flex-1 pr-2">
                              <Info size={13} color="#dc3545" />
                              <Text
                                className="text-[12px] text-rose-600 font-semibold"
                                numberOfLines={1}
                              >
                                Alasan Ditolak: {card.rejectionReason}
                              </Text>
                            </View>
                          ) : card.attachment ? (
                            <View className="flex-row items-center gap-1 flex-1 pr-2">
                              <Paperclip size={13} color="#2a75d3" />
                              <Text
                                className="text-[12px] text-[#2a75d3] font-medium"
                                numberOfLines={1}
                              >
                                {card.attachment}
                              </Text>
                            </View>
                          ) : (
                            <Text className="text-[11px] text-slate-400">
                              Tidak ada lampiran
                            </Text>
                          )}

                          <Text className="text-[11px] text-slate-400 font-medium">
                            Diajukan: {card.submittedAt}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
