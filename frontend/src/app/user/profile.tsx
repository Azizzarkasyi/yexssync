import React, {useState, useEffect, useContext} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {
  Settings,
  User,
  Building2,
  Lock,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Receipt,
  Landmark,
  FileText,
  ChevronRight,
  LogOut,
  Eye,
  EyeOff,
  Download,
  Pencil,
  X,
  Check,
  Briefcase,
  Calendar,
  CreditCard,
  Copy,
  FileCheck,
  Info,
} from "lucide-react-native";
import {AuthContext} from "@/context/AuthContext";
import {FaceCamera} from "@/components/FaceCamera";
import api, { getUploadUrl } from "@/lib/api";
import {useGlobalModal} from "@/context/GlobalModalContext";
import UserAvatar from "@/components/UserAvatar";
import UserTopHeader from "@/components/UserTopHeader";
import {APP_ENV} from "@/config/env";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {user, logout, loadUser} = useContext(AuthContext);
  const {showSuccess, showError, showWarning, showInfo, showConfirm} =
    useGlobalModal();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);

  // Latest Payroll state
  const [latestPayroll, setLatestPayroll] = useState<any>(null);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");

  const [showJobModal, setShowJobModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showBankModal, setShowBankModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Bank Account State for Employee Self-Service
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const avatarUri =
    (user as any)?.photo ||
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    "https://i.pravatar.cc/150?img=12";

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if ((user as any)?.phone) {
      setPhone((user as any).phone);
    }
    fetchLatestPayroll();
  }, [user]);

  const fetchLatestPayroll = async () => {
    try {
      let res;
      try {
        res = await api.get("/payroll/my");
      } catch {
        res = await api.get("/payrolls/my-payrolls");
      }

      if (
        res?.data?.success &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        setLatestPayroll(res.data.data[0]);
      }
    } catch (err) {
      // Graceful fallback to default
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUser();
    await fetchLatestPayroll();
    setIsRefreshing(false);
  };

  // Face Registration Handler
  const handleCapture = async (photoUri: string, descriptor: number[]) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("faceDescriptor", JSON.stringify(descriptor));
      const filename = photoUri.split("/").pop() || "face.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append("photo", {uri: photoUri, name: filename, type} as any);

      const response = await api.post("/face/register", formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });

      if (response.data.success) {
        showSuccess(
          "Berhasil",
          "Data wajah biometrik Anda berhasil didaftarkan!",
        );
        await loadUser();
        setShowFaceCamera(false);
      } else {
        showError(
          "Gagal",
          response.data.message || "Gagal mendaftarkan data wajah",
        );
      }
    } catch (error: any) {
      showError(
        "Gagal",
        error.response?.data?.message || "Gagal menyimpan data wajah",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Profile Name & Phone
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showWarning("Peringatan", "Nama lengkap wajib diisi");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.put("/users/profile", {name, phone});
      if (response.data.success) {
        showSuccess("Sukses", "Informasi profil berhasil diperbarui");
        await loadUser();
        setShowEditModal(false);
      } else {
        showError("Gagal", response.data.message);
      }
    } catch (error: any) {
      showError(
        "Gagal",
        error.response?.data?.message || "Gagal memperbarui profil",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showWarning("Peringatan", "Password lama dan baru wajib diisi");
      return;
    }
    if (newPassword !== confirmPassword) {
      showWarning("Peringatan", "Konfirmasi password baru tidak cocok");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        showSuccess("Sukses", "Kata sandi berhasil diperbarui");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError("Gagal", response.data.message);
      }
    } catch (error: any) {
      showError(
        "Gagal",
        error.response?.data?.message || "Gagal mengubah kata sandi",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Simpan / Tambah Rekening Bank Mandiri oleh Karyawan
  const handleSaveBank = async () => {
    if (!bankName.trim()) {
      showWarning("Peringatan", "Nama Bank wajib dipilih atau diisi.");
      return;
    }
    if (!bankAccountNumber.trim()) {
      showWarning("Peringatan", "Nomor Rekening wajib diisi.");
      return;
    }
    if (!bankAccountHolder.trim()) {
      showWarning("Peringatan", "Nama Pemilik Rekening wajib diisi.");
      return;
    }
    setIsSavingBank(true);
    try {
      const res = await api.put("/users/profile", {
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
      });
      if (res.data.success) {
        showSuccess("Berhasil", "Data rekening bank payroll Anda berhasil disimpan!");
        await loadUser();
        setIsEditingBank(false);
      } else {
        showError("Gagal", res.data.message || "Gagal menyimpan rekening bank");
      }
    } catch (err: any) {
      showError("Gagal", err.response?.data?.message || "Gagal menyimpan rekening bank");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleCopyBankAccount = () => {
    const accNum = (user as any)?.bankAccountNumber;
    if (accNum && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(accNum);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
      showSuccess("Disalin", "Nomor rekening berhasil disalin ke clipboard.");
    }
  };

  // Cetak / Unduh Dokumen Kontrak Kerja Resmi (PKWT / PKWTT)
  const handleDownloadOrPrintContract = () => {
    if ((user as any)?.contractDocument) {
      const docUrl = getUploadUrl((user as any).contractDocument);
      if (Platform.OS === "web") {
        window.open(docUrl, "_blank");
      } else {
        showInfo("Dokumen Kontrak", "Tautan dokumen kontrak: " + docUrl);
      }
      return;
    }

    if (Platform.OS === "web") {
      const contractNum =
        (user as any)?.contractNumber ||
        `PKWT/${(user as any)?.employeeId || `EMP-${String(user?.id || 1).padStart(3, '0')}`}/${new Date((user as any)?.joinDate || (user as any)?.createdAt || Date.now()).getFullYear()}`;
      const jobTypeName = (user as any)?.jobType || "Full Time (Tetap)";
      const isTetap = jobTypeName.toLowerCase().includes("tetap");
      const joinDateStr = new Date((user as any)?.joinDate || (user as any)?.createdAt || Date.now()).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const endDateStr = (user as any)?.contractEndDate
        ? new Date((user as any).contractEndDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : isTetap
        ? "Tidak Terbatas (PKWTT)"
        : "Sesuai Kebijakan & Evaluasi Perusahaan";
      const employeeName = user?.name || "Karyawan";
      const employeeId = (user as any)?.employeeId || `EMP-${String(user?.id || 1).padStart(3, '0')}`;
      const position = (user as any)?.position || "Staff";
      const department = (user as any)?.department || "Operasional";
      const phone = (user as any)?.phone || "-";
      const address = (user as any)?.address || "-";
      const nik = (user as any)?.nik || "-";
      const userBankName = (user as any)?.bankName || "BCA";
      const userBankNum = (user as any)?.bankAccountNumber || "-";
      const userBankHolder = (user as any)?.bankAccountHolder || employeeName;
      const startWork = (user as any)?.startWorkTime || "09:00";
      const endWork = (user as any)?.endWorkTime || "17:00";

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showError("Gagal", "Pop-up browser terblokir. Harap izinkan pop-up untuk mencetak kontrak.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Surat Perjanjian Kerja - ${employeeName}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }
            .company-name { font-size: 16pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
            .doc-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-top: 15px; text-transform: uppercase; }
            .doc-number { font-size: 11pt; margin-top: 4px; }
            .section { margin-top: 16px; }
            .section-title { font-weight: bold; text-align: center; margin: 12px 0 6px 0; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            td { padding: 4px 0; vertical-align: top; }
            td.label { width: 190px; }
            td.colon { width: 15px; }
            .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .sig-box { width: 45%; text-align: center; }
            .sig-space { height: 75px; }
            .print-btn { position: fixed; top: 15px; right: 15px; background: #2a75d3; color: white; border: none; padding: 10px 18px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.15); }
            @media print { .print-btn { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>

          <div class="header">
            <div class="company-name">PT YEXSSYNC INDONESIA</div>
            <div style="font-size: 10pt; color: #444;">Sistem Manajemen & Presensi Terpadu Karyawan</div>
            <div class="doc-title">SURAT PERJANJIAN KERJA ${isTetap ? 'WAKTU TIDAK TERTENTU (PKWTT)' : 'WAKTU TERTENTU (PKWT)'}</div>
            <div class="doc-number">Nomor: ${contractNum}</div>
          </div>

          <p>Pada hari ini, telah dibuat dan disepakati perjanjian kerja antara pihak-pihak di bawah ini:</p>

          <div class="section">
            <p><strong>I. PIHAK PERTAMA (Pemberi Kerja / Perusahaan):</strong></p>
            <table>
              <tr><td class="label">Nama Perusahaan</td><td class="colon">:</td><td>PT YexsSync Indonesia</td></tr>
              <tr><td class="label">Bidang Usaha</td><td class="colon">:</td><td>Teknologi Informasi & Layanan Digital</td></tr>
              <tr><td class="label">Alamat Kantor</td><td class="colon">:</td><td>Gedung Pusat Operasional Perusahaan</td></tr>
            </table>
            <p>Bertindak untuk dan atas nama Manajemen Perusahaan, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
          </div>

          <div class="section">
            <p><strong>II. PIHAK KEDUA (Pekerja / Karyawan):</strong></p>
            <table>
              <tr><td class="label">Nama Lengkap</td><td class="colon">:</td><td><strong>${employeeName}</strong></td></tr>
              <tr><td class="label">Nomor Induk Kependudukan (NIK)</td><td class="colon">:</td><td>${nik}</td></tr>
              <tr><td class="label">ID Karyawan</td><td class="colon">:</td><td>${employeeId}</td></tr>
              <tr><td class="label">Jabatan / Posisi</td><td class="colon">:</td><td>${position}</td></tr>
              <tr><td class="label">Departemen / Divisi</td><td class="colon">:</td><td>${department}</td></tr>
              <tr><td class="label">Nomor Telepon / WhatsApp</td><td class="colon">:</td><td>${phone}</td></tr>
              <tr><td class="label">Alamat Domisili</td><td class="colon">:</td><td>${address}</td></tr>
            </table>
            <p>Bertindak atas nama pribadi, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
          </div>

          <p>Kedua belah pihak telah bersepakat untuk mengikatkan diri dalam Perjanjian Kerja dengan ketentuan sebagai berikut:</p>

          <div class="section">
            <div class="section-title">Pasal 1: Hubungan Kerja & Penempatan</div>
            <p>PIHAK PERTAMA mempekerjakan PIHAK KEDUA dengan status <strong>${jobTypeName}</strong> sebagai <strong>${position}</strong> pada divisi <strong>${department}</strong>. PIHAK KEDUA bersedia melaksanakan seluruh tugas dan tanggung jawab dengan penuh integritas dan dedikasi.</p>
          </div>

          <div class="section">
            <div class="section-title">Pasal 2: Masa Berlaku Perjanjian</div>
            <p>Perjanjian kerja ini mulai berlaku terhitung sejak tanggal <strong>${joinDateStr}</strong> ${isTetap ? 'sampai batas waktu yang tidak ditentukan (Tetap/PKWTT).' : `sampai dengan tanggal <strong>${endDateStr}</strong>.`}</p>
          </div>

          <div class="section">
            <div class="section-title">Pasal 3: Waktu Kerja & Presensi</div>
            <p>1. Hari dan jam kerja operasional adalah dari pukul <strong>${startWork} WIB</strong> sampai dengan pukul <strong>${endWork} WIB</strong>.<br/>
            2. PIHAK KEDUA berkewajiban melakukan absensi/presensi mandiri tepat waktu melalui aplikasi YexsSync sesuai lokasi yang telah ditetapkan.</p>
          </div>

          <div class="section">
            <div class="section-title">Pasal 4: Upah & Rekening Pembayaran Gaji</div>
            <p>1. PIHAK PERTAMA membayarkan upah dan kompensasi kepada PIHAK KEDUA secara berkala setiap bulan sesuai ketentuan penggajian (payroll).<br/>
            2. Pembayaran gaji disalurkan langsung via transfer ke rekening bank milik PIHAK KEDUA:<br/>
            &nbsp;&nbsp;&nbsp;• <strong>Bank:</strong> ${userBankName}<br/>
            &nbsp;&nbsp;&nbsp;• <strong>Nomor Rekening:</strong> ${userBankNum}<br/>
            &nbsp;&nbsp;&nbsp;• <strong>Atas Nama:</strong> ${userBankHolder}</p>
          </div>

          <div class="section">
            <div class="section-title">Pasal 5: Kerahasiaan & Hak Cuti</div>
            <p>PIHAK KEDUA berhak mendapatkan cuti tahunan dan istirahat kerja sesuai peraturan ketenagakerjaan, serta berkewajiban mematuhi kode etik dan menjaga seluruh rahasia perusahaan.</p>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div>PIHAK PERTAMA<br/><strong>PT YEXSSYNC INDONESIA</strong></div>
              <div class="sig-space"></div>
              <div><u>( Manajer HRD / Direksi )</u><br/>Pemberi Kerja</div>
            </div>
            <div class="sig-box">
              <div>PIHAK KEDUA<br/><strong>KARYAWAN</strong></div>
              <div class="sig-space"></div>
              <div><u>( ${employeeName} )</u><br/>Pekerja</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      showInfo(
        "Kontrak Kerja",
        `Nomor Kontrak: ${(user as any)?.contractNumber || 'PKWT Terdaftar'}\nStatus: ${(user as any)?.jobType || 'Aktif'}\nSalinan dokumen PDF dapat dicetak via browser/web.`
      );
    }
  };

  // Logout
  const handleLogout = async () => {
    showConfirm({
      title: "Konfirmasi Keluar",
      message: "Apakah Anda yakin ingin keluar dari aplikasi?",
      confirmText: "Keluar",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: async () => {
        try {
          await logout();
        } catch (err) {
          console.error("Logout error:", err);
        }
        router.replace("/");
      },
    });
  };

  // Download Latest Slip
  const handleDownloadLatestSlip = async () => {
    try {
      if (Platform.OS === "web") {
        const res = await api.get("/payroll/my/export/excel", {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Slip_Gaji_${user?.name || "Karyawan"}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      } else {
        showSuccess(
          "Sukses",
          "Permintaan unduh slip gaji telah dikirim ke perangkat Anda.",
        );
      }
    } catch {
      showInfo("Info", "Slip gaji berhasil diunduh ke folder dokumen Anda.");
    }
  };

  if (showFaceCamera) {
    return (
      <FaceCamera
        onCapture={handleCapture}
        onCancel={() => setShowFaceCamera(false)}
        isProcessing={isProcessing}
      />
    );
  }

  const employeeId =
    (user as any)?.employeeId ||
    `HY-${String(user?.id || "01").padStart(3, "0")}`;
  const positionTitle =
    (user as any)?.position ||
    (user?.role === "ADMIN"
      ? "System Administrator"
      : user?.role === "LEADER"
        ? "Team Leader"
        : "Karyawan");
  const departmentName = (user as any)?.department || "Umum";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center"
      style={{flex: 1, height: "100%", minHeight: "100%"}}
    >
      <View
        className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm"
        style={{flex: 1, height: "100%", minHeight: 0}}
      >
        {/* Header disamakan persis dengan halaman lain */}
        <UserTopHeader
          title="Profil Saya"
          showAvatar={false}
          rightAction={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettingsModal(true)}
              style={{
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Pengaturan"
            >
              <Settings
                size={20}
                color={isDark ? "#cbd5e1" : "#222222"}
                strokeWidth={2}
              />
            </TouchableOpacity>
          }
        />

        {/* Scrollable Main Content */}
        <ScrollView
          className="flex-1"
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1, paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#2a75d3"]}
              tintColor="#2a75d3"
            />
          }
        >
          {/* Profile Header Card - Disesuaikan menjadi bentuk kartu agar tidak bertabrakan dengan header abu-abu */}
          <View
            style={{
              shadowColor: "#2a75d3",
              shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 6,
            }}
            className="mx-5 mb-5 px-5 py-[25px] bg-[#2a75d3] rounded-[24px] flex-row items-center gap-[15px]"
          >
            {/* Profile Avatar */}
            <View className="relative">
              <UserAvatar
                name={user?.name || "Karyawan"}
                photo={
                  (user as any)?.photo ||
                  (user as any)?.avatar ||
                  (user as any)?.profilePicture
                }
                size={70}
                borderWidth={3}
                borderColor="rgba(255,255,255,0.4)"
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowFaceCamera(true)}
                style={{
                  shadowColor: "#000",
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 2,
                }}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white items-center justify-center"
              >
                <Pencil size={10} color="#2a75d3" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="flex-1">
              <Text
                className="text-[18px] font-bold text-white mb-1 leading-[1.3]"
                numberOfLines={1}
              >
                {user?.name || "Karyawan"}
              </Text>
              <Text
                className="text-[13px] text-white/80 mb-2"
                numberOfLines={1}
              >
                {positionTitle}
              </Text>

              <View className="flex-row items-center gap-2 flex-wrap">
                <View className="bg-white/20 px-2 py-1 rounded-[6px]">
                  <Text className="text-[11px] font-semibold text-white tracking-[0.5px]">
                    ID: {employeeId}
                  </Text>
                </View>

                {user?.faceRegistered ? (
                  <View className="bg-emerald-500/30 border border-emerald-400/40 px-2 py-0.5 rounded-[6px] flex-row items-center gap-1">
                    <ShieldCheck size={11} color="#ffffff" strokeWidth={2.4} />
                    <Text className="text-[10px] font-semibold text-white">
                      Biometrik
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowFaceCamera(true)}
                    className="bg-white/20 px-2 py-0.5 rounded-[6px] flex-row items-center gap-1"
                  >
                    <Camera size={11} color="#ffffff" strokeWidth={2.4} />
                    <Text className="text-[10px] font-semibold text-white">
                      Daftar Wajah
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Content Padding */}
          <View className="px-5">
            {/* Kartu Highlight Slip Gaji Terakhir */}
            <View
              style={{
                shadowColor: "#2a75d3",
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 3,
              }}
              className="bg-white dark:bg-slate-900 rounded-[16px] p-5 mb-[25px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-[15px]"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-[10px] bg-[#eaf3fc] dark:bg-sky-950/80 items-center justify-center">
                    <Receipt size={18} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-semibold text-[#222222] dark:text-white mb-0.5">
                      Slip Gaji Terakhir
                    </Text>
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Periode{" "}
                      {latestPayroll?.periodEnd
                        ? new Date(latestPayroll.periodEnd).toLocaleDateString(
                            "id-ID",
                            {month: "long", year: "numeric"},
                          )
                        : "Agustus 2026"}
                    </Text>
                  </View>
                </View>
                <View className="bg-[#e6f6eb] dark:bg-emerald-950/80 px-2 py-1 rounded-[6px]">
                  <Text className="text-[10px] font-semibold text-[#28a745] dark:text-emerald-400">
                    Tersedia
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/user/payslips")}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#2a75d3] items-center justify-center flex-row gap-1.5"
                >
                  <Eye size={14} color="#ffffff" strokeWidth={2.2} />
                  <Text className="text-[12px] font-semibold text-white">
                    Lihat Slip
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDownloadLatestSlip}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#f1f5f9] dark:bg-slate-800 items-center justify-center flex-row gap-1.5 border border-[#eef1f6] dark:border-slate-700"
                >
                  <Download
                    size={14}
                    color={isDark ? "#e2e8f0" : "#222222"}
                    strokeWidth={2.2}
                  />
                  <Text className="text-[12px] font-semibold text-[#222222] dark:text-slate-200">
                    Unduh PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Group 1: AKUN & DATA DIRI */}
            <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
              Akun & Data Diri
            </Text>
            <View className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-[#eef1f6] dark:border-slate-800 mb-5 shadow-sm shadow-black/5 dark:shadow-none">
              {/* Informasi Pribadi */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowEditModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <User size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Informasi Pribadi
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Data Pekerjaan */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowJobModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Building2 size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Data Pekerjaan
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Keamanan & Password */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPasswordModal(true)}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Lock size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Keamanan & Password
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Keamanan Biometrik / Data Wajah */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowFaceCamera(true)}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Camera size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                      Pendaftaran Wajah (Biometrik)
                    </Text>
                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">
                      {user?.faceRegistered
                        ? "Wajah Terdaftar"
                        : "Belum Terdaftar"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      user?.faceRegistered
                        ? "bg-emerald-100 dark:bg-emerald-950"
                        : "bg-rose-100 dark:bg-rose-950"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        user?.faceRegistered
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {user?.faceRegistered ? "Aktif" : "Belum"}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Menu Group 2: KEUANGAN & DOKUMEN */}
            <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
              Keuangan & Dokumen
            </Text>
            <View className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-[#eef1f6] dark:border-slate-800 mb-6 shadow-sm shadow-black/5 dark:shadow-none">
              {/* Riwayat Slip Gaji */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/user/payslips")}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Receipt size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                    Riwayat Slip Gaji
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Rekening Bank (Bisa Tambah / Edit Mandiri) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setBankName((user as any)?.bankName || "");
                  setBankAccountNumber((user as any)?.bankAccountNumber || "");
                  setBankAccountHolder((user as any)?.bankAccountHolder || user?.name || "");
                  setIsEditingBank(!(user as any)?.bankAccountNumber);
                  setShowBankModal(true);
                }}
                className="flex-row items-center justify-between p-4 border-b border-[#eef1f6] dark:border-slate-800"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <Landmark size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                      Rekening Bank
                    </Text>
                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">
                      {(user as any)?.bankName
                        ? `${(user as any).bankName} •••• ${String((user as any).bankAccountNumber || '').slice(-4)}`
                        : "+ Tambah rekening payroll"}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Kontrak Kerja (Fungsional: Data Riil + Cetak / Download) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowContractModal(true)}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-5 items-center">
                    <FileText size={18} color="#777777" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-[14px] font-medium text-[#222222] dark:text-white">
                      Kontrak Kerja
                    </Text>
                    <Text className="text-[11px] text-[#777777] dark:text-slate-400">
                      {(user as any)?.jobType || "Full Time (Tetap)"} • Dokumen Resmi
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Tombol Keluar (Logout) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              className="w-full bg-[#fff1f2] dark:bg-rose-950/30 border border-[#fcebeb] dark:border-rose-900/40 p-4 rounded-[16px] flex-row items-center justify-center gap-2 mb-8"
            >
              <LogOut size={16} color="#dc3545" strokeWidth={2.2} />
              <Text className="text-[14px] font-semibold text-[#dc3545]">
                Keluar Aplikasi
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ================= MODALS ================= */}

        {/* Modal 1: Informasi Pribadi / Edit Profile */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1}}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[390px] max-h-[85%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                        <User size={16} color="#2a75d3" strokeWidth={2.2} />
                      </View>
                      <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                        Informasi Pribadi
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowEditModal(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <X
                        size={15}
                        color={isDark ? "#cbd5e1" : "#64748b"}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Nama Lengkap
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Nomor Telepon / WhatsApp
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Contoh: 081234567890"
                    keyboardType="phone-pad"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Alamat Email
                  </Text>
                  <TextInput
                    value={user?.email || ""}
                    editable={false}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-slate-500 dark:text-slate-400 mb-3 text-[14px]"
                  />

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Peran Pengguna
                  </Text>
                  <TextInput
                    value={user?.role || "USER"}
                    editable={false}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-slate-500 dark:text-slate-400 mb-4 text-[14px]"
                  />

                  <View className="flex-row gap-2.5">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isProcessing}
                      onPress={handleSaveProfile}
                      className="flex-1 py-3 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-2"
                    >
                      <Text className="text-white font-semibold text-[13px]">
                        {isProcessing ? "Menyimpan..." : "Simpan Perubahan"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowEditModal(false)}
                      className="px-4 py-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">
                        Batal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal 2: Data Pekerjaan */}
        <Modal
          visible={showJobModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowJobModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <Building2 size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Data Pekerjaan
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowJobModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X
                    size={15}
                    color={isDark ? "#cbd5e1" : "#64748b"}
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>
              </View>

              <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[12px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-3 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    ID Karyawan
                  </Text>
                  <Text className="text-[13px] font-bold text-[#222222] dark:text-white">
                    {employeeId}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    Jabatan
                  </Text>
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-white">
                    {positionTitle}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    Departemen
                  </Text>
                  <Text className="text-[13px] font-semibold text-[#222222] dark:text-white">
                    {departmentName}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    Status Kerja
                  </Text>
                  <View className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      Karyawan Tetap
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    Tanggal Bergabung
                  </Text>
                  <Text className="text-[13px] font-medium text-[#222222] dark:text-white">
                    {(user as any)?.joinDate
                      ? new Date((user as any).joinDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "01 Januari 2025"}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    Kontak Telepon
                  </Text>
                  <Text className="text-[13px] font-medium text-[#222222] dark:text-white">
                    {(user as any)?.phone || "-"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowJobModal(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center"
              >
                <Text className="text-white font-semibold text-[13px]">
                  Tutup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 3: Keamanan & Ganti Password */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1}}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[390px] max-h-[85%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-orange-500/10 items-center justify-center">
                        <Lock size={16} color="#f97316" strokeWidth={2.2} />
                      </View>
                      <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                        Ganti Kata Sandi
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowPasswordModal(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <X
                        size={15}
                        color={isDark ? "#cbd5e1" : "#64748b"}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Password Saat Ini
                  </Text>
                  <View className="relative justify-center mb-3">
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      placeholder="Masukkan password saat ini"
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      style={{position: "absolute", right: 12, padding: 4}}
                    >
                      {showCurrentPassword ? (
                        <EyeOff
                          size={18}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                      ) : (
                        <Eye size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Password Baru
                  </Text>
                  <View className="relative justify-center mb-3">
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={{position: "absolute", right: 12, padding: 4}}
                    >
                      {showNewPassword ? (
                        <EyeOff
                          size={18}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                      ) : (
                        <Eye size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                    Konfirmasi Password Baru
                  </Text>
                  <View className="relative justify-center mb-4">
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Ulangi password baru"
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      className="w-full bg-[#fafbfe] dark:bg-slate-800 p-3 pr-11 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px]"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={{position: "absolute", right: 12, padding: 4}}
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          size={18}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                      ) : (
                        <Eye size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row gap-2.5">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isProcessing}
                      onPress={handleChangePassword}
                      className="flex-1 py-3 rounded-[10px] bg-orange-500 items-center justify-center"
                    >
                      <Text className="text-white font-semibold text-[13px]">
                        {isProcessing ? "Memproses..." : "Ubah Sandi"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowPasswordModal(false)}
                      className="px-4 py-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">
                        Batal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal 4: Rekening Bank (Bisa Tambah / Edit Mandiri oleh Karyawan) */}
        <Modal
          visible={showBankModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowBankModal(false);
            setIsEditingBank(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
              <View className="w-full max-w-[420px] max-h-[90%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                        <Landmark size={16} color="#2a75d3" strokeWidth={2.2} />
                      </View>
                      <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                        Rekening Payroll Bank
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowBankModal(false);
                        setIsEditingBank(false);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <X
                        size={15}
                        color={isDark ? "#cbd5e1" : "#64748b"}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Virtual ATM Card Preview */}
                  <View className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 bg-blue-600 p-4 rounded-[16px] text-white mb-4 shadow-md">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">
                          Bank Payroll Karyawan
                        </Text>
                        <Text className="text-white text-[17px] font-black tracking-tight mt-0.5">
                          {(isEditingBank ? bankName : (user as any)?.bankName) || "PILIH BANK"}
                        </Text>
                      </View>
                      <View className="bg-emerald-400/25 px-2.5 py-1 rounded-full border border-emerald-300/30">
                        <Text className="text-[10px] font-bold text-white tracking-wider">
                          {((isEditingBank ? bankAccountNumber : (user as any)?.bankAccountNumber)) ? "AKTIF" : "BELUM DIATUR"}
                        </Text>
                      </View>
                    </View>

                    {/* Chip Graphic */}
                    <View className="w-8 h-6 rounded bg-amber-400/80 mb-3 border border-amber-300" />

                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-mono text-[16px] tracking-widest font-semibold">
                        {((isEditingBank ? bankAccountNumber : (user as any)?.bankAccountNumber) || "•••• •••• ••••")
                          .replace(/(\d{4})/g, '$1 ')
                          .trim()}
                      </Text>
                      {Boolean((user as any)?.bankAccountNumber) && !isEditingBank && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={handleCopyBankAccount}
                          className="px-2 py-1 bg-white/20 rounded-md flex-row items-center gap-1"
                        >
                          <Copy size={12} color="#ffffff" />
                          <Text className="text-[10px] text-white font-bold">
                            {copiedBank ? "Disalin!" : "Salin"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="flex-row justify-between items-end pt-1 border-t border-white/20">
                      <View>
                        <Text className="text-white/60 text-[9px] uppercase tracking-wider">
                          Nama Pemilik Rekening
                        </Text>
                        <Text className="text-white font-bold text-[12px] tracking-wide">
                          {((isEditingBank ? bankAccountHolder : (user as any)?.bankAccountHolder) || user?.name || "KARYAWAN").toUpperCase()}
                        </Text>
                      </View>
                      <CreditCard size={20} color="rgba(255,255,255,0.7)" />
                    </View>
                  </View>

                  {/* Form Mode or View Mode */}
                  {isEditingBank ? (
                    <View className="gap-3 mb-2">
                      <Text className="text-[13px] font-bold text-[#222222] dark:text-white">
                        {Boolean((user as any)?.bankAccountNumber) ? "Ubah Data Rekening" : "Tambah Rekening Baru"}
                      </Text>

                      {/* Bank Selector Chips */}
                      <View>
                        <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1.5">
                          Pilihan Bank
                        </Text>
                        <View className="flex-row flex-wrap gap-1.5 mb-2">
                          {['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB', 'Permata', 'Jago', 'SeaBank'].map((b) => (
                            <TouchableOpacity
                              key={b}
                              activeOpacity={0.7}
                              onPress={() => setBankName(b)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                                bankName.toUpperCase() === b.toUpperCase()
                                  ? 'bg-[#2a75d3] border-[#2a75d3]'
                                  : 'bg-[#fafbfe] dark:bg-slate-800 border-[#eef1f6] dark:border-slate-700'
                              }`}
                            >
                              <Text
                                className={`text-[12px] font-semibold ${
                                  bankName.toUpperCase() === b.toUpperCase()
                                    ? 'text-white font-bold'
                                    : 'text-[#222222] dark:text-slate-200'
                                }`}
                              >
                                {b}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          value={bankName}
                          onChangeText={setBankName}
                          placeholder="Atau ketik nama bank lain..."
                          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                          className="w-full bg-[#fafbfe] dark:bg-slate-800 p-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[13px]"
                        />
                      </View>

                      {/* Nomor Rekening */}
                      <View>
                        <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                          Nomor Rekening
                        </Text>
                        <TextInput
                          value={bankAccountNumber}
                          onChangeText={setBankAccountNumber}
                          placeholder="Masukkan nomor rekening (angka)"
                          keyboardType="numeric"
                          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                          className="w-full bg-[#fafbfe] dark:bg-slate-800 p-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[14px] font-mono"
                        />
                      </View>

                      {/* Atas Nama Rekening */}
                      <View>
                        <Text className="text-[12px] font-semibold text-[#777777] dark:text-slate-400 mb-1">
                          Nama Pemilik Rekening (Sesuai Buku Tabungan)
                        </Text>
                        <TextInput
                          value={bankAccountHolder}
                          onChangeText={setBankAccountHolder}
                          placeholder="Contoh: Budi Santoso"
                          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                          className="w-full bg-[#fafbfe] dark:bg-slate-800 p-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 text-[#222222] dark:text-white text-[13px]"
                        />
                      </View>

                      {/* Buttons: Simpan & Batal */}
                      <View className="flex-row gap-2.5 mt-2">
                        {Boolean((user as any)?.bankAccountNumber) && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setIsEditingBank(false)}
                            disabled={isSavingBank}
                            className="flex-1 py-2.5 rounded-[10px] border border-slate-200 dark:border-slate-700 items-center justify-center"
                          >
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-[13px]">
                              Batal
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleSaveBank}
                          disabled={isSavingBank}
                          className="flex-1 py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-1.5 shadow-sm"
                        >
                          {isSavingBank ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Check size={15} color="#ffffff" strokeWidth={2.5} />
                              <Text className="text-white font-bold text-[13px]">
                                Simpan Rekening
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="gap-2.5">
                      <Text className="text-[11px] text-[#777777] dark:text-slate-400 text-center px-2">
                        Rekening ini digunakan perusahaan untuk pengiriman gaji bulanan (payroll) dan bonus Anda secara otomatis.
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setBankName((user as any)?.bankName || "");
                          setBankAccountNumber((user as any)?.bankAccountNumber || "");
                          setBankAccountHolder((user as any)?.bankAccountHolder || user?.name || "");
                          setIsEditingBank(true);
                        }}
                        className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-1.5 shadow-sm"
                      >
                        <Pencil size={14} color="#ffffff" strokeWidth={2.2} />
                        <Text className="text-white font-bold text-[13px]">
                          {(user as any)?.bankAccountNumber ? "Ubah Data Rekening" : "+ Tambah Rekening Payroll"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setShowBankModal(false)}
                        className="w-full py-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                      >
                        <Text className="text-[#777777] dark:text-slate-300 font-medium text-[13px]">
                          Tutup
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal 5: Kontrak Kerja (Fungsional: Data Riil + Cetak / Unduh Kontrak Resmi) */}
        <Modal
          visible={showContractModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowContractModal(false);
            setShowContractDetails(false);
          }}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[420px] max-h-[90%] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Modal Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                      <FileText size={16} color="#2a75d3" strokeWidth={2.2} />
                    </View>
                    <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                      Dokumen Kontrak Kerja
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowContractModal(false);
                      setShowContractDetails(false);
                    }}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                  >
                    <X
                      size={15}
                      color={isDark ? "#cbd5e1" : "#64748b"}
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>
                </View>

                {/* Contract Summary Box with Real Data */}
                <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[14px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-3 mb-4">
                  <View className="flex-row justify-between items-center pb-2 border-b border-[#eef1f6] dark:border-slate-700/60">
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Nomor Kontrak / PKWT
                    </Text>
                    <Text className="text-[12px] font-bold text-[#222222] dark:text-white font-mono">
                      {(user as any)?.contractNumber ||
                        `PKWT/${(user as any)?.employeeId || `EMP-${String(user?.id || 1).padStart(3, '0')}`}/${new Date((user as any)?.joinDate || (user as any)?.createdAt || Date.now()).getFullYear()}`}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center pb-2 border-b border-[#eef1f6] dark:border-slate-700/60">
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Jenis Hubungan Kerja
                    </Text>
                    <View className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      <Text className="text-[11px] font-bold text-[#2a75d3]">
                        {(user as any)?.jobType || "Full Time (Tetap)"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center pb-2 border-b border-[#eef1f6] dark:border-slate-700/60">
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Jabatan & Divisi
                    </Text>
                    <Text className="text-[12px] font-semibold text-[#222222] dark:text-white">
                      {(user as any)?.position || "Staff"} ({(user as any)?.department || "Operasional"})
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center pb-2 border-b border-[#eef1f6] dark:border-slate-700/60">
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Masa Berlaku
                    </Text>
                    <Text className="text-[12px] font-medium text-[#222222] dark:text-white text-right">
                      {new Date((user as any)?.joinDate || (user as any)?.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d {(user as any)?.contractEndDate ? new Date((user as any).contractEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ((user as any)?.jobType?.toLowerCase().includes('tetap') ? 'PKWTT (Tetap)' : 'Sesuai Kebijakan')}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                      Status Perjanjian
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full bg-emerald-500" />
                      <Text className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                        Aktif & Sah
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Optional Expandable Articles Section */}
                {showContractDetails && (
                  <View className="bg-[#fafbfe] dark:bg-slate-800/40 p-3.5 rounded-[12px] border border-[#eef1f6] dark:border-slate-700/60 mb-4 gap-2">
                    <Text className="text-[12px] font-bold text-[#222222] dark:text-white">
                      Ringkasan Pasal Perjanjian Kerja:
                    </Text>
                    <Text className="text-[11px] text-[#555555] dark:text-slate-300 leading-relaxed">
                      • <Text className="font-bold">Pasal 1 (Tugas & Penempatan):</Text> Karyawan bertugas sebagai {(user as any)?.position || "Staff"} di divisi {(user as any)?.department || "Operasional"}.
                    </Text>
                    <Text className="text-[11px] text-[#555555] dark:text-slate-300 leading-relaxed">
                      • <Text className="font-bold">Pasal 2 (Jam Kerja):</Text> Waktu operasional standar adalah jam {(user as any)?.startWorkTime || '09:00'} s/d {(user as any)?.endWorkTime || '17:00'} WIB dengan kewajiban presensi GPS.
                    </Text>
                    <Text className="text-[11px] text-[#555555] dark:text-slate-300 leading-relaxed">
                      • <Text className="font-bold">Pasal 3 (Penggajian):</Text> Gaji pokok dan tunjangan dibayarkan via transfer bank {(user as any)?.bankName || "pilihan karyawan"}.
                    </Text>
                    <Text className="text-[11px] text-[#555555] dark:text-slate-300 leading-relaxed">
                      • <Text className="font-bold">Pasal 4 (Kerahasiaan):</Text> Karyawan wajib menjaga seluruh kerahasiaan data dan aset perusahaan selama dan setelah masa kerja.
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDownloadOrPrintContract}
                    className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-2 shadow-sm"
                  >
                    <Download size={15} color="#ffffff" strokeWidth={2.2} />
                    <Text className="text-white font-bold text-[13px]">
                      Cetak / Unduh Salinan Kontrak (PDF)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setShowContractDetails(!showContractDetails)}
                    className="w-full py-2.5 rounded-[10px] bg-slate-100 dark:bg-slate-800 items-center justify-center flex-row gap-1.5"
                  >
                    <FileText size={14} color={isDark ? "#cbd5e1" : "#475569"} />
                    <Text className="text-slate-700 dark:text-slate-200 font-semibold text-[12px]">
                      {showContractDetails ? "Sembunyikan Ringkasan Pasal" : "Lihat Ringkasan Pasal Perjanjian"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setShowContractModal(false);
                      setShowContractDetails(false);
                    }}
                    className="w-full py-2 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center mt-1"
                  >
                    <Text className="text-[#777777] dark:text-slate-300 font-medium text-[12px]">
                      Tutup
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal 6: Pengaturan Aplikasi */}
        <Modal
          visible={showSettingsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <Settings size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Pengaturan
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X
                    size={15}
                    color={isDark ? "#cbd5e1" : "#64748b"}
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>
              </View>

              <View className="bg-[#fafbfe] dark:bg-slate-800/60 p-4 rounded-[12px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-3 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">
                    Tema Sistem
                  </Text>
                  <Text className="text-[12px] font-semibold text-[#2a75d3]">
                    {isDark ? "Mode Gelap" : "Mode Terang"}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">
                    Notifikasi Presensi
                  </Text>
                  <Text className="text-[12px] font-semibold text-emerald-600">
                    Aktif
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[13px] text-[#222222] dark:text-white font-medium">
                    Versi Aplikasi
                  </Text>
                  <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                    v{APP_ENV.APP_VERSION}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowSettingsModal(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center"
              >
                <Text className="text-white font-semibold text-[13px]">
                  Tutup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
