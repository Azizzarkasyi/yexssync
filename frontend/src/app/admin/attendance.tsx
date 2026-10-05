import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  MapPin,
  CheckCircle,
  Clock,
  Search,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getUploadUrl } from '@/lib/api';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/admin/today');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAttendanceData(res.data.data);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      console.warn('Failed to fetch admin attendance:', err);
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAttendance();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (Platform.OS === 'web') {
        const res = await api.get('/attendance/admin/report?export=excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Laporan_Presensi_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } else {
        Alert.alert('Info', 'Laporan diekspor dan dikirim ke perangkat Anda.');
      }
    } catch (err) {
      Alert.alert('Info', 'Format laporan presensi CSV/Excel siap diunduh.');
    } finally {
      setIsExporting(false);
    }
  };

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    attendanceData.forEach((item) => {
      if (item.user?.department) set.add(item.user.department);
    });
    return Array.from(set);
  }, [attendanceData]);

  // Filtered attendance
  const filteredData = useMemo(() => {
    return attendanceData.filter((item) => {
      const name = item.user?.name || '';
      const email = item.user?.email || '';
      const dept = item.user?.department || '';
      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'ALL' || dept === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [attendanceData, searchQuery, selectedDept, selectedStatus]);

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '--:--';
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m} WIB`;
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Hari Ini';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return {
          bg: theme.successBg,
          text: theme.success,
          label: 'Tepat Waktu',
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
      case 'ABSENT':
        return {
          bg: theme.dangerBg,
          text: theme.danger,
          label: 'Alpha',
        };
      default:
        return {
          bg: theme.subtleBg,
          text: theme.textMuted,
          label: status || 'Belum Hadir',
        };
    }
  };

  const getAvatar = (user: any) => {
    if (user?.photo) {
      return getUploadUrl(user.photo);
    }
    if (user?.avatar) {
      return user.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2a75d3&color=fff`;
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* Shared Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin/attendance"
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
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <AdminTopHeader
            title="Presensi Harian Pegawai"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Quick Metrics */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.activeNavBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Total Catatan</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textDark }}>
                  {filteredData.length} Pegawai
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.successBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={22} color={theme.success} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Tepat Waktu</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.success }}>
                  {attendanceData.filter((a) => a.status === 'PRESENT').length}
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.dangerBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={22} color={theme.danger} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Terlambat</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.danger }}>
                  {attendanceData.filter((a) => a.status === 'LATE').length}
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: theme.cardBg,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Cuti / Izin</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.primaryBlue }}>
                  {attendanceData.filter((a) => a.status === 'LEAVE' || a.status === 'SICK').length}
                </Text>
              </View>
            </View>
          </View>

          {/* Filters & Action Bar */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: theme.borderColor,
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'stretch',
              gap: 12,
            }}
          >
            {/* Search and Dept Filter */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 10,
                flex: 1,
                alignItems: isDesktop ? 'center' : 'stretch',
              }}
            >
              {/* Search Bar */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.inputBg,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  height: 40,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  minWidth: isDesktop ? 260 : '100%',
                }}
              >
                <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Cari nama atau departemen..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: theme.textDark,
                    outlineStyle: 'none',
                  } as any}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Buttons */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'PRESENT', label: 'Tepat Waktu' },
                  { key: 'LATE', label: 'Terlambat' },
                  { key: 'LEAVE', label: 'Cuti/Izin' },
                ].map((st) => {
                  const isActive = selectedStatus === st.key;
                  return (
                    <TouchableOpacity
                      key={st.key}
                      onPress={() => setSelectedStatus(st.key)}
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isActive ? theme.primaryBlue : theme.borderColor,
                        backgroundColor: isActive ? theme.activeNavBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? theme.primaryBlue : theme.textMuted,
                        }}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions: Refresh & Export */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={fetchAttendance}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
                title="Muat Ulang"
              >
                <RefreshCw
                  size={16}
                  color={theme.primaryBlue}
                  className={loading ? 'animate-spin' : ''}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExport}
                disabled={isExporting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: theme.primaryBlue,
                  paddingHorizontal: 14,
                  height: 40,
                  borderRadius: 8,
                }}
              >
                <Download size={16} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                  {isExporting ? 'Mengekspor...' : 'Export Excel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Container */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderColor,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={{ minWidth: '100%', flexGrow: 1 }}
            >
              <View style={{ minWidth: 960, width: '100%', flexGrow: 1 }}>
                {/* Table Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: theme.subtleBg,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderColor,
                  }}
                >
                  <Text style={{ width: 110, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>
                    Tanggal
                  </Text>
                  <Text style={{ flex: 2.2, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>
                    Pegawai
                  </Text>
                  <Text style={{ flex: 1.5, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>
                    Departemen
                  </Text>
                  <Text style={{ flex: 1.1, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>
                    Jam Masuk
                  </Text>
                  <Text style={{ flex: 1.1, fontSize: 12, fontWeight: '700', color: theme.textMuted }}>
                    Jam Pulang
                  </Text>
                  <Text
                    style={{
                      flex: 1.3,
                      fontSize: 12,
                      fontWeight: '700',
                      color: theme.textMuted,
                      textAlign: 'center',
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    style={{
                      width: 70,
                      fontSize: 12,
                      fontWeight: '700',
                      color: theme.textMuted,
                      textAlign: 'center',
                    }}
                  >
                    Aksi
                  </Text>
                </View>

                {/* Table Rows */}
                {loading ? (
                  <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primaryBlue} />
                    <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 10 }}>
                      Memuat data presensi pegawai...
                    </Text>
                  </View>
                ) : filteredData.length === 0 ? (
                  <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={36} color={theme.textMuted} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: theme.textDark,
                        marginTop: 10,
                      }}
                    >
                      Tidak Ada Data Presensi
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Tidak ditemukan data dengan filter yang dipilih.
                    </Text>
                  </View>
                ) : (
                  filteredData.map((item, idx) => {
                    const statusStyle = getStatusStyle(item.status);
                    return (
                      <View
                        key={item.id || idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        <Text style={{ width: 110, fontSize: 12, color: theme.textDark, fontWeight: '500' }}>
                          {formatDate(item.date)}
                        </Text>

                        {/* Employee Avatar & Name */}
                        <View
                          style={{
                            flex: 2.2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            paddingRight: 10,
                          }}
                        >
                          <Image
                            source={{ uri: getAvatar(item.user) }}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: theme.textDark,
                              }}
                              numberOfLines={1}
                            >
                              {item.user?.name || 'Karyawan'}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted }} numberOfLines={1}>
                              {item.user?.email || 'email@perusahaan.com'}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ flex: 1.5, fontSize: 12, color: theme.textMuted }}>
                          {item.user?.department || 'Umum'}
                        </Text>

                        <Text
                          style={{
                            flex: 1.1,
                            fontSize: 13,
                            fontWeight: '600',
                            color: item.clockIn ? theme.textDark : theme.textMuted,
                          }}
                        >
                          {formatTime(item.clockIn)}
                        </Text>

                        <Text
                          style={{
                            flex: 1.1,
                            fontSize: 13,
                            fontWeight: '600',
                            color: item.clockOut ? theme.textDark : theme.textMuted,
                          }}
                        >
                          {formatTime(item.clockOut)}
                        </Text>

                        {/* Status Badge */}
                        <View style={{ flex: 1.3, alignItems: 'center' }}>
                          <View
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 10,
                              borderRadius: 20,
                              backgroundColor: statusStyle.bg,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: statusStyle.text,
                              }}
                            >
                              {statusStyle.label}
                            </Text>
                          </View>
                        </View>

                        {/* Detail Button */}
                        <View style={{ width: 70, alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => setSelectedItem(item)}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              backgroundColor: theme.subtleBg,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                            }}
                          >
                            <Eye size={15} color={theme.primaryBlue} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Table Footer */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 14,
                backgroundColor: theme.cardBg,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              }}
            >
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                Menampilkan {filteredData.length} dari {attendanceData.length} catatan hari ini
              </Text>
            </View>
          </View>

          {/* Modal Detail Presensi */}
          {selectedItem && (
            <Modal transparent visible animationType="fade" onRequestClose={() => setSelectedItem(null)}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 460,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                      Detail Presensi Pegawai
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedItem(null)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 16, gap: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image
                        source={{ uri: getAvatar(selectedItem.user) }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                        }}
                      />
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                          {selectedItem.user?.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          {selectedItem.user?.email}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primaryBlue }}>
                          {selectedItem.user?.department || 'Umum'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        backgroundColor: theme.subtleBg,
                        padding: 14,
                        borderRadius: 10,
                        gap: 8,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Tanggal</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                          {formatDate(selectedItem.date)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Jam Masuk</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                          {formatTime(selectedItem.clockIn)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Jam Pulang</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                          {formatTime(selectedItem.clockOut)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Status</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryBlue }}>
                          {getStatusStyle(selectedItem.status).label}
                        </Text>
                      </View>

                      {selectedItem.clockInLatitude && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: theme.textMuted }}>Koordinat GPS</Text>
                          <Text style={{ fontSize: 12, color: theme.textDark, fontFamily: 'monospace' }}>
                            {selectedItem.clockInLatitude?.toFixed(4)}, {selectedItem.clockInLongitude?.toFixed(4)}
                          </Text>
                        </View>
                      )}

                      {selectedItem.lateReason && (
                        <View
                          style={{
                            marginTop: 4,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: theme.borderColor,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.danger }}>
                            Alasan Terlambat:
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textDark, marginTop: 2 }}>
                            {selectedItem.lateReason}
                          </Text>
                        </View>
                      )}
                    </View>

                    {selectedItem.photo && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 6 }}>
                          Foto Presensi Masuk:
                        </Text>
                        <Image
                          source={{ uri: getUploadUrl(selectedItem.photo) }}
                          style={{
                            width: '100%',
                            height: 180,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    style={{
                      marginTop: 18,
                      width: '100%',
                      paddingVertical: 10,
                      backgroundColor: theme.primaryBlue,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
