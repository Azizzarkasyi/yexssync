import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
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
import { useGlobalModal } from '@/context/GlobalModalContext';

export default function UserHomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useContext(AuthContext);
  const {
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLocationRadar,
    updateRadarData,
  } = useGlobalModal();

  const locationWatchSubRef = useRef<any>(null);
  const locationIntervalRef = useRef<any>(null);
  const isContinuousSearchingRef = useRef<boolean>(false);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.error('Logout error:', err);
      }
      router.replace('/');
    };

    showConfirm({
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari akun dan aplikasi?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: doLogout,
    });
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

  type AllowedWorkLocation = {
    latitude: number;
    longitude: number;
    radius: number;
    name?: string;
  };

  const [allowedLocations, setAllowedLocations] = useState<AllowedWorkLocation[]>([]);
  const [hasLocationRestriction, setHasLocationRestriction] = useState<boolean>(true);
  const allowedLocationsRef = useRef<AllowedWorkLocation[]>([]);
  const hasRestrictionRef = useRef<boolean>(true);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    inRadius: boolean;
    distanceText: string;
    hasGps: boolean;
    accuracy?: number;
  }>({
    latitude: 0,
    longitude: 0,
    address: 'Mendeteksi lokasi...',
    inRadius: false,
    distanceText: 'Menghubungkan ke GPS...',
    hasGps: false,
    accuracy: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000); // Distance in meters
  };

  const evaluateLocation = (
    latitude: number,
    longitude: number,
    addressName: string,
    locationsToUse: AllowedWorkLocation[],
    hasRestriction: boolean,
    hasGps: boolean = true,
    gpsAccuracy: number = 0,
  ) => {
    if (!hasGps) {
      return {
        latitude,
        longitude,
        address: addressName,
        inRadius: false,
        distanceText: 'Akses GPS tidak tersedia',
        hasGps: false,
        accuracy: 0,
      };
    }

    if (!hasRestriction || locationsToUse.length === 0) {
      return {
        latitude,
        longitude,
        address: addressName,
        inRadius: true,
        distanceText: 'Bebas Lokasi (Tanpa Batas Radius)',
        hasGps: true,
        accuracy: gpsAccuracy,
      };
    }

    let nearestLoc: AllowedWorkLocation = locationsToUse[0];
    let nearestDistance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      nearestLoc.latitude,
      nearestLoc.longitude,
    );

    for (let i = 1; i < locationsToUse.length; i++) {
      const loc = locationsToUse[i];
      const dist = getDistanceFromLatLonInMeters(
        latitude,
        longitude,
        loc.latitude,
        loc.longitude,
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestLoc = loc;
      }
    }

    // Hanya gunakan radius murni kantor tanpa toleransi tambahan
    const inRadius = nearestDistance <= nearestLoc.radius;
    const locName = nearestLoc.name || 'titik kantor';
    const distanceText = `${nearestDistance}m dari ${locName} (Maks ${nearestLoc.radius}m)`;

    return {
      latitude,
      longitude,
      address: addressName,
      inRadius,
      distanceText,
      hasGps: true,
      accuracy: gpsAccuracy,
    };
  };

  useEffect(() => {
    fetchData();
    detectLocation();
    scheduleShiftReminder('08:00');

    return () => {
      stopContinuousLocationSearch();
    };
  }, []);

  const stopContinuousLocationSearch = () => {
    isContinuousSearchingRef.current = false;
    if (locationWatchSubRef.current) {
      try {
        locationWatchSubRef.current.remove();
      } catch {}
      locationWatchSubRef.current = null;
    }
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const startContinuousLocationSearch = async (
    targetAction?: 'clockIn' | 'clockOut',
    manualTrigger: boolean = true
  ) => {
    stopContinuousLocationSearch();
    isContinuousSearchingRef.current = true;
    setIsLocating(true);

    const locs = allowedLocationsRef.current;
    const restriction = hasRestrictionRef.current;

    let targetOfficeName = 'Kantor Perusahaan';
    let targetRadius = 50;
    if (locs.length > 0) {
      targetOfficeName = locs[0].name || 'Kantor Utama';
      targetRadius = locs[0].radius;
    }

    if (manualTrigger || targetAction) {
      showLocationRadar({
        title: targetAction ? 'Mengunci Lokasi Presensi' : 'Mencari Radius Kantor Terdekat',
        message: 'Mohon tunggu sejenak, sistem sedang mencari dan mengunci koordinat GPS terdekat sampai masuk radius absensi.',
        officeName: targetOfficeName,
        maxRadius: targetRadius,
        initialDistance: null,
        onCancel: () => {
          stopContinuousLocationSearch();
          setIsLocating(false);
        },
      });
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        stopContinuousLocationSearch();
        setIsLocating(false);
        hideModal();
        showError('Izin Lokasi Ditolak', 'Harap izinkan akses lokasi (GPS) pada pengaturan browser/perangkat Anda agar dapat melakukan presensi.');
        return;
      }

      let attempts = 0;
      let minDistanceAchieved = Infinity;

      const handleNewCoords = async (coords: { latitude: number; longitude: number; accuracy?: number | null }) => {
        if (!isContinuousSearchingRef.current) return;
        attempts++;

        const { latitude, longitude, accuracy } = coords;
        let addressName = location.address || 'Area Perkantoran';
        if (attempts === 1 || attempts % 4 === 0) {
          try {
            const geoList = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geoList && geoList.length > 0) {
              const g = geoList[0];
              const parts = [g.name, g.street, g.subregion || g.city].filter(Boolean);
              if (parts.length > 0) addressName = parts.join(', ');
            }
          } catch {}
        }

        const evaluated = evaluateLocation(latitude, longitude, addressName, locs, restriction, true, accuracy || 0);
        setLocation(evaluated);

        let currentDist: number | null = null;
        let matchedOffice = targetOfficeName;
        let matchedRadius = targetRadius;

        if (locs.length > 0) {
          let closest = locs[0];
          let closestDist = getDistanceFromLatLonInMeters(latitude, longitude, closest.latitude, closest.longitude);
          for (let i = 1; i < locs.length; i++) {
            const d = getDistanceFromLatLonInMeters(latitude, longitude, locs[i].latitude, locs[i].longitude);
            if (d < closestDist) {
              closestDist = d;
              closest = locs[i];
            }
          }
          currentDist = closestDist;
          matchedOffice = closest.name || 'Kantor Perusahaan';
          matchedRadius = closest.radius;

          if (closestDist < minDistanceAchieved) {
            minDistanceAchieved = closestDist;
          }
        }

        // Update popup radar status real-time
        updateRadarData({
          officeName: matchedOffice,
          currentDistance: currentDist,
          maxRadius: matchedRadius,
          isLocked: evaluated.inRadius,
          accuracy: accuracy || undefined,
          statusText: evaluated.inRadius
            ? '✓ Posisi terkunci dalam radius kantor! Menyiapkan absensi...'
            : `Mencari titik terdekat... Jarak saat ini: ${currentDist ?? '?'}m (Maks ${matchedRadius}m)`,
        });

        // JIKA SUDAH MASUK RADIUS (SUKSES TERKUNCI!)
        if (evaluated.inRadius) {
          stopContinuousLocationSearch();
          setIsLocating(false);

          // Berikan jeda sejenak agar user melihat efek visual sukses di popup
          setTimeout(() => {
            hideModal();

            if (targetAction === 'clockIn') {
              if (APP_ENV.BIOMETRICS.ENABLE_FACE_RECOGNITION) {
                setPendingAction('clockIn');
                setFaceModalVisible(true);
              } else {
                executeClockIn();
              }
            } else if (targetAction === 'clockOut') {
              if (APP_ENV.BIOMETRICS.ENABLE_FACE_RECOGNITION) {
                setPendingAction('clockOut');
                setFaceModalVisible(true);
              } else {
                executeClockOut();
              }
            } else if (manualTrigger) {
              showSuccess(
                'Lokasi Berhasil Terkunci!',
                `Posisi Anda berada ${currentDist ?? 0}m dari ${matchedOffice}. Anda telah berada di dalam radius absensi.`
              );
            }
          }, 700);
        }
      };

      // 1. Ambil posisi awal segera
      try {
        const quickPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await handleNewCoords(quickPos.coords);
      } catch {
        const balPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await handleNewCoords(balPos.coords);
      }

      // 2. Pasang watchPositionAsync untuk mendengarkan perubahan koordinat GPS secara real-time
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 1,
            timeInterval: 1000,
          },
          (locResult) => {
            handleNewCoords(locResult.coords);
          }
        );
        locationWatchSubRef.current = sub;
      } catch (e) {
        console.warn('watchPositionAsync fallback:', e);
      }

      // 3. Fallback active polling berulang tiap 1.4 detik untuk menjamin update terus-menerus
      locationIntervalRef.current = setInterval(async () => {
        if (!isContinuousSearchingRef.current) return;
        try {
          const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          await handleNewCoords(fresh.coords);
        } catch {}
      }, 1400);

      // 4. Timeout 35 detik jika sinyal GPS benar-benar tidak mencapai radius kantor
      setTimeout(() => {
        if (isContinuousSearchingRef.current) {
          stopContinuousLocationSearch();
          setIsLocating(false);
          hideModal();

          const distNote = minDistanceAchieved < Infinity ? `\n\nJarak terdekat yang terdeteksi: ${minDistanceAchieved} meter (Maks ${targetRadius}m).` : '';
          showWarning(
            'Di Luar Radius Kantor',
            `Sistem telah memindai sinyal GPS terdekat, namun posisi Anda masih berada di luar jangkauan absensi.${distNote}\n\nPastikan Anda sudah berada di lokasi kerja sebelum melakukan presensi.`
          );
        }
      }, 35000);
    } catch (err) {
      console.warn('GPS continuous search error:', err);
      stopContinuousLocationSearch();
      setIsLocating(false);
      hideModal();
      showError('Gagal Mendeteksi GPS', 'Pastikan GPS dan izin lokasi aktif pada perangkat Anda.');
    }
  };

  const detectLocation = async (customAllowedLocs?: AllowedWorkLocation[]) => {
    setIsLocating(true);
    const locs = customAllowedLocs || allowedLocationsRef.current;
    const restriction = hasRestrictionRef.current;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({
          latitude: 0,
          longitude: 0,
          address: 'Izin lokasi (GPS) ditolak',
          inRadius: false,
          distanceText: 'Harap aktifkan izin lokasi di pengaturan',
          hasGps: false,
          accuracy: 0,
        });
        return;
      }

      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude, accuracy } = loc.coords;

      let addressName = 'Area Perkantoran';
      try {
        const geoList = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geoList && geoList.length > 0) {
          const g = geoList[0];
          const parts = [g.name, g.street, g.subregion || g.city].filter(Boolean);
          if (parts.length > 0) addressName = parts.join(', ');
        }
      } catch (e) {
        addressName = `Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      }

      const evaluated = evaluateLocation(latitude, longitude, addressName, locs, restriction, true, accuracy || 0);
      setLocation(evaluated);
    } catch (err) {
      console.warn('GPS detection error:', err);
      setLocation({
        latitude: 0,
        longitude: 0,
        address: 'Gagal mendeteksi sinyal GPS',
        inRadius: false,
        distanceText: 'Pastikan GPS perangkat Anda aktif',
        hasGps: false,
        accuracy: 0,
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
      if (todayRes.data?.workLocations) {
        const locs: AllowedWorkLocation[] = todayRes.data.workLocations.allowedLocations || [];
        const restriction: boolean = todayRes.data.workLocations.hasLocationRestriction ?? (locs.length > 0);
        setAllowedLocations(locs);
        allowedLocationsRef.current = locs;
        setHasLocationRestriction(restriction);
        hasRestrictionRef.current = restriction;

        // Re-evaluate if we already got GPS coordinates
        setLocation(prev => {
          if (prev.hasGps && prev.latitude !== 0 && prev.longitude !== 0) {
            return evaluateLocation(prev.latitude, prev.longitude, prev.address, locs, restriction, true);
          }
          return prev;
        });
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
      showInfo(
        'Sudah Presensi Masuk',
        `Anda sudah melakukan presensi masuk hari ini pada pukul ${formatTime(attendanceToday.clockIn)} WIB.`
      );
      return;
    }

    // Jika ada batasan lokasi dan belum berada dalam radius kantor terdekat
    if (hasLocationRestriction && allowedLocations.length > 0 && (!location.hasGps || !location.inRadius)) {
      // Otomatis mencari radius terdekat terus sampai dapat!
      startContinuousLocationSearch('clockIn');
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
        latitude: location.hasGps ? location.latitude : null,
        longitude: location.hasGps ? location.longitude : null,
        accuracy: location.hasGps ? location.accuracy : null,
        ...(photoUri ? { photo: photoUri } : {}),
      });
      if (res.data?.success) {
        const timeNow = formatTime(new Date().toISOString());
        notifyClockInSuccess(timeNow, location.address);
        showSuccess(
          'Presensi Masuk Berhasil!',
          `Presensi masuk Anda telah tercatat pada pukul ${timeNow} WIB di ${location.address || 'lokasi kantor'}. Selamat bekerja!`
        );
        fetchData();
      } else {
        showWarning('Perhatian', res.data?.message || 'Gagal melakukan presensi masuk.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal melakukan presensi masuk. Silakan coba kembali.';
      showError('Gagal Presensi Masuk', msg);
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleClockOut = async () => {
    if (!attendanceToday?.clockIn) {
      showWarning('Belum Presensi Masuk', 'Anda harus melakukan presensi masuk terlebih dahulu sebelum presensi pulang.');
      return;
    }
    if (attendanceToday?.clockOut) {
      showInfo(
        'Sudah Presensi Pulang',
        `Anda sudah melakukan presensi pulang hari ini pada pukul ${formatTime(attendanceToday.clockOut)} WIB.`
      );
      return;
    }

    // Jika ada batasan lokasi dan belum berada dalam radius kantor terdekat
    if (hasLocationRestriction && allowedLocations.length > 0 && (!location.hasGps || !location.inRadius)) {
      // Otomatis mencari radius terdekat terus sampai dapat!
      startContinuousLocationSearch('clockOut');
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
        latitude: location.hasGps ? location.latitude : null,
        longitude: location.hasGps ? location.longitude : null,
        accuracy: location.hasGps ? location.accuracy : null,
        ...(photoUri ? { photo: photoUri } : {}),
      });
      if (res.data?.success) {
        const timeNow = formatTime(new Date().toISOString());
        notifyClockOutSuccess(timeNow);
        showSuccess(
          'Presensi Pulang Berhasil!',
          `Presensi pulang Anda telah dicatat pada pukul ${timeNow} WIB. Terima kasih atas dedikasi dan kerja keras Anda hari ini!`
        );
        fetchData();
      } else {
        showWarning('Perhatian', res.data?.message || 'Gagal melakukan presensi pulang.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal melakukan presensi pulang. Silakan coba kembali.';
      showError('Gagal Presensi Pulang', msg);
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleStartBreak = async () => {
    if (!attendanceToday?.clockIn) {
      showWarning('Perhatian', 'Anda harus melakukan presensi masuk terlebih dahulu sebelum istirahat.');
      return;
    }
    if (attendanceToday?.clockOut) {
      showWarning('Perhatian', 'Anda sudah melakukan presensi pulang hari ini.');
      return;
    }
    if (breakData?.activeBreak) {
      showInfo('Sesi Istirahat Aktif', 'Sesi istirahat Anda saat ini sedang berlangsung.');
      return;
    }

    showConfirm({
      title: 'Mulai Istirahat',
      message: 'Apakah Anda yakin ingin memulai sesi istirahat sekarang?',
      confirmText: 'Ya, Mulai',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          setIsSubmitting(true);
          const res = await api.post('/breaks/start', { faceVerified: true });
          if (res.data?.success) {
            showSuccess('Waktu Istirahat Dimulai', 'Sesi istirahat Anda telah aktif. Manfaatkan waktu istirahat Anda dengan baik.');
            fetchData();
          } else {
            showWarning('Info', res.data?.message || 'Gagal memulai istirahat.');
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Gagal memulai istirahat.';
          showError('Mulai Istirahat', msg);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleEndBreak = async () => {
    if (!breakData?.activeBreak) {
      showWarning('Perhatian', 'Tidak ada sesi istirahat yang sedang berjalan.');
      return;
    }

    showConfirm({
      title: 'Selesai Istirahat',
      message: 'Apakah Anda ingin menyelesaikan sesi istirahat sekarang dan kembali bekerja?',
      confirmText: 'Ya, Selesai',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          setIsSubmitting(true);
          const res = await api.post('/breaks/end', { faceVerified: true });
          if (res.data?.success) {
            showSuccess('Sesi Istirahat Selesai', 'Anda telah kembali aktif bekerja. Selamat melanjutkan tugas Anda!');
            fetchData();
          } else {
            showWarning('Info', res.data?.message || 'Gagal menyelesaikan istirahat.');
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Gagal menyelesaikan istirahat.';
          showError('Selesai Istirahat', msg);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
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
            <TouchableOpacity activeOpacity={0.7} onPress={() => showInfo('Notifikasi', 'Tidak ada notifikasi baru untuk Anda saat ini.')}>
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
              {/* Dynamic Status Badge */}
              <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isLocating
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/40'
                  : !location.hasGps
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40'
                  : !hasLocationRestriction || allowedLocations.length === 0
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/50 dark:border-sky-800/40'
                  : location.inRadius
                  ? 'bg-[#e6f6eb] dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/40'
              }`}>
                <View className={`w-2 h-2 rounded-full ${
                  isLocating
                    ? 'bg-blue-500'
                    : !location.hasGps
                    ? 'bg-amber-500'
                    : !hasLocationRestriction || allowedLocations.length === 0
                    ? 'bg-sky-500'
                    : location.inRadius
                    ? 'bg-[#28a745]'
                    : 'bg-rose-500'
                }`} />
                <Text className={`text-[11px] font-semibold ${
                  isLocating
                    ? 'text-blue-600 dark:text-blue-400'
                    : !location.hasGps
                    ? 'text-amber-600 dark:text-amber-400'
                    : !hasLocationRestriction || allowedLocations.length === 0
                    ? 'text-sky-600 dark:text-sky-400'
                    : location.inRadius
                    ? 'text-[#28a745] dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isLocating
                    ? 'Mencari GPS...'
                    : !location.hasGps
                    ? 'GPS Belum Aktif'
                    : !hasLocationRestriction || allowedLocations.length === 0
                    ? 'Bebas Lokasi'
                    : location.inRadius
                    ? 'Dalam Jangkauan'
                    : 'Di Luar Radius'}
                </Text>
              </View>
            </View>

            {/* Radar / Pin Map Visual */}
            <View className={`h-[95px] w-full rounded-[12px] overflow-hidden relative my-2 border justify-center items-center ${
              !location.hasGps
                ? 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60'
                : !hasLocationRestriction || allowedLocations.length === 0
                ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/40'
                : location.inRadius
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
            }`}>
              {/* Radar Grid Lines */}
              <View className="absolute inset-0 opacity-20">
                <View className="absolute top-1/2 left-0 right-0 h-[6px] bg-slate-400 -translate-y-1" />
                <View className="absolute left-1/3 top-0 bottom-0 w-[6px] bg-slate-400" />
                <View className="absolute left-2/3 top-0 bottom-0 w-[6px] bg-slate-400" />
              </View>

              {/* Concentric Circles */}
              <View className={`w-20 h-20 rounded-full border items-center justify-center ${
                !location.hasGps
                  ? 'border-slate-300/40 bg-slate-400/10'
                  : !hasLocationRestriction || allowedLocations.length === 0
                  ? 'border-sky-400/30 bg-sky-500/10'
                  : location.inRadius
                  ? 'border-emerald-400/30 bg-emerald-500/10'
                  : 'border-rose-400/30 bg-rose-500/10'
              }`}>
                <View className={`w-12 h-12 rounded-full border items-center justify-center ${
                  !location.hasGps
                    ? 'border-slate-400/40 bg-slate-400/20'
                    : !hasLocationRestriction || allowedLocations.length === 0
                    ? 'border-sky-500/40 bg-sky-500/20'
                    : location.inRadius
                    ? 'border-emerald-500/40 bg-emerald-500/20'
                    : 'border-rose-500/40 bg-rose-500/20'
                }`}>
                  <View className={`w-7 h-7 rounded-full items-center justify-center shadow-lg ${
                    !location.hasGps
                      ? 'bg-slate-500 shadow-slate-500/50'
                      : !hasLocationRestriction || allowedLocations.length === 0
                      ? 'bg-sky-600 shadow-sky-500/50'
                      : location.inRadius
                      ? 'bg-[#28a745] shadow-emerald-500/50'
                      : 'bg-rose-600 shadow-rose-500/50'
                  }`}>
                    <Navigation size={13} color="#ffffff" strokeWidth={2.5} />
                  </View>
                </View>
              </View>

              {/* Distance Pill Overlay */}
              <View className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                <Text className={`text-[10px] font-bold ${
                  !location.hasGps
                    ? 'text-slate-600 dark:text-slate-400'
                    : !hasLocationRestriction || allowedLocations.length === 0
                    ? 'text-sky-600 dark:text-sky-400'
                    : location.inRadius
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isLocating ? 'Memindai...' : location.distanceText}
                </Text>
              </View>
            </View>

            {/* Address & Refresh Controls */}
            <View className="flex-row justify-between items-center pt-2">
              <View className="flex-1 pr-3">
                <Text className="text-[13px] font-semibold text-[#222222] dark:text-white" numberOfLines={1}>{location.address}</Text>
                <Text className="text-[11px] text-[#777777] dark:text-slate-400 mt-0.5">
                  {location.hasGps && location.latitude !== 0
                    ? `Lat: ${location.latitude.toFixed(5)}, Long: ${location.longitude.toFixed(5)}`
                    : 'Koordinat GPS belum didapatkan'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => startContinuousLocationSearch(undefined, true)}
                disabled={isLocating}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#2a75d3" />
                ) : (
                  <RotateCw size={15} color="#2a75d3" />
                )}
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
