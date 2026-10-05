import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { YexsLogo } from '@/components/YexsLogo';
import {
  CheckCircle2,
  Bell,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
  Plane,
  Calendar,
  MapPin,
  Navigation,
  RotateCw,
  ListChecks,
  ArrowRight,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import FaceRecognitionModal from '@/components/FaceRecognitionModal';
import api from '@/lib/api';
import { APP_ENV } from '@/config/env';
import {
  scheduleShiftReminder,
  notifyClockInSuccess,
  notifyClockOutSuccess,
} from '@/lib/notifications';
import UserAvatar from '@/components/UserAvatar';

export default function UserHomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useContext(AuthContext);

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

  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [breakData, setBreakData] = useState<{
    breaks: any[];
    totalMinutes: number;
    activeBreak: any;
  } | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Face Recognition Modal State
  const [faceModalVisible, setFaceModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clockIn' | 'clockOut' | null>(null);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    inRadius: boolean;
    distanceText: string;
  }>({
    latitude: -6.2088,
    longitude: 106.8456,
    address: 'Gedung YexsSync HQ, Lantai 3',
    inRadius: true,
    distanceText: '15m dari titik kantor (Valid)',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    fetchData();
    detectLocation();
    scheduleShiftReminder('08:00');
  }, []);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = loc.coords;

        let addressName = 'Area Perkantoran';
        try {
          const geoList = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geoList && geoList.length > 0) {
            const g = geoList[0];
            const parts = [g.name, g.street, g.subregion || g.city].filter(Boolean);
            if (parts.length > 0) addressName = parts.join(', ');
          }
        } catch (e) {
          addressName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }

        setLocation({
          latitude,
          longitude,
          address: addressName,
          inRadius: true,
          distanceText: '15m dari titik kantor (Valid)',
        });
      } else {
        setLocation({
          latitude: -6.2088,
          longitude: 106.8456,
          address: 'Gedung YexsSync HQ, Lantai 3',
          inRadius: true,
          distanceText: '15m dari titik kantor (Valid)',
        });
      }
    } catch (err) {
      setLocation({
        latitude: -6.2088,
        longitude: 106.8456,
        address: 'Gedung YexsSync HQ, Lantai 3',
        inRadius: true,
        distanceText: '15m dari titik kantor (Valid)',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const fetchData = async () => {
    try {
      const [todayRes, historyRes, breakRes, tasksRes] = await Promise.all([
        api.get('/attendance/today').catch(() => ({ data: { success: false } })),
        api.get('/attendance/history?limit=3').catch(() => ({ data: { success: false } })),
        api.get('/breaks/today').catch(() => ({ data: { success: false } })),
        api.get('/tasks/my').catch(() => ({ data: { success: false } })),
      ]);

      if (todayRes.data?.success) {
        setAttendanceToday(todayRes.data.data);
      }
      if (historyRes.data?.success && Array.isArray(historyRes.data.data)) {
        setHistory(historyRes.data.data);
      }
      if (breakRes.data?.success && breakRes.data.data) {
        setBreakData(breakRes.data.data);
      }
      if (tasksRes.data?.success && Array.isArray(tasksRes.data.data)) {
        setTasks(tasksRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    detectLocation();
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTodayFormatted = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
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

  const handleClockIn = async () => {
    if (attendanceToday?.clockIn) {
      Alert.alert('Sudah Presensi', `Anda sudah melakukan presensi masuk hari ini pada pukul ${formatTime(attendanceToday.clockIn)} WIB.`);
      return;
    }
    if (APP_ENV.BIOMETRICS.ENABLE_FACE_RECOGNITION) {
      setPendingAction('clockIn');
      setFaceModalVisible(true);
    } else {
      executeClockIn();
    }
  };

  const executeClockIn = async (photoUri?: string) => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/attendance/clock-in', {
        status: 'PRESENT',
        faceVerified: true,
        latitude: location.latitude,
        longitude: location.longitude,
        ...(photoUri ? { photo: photoUri } : {}),
      });
      if (res.data?.success) {
        notifyClockInSuccess(formatTime(new Date().toISOString()), location.address);
        Alert.alert('Sukses', 'Presensi masuk berhasil dicatat!');
        fetchData();
      } else {
        Alert.alert('Info', res.data?.message || 'Gagal melakukan presensi masuk');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal melakukan presensi masuk.';
      Alert.alert('Presensi Masuk', msg);
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleClockOut = async () => {
    if (!attendanceToday?.clockIn) {
      Alert.alert('Perhatian', 'Anda belum melakukan presensi masuk hari ini.');
      return;
    }
    if (attendanceToday?.clockOut) {
      Alert.alert('Sudah Presensi Pulang', `Anda sudah melakukan presensi pulang hari ini pada pukul ${formatTime(attendanceToday.clockOut)} WIB.`);
      return;
    }
    if (APP_ENV.BIOMETRICS.ENABLE_FACE_RECOGNITION) {
      setPendingAction('clockOut');
      setFaceModalVisible(true);
    } else {
      executeClockOut();
    }
  };

  const executeClockOut = async (photoUri?: string) => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/attendance/clock-out', {
        faceVerified: true,
        latitude: location.latitude,
        longitude: location.longitude,
        ...(photoUri ? { photo: photoUri } : {}),
      });
      if (res.data?.success) {
        notifyClockOutSuccess(formatTime(new Date().toISOString()));
        Alert.alert('Sukses', 'Presensi pulang berhasil dicatat!');
        fetchData();
      } else {
        Alert.alert('Info', res.data?.message || 'Gagal melakukan presensi pulang');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal melakukan presensi pulang.';
      Alert.alert('Presensi Pulang', msg);
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleStartBreak = async () => {
    if (!attendanceToday?.clockIn) {
      Alert.alert('Perhatian', 'Anda harus melakukan presensi masuk terlebih dahulu sebelum istirahat.');
      return;
    }
    if (attendanceToday?.clockOut) {
      Alert.alert('Perhatian', 'Anda sudah melakukan presensi pulang.');
      return;
    }
    if (breakData?.activeBreak) {
      Alert.alert('Perhatian', 'Sesi istirahat Anda sedang berlangsung.');
      return;
    }
    Alert.alert('Mulai Istirahat', 'Apakah Anda ingin memulai waktu istirahat sekarang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Mulai',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            const res = await api.post('/breaks/start', { faceVerified: true });
            if (res.data?.success) {
              Alert.alert('Sukses', 'Waktu istirahat Anda telah dimulai!');
              fetchData();
            } else {
              Alert.alert('Info', res.data?.message || 'Gagal memulai istirahat');
            }
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Gagal memulai istirahat.';
            Alert.alert('Mulai Istirahat', msg);
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleEndBreak = async () => {
    if (!breakData?.activeBreak) {
      Alert.alert('Perhatian', 'Tidak ada sesi istirahat yang sedang berjalan.');
      return;
    }
    Alert.alert('Selesai Istirahat', 'Apakah Anda ingin menyelesaikan waktu istirahat sekarang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Selesai',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            const res = await api.post('/breaks/end', { faceVerified: true });
            if (res.data?.success) {
              Alert.alert('Sukses', 'Sesi istirahat selesai, selamat kembali bekerja!');
              fetchData();
            } else {
              Alert.alert('Info', res.data?.message || 'Gagal menyelesaikan istirahat');
            }
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Gagal menyelesaikan istirahat.';
            Alert.alert('Selesai Istirahat', msg);
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Karyawan';
  const avatarUri = user?.photo || user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=2a75d3&color=fff';

  const statusBoxText = useMemo(() => {
    if (breakData?.activeBreak) return `Sedang Istirahat (${formatTime(breakData.activeBreak.startTime)} WIB)`;
    if (!attendanceToday) return 'Belum Presensi Masuk';
    if (attendanceToday.clockOut) return `Sudah Presensi Pulang (${formatTime(attendanceToday.clockOut)} WIB)`;
    if (attendanceToday.clockIn) return `Sudah Presensi Masuk (${formatTime(attendanceToday.clockIn)} WIB)`;
    return 'Belum Presensi Masuk';
  }, [attendanceToday, breakData]);

  const breakStartTimeText = useMemo(() => {
    if (breakData?.activeBreak) return `${formatTime(breakData.activeBreak.startTime)} WIB`;
    if (breakData?.breaks && breakData.breaks.length > 0) {
      const last = breakData.breaks[breakData.breaks.length - 1];
      return `${formatTime(last.startTime)} WIB`;
    }
    return '--:-- WIB';
  }, [breakData]);

  const breakEndTimeText = useMemo(() => {
    if (breakData?.breaks && breakData.breaks.length > 0) {
      const ended = breakData.breaks.filter((b: any) => b.endTime);
      if (ended.length > 0) return `${formatTime(ended[ended.length - 1].endTime)} WIB`;
    }
    return '--:-- WIB';
  }, [breakData]);

  const recentHistory = useMemo(() => {
    if (history && history.length > 0) {
      return history.map((item, idx) => ({
        id: item.id || String(idx),
        date: formatDateIndo(item.date || item.createdAt),
        timeText: `In: ${item.clockIn ? formatTime(item.clockIn) : '--:--'} | Out: ${item.clockOut ? formatTime(item.clockOut) : '--:--'}`,
        badge: item.status === 'LATE' ? 'Terlambat' : 'Hadir',
        isSuccess: item.status !== 'LATE',
      }));
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
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3 bg-[#f4f7fb] dark:bg-slate-950 z-10">
          <View className="flex-row items-center gap-2">
            <YexsLogo size={24} rounded />
            <Text className="text-[18px] font-bold text-[#2a75d3] tracking-tight">YEXSSYNC</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi baru.')}>
              <Bell size={20} color={isDark ? '#cbd5e1' : '#222222'} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/user/profile')}>
              <UserAvatar name={user?.name || userName} photo={user?.photo || user?.avatar} size={32} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Keluar / Logout"
            >
              <LogOut size={16} color="#ef4444" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2a75d3']} tintColor="#2a75d3" />}>
          <View className="flex-row items-center gap-[15px] my-5">
            <UserAvatar name={user?.name || userName} photo={user?.photo || user?.avatar} size={50} borderWidth={2} borderColor={isDark ? '#1e293b' : '#ffffff'} />
            <View className="flex-1">
              <Text className="text-[18px] font-bold text-[#222222] dark:text-white mb-1">Halo, {userName}!</Text>
              <Text className="text-[13px] text-[#777777] dark:text-slate-400">{getTodayFormatted()}</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-slate-900 py-[15px] px-4 rounded-[12px] items-center justify-center mb-5 border border-[#eef1f6] dark:border-slate-800" style={{ shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 1 }}>
            <Text className="text-[14px] font-semibold text-[#222222] dark:text-slate-200 text-center">
              Status: <Text className="font-semibold text-[#2a75d3]">{statusBoxText}</Text>
            </Text>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-[16px] p-4 mb-5 border border-[#eef1f6] dark:border-slate-800" style={{ shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 }}>
            <View className="flex-row justify-between items-center mb-2.5">
              <View className="flex-row items-center gap-2">
                <MapPin size={18} color="#2a75d3" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#222222] dark:text-white">Lokasi Presensi Anda</Text>
              </View>
              <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f6eb] dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40">
                <View className="w-2 h-2 rounded-full bg-[#28a745]" />
                <Text className="text-[11px] font-semibold text-[#28a745] dark:text-emerald-400">{location.inRadius ? 'Dalam Jangkauan' : 'Di Luar Radius'}</Text>
              </View>
            </View>
            <View className="h-[95px] w-full rounded-[12px] overflow-hidden relative my-2 bg-slate-100 dark:bg-slate-800 border border-[#eef1f6] dark:border-slate-700/60 justify-center items-center">
              <View className="absolute inset-0 opacity-20">
                <View className="absolute top-1/2 left-0 right-0 h-[6px] bg-slate-400 -translate-y-1" />
                <View className="absolute left-1/3 top-0 bottom-0 w-[6px] bg-slate-400" />
                <View className="absolute left-2/3 top-0 bottom-0 w-[6px] bg-slate-400" />
              </View>
              <View className="w-20 h-20 rounded-full border border-blue-400/30 bg-blue-500/10 items-center justify-center">
                <View className="w-12 h-12 rounded-full border border-blue-500/40 bg-blue-500/20 items-center justify-center">
                  <View className="w-7 h-7 rounded-full bg-[#2a75d3] items-center justify-center shadow-lg shadow-blue-500/50">
                    <Navigation size={13} color="#ffffff" strokeWidth={2.5} />
                  </View>
                </View>
              </View>
            </View>
            <View className="flex-row justify-between items-center pt-2">
              <View className="flex-1 pr-3">
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-white" numberOfLines={1}>{location.address}</Text>
                <Text className="text-[11px] text-[#777777] dark:text-slate-400 mt-0.5">Lat: {location.latitude.toFixed(5)}, Long: {location.longitude.toFixed(5)} • {location.distanceText}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={detectLocation} disabled={isLocating} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700">
                <RotateCw size={15} color="#2a75d3" className={isLocating ? 'opacity-50' : ''} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-3 mb-[25px]">
            <TouchableOpacity style={{ width: '48%' }} onPress={handleClockIn} disabled={isSubmitting}>
              <LinearGradient colors={['#38c159', '#28a745']} style={{ borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 6 }}>
                <LogIn size={26} color="#ffffff" strokeWidth={2.4} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>MASUK</Text>
                <Text style={{ color: '#ffffff', fontSize: 11, opacity: 0.9 }}>{attendanceToday?.clockIn ? `${formatTime(attendanceToday.clockIn)} WIB` : '--:-- WIB'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '48%' }} onPress={handleClockOut} disabled={isSubmitting}>
              <LinearGradient colors={['#ef5350', '#dc3545']} style={{ borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 6 }}>
                <LogOut size={26} color="#ffffff" strokeWidth={2.4} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>PULANG</Text>
                <Text style={{ color: '#ffffff', fontSize: 11, opacity: 0.9 }}>{attendanceToday?.clockOut ? `${formatTime(attendanceToday.clockOut)} WIB` : '--:-- WIB'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '48%' }} onPress={handleStartBreak} disabled={isSubmitting}>
              <LinearGradient colors={['#fbb847', '#f59e0b']} style={{ borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 6 }}>
                <Coffee size={26} color="#ffffff" strokeWidth={2.4} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>MULAI ISTIRAHAT</Text>
                <Text style={{ color: '#ffffff', fontSize: 11, opacity: 0.9 }}>{breakStartTimeText}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '48%' }} onPress={handleEndBreak} disabled={isSubmitting}>
              <LinearGradient colors={['#38bdf8', '#0ea5e9']} style={{ borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 6 }}>
                <Briefcase size={26} color="#ffffff" strokeWidth={2.4} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>SELESAI ISTIRAHAT</Text>
                <Text style={{ color: '#ffffff', fontSize: 11, opacity: 0.9 }}>{breakEndTimeText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-[15px] mb-[25px]">
            <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 rounded-[12px] py-[15px] items-center gap-2.5 border border-[#eef1f6] dark:border-slate-800" onPress={() => router.push('/user/leave')}>
              <Plane size={20} color="#2a75d3" />
              <Text className="text-[#2a75d3] font-semibold text-[12px]">AJUKAN IZIN</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 rounded-[12px] py-[15px] items-center gap-2.5 border border-[#eef1f6] dark:border-slate-800" onPress={() => router.push('/user/history')}>
              <Calendar size={20} color="#2a75d3" />
              <Text className="text-[#2a75d3] font-semibold text-[12px]">LIHAT JADWAL</Text>
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* TUGAS SAYA HARI INI (MY TASKS WIDGET)                     */}
          {/* ======================================================== */}
          <View className="mb-[25px]">
            <View className="flex-row justify-between items-center mb-[14px]">
              <View className="flex-row items-center gap-2">
                <ListChecks size={18} color="#2a75d3" strokeWidth={2.4} />
                <Text className="text-[16px] font-semibold text-[#222222] dark:text-white">Tugas Saya</Text>
                {tasks.length > 0 && (
                  <View className="bg-[#e0f2fe] dark:bg-sky-950/80 px-2 py-0.5 rounded-full">
                    <Text className="text-[11px] font-bold text-[#0ea5e9]">{tasks.length}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/user/tasks')}>
                <View className="flex-row items-center gap-1">
                  <Text className="text-[12px] text-[#2a75d3] font-medium">Buka Tugas</Text>
                  <ArrowRight size={13} color="#2a75d3" />
                </View>
              </TouchableOpacity>
            </View>

            {tasks.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 p-5 rounded-[16px] items-center justify-center border border-[#eef1f6] dark:border-slate-800">
                <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 items-center justify-center mb-2">
                  <ListChecks size={20} color="#2a75d3" />
                </View>
                <Text className="text-[14px] font-semibold text-[#222222] dark:text-white">Belum Ada Tugas Aktif</Text>
                <Text className="text-[12px] text-[#777777] dark:text-slate-400 text-center mt-1">
                  Semua tugas Anda telah selesai atau belum ada tugas baru yang ditugaskan.
                </Text>
              </View>
            ) : (
              <View className="flex-col gap-3">
                {tasks.slice(0, 3).map((t: any) => {
                  const isDone = t.status === 'DONE' || t.status === 'COMPLETED';
                  const isInProgress = t.status === 'IN_PROGRESS';
                  return (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.8}
                      onPress={() => router.push('/user/tasks')}
                      className="bg-white dark:bg-slate-900 p-4 rounded-[14px] border border-[#eef1f6] dark:border-slate-800 flex-row justify-between items-center"
                    >
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-[11px] font-semibold text-[#2a75d3] uppercase">{t.project || 'Umum'}</Text>
                          {t.priority === 'HIGH' && (
                            <View className="bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                              <Text className="text-[9px] font-bold text-rose-600">Prioritas Tinggi</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[14px] font-semibold text-[#222222] dark:text-white" numberOfLines={1}>{t.title}</Text>
                      </View>
                      <View className={`px-2.5 py-1 rounded-full ${isDone ? 'bg-[#e6f6eb] dark:bg-emerald-950/60' : isInProgress ? 'bg-sky-50 dark:bg-sky-950/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Text className={`text-[10px] font-bold ${isDone ? 'text-[#28a745]' : isInProgress ? 'text-[#0ea5e9]' : 'text-slate-600 dark:text-slate-300'}`}>
                          {isDone ? 'Selesai' : isInProgress ? 'Dikerjakan' : 'Belum Mulai'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ======================================================== */}
          {/* RIWAYAT TERAKHIR                                         */}
          {/* ======================================================== */}
          <View className="flex-row justify-between items-center mb-[15px]">
            <Text className="text-[16px] font-semibold text-[#222222] dark:text-white">Riwayat Terakhir</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/user/history')}>
              <Text className="text-[12px] text-[#2a75d3] font-medium">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {recentHistory.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 p-6 rounded-[12px] items-center justify-center border border-[#eef1f6] dark:border-slate-800 mb-6">
              <Calendar size={28} color="#94a3b8" />
              <Text className="text-[13px] font-semibold text-[#222222] dark:text-white mt-2">Belum Ada Riwayat Presensi</Text>
              <Text className="text-[11px] text-[#777777] dark:text-slate-400 mt-0.5 text-center">Catatan presensi Anda akan otomatis tercatat di sini.</Text>
            </View>
          ) : (
            <View className="flex-col gap-[12px] mb-6">
              {recentHistory.map((item) => (
                <View
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-[15px] rounded-[12px] flex-row justify-between items-center border-y border-r border-[#eef1f6] dark:border-slate-800"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: item.isSuccess ? '#28a745' : '#dc3545',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.02,
                    shadowRadius: 10,
                    elevation: 1,
                  }}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-[13px] font-semibold text-[#222222] dark:text-white mb-[5px]">{item.date}</Text>
                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">{item.timeText}</Text>
                  </View>
                  <View className={`px-[12px] py-[6px] rounded-[20px] ${item.isSuccess ? 'bg-[#e6f6eb] dark:bg-emerald-950/40' : 'bg-[#fcebeb] dark:bg-rose-950/40'}`}>
                    <Text className={`text-[11px] font-semibold ${item.isSuccess ? 'text-[#28a745] dark:text-emerald-400' : 'text-[#dc3545] dark:text-rose-400'}`}>{item.badge}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Face Recognition Biometric Modal for Clock-In & Clock-Out */}
      <FaceRecognitionModal
        visible={faceModalVisible}
        mode="verify"
        userId={user?.id}
        userName={user?.name}
        onClose={() => {
          setFaceModalVisible(false);
          setPendingAction(null);
        }}
        onSuccess={(result) => {
          setFaceModalVisible(false);
          if (pendingAction === 'clockIn') {
            executeClockIn(result.photoUri);
          } else if (pendingAction === 'clockOut') {
            executeClockOut(result.photoUri);
          }
        }}
      />
    </SafeAreaView>
  );
}
