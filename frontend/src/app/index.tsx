import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sun,
  Moon,
  Check,
  Building2,
  Users,
  Shield,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import api from '@/lib/api';
import { YexsLogo } from '@/components/YexsLogo';

export default function LoginScreen() {
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, isLoading: authLoading, login } = useContext(AuthContext);

  // Auto-redirect jika token login sudah tersimpan di perangkat
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/superadmin');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/user');
      }
    }
  }, [user, authLoading]);

  // Form states
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Quick fill helper
  const handleQuickFill = (roleEmail: string, rolePass: string = 'Password123!') => {
    setEmailOrId(roleEmail);
    setPassword(rolePass);
    setErrorMessage('');
  };

  // Login handler
  const handleLogin = async () => {
    if (!emailOrId.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan email atau ID pegawai serta kata sandi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.post('/auth/auto-login', {
        email: emailOrId.trim(),
        password: password.trim(),
      });

      if (response.data?.success) {
        const { token, user: userData, tenant } = response.data.data;
        await login(token, userData, tenant?.id);

        // Redirect based on role
        if (userData.role === 'SUPER_ADMIN') {
          router.replace('/superadmin');
        } else if (userData.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/user');
        }
      } else {
        if (response.data?.requireTenantSelection) {
          setErrorMessage('Email ini terdaftar di beberapa perusahaan. Silakan pilih tenant.');
        } else {
          setErrorMessage(
            response.data?.message || 'Login gagal. Pastikan email/ID dan kata sandi Anda benar.'
          );
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const msg =
        error.response?.data?.message ||
        'Tidak dapat terhubung ke server. Pastikan backend Anda berjalan atau periksa koneksi Anda.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          height: '100%',
          backgroundColor: theme.bgColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.primaryBlue} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        height: '100%',
        minHeight: '100%',
        width: '100%',
        backgroundColor: theme.bgColor,
        padding: isDesktop ? 20 : 0,
      }}
    >
      {/* Floating Theme Toggle (Top Right) */}
      <TouchableOpacity
        onPress={theme.toggleTheme}
        title={`Ubah ke mode ${theme.isDark ? 'terang' : 'gelap'}`}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {theme.isDark ? (
          <Sun size={18} color="#f59e0b" strokeWidth={2.2} />
        ) : (
          <Moon size={18} color="#64748b" strokeWidth={2.2} />
        )}
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1, width: '100%', height: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          paddingVertical: 20,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Main Login Container */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            width: '100%',
            maxWidth: 900,
            backgroundColor: theme.cardBg,
            borderRadius: isDesktop ? 24 : 0,
            overflow: 'hidden',
            margin: isDesktop ? 20 : 0,
            minHeight: isDesktop ? 560 : '100%',
            borderWidth: isDesktop ? 1 : 0,
            borderColor: theme.borderColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 40,
            elevation: 8,
          }}
        >
          {/* ======================================================== */}
          {/* BAGIAN KIRI: BRANDING & ILUSTRASI (DESKTOP ONLY)         */}
          {/* ======================================================== */}
          {isDesktop && (
            <LinearGradient
              colors={['#2a75d3', '#5097f5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                padding: 40,
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Ornamen Lingkaran 1 */}
              <View
                style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 100,
                }}
              />

              {/* Ornamen Lingkaran 2 */}
              <View
                style={{
                  position: 'absolute',
                  bottom: -80,
                  left: -30,
                  width: 300,
                  height: 300,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 150,
                }}
              />

              {/* Logo YexsSync */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  zIndex: 2,
                }}
              >
                <YexsLogo size={36} rounded />
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: 0.5,
                  }}
                >
                  YEXSSYNC
                </Text>
              </View>

              {/* Branding Text */}
              <View style={{ zIndex: 2 }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: 15,
                    lineHeight: 38,
                  }}
                >
                  Sistem Presensi & HR Digital
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.92)',
                    lineHeight: 23,
                  }}
                >
                  Kelola data kehadiran, izin, dan performa karyawan dengan lebih mudah, akurat, dan
                  terintegrasi dalam satu platform.
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* ======================================================== */}
          {/* BAGIAN KANAN: FORM LOGIN                                 */}
          {/* ======================================================== */}
          <View
            style={{
              flex: 1,
              paddingVertical: isDesktop ? 50 : 40,
              paddingHorizontal: isDesktop ? 60 : 25,
              justifyContent: isDesktop ? 'center' : 'flex-start',
              paddingTop: isDesktop ? 50 : 70,
            }}
          >
            {/* Logo untuk Mobile */}
            {!isDesktop && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  marginBottom: 30,
                }}
              >
                <YexsLogo size={34} rounded />
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: theme.primaryBlue,
                    letterSpacing: 0.5,
                  }}
                >
                  YEXSSYNC
                </Text>
              </View>
            )}

            {/* Login Header */}
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: theme.textDark,
                  marginBottom: 8,
                }}
              >
                Selamat Datang Kembali 👋
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textMuted,
                }}
              >
                Silakan masukkan detail akun Anda untuk melanjutkan.
              </Text>
            </View>

            {/* Error Message Alert */}
            {errorMessage ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: theme.dangerBg,
                  borderWidth: 1,
                  borderColor: theme.danger,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={18} color={theme.danger} />
                <Text style={{ fontSize: 13, color: theme.danger, flex: 1, fontWeight: '500' }}>
                  {errorMessage}
                </Text>
                <TouchableOpacity onPress={() => setErrorMessage('')}>
                  <X size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Form */}
            <View>
              {/* Group 1: Email atau ID Pegawai */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.textDark,
                    marginBottom: 8,
                  }}
                >
                  Email atau ID Pegawai
                </Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute', left: 15, zIndex: 1 }}>
                    <Mail size={18} color={theme.textMuted} />
                  </View>
                  <TextInput
                    placeholder="Masukkan email atau ID"
                    placeholderTextColor={theme.placeholder}
                    value={emailOrId}
                    onChangeText={(val) => {
                      setEmailOrId(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isSubmitting}
                    style={{
                      width: '100%',
                      paddingVertical: 14,
                      paddingLeft: 45,
                      paddingRight: 15,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 12,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.isDark ? '#0f172a' : '#f9fafb',
                      outlineWidth: 0,
                    }}
                  />
                </View>
              </View>

              {/* Group 2: Kata Sandi */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.textDark,
                    marginBottom: 8,
                  }}
                >
                  Kata Sandi
                </Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute', left: 15, zIndex: 1 }}>
                    <Lock size={18} color={theme.textMuted} />
                  </View>
                  <TextInput
                    placeholder="Masukkan kata sandi"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isSubmitting}
                    style={{
                      width: '100%',
                      paddingVertical: 14,
                      paddingLeft: 45,
                      paddingRight: 45,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 12,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.isDark ? '#0f172a' : '#f9fafb',
                      outlineWidth: 0,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 15,
                      zIndex: 1,
                      padding: 4,
                    }}
                    title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={theme.textMuted} />
                    ) : (
                      <Eye size={18} color={theme.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Options: Ingat Saya & Lupa Sandi */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 25,
                }}
              >
                {/* Ingat Saya Checkbox */}
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: rememberMe ? theme.primaryBlue : theme.borderColor,
                      backgroundColor: rememberMe ? theme.primaryBlue : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                  </View>
                  <Text style={{ fontSize: 13, color: theme.textDark, fontWeight: '500' }}>
                    Ingat Saya
                  </Text>
                </TouchableOpacity>

                {/* Lupa Sandi Link */}
                <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.primaryBlue,
                    }}
                  >
                    Lupa Sandi?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tombol Masuk Sekarang */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{
                  width: '100%',
                  paddingVertical: 15,
                  backgroundColor: isSubmitting ? theme.primaryBlueHover : theme.primaryBlue,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: theme.primaryBlue,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>
                      Masuk Sekarang
                    </Text>
                    <LogIn size={18} color="#ffffff" strokeWidth={2.2} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Registration Notice */}
            <View
              style={{
                marginTop: 25,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textMuted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Perusahaan Anda belum terdaftar?{'\n'}
                <Text
                  onPress={() => setShowRegisterModal(true)}
                  style={{
                    color: theme.primaryBlue,
                    fontWeight: '600',
                  }}
                >
                  Daftarkan Perusahaan (Tenant)
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL: LUPA KATA SANDI                                   */}
      {/* ======================================================== */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Reset Kata Sandi
              </Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <CheckCircle size={44} color={theme.success} style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: theme.textDark,
                    marginBottom: 6,
                  }}
                >
                  Tautan Reset Terkirim!
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    textAlign: 'center',
                    lineHeight: 18,
                    marginBottom: 20,
                  }}
                >
                  Instruksi pemulihan kata sandi telah dikirim ke alamat email Anda. Silakan periksa
                  kotak masuk atau folder spam.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  style={{
                    backgroundColor: theme.primaryBlue,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Selesai</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    lineHeight: 18,
                    marginBottom: 16,
                  }}
                >
                  Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang
                  kata sandi.
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.textDark,
                      marginBottom: 6,
                    }}
                  >
                    Email Terdaftar
                  </Text>
                  <TextInput
                    placeholder="nama@perusahaan.com"
                    placeholderTextColor={theme.placeholder}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      fontSize: 14,
                      color: theme.textDark,
                      backgroundColor: theme.inputBg,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowForgotModal(false)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Batal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (forgotEmail.trim()) {
                        setForgotSuccess(true);
                      }
                    }}
                    style={{
                      backgroundColor: theme.primaryBlue,
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                      Kirim Tautan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: DAFTAR PERUSAHAAN (TENANT)                         */}
      {/* ======================================================== */}
      <Modal
        visible={showRegisterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Daftarkan Perusahaan (Tenant)
              </Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {regSuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <CheckCircle size={44} color={theme.success} style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.textDark,
                    marginBottom: 6,
                  }}
                >
                  Pendaftaran Berhasil Diajukan!
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    textAlign: 'center',
                    lineHeight: 18,
                    marginBottom: 20,
                  }}
                >
                  Tim Super Admin YexsSync akan segera mengonfirmasi dan mengaktifkan workspace
                  perusahaan Anda. Rincian akun telah dikirim ke email Anda.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowRegisterModal(false);
                    setRegSuccess(false);
                  }}
                  style={{
                    backgroundColor: theme.primaryBlue,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Kembali</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    lineHeight: 18,
                    marginBottom: 16,
                  }}
                >
                  Daftarkan perusahaan Anda untuk mendapatkan uji coba gratis 14 hari sistem presensi
                  dan absensi digital modern YexsSync.
                </Text>

                <View style={{ gap: 12, marginBottom: 18 }}>
                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.textDark,
                        marginBottom: 6,
                      }}
                    >
                      Nama Perusahaan *
                    </Text>
                    <TextInput
                      placeholder="Contoh: PT Teknologi Maju Bersama"
                      placeholderTextColor={theme.placeholder}
                      value={regCompanyName}
                      onChangeText={setRegCompanyName}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 40,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.inputBg,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.textDark,
                        marginBottom: 6,
                      }}
                    >
                      Nama Admin Utama (PIC) *
                    </Text>
                    <TextInput
                      placeholder="Contoh: Budi Prasetyo"
                      placeholderTextColor={theme.placeholder}
                      value={regAdminName}
                      onChangeText={setRegAdminName}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 40,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.inputBg,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.textDark,
                        marginBottom: 6,
                      }}
                    >
                      Email Perusahaan / Kantor *
                    </Text>
                    <TextInput
                      placeholder="admin@perusahaan.com"
                      placeholderTextColor={theme.placeholder}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 40,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.inputBg,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.textDark,
                        marginBottom: 6,
                      }}
                    >
                      Nomor WhatsApp / Telepon *
                    </Text>
                    <TextInput
                      placeholder="+62 812-xxxx-xxxx"
                      placeholderTextColor={theme.placeholder}
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                      style={{
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 40,
                        fontSize: 14,
                        color: theme.textDark,
                        backgroundColor: theme.inputBg,
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowRegisterModal(false)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      Batal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (regCompanyName.trim() && regEmail.trim()) {
                        setRegSuccess(true);
                      }
                    }}
                    style={{
                      backgroundColor: theme.primaryBlue,
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                      Ajukan Pendaftaran
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
