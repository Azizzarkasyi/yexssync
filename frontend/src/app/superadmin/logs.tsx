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
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Download,
  FileCode,
  Sun,
  Moon,
  Copy,
  Check,
  Calendar,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';

export interface SystemLogItem {
  id: string;
  time: string;
  date: string;
  level: 'ERROR' | 'WARNING' | 'SUCCESS' | 'CRITICAL' | 'INFO';
  module: string;
  moduleKey: 'auth' | 'billing' | 'tenant' | 'system';
  description: string;
  userText: string;
  userSubtext?: string;
  ip: string;
  payload: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
    stackTrace?: string;
  };
}

export default function SuperAdminLogsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  // Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Filter & Search states
  const [logs] = useState<SystemLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-09-08');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'auth' | 'billing' | 'tenant' | 'system'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Payload Detail
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [activeLog, setActiveLog] = useState<SystemLogItem | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      router.replace('/auth/login');
    }
  };

  const handleOpenPayload = (log: SystemLogItem) => {
    setActiveLog(log);
    setCopiedPayload(false);
    setShowPayloadModal(true);
  };

  const handleCopyPayload = () => {
    if (!activeLog) return;
    const jsonStr = JSON.stringify(activeLog.payload, null, 2);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      alert('Payload JSON disalin ke clipboard.');
    }
  };

  // Export Logs to CSV
  const handleExportCSV = () => {
    try {
      const header = 'Waktu,Level,Modul,Deskripsi,Pengguna,Subtext,IP Address\n';
      const rows = filteredLogs
        .map(
          (l) =>
            `"${l.time}","${l.level}","${l.module}","${l.description.replace(/"/g, '""')}","${l.userText}","${l.userSubtext || ''}","${l.ip}"`
        )
        .join('\n');
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI(header + rows);

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Log_Sistem_HadirYuk_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Fitur unduh CSV diaktifkan pada web browser.');
      }
    } catch (err: any) {
      showError('Ekspor Gagal', 'Gagal mengunduh CSV: ' + err.message);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      log.description.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.userText.toLowerCase().includes(q) ||
      (log.userSubtext && log.userSubtext.toLowerCase().includes(q)) ||
      log.ip.toLowerCase().includes(q) ||
      log.time.toLowerCase().includes(q);

    const matchesDate = !dateFilter || log.date === dateFilter;

    let matchesLevel = true;
    if (levelFilter !== 'all') {
      matchesLevel = log.level.toLowerCase() === levelFilter.toLowerCase();
    }

    let matchesModule = true;
    if (moduleFilter !== 'all') {
      matchesModule = log.moduleKey === moduleFilter;
    }

    return matchesSearch && matchesDate && matchesLevel && matchesModule;
  });

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: theme.bg }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/logs"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: isDesktop ? 25 : 15, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Header / Topbar */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 20,
            marginBottom: 20,
            backgroundColor: theme.bg,
            zIndex: 10,
          }}
        >
          {/* Page Title & Hamburger */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => setIsMobileMenuOpen(true)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Menu size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                Log Sistem & Audit Trail
              </Text>
            </View>
          </View>

          {/* Topbar Right */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {/* Search Bar (width: 300px) */}
            {isDesktop && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.cardBg,
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.border,
                  width: 300,
                }}
              >
                <Search size={16} color={theme.textMuted} />
                <TextInput
                  placeholder="Cari event, user, atau IP Address..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    borderWidth: 0,
                    outline: 'none',
                    marginLeft: 10,
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: 13,
                    color: theme.text,
                  } as any}
                />
              </View>
            )}

            {/* Theme Toggle Button */}
            <TouchableOpacity
              onPress={theme.toggleTheme}
              title={theme.isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              } as any}
            >
              {theme.isDark ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color={theme.textMuted} />
              )}
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => setShowNotifModal(true)}
              style={{ position: 'relative', cursor: 'pointer' } as any}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} color={theme.textMuted} />
              </View>
            </TouchableOpacity>

            {/* User Profile Pill */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: theme.cardBg,
                  paddingVertical: 5,
                  paddingLeft: 5,
                  paddingRight: 15,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: theme.border,
                  cursor: 'pointer',
                } as any}
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                />
                <View style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    {user?.name || 'Andi Setiawan'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '500' }}>
                    Super Admin
                  </Text>
                </View>
                <ChevronDown size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <View
                  style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    width: 210,
                    backgroundColor: theme.cardBg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5,
                    padding: 8,
                    zIndex: 50,
                  }}
                >
                  <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                      {user?.email || 'andi.setiawan@hadiryuk.id'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Hak Akses Penuh</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfileDropdown(false);
                      router.push('/superadmin');
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <PieChart size={15} color={theme.textMuted} />
                    <Text style={{ fontSize: 13, color: theme.text }}>Dashboard Ikhtisar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      marginTop: 4,
                      cursor: 'pointer',
                    } as any}
                  >
                    <LogOut size={15} color="#ef4444" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Keluar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Mobile Search Bar */}
        {!isDesktop && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.cardBg,
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 20,
            }}
          >
            <Search size={16} color={theme.textMuted} />
            <TextInput
              placeholder="Cari event, user, atau IP Address..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                borderWidth: 0,
                outline: 'none',
                marginLeft: 10,
                backgroundColor: 'transparent',
                flex: 1,
                fontSize: 13,
                color: theme.text,
              } as any}
            />
          </View>
        )}

        {/* Actions Toolbar (.action-toolbar) */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'center' : 'stretch',
            backgroundColor: theme.cardBg,
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 20,
            gap: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Filters (.filters) */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            {/* Filter Date */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e: any) => setDateFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    outline: 'none',
                    color: theme.text,
                    backgroundColor: theme.subtleBg,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 6,
                    backgroundColor: theme.subtleBg,
                  }}
                >
                  <Calendar size={14} color={theme.textMuted} />
                  <Text style={{ fontSize: 13, color: theme.text }}>{dateFilter}</Text>
                </View>
              )}
            </View>

            {/* Filter Level */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <select
                  value={levelFilter}
                  onChange={(e: any) => setLevelFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    outline: 'none',
                    color: theme.text,
                    backgroundColor: theme.subtleBg,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Level</option>
                  <option value="info">INFO</option>
                  <option value="warning">WARNING</option>
                  <option value="error">ERROR</option>
                  <option value="critical">CRITICAL</option>
                </select>
              ) : (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    backgroundColor: theme.subtleBg,
                    padding: 3,
                    borderRadius: 6,
                  }}
                >
                  {(['all', 'info', 'warning', 'error', 'critical'] as const).map((lv) => (
                    <TouchableOpacity
                      key={lv}
                      onPress={() => setLevelFilter(lv)}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                        backgroundColor: levelFilter === lv ? theme.cardBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: levelFilter === lv ? theme.accent : theme.textMuted,
                          textTransform: 'uppercase',
                        }}
                      >
                        {lv === 'all' ? 'Semua' : lv}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Filter Modul */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <select
                  value={moduleFilter}
                  onChange={(e: any) => setModuleFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    outline: 'none',
                    color: theme.text,
                    backgroundColor: theme.subtleBg,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Modul</option>
                  <option value="auth">Autentikasi</option>
                  <option value="billing">Billing / Payment</option>
                  <option value="tenant">Manajemen Tenant</option>
                  <option value="system">Sistem Core</option>
                </select>
              ) : (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    backgroundColor: theme.subtleBg,
                    padding: 3,
                    borderRadius: 6,
                  }}
                >
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'auth', label: 'Auth' },
                    { key: 'billing', label: 'Billing' },
                    { key: 'tenant', label: 'Tenant' },
                    { key: 'system', label: 'Core' },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setModuleFilter(m.key as any)}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                        backgroundColor: moduleFilter === m.key ? theme.cardBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: moduleFilter === m.key ? theme.accent : theme.textMuted,
                        }}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Right Button: Unduh Log (.csv) */}
          <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={handleExportCSV}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.border,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              } as any}
            >
              <Download size={14} color={theme.text} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>
                Unduh Log (.csv)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Panel Table (.panel) */}
        <View
          style={{
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <View style={{ minWidth: 920, width: '100%', flex: 1 }}>
              {/* Table Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.border,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <View style={{ width: 150, paddingRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    WAKTU (WIB)
                  </Text>
                </View>
                <View style={{ width: 110, paddingRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    LEVEL
                  </Text>
                </View>
                <View style={{ width: 140, paddingRight: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    MODUL
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 260, paddingRight: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    DESKRIPSI EVENT (AKTIVITAS)
                  </Text>
                </View>
                <View style={{ width: 180, paddingRight: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    PENGGUNA / TENANT ID
                  </Text>
                </View>
                <View style={{ width: 130, paddingRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    IP ADDRESS
                  </Text>
                </View>
                <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textAlign: 'center', textTransform: 'uppercase' }}>
                    DETAIL
                  </Text>
                </View>
              </View>

              {/* Table Rows */}
              {filteredLogs.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={40} color={theme.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                    Tidak ada log sistem yang cocok dengan filter
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                    Coba sesuaikan tanggal, filter level atau modul Anda.
                  </Text>
                </View>
              ) : (
                filteredLogs.map((log, index) => {
                  const isCritical = log.level === 'CRITICAL';
                  const rowBg = isCritical
                    ? theme.isDark
                      ? '#450a0a33'
                      : '#fef2f2'
                    : theme.cardBg;

                  return (
                    <View
                      key={log.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        borderBottomWidth: index === filteredLogs.length - 1 ? 0 : 1,
                        borderBottomColor: theme.border,
                        backgroundColor: rowBg,
                      }}
                    >
                      {/* Waktu */}
                      <View style={{ width: 150, paddingRight: 10 }}>
                        <Text
                          style={{
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            fontWeight: '600',
                            fontSize: 13,
                            color: isCritical ? '#ef4444' : theme.textSecondary,
                          }}
                        >
                          {log.time}
                        </Text>
                      </View>

                      {/* Level */}
                      <View style={{ width: 110, paddingRight: 10 }}>
                        <View
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 20,
                            minWidth: 80,
                            alignItems: 'center',
                            alignSelf: 'flex-start',
                            backgroundColor:
                              log.level === 'CRITICAL'
                                ? '#ef4444'
                                : log.level === 'ERROR'
                                ? theme.dangerBg
                                : log.level === 'WARNING'
                                ? theme.warningBg
                                : log.level === 'SUCCESS'
                                ? theme.successBg
                                : theme.infoBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color:
                                log.level === 'CRITICAL'
                                  ? '#ffffff'
                                  : log.level === 'ERROR'
                                  ? theme.dangerText
                                  : log.level === 'WARNING'
                                  ? '#d97706'
                                  : log.level === 'SUCCESS'
                                  ? theme.successText
                                  : theme.infoText,
                            }}
                          >
                            {log.level}
                          </Text>
                        </View>
                      </View>

                      {/* Modul */}
                      <View style={{ width: 140, paddingRight: 12 }}>
                        <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 }}>
                          {log.module}
                        </Text>
                      </View>

                      {/* Deskripsi Event */}
                      <View style={{ flex: 1, minWidth: 260, paddingRight: 16 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: isCritical ? '#ef4444' : theme.textMuted,
                            fontWeight: isCritical ? '500' : '400',
                            lineHeight: 18,
                          }}
                        >
                          {log.description}
                        </Text>
                      </View>

                      {/* Pengguna / Tenant ID */}
                      <View style={{ width: 180, paddingRight: 12 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: log.userSubtext ? '500' : '400',
                            color: log.userSubtext ? theme.text : theme.textMuted,
                          }}
                        >
                          {log.userText}
                        </Text>
                        {log.userSubtext && (
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                            {log.userSubtext}
                          </Text>
                        )}
                      </View>

                      {/* IP Address */}
                      <View style={{ width: 130, paddingRight: 10 }}>
                        <Text
                          style={{
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            color: theme.textMuted,
                            fontSize: 12,
                            backgroundColor: theme.subtleBg,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: theme.border,
                            alignSelf: 'flex-start',
                          }}
                        >
                          {log.ip}
                        </Text>
                      </View>

                      {/* Detail Button */}
                      <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity
                          onPress={() => handleOpenPayload(log)}
                          title="Lihat Payload Lengkap"
                          style={{
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: theme.subtleBg,
                            borderWidth: 1,
                            borderColor: theme.border,
                          } as any}
                        >
                          <FileCode size={16} color={isCritical ? '#ef4444' : theme.primaryBlue} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Pagination */}
          <View
            style={{
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'flex-start',
              gap: 12,
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Menampilkan {filteredLogs.length > 0 ? '1 - ' + filteredLogs.length : '0'} dari {logs.length} Log Record
            </Text>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity
                disabled
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                }}
              >
                <ChevronLeft size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(1)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.accent,
                  backgroundColor: theme.accent,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(2)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>2</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(3)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>3</Text>
              </TouchableOpacity>

              <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>...</Text>
              </View>

              <TouchableOpacity
                style={{
                  width: 44,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>2097</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <ChevronRight size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL: DETAIL PAYLOAD LENGKAP */}
      {showPayloadModal && activeLog && (
        <Modal
          transparent
          animationType="fade"
          visible={showPayloadModal}
          onRequestClose={() => setShowPayloadModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.65)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 720,
                maxHeight: '90%',
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <FileCode size={20} color={theme.accent} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    Payload Audit Trail & Stack Trace
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowPayloadModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Meta details */}
                <View
                  style={{
                    backgroundColor: theme.subtleBg,
                    padding: 14,
                    borderRadius: 8,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Waktu & Tanggal:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{activeLog.time}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Modul / Sumber:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.accent }}>{activeLog.module}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Tingkat (Level):</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color:
                          activeLog.level === 'CRITICAL' || activeLog.level === 'ERROR'
                            ? '#ef4444'
                            : activeLog.level === 'WARNING'
                            ? '#d97706'
                            : '#10b981',
                      }}
                    >
                      {activeLog.level}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Pengguna / Actor:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                      {activeLog.userText} {activeLog.userSubtext ? `(${activeLog.userSubtext})` : ''}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>IP Address:</Text>
                    <Text style={{ fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.text }}>
                      {activeLog.ip}
                    </Text>
                  </View>
                </View>

                {/* Event Description */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                  Deskripsi Event:
                </Text>
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                    {activeLog.description}
                  </Text>
                </View>

                {/* Raw JSON Payload */}
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                    JSON Payload Detail:
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyPayload}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      backgroundColor: theme.subtleBg,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: theme.border,
                      cursor: 'pointer',
                    } as any}
                  >
                    {copiedPayload ? <Check size={13} color="#10b981" /> : <Copy size={13} color={theme.text} />}
                    <Text style={{ fontSize: 12, color: copiedPayload ? '#10b981' : theme.text }}>
                      {copiedPayload ? 'Tersalin!' : 'Salin JSON'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    backgroundColor: theme.isDark ? '#020617' : '#0f172a',
                    padding: 16,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontSize: 12,
                      color: '#38bdf8',
                      lineHeight: 18,
                    }}
                  >
                    {JSON.stringify(activeLog.payload, null, 2)}
                  </Text>
                </View>

                {/* Stack Trace if available */}
                {activeLog.payload?.stackTrace && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444', marginBottom: 6 }}>
                      Stack Trace Exception:
                    </Text>
                    <View
                      style={{
                        backgroundColor: theme.isDark ? '#1c0707' : '#fff1f2',
                        padding: 14,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#fecdd3',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                          fontSize: 11,
                          color: '#b91c1c',
                          lineHeight: 16,
                        }}
                      >
                        {activeLog.payload.stackTrace}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowPayloadModal(false)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    borderRadius: 6,
                    backgroundColor: theme.accent,
                    cursor: 'pointer',
                  } as any}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Notifikasi Audit Log</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <View style={{ padding: 12, borderRadius: 8, backgroundColor: theme.dangerBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.dangerText }}>
                    Alert Kritis: Database Replikator Terputus
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 2 }}>
                    Layanan pemantauan mendeteksi kegagalan koneksi TCP ke replika Postgres.
                  </Text>
                </View>
                <View style={{ padding: 12, borderRadius: 8, backgroundColor: theme.warningBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#d97706' }}>
                    Peringatan Keamanan: Percobaan Login Gagal
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 2 }}>
                    5 kali percobaan salah dari IP 114.122.55.12 untuk akun Maju Djaya.
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
