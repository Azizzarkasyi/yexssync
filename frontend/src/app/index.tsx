import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Users,
  CreditCard,
  Sparkles,
  Clock,
  ArrowRight,
  Smartphone,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Building2,
  Lock,
  Camera,
  Laptop,
  Check,
  ExternalLink,
  HelpCircle,
  Send,
  Star,
  Award,
  Zap,
  BarChart3,
  Download,
  Sun,
  Moon,
  LogIn,
  AlertCircle,
  Calendar,
  Layers,
  HeartHandshake,
  Mail,
  Phone,
  Calculator,
  Minus,
  Plus,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YexsLogo } from '@/components/YexsLogo';
import api from '@/lib/api';
import { calculateSubscriptionPrice, formatRupiah } from '@/lib/pricing';

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();

  // Responsive Breakpoints
  const isDesktop = width >= 1024;
  const isTablet = width >= 640 && width < 1024;
  const isMobile = width < 640;
  const isSmallMobile = width < 380;

  // Responsive Layout Values
  const horizontalPadding = isDesktop ? 48 : isTablet ? 32 : isSmallMobile ? 14 : 20;
  const sectionVerticalPadding = isDesktop ? 80 : isTablet ? 60 : 44;

  const { user } = useContext(AuthContext);

  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [simUserCount, setSimUserCount] = useState<number>(20);

  // Demo Registration Modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoCompanyName, setDemoCompanyName] = useState('');
  const [demoAdminName, setDemoAdminName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoUserCount, setDemoUserCount] = useState('25');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoError, setDemoError] = useState('');

  // Live Clock Demo on Hero Mockup
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    router.push(`/#${id}` as any);
  };

  const handleDemoSubmit = async () => {
    if (!demoCompanyName.trim() || !demoAdminName.trim() || !demoEmail.trim() || !demoPhone.trim()) {
      setDemoError('Harap lengkapi semua data pendaftaran demo.');
      return;
    }
    setDemoSubmitting(true);
    setDemoError('');
    try {
      // Direct registration or inquiry ping to backend
      await api.post('/auth/register-interest', {
        companyName: demoCompanyName,
        adminName: demoAdminName,
        email: demoEmail,
        phone: demoPhone,
        userCount: demoUserCount,
      }).catch(() => null);

      setDemoSuccess(true);
    } catch {
      setDemoSuccess(true);
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      'Halo Tim YexsSync, saya tertarik untuk mencoba demo dan berlangganan sistem presensi YexsSync untuk perusahaan saya.'
    );
    const url = `https://wa.me/6287898555764?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleOpenEmail = () => {
    const url = 'mailto:yexsdev@gmail.com?subject=Tanya%20Layanan%20YexsSync';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const features = [
    {
      icon: MapPin,
      color: '#3b82f6',
      title: 'Geofencing Radius GPS Presisi',
      desc: 'Karyawan hanya dapat melakukan absensi jika berada tepat di dalam radius kantor atau area penugasan resmi. Dukungan multi-cabang tanpa batas.',
    },
    {
      icon: Camera,
      color: '#06b6d4',
      title: 'Verifikasi Wajah Biometrik Ringan',
      desc: 'Validasi foto selfie dan liveness wajah diproses cepat di perangkat karyawan untuk mencegah titip absen tanpa membebani server backend.',
    },
    {
      icon: Shield,
      color: '#dc2626',
      title: 'Anti Fake GPS & Mock Location',
      desc: 'Sensor cerdas mendeteksi penggunaan aplikasi Fake GPS, Mock Provider, root perangkat, dan manipulasi jam sistem secara instan.',
    },
    {
      icon: CreditCard,
      color: '#10b981',
      title: 'Smart Payroll & Slip Gaji PDF',
      desc: 'Hitung otomatis gaji pokok, potongan keterlambatan, tunjangan makan, dan lembur per menit. Ekspor slip gaji digital berstandar resmi.',
    },
    {
      icon: Calendar,
      color: '#f59e0b',
      title: 'Pengajuan Cuti, Izin & Lembur',
      desc: 'Karyawan mengajukan cuti dan lampiran surat dokter langsung dari HP. Admin dapat menyetujui atau menolak permohonan dalam hitungan detik.',
    },
    {
      icon: Building2,
      color: '#8b5cf6',
      title: 'Arsitektur Multi-Tenant SaaS Aman',
      desc: 'Data setiap perusahaan terenkripsi dan terisolasi mandiri. Hak akses berjenjang (SuperAdmin, Admin Kantor, Pegawai) untuk privasi maksimal.',
    },
  ];

  const faqs = [
    {
      q: 'Apakah karyawan bisa memanipulasi absensi dengan Fake GPS / Mock Location?',
      a: 'Tidak bisa. YexsSync memiliki proteksi berlapis yang mendeteksi penggunaan aplikasi Fake GPS, Mock Provider, dan emulator perangkat. Jika terdeteksi manipulasi GPS, presensi akan langsung ditolak otomatis.',
    },
    {
      q: 'Bagaimana jika perusahaan kami memiliki banyak kantor cabang atau area proyek?',
      a: 'YexsSync mendukung konfigurasi multi-lokasi tanpa batas. Admin dapat menentukan titik koordinat GPS dan radius toleransi yang berbeda untuk setiap kantor cabang, pabrik, atau bahkan lokasi khusus per masing-masing karyawan lapangan.',
    },
    {
      q: 'Bagaimana cara kerja verifikasi wajah di aplikasi YexsSync?',
      a: 'Saat melakukan absensi, karyawan mengambil foto selfie langsung melalui kamera aplikasi. Pemrosesan awal validasi wajah dilakukan secara efisien langsung di smartphone (on-device) sehingga tidak membebani server dan proses absensi tuntas dalam hitungan 1-2 detik.',
    },
    {
      q: 'Apakah sistem penggajian (Payroll) otomatis menghitung denda keterlambatan?',
      a: 'Ya! Sistem menghitung jam kerja aktual, akumulasi menit keterlambatan, lembur, dan izin/cuti secara presisi. Nominal potongan keterlambatan dan tunjangan lembur akan otomatis diakumulasikan ke slip gaji digital bulanan dalam format PDF resmi.',
    },
    {
      q: 'Apakah data setiap perusahaan terisolasi dengan aman?',
      a: 'Ya, YexsSync dirancang dengan arsitektur Multi-Tenant modern. Setiap perusahaan memiliki database/skema terisolasi secara ketat sehingga data karyawan, riwayat absensi, dan data keuangan perusahaan Anda 100% aman dan tidak tercampur dengan perusahaan lain.',
    },
    {
      q: 'Bagaimana jika masa tenggat tagihan langganan telah berakhir?',
      a: 'SuperAdmin dapat mengatur masa tenggat (grace period) toleransi pembayaran. Jika melewati batas toleransi, sistem akan menonaktifkan presensi secara aman dan memberikan petunjuk kepada admin perusahaan untuk mengunggah bukti transfer resmi agar layanan langsung aktif kembali.',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgColor }}>
      {/* ======================================================== */}
      {/* 1. TOP ANNOUNCEMENT / LOGGED IN BANNER                  */}
      {/* ======================================================== */}
      {user ? (
        <View
          style={{
            backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe',
            paddingVertical: 10,
            paddingHorizontal: horizontalPadding,
            flexDirection: isSmallMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.isDark ? '#2563eb' : '#bfdbfe',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Sparkles size={16} color={theme.isDark ? '#93c5fd' : '#1d4ed8'} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.isDark ? '#eff6ff' : '#1e40af', textAlign: 'center' }}>
              Anda sedang masuk sebagai <Text style={{ fontWeight: '800' }}>{user.name}</Text> ({user.role})
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (user.role === 'SUPER_ADMIN') router.push('/superadmin');
              else if (user.role === 'ADMIN') router.push('/admin');
              else router.push('/user');
            }}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: theme.primaryBlue,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
              Buka Dashboard →
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: theme.isDark ? '#0f172a' : '#08142c',
            paddingVertical: 8,
            paddingHorizontal: horizontalPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <View style={{ backgroundColor: '#22c55e', width: 8, height: 8, borderRadius: 4 }} />
          <Text style={{ fontSize: 12, color: '#e2e8f0', fontWeight: '500', textAlign: 'center', lineHeight: 18 }}>
            🎉 <Text style={{ fontWeight: '700', color: '#38bdf8' }}>Versi 2.0 Resmi Dirilis:</Text> Geofencing Akurat & Verifikasi Wajah Biometrik On-Device!
          </Text>
        </View>
      )}

      {/* ======================================================== */}
      {/* 2. STICKY NAVBAR                                         */}
      {/* ======================================================== */}
      <View
        style={{
          backgroundColor: theme.cardBg,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor,
          paddingVertical: 14,
          paddingHorizontal: horizontalPadding,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.3 : 0.05,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Brand Logo */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}
        >
          <YexsLogo size={isSmallMobile ? 30 : 36} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontSize: isSmallMobile ? 17 : 19, fontWeight: '900', color: theme.textDark, letterSpacing: -0.5 }}>
              Yexs<Text style={{ color: theme.primaryBlue }}>Sync</Text>
            </Text>
            {!isSmallMobile && (
              <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '600', letterSpacing: 0.5, marginTop: -2 }}>
                HRMS & SMART PRESENSI
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Desktop Navigation Links */}
        {isDesktop && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
            <TouchableOpacity onPress={() => scrollToSection('fitur')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>Fitur Utama</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('keunggulan')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>Keunggulan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('harga')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>Paket Harga</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('faq')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>FAQ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>Kebijakan Privasi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Right Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            onPress={theme.toggleTheme}
            style={{
              padding: isSmallMobile ? 6 : 8,
              borderRadius: 8,
              backgroundColor: theme.subtleBg,
              borderWidth: 1,
              borderColor: theme.borderColor,
            }}
            accessibilityLabel="Ganti Tema"
          >
            {theme.isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#64748b" />}
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={{
              paddingVertical: isSmallMobile ? 7 : 8,
              paddingHorizontal: isSmallMobile ? 10 : 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.borderColor,
              backgroundColor: theme.cardBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogIn size={14} color={theme.primaryBlue} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textDark }}>
              {user ? 'Akun' : 'Masuk'}
            </Text>
          </TouchableOpacity>

          {/* Primary CTA Button (Desktop only) */}
          {isDesktop && (
            <TouchableOpacity
              onPress={() => setShowDemoModal(true)}
              style={{
                backgroundColor: theme.primaryBlue,
                paddingVertical: 9,
                paddingHorizontal: 18,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                shadowColor: theme.primaryBlue,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Sparkles size={15} color="#ffffff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>
                Coba Gratis Sekarang
              </Text>
            </TouchableOpacity>
          )}

          {/* Mobile Menu Hamburger */}
          {!isDesktop && (
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ padding: isSmallMobile ? 6 : 8, borderRadius: 8, backgroundColor: theme.subtleBg }}
              accessibilityLabel="Buka Menu"
            >
              {mobileMenuOpen ? <X size={20} color={theme.textDark} /> : <Menu size={20} color={theme.textDark} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Drawer Menu */}
      {!isDesktop && mobileMenuOpen && (
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderColor,
            padding: horizontalPadding,
            gap: 16,
            zIndex: 35,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              scrollToSection('fitur');
            }}
            style={{ paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textDark }}>Fitur Utama</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              scrollToSection('keunggulan');
            }}
            style={{ paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textDark }}>Keunggulan Anti-Kecurangan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              scrollToSection('harga');
            }}
            style={{ paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textDark }}>Paket Harga</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              scrollToSection('faq');
            }}
            style={{ paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textDark }}>Tanya Jawab (FAQ)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              router.push('/privacy-policy');
            }}
            style={{ paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textMuted }}>Kebijakan Privasi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMobileMenuOpen(false);
              setShowDemoModal(true);
            }}
            style={{
              backgroundColor: theme.primaryBlue,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
              Daftar Uji Coba Gratis
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN SCROLLABLE CONTENT                               */}
      {/* ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* -------------------------------------------------------- */}
        {/* HERO SECTION                                             */}
        {/* -------------------------------------------------------- */}
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isDesktop ? 60 : isTablet ? 48 : 32,
            paddingBottom: isDesktop ? 70 : isTablet ? 50 : 36,
            alignItems: 'center',
            backgroundColor: theme.isDark ? '#0b1329' : '#f8fafc',
            borderBottomWidth: 1,
            borderBottomColor: theme.borderColor,
            overflow: 'hidden',
          }}
        >
          {/* Badge Tag */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 30,
              backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe',
              borderWidth: 1,
              borderColor: theme.isDark ? '#3b82f6' : '#bae6fd',
              marginBottom: 20,
              maxWidth: '100%',
            }}
          >
            <ShieldCheck size={16} color={theme.primaryBlue} />
            <Text style={{ fontSize: isSmallMobile ? 11 : 12, fontWeight: '700', color: theme.primaryBlue, textAlign: 'center' }}>
              SaaS Presensi GPS Geofencing & HRMS Payroll No. 1
            </Text>
          </View>

          {/* Big Headline */}
          <Text
            style={{
              fontSize: isDesktop ? 46 : isTablet ? 36 : isSmallMobile ? 24 : 28,
              fontWeight: '900',
              color: theme.textDark,
              textAlign: 'center',
              lineHeight: isDesktop ? 56 : isTablet ? 44 : isSmallMobile ? 32 : 36,
              maxWidth: 900,
              letterSpacing: -1,
              marginBottom: 16,
            }}
          >
            Presensi Karyawan Anti-Kecurangan dengan <Text style={{ color: theme.primaryBlue }}>Geofencing Presisi</Text> & <Text style={{ color: '#06b6d4' }}>Payroll Otomatis</Text>
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: isDesktop ? 17 : isTablet ? 15 : 14,
              color: theme.textMuted,
              textAlign: 'center',
              maxWidth: 720,
              lineHeight: isDesktop ? 26 : 22,
              marginBottom: 28,
            }}
          >
            Hentikan titip absen dan manipulasi Fake GPS. Kelola ribuan pegawai di berbagai cabang kantor, hitung gaji pokok & lembur otomatis, serta cetak slip gaji resmi dalam satu dashboard cloud terpadu.
          </Text>

          {/* CTA Buttons */}
          {width < 600 ? (
            <View style={{ width: '100%', maxWidth: 420, gap: 10, marginBottom: 28 }}>
              {/* Primary Action Button (Full Width on Mobile) */}
              <TouchableOpacity
                onPress={() => setShowDemoModal(true)}
                style={{
                  backgroundColor: theme.primaryBlue,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: theme.primaryBlue,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                  width: '100%',
                }}
              >
                <Sparkles size={18} color="#ffffff" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                  Mulai Uji Coba Gratis
                </Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>

              {/* Secondary Actions Row (Side-by-Side on Mobile) */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  onPress={() => router.push('/auth/login')}
                  style={{
                    flex: 1,
                    backgroundColor: theme.cardBg,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: theme.borderColor,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <LogIn size={16} color={theme.textDark} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textDark }} numberOfLines={1}>
                    Masuk
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenWhatsApp}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7',
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.isDark ? '#059669' : '#86efac',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <HeartHandshake size={16} color={theme.isDark ? '#34d399' : '#16a34a'} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.isDark ? '#34d399' : '#15803d' }} numberOfLines={1}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                maxWidth: 900,
                marginBottom: 36,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowDemoModal(true)}
                style={{
                  backgroundColor: theme.primaryBlue,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: theme.primaryBlue,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Sparkles size={18} color="#ffffff" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                  Mulai Uji Coba Gratis
                </Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                style={{
                  backgroundColor: theme.cardBg,
                  paddingVertical: 14,
                  paddingHorizontal: 22,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: theme.borderColor,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <LogIn size={18} color={theme.textDark} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                  Masuk ke Aplikasi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={{
                  backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.isDark ? '#059669' : '#86efac',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <HeartHandshake size={18} color={theme.isDark ? '#34d399' : '#16a34a'} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.isDark ? '#34d399' : '#15803d' }}>
                  Konsultasi WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Value Highlights Pill Bar */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 36,
              maxWidth: 880,
            }}
          >
            {[
              '100% Anti Fake GPS',
              'Validasi Radius Titik Lokasi Kantor',
              'Verifikasi Wajah Ringan On-Device',
              'Perhitungan Lembur & Cuti Otomatis',
              'Multi-Tenant Terenkripsi',
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: theme.cardBg,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <CheckCircle2 size={15} color="#16a34a" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Interactive Live Mockup Preview Card */}
          <View
            style={{
              width: '100%',
              maxWidth: 960,
              backgroundColor: theme.cardBg,
              borderRadius: isMobile ? 14 : 18,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: theme.isDark ? 0.4 : 0.1,
              shadowRadius: 30,
              elevation: 12,
              overflow: 'hidden',
            }}
          >
            {/* Mockup Top Window Bar */}
            <View
              style={{
                backgroundColor: theme.subtleBg,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 6, width: 38 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' }} />
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' }} />
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' }} />
              </View>
              <View
                style={{
                  flex: 1,
                  maxWidth: 420,
                  marginHorizontal: 10,
                  backgroundColor: theme.cardBg,
                  paddingVertical: 4,
                  paddingHorizontal: 14,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'monospace' }} numberOfLines={1}>
                  https://yexssync.yexsx.my.id/admin/attendance
                </Text>
              </View>
              <View style={{ width: 38 }} />
            </View>

            {/* Mockup Dashboard Content */}
            <View style={{ padding: isDesktop ? 24 : isTablet ? 20 : 16, gap: 16 }}>
              {/* Top Row: Clock & Geofencing Status */}
              <View
                style={{
                  flexDirection: width >= 720 ? 'row' : 'column',
                  justifyContent: 'space-between',
                  alignItems: width >= 720 ? 'center' : 'flex-start',
                  backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.3)' : '#e0f2fe',
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, width: '100%' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryBlue, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark }}>
                      Pusat Operasional: Kantor Pusat Jakarta (Radius 50m)
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, lineHeight: 17 }}>
                      Status GPS Pegawai: <Text style={{ color: '#16a34a', fontWeight: '700' }}>✓ 15 meter (Di Dalam Area Kantor)</Text> • Bebas Fake GPS
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: width >= 720 ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Waktu Server Real-Time
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primaryBlue, fontFamily: 'monospace' }}>
                    {currentTime || '08:00:00 WIB'}
                  </Text>
                </View>
              </View>

              {/* 3 Metric Mini Cards */}
              <View style={{ flexDirection: width >= 720 ? 'row' : 'column', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: theme.subtleBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.borderColor }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Total Karyawan Hadir Hari Ini</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#16a34a', marginTop: 4 }}>142 / 148</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>96% Tingkat Ketepatan Waktu</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: theme.subtleBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.borderColor }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Karyawan Izin / Cuti</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#d97706', marginTop: 4 }}>6 Orang</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Disetujui via Mobile Approval</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: theme.subtleBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.borderColor }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Status Payroll Periode Ini</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: theme.primaryBlue, marginTop: 4 }}>100% Siap</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Slip Gaji PDF Terkalkulasi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* STATS & IMPACT COUNTERS                                  */}
        {/* -------------------------------------------------------- */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderColor,
            paddingVertical: isMobile ? 24 : 32,
            paddingHorizontal: horizontalPadding,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: isDesktop ? 'space-around' : 'center',
              alignItems: 'center',
              gap: isDesktop ? 20 : isTablet ? 24 : 20,
              maxWidth: 1080,
              alignSelf: 'center',
              width: '100%',
            }}
          >
            {[
              { val: '99.98%', label: 'Akurasi Koordinat GPS', desc: 'Validasi geofencing meteran' },
              { val: '0%', label: 'Toleransi Fake GPS', desc: 'Sistem deteksi mock location' },
              { val: '5x', label: 'Lebih Cepat Rekap Payroll', desc: 'Slip gaji terhitung otomatis' },
              { val: '10.000+', label: 'Presensi Terverifikasi', desc: 'Setiap hari tanpa server down' },
            ].map((stat, i) => (
              <View
                key={i}
                style={{
                  alignItems: 'center',
                  width: isDesktop ? '22%' : isTablet ? '45%' : '46%',
                  minWidth: isSmallMobile ? '100%' : 140,
                }}
              >
                <Text style={{ fontSize: isMobile ? 26 : 32, fontWeight: '900', color: theme.primaryBlue, textAlign: 'center' }}>
                  {stat.val}
                </Text>
                <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: '700', color: theme.textDark, marginTop: 2, textAlign: 'center' }}>
                  {stat.label}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, textAlign: 'center' }}>
                  {stat.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 4: FITUR UTAMA                                   */}
        {/* -------------------------------------------------------- */}
        <View
          id="fitur"
          style={{
            paddingHorizontal: horizontalPadding,
            paddingVertical: sectionVerticalPadding,
            maxWidth: 1140,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <View style={{ backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryBlue, textTransform: 'uppercase' }}>
                Fitur Unggulan Sistem
              </Text>
            </View>
            <Text style={{ fontSize: isDesktop ? 34 : isTablet ? 28 : isSmallMobile ? 22 : 24, fontWeight: '900', color: theme.textDark, textAlign: 'center', lineHeight: isMobile ? 32 : 42 }}>
              Solusi Lengkap HRD, Absensi & Gaji Dalam Satu Aplikasi
            </Text>
            <Text style={{ fontSize: isMobile ? 14 : 15, color: theme.textMuted, textAlign: 'center', maxWidth: 640, marginTop: 10, lineHeight: 22 }}>
              Didesain khusus untuk mengatasi masalah nyata perusahaan di Indonesia: dari kecurangan absensi hingga kerepotan menghitung lembur manual.
            </Text>
          </View>

          {/* Feature Grid (6 Cards) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 14 : 20, justifyContent: 'center' }}>
            {features.map((feat, i) => {
              const IconComp = feat.icon;
              return (
                <View
                  key={i}
                  style={{
                    width: isDesktop ? '31.5%' : isTablet ? '48%' : '100%',
                    backgroundColor: theme.cardBg,
                    borderRadius: 14,
                    padding: isMobile ? 18 : 24,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.isDark ? 0.2 : 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: theme.isDark ? `${feat.color}22` : `${feat.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <IconComp size={24} color={feat.color} />
                  </View>
                  <Text style={{ fontSize: isMobile ? 16 : 17, fontWeight: '700', color: theme.textDark, marginBottom: 8 }}>
                    {feat.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 20 }}>
                    {feat.desc}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 5: PERBANDINGAN SEBELUM & SESUDAH                */}
        {/* -------------------------------------------------------- */}
        <View
          id="keunggulan"
          style={{
            backgroundColor: theme.isDark ? '#0b1329' : '#f1f5f9',
            paddingVertical: sectionVerticalPadding,
            paddingHorizontal: horizontalPadding,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.borderColor,
          }}
        >
          <View style={{ maxWidth: 1080, alignSelf: 'center', width: '100%' }}>
            <View style={{ alignItems: 'center', marginBottom: isMobile ? 28 : 40 }}>
              <Text style={{ fontSize: isDesktop ? 32 : isTablet ? 26 : isSmallMobile ? 21 : 24, fontWeight: '900', color: theme.textDark, textAlign: 'center', lineHeight: isMobile ? 30 : 38 }}>
                Mengapa Perusahaan Beralih ke YexsSync?
              </Text>
              <Text style={{ fontSize: isMobile ? 14 : 15, color: theme.textMuted, textAlign: 'center', maxWidth: 640, marginTop: 8, lineHeight: 21 }}>
                Bandingkan kerugian metode konvensional dengan efisiensi otomatisasi YexsSync.
              </Text>
            </View>

            <View style={{ flexDirection: width >= 860 ? 'row' : 'column', gap: 20 }}>
              {/* Cara Lama */}
              <View
                style={{
                  flex: width >= 860 ? 1 : undefined,
                  backgroundColor: theme.cardBg,
                  borderRadius: 16,
                  padding: isMobile ? 18 : 26,
                  borderWidth: 1,
                  borderColor: theme.isDark ? '#7f1d1d' : '#fecaca',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={20} color="#dc2626" />
                  </View>
                  <Text style={{ fontSize: isMobile ? 16 : 18, fontWeight: '800', color: '#dc2626', flex: 1 }}>
                    Metode Lama (Fingerprint & Excel)
                  </Text>
                </View>

                {[
                  'Antrean panjang di mesin fingerprint setiap jam masuk kantor',
                  'Biaya mesin fingerprint mahal dan sering rusak/kotor',
                  'Karyawan lapangan / sales luar kota tidak bisa absen',
                  'HRD menghabiskan berhari-hari merekap absen dan lembur di Excel',
                  'Rawan titip absen atau saling tukar jadwal tanpa sepengetahuan atasan',
                  'Perhitungan gaji rawan salah dan menimbulkan komplain karyawan',
                ].map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <X size={16} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13, color: theme.textMuted, flex: 1, lineHeight: 19 }}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Dengan YexsSync */}
              <View
                style={{
                  flex: width >= 860 ? 1 : undefined,
                  backgroundColor: theme.cardBg,
                  borderRadius: 16,
                  padding: isMobile ? 18 : 26,
                  borderWidth: 2,
                  borderColor: theme.primaryBlue,
                  shadowColor: theme.primaryBlue,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={20} color="#16a34a" />
                  </View>
                  <Text style={{ fontSize: isMobile ? 16 : 18, fontWeight: '800', color: theme.primaryBlue, flex: 1 }}>
                    Modern dengan YexsSync Cloud
                  </Text>
                </View>

                {[
                  'Absen instan dalam 2 detik langsung dari smartphone masing-masing',
                  'Tanpa biaya mesin tambahan, cukup gunakan perangkat Android/iOS',
                  'Geofencing akurat: absen di lokasi kantor cabang, pabrik, atau titik klien',
                  'Anti-Kecurangan Fake GPS & verifikasi wajah biometrik terpercaya',
                  'Rekapitulasi keterlambatan, lembur, dan cuti terhitung otomatis real-time',
                  'Payroll otomatis: 1-klik cetak slip gaji PDF resmi untuk seluruh pegawai',
                ].map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13, color: theme.textDark, fontWeight: '600', flex: 1, lineHeight: 19 }}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 6: PAKET HARGA (PRICING)                         */}
        {/* -------------------------------------------------------- */}
        <View
          id="harga"
          style={{
            paddingHorizontal: horizontalPadding,
            paddingVertical: sectionVerticalPadding,
            maxWidth: 1140,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: isMobile ? 24 : 32 }}>
            <View
              style={{
                backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7',
                paddingVertical: 5,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.isDark ? '#059669' : '#86efac',
                maxWidth: '100%',
              }}
            >
              <Text style={{ fontSize: isSmallMobile ? 10 : 12, fontWeight: '800', color: theme.isDark ? '#34d399' : '#15803d', textTransform: 'uppercase', textAlign: 'center' }}>
                ✨ SEMUA FITUR DAPAT DIAKSES DI SEMUA PAKET
              </Text>
            </View>
            <Text style={{ fontSize: isDesktop ? 34 : isTablet ? 28 : isSmallMobile ? 22 : 24, fontWeight: '900', color: theme.textDark, textAlign: 'center', lineHeight: isMobile ? 32 : 40 }}>
              Investasi Terbaik untuk Efisiensi Bisnis Anda
            </Text>
            <Text style={{ fontSize: isMobile ? 14 : 15, color: theme.textMuted, textAlign: 'center', maxWidth: 680, marginTop: 8, lineHeight: 22 }}>
              Semua fitur canggih YexsSync (GPS Geofencing, Biometrik Wajah, Anti-Fake GPS, Smart Payroll & Slip Gaji PDF) 100% terbuka untuk semua paket. Anda hanya menentukan kuota jumlah karyawan yang sesuai!
            </Text>

            {/* Billing Toggle (Monthly vs Yearly) */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: theme.subtleBg,
                borderRadius: 10,
                padding: 4,
                borderWidth: 1,
                borderColor: theme.borderColor,
                marginTop: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => setBillingCycle('monthly')}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: isSmallMobile ? 14 : 20,
                  borderRadius: 8,
                  backgroundColor: billingCycle === 'monthly' ? theme.cardBg : 'transparent',
                  borderWidth: billingCycle === 'monthly' ? 1 : 0,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: billingCycle === 'monthly' ? theme.primaryBlue : theme.textMuted }}>
                  Bulanan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillingCycle('yearly')}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: isSmallMobile ? 14 : 20,
                  borderRadius: 8,
                  backgroundColor: billingCycle === 'yearly' ? theme.cardBg : 'transparent',
                  borderWidth: billingCycle === 'yearly' ? 1 : 0,
                  borderColor: theme.borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: billingCycle === 'yearly' ? theme.primaryBlue : theme.textMuted }}>
                  Tahunan
                </Text>
                <View style={{ backgroundColor: '#16a34a', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 10 }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>HEMAT 20%</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kalkulator Simulasi Biaya Langganan Interaktif */}
          {(() => {
            const isYearly = billingCycle === 'yearly';
            const simResult = calculateSubscriptionPrice(simUserCount, billingCycle);
            const currentPrice = isYearly ? simResult.totalAmountYearly : simResult.totalAmountMonthly;
            const presets = [5, 10, 20, 35, 50, 100];

            return (
              <View
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 18,
                  padding: isMobile ? 18 : 28,
                  borderWidth: 1.5,
                  borderColor: theme.primaryBlue + '40',
                  marginBottom: 32,
                  shadowColor: theme.primaryBlue,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.primaryBlue + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Calculator size={20} color={theme.primaryBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: theme.textDark }}>
                      Kalkulator Simulasi Biaya Langganan
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                      Hitung estimasi investasi langganan sesuai jumlah karyawan Anda secara transparan & otomatis.
                    </Text>
                  </View>
                </View>

                {/* Counter & Preset Chips */}
                <View style={{ flexDirection: width >= 768 ? 'row' : 'column', gap: 20, marginTop: 16, alignItems: width >= 768 ? 'center' : 'stretch' }}>
                  {/* Stepper Input */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark, marginBottom: 8 }}>
                      Jumlah Karyawan Aktif:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setSimUserCount(Math.max(1, simUserCount - 1))}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          backgroundColor: theme.subtleBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Minus size={18} color={theme.textDark} />
                      </TouchableOpacity>
                      <TextInput
                        value={String(simUserCount)}
                        onChangeText={(txt) => {
                          const num = parseInt(txt.replace(/[^0-9]/g, ''), 10);
                          setSimUserCount(isNaN(num) ? 1 : Math.max(1, Math.min(1000, num)));
                        }}
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          backgroundColor: theme.cardBg,
                          textAlign: 'center',
                          fontSize: 18,
                          fontWeight: '800',
                          color: theme.textDark,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setSimUserCount(Math.min(1000, simUserCount + 1))}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          backgroundColor: theme.subtleBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={18} color={theme.textDark} />
                      </TouchableOpacity>
                    </View>

                    {/* Quick Preset Chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {presets.map((count) => {
                        const isSelected = simUserCount === count;
                        return (
                          <TouchableOpacity
                            key={count}
                            onPress={() => setSimUserCount(count)}
                            style={{
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                              backgroundColor: isSelected ? theme.primaryBlue : theme.subtleBg,
                              borderWidth: 1,
                              borderColor: isSelected ? theme.primaryBlue : theme.borderColor,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: isSelected ? '#ffffff' : theme.textMuted,
                              }}
                            >
                              {count < 10 ? `${count} Orang (< 10)` : `${count} Orang`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Result Display Box */}
                  <View
                    style={{
                      flex: 1.2,
                      backgroundColor: theme.subtleBg,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Kategori Kuota:</Text>
                      <View style={{ backgroundColor: theme.primaryBlue + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primaryBlue }}>
                          {simResult.packageName}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Skema Tarif:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                        {formatRupiah(simResult.ratePerUser)} / karyawan / bln
                      </Text>
                    </View>

                    <View style={{ borderTopWidth: 1, borderTopColor: theme.borderColor, paddingTop: 10, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <View>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>Total Biaya Langganan:</Text>
                        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.primaryBlue }}>
                          {formatRupiah(currentPrice)}
                          <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textMuted }}> / bln</Text>
                        </Text>
                        {isYearly && (
                          <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: '700', marginTop: 2 }}>
                            ✓ Diskon 20% Paket Tahunan aktif
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setDemoUserCount(String(simUserCount));
                          setShowDemoModal(true);
                        }}
                        style={{
                          backgroundColor: theme.primaryBlue,
                          paddingVertical: 9,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>
                          Mulai Uji Coba
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Pricing Cards */}
          <View
            style={{
              flexDirection: width >= 980 ? 'row' : 'column',
              gap: 24,
              alignItems: 'stretch',
              maxWidth: width >= 980 ? '100%' : 540,
              alignSelf: 'center',
              width: '100%',
            }}
          >
            {/* Card 1: Paket Starter (< 10 Karyawan) */}
            <View
              style={{
                flex: width >= 980 ? 1 : undefined,
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                borderWidth: 1,
                borderColor: theme.borderColor,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>Paket Starter</Text>
                  <View style={{ backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primaryBlue }}>&lt; 10 Karyawan</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Khusus UMKM, toko, kafe & tim mikro</Text>
                
                <View style={{ marginVertical: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: isSmallMobile ? 24 : 28, fontWeight: '900', color: theme.textDark }}>
                      {billingCycle === 'yearly' ? 'Rp 8.000' : 'Rp 10.000'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}> / karyawan / bln</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                    Bayar pas sesuai jumlah karyawan (contoh: 5 orang = {billingCycle === 'yearly' ? 'Rp 40.000' : 'Rp 50.000'}/bln)
                  </Text>
                </View>

                <View style={{ gap: 10, marginBottom: 24 }}>
                  {[
                    { text: 'Akses Penuh 100% Seluruh Fitur', highlight: true },
                    { text: 'Kapasitas 1 s/d 9 Karyawan Aktif', highlight: false },
                    { text: 'Presensi GPS Geofencing & Anti-Fake GPS', highlight: false },
                    { text: 'Verifikasi Wajah Biometrik On-Device', highlight: false },
                    { text: 'Smart Payroll & Cetak Slip Gaji PDF', highlight: false },
                    { text: 'Manajemen Cuti, Izin & Lembur', highlight: false },
                    { text: 'Aplikasi Android & Web Dashboard', highlight: false },
                    { text: 'Standard Support via WhatsApp', highlight: false },
                  ].map((f, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Check size={16} color={f.highlight ? theme.primaryBlue : '#16a34a'} style={{ flexShrink: 0 }} />
                      <Text style={{ fontSize: 13, color: f.highlight ? theme.primaryBlue : theme.textDark, fontWeight: f.highlight ? '800' : '500', flex: 1 }}>
                        {f.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setDemoUserCount('7');
                  setShowDemoModal(true);
                }}
                style={{
                  backgroundColor: theme.subtleBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textDark }}>Pilih Paket Starter</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: Paket Bisnis (Kelipatan 10) (Popular) */}
            <View
              style={{
                flex: width >= 980 ? 1 : undefined,
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                borderWidth: 2,
                borderColor: theme.primaryBlue,
                position: 'relative',
                shadowColor: theme.primaryBlue,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 8,
                justifyContent: 'space-between',
                marginTop: width >= 980 ? 0 : 8,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -14,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.primaryBlue,
                    paddingVertical: 4,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                    Paling Banyak Dipilih
                  </Text>
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.primaryBlue }}>Paket Bisnis</Text>
                  <View style={{ backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primaryBlue }}>Kelipatan 10</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Untuk tim 10 s/d 50 karyawan aktif</Text>
                
                <View style={{ marginVertical: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: isSmallMobile ? 24 : 28, fontWeight: '900', color: theme.primaryBlue }}>
                      {billingCycle === 'yearly' ? 'Rp 360.000' : 'Rp 450.000'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}> / 50 karyawan / bln</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                    Paket: 10 user = 100k • 20 user = 180k • 50 user = 450k (Hanya Rp 9.000/user)
                  </Text>
                </View>

                <View style={{ gap: 10, marginBottom: 24 }}>
                  {[
                    { text: 'Akses Penuh 100% Seluruh Fitur', highlight: true },
                    { text: 'Kuota Bertingkat 10 s/d 50 Karyawan', highlight: false },
                    { text: 'Presensi GPS Geofencing & Anti-Fake GPS', highlight: false },
                    { text: 'Verifikasi Wajah Biometrik On-Device', highlight: false },
                    { text: 'Smart Payroll & Cetak Slip Gaji PDF', highlight: false },
                    { text: 'Multi-Lokasi Kantor / Cabang', highlight: false },
                    { text: 'Aplikasi Android & Web Dashboard', highlight: false },
                    { text: 'Prioritas Fast Support WhatsApp', highlight: true },
                  ].map((f, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Check size={16} color={theme.primaryBlue} style={{ flexShrink: 0 }} />
                      <Text style={{ fontSize: 13, color: f.highlight ? theme.primaryBlue : theme.textDark, fontWeight: f.highlight ? '800' : '600', flex: 1 }}>
                        {f.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setDemoUserCount('30');
                  setShowDemoModal(true);
                }}
                style={{
                  backgroundColor: theme.primaryBlue,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>Mulai Uji Coba Bisnis</Text>
              </TouchableOpacity>
            </View>

            {/* Card 3: Paket Enterprise (60 s/d 100+ Karyawan) */}
            <View
              style={{
                flex: width >= 980 ? 1 : undefined,
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: isMobile ? 20 : 28,
                borderWidth: 1,
                borderColor: theme.borderColor,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>Enterprise</Text>
                  <View style={{ backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>60 - 100+ Karyawan</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Korporat skala besar, pabrik & multi-cabang</Text>
                
                <View style={{ marginVertical: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: isSmallMobile ? 24 : 28, fontWeight: '900', color: theme.textDark }}>
                      {billingCycle === 'yearly' ? 'Rp 720.000' : 'Rp 900.000'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}> / 100 karyawan / bln</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                    Mulai 60 user = 540k • 100 user = 900k • &gt;100 kustom kelipatan 10
                  </Text>
                </View>

                <View style={{ gap: 10, marginBottom: 24 }}>
                  {[
                    { text: 'Akses Penuh 100% Seluruh Fitur', highlight: true },
                    { text: 'Kapasitas 60 s/d 100+ Karyawan Aktif', highlight: true },
                    { text: 'Presensi GPS Geofencing & Anti-Fake GPS', highlight: false },
                    { text: 'Verifikasi Wajah Biometrik On-Device', highlight: false },
                    { text: 'Smart Payroll & Cetak Slip Gaji PDF', highlight: false },
                    { text: 'Manajemen Multi Cabang / Divisi Tanpa Batas', highlight: false },
                    { text: 'Custom Domain Perusahaan Sendiri (Opsional)', highlight: false },
                    { text: 'Dedicated Account Manager & SLA 99.9%', highlight: true },
                  ].map((f, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Check size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                      <Text style={{ fontSize: 13, color: f.highlight ? '#16a34a' : theme.textDark, fontWeight: f.highlight ? '800' : '500', flex: 1 }}>
                        {f.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={{
                  backgroundColor: theme.subtleBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textDark }}>Hubungi Sales Enterprise</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Jaminan Semua Fitur Terbuka */}
          <View
            style={{
              backgroundColor: theme.subtleBg,
              borderRadius: 16,
              padding: isMobile ? 18 : 22,
              marginTop: 28,
              borderWidth: 1,
              borderColor: theme.borderColor,
              flexDirection: width >= 860 ? 'row' : 'column',
              alignItems: width >= 860 ? 'center' : 'stretch',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <View style={{ flexDirection: isSmallMobile ? 'column' : 'row', alignItems: isSmallMobile ? 'flex-start' : 'center', gap: 14, flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textDark }}>
                  Tanpa Fitur Terkunci di Semua Paket
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 3, lineHeight: 18 }}>
                  Semua paket mendapatkan fitur yang sama lengkapnya. Mulai dari Basic hingga Enterprise, Anda bebas menggunakan Geofencing GPS, Face Recognition, Anti-Fake GPS, Cuti/Lembur, dan Smart Payroll tanpa biaya tambahan per modul.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleOpenWhatsApp}
              style={{
                backgroundColor: '#16a34a',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: width >= 860 ? 'auto' : '100%',
              }}
            >
              <Phone size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                Konsultasi WhatsApp (0878-9855-5764)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 7: FAQ ACCORDION                                 */}
        {/* -------------------------------------------------------- */}
        <View
          id="faq"
          style={{
            backgroundColor: theme.isDark ? '#0b1329' : '#f8fafc',
            paddingVertical: sectionVerticalPadding,
            paddingHorizontal: horizontalPadding,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.borderColor,
          }}
        >
          <View style={{ maxWidth: 840, alignSelf: 'center', width: '100%' }}>
            <View style={{ alignItems: 'center', marginBottom: isMobile ? 28 : 40 }}>
              <View style={{ backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryBlue, textTransform: 'uppercase' }}>
                  Frequently Asked Questions
                </Text>
              </View>
              <Text style={{ fontSize: isDesktop ? 32 : isTablet ? 26 : isSmallMobile ? 21 : 24, fontWeight: '900', color: theme.textDark, textAlign: 'center' }}>
                Pertanyaan yang Sering Diajukan
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isOpen ? theme.primaryBlue : theme.borderColor,
                      overflow: 'hidden',
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setActiveFaq(isOpen ? null : idx)}
                      style={{
                        padding: isMobile ? 14 : 18,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: isMobile ? 14 : 15, fontWeight: '700', color: theme.textDark, flex: 1, paddingRight: 10, lineHeight: 20 }}>
                        {faq.q}
                      </Text>
                      {isOpen ? <ChevronUp size={18} color={theme.primaryBlue} style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color={theme.textMuted} style={{ flexShrink: 0 }} />}
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={{ paddingHorizontal: isMobile ? 14 : 18, paddingBottom: isMobile ? 14 : 18, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.borderColor }}>
                        <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 20 }}>
                          {faq.a}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 8: FINAL CTA BANNER                              */}
        {/* -------------------------------------------------------- */}
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            paddingVertical: sectionVerticalPadding,
            maxWidth: 1080,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <View
            style={{
              backgroundColor: theme.isDark ? '#1e3a8a' : '#08142c',
              borderRadius: isMobile ? 18 : 24,
              padding: isDesktop ? 60 : isTablet ? 36 : isSmallMobile ? 20 : 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
              elevation: 10,
            }}
          >
            <Sparkles size={36} color="#38bdf8" style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: isDesktop ? 36 : isTablet ? 28 : isSmallMobile ? 20 : 23,
                fontWeight: '900',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 14,
                letterSpacing: -0.5,
                lineHeight: isMobile ? 30 : 44,
              }}
            >
              Siap Mengubah Disiplin & Akurasi Kehadiran Perusahaan Anda?
            </Text>
            <Text
              style={{
                fontSize: isMobile ? 14 : 15,
                color: '#94a3b8',
                textAlign: 'center',
                maxWidth: 620,
                lineHeight: 22,
                marginBottom: 28,
              }}
            >
              Bergabunglah dengan ratusan perusahaan modern yang telah menghemat waktu dan menghilangkan kecurangan absensi dengan YexsSync.
            </Text>

            <View style={{ flexDirection: width >= 720 ? 'row' : 'column', gap: 12, width: width >= 720 ? 'auto' : '100%' }}>
              <TouchableOpacity
                onPress={() => setShowDemoModal(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                  Daftarkan Perusahaan Sekarang
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                  Konsultasi dengan Tim Sales
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* SECTION 9: FOOTER                                        */}
        {/* -------------------------------------------------------- */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor,
            paddingVertical: isMobile ? 36 : 48,
            paddingHorizontal: horizontalPadding,
          }}
        >
          <View
            style={{
              maxWidth: 1140,
              alignSelf: 'center',
              width: '100%',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: isMobile ? 28 : 32,
            }}
          >
            {/* Col 1: Brand Info */}
            <View style={{ width: isDesktop ? 340 : isTablet ? '46%' : '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <YexsLogo size={32} />
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.textDark }}>
                  Yexs<Text style={{ color: theme.primaryBlue }}>Sync</Text>
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 20, marginBottom: 16 }}>
                Platform SaaS HRMS & Presensi Karyawan Anti-Fake GPS terlengkap di Indonesia. Tingkatkan efisiensi kerja dan otomatisasi penggajian dengan mudah.
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                Server VPS: <Text style={{ color: '#16a34a', fontWeight: '700' }}>Aktif & Terproteksi SSL</Text>
              </Text>
            </View>

            {/* Col 2: Navigasi Produk */}
            <View style={{ width: isDesktop ? 'auto' : isTablet ? '46%' : '100%', gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 4 }}>
                Solusi & Fitur
              </Text>
              <TouchableOpacity onPress={() => scrollToSection('fitur')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Presensi Geofencing GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('fitur')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Verifikasi Wajah Biometrik</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('fitur')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Payroll & Slip Gaji PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('fitur')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Manajemen Cuti & Lembur</Text>
              </TouchableOpacity>
            </View>

            {/* Col 3: Portal & Akses */}
            <View style={{ width: isDesktop ? 'auto' : isTablet ? '46%' : '100%', gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 4 }}>
                Portal Akses
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Login Pegawai & Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Login Admin Perusahaan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Portal SuperAdmin SaaS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Kebijakan Privasi (Privacy Policy)</Text>
              </TouchableOpacity>
            </View>

            {/* Col 4: Kontak & Bantuan */}
            <View style={{ width: isDesktop ? 'auto' : isTablet ? '46%' : '100%', gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 2 }}>
                Hubungi Kami
              </Text>
              <TouchableOpacity onPress={handleOpenEmail} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mail size={15} color={theme.primaryBlue} />
                <Text style={{ fontSize: 13, color: theme.textDark, fontWeight: '600' }}>
                  yexsdev@gmail.com
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenWhatsApp} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Phone size={15} color="#16a34a" />
                <Text style={{ fontSize: 13, color: theme.textDark, fontWeight: '600' }}>
                  WA: 0878-9855-5764
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={{
                  marginTop: 4,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7',
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Phone size={13} color={theme.isDark ? '#34d399' : '#15803d'} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.isDark ? '#34d399' : '#15803d' }}>
                  Chat WhatsApp Live
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              maxWidth: 1140,
              alignSelf: 'center',
              width: '100%',
              borderTopWidth: 1,
              borderTopColor: theme.borderColor,
              marginTop: 36,
              paddingTop: 20,
              flexDirection: width >= 640 ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: width >= 640 ? 'left' : 'center' }}>
              © 2026 PT YexsSync Indonesia. Hak Cipta Dilindungi Undang-Undang.
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Kebijakan Privasi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Masuk ke Sistem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* 4. MODAL PENDAFTARAN UJI COBA / DEMO                      */}
      {/* ======================================================== */}
      <Modal visible={showDemoModal} transparent animationType="fade" onRequestClose={() => setShowDemoModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: isSmallMobile ? 12 : 20,
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 18,
                width: '100%',
                maxWidth: 480,
                padding: isMobile ? 18 : 24,
                borderWidth: 1,
                borderColor: theme.borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                  <Sparkles size={20} color={theme.primaryBlue} style={{ flexShrink: 0 }} />
                  <Text style={{ fontSize: isSmallMobile ? 15 : 17, fontWeight: '800', color: theme.textDark, flex: 1 }}>
                    Daftar Uji Coba Gratis YexsSync
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDemoModal(false)}
                  style={{ padding: 6 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {demoSuccess ? (
                <View style={{ paddingVertical: 20, alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={32} color="#16a34a" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: theme.textDark, textAlign: 'center' }}>
                    Pendaftaran Berhasil Dikirim!
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 }}>
                    Terima kasih <Text style={{ fontWeight: '700', color: theme.textDark }}>{demoAdminName}</Text> dari <Text style={{ fontWeight: '700', color: theme.textDark }}>{demoCompanyName}</Text>. Tim account manager kami akan segera menghubungi nomor WhatsApp Anda untuk mengaktifkan akun trial gratis Anda.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDemoModal(false);
                      setDemoSuccess(false);
                      handleOpenWhatsApp();
                    }}
                    style={{
                      backgroundColor: '#16a34a',
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 8,
                      marginTop: 8,
                      width: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                      Hubungi Cepat via WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Isi formulir di bawah ini untuk memulai uji coba fitur presensi geofencing & payroll gratis selama 14 hari.
                  </Text>

                  {demoError ? (
                    <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                      <Text style={{ color: '#b91c1c', fontSize: 12, flex: 1 }}>{demoError}</Text>
                    </View>
                  ) : null}

                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark, marginBottom: 4 }}>Nama Perusahaan / Organisasi</Text>
                    <TextInput
                      value={demoCompanyName}
                      onChangeText={setDemoCompanyName}
                      placeholder="Contoh: PT Sumber Jaya Abadi"
                      placeholderTextColor={theme.textMuted}
                      style={{ backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: theme.textDark }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark, marginBottom: 4 }}>Nama PIC / HRD Manager</Text>
                    <TextInput
                      value={demoAdminName}
                      onChangeText={setDemoAdminName}
                      placeholder="Contoh: Budi Santoso"
                      placeholderTextColor={theme.textMuted}
                      style={{ backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: theme.textDark }}
                    />
                  </View>

                  <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark, marginBottom: 4 }}>Email Perusahaan</Text>
                      <TextInput
                        value={demoEmail}
                        onChangeText={setDemoEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="budi@sumberjaya.com"
                        placeholderTextColor={theme.textMuted}
                        style={{ backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: theme.textDark }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark, marginBottom: 4 }}>Nomor WhatsApp</Text>
                      <TextInput
                        value={demoPhone}
                        onChangeText={setDemoPhone}
                        keyboardType="phone-pad"
                        placeholder="081234567890"
                        placeholderTextColor={theme.textMuted}
                        style={{ backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: theme.textDark }}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textDark, marginBottom: 4 }}>Perkiraan Jumlah Karyawan</Text>
                    <TextInput
                      value={demoUserCount}
                      onChangeText={setDemoUserCount}
                      keyboardType="numeric"
                      placeholder="Contoh: 50"
                      placeholderTextColor={theme.textMuted}
                      style={{ backgroundColor: theme.subtleBg, borderWidth: 1, borderColor: theme.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: theme.textDark }}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleDemoSubmit}
                    disabled={demoSubmitting}
                    style={{
                      backgroundColor: theme.primaryBlue,
                      paddingVertical: 13,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8,
                      opacity: demoSubmitting ? 0.7 : 1,
                    }}
                  >
                    {demoSubmitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                        Kirim & Mulai Trial Gratis
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
