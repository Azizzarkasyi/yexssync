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
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Plus,
  Clock,
  PenSquare,
  ChevronDown,
  X,
  Check,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(AuthContext);

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Month filter state
  const monthOptions = ['September 2026', 'Agustus 2026', 'Juli 2026'];
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Correction Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [targetDate, setTargetDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendance/history');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHistory();
  };

  const formatHHmm = (dateVal?: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatTimeDisplay = (dateVal?: string | Date) => {
    if (!dateVal) return '--:--';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '--:--';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} WIB`;
  };

  const formatDateIndo = (dateVal?: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const calculateDuration = (inTime?: string | Date, outTime?: string | Date) => {
    if (!inTime || !outTime) return null;
    const start = new Date(inTime).getTime();
    const end = new Date(outTime).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const diffMin = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}j ${mins}m`;
  };

  const openCorrectionModal = (record?: any) => {
    if (record) {
      setSelectedRecord(record);
      setTargetDate(formatDateIndo(record.date || record.createdAt));
      setClockIn(record.clockIn ? formatHHmm(record.clockIn) : '08:00');
      setClockOut(record.clockOut ? formatHHmm(record.clockOut) : '17:00');
    } else {
      setSelectedRecord(null);
      setTargetDate(new Date().toISOString().split('T')[0]);
      setClockIn('08:00');
      setClockOut('17:00');
    }
    setReason('');
    setShowModal(true);
  };

  const submitCorrection = async () => {
    if (!reason.trim() || (!clockIn.trim() && !clockOut.trim())) {
      Alert.alert('Perhatian', 'Alasan koreksi dan minimal satu jam koreksi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const recordId = selectedRecord?.id || history[0]?.id;
      if (!recordId) {
        Alert.alert('Sukses', 'Pengajuan koreksi presensi berhasil dicatat!');
        setShowModal(false);
        return;
      }

      const response = await api.post(`/attendance/${recordId}/correction`, {
        correctionReason: reason,
        requestedClockIn: clockIn || undefined,
        requestedClockOut: clockOut || undefined,
      });

      if (response.data?.success) {
        Alert.alert('Sukses', 'Pengajuan koreksi berhasil dikirim dan menunggu persetujuan.');
        setShowModal(false);
        fetchHistory();
      } else {
        Alert.alert('Gagal', response.data?.message || 'Gagal mengirim koreksi');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUri =
    user?.photo ||
    user?.avatar ||
    'https://i.pravatar.cc/150?img=12';


  const displayHistory = useMemo(() => {
    if (history && history.length > 0) {
      return history.map((record: any, idx: number) => {
        const isLate = record.status === 'LATE';
        const isPresent = record.status === 'PRESENT';
        const isLeave = record.status === 'LEAVE' || record.status === 'SICK';
        const isNoClock = !record.clockIn && !record.clockOut;

        let badgeText = 'Hadir';
        let badgeType: 'success' | 'danger' | 'warning' | 'alpha' = 'success';

        if (isNoClock) {
          badgeText = 'Alpha';
          badgeType = 'alpha';
        } else if (isLate) {
          badgeText = 'Terlambat';
          badgeType = 'danger';
        } else if (isLeave) {
          badgeText = record.status === 'SICK' ? 'Sakit' : 'Cuti';
          badgeType = 'warning';
        } else if (isPresent) {
          badgeText = idx === 0 ? 'Tepat Waktu' : 'Hadir';
          badgeType = 'success';
        }

        const duration = calculateDuration(record.clockIn, record.clockOut);
        let footerText = duration ? `Total: ${duration}` : isNoClock ? 'Tanpa Keterangan' : 'Presensi Harian';
        if (record.correctionReason) {
          footerText = record.correctionReason;
        }

        return {
          id: String(record.id || idx),
          rawRecord: record,
          dateText: formatDateIndo(record.date || record.createdAt),
          badgeText,
          badgeType,
          timeIn: formatTimeDisplay(record.clockIn),
          timeOut: formatTimeDisplay(record.clockOut),
          footerText,
          isAlpha: isNoClock,
          correctionStatus: record.correctionStatus || null,
        };
      });
    }
    return [];
  }, [history]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#2a75d3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center" style={{ flex: 1, height: '100%', minHeight: '100%' }}>
      <View className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm" style={{ flex: 1, height: '100%', minHeight: 0 }}>
        
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3 bg-[#f4f7fb] dark:bg-slate-950 z-10">
          <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
            Riwayat & Koreksi
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
          >
            <UserAvatar name={user?.name} photo={user?.photo || user?.avatar} size={32} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
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
          {/* Filter & Aksi Section */}
          <View className="flex-row justify-between items-center my-4">
            {/* Dropdown Month Selector */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowMonthPicker(!showMonthPicker)}
              className="flex-row items-center gap-2 py-2 px-3.5 bg-white dark:bg-slate-900 border border-[#eef1f6] dark:border-slate-800 rounded-[12px] shadow-sm"
            >
              <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                {selectedMonth}
              </Text>
              <ChevronDown size={15} color={isDark ? '#cbd5e1' : '#777777'} />
            </TouchableOpacity>

            {/* Global Koreksi Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openCorrectionModal(null)}
              className="flex-row items-center gap-1.5 py-2.5 px-3.5 bg-[#eaf3fc] dark:bg-blue-950/40 rounded-[12px]"
            >
              <Plus size={15} color="#2a75d3" strokeWidth={2.5} />
              <Text className="text-[13px] font-semibold text-[#2a75d3] dark:text-blue-400">
                Koreksi
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month Picker Modal / Dropdown Popup */}
          {showMonthPicker && (
            <View className="bg-white dark:bg-slate-900 border border-[#eef1f6] dark:border-slate-800 rounded-xl p-2 mb-4 shadow-md">
              {monthOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setSelectedMonth(opt);
                    setShowMonthPicker(false);
                  }}
                  className={`py-2.5 px-3 rounded-lg ${
                    selectedMonth === opt
                      ? 'bg-blue-50 dark:bg-blue-950/50'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-[13px] ${
                      selectedMonth === opt
                        ? 'font-bold text-[#2a75d3]'
                        : 'font-normal text-[#444444] dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* List Riwayat */}
          <View className="flex-col gap-[15px]">
            {displayHistory.length === 0 ? (
              <View className="py-12 items-center bg-white dark:bg-slate-900 rounded-[16px] p-6 border border-[#eef1f6] dark:border-slate-800">
                <Calendar size={40} color={isDark ? "#64748b" : "#94a3b8"} strokeWidth={1.5} />
                <Text className="text-[15px] font-semibold text-[#222222] dark:text-white mt-3">
                  Belum Ada Riwayat
                </Text>
                <Text className="text-[12px] text-[#777777] dark:text-slate-400 mt-1 text-center">
                  Data presensi Anda pada bulan ini akan ditampilkan di sini.
                </Text>
              </View>
            ) : (
              displayHistory.map((card: any) => {
              const isDanger = card.badgeType === 'danger';
              const isAlpha = card.badgeType === 'alpha';
              const isWarning = card.badgeType === 'warning';

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
                  {/* Card Header */}
                  <View className="flex-row justify-between items-center pb-2.5 border-b border-[#eef1f6] dark:border-slate-800">
                    <View className="flex-row items-center gap-2">
                      <Calendar size={15} color="#2a75d3" />
                      <Text className="font-semibold text-[14px] text-[#222222] dark:text-white">
                        {card.dateText}
                      </Text>
                    </View>

                    {/* Badge */}
                    <View
                      className={`px-2.5 py-1 rounded-[8px] ${
                        isAlpha
                          ? 'bg-[#ffebee] dark:bg-rose-950/60'
                          : isDanger
                          ? 'bg-[#fcebeb] dark:bg-rose-950/40'
                          : isWarning
                          ? 'bg-[#fff8e6] dark:bg-amber-950/40'
                          : 'bg-[#e6f6eb] dark:bg-emerald-950/40'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          isAlpha
                            ? 'text-[#c62828] dark:text-rose-300'
                            : isDanger
                            ? 'text-[#dc3545] dark:text-rose-400'
                            : isWarning
                            ? 'text-[#f59e0b] dark:text-amber-400'
                            : 'text-[#28a745] dark:text-emerald-400'
                        }`}
                      >
                        {card.badgeText}
                      </Text>
                    </View>
                  </View>

                  {/* Time Grid (2 columns) */}
                  <View className="flex-row gap-2.5">
                    {/* Jam Masuk */}
                    <View className="flex-1 bg-[#fafbfe] dark:bg-slate-800/60 p-2.5 rounded-[8px] border border-[#eef1f6] dark:border-slate-700/60">
                      <Text className="text-[11px] text-[#777777] dark:text-slate-400 mb-1">
                        Jam Masuk
                      </Text>
                      <Text className="text-[14px] font-bold text-[#222222] dark:text-white">
                        {card.timeIn}
                      </Text>
                    </View>

                    {/* Jam Pulang */}
                    <View className="flex-1 bg-[#fafbfe] dark:bg-slate-800/60 p-2.5 rounded-[8px] border border-[#eef1f6] dark:border-slate-700/60">
                      <Text className="text-[11px] text-[#777777] dark:text-slate-400 mb-1">
                        Jam Pulang
                      </Text>
                      <Text className="text-[14px] font-bold text-[#222222] dark:text-white">
                        {card.timeOut}
                      </Text>
                    </View>
                  </View>

                  {/* Card Footer */}
                  <View className="flex-row justify-between items-center pt-1">
                    <Text
                      className={`text-[11px] ${
                        card.isAlpha
                          ? 'text-[#dc3545] font-medium'
                          : 'text-[#777777] dark:text-slate-400'
                      }`}
                    >
                      {card.footerText}
                    </Text>

                    {/* Right Side: Status or Action Button */}
                    {card.correctionStatus === 'PENDING' ? (
                      <View className="flex-row items-center gap-1 bg-[#fff8e6] dark:bg-amber-950/40 px-2 py-1 rounded-[4px]">
                        <Clock size={12} color="#f59e0b" />
                        <Text className="text-[11px] font-semibold text-[#f59e0b] dark:text-amber-400">
                          Koreksi Menunggu
                        </Text>
                      </View>
                    ) : card.correctionStatus === 'APPROVED' ? (
                      <View className="flex-row items-center gap-1 bg-[#e6f6eb] dark:bg-emerald-950/40 px-2 py-1 rounded-[4px]">
                        <Check size={12} color="#28a745" />
                        <Text className="text-[11px] font-semibold text-[#28a745] dark:text-emerald-400">
                          Koreksi Disetujui
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => openCorrectionModal(card.rawRecord || card)}
                        className="flex-row items-center gap-1"
                      >
                        <PenSquare size={13} color="#2a75d3" />
                        <Text className="text-[13px] font-semibold text-[#2a75d3]">
                          Ajukan Koreksi
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }))}
          </View>
        </ScrollView>

        {/* Modal: Form Pengajuan Koreksi */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[414px] bg-white dark:bg-slate-900 rounded-[24px] p-6 max-h-[85%] shadow-2xl border border-slate-100 dark:border-slate-800">
                {/* Modal Header */}
                <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-[#eef1f6] dark:border-slate-800">
                  <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
                    Ajukan Koreksi Presensi
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                  >
                    <X size={18} color={isDark ? '#cbd5e1' : '#555555'} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {/* Tanggal Terpilih */}
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-1.5">
                    Tanggal Presensi
                  </Text>
                  <View className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-[14px] text-[#222222] dark:text-white font-medium">
                      {targetDate || 'Hari ini'}
                    </Text>
                  </View>

                  {/* Input Jam Masuk & Jam Pulang */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-1.5">
                        Jam Masuk Baru
                      </Text>
                      <TextInput
                        value={clockIn}
                        onChangeText={setClockIn}
                        placeholder="08:00"
                        placeholderTextColor="#94a3b8"
                        className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] text-[#222222] dark:text-white"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-1.5">
                        Jam Pulang Baru
                      </Text>
                      <TextInput
                        value={clockOut}
                        onChangeText={setClockOut}
                        placeholder="17:00"
                        placeholderTextColor="#94a3b8"
                        className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] text-[#222222] dark:text-white"
                      />
                    </View>
                  </View>

                  {/* Alasan Koreksi */}
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-slate-200 mb-1.5">
                    Alasan Koreksi
                  </Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Misal: Lupa tap masuk karena jaringan error..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: 'top', height: 90 }}
                    className="bg-slate-50 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700 rounded-xl p-3.5 text-[14px] text-[#222222] dark:text-white mb-6"
                  />

                  {/* Submit Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={submitCorrection}
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
                          KIRIM PENGAJUAN KOREKSI
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
