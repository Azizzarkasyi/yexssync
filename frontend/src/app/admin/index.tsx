import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  UserCheck,
  Clock,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Sun,
  Moon,
  X,
  Menu,
  LogOut,
  AlertCircle,
  Shield,
  Briefcase,
  CreditCard,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import UserAvatar from '@/components/UserAvatar';
import TenantPaymentModal from '@/components/TenantPaymentModal';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { logout, user } = useContext(AuthContext);

  // Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification Modal State
  const [showNotifications, setShowNotifications] = useState(false);

  // Billing and Payment Modal State
  const [billingInfo, setBillingInfo] = useState<{
    hasUnpaidBilling: boolean;
    billing: any;
    subscriptionStatus: any;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Stats State initialized cleanly (populated from real API)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    late: 0,
    leave: 0,
    recentAttendances: [] as any[],
    recentLeaves: [] as any[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const res = await api.get('/config/billing');
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setBillingInfo(data);
        const sub = data.subscriptionStatus;
        // Otomatis munculkan popup notifikasi jika ada tagihan tertunggak (terutama jika masuk masa tenggat atau terblokir)
        if (data.hasUnpaidBilling && (sub?.isInGracePeriod || sub?.isBlocked)) {
          setShowPaymentModal(true);
        }
      }
    } catch {
      // Quiet fallback
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/attendance/stats/today');
      if (response.data?.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      // Quiet fallback without triggering RedBox console.error overlay
      console.warn('Dashboard stats fallback applied (API offline or token pending)');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
    fetchBillingStatus();
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '--:--';
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Hari ini';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch {
      return String(dateStr);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return {
          bg: theme.successBg,
          text: theme.success,
          label: 'Hadir',
        };
      case 'LATE':
        return {
          bg: theme.dangerBg,
          text: theme.danger,
          label: 'Terlambat',
        };
      case 'SICK':
        return {
          bg: theme.warningBg,
          text: theme.warningText,
          label: 'Sakit',
        };
      case 'LEAVE':
        return {
          bg: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe',
          text: theme.primaryBlue,
          label: 'Cuti',
        };
      default:
        return {
          bg: theme.subtleBg,
          text: theme.textMuted,
          label: status || 'Belum',
        };
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* Shared Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin"
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
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          {/* Standardized Global Admin Header */}
          <AdminTopHeader
            title="Dashboard Admin"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            rightAction={
              <TouchableOpacity
                onPress={handleRefresh}
                title="Muat Ulang Data"
                style={{
                  padding: 9,
                  borderRadius: 8,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw
                  size={16}
                  color={theme.primaryBlue}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              </TouchableOpacity>
            }
          />

          {/* ======================================================== */}
          {/* BANNER NOTIFIKASI TAGIHAN & PEMBAYARAN KANTOR            */}
          {/* ======================================================== */}
          {billingInfo?.hasUnpaidBilling && (
            <View
              style={{
                backgroundColor: billingInfo.subscriptionStatus?.isBlocked
                  ? (theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                  : billingInfo.subscriptionStatus?.isInGracePeriod
                  ? (theme.isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb')
                  : (theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff'),
                borderWidth: 1,
                borderColor: billingInfo.subscriptionStatus?.isBlocked
                  ? (theme.isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca')
                  : billingInfo.subscriptionStatus?.isInGracePeriod
                  ? (theme.isDark ? 'rgba(245, 158, 11, 0.4)' : '#fef3c7')
                  : (theme.isDark ? 'rgba(59, 130, 246, 0.4)' : '#e0f2fe'),
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                flexDirection: isDesktop ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: isDesktop ? 'center' : 'flex-start',
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: billingInfo.subscriptionStatus?.isBlocked
                      ? (theme.isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2')
                      : billingInfo.subscriptionStatus?.isInGracePeriod
                      ? (theme.isDark ? 'rgba(245, 158, 11, 0.25)' : '#fef3c7')
                      : (theme.isDark ? 'rgba(59, 130, 246, 0.25)' : '#e0f2fe'),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {billingInfo.subscriptionStatus?.isBlocked ? (
                    <ShieldAlert size={24} color={theme.isDark ? '#f87171' : '#dc2626'} />
                  ) : billingInfo.subscriptionStatus?.isInGracePeriod ? (
                    <Clock size={24} color={theme.isDark ? '#fbbf24' : '#d97706'} />
                  ) : (
                    <CreditCard size={24} color={theme.primaryBlue} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: billingInfo.subscriptionStatus?.isBlocked
                        ? (theme.isDark ? '#fca5a5' : '#991b1b')
                        : billingInfo.subscriptionStatus?.isInGracePeriod
                        ? (theme.isDark ? '#fcd34d' : '#92400e')
                        : (theme.isDark ? '#93c5fd' : '#0369a1'),
                    }}
                  >
                    {billingInfo.subscriptionStatus?.isBlocked
                      ? 'Layanan Presensi Karyawan Ditangguhkan!'
                      : billingInfo.subscriptionStatus?.isInGracePeriod
                      ? `Peringatan Masa Tenggat: Sisa ${billingInfo.subscriptionStatus?.daysLeftInGrace ?? 0} Hari Lagi!`
                      : `Tagihan Langganan Bulan ${billingInfo.billing?.month}/${billingInfo.billing?.year} Tersedia`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: billingInfo.subscriptionStatus?.isBlocked
                        ? (theme.isDark ? '#f87171' : '#b91c1c')
                        : billingInfo.subscriptionStatus?.isInGracePeriod
                        ? (theme.isDark ? '#fbbf24' : '#b45309')
                        : (theme.isDark ? '#60a5fa' : '#0284c7'),
                      marginTop: 2,
                      lineHeight: 17,
                    }}
                  >
                    {billingInfo.subscriptionStatus?.isBlocked
                      ? 'Tagihan telah melewati batas masa tenggat pembayaran. Seluruh karyawan kantor saat ini tidak dapat melakukan presensi. Segera lakukan pembayaran dan upload bukti transfer.'
                      : billingInfo.subscriptionStatus?.isInGracePeriod
                      ? `Tagihan telah jatuh tempo. Lakukan pembayaran sebesar Rp ${(billingInfo.billing?.amount || 0).toLocaleString('id-ID')} sebelum masa tenggat habis agar absensi tidak terblokir.`
                      : `Total tagihan Rp ${(billingInfo.billing?.amount || 0).toLocaleString('id-ID')} untuk ${billingInfo.billing?.userCount || 0} karyawan aktif. Silakan lakukan transfer dan upload bukti bayar.`}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => setShowPaymentModal(true)}
                  style={{
                    backgroundColor: billingInfo.subscriptionStatus?.isBlocked
                      ? '#dc2626'
                      : billingInfo.subscriptionStatus?.isInGracePeriod
                      ? '#d97706'
                      : theme.primaryBlue,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UploadCloud size={15} color="#ffffff" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>
                    {billingInfo.billing?.paymentProof ? 'Lihat / Ganti Bukti Transfer' : 'Bayar Sekarang & Upload Bukti'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/admin/billing' as any)}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                    Rincian Tagihan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SUMMARY CARDS (4 METRICS)                                */}
          {/* ======================================================== */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 18,
              marginBottom: 24,
            }}
          >
            {/* Card 1: Total Pegawai */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/admin/users')}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
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
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.cardIconBlueBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Users size={22} color={theme.primaryBlue} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
                  Total Pegawai
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {stats.totalEmployees}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Hadir Hari Ini */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/admin/attendance')}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
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
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.successBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <UserCheck size={22} color={theme.success} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
                  Hadir Hari Ini
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {stats.present}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: Terlambat */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/admin/attendance')}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
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
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.dangerBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Clock size={22} color={theme.danger} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
                  Terlambat
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {stats.late}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 4: Izin / Cuti */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/admin/approvals')}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
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
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.warningBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Mail size={22} color={theme.warningText} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
                  Izin / Cuti
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {stats.leave}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* MIDDLE PANELS: ATTENDANCE & LEAVE REQUESTS               */}
          {/* ======================================================== */}
          <View
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              gap: 20,
              alignItems: 'flex-start',
            }}
          >
            {/* Left Panel: Daftar Presensi Hari Ini */}
            <View
              style={{
                flex: 1.6,
                width: '100%',
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 20,
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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                  Daftar Presensi Hari Ini
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/attendance')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primaryBlue }}>
                    Lihat Semua
                  </Text>
                  <ArrowUpRight size={14} color={theme.primaryBlue} />
                </TouchableOpacity>
              </View>

              {/* Table Header */}
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: theme.subtleBg,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ flex: 2, fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
                  Pegawai
                </Text>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
                  Masuk
                </Text>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
                  Pulang
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.textMuted,
                    textAlign: 'center',
                  }}
                >
                  Status
                </Text>
              </View>

              {/* Attendance Rows */}
              {stats.recentAttendances.length === 0 ? (
                <View style={{ paddingVertical: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={32} color={theme.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginTop: 8 }}>
                    Belum Ada Presensi Hari Ini
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Data presensi pegawai yang masuk hari ini akan tampil di sini.
                  </Text>
                </View>
              ) : (
                stats.recentAttendances.map((item: any, idx: number) => {
                const badge = getStatusBadge(item.status);
                return (
                  <View
                    key={item.id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderBottomWidth: idx === stats.recentAttendances.length - 1 ? 0 : 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <UserAvatar
                        name={item.user?.name}
                        photo={item.user?.photo}
                        size={34}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}
                          numberOfLines={1}
                        >
                          {item.user?.name || 'Pegawai'}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }} numberOfLines={1}>
                          {item.user?.department || 'Umum'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ flex: 1, fontSize: 13, color: theme.textDark, fontWeight: '500' }}>
                      {formatTime(item.clockIn)}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: theme.textDark, fontWeight: '500' }}>
                      {formatTime(item.clockOut)}
                    </Text>

                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View
                        style={{
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                          backgroundColor: badge.bg,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: badge.text }}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }))}
            </View>

            {/* Right Panel: Permohonan Izin / Cuti */}
            <View
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 20,
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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                  Permohonan Izin / Cuti
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/approvals')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primaryBlue }}>
                    Review
                  </Text>
                  <ArrowUpRight size={14} color={theme.primaryBlue} />
                </TouchableOpacity>
              </View>

              {stats.recentLeaves.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Mail size={32} color={theme.textMuted} />
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
                    Tidak ada pengajuan cuti baru.
                  </Text>
                </View>
              ) : (
                stats.recentLeaves.map((leave: any, idx: number) => {
                  const isApproved = leave.leaveApprovalStatus === 'APPROVED';
                  const isPending = leave.leaveApprovalStatus === 'PENDING';
                  return (
                    <View
                      key={leave.id || idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: theme.subtleBg,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textDark }}>
                          {leave.user?.name}
                        </Text>
                        <View
                          style={{
                            paddingVertical: 2,
                            paddingHorizontal: 8,
                            borderRadius: 10,
                            backgroundColor: isApproved
                              ? theme.successBg
                              : isPending
                              ? theme.warningBg
                              : theme.dangerBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '600',
                              color: isApproved
                                ? theme.success
                                : isPending
                                ? theme.warningText
                                : theme.danger,
                            }}
                          >
                            {isApproved ? 'Disetujui' : isPending ? 'Menunggu' : 'Ditolak'}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>
                        Departemen: {leave.user?.department} • Tanggal: {formatDate(leave.date)}
                      </Text>
                    </View>
                  );
                })
              )}

              {/* Quick Link to Users */}
              <TouchableOpacity
                onPress={() => router.push('/admin/add-employee')}
                style={{
                  marginTop: 10,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: theme.primaryBlue,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Users size={16} color="#ffffff" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                  Tambah Pegawai Baru
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal Popup Pembayaran & Upload Bukti Tagihan */}
      <TenantPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentUploaded={fetchBillingStatus}
      />
    </View>
  );
}
