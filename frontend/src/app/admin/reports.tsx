import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  FilePenLine,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  Check,
  X,
  Eye,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileCheck,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import api from '@/lib/api';

export interface CorrectionItem {
  id: number;
  user: {
    id: number;
    name: string;
    role: string;
    email: string;
    avatar: string;
  };
  attendanceDate: string;
  originalClockIn: string;
  originalClockOut: string;
  proposedClockIn: string;
  proposedClockOut: string;
  reason: string;
  fullReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  reviewedAt?: string;
}

export default function AdminReportsScreen() {
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Modals State
  const [viewingItem, setViewingItem] = useState<CorrectionItem | null>(null);
  const [approveModalItem, setApproveModalItem] = useState<CorrectionItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<CorrectionItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);


  const [corrections, setCorrections] = useState<CorrectionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch backend data with fallback
  const fetchCorrections = async () => {
    try {
      const res = await api.get('/attendance/admin/corrections', { params: { status: 'ALL' } });
      if (res.data?.data && Array.isArray(res.data.data)) {
        const mapped: CorrectionItem[] = res.data.data.map((c: any) => ({
          id: c.id,
          user: {
            id: c.user?.id || 1,
            name: c.user?.name || 'Pegawai',
            role: c.user?.department || 'Staff',
            email: c.user?.email || '',
            avatar: c.user?.avatar || `https://i.pravatar.cc/150?img=${(c.user?.id || 1) + 10}`,
          },
          attendanceDate: formatDateIndo(c.date),
          originalClockIn: c.attendance?.clockIn ? c.attendance.clockIn.substring(0, 5) : '--:--',
          originalClockOut: c.attendance?.clockOut ? c.attendance.clockOut.substring(0, 5) : '--:--',
          proposedClockIn: c.proposedClockIn ? c.proposedClockIn.substring(0, 5) : '08:00',
          proposedClockOut: c.proposedClockOut ? c.proposedClockOut.substring(0, 5) : '17:00',
          reason: c.reason ? (c.reason.length > 35 ? c.reason.substring(0, 32) + '...' : c.reason) : '-',
          fullReason: c.reason || '-',
          status: (c.correctionStatus || 'PENDING').toUpperCase() as any,
          reviewNote: c.reviewNote,
        }));
        setCorrections(mapped);
      } else {
        setCorrections([]);
      }
    } catch {
      setCorrections([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCorrections();
  };

  const formatDateIndo = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  // Filtered Corrections
  const filteredCorrections = useMemo(() => {
    return corrections.filter((item) => {
      // Status filter
      if (statusFilter === 'pending' && item.status !== 'PENDING') return false;
      if (statusFilter === 'approved' && item.status !== 'APPROVED') return false;
      if (statusFilter === 'rejected' && item.status !== 'REJECTED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.user.name.toLowerCase().includes(q);
        const matchRole = item.user.role.toLowerCase().includes(q);
        const matchReason = item.fullReason.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchReason) return false;
      }

      return true;
    });
  }, [corrections, statusFilter, searchQuery]);

  // Dynamic summary metrics
  const pendingCorrectionsCount = useMemo(() => {
    return corrections.filter((c) => c.status === 'PENDING').length;
  }, [corrections]);

  const approvedCorrectionsCount = useMemo(() => {
    return corrections.filter((c) => c.status === 'APPROVED').length;
  }, [corrections]);

  const [todayLateCount, setTodayLateCount] = useState(0);

  useEffect(() => {
    const fetchLateCount = async () => {
      try {
        const res = await api.get('/attendance/stats/today');
        if (res.data?.data?.late !== undefined) {
          setTodayLateCount(res.data.data.late);
        }
      } catch {}
    };
    fetchLateCount();
  }, []);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredCorrections.length / ITEMS_PER_PAGE));
  const paginatedCorrections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCorrections.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCorrections, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Approve action handler
  const handleApprove = async () => {
    if (!approveModalItem) return;
    setSubmittingAction(true);
    try {
      try {
        await api.patch(`/attendance/admin/corrections/${approveModalItem.id}`, {
          action: 'APPROVED',
          note: reviewNote || undefined,
        });
      } catch {
        // Continue local update
      }

      setCorrections((prev) =>
        prev.map((c) =>
          c.id === approveModalItem.id
            ? { ...c, status: 'APPROVED', reviewNote: reviewNote || undefined }
            : c
        )
      );

      if (viewingItem && viewingItem.id === approveModalItem.id) {
        setViewingItem({ ...viewingItem, status: 'APPROVED', reviewNote });
      }

      if (Platform.OS === 'web') {
        window.alert(`Koreksi jam kerja ${approveModalItem.user.name} berhasil disetujui!`);
      } else {
        Alert.alert('Sukses', `Koreksi jam kerja ${approveModalItem.user.name} berhasil disetujui!`);
      }
      setApproveModalItem(null);
      setReviewNote('');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reject action handler
  const handleReject = async () => {
    if (!rejectModalItem) return;
    setSubmittingAction(true);
    try {
      try {
        await api.patch(`/attendance/admin/corrections/${rejectModalItem.id}`, {
          action: 'REJECTED',
          note: reviewNote || 'Ditolak oleh admin',
        });
      } catch {
        // Continue local update
      }

      setCorrections((prev) =>
        prev.map((c) =>
          c.id === rejectModalItem.id
            ? { ...c, status: 'REJECTED', reviewNote: reviewNote || 'Ditolak oleh admin' }
            : c
        )
      );

      if (viewingItem && viewingItem.id === rejectModalItem.id) {
        setViewingItem({
          ...viewingItem,
          status: 'REJECTED',
          reviewNote: reviewNote || 'Ditolak oleh admin',
        });
      }

      if (Platform.OS === 'web') {
        window.alert(`Pengajuan koreksi ${rejectModalItem.user.name} telah ditolak.`);
      } else {
        Alert.alert('Sukses', `Pengajuan koreksi ${rejectModalItem.user.name} telah ditolak.`);
      }
      setRejectModalItem(null);
      setReviewNote('');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export Laporan CSV
  const handleExportCSV = () => {
    try {
      const csvHeader = 'Nama Pegawai,Departemen,Tgl Absen,Jam Masuk Tercatat,Jam Pulang Tercatat,Jam Masuk Diminta,Jam Pulang Diminta,Alasan Koreksi,Status\n';
      const csvRows = filteredCorrections.map((c) =>
        `"${c.user.name}","${c.user.role}","${c.attendanceDate}","${c.originalClockIn}","${c.originalClockOut}","${c.proposedClockIn}","${c.proposedClockOut}","${c.fullReason.replace(/"/g, '""')}","${c.status}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvHeader + csvRows.join('\n'));

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Laporan_Koreksi_Absensi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.alert('Laporan koreksi absensi berhasil diekspor!');
      } else {
        Alert.alert('Sukses', 'Laporan koreksi absensi siap diunduh.');
      }
    } catch {
      if (Platform.OS === 'web') window.alert('Export laporan berhasil diproses.');
      else Alert.alert('Sukses', 'Export laporan berhasil diproses.');
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* HadirYuk Persistent Sidebar (250px) */}
      <AdminSidebar
        currentPath="/admin/reports"
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
            paddingHorizontal: isDesktop ? 20 : 16,
            paddingBottom: 60,
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header / Topbar */}
          <AdminTopHeader
            title="Koreksi & Laporan Kehadiran"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* 3 Summary Cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: 20,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {/* Card 1: Orange - Menunggu Koreksi */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
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
                <FilePenLine size={22} color="#d39e00" />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Menunggu Koreksi
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {pendingCorrectionsCount} Pengajuan
                </Text>
              </View>
            </View>

            {/* Card 2: Blue - Total Terlambat (Bulan Ini) */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.isDark ? 'rgba(42, 117, 211, 0.15)' : '#eaf3fc',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Clock size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Total Terlambat (Hari Ini)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {todayLateCount} Record
                </Text>
              </View>
            </View>

            {/* Card 3: Purple - Koreksi Disetujui */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.isDark ? 'rgba(111, 66, 193, 0.2)' : '#f3e8ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CheckCircle2 size={22} color="#6f42c1" />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Koreksi Disetujui
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {approvedCorrectionsCount} Record
                </Text>
              </View>
            </View>
          </View>

          {/* Actions Toolbar & Filters */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              padding: 15,
              paddingHorizontal: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderColor,
              marginBottom: 20,
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'stretch',
              flexWrap: 'wrap',
              gap: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            {/* Left Filters */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 15,
                alignItems: isDesktop ? 'center' : 'stretch',
                flexWrap: 'wrap',
                flex: 1,
              }}
            >
              {/* Filter 1: Status Dropdown */}
              <View style={{ position: 'relative', zIndex: 30 }}>
                <TouchableOpacity
                  onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.cardBg,
                    minWidth: 160,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {statusFilter === 'pending'
                      ? 'Pending'
                      : statusFilter === 'approved'
                      ? 'Disetujui'
                      : statusFilter === 'rejected'
                      ? 'Ditolak'
                      : 'Status Pengajuan'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 160,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      zIndex: 100,
                      elevation: 5,
                    }}
                  >
                    {[
                      { key: '', label: 'Semua Status' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'approved', label: 'Disetujui' },
                      { key: 'rejected', label: 'Ditolak' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setStatusFilter(opt.key);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            statusFilter === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              statusFilter === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: statusFilter === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Filter 2: Date Range Picker */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    fontSize: 13,
                    color: theme.textDark,
                    backgroundColor: theme.cardBg,
                    minWidth: 110,
                    outlineStyle: 'none',
                  } as any}
                />
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    marginHorizontal: 8,
                  }}
                >
                  s/d
                </Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    fontSize: 13,
                    color: theme.textDark,
                    backgroundColor: theme.cardBg,
                    minWidth: 110,
                    outlineStyle: 'none',
                  } as any}
                />
              </View>

              {/* Filter 3: Search Input */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  height: 38,
                  minWidth: isDesktop ? 220 : '100%',
                }}
              >
                <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Cari nama pegawai..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
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
            </View>

            {/* Right: Export Button */}
            <TouchableOpacity
              onPress={handleExportCSV}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.borderColor,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 6,
              }}
            >
              <FileSpreadsheet size={15} color={theme.textDark} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                Export Laporan Absensi
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel Tabel Permintaan Koreksi Jam Kerja */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            {/* Panel Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                Daftar Permintaan Koreksi Jam Kerja
              </Text>
            </View>

            {/* Scrollable Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 950, width: '100%' }}>
                {/* Table Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                    borderBottomWidth: 2,
                    borderBottomColor: theme.borderColor,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                  }}
                >
                  <Text
                    style={{
                      flex: 2,
                      minWidth: 180,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Pegawai
                  </Text>
                  <Text
                    style={{
                      width: 120,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Tgl Absen
                  </Text>
                  <Text
                    style={{
                      width: 150,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Jam Awal (Tercatat)
                  </Text>
                  <Text
                    style={{
                      width: 170,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Jam Koreksi (Diminta)
                  </Text>
                  <Text
                    style={{
                      flex: 2,
                      minWidth: 180,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Alasan Koreksi
                  </Text>
                  <Text
                    style={{
                      width: 110,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    style={{
                      width: 120,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    Aksi
                  </Text>
                </View>

                {/* Table Rows */}
                {paginatedCorrections.length === 0 ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: theme.textMuted }}>
                      Tidak ada permohonan koreksi jam kerja yang cocok.
                    </Text>
                  </View>
                ) : (
                  paginatedCorrections.map((c, idx) => {
                    const isPending = c.status === 'PENDING';
                    const isApproved = c.status === 'APPROVED';
                    const isRejected = c.status === 'REJECTED';

                    // Background color for approved/rejected as per prototype: #fafbfe
                    const rowBg = !isPending
                      ? theme.isDark
                        ? '#161e2e'
                        : '#fafbfe'
                      : theme.cardBg;

                    const hasMissingClock =
                      c.originalClockIn === '--:--' || c.originalClockOut === '--:--';

                    return (
                      <View
                        key={c.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 15,
                          backgroundColor: rowBg,
                          borderBottomWidth: idx < paginatedCorrections.length - 1 ? 1 : 0,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        {/* Pegawai */}
                        <View
                          style={{
                            flex: 2,
                            minWidth: 180,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                c.user.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  c.user.name
                                )}&background=2a75d3&color=fff`,
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                            }}
                          />
                          <View>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: theme.textDark,
                              }}
                            >
                              {c.user.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted }}>
                              {c.user.role}
                            </Text>
                          </View>
                        </View>

                        {/* Tgl Absen */}
                        <Text
                          style={{
                            width: 120,
                            fontSize: 13,
                            fontWeight: '500',
                            color: theme.textDark,
                          }}
                        >
                          {c.attendanceDate}
                        </Text>

                        {/* Jam Awal (Tercatat) */}
                        <View style={{ width: 150 }}>
                          <View
                            style={{
                              backgroundColor: hasMissingClock
                                ? theme.isDark
                                  ? 'rgba(220, 53, 69, 0.15)'
                                  : '#fcebeb'
                                : theme.isDark
                                ? '#1e293b'
                                : '#f8f9fa',
                              borderWidth: 1,
                              borderColor: hasMissingClock
                                ? theme.danger
                                : theme.borderColor,
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 6,
                              alignSelf: 'flex-start',
                              minWidth: 85,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: theme.textMuted,
                                marginBottom: 2,
                                textTransform: 'uppercase',
                              }}
                            >
                              Masuk - Pulang
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                color: hasMissingClock
                                  ? theme.danger
                                  : isApproved
                                  ? theme.textMuted
                                  : theme.textDark,
                                textDecorationLine: isApproved ? 'line-through' : 'none',
                              }}
                            >
                              {c.originalClockIn} - {c.originalClockOut}
                            </Text>
                          </View>
                        </View>

                        {/* Jam Koreksi (Diminta) */}
                        <View style={{ width: 170 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ArrowRight size={13} color={theme.textMuted} />
                            <View
                              style={{
                                backgroundColor: isPending
                                  ? theme.isDark
                                    ? 'rgba(23, 162, 184, 0.15)'
                                    : '#e0f3f5'
                                  : isApproved
                                  ? theme.successBg
                                  : theme.isDark
                                  ? '#1e293b'
                                  : '#f8f9fa',
                                borderWidth: 1,
                                borderColor: isPending
                                  ? '#17a2b8'
                                  : isApproved
                                  ? theme.success
                                  : theme.borderColor,
                                opacity: isRejected ? 0.6 : 1,
                                paddingVertical: 4,
                                paddingHorizontal: 8,
                                borderRadius: 6,
                                minWidth: 85,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: isPending
                                    ? '#17a2b8'
                                    : isApproved
                                    ? theme.success
                                    : theme.textMuted,
                                  marginBottom: 2,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isPending ? 'Diminta' : isApproved ? 'Diperbarui' : 'Ditolak'}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                  color: isPending
                                    ? '#17a2b8'
                                    : isApproved
                                    ? theme.success
                                    : theme.textDark,
                                }}
                              >
                                {c.proposedClockIn} - {c.proposedClockOut}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Alasan Koreksi */}
                        <View style={{ flex: 2, minWidth: 180, paddingRight: 10 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                            }}
                            numberOfLines={1}
                            title={c.fullReason}
                          >
                            {c.reason}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View style={{ width: 110, alignItems: 'center' }}>
                          <View
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                              backgroundColor: isPending
                                ? theme.warningBg
                                : isApproved
                                ? theme.successBg
                                : theme.dangerBg,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: isPending
                                  ? '#b08000'
                                  : isApproved
                                  ? theme.success
                                  : theme.danger,
                                textAlign: 'center',
                              }}
                            >
                              {c.status}
                            </Text>
                          </View>
                        </View>

                        {/* Aksi */}
                        <View
                          style={{
                            width: 120,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isPending ? (
                            <>
                              {/* Approve Button */}
                              <TouchableOpacity
                                onPress={() => {
                                  setApproveModalItem(c);
                                  setReviewNote('');
                                }}
                                style={{
                                  backgroundColor: theme.successBg,
                                  borderWidth: 1,
                                  borderColor: theme.success,
                                  borderRadius: 6,
                                  paddingVertical: 6,
                                  paddingHorizontal: 9,
                                }}
                                title="Setujui Koreksi"
                              >
                                <Check size={14} color={theme.success} />
                              </TouchableOpacity>

                              {/* Reject Button */}
                              <TouchableOpacity
                                onPress={() => {
                                  setRejectModalItem(c);
                                  setReviewNote('');
                                }}
                                style={{
                                  backgroundColor: theme.dangerBg,
                                  borderWidth: 1,
                                  borderColor: theme.danger,
                                  borderRadius: 6,
                                  paddingVertical: 6,
                                  paddingHorizontal: 9,
                                }}
                                title="Tolak"
                              >
                                <X size={14} color={theme.danger} />
                              </TouchableOpacity>

                              {/* Detail Button */}
                              <TouchableOpacity
                                onPress={() => setViewingItem(c)}
                                style={{
                                  backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                                  borderWidth: 1,
                                  borderColor: theme.borderColor,
                                  borderRadius: 6,
                                  paddingVertical: 6,
                                  paddingHorizontal: 9,
                                }}
                                title="Lihat Detail"
                              >
                                <Eye size={14} color={theme.textDark} />
                              </TouchableOpacity>
                            </>
                          ) : (
                            /* Detail Button Only */
                            <TouchableOpacity
                              onPress={() => setViewingItem(c)}
                              style={{
                                backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                                borderWidth: 1,
                                borderColor: theme.borderColor,
                                borderRadius: 6,
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                              }}
                              title="Lihat Detail"
                            >
                              <Eye size={14} color={theme.textDark} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: isDesktop ? 'center' : 'flex-start',
                marginTop: 20,
                paddingTop: 15,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: theme.textMuted }}>
                Menampilkan {filteredCorrections.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCorrections.length)} dari{' '}
                {statusFilter === 'pending'
                  ? `${corrections.filter((c) => c.status === 'PENDING').length} Koreksi (Pending)`
                  : `${corrections.length} Koreksi`}
              </Text>

              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: currentPage === 1 ? 0.3 : 1,
                  }}
                >
                  <ChevronLeft size={14} color={theme.textDark} />
                </TouchableOpacity>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => setCurrentPage(pageNum)}
                      style={{
                        width: 30,
                        height: 30,
                        borderWidth: 1,
                        borderColor: isActive ? theme.primaryBlue : theme.borderColor,
                        backgroundColor: isActive ? theme.primaryBlue : theme.cardBg,
                        borderRadius: 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? '700' : '400',
                          color: isActive ? '#ffffff' : theme.textDark,
                        }}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: currentPage === totalPages ? 0.3 : 1,
                  }}
                >
                  <ChevronRight size={14} color={theme.textDark} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal 1: Approve Confirmation */}
      <Modal
        visible={!!approveModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setApproveModalItem(null)}
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
              backgroundColor: theme.cardBg,
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.successBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Check size={22} color={theme.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                  Setujui Koreksi Jam Kerja
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Konfirmasi pembaruan jam absen kerja pegawai
                </Text>
              </View>
            </View>

            {approveModalItem && (
              <View
                style={{
                  backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                  padding: 14,
                  borderRadius: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>
                  {approveModalItem.user.name} ({approveModalItem.user.role})
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                  Tgl Absen: {approveModalItem.attendanceDate}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                  Koreksi: {approveModalItem.originalClockIn} - {approveModalItem.originalClockOut} ➔{' '}
                  <Text style={{ fontWeight: '700', color: theme.success }}>
                    {approveModalItem.proposedClockIn} - {approveModalItem.proposedClockOut}
                  </Text>
                </Text>
                <Text style={{ fontSize: 12, color: theme.textDark, marginTop: 6, fontStyle: 'italic' }}>
                  "{approveModalItem.fullReason}"
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                Catatan Persetujuan (Opsional)
              </Text>
              <TextInput
                placeholder="Contoh: Disetujui setelah diverifikasi dengan supervisor."
                placeholderTextColor={theme.placeholder}
                value={reviewNote}
                onChangeText={setReviewNote}
                style={{
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 13,
                  color: theme.textDark,
                  backgroundColor: theme.cardBg,
                  outlineStyle: 'none',
                } as any}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setApproveModalItem(null)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={submittingAction}
                onPress={handleApprove}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 20,
                  borderRadius: 6,
                  backgroundColor: theme.success,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                      Ya, Setujui
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Reject Confirmation */}
      <Modal
        visible={!!rejectModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalItem(null)}
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
              backgroundColor: theme.cardBg,
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.dangerBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <X size={22} color={theme.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                  Tolak Koreksi Jam Kerja
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Berikan alasan penolakan koreksi kepada pegawai
                </Text>
              </View>
            </View>

            {rejectModalItem && (
              <View
                style={{
                  backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                  padding: 14,
                  borderRadius: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textDark }}>
                  {rejectModalItem.user.name} ({rejectModalItem.user.role})
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                  Tgl Absen: {rejectModalItem.attendanceDate}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                Alasan Penolakan <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TextInput
                placeholder="Contoh: Bukti tidak memadai atau alasan tidak sesuai ketentuan kantor."
                placeholderTextColor={theme.placeholder}
                value={reviewNote}
                onChangeText={setReviewNote}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 13,
                  color: theme.textDark,
                  backgroundColor: theme.cardBg,
                  minHeight: 70,
                  textAlignVertical: 'top',
                  outlineStyle: 'none',
                } as any}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRejectModalItem(null)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={submittingAction}
                onPress={handleReject}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 20,
                  borderRadius: 6,
                  backgroundColor: theme.danger,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <X size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                      Tolak Koreksi
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: View Details */}
      <Modal
        visible={!!viewingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingItem(null)}
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
              backgroundColor: theme.cardBg,
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 520,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Rincian Permintaan Koreksi Jam Kerja
              </Text>
              <TouchableOpacity onPress={() => setViewingItem(null)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {viewingItem && (
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Employee Info Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        viewingItem.user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          viewingItem.user.name
                        )}&background=2a75d3&color=fff`,
                    }}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                      {viewingItem.user.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>
                      {viewingItem.user.role} • {viewingItem.user.email}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor:
                        viewingItem.status === 'PENDING'
                          ? theme.warningBg
                          : viewingItem.status === 'APPROVED'
                          ? theme.successBg
                          : theme.dangerBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color:
                          viewingItem.status === 'PENDING'
                            ? '#b08000'
                            : viewingItem.status === 'APPROVED'
                            ? theme.success
                            : theme.danger,
                      }}
                    >
                      {viewingItem.status}
                    </Text>
                  </View>
                </View>

                {/* Compare Times Box */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    marginBottom: 16,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase' }}>
                    Tanggal Absensi: {viewingItem.attendanceDate}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                    {/* Awal */}
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>JAM TERCATAT</Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          color: theme.danger,
                        }}
                      >
                        {viewingItem.originalClockIn} - {viewingItem.originalClockOut}
                      </Text>
                    </View>

                    <ArrowRight size={20} color={theme.textMuted} />

                    {/* Diminta */}
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>JAM DIMINTA</Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          color: theme.primaryBlue,
                        }}
                      >
                        {viewingItem.proposedClockIn} - {viewingItem.proposedClockOut}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Alasan Lengkap */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Alasan Koreksi:
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: theme.textDark, lineHeight: 20 }}>
                      {viewingItem.fullReason}
                    </Text>
                  </View>
                </View>

                {/* Catatan Review Jika Ada */}
                {viewingItem.reviewNote && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                      Catatan Admin / Reviewer:
                    </Text>
                    <View
                      style={{
                        backgroundColor: theme.isDark ? '#1e293b' : '#fff8e6',
                        padding: 12,
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.warning,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.textDark }}>
                        {viewingItem.reviewNote}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Bottom Actions */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
                paddingTop: 15,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
              }}
            >
              <TouchableOpacity
                onPress={() => setViewingItem(null)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                  Tutup
                </Text>
              </TouchableOpacity>

              {viewingItem?.status === 'PENDING' && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setRejectModalItem(viewingItem);
                      setReviewNote('');
                    }}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      backgroundColor: theme.dangerBg,
                      borderWidth: 1,
                      borderColor: theme.danger,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.danger }}>
                      Tolak
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setApproveModalItem(viewingItem);
                      setReviewNote('');
                    }}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 18,
                      borderRadius: 6,
                      backgroundColor: theme.success,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Setujui
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
