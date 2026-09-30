import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Calendar,
  Paperclip,
  Info,
  HeartPulse,
  Umbrella,
  FileText,
  UploadCloud,
  X,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';

interface LeaveItem {
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

  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Modal State for New Leave Submission
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'Sakit' | 'Cuti Tahunan' | 'Izin Penting'>('Sakit');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
    } catch (err) {
      console.error('Failed to fetch leave history:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaves();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat membuka galeri.');
    }
  };

  const handleSubmitLeave = async () => {
    if (!description.trim()) {
      Alert.alert('Perhatian', 'Keterangan/Alasan pengajuan wajib diisi.');
      return;
    }

    if (leaveType === 'Sakit' && !photoUri) {
      Alert.alert('Perhatian', 'Dokumen / Foto Surat Dokter wajib dilampirkan untuk izin Sakit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const statusToSend = leaveType === 'Sakit' ? 'SICK' : 'LEAVE';
      formData.append('status', statusToSend);
      formData.append('date', leaveDate);
      formData.append('description', `[${leaveType}] ${description}`);

      if (photoUri) {
        const filename = photoUri.split('/').pop() || 'leave_proof.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('photo', {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      }

      const res = await api.post('/attendance/leave', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        Alert.alert('Sukses', 'Pengajuan izin berhasil dikirim dan menunggu persetujuan.');
        setDescription('');
        setPhotoUri(null);
        setShowModal(false);
        fetchLeaves();
      } else {
        Alert.alert('Info', res.data?.message || 'Gagal mengirim pengajuan.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan sistem saat mengirim pengajuan.';
      Alert.alert('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUri =
    user?.photo ||
    user?.avatar ||
    'https://i.pravatar.cc/150?img=12';

  // Sample items matching HTML design if DB is empty
  const defaultItems: LeaveItem[] = useMemo(
    () => [
      {
        id: 'sample-1',
        type: 'Sakit',
        typeCategory: 'sakit',
        status: 'PENDING',
        statusLabel: 'Menunggu',
        dateText: '08 Sep 2026 - 09 Sep 2026 (2 Hari)',
        description: 'Demam tinggi, disarankan istirahat oleh dokter.',
        attachment: 'surat_dokter.pdf',
        submittedAt: 'Hari ini',
        rejectionReason: null,
      },
      {
        id: 'sample-2',
        type: 'Cuti Tahunan',
        typeCategory: 'cuti',
        status: 'APPROVED',
        statusLabel: 'Disetujui',
        dateText: '25 Agu 2026 - 28 Agu 2026 (4 Hari)',
        description: 'Acara keluarga di luar kota.',
        attachment: null,
        submittedAt: '15 Agu 2026',
        rejectionReason: null,
      },
      {
        id: 'sample-3',
        type: 'Izin Penting',
        typeCategory: 'izin',
        status: 'REJECTED',
        statusLabel: 'Ditolak',
        dateText: '17 Agu 2026 (1 Hari)',
        description: 'Cuti tambahan setelah acara kemerdekaan.',
        attachment: null,
        submittedAt: '16 Agu 2026',
        rejectionReason: 'Kuota cuti habis',
      },
    ],
    []
  );

  const displayLeaves: LeaveItem[] = useMemo(() => {
    if (leaves && leaves.length > 0) {
      return leaves.map((item: any) => {
        const isSick = item.status === 'SICK';
        const rawDesc = item.leaveDescription || '';
        let type = isSick ? 'Sakit' : 'Cuti Tahunan';
        let typeCategory: 'sakit' | 'cuti' | 'izin' = isSick ? 'sakit' : 'cuti';

        if (rawDesc.includes('[Izin Penting]')) {
          type = 'Izin Penting';
          typeCategory = 'izin';
        } else if (rawDesc.includes('[Cuti Tahunan]')) {
          type = 'Cuti Tahunan';
          typeCategory = 'cuti';
        } else if (rawDesc.includes('[Sakit]')) {
          type = 'Sakit';
          typeCategory = 'sakit';
        }

        const cleanDesc = rawDesc.replace(/^\[(Sakit|Cuti Tahunan|Izin Penting)\]\s*/, '');
        const status = item.leaveApprovalStatus || 'PENDING';
        const statusLabel =
          status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Menunggu';

        const d = new Date(item.date);
        const dateFormatted = isNaN(d.getTime())
          ? String(item.date)
          : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        return {
          id: String(item.id),
          type,
          typeCategory,
          status,
          statusLabel,
          dateText: `${dateFormatted} (1 Hari)`,
          description: cleanDesc || 'Tidak ada keterangan.',
          attachment: item.clockInPhoto ? item.clockInPhoto.split('/').pop() : null,
          submittedAt: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
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
    <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center" style={{ flex: 1, height: '100%', minHeight: '100%' }}>
      <View className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm" style={{ flex: 1, height: '100%', minHeight: 0 }}>
        
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3 bg-[#f4f7fb] dark:bg-slate-950 z-10">
          <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
            Izin & Cuti
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1 px-5"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
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
          {/* CTA: Ajukan Izin Baru */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setShowModal(true)}
            className="mt-4 mb-[25px]"
          >
            <LinearGradient
              colors={['#2a75d3', '#5097f5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#2a75d3',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 4,
              }}
            >
              <View className="flex-1 pr-3">
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                  Ajukan Izin Baru
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 12, opacity: 0.9, fontWeight: '400' }}>
                  Sakit, Cuti Tahunan, atau Izin Penting
                </Text>
              </View>

              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} color="#ffffff" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tab Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
            contentContainerStyle={{ gap: 10, paddingBottom: 5 }}
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(tab.key)}
                  className={`py-2 px-4 rounded-[20px] border ${
                    isActive
                      ? 'bg-[#2a75d3] border-[#2a75d3]'
                      : 'bg-transparent border-[#eef1f6] dark:border-slate-800'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-medium ${
                      isActive
                        ? 'text-white'
                        : 'text-[#777777] dark:text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List Riwayat Izin */}
          <View className="flex-col gap-[15px]">
            {filteredLeaves.map((card) => {
              const isWarning = card.status === 'PENDING';
              const isSuccess = card.status === 'APPROVED';
              const isDanger = card.status === 'REJECTED';

              return (
                <View
                  key={card.id}
                  className="bg-white dark:bg-slate-900 rounded-[16px] p-4 border border-[#eef1f6] dark:border-slate-800 flex-col gap-3"
                  style={{
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.03,
                    shadowRadius: 15,
                    elevation: 2,
                  }}
                >
                  {/* Leave Header */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-7 h-7 rounded-[8px] items-center justify-center ${
                          card.typeCategory === 'sakit'
                            ? 'bg-[#fcebeb] dark:bg-rose-950/40'
                            : card.typeCategory === 'cuti'
                            ? 'bg-[#eaf3fc] dark:bg-blue-950/40'
                            : 'bg-[#fff8e6] dark:bg-amber-950/40'
                        }`}
                      >
                        {card.typeCategory === 'sakit' ? (
                          <HeartPulse size={14} color="#dc3545" strokeWidth={2.2} />
                        ) : card.typeCategory === 'cuti' ? (
                          <Umbrella size={14} color="#2a75d3" strokeWidth={2.2} />
                        ) : (
                          <FileText size={14} color="#b08000" strokeWidth={2.2} />
                        )}
                      </View>

                      <Text className="font-semibold text-[15px] text-[#222222] dark:text-white">
                        {card.type}
                      </Text>
                    </View>

                    {/* Badge */}
                    <View
                      className={`px-2.5 py-1.5 rounded-[8px] ${
                        isWarning
                          ? 'bg-[#fff8e6] dark:bg-amber-950/40'
                          : isSuccess
                          ? 'bg-[#e6f6eb] dark:bg-emerald-950/40'
                          : 'bg-[#fcebeb] dark:bg-rose-950/40'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          isWarning
                            ? 'text-[#b08000] dark:text-amber-400'
                            : isSuccess
                            ? 'text-[#28a745] dark:text-emerald-400'
                            : 'text-[#dc3545] dark:text-rose-400'
                        }`}
                      >
                        {card.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Leave Date */}
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={13} color="#777777" />
                    <Text className="text-[13px] text-[#777777] dark:text-slate-400">
                      {card.dateText}
                    </Text>
                  </View>

                  {/* Leave Desc */}
                  <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-2.5 rounded-[8px] border border-[#eef1f6] dark:border-slate-700/60">
                    <Text className="text-[13px] text-[#222222] dark:text-slate-200">
                      {card.description}
                    </Text>
                  </View>

                  {/* Leave Footer */}
                  <View className="flex-row justify-between items-center pt-2 border-t border-dashed border-[#eef1f6] dark:border-slate-800">
                    {isDanger && card.rejectionReason ? (
                      <View className="flex-row items-center gap-1 flex-1 pr-2">
                        <Info size={13} color="#dc3545" />
                        <Text className="text-[12px] text-[#dc3545] font-medium" numberOfLines={1}>
                          Alasan: {card.rejectionReason}
                        </Text>
                      </View>
                    ) : card.attachment ? (
                      <View className="flex-row items-center gap-1 flex-1 pr-2">
                        <Paperclip size={13} color="#2a75d3" />
                        <Text className="text-[12px] text-[#2a75d3]" numberOfLines={1}>
                          {card.attachment}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[12px] text-[#777777] dark:text-slate-500">
                        Tidak ada lampiran
                      </Text>
                    )}

                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">
                      Diajukan: {card.submittedAt}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Modal: Form Pengajuan Izin Baru */}
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end items-center">
            <View className="w-full max-w-[414px] bg-white dark:bg-slate-900 rounded-t-[28px] p-6 max-h-[90%]">
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-[#eef1f6] dark:border-slate-800">
                <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
                  Ajukan Izin Baru
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={18} color={isDark ? '#cbd5e1' : '#555555'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Tipe Pengajuan */}
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-2.5">
                  Tipe Pengajuan
                </Text>
                <View className="flex-row gap-2 mb-4">
                  {(['Sakit', 'Cuti Tahunan', 'Izin Penting'] as const).map((type) => {
                    const isSelected = leaveType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        activeOpacity={0.7}
                        onPress={() => setLeaveType(type)}
                        className={`flex-1 py-2.5 px-2 rounded-xl border items-center justify-center ${
                          isSelected
                            ? 'bg-[#2a75d3] border-[#2a75d3]'
                            : 'bg-slate-50 dark:bg-slate-800 border-[#eef1f6] dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            isSelected ? 'text-white' : 'text-[#555555] dark:text-slate-300'
                          }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Tanggal Izin */}
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-2">
                  Tanggal Pengajuan
                </Text>
                <TextInput
                  value={leaveDate}
                  onChangeText={setLeaveDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] text-[#222222] dark:text-white mb-4"
                />

                {/* Keterangan */}
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-2">
                  Alasan / Keterangan
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Jelaskan alasan pengajuan secara singkat..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  style={{ textAlignVertical: 'top', height: 90 }}
                  className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl p-3.5 text-[14px] text-[#222222] dark:text-white mb-4"
                />

                {/* Lampiran Bukti */}
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-2">
                  Lampiran Bukti {leaveType === 'Sakit' ? '(Wajib)' : '(Opsional)'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={pickImage}
                  className="border-2 border-dashed border-[#cbd5e1] dark:border-slate-700 rounded-2xl py-6 items-center justify-center bg-slate-50 dark:bg-slate-800/40 mb-6"
                >
                  {photoUri ? (
                    <View className="items-center px-4">
                      <Check size={26} color="#28a745" className="mb-1" />
                      <Text className="text-[#28a745] font-semibold text-[13px] text-center">
                        Foto berhasil dilampirkan
                      </Text>
                      <Text className="text-[#777777] text-[11px] mt-1">
                        Klik untuk mengganti foto
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center px-4">
                      <UploadCloud size={30} color="#2a75d3" className="mb-1.5" />
                      <Text className="text-[#2a75d3] font-semibold text-[13px]">
                        Upload Surat Dokter / Bukti
                      </Text>
                      <Text className="text-[#777777] dark:text-slate-400 text-[11px] mt-0.5">
                        Format PNG atau JPG
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Submit Action */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSubmitLeave}
                  disabled={isSubmitting}
                  className="rounded-xl overflow-hidden"
                >
                  <LinearGradient
                    colors={['#2a75d3', '#1f5ca8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text className="text-white font-bold text-[14px] tracking-wide">
                        KIRIM PENGAJUAN
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

