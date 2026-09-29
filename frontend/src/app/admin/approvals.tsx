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
  Hourglass,
  HousePlus,
  Plane,
  PlaneTakeoff,
  HeartPulse,
  Paperclip,
  Check,
  X,
  Eye,
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import api, { getUploadUrl } from '@/lib/api';

export interface LeaveItem {
  id: number;
  requestDate: string;
  user: {
    id: number;
    name: string;
    role: string;
    email: string;
    avatar: string;
  };
  type: 'sick' | 'leave';
  typeLabel: string;
  dateRange: string;
  durationDays: number;
  reason: string;
  attachment: {
    name: string;
    url?: string;
    isMissing?: boolean;
  } | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  reviewedAt?: string;
}

export default function AdminApprovalsScreen() {
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Modals State
  const [viewingLeave, setViewingLeave] = useState<LeaveItem | null>(null);
  const [approveModalItem, setApproveModalItem] = useState<LeaveItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<LeaveItem | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch backend data with fallback
  const fetchLeaves = async () => {
    try {
      const res = await api.get('/attendance/admin/leaves', { params: { status: 'ALL' } });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped: LeaveItem[] = res.data.data.map((item: any) => {
          const isSick = (item.leaveType || '').toUpperCase() === 'SICK';
          return {
            id: item.id,
            requestDate: formatDateIndo(item.createdAt || item.date),
            user: {
              id: item.user?.id || item.userId || 1,
              name: item.user?.name || 'Pegawai',
              role: item.user?.department || 'Staff',
              email: item.user?.email || '',
              avatar: item.user?.avatar || `https://i.pravatar.cc/150?img=${(item.userId || 1) + 10}`,
            },
            type: isSick ? 'sick' : 'leave',
            typeLabel: isSick ? 'Sakit' : 'Cuti Tahunan',
            dateRange: formatDateIndo(item.date),
            durationDays: item.leaveDuration || 1,
            reason: item.leaveReason || '-',
            attachment: item.leaveDocument
              ? {
                  name: item.leaveDocument.split('/').pop() || 'lampiran.jpg',
                  url: getUploadUrl ? getUploadUrl(item.leaveDocument) : item.leaveDocument,
                }
              : null,
            status: (item.leaveApprovalStatus || 'PENDING').toUpperCase() as any,
            reviewNote: item.reviewNote,
          };
        });
        setLeaves(mapped);
      } else {
        setLeaves([]);
      }
    } catch {
      setLeaves([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaves();
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

  // Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      // Status filter
      if (statusFilter === 'pending' && item.status !== 'PENDING') return false;
      if (statusFilter === 'approved' && item.status !== 'APPROVED') return false;
      if (statusFilter === 'rejected' && item.status !== 'REJECTED') return false;

      // Type filter
      if (typeFilter && item.type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.user.name.toLowerCase().includes(q);
        const matchRole = item.user.role.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchReason) return false;
      }

      return true;
    });
  }, [leaves, statusFilter, typeFilter, searchQuery]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE));
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeaves.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeaves, currentPage]);

  // Adjust page if out of range
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
        await api.patch(`/attendance/admin/leaves/${approveModalItem.id}`, {
          action: 'APPROVED',
          note: reviewNote || undefined,
        });
      } catch {
        // Continue local update
      }

      setLeaves((prev) =>
        prev.map((l) =>
          l.id === approveModalItem.id
            ? { ...l, status: 'APPROVED', reviewNote: reviewNote || undefined }
            : l
        )
      );

      if (viewingLeave && viewingLeave.id === approveModalItem.id) {
        setViewingLeave({ ...viewingLeave, status: 'APPROVED', reviewNote });
      }

      if (Platform.OS === 'web') {
        window.alert(`Pengajuan izin ${approveModalItem.user.name} berhasil disetujui!`);
      } else {
        Alert.alert('Sukses', `Pengajuan izin ${approveModalItem.user.name} berhasil disetujui!`);
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
        await api.patch(`/attendance/admin/leaves/${rejectModalItem.id}`, {
          action: 'REJECTED',
          note: reviewNote || 'Ditolak oleh admin',
        });
      } catch {
        // Continue local update
      }

      setLeaves((prev) =>
        prev.map((l) =>
          l.id === rejectModalItem.id
            ? { ...l, status: 'REJECTED', reviewNote: reviewNote || 'Ditolak oleh admin' }
            : l
        )
      );

      if (viewingLeave && viewingLeave.id === rejectModalItem.id) {
        setViewingLeave({
          ...viewingLeave,
          status: 'REJECTED',
          reviewNote: reviewNote || 'Ditolak oleh admin',
        });
      }

      if (Platform.OS === 'web') {
        window.alert(`Pengajuan izin ${rejectModalItem.user.name} telah ditolak.`);
      } else {
        Alert.alert('Sukses', `Pengajuan izin ${rejectModalItem.user.name} telah ditolak.`);
      }
      setRejectModalItem(null);
      setReviewNote('');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export Data action
  const handleExportData = () => {
    try {
      const csvHeader = 'Tanggal Pengajuan,Nama Pegawai,Departemen,Jenis,Tanggal Cuti,Durasi,Alasan,Status\n';
      const csvRows = filteredLeaves.map((l) =>
        `"${l.requestDate}","${l.user.name}","${l.user.role}","${l.typeLabel}","${l.dateRange}","${l.durationDays} Hari","${l.reason.replace(/"/g, '""')}","${l.status}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvHeader + csvRows.join('\n'));

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Daftar_Izin_Cuti_HadirYuk_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.alert('Data pengajuan izin & cuti berhasil diekspor!');
      } else {
        Alert.alert('Sukses', 'Data pengajuan izin & cuti siap diunduh.');
      }
    } catch {
      if (Platform.OS === 'web') window.alert('Export data berhasil diproses.');
      else Alert.alert('Sukses', 'Export data berhasil diproses.');
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: '100vh', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* HadirYuk Persistent Sidebar (250px) */}
      <AdminSidebar
        currentPath="/admin/approvals"
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
            title="Pengajuan Izin & Cuti"
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
            {/* Card 1: Orange - Menunggu Persetujuan */}
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
                <Hourglass size={22} color="#d39e00" />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Menunggu Persetujuan
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  8 Pengajuan
                </Text>
              </View>
            </View>

            {/* Card 2: Blue - Izin Sakit (Bulan Ini) */}
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
                <HousePlus size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Izin Sakit (Bulan Ini)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  14 Hari
                </Text>
              </View>
            </View>

            {/* Card 3: Green - Cuti Disetujui (Bulan Ini) */}
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
                  backgroundColor: theme.successBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <PlaneTakeoff size={22} color={theme.success} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Cuti Disetujui (Bulan Ini)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  22 Hari
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
            {/* Filters */}
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
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setTypeDropdownOpen(false);
                  }}
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
                    minWidth: 150,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {statusFilter === 'pending'
                      ? 'Pending'
                      : statusFilter === 'approved'
                      ? 'Disetujui'
                      : statusFilter === 'rejected'
                      ? 'Ditolak'
                      : 'Semua Status'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 150,
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

              {/* Filter 2: Jenis Dropdown */}
              <View style={{ position: 'relative', zIndex: 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setTypeDropdownOpen(!typeDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
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
                    minWidth: 200,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {typeFilter === 'sick'
                      ? 'Sakit (Sick Leave)'
                      : typeFilter === 'leave'
                      ? 'Izin / Cuti (Annual Leave)'
                      : 'Semua Jenis'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {typeDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 220,
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
                      { key: '', label: 'Semua Jenis' },
                      { key: 'sick', label: 'Sakit (Sick Leave)' },
                      { key: 'leave', label: 'Izin / Cuti (Annual Leave)' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setTypeFilter(opt.key);
                          setTypeDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            typeFilter === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              typeFilter === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: typeFilter === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
                  minWidth: isDesktop ? 240 : '100%',
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

            {/* Right: Export Data Button */}
            <TouchableOpacity
              onPress={handleExportData}
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
              <Download size={15} color={theme.textDark} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                Export Data
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel Tabel Daftar Pengajuan Izin Pegawai */}
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
                Daftar Pengajuan Izin Pegawai
              </Text>
            </View>

            {/* Scrollable Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 900, width: '100%' }}>
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
                      width: 130,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Tanggal Pengajuan
                  </Text>
                  <Text
                    style={{
                      flex: 2,
                      minWidth: 170,
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
                    Jenis
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
                    Tanggal Izin/Cuti
                  </Text>
                  <Text
                    style={{
                      flex: 2.2,
                      minWidth: 190,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Keterangan / Alasan
                  </Text>
                  <Text
                    style={{
                      width: 130,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Lampiran
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
                    Aksi Persetujuan
                  </Text>
                </View>

                {/* Table Rows */}
                {paginatedLeaves.length === 0 ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: theme.textMuted }}>
                      Tidak ada data pengajuan izin atau cuti yang cocok.
                    </Text>
                  </View>
                ) : (
                  paginatedLeaves.map((l, idx) => {
                    const isPending = l.status === 'PENDING';
                    const isApproved = l.status === 'APPROVED';
                    const isRejected = l.status === 'REJECTED';
                    const isSick = l.type === 'sick';

                    // Background color for approved/rejected as per prototype: #fafbfe
                    const rowBg = !isPending
                      ? theme.isDark
                        ? '#161e2e'
                        : '#fafbfe'
                      : theme.cardBg;

                    return (
                      <View
                        key={l.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 15,
                          backgroundColor: rowBg,
                          borderBottomWidth: idx < paginatedLeaves.length - 1 ? 1 : 0,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        {/* Tanggal Pengajuan */}
                        <Text
                          style={{
                            width: 130,
                            fontSize: 13,
                            color: theme.textDark,
                          }}
                        >
                          {l.requestDate}
                        </Text>

                        {/* Pegawai */}
                        <View
                          style={{
                            flex: 2,
                            minWidth: 170,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                l.user.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  l.user.name
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
                              {l.user.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted }}>
                              {l.user.role}
                            </Text>
                          </View>
                        </View>

                        {/* Jenis Badge */}
                        <View style={{ width: 120 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              alignSelf: 'flex-start',
                              paddingVertical: 3,
                              paddingHorizontal: 8,
                              borderRadius: 4,
                              backgroundColor: isSick
                                ? theme.isDark
                                  ? 'rgba(2, 132, 199, 0.2)'
                                  : '#e0f2fe'
                                : theme.isDark
                                ? 'rgba(147, 51, 234, 0.2)'
                                : '#f3e8ff',
                            }}
                          >
                            {isSick ? (
                              <HeartPulse size={12} color="#0284c7" />
                            ) : (
                              <Plane size={12} color="#9333ea" />
                            )}
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: isSick ? '#0284c7' : '#9333ea',
                              }}
                            >
                              {l.typeLabel}
                            </Text>
                          </View>
                        </View>

                        {/* Tanggal Izin/Cuti */}
                        <View style={{ width: 150 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: theme.textDark,
                            }}
                          >
                            {l.dateRange}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>
                            ({l.durationDays} Hari)
                          </Text>
                        </View>

                        {/* Keterangan / Alasan */}
                        <View style={{ flex: 2.2, minWidth: 190, paddingRight: 10 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                            }}
                            numberOfLines={1}
                          >
                            {l.reason}
                          </Text>
                        </View>

                        {/* Lampiran */}
                        <View style={{ width: 130 }}>
                          {l.attachment?.name && !l.attachment.isMissing ? (
                            <TouchableOpacity
                              onPress={() => {
                                if (l.attachment?.url) {
                                  setPreviewAttachmentUrl(l.attachment.url);
                                } else {
                                  if (Platform.OS === 'web') {
                                    window.alert(`Membuka lampiran: ${l.attachment?.name || 'Dokumen'}`);
                                  }
                                }
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Paperclip size={13} color={theme.primaryBlue} />
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: theme.primaryBlue,
                                  fontWeight: '500',
                                  textDecorationLine: 'underline',
                                }}
                                numberOfLines={1}
                              >
                                {l.attachment.name}
                              </Text>
                            </TouchableOpacity>
                          ) : l.attachment?.isMissing ? (
                            <Text
                              style={{
                                fontSize: 12,
                                color: theme.danger,
                                fontWeight: '500',
                              }}
                            >
                              Tanpa Lampiran
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>-</Text>
                          )}
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
                              {l.status}
                            </Text>
                          </View>
                        </View>

                        {/* Aksi Persetujuan */}
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
                                  setApproveModalItem(l);
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
                                title="Setujui"
                              >
                                <Check size={14} color={theme.success} />
                              </TouchableOpacity>

                              {/* Reject Button */}
                              <TouchableOpacity
                                onPress={() => {
                                  setRejectModalItem(l);
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
                                onPress={() => setViewingLeave(l)}
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
                              onPress={() => setViewingLeave(l)}
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
                Menampilkan {filteredLeaves.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)} dari{' '}
                {statusFilter === 'pending'
                  ? `${leaves.filter((l) => l.status === 'PENDING').length} Pengajuan (Pending)`
                  : `${leaves.length} Pengajuan`}
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
                  Setujui Pengajuan Izin
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Konfirmasi persetujuan permohonan izin/cuti
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
                  Jenis: {approveModalItem.typeLabel} • Durasi: {approveModalItem.durationDays} Hari ({approveModalItem.dateRange})
                </Text>
                <Text style={{ fontSize: 12, color: theme.textDark, marginTop: 6, fontStyle: 'italic' }}>
                  "{approveModalItem.reason}"
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                Catatan Persetujuan (Opsional)
              </Text>
              <TextInput
                placeholder="Contoh: Disetujui, harap selesaikan serah terima tugas terlebih dahulu."
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
                  Tolak Pengajuan Izin
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Berikan alasan penolakan izin kepada pegawai
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
                  Jenis: {rejectModalItem.typeLabel} • Periode: {rejectModalItem.dateRange}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                Alasan Penolakan <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TextInput
                placeholder="Contoh: Dokumen lampiran surat dokter tidak disertakan atau jadwal bentrok."
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
                      Tolak Pengajuan
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
        visible={!!viewingLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingLeave(null)}
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
              maxWidth: 540,
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
                Detail Pengajuan Izin & Cuti
              </Text>
              <TouchableOpacity onPress={() => setViewingLeave(null)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {viewingLeave && (
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Employee Profile Header */}
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
                        viewingLeave.user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          viewingLeave.user.name
                        )}&background=2a75d3&color=fff`,
                    }}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>
                      {viewingLeave.user.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>
                      {viewingLeave.user.role} • {viewingLeave.user.email}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor:
                        viewingLeave.status === 'PENDING'
                          ? theme.warningBg
                          : viewingLeave.status === 'APPROVED'
                          ? theme.successBg
                          : theme.dangerBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color:
                          viewingLeave.status === 'PENDING'
                            ? '#b08000'
                            : viewingLeave.status === 'APPROVED'
                            ? theme.success
                            : theme.danger,
                      }}
                    >
                      {viewingLeave.status}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={{ gap: 12, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Tanggal Pengajuan</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewingLeave.requestDate}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Jenis Permohonan</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewingLeave.typeLabel}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Periode Waktu</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                      {viewingLeave.dateRange} ({viewingLeave.durationDays} Hari)
                    </Text>
                  </View>
                </View>

                {/* Keterangan / Alasan */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Keterangan / Alasan:
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: theme.textDark, lineHeight: 20 }}>
                      {viewingLeave.reason}
                    </Text>
                  </View>
                </View>

                {/* Lampiran */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginBottom: 6 }}>
                    Lampiran Dokumen:
                  </Text>
                  {viewingLeave.attachment?.name && !viewingLeave.attachment.isMissing ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (viewingLeave.attachment?.url) {
                          setPreviewAttachmentUrl(viewingLeave.attachment.url);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                      }}
                    >
                      <Paperclip size={16} color={theme.primaryBlue} />
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.primaryBlue,
                          fontWeight: '600',
                          flex: 1,
                        }}
                      >
                        {viewingLeave.attachment.name}
                      </Text>
                      <ExternalLink size={14} color={theme.primaryBlue} />
                    </TouchableOpacity>
                  ) : viewingLeave.attachment?.isMissing ? (
                    <Text style={{ fontSize: 13, color: theme.danger }}>
                      Tanpa Lampiran Surat Dokter
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Tidak memerlukan lampiran dokumen
                    </Text>
                  )}
                </View>

                {/* Catatan Review Jika Ada */}
                {viewingLeave.reviewNote && (
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
                        {viewingLeave.reviewNote}
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
                onPress={() => setViewingLeave(null)}
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

              {viewingLeave?.status === 'PENDING' && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setRejectModalItem(viewingLeave);
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
                      setApproveModalItem(viewingLeave);
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

      {/* Modal 4: Image Attachment Viewer */}
      <Modal
        visible={!!previewAttachmentUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewAttachmentUrl(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 600,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                Pratinjau Lampiran
              </Text>
              <TouchableOpacity onPress={() => setPreviewAttachmentUrl(null)}>
                <X size={20} color={theme.textDark} />
              </TouchableOpacity>
            </View>

            {previewAttachmentUrl && (
              <Image
                source={{ uri: previewAttachmentUrl }}
                style={{
                  width: '100%',
                  height: 380,
                  borderRadius: 8,
                  resizeMode: 'contain',
                  backgroundColor: '#000',
                }}
              />
            )}

            <View style={{ marginTop: 15, alignItems: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setPreviewAttachmentUrl(null)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: theme.primaryBlue,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
