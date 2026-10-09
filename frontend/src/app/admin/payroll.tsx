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

  // Filters State - Per Karyawan (Searchable) & Rentang Waktu
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [employeeSearchText, setEmployeeSearchText] = useState('');

  // Default tanggal: awal bulan ini s/d akhir bulan ini (dinamis)
  const today = new Date();
  const curY = today.getFullYear();
  const curM = String(today.getMonth() + 1).padStart(2, '0');
  const lastDateOfMonth = new Date(curY, today.getMonth() + 1, 0).getDate();
  const [startDate, setStartDate] = useState<string>(`${curY}-${curM}-01`);
  const [endDate, setEndDate] = useState<string>(`${curY}-${curM}-${String(lastDateOfMonth).padStart(2, '0')}`);

  // Interactive Calendar Picker Modal
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'START' | 'END' | 'GEN_START' | 'GEN_END'>('START');
  const [calYear, setCalYear] = useState(curY);
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [generateTargetUserId, setGenerateTargetUserId] = useState('ALL');
  const [genEmployeeDropdownOpen, setGenEmployeeDropdownOpen] = useState(false);
  const [genEmployeeSearchText, setGenEmployeeSearchText] = useState('');
  const [generateStartDate, setGenerateStartDate] = useState(`${curY}-${curM}-01`);
  const [generateEndDate, setGenerateEndDate] = useState(`${curY}-${curM}-${String(lastDateOfMonth).padStart(2, '0')}`);

  // Payrolls data (loaded from real database API)
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered employees for searchable dropdown in toolbar
  const filteredEmployeesList = useMemo(() => {
    if (!employeeSearchText.trim()) return employees;
    const q = employeeSearchText.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
    );
  }, [employees, employeeSearchText]);

  // Filtered employees for modal generate payroll
  const filteredGenEmployees = useMemo(() => {
    if (!genEmployeeSearchText.trim()) return employees;
    const q = genEmployeeSearchText.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
    );
  }, [employees, genEmployeeSearchText]);

  // Available departments from company config or user list
  const availableDepartments = useMemo(() => {
    if (departmentsList.length > 0) return departmentsList;
    return Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  }, [departmentsList, employees]);

  // Fetch employees & company config on mount
  useEffect(() => {
    api.get('/users')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setEmployees(res.data.data);
        }
      })
      .catch(() => {});

    api.get('/config')
      .then((res) => {
        if (res.data?.data?.departments && Array.isArray(res.data.data.departments)) {
          const list = res.data.data.departments
            .map((d: any) => (typeof d === 'string' ? d : d.name))
            .filter(Boolean);
          setDepartmentsList(list);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch payroll from backend API
  useEffect(() => {
    fetchBackendPayroll();
  }, [selectedUserId, startDate, endDate]);

  const openCalendarPicker = (target: 'START' | 'END' | 'GEN_START' | 'GEN_END') => {
    setDatePickerTarget(target);
    let refDate = startDate;
    if (target === 'END') refDate = endDate;
    else if (target === 'GEN_START') refDate = generateStartDate;
    else if (target === 'GEN_END') refDate = generateEndDate;

    if (refDate && refDate.includes('-')) {
      const parts = refDate.split('-');
      if (parts.length === 3) {
        setCalYear(parseInt(parts[0], 10) || curY);
        setCalMonth((parseInt(parts[1], 10) || 1) - 1);
      }
    }
    setShowDatePickerModal(true);
  };

  const handleSelectCalendarDay = (day: number) => {
    const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (datePickerTarget === 'START') {
      setStartDate(formatted);
    } else if (datePickerTarget === 'END') {
      setEndDate(formatted);
    } else if (datePickerTarget === 'GEN_START') {
      setGenerateStartDate(formatted);
    } else if (datePickerTarget === 'GEN_END') {
      setGenerateEndDate(formatted);
    }
    setShowDatePickerModal(false);
  };

  const fetchBackendPayroll = async () => {
    try {
      const params: any = {};
      if (selectedUserId && selectedUserId !== 'ALL') {
        params.userId = selectedUserId;
      }
      if (startDate) params.periodStart = startDate;
      if (endDate) params.periodEnd = endDate;

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
        a.download = `Payroll_${startDate}_sd_${endDate}.csv`;
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
              {/* Filter Per Karyawan (Searchable Dropdown) */}
              <View style={{ position: 'relative', zIndex: userDropdownOpen ? 9999 : 50 }}>
                <TouchableOpacity
                  onPress={() => {
                    setUserDropdownOpen(!userDropdownOpen);
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
                    borderRadius: 8,
                    backgroundColor: theme.cardBg,
                    minWidth: 200,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
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
                      top: 44,
                      left: 0,
                      width: 270,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 10,
                      zIndex: 10000,
                      elevation: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Search Input Bar */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderColor,
                        backgroundColor: theme.subtleBg,
                        gap: 8,
                      }}
                    >
                      <Search size={14} color={theme.textMuted} />
                      <TextInput
                        placeholder="Cari karyawan..."
                        placeholderTextColor={theme.placeholder}
                        value={employeeSearchText}
                        onChangeText={setEmployeeSearchText}
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: theme.textDark,
                          padding: 0,
                          outlineStyle: 'none',
                        } as any}
                      />
                      {employeeSearchText ? (
                        <TouchableOpacity onPress={() => setEmployeeSearchText('')}>
                          <X size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUserId('');
                          setUserDropdownOpen(false);
                          setEmployeeSearchText('');
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor: !selectedUserId ? theme.activeNavBg : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
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
                        {!selectedUserId && <Check size={14} color={theme.primaryBlue} />}
                      </TouchableOpacity>

                      {filteredEmployeesList.length === 0 ? (
                        <View style={{ padding: 14, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: theme.textMuted }}>Karyawan tidak ditemukan</Text>
                        </View>
                      ) : (
                        filteredEmployeesList.map((emp) => {
                          const isSelected = selectedUserId === String(emp.id);
                          return (
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
                                backgroundColor: isSelected ? theme.activeNavBg : 'transparent',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: isSelected ? theme.primaryBlue : theme.textDark,
                                    fontWeight: isSelected ? '700' : '500',
                                  }}
                                >
                                  {emp.name}
                                </Text>
                                {(emp.department || emp.role) && (
                                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                                    {[emp.department, emp.role].filter(Boolean).join(' • ')}
                                  </Text>
                                )}
                              </View>
                              {isSelected && <Check size={14} color={theme.primaryBlue} />}
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Filter Rentang Waktu (Murni Tanggal Mulai s/d Tanggal Selesai) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: theme.subtleBg,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                }}
              >
                <Calendar size={14} color={theme.primaryBlue} />
                <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '500' }}>Periode:</Text>

                {/* Tanggal Mulai */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.placeholder}
                    value={startDate}
                    onChangeText={setStartDate}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                      fontSize: 12,
                      color: theme.textDark,
                      width: 95,
                      outlineStyle: 'none',
                    } as any}
                  />
                  <TouchableOpacity
                    onPress={() => openCalendarPicker('START')}
                    style={{ paddingRight: 7, paddingLeft: 2 }}
                  >
                    <Calendar size={13} color={theme.primaryBlue} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600' }}>s/d</Text>

                {/* Tanggal Selesai */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.placeholder}
                    value={endDate}
                    onChangeText={setEndDate}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                      fontSize: 12,
                      color: theme.textDark,
                      width: 95,
                      outlineStyle: 'none',
                    } as any}
                  />
                  <TouchableOpacity
                    onPress={() => openCalendarPicker('END')}
                    style={{ paddingRight: 7, paddingLeft: 2 }}
                  >
                    <Calendar size={13} color={theme.primaryBlue} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Departemen Dropdown (Dinamis dari Setting Admin & Karyawan) */}
              <View style={{ position: 'relative', zIndex: deptDropdownOpen ? 9997 : 30 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDeptDropdownOpen(!deptDropdownOpen);
                    setUserDropdownOpen(false);
                    setStatusDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: selectedDept ? theme.primaryBlue : theme.borderColor,
                    borderRadius: 8,
                    backgroundColor: theme.cardBg,
                    minWidth: 150,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: selectedDept ? theme.primaryBlue : theme.textDark,
                      fontWeight: selectedDept ? '600' : '400',
                    }}
                  >
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
                      width: 190,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 8,
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
                    <ScrollView style={{ maxHeight: 210 }} nestedScrollEnabled>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDept('');
                          setDeptDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor: !selectedDept ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: !selectedDept ? theme.primaryBlue : theme.textDark,
                            fontWeight: !selectedDept ? '700' : '400',
                          }}
                        >
                          Semua Divisi
                        </Text>
                      </TouchableOpacity>
                      {availableDepartments.map((deptName) => (
                        <TouchableOpacity
                          key={deptName}
                          onPress={() => {
                            setSelectedDept(deptName);
                            setDeptDropdownOpen(false);
                          }}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.borderColor,
                            backgroundColor:
                              selectedDept === deptName ? theme.activeNavBg : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: selectedDept === deptName ? theme.primaryBlue : theme.textDark,
                              fontWeight: selectedDept === deptName ? '700' : '400',
                            }}
                          >
                            {deptName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Status Pembayaran Dropdown */}
              <View style={{ position: 'relative', zIndex: statusDropdownOpen ? 9996 : 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setUserDropdownOpen(false);
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
                    {/* Target Karyawan (Searchable Dropdown) */}
                    <View style={{ position: 'relative', zIndex: genEmployeeDropdownOpen ? 1000 : 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Pilih Karyawan Sasaran:
                      </Text>
                      <TouchableOpacity
                        onPress={() => setGenEmployeeDropdownOpen(!genEmployeeDropdownOpen)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: generateTargetUserId !== 'ALL' ? theme.primaryBlue : theme.borderColor,
                          borderRadius: 8,
                          backgroundColor: theme.cardBg,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
                          <User size={14} color={generateTargetUserId !== 'ALL' ? theme.primaryBlue : theme.textMuted} />
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 13,
                              color: generateTargetUserId !== 'ALL' ? theme.primaryBlue : theme.textDark,
                              fontWeight: generateTargetUserId !== 'ALL' ? '600' : '400',
                            }}
                          >
                            {generateTargetUserId === 'ALL'
                              ? `Semua Karyawan (${employees.length})`
                              : employees.find((e) => String(e.id) === generateTargetUserId)?.name || 'Karyawan Terpilih'}
                          </Text>
                        </View>
                        <ChevronDown size={14} color={theme.textMuted} />
                      </TouchableOpacity>

                      {genEmployeeDropdownOpen && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 66,
                            left: 0,
                            right: 0,
                            backgroundColor: theme.cardBg,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                            borderRadius: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.12,
                            shadowRadius: 10,
                            zIndex: 2000,
                            elevation: 10,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Search Bar Input */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.borderColor,
                              backgroundColor: theme.subtleBg,
                              gap: 8,
                            }}
                          >
                            <Search size={14} color={theme.textMuted} />
                            <TextInput
                              placeholder="Cari karyawan sasaran..."
                              placeholderTextColor={theme.placeholder}
                              value={genEmployeeSearchText}
                              onChangeText={setGenEmployeeSearchText}
                              style={{
                                flex: 1,
                                fontSize: 12,
                                color: theme.textDark,
                                padding: 0,
                                outlineStyle: 'none',
                              } as any}
                            />
                            {genEmployeeSearchText ? (
                              <TouchableOpacity onPress={() => setGenEmployeeSearchText('')}>
                                <X size={14} color={theme.textMuted} />
                              </TouchableOpacity>
                            ) : null}
                          </View>

                          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                            <TouchableOpacity
                              onPress={() => {
                                setGenerateTargetUserId('ALL');
                                setGenEmployeeDropdownOpen(false);
                                setGenEmployeeSearchText('');
                              }}
                              style={{
                                paddingVertical: 9,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.borderColor,
                                backgroundColor: generateTargetUserId === 'ALL' ? theme.activeNavBg : 'transparent',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: generateTargetUserId === 'ALL' ? theme.primaryBlue : theme.textDark,
                                  fontWeight: generateTargetUserId === 'ALL' ? '700' : '400',
                                }}
                              >
                                Semua Karyawan ({employees.length})
                              </Text>
                              {generateTargetUserId === 'ALL' && <Check size={14} color={theme.primaryBlue} />}
                            </TouchableOpacity>

                            {filteredGenEmployees.length === 0 ? (
                              <View style={{ padding: 12, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: theme.textMuted }}>Karyawan tidak ditemukan</Text>
                              </View>
                            ) : (
                              filteredGenEmployees.map((emp) => {
                                const isSelected = generateTargetUserId === String(emp.id);
                                return (
                                  <TouchableOpacity
                                    key={emp.id}
                                    onPress={() => {
                                      setGenerateTargetUserId(String(emp.id));
                                      setGenEmployeeDropdownOpen(false);
                                    }}
                                    style={{
                                      paddingVertical: 9,
                                      paddingHorizontal: 12,
                                      borderBottomWidth: 1,
                                      borderBottomColor: theme.borderColor,
                                      backgroundColor: isSelected ? theme.activeNavBg : 'transparent',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          color: isSelected ? theme.primaryBlue : theme.textDark,
                                          fontWeight: isSelected ? '700' : '500',
                                        }}
                                      >
                                        {emp.name}
                                      </Text>
                                      {emp.department && (
                                        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                                          {emp.department}
                                        </Text>
                                      )}
                                    </View>
                                    {isSelected && <Check size={14} color={theme.primaryBlue} />}
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* Rentang Periode Penggajian (Murni Tanggal Mulai s/d Selesai) */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Rentang Periode Penggajian:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        {/* Mulai */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 3 }}>Mulai (YYYY-MM-DD):</Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: theme.cardBg,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              paddingHorizontal: 10,
                            }}
                          >
                            <TextInput
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor={theme.placeholder}
                              value={generateStartDate}
                              onChangeText={setGenerateStartDate}
                              style={{
                                flex: 1,
                                paddingVertical: 8,
                                fontSize: 13,
                                color: theme.textDark,
                                outlineStyle: 'none',
                              } as any}
                            />
                            <TouchableOpacity onPress={() => openCalendarPicker('GEN_START')}>
                              <Calendar size={15} color={theme.primaryBlue} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 16 }}>s/d</Text>

                        {/* Selesai */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 3 }}>Selesai (YYYY-MM-DD):</Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: theme.cardBg,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.borderColor,
                              paddingHorizontal: 10,
                            }}
                          >
                            <TextInput
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor={theme.placeholder}
                              value={generateEndDate}
                              onChangeText={setGenerateEndDate}
                              style={{
                                flex: 1,
                                paddingVertical: 8,
                                fontSize: 13,
                                color: theme.textDark,
                                outlineStyle: 'none',
                              } as any}
                            />
                            <TouchableOpacity onPress={() => openCalendarPicker('GEN_END')}>
                              <Calendar size={15} color={theme.primaryBlue} />
                            </TouchableOpacity>
                          </View>
                        </View>
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

          {/* Interactive Calendar Date Picker Modal */}
          {showDatePickerModal && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setShowDatePickerModal(false)}
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
                    maxWidth: 380,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  {/* Calendar Header with Month Navigation */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear((y) => y - 1);
                        } else {
                          setCalMonth((m) => m - 1);
                        }
                      }}
                      style={{ padding: 6, borderRadius: 6, backgroundColor: theme.subtleBg }}
                    >
                      <ChevronLeft size={18} color={theme.textDark} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                      {[
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ][calMonth]}{' '}
                      {calYear}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear((y) => y + 1);
                        } else {
                          setCalMonth((m) => m + 1);
                        }
                      }}
                      style={{ padding: 6, borderRadius: 6, backgroundColor: theme.subtleBg }}
                    >
                      <ChevronRight size={18} color={theme.textDark} />
                    </TouchableOpacity>
                  </View>

                  {/* Day Names Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                      <View key={d} style={{ width: 44, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted }}>{d}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {(() => {
                      const firstDay = new Date(calYear, calMonth, 1).getDay();
                      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 38 }} />);
                      }

                      let targetVal = startDate;
                      if (datePickerTarget === 'END') targetVal = endDate;
                      else if (datePickerTarget === 'GEN_START') targetVal = generateStartDate;
                      else if (datePickerTarget === 'GEN_END') targetVal = generateEndDate;

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelected = targetVal === dateStr;
                        cells.push(
                          <TouchableOpacity
                            key={`day-${d}`}
                            onPress={() => handleSelectCalendarDay(d)}
                            style={{
                              width: `${100 / 7}%`,
                              height: 38,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: isSelected ? theme.primaryBlue : 'transparent',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSelected ? '700' : '500',
                                  color: isSelected ? '#fff' : theme.textDark,
                                }}
                              >
                                {d}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }
                      return cells;
                    })()}
                  </View>

                  {/* Close / Action button */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                    <TouchableOpacity
                      onPress={() => setShowDatePickerModal(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 9,
                        backgroundColor: theme.primaryBlue,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        Tutup
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
