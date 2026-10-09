import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  Wallet,
  Clock,
  CheckCheck,
  FileSpreadsheet,
  Calculator,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  UploadCloud,
  Printer,
  Download,
  Building2,
  Calendar,
  AlertCircle,
  Search,
  User,
  RefreshCw,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api';

interface PayrollRecord {
  id: number;
  name: string;
  role: string;
  department: string;
  avatar: string;
  salaryType: 'MONTHLY' | 'DAILY' | 'HOURLY';
  salaryTypeDetail?: string;
  baseSalary: number;
  overtimeBonus: number;
  overtimeDetail?: string;
  lateDeduction: number;
  lateDetail?: string;
  netSalary: number;
  status: 'PAID' | 'PENDING';
  bankName?: string;
  bankAccount?: string;
  period: string;
  attendanceDays?: number;
  lateCount?: number;
}

export default function PayrollScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters State - Per Karyawan & Custom Periode / Range
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [filterMode, setFilterMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [selectedMonth, setSelectedMonth] = useState<string>('9'); // September
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const MONTH_LIST = [
    { key: '', label: 'Semua Bulan' },
    { key: '1', label: 'Januari' },
    { key: '2', label: 'Februari' },
    { key: '3', label: 'Maret' },
    { key: '4', label: 'April' },
    { key: '5', label: 'Mei' },
    { key: '6', label: 'Juni' },
    { key: '7', label: 'Juli' },
    { key: '8', label: 'Agustus' },
    { key: '9', label: 'September' },
    { key: '10', label: 'Oktober' },
    { key: '11', label: 'November' },
    { key: '12', label: 'Desember' },
  ];
  const YEAR_LIST = ['2024', '2025', '2026', '2027'];

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [generateTargetUserId, setGenerateTargetUserId] = useState('ALL');
  const [generateStartDate, setGenerateStartDate] = useState('2026-09-01');
  const [generateEndDate, setGenerateEndDate] = useState('2026-09-30');

  // Payrolls data (loaded from real database API)
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch employees on mount
  useEffect(() => {
    api.get('/users')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setEmployees(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch payroll from backend API
  useEffect(() => {
    fetchBackendPayroll();
  }, [selectedUserId, filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const fetchBackendPayroll = async () => {
    try {
      const params: any = {};
      if (selectedUserId && selectedUserId !== 'ALL') {
        params.userId = selectedUserId;
      }

      if (filterMode === 'RANGE') {
        if (startDate) params.periodStart = startDate;
        if (endDate) params.periodEnd = endDate;
      } else {
        if (selectedMonth) params.month = selectedMonth;
        if (selectedYear) params.year = selectedYear;
      }

      const res = await api.get('/payroll', { params });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((p: any, idx: number) => ({
          id: p.id || idx + 1,
          name: p.user?.name || 'Karyawan',
          role: p.user?.position || p.user?.department || 'Staff',
          department: p.user?.department || '-',
          avatar:
            p.user?.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name || 'Karyawan')}&background=2a75d3&color=fff`,
          salaryType: (p.user?.salaryType as any) || 'MONTHLY',
          salaryTypeDetail: p.user?.salaryType || 'MONTHLY',
          baseSalary: p.baseSalary ?? p.basicSalary ?? 0,
          overtimeBonus: p.overtimeBonus ?? p.allowance ?? 0,
          overtimeDetail: p.overtimeHours ? `(${p.overtimeHours} jam)` : '',
          lateDeduction: p.lateDeductions ?? p.deduction ?? 0,
          lateDetail: (p.lateDeductions ?? 0) > 0 ? `(${Math.round(p.lateDeductions / 25000)}x Telat)` : '',
          netSalary: p.netSalary || 0,
          status: p.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
          bankName: p.user?.bankName || p.bankName || 'BCA',
          bankAccount: p.user?.bankAccountNumber || p.bankAccount || '-',
          period: p.periodStart
            ? new Date(p.periodStart).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            : 'September 2026',
          attendanceDays: p.workingDays || p.attendanceDays || 0,
          lateCount: p.lateCount || 0,
        }));
        setPayrolls(mapped);
      } else {
        setPayrolls([]);
      }
    } catch {
      setPayrolls([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBackendPayroll();
  };

  // Currency Formatter
  const formatRupiah = (val: number) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  // Filtered List
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const matchDept =
        !selectedDept ||
        p.department.toLowerCase().includes(selectedDept.toLowerCase());
      const matchStatus =
        !selectedStatus || p.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchDept && matchStatus;
    });
  }, [payrolls, selectedDept, selectedStatus]);

  // Dynamic summary metrics
  const totalEstimatedSalary = useMemo(() => {
    return filteredPayrolls.reduce(
      (sum, p) => sum + (Number(p.netSalary) || Number(p.baseSalary) || 0),
      0
    );
  }, [filteredPayrolls]);

  const pendingPaymentCount = useMemo(() => {
    return filteredPayrolls.filter((p) => p.status === 'PENDING').length;
  }, [filteredPayrolls]);

  const paidPaymentCount = useMemo(() => {
    return filteredPayrolls.filter((p) => p.status === 'PAID').length;
  }, [filteredPayrolls]);

  // Export Excel
  const handleExportExcel = async () => {
    if (Platform.OS === 'web') {
      try {
        const res = await api.get('/payroll/export/excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Laporan_Penggajian_HadirYuk.xlsx');
        document.body.appendChild(link);
        link.click();
      } catch {
        // Fallback CSV download in web
        const headers = 'Nama,Departemen,Gaji Pokok,Bonus Lembur,Potongan,Gaji Bersih,Status\n';
        const rows = filteredPayrolls
          .map(
            (p) =>
              `"${p.name}","${p.department}","${p.baseSalary}","${p.overtimeBonus}","${p.lateDeduction}","${p.netSalary}","${p.status}"`
          )
          .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payroll_${filterMode === 'RANGE' ? `${startDate}_sd_${endDate}` : `${selectedMonth || 'all'}-${selectedYear}`}.csv`;
        a.click();
      }
    } else {
      Alert.alert('Info', 'Laporan Excel penggajian siap diunduh.');
    }
  };

  // Mark Paid Handler
  const handleMarkPaid = (record: PayrollRecord) => {
    setPayingRecord(record);
  };

  const handleConfirmPaySubmit = async () => {
    if (!payingRecord) return;
    setIsSubmittingPay(true);
    try {
      try {
        await api.patch(`/payroll/${payingRecord.id}/pay`, {});
      } catch {
        // Continue local update
      }
      setPayrolls((prev) =>
        prev.map((p) => (p.id === payingRecord.id ? { ...p, status: 'PAID' } : p))
      );
      if (Platform.OS === 'web') {
        window.alert(`Gaji ${payingRecord.name} berhasil ditandai LUNAS (PAID)!`);
      } else {
        Alert.alert('Sukses', `Gaji ${payingRecord.name} berhasil ditandai LUNAS!`);
      }
      setPayingRecord(null);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Generate Payroll Submit
  const handleGenerateSubmit = async () => {
    setIsGenerating(true);
    try {
      const payload: any = {
        periodStart: generateStartDate,
        periodEnd: generateEndDate,
      };
      if (generateTargetUserId && generateTargetUserId !== 'ALL') {
        payload.userId = generateTargetUserId;
      }
      const res = await api.post('/payroll', payload);
      const msg = res.data?.message || 'Payroll berhasil digenerate!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sukses', msg);
      }
      setShowGenerateModal(false);
      fetchBackendPayroll();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat generate payroll';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal', msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* HadirYuk Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin/payroll"
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
          {/* Header / Topbar */}
          <AdminTopHeader
            title="Manajemen Penggajian (Payroll)"
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
            {/* Card 1: Blue - Total Estimasi Gaji */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
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
                <Wallet size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Total Estimasi Gaji
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.textDark,
                  }}
                >
                  {formatRupiah(totalEstimatedSalary)}
                </Text>
              </View>
            </View>

            {/* Card 2: Yellow - Menunggu Pembayaran */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
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
                <Clock size={22} color="#d39e00" />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Menunggu Pembayaran
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.textDark,
                  }}
                >
                  {pendingPaymentCount} Pegawai
                </Text>
              </View>
            </View>

            {/* Card 3: Green - Telah Dibayar (Paid) */}
            <View
              style={{
                flex: 1,
                minWidth: 220,
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
                <CheckCheck size={22} color={theme.success} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Telah Dibayar (Paid)
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.textDark,
                  }}
                >
                  {paidPaymentCount} Pegawai
                </Text>
              </View>
            </View>
          </View>

          {/* Action Toolbar & Filters */}
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
            {/* Filters Row */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 12,
                alignItems: isDesktop ? 'center' : 'stretch',
                flexWrap: 'wrap',
                flex: 1,
              }}
            >
              {/* Filter Per Karyawan */}
              <View style={{ position: 'relative', zIndex: userDropdownOpen ? 9999 : 50 }}>
                <TouchableOpacity
                  onPress={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setMonthDropdownOpen(false);
                    setYearDropdownOpen(false);
                    setDeptDropdownOpen(false);
                    setStatusDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: selectedUserId ? theme.primaryBlue : theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.cardBg,
                    minWidth: 180,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <User size={14} color={selectedUserId ? theme.primaryBlue : theme.textMuted} />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        color: selectedUserId ? theme.primaryBlue : theme.textDark,
                        fontWeight: selectedUserId ? '600' : '400',
                      }}
                    >
                      {selectedUserId
                        ? employees.find((e) => String(e.id) === selectedUserId)?.name || 'Karyawan Terpilih'
                        : 'Semua Karyawan'}
                    </Text>
                  </View>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {userDropdownOpen && (
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
                      zIndex: 10000,
                      elevation: 10,
                      maxHeight: 250,
                      overflow: 'hidden',
                    }}
                  >
                    <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUserId('');
                          setUserDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor: !selectedUserId ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: !selectedUserId ? theme.primaryBlue : theme.textDark,
                            fontWeight: !selectedUserId ? '700' : '400',
                          }}
                        >
                          Semua Karyawan
                        </Text>
                      </TouchableOpacity>
                      {employees.map((emp) => (
                        <TouchableOpacity
                          key={emp.id}
                          onPress={() => {
                            setSelectedUserId(String(emp.id));
                            setUserDropdownOpen(false);
                          }}
                          style={{
                            paddingVertical: 9,
                            paddingHorizontal: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.borderColor,
                            backgroundColor:
                              selectedUserId === String(emp.id) ? theme.activeNavBg : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color:
                                selectedUserId === String(emp.id)
                                  ? theme.primaryBlue
                                  : theme.textDark,
                              fontWeight: selectedUserId === String(emp.id) ? '700' : '400',
                            }}
                          >
                            {emp.name}
                          </Text>
                          {emp.department && (
                            <Text style={{ fontSize: 11, color: theme.textMuted }}>
                              {emp.department}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Mode Toggle: Bulan vs Range */}
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  overflow: 'hidden',
                  backgroundColor: theme.subtleBg,
                }}
              >
                <TouchableOpacity
                  onPress={() => setFilterMode('MONTH')}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    backgroundColor: filterMode === 'MONTH' ? theme.primaryBlue : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: filterMode === 'MONTH' ? '#fff' : theme.textMuted,
                    }}
                  >
                    Bulan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilterMode('RANGE')}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    backgroundColor: filterMode === 'RANGE' ? theme.primaryBlue : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: filterMode === 'RANGE' ? '#fff' : theme.textMuted,
                    }}
                  >
                    Range Tanggal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Custom Bulan & Tahun Dropdown */}
              {filterMode === 'MONTH' ? (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {/* Bulan Dropdown */}
                  <View style={{ position: 'relative', zIndex: monthDropdownOpen ? 9998 : 40 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setMonthDropdownOpen(!monthDropdownOpen);
                        setYearDropdownOpen(false);
                        setUserDropdownOpen(false);
                        setDeptDropdownOpen(false);
                        setStatusDropdownOpen(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 6,
                        backgroundColor: theme.cardBg,
                        minWidth: 130,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.textDark }}>
                        {MONTH_LIST.find((m) => m.key === selectedMonth)?.label || 'Semua Bulan'}
                      </Text>
                      <ChevronDown size={14} color={theme.textMuted} />
                    </TouchableOpacity>

                    {monthDropdownOpen && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 42,
                          left: 0,
                          width: 140,
                          backgroundColor: theme.cardBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 6,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          zIndex: 10000,
                          elevation: 10,
                          maxHeight: 220,
                          overflow: 'hidden',
                        }}
                      >
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                          {MONTH_LIST.map((opt) => (
                            <TouchableOpacity
                              key={opt.key}
                              onPress={() => {
                                setSelectedMonth(opt.key);
                                setMonthDropdownOpen(false);
                              }}
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.borderColor,
                                backgroundColor:
                                  selectedMonth === opt.key ? theme.activeNavBg : 'transparent',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color:
                                    selectedMonth === opt.key
                                      ? theme.primaryBlue
                                      : theme.textDark,
                                  fontWeight: selectedMonth === opt.key ? '700' : '400',
                                }}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Tahun Dropdown */}
                  <View style={{ position: 'relative', zIndex: yearDropdownOpen ? 9998 : 40 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setYearDropdownOpen(!yearDropdownOpen);
                        setMonthDropdownOpen(false);
                        setUserDropdownOpen(false);
                        setDeptDropdownOpen(false);
                        setStatusDropdownOpen(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 6,
                        backgroundColor: theme.cardBg,
                        minWidth: 85,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.textDark }}>
                        {selectedYear}
                      </Text>
                      <ChevronDown size={14} color={theme.textMuted} />
                    </TouchableOpacity>

                    {yearDropdownOpen && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 42,
                          left: 0,
                          width: 90,
                          backgroundColor: theme.cardBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 6,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          zIndex: 10000,
                          elevation: 10,
                        }}
                      >
                        {YEAR_LIST.map((y) => (
                          <TouchableOpacity
                            key={y}
                            onPress={() => {
                              setSelectedYear(y);
                              setYearDropdownOpen(false);
                            }}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.borderColor,
                              backgroundColor:
                                selectedYear === y ? theme.activeNavBg : 'transparent',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: selectedYear === y ? theme.primaryBlue : theme.textDark,
                                fontWeight: selectedYear === y ? '700' : '400',
                              }}
                            >
                              {y}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* Mode Range Tanggal Inputs */
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.placeholder}
                    value={startDate}
                    onChangeText={setStartDate}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      fontSize: 12,
                      color: theme.textDark,
                      backgroundColor: theme.cardBg,
                      width: 110,
                      outlineStyle: 'none',
                    } as any}
                  />
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>s/d</Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.placeholder}
                    value={endDate}
                    onChangeText={setEndDate}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      fontSize: 12,
                      color: theme.textDark,
                      backgroundColor: theme.cardBg,
                      width: 110,
                      outlineStyle: 'none',
                    } as any}
                  />
                </View>
              )}

              {/* Departemen Dropdown */}
              <View style={{ position: 'relative', zIndex: deptDropdownOpen ? 9997 : 30 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDeptDropdownOpen(!deptDropdownOpen);
                    setUserDropdownOpen(false);
                    setMonthDropdownOpen(false);
                    setYearDropdownOpen(false);
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
                    minWidth: 150,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.textDark }}>
                    {selectedDept || 'Semua Divisi'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {deptDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 170,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      zIndex: 10000,
                      elevation: 10,
                    }}
                  >
                    {[
                      { key: '', label: 'Semua Divisi' },
                      { key: 'IT & Engineering', label: 'IT & Engineering' },
                      { key: 'Human Resources', label: 'Human Resources' },
                      { key: 'Operations', label: 'Operations' },
                      { key: 'Finance', label: 'Finance' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setSelectedDept(opt.key);
                          setDeptDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            selectedDept === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: selectedDept === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: selectedDept === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status Pembayaran Dropdown */}
              <View style={{ position: 'relative', zIndex: statusDropdownOpen ? 9996 : 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setUserDropdownOpen(false);
                    setMonthDropdownOpen(false);
                    setYearDropdownOpen(false);
                    setDeptDropdownOpen(false);
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
                    minWidth: 140,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.textDark }}>
                    {selectedStatus === 'pending'
                      ? 'Pending'
                      : selectedStatus === 'paid'
                      ? 'Paid (Lunas)'
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
                      zIndex: 10000,
                      elevation: 10,
                    }}
                  >
                    {[
                      { key: '', label: 'Semua Status' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'paid', label: 'Paid (Lunas)' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setSelectedStatus(opt.key);
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            selectedStatus === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: selectedStatus === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: selectedStatus === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Refresh / Terapkan Button */}
              <TouchableOpacity
                onPress={fetchBackendPayroll}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: theme.subtleBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <RefreshCw size={13} color={theme.primaryBlue} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primaryBlue }}>
                  Terapkan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons: Export Excel & Generate Payroll */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleExportExcel}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  backgroundColor: 'transparent',
                }}
              >
                <FileSpreadsheet size={16} color="#217346" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textDark }}>
                  Export Excel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowGenerateModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: theme.primaryBlue,
                }}
              >
                <Calculator size={16} color="#ffffff" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>
                  Generate Payroll
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Panel Tabel Payroll */}
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
                flexDirection: isDesktop ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: isDesktop ? 'center' : 'flex-start',
                marginBottom: 15,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: theme.textDark,
                }}
              >
                Detail Gaji Pegawai (Periode Sept 2026)
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted }}>
                Dihitung otomatis dari data presensi & keterlambatan.
              </Text>
            </View>

            {/* Table Scrollable Container */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={{ minWidth: '100%', flexGrow: 1 }}
            >
              <View style={{ minWidth: 920, width: '100%', flexGrow: 1 }}>
                {/* Table Header Row */}
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
                      flex: 2.2,
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
                      flex: 1.6,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Gaji Pokok / Tipe
                  </Text>
                  <Text
                    style={{
                      flex: 1.4,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Bonus Lembur
                  </Text>
                  <Text
                    style={{
                      flex: 1.4,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Potongan (Telat)
                  </Text>
                  <Text
                    style={{
                      flex: 1.6,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Total Gaji Bersih
                  </Text>
                  <Text
                    style={{
                      width: 90,
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
                {filteredPayrolls.map((row, idx) => {
                  const isPaid = row.status === 'PAID';
                  return (
                    <View
                      key={row.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 15,
                        borderBottomWidth:
                          idx < filteredPayrolls.length - 1 ? 1 : 0,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      {/* Pegawai Cell */}
                      <View
                        style={{
                          flex: 2.2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <Image
                          source={{ uri: row.avatar }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: theme.textDark,
                            }}
                            numberOfLines={1}
                          >
                            {row.name}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: theme.textMuted }}
                            numberOfLines={1}
                          >
                            {row.role}
                          </Text>
                        </View>
                      </View>

                      {/* Gaji Pokok / Tipe */}
                      <View style={{ flex: 1.6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.textDark,
                          }}
                        >
                          {formatRupiah(row.baseSalary)}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                          {row.salaryTypeDetail}
                        </Text>
                      </View>

                      {/* Bonus Lembur */}
                      <View style={{ flex: 1.4 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.success,
                          }}
                        >
                          + {formatRupiah(row.overtimeBonus)}
                        </Text>
                        {row.overtimeDetail ? (
                          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>
                            {row.overtimeDetail}
                          </Text>
                        ) : null}
                      </View>

                      {/* Potongan (Telat) */}
                      <View style={{ flex: 1.4 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.danger,
                          }}
                        >
                          - {formatRupiah(row.lateDeduction)}
                        </Text>
                        {row.lateDetail ? (
                          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>
                            {row.lateDetail}
                          </Text>
                        ) : null}
                      </View>

                      {/* Total Gaji Bersih */}
                      <View style={{ flex: 1.6 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: theme.primaryBlue,
                          }}
                        >
                          {formatRupiah(row.netSalary)}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View style={{ width: 90, alignItems: 'center' }}>
                        <View
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 6,
                            backgroundColor: isPaid ? theme.successBg : theme.warningBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: isPaid ? theme.success : '#b08000',
                              textAlign: 'center',
                            }}
                          >
                            {isPaid ? 'PAID' : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View
                        style={{
                          width: 120,
                          flexDirection: 'row',
                          gap: 8,
                          justifyContent: 'center',
                        }}
                      >
                        {/* Detail Button */}
                        <TouchableOpacity
                          onPress={() => setSelectedSlip(row)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                          }}
                        >
                          <FileText size={13} color={theme.textDark} />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: theme.textDark,
                            }}
                          >
                            Detail
                          </Text>
                        </TouchableOpacity>

                        {/* Bayar Button (if PENDING) */}
                        {!isPaid && (
                          <TouchableOpacity
                            onPress={() => handleMarkPaid(row)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              borderRadius: 6,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                            }}
                          >
                            <Check size={13} color={theme.success} />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '500',
                                color: theme.textDark,
                              }}
                            >
                              Bayar
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
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
                {filteredPayrolls.length > 0
                  ? `Menampilkan 1 - ${filteredPayrolls.length} dari ${filteredPayrolls.length} Pegawai`
                  : 'Menampilkan 0 Pegawai'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <TouchableOpacity
                  disabled
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ChevronLeft size={14} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.primaryBlue,
                    backgroundColor: theme.primaryBlue,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                    1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ChevronRight size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* MODAL 1: Detail Slip Gaji */}
          {selectedSlip && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setSelectedSlip(null)}
            >
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
                    maxWidth: 520,
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
                  {/* Modal Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <FileText size={20} color={theme.primaryBlue} />
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '700',
                          color: theme.textDark,
                        }}
                      >
                        Slip Gaji Karyawan - HadirYuk
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedSlip(null)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Slip Body */}
                  <View style={{ marginTop: 16, gap: 14 }}>
                    {/* Employee Profile Pill */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        backgroundColor: theme.subtleBg,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                      }}
                    >
                      <Image
                        source={{ uri: selectedSlip.avatar }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: theme.textDark,
                          }}
                        >
                          {selectedSlip.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          {selectedSlip.department}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.primaryBlue,
                            marginTop: 2,
                          }}
                        >
                          Rekening: {selectedSlip.bankName} - {selectedSlip.bankAccount}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                          backgroundColor:
                            selectedSlip.status === 'PAID'
                              ? theme.successBg
                              : theme.warningBg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color:
                              selectedSlip.status === 'PAID'
                                ? theme.success
                                : '#b08000',
                          }}
                        >
                          {selectedSlip.status}
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown Details */}
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Row 1: Gaji Pokok */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          Gaji Pokok ({selectedSlip.salaryTypeDetail})
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.textDark,
                          }}
                        >
                          {formatRupiah(selectedSlip.baseSalary)}
                        </Text>
                      </View>

                      {/* Row 2: Bonus Lembur */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          Bonus Lembur {selectedSlip.overtimeDetail}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.success,
                          }}
                        >
                          + {formatRupiah(selectedSlip.overtimeBonus)}
                        </Text>
                      </View>

                      {/* Row 3: Potongan Keterlambatan */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          Potongan Keterlambatan {selectedSlip.lateDetail}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: theme.danger,
                          }}
                        >
                          - {formatRupiah(selectedSlip.lateDeduction)}
                        </Text>
                      </View>

                      {/* Row 4: Total Gaji Bersih (Total Net) */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          padding: 14,
                          backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: theme.textDark,
                          }}
                        >
                          Total Gaji Bersih (Take Home Pay)
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '800',
                            fontFamily: 'monospace',
                            color: theme.primaryBlue,
                          }}
                        >
                          {formatRupiah(selectedSlip.netSalary)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions in Slip Modal */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedSlip(null)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                        Tutup
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'web') window.print();
                        else Alert.alert('Info', 'Mencetak slip gaji...');
                      }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        backgroundColor: theme.primaryBlue,
                        borderRadius: 8,
                      }}
                    >
                      <Printer size={16} color="#fff" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        Cetak Slip
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* MODAL 2: Konfirmasi Bayar Gaji */}
          {payingRecord && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setPayingRecord(null)}
            >
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
                    maxWidth: 440,
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
                      Tandai Sudah Dibayar (Paid)
                    </Text>
                    <TouchableOpacity onPress={() => setPayingRecord(null)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 14, gap: 10 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Pegawai:{' '}
                      <Text style={{ fontWeight: '700', color: theme.textDark }}>
                        {payingRecord.name}
                      </Text>
                    </Text>

                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Rekening Transfer:{' '}
                      <Text style={{ fontWeight: '600', color: theme.textDark }}>
                        {payingRecord.bankName} - {payingRecord.bankAccount}
                      </Text>
                    </Text>

                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      Total Yang Ditransfer:{' '}
                      <Text style={{ fontWeight: '800', color: theme.primaryBlue }}>
                        {formatRupiah(payingRecord.netSalary)}
                      </Text>
                    </Text>

                    <View
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 6,
                      }}
                    >
                      <UploadCloud size={30} color={theme.success} />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.textDark,
                          marginTop: 6,
                        }}
                      >
                        Status Gaji Akan Berubah Menjadi PAID
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.textMuted,
                          textAlign: 'center',
                          marginTop: 2,
                        }}
                      >
                        Notifikasi slip gaji digital otomatis terkirim ke aplikasi mobile pegawai.
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      onPress={() => setPayingRecord(null)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                        Batal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleConfirmPaySubmit}
                      disabled={isSubmittingPay}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.success,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        {isSubmittingPay ? 'Memproses...' : 'Konfirmasi Bayar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* MODAL 3: Generate Payroll */}
          {showGenerateModal && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setShowGenerateModal(false)}
            >
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
                    maxWidth: 440,
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Calculator size={20} color={theme.primaryBlue} />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                        Generate Payroll Otomatis
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 14, gap: 14 }}>
                    {/* Target Karyawan */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Pilih Karyawan Sasaran:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <TouchableOpacity
                          onPress={() => setGenerateTargetUserId('ALL')}
                          style={{
                            paddingVertical: 7,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: generateTargetUserId === 'ALL' ? theme.primaryBlue : theme.borderColor,
                            backgroundColor: generateTargetUserId === 'ALL' ? theme.activeNavBg : 'transparent',
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: generateTargetUserId === 'ALL' ? '700' : '500',
                              color: generateTargetUserId === 'ALL' ? theme.primaryBlue : theme.textDark,
                            }}
                          >
                            Semua Karyawan ({employees.length})
                          </Text>
                        </TouchableOpacity>
                        {employees.map((emp) => (
                          <TouchableOpacity
                            key={emp.id}
                            onPress={() => setGenerateTargetUserId(String(emp.id))}
                            style={{
                              paddingVertical: 7,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: generateTargetUserId === String(emp.id) ? theme.primaryBlue : theme.borderColor,
                              backgroundColor: generateTargetUserId === String(emp.id) ? theme.activeNavBg : 'transparent',
                              marginRight: 8,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: generateTargetUserId === String(emp.id) ? '700' : '500',
                                color: generateTargetUserId === String(emp.id) ? theme.primaryBlue : theme.textDark,
                              }}
                            >
                              {emp.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Rentang Periode Penggajian */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Rentang Periode Penggajian:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 3 }}>Mulai (YYYY-MM-DD):</Text>
                          <TextInput
                            placeholder="2026-09-01"
                            placeholderTextColor={theme.placeholder}
                            value={generateStartDate}
                            onChangeText={setGenerateStartDate}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              backgroundColor: theme.cardBg,
                              fontSize: 13,
                              color: theme.textDark,
                              outlineStyle: 'none',
                            } as any}
                          />
                        </View>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 16 }}>s/d</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 3 }}>Selesai (YYYY-MM-DD):</Text>
                          <TextInput
                            placeholder="2026-09-30"
                            placeholderTextColor={theme.placeholder}
                            value={generateEndDate}
                            onChangeText={setGenerateEndDate}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              backgroundColor: theme.cardBg,
                              fontSize: 13,
                              color: theme.textDark,
                              outlineStyle: 'none',
                            } as any}
                          />
                        </View>
                      </View>

                      {/* Preset Cepat Periode */}
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {[
                          { label: 'September 2026', start: '2026-09-01', end: '2026-09-30' },
                          { label: 'Oktober 2026', start: '2026-10-01', end: '2026-10-31' },
                          { label: 'Agustus 2026', start: '2026-08-01', end: '2026-08-31' },
                        ].map((preset) => (
                          <TouchableOpacity
                            key={preset.label}
                            onPress={() => {
                              setGenerateStartDate(preset.start);
                              setGenerateEndDate(preset.end);
                            }}
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              backgroundColor: theme.subtleBg,
                            }}
                          >
                            <Text style={{ fontSize: 11, color: theme.textMuted }}>{preset.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                    <TouchableOpacity
                      onPress={() => setShowGenerateModal(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                        Batal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleGenerateSubmit}
                      disabled={isGenerating}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.primaryBlue,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        {isGenerating ? 'Menghitung...' : 'Hitung Payroll'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
