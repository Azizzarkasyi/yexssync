import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import {
  Layers,
  PieChart,
  Building2,
  Users,
  CreditCard,
  Headphones,
  Server,
  Sliders,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Settings,
  Mail,
  ShieldCheck,
  Database,
  Eye,
  EyeOff,
  Save,
  Check,
  Sun,
  Moon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SuperAdminTopHeader from '@/components/SuperAdminTopHeader';

type SettingsTab = 'general' | 'payment' | 'smtp' | 'security' | 'backup';

export default function SuperAdminSettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);

  // Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form States - Tab 1: Identitas & Konfigurasi Umum
  const [appName, setAppName] = useState('YexsSync');
  const [appDomain, setAppDomain] = useState('https://yexssync.yexsx.my.id');
  const [supportEmail, setSupportEmail] = useState('azizsework@gmail.com');
  const [hotlinePhone, setHotlinePhone] = useState('+62 811-2233-4455');

  // Maintenance Mode
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Sistem sedang dalam perbaikan rutin. Silakan kembali dalam 30 menit.'
  );

  // Integrasi External
  const [googleMapsKey, setGoogleMapsKey] = useState('AIzaSyB-xxxxxxxxxxxxxxxxxxxxxxx');
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'local' | 'aws' | 'gcp'>('local');
  const [maxUploadSize, setMaxUploadSize] = useState<'2' | '5' | '10'>('5');

  // Tab 2: Payment Gateway
  const [paymentProvider, setPaymentProvider] = useState<'midtrans' | 'xendit'>('midtrans');
  const [paymentEnvironment, setPaymentEnvironment] = useState<'sandbox' | 'production'>('production');
  const [merchantId, setMerchantId] = useState('G-984210398');
  const [clientKey, setClientKey] = useState('Mid-client-881293049182');
  const [serverKey, setServerKey] = useState('Mid-server-xxxxxxxxxxxxxxxx');
  const [showServerKey, setShowServerKey] = useState(false);

  // Tab 3: SMTP & Email
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [smtpPass, setSmtpPass] = useState('SG.xxxxxxxxxxxxxxxxxxxxxx');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [senderName, setSenderName] = useState('YexsSync System');
  const [senderEmail, setSenderEmail] = useState('noreply@yexssync.yexsx.my.id');

  // Tab 4: Security
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [lockoutMinutes, setLockoutMinutes] = useState('15');

  // Tab 5: Backup
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [backupRetentionDays, setBackupRetentionDays] = useState('30');
  const [lastBackupStatus] = useState('Cloud Backup Otomatis Terhubung (Aktif)');

  // Save feedback modal / state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      router.replace('/auth/login');
    }
  };

  const handleSave = (tabName: string) => {
    setSaveSuccessMessage(`Pengaturan ${tabName} berhasil disimpan dan diperbarui di seluruh server.`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3500);
  };

  // Settings Menu Tabs
  const settingsTabs = [
    { key: 'general' as SettingsTab, label: 'Konfigurasi Umum', icon: Settings },
    { key: 'payment' as SettingsTab, label: 'Payment Gateway', icon: CreditCard },
    { key: 'smtp' as SettingsTab, label: 'SMTP & Email', icon: Mail },
    { key: 'security' as SettingsTab, label: 'Keamanan & Kebijakan', icon: ShieldCheck },
    { key: 'backup' as SettingsTab, label: 'Backup & Storage', icon: Database },
  ];

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: theme.bg }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/settings"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: isDesktop ? 25 : 15, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Top Header */}
        <SuperAdminTopHeader
          title="Pengaturan Global"
          isDesktop={isDesktop}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Save Success Banner */}
        {saveSuccessMessage && (
          <View
            style={{
              backgroundColor: theme.successBg,
              borderWidth: 1,
              borderColor: '#10b981',
              padding: 14,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Check size={18} color={theme.successText} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.successText }}>
              {saveSuccessMessage}
            </Text>
          </View>
        )}

        {/* Settings Container (.settings-container: 250px 1fr) */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 25,
            alignItems: 'flex-start',
          }}
        >
          {/* Settings Sidebar Menu (.settings-menu) */}
          <View
            style={{
              width: isDesktop ? 250 : '100%',
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {settingsTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    backgroundColor: isActive
                      ? theme.isDark
                        ? '#312e81'
                        : '#eef2ff'
                      : 'transparent',
                    borderLeftWidth: isActive ? 3 : 0,
                    borderLeftColor: theme.accent,
                    borderBottomWidth: idx === settingsTabs.length - 1 ? 0 : 1,
                    borderBottomColor: theme.border,
                    cursor: 'pointer',
                  } as any}
                >
                  <Icon size={18} color={isActive ? theme.accent : theme.textMuted} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isActive ? theme.accent : theme.text,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Settings Content Area (.settings-content) */}
          <View style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* TAB 1: KONFIGURASI UMUM */}
            {activeTab === 'general' && (
              <>
                {/* Panel 1: Identitas Aplikasi */}
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                      Identitas Aplikasi
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Pengaturan dasar untuk nama dan kontak aplikasi B2B ini.
                    </Text>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: isDesktop ? 'row' : 'column',
                      gap: 20,
                      marginBottom: 20,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Nama Aplikasi (Platform)
                      </Text>
                      <TextInput
                        value={appName}
                        onChangeText={setAppName}
                        style={{
                          width: '100%',
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Domain Utama
                      </Text>
                      <TextInput
                        value={appDomain}
                        onChangeText={setAppDomain}
                        style={{
                          width: '100%',
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                    </View>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: isDesktop ? 'row' : 'column',
                      gap: 20,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Email Dukungan (Support)
                      </Text>
                      <TextInput
                        value={supportEmail}
                        onChangeText={setSupportEmail}
                        style={{
                          width: '100%',
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>
                        Email ini akan ditampilkan pada halaman klien/tenant.
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Nomor Telepon Hotline
                      </Text>
                      <TextInput
                        value={hotlinePhone}
                        onChangeText={setHotlinePhone}
                        style={{
                          width: '100%',
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                    </View>
                  </View>
                </View>

                {/* Panel 2: Maintenance Mode */}
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                      Mode Pemeliharaan (Maintenance)
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Kontrol akses aplikasi secara global saat sedang melakukan update server.
                    </Text>
                  </View>

                  {/* Toggle Row */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 20 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                        Aktifkan Mode Maintenance
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        Jika diaktifkan, semua pengguna (Tenant dan Staff) tidak dapat mengakses aplikasi selain Super Admin.
                      </Text>
                    </View>

                    {/* Switch Toggle Button */}
                    <TouchableOpacity
                      onPress={() => setIsMaintenance(!isMaintenance)}
                      style={{
                        width: 48,
                        height: 24,
                        borderRadius: 24,
                        backgroundColor: isMaintenance ? '#ef4444' : '#cbd5e1',
                        padding: 3,
                        justifyContent: 'center',
                        alignItems: isMaintenance ? 'flex-end' : 'flex-start',
                        cursor: 'pointer',
                      } as any}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Pesan Pemeliharaan (Akan muncul di layar login user)
                    </Text>
                    <TextInput
                      value={maintenanceMessage}
                      onChangeText={setMaintenanceMessage}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                {/* Panel 3: Integrasi Layanan External */}
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                      Integrasi Layanan External
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Konfigurasi API Key untuk layanan pihak ketiga yang digunakan oleh sistem.
                    </Text>
                  </View>

                  {/* Google Maps API Key */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Google Maps API Key (Untuk fitur presensi lokasi/GPS)
                    </Text>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        secureTextEntry={!showMapsKey}
                        value={googleMapsKey}
                        onChangeText={setGoogleMapsKey}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                      <TouchableOpacity
                        onPress={() => setShowMapsKey(!showMapsKey)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderRadius: 8,
                          backgroundColor: theme.subtleBg,
                          borderWidth: 1,
                          borderColor: theme.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                        } as any}
                      >
                        {showMapsKey ? <EyeOff size={18} color={theme.textMuted} /> : <Eye size={18} color={theme.textMuted} />}
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>
                      Dibutuhkan untuk melakukan *Geocoding* dan validasi radius presensi karyawan tenant.
                    </Text>
                  </View>

                  {/* Storage Provider & Max Upload Size */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: isDesktop ? 'row' : 'column',
                      gap: 20,
                      marginBottom: 25,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Provider Storage (Penyimpanan File)
                      </Text>
                      {Platform.OS === 'web' ? (
                        <select
                          value={storageProvider}
                          onChange={(e: any) => setStorageProvider(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: `1px solid ${theme.border}`,
                            borderRadius: 8,
                            outline: 'none',
                            fontSize: 14,
                            color: theme.text,
                            backgroundColor: theme.subtleBg,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="aws">Amazon S3</option>
                          <option value="gcp">Google Cloud Storage</option>
                          <option value="local">Local Server</option>
                        </select>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {(['local', 'aws', 'gcp'] as const).map((pr) => (
                            <TouchableOpacity
                              key={pr}
                              onPress={() => setStorageProvider(pr)}
                              style={{
                                flex: 1,
                                padding: 10,
                                borderRadius: 8,
                                backgroundColor: storageProvider === pr ? theme.accent : theme.subtleBg,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 12, color: storageProvider === pr ? '#fff' : theme.text }}>
                                {pr.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                        Batas Maksimal Upload (Per File)
                      </Text>
                      {Platform.OS === 'web' ? (
                        <select
                          value={maxUploadSize}
                          onChange={(e: any) => setMaxUploadSize(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: `1px solid ${theme.border}`,
                            borderRadius: 8,
                            outline: 'none',
                            fontSize: 14,
                            color: theme.text,
                            backgroundColor: theme.subtleBg,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="2">2 MB</option>
                          <option value="5">5 MB</option>
                          <option value="10">10 MB</option>
                        </select>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {(['2', '5', '10'] as const).map((sz) => (
                            <TouchableOpacity
                              key={sz}
                              onPress={() => setMaxUploadSize(sz)}
                              style={{
                                flex: 1,
                                padding: 10,
                                borderRadius: 8,
                                backgroundColor: maxUploadSize === sz ? theme.accent : theme.subtleBg,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 12, color: maxUploadSize === sz ? '#fff' : theme.text }}>
                                {sz} MB
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: 15,
                      marginTop: 30,
                      paddingTop: 20,
                      borderTopWidth: 1,
                      borderTopColor: theme.border,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setAppName('YexsSync');
                        setAppDomain('https://yexssync.yexsx.my.id');
                        setSupportEmail('azizsework@gmail.com');
                        setHotlinePhone('+62 811-2233-4455');
                        setIsMaintenance(false);
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.border,
                        cursor: 'pointer',
                      } as any}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>Batal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSave('Identitas & Konfigurasi Umum')}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        backgroundColor: theme.accent,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                      } as any}
                    >
                      <Save size={16} color="#ffffff" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                        Simpan Pengaturan Global
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* TAB 2: PAYMENT GATEWAY */}
            {activeTab === 'payment' && (
              <View
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 25,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                    Integrasi Payment Gateway
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    Konfigurasi kunci API dan callback webhook untuk pemrosesan langganan tenant secara otomatis.
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Penyedia Gateway
                    </Text>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                      {[
                        { key: 'midtrans', label: 'Midtrans Snap' },
                        { key: 'xendit', label: 'Xendit Invoice' },
                      ].map((gw) => (
                        <TouchableOpacity
                          key={gw.key}
                          onPress={() => setPaymentProvider(gw.key as any)}
                          style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 8,
                            backgroundColor: paymentProvider === gw.key ? theme.accent : theme.subtleBg,
                            borderWidth: 1,
                            borderColor: paymentProvider === gw.key ? theme.accent : theme.border,
                            alignItems: 'center',
                            cursor: 'pointer',
                          } as any}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: paymentProvider === gw.key ? '#fff' : theme.text }}>
                            {gw.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Environment
                    </Text>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                      {[
                        { key: 'sandbox', label: 'Sandbox (Testing)' },
                        { key: 'production', label: 'Production (Live)' },
                      ].map((env) => (
                        <TouchableOpacity
                          key={env.key}
                          onPress={() => setPaymentEnvironment(env.key as any)}
                          style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 8,
                            backgroundColor: paymentEnvironment === env.key ? theme.accent : theme.subtleBg,
                            borderWidth: 1,
                            borderColor: paymentEnvironment === env.key ? theme.accent : theme.border,
                            alignItems: 'center',
                            cursor: 'pointer',
                          } as any}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: paymentEnvironment === env.key ? '#fff' : theme.text }}>
                            {env.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                    Merchant ID
                  </Text>
                  <TextInput
                    value={merchantId}
                    onChangeText={setMerchantId}
                    style={{
                      width: '100%',
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                    Client Key (Public)
                  </Text>
                  <TextInput
                    value={clientKey}
                    onChangeText={setClientKey}
                    style={{
                      width: '100%',
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                </View>

                <View style={{ marginBottom: 25 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                    Server Key (Private / Secret)
                  </Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      secureTextEntry={!showServerKey}
                      value={serverKey}
                      onChangeText={setServerKey}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                    <TouchableOpacity
                      onPress={() => setShowServerKey(!showServerKey)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderRadius: 8,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                      } as any}
                    >
                      {showServerKey ? <EyeOff size={18} color={theme.textMuted} /> : <Eye size={18} color={theme.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save button */}
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 15,
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleSave('Payment Gateway')}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      backgroundColor: theme.accent,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Save size={16} color="#ffffff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Simpan Pengaturan Pembayaran
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 3: SMTP & EMAIL */}
            {activeTab === 'smtp' && (
              <View
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 25,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                    Server Email & Protokol SMTP
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    Digunakan untuk pengiriman tagihan invoice otomatis, reset password, dan notifikasi keamanan.
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 20 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      SMTP Host
                    </Text>
                    <TextInput
                      value={smtpHost}
                      onChangeText={setSmtpHost}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Port
                    </Text>
                    <TextInput
                      value={smtpPort}
                      onChangeText={setSmtpPort}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      SMTP Username
                    </Text>
                    <TextInput
                      value={smtpUser}
                      onChangeText={setSmtpUser}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      SMTP Password
                    </Text>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        secureTextEntry={!showSmtpPass}
                        value={smtpPass}
                        onChangeText={setSmtpPass}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                        } as any}
                      />
                      <TouchableOpacity
                        onPress={() => setShowSmtpPass(!showSmtpPass)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderRadius: 8,
                          backgroundColor: theme.subtleBg,
                          borderWidth: 1,
                          borderColor: theme.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                        } as any}
                      >
                        {showSmtpPass ? <EyeOff size={18} color={theme.textMuted} /> : <Eye size={18} color={theme.textMuted} />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 25 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Nama Pengirim (Sender Name)
                    </Text>
                    <TextInput
                      value={senderName}
                      onChangeText={setSenderName}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Email Pengirim (Sender Email)
                    </Text>
                    <TextInput
                      value={senderEmail}
                      onChangeText={setSenderEmail}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => alert('Email uji coba berhasil dikirim ke ' + (user?.email || 'azizsework@gmail.com'))}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: theme.subtleBg,
                      borderWidth: 1,
                      borderColor: theme.border,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>
                      Kirim Email Uji Coba (Test Mail)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSave('SMTP & Email')}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      backgroundColor: theme.accent,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Save size={16} color="#ffffff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Simpan Konfigurasi SMTP
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 4: KEAMANAN & KEBIJAKAN */}
            {activeTab === 'security' && (
              <View
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 25,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                    Keamanan & Kebijakan Akses
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    Kontrol otentikasi multi-faktor, batas percobaan login, dan durasi sesi aktif.
                  </Text>
                </View>

                {/* 2FA Enforcement */}
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                      Wajibkan 2FA (Two-Factor Authentication)
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>
                      Semua akun berlevel Super Admin wajib memverifikasi OTP Authenticator saat masuk.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEnforce2FA(!enforce2FA)}
                    style={{
                      width: 48,
                      height: 24,
                      borderRadius: 24,
                      backgroundColor: enforce2FA ? '#10b981' : '#cbd5e1',
                      padding: 3,
                      justifyContent: 'center',
                      alignItems: enforce2FA ? 'flex-end' : 'flex-start',
                      cursor: 'pointer',
                    } as any}
                  >
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ffffff' }} />
                  </TouchableOpacity>
                </View>

                {/* Max Login Attempts & Lockout */}
                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginVertical: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Maksimal Percobaan Login Gagal
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={maxLoginAttempts}
                      onChangeText={setMaxLoginAttempts}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Akun dikunci sementara setelah melebihi batas ini.
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Durasi Kunci Akun (Menit)
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={lockoutMinutes}
                      onChangeText={setLockoutMinutes}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                  </View>
                </View>

                {/* Session Timeout */}
                <View style={{ marginBottom: 25 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                    Batas Waktu Sesi Tidak Aktif (Menit)
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={sessionTimeoutMinutes}
                    onChangeText={setSessionTimeoutMinutes}
                    style={{
                      width: '100%',
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.subtleBg,
                    } as any}
                  />
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    Sesi login Super Admin akan logout otomatis setelah waktu ini jika tidak ada interaksi.
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleSave('Keamanan & Kebijakan')}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      backgroundColor: theme.accent,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Save size={16} color="#ffffff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Simpan Kebijakan Keamanan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 5: BACKUP & STORAGE */}
            {activeTab === 'backup' && (
              <View
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 25,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 5 }}>
                    Backup Database & Retensi Storage
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    Kelola jadwal snapshot basis data PostgreSQL serta kebijakan retensi file arsip presensi.
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: theme.subtleBg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Snapshot Database Terakhir:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981', marginTop: 3 }}>
                    {lastBackupStatus}
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Jadwal Pencadangan Otomatis
                    </Text>
                    {Platform.OS === 'web' ? (
                      <select
                        value={backupSchedule}
                        onChange={(e: any) => setBackupSchedule(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 15px',
                          border: `1px solid ${theme.border}`,
                          borderRadius: 8,
                          outline: 'none',
                          fontSize: 14,
                          color: theme.text,
                          backgroundColor: theme.subtleBg,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="hourly">Setiap 6 Jam</option>
                        <option value="daily">Harian (Pukul 03:00 WIB)</option>
                        <option value="weekly">Mingguan (Hari Minggu)</option>
                      </select>
                    ) : (
                      <TextInput
                        value={backupSchedule}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.border,
                          color: theme.text,
                        }}
                      />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Masa Retensi Arsip (Hari)
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={backupRetentionDays}
                      onChangeText={setBackupRetentionDays}
                      style={{
                        width: '100%',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: theme.text,
                        backgroundColor: theme.subtleBg,
                      } as any}
                    />
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Arsip cadangan lebih dari masa ini akan dibersihkan otomatis.
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => alert('Proses snapshot database dimulai di latar belakang...')}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: theme.subtleBg,
                      borderWidth: 1,
                      borderColor: theme.border,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.accent }}>
                      Cadangkan Database Sekarang (Backup Now)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSave('Backup & Storage')}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      backgroundColor: theme.accent,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <Save size={16} color="#ffffff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Simpan Jadwal Backup
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL NOTIFIKASI */}
      {showNotifModal && (
        <Modal transparent animationType="fade" visible={showNotifModal} onRequestClose={() => setShowNotifModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 450,
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} color={theme.accent} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Notifikasi Pengaturan</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <View style={{ padding: 12, borderRadius: 8, backgroundColor: theme.infoBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.infoText }}>
                    Sistem Beroperasi Normal
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 2 }}>
                    Seluruh integrasi API Google Maps dan payment gateway aktif tanpa kendala.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowNotifModal(false)}
                style={{
                  marginTop: 18,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: theme.subtleBg,
                  alignItems: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>Tutup Notifikasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
