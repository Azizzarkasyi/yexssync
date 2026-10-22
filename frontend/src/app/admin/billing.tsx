import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Copy,
  Building2,
  UploadCloud,
  Check,
  RefreshCw,
  Coins,
  Calendar,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import api from '@/lib/api';

export default function AdminBillingScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [billingData, setBillingData] = useState<{
    hasUnpaidBilling: boolean;
    billing: any;
    subscriptionStatus: any;
    bankDetails: {
      bankName?: string;
      bankAccount?: string;
      bankAccountName?: string;
    } | null;
  } | null>(null);

  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    fileObj?: any;
    name?: string;
  } | null>(null);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await api.get('/config/billing');
      if (res.data?.success && res.data.data) {
        setBillingData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleCopyAccount = (accountNumber: string) => {
    if (!accountNumber) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      Alert.alert('Tersalin', `Nomor rekening ${accountNumber} berhasil disalin.`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            window.alert('Ukuran foto maksimal 5 MB.');
            return;
          }
          const objectUrl = URL.createObjectURL(file);
          setSelectedImage({
            uri: objectUrl,
            fileObj: file,
            name: file.name,
          });
        }
      };
      input.click();
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.85,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setSelectedImage({
            uri: asset.uri,
            name: asset.fileName || 'bukti-transfer.jpg',
          });
        }
      } catch (err) {
        console.warn('Pick image error:', err);
      }
    }
  };

  const handleUploadProof = async () => {
    if (!billingData?.billing?.id) {
      Alert.alert('Perhatian', 'Data tagihan tidak ditemukan.');
      return;
    }
    if (!selectedImage) {
      Alert.alert('Perhatian', 'Harap pilih foto struk/bukti transfer terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && selectedImage.fileObj) {
        formData.append('paymentProof', selectedImage.fileObj);
      } else {
        formData.append('paymentProof', {
          uri: selectedImage.uri,
          name: selectedImage.name || 'bukti-transfer.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const res = await api.post(`/config/billing/${billingData.billing.id}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        if (Platform.OS === 'web') {
          window.alert('Bukti pembayaran berhasil diunggah! SuperAdmin akan memverifikasi pembayaran Anda.');
        } else {
          Alert.alert('Sukses', 'Bukti pembayaran berhasil diunggah! SuperAdmin akan memverifikasi pembayaran Anda.');
        }
        setSelectedImage(null);
        fetchBilling();
      } else {
        Alert.alert('Gagal', res.data?.message || 'Gagal mengunggah bukti pembayaran.');
      }
    } catch (err: any) {
      Alert.alert('Gagal Mengunggah', err.response?.data?.message || 'Terjadi kesalahan saat mengunggah bukti bayar.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + (val || 0).toLocaleString('id-ID');
  };

  const formatDateIndo = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const billing = billingData?.billing;
  const subStatus = billingData?.subscriptionStatus;
  const bank = billingData?.bankDetails;

  const isBlocked = subStatus?.isBlocked;
  const isInGrace = subStatus?.isInGracePeriod;
  const daysLeft = subStatus?.daysLeftInGrace ?? 0;

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* Sidebar */}
      <AdminSidebar
        currentPath="/admin/billing"
        isDesktop={isDesktop}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
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
        >
          {/* Header */}
          <AdminTopHeader
            title="Langganan & Tagihan Kantor"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            rightAction={
              <TouchableOpacity
                onPress={fetchBilling}
                title="Muat Ulang Status"
                style={{
                  padding: 9,
                  borderRadius: 8,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw size={16} color={theme.primaryBlue} className={loading ? 'animate-spin' : ''} />
              </TouchableOpacity>
            }
          />

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={theme.primaryBlue} />
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 12 }}>
                Memuat data tagihan langganan...
              </Text>
            </View>
          ) : !billing ? (
            <View
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.borderColor,
                marginTop: 10,
              }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <CheckCircle2 size={36} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textDark }}>
                Status Langganan Anda Aktif & Lunas
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 8, maxWidth: 440, lineHeight: 20 }}>
                Tidak ada tagihan tertunggak untuk perusahaan Anda saat ini. Semua karyawan dapat melakukan presensi secara normal.
              </Text>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginTop: 10 }}>
              {/* Kolom Kiri: Status & Rincian Biaya */}
              <View style={{ flex: 1.2, gap: 16 }}>
                {/* Banner Status */}
                {isBlocked ? (
                  <View
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                      borderWidth: 1,
                      borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca',
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <ShieldAlert size={26} color={theme.isDark ? '#f87171' : '#dc2626'} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.isDark ? '#fca5a5' : '#991b1b' }}>
                        Layanan Presensi Ditangguhkan
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.isDark ? '#f87171' : '#b91c1c', marginTop: 2, lineHeight: 18 }}>
                        Tagihan telah melewati batas masa tenggat pembayaran. Akses absensi seluruh karyawan saat ini dinonaktifkan sementara sampai pembayaran diverifikasi.
                      </Text>
                    </View>
                  </View>
                ) : isInGrace ? (
                  <View
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                      borderWidth: 1,
                      borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.4)' : '#fef3c7',
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Clock size={26} color={theme.isDark ? '#fbbf24' : '#d97706'} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.isDark ? '#fcd34d' : '#92400e' }}>
                        Peringatan Masa Tenggat: Sisa {daysLeft} Hari Lagi
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.isDark ? '#fbbf24' : '#b45309', marginTop: 2, lineHeight: 18 }}>
                        Harap segera lakukan transfer pembayaran sebelum batas toleransi berakhir agar presensi karyawan tidak terblokir otomatis.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff',
                      borderWidth: 1,
                      borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.4)' : '#e0f2fe',
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <CreditCard size={24} color={theme.primaryBlue} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.isDark ? '#93c5fd' : '#0369a1' }}>
                        Tagihan Bulan {billing.month}/{billing.year} Menunggu Pembayaran
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.isDark ? '#60a5fa' : '#0284c7', marginTop: 2 }}>
                        Jatuh tempo pada {formatDateIndo(billing.dueDate || subStatus?.dueDate)}.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Detail Faktur Card */}
                <View style={{ backgroundColor: theme.cardBg, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: theme.borderColor, gap: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark, marginBottom: 4 }}>
                    Rincian Tagihan Bulan {billing.month}/{billing.year}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Jumlah Karyawan Aktif:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>{billing.userCount} Orang</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Tarif per Karyawan:</Text>
                    <Text style={{ fontSize: 13, color: theme.textDark }}>{formatRupiah(billing.costPerUser)} / bulan</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Tanggal Jatuh Tempo:</Text>
                    <Text style={{ fontSize: 13, color: theme.textDark }}>{formatDateIndo(billing.dueDate || subStatus?.dueDate)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Batas Akhir Toleransi (Masa Tenggat):</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isBlocked ? (theme.isDark ? '#f87171' : '#dc2626') : theme.textDark }}>
                      {formatDateIndo(subStatus?.deadlineDate)}
                    </Text>
                  </View>

                  <View style={{ borderTopWidth: 1, borderTopColor: theme.borderColor, paddingTop: 14, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>Total Pembayaran:</Text>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primaryBlue }}>{formatRupiah(billing.amount)}</Text>
                  </View>
                </View>

                {/* Rekening Tujuan Transfer */}
                <View style={{ backgroundColor: theme.cardBg, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: theme.borderColor }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Rekening Tujuan Pembayaran Resmi
                  </Text>

                  <View style={{ backgroundColor: theme.sidebarBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.borderColor, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>Nama Bank:</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark }}>{bank?.bankName || 'BCA / Mandiri'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>Atas Nama Rekening:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>{bank?.bankAccountName || 'PT YexsSync Indonesia'}</Text>
                    </View>
                  </View>

                  {bank?.bankAccount && (
                    <View
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe',
                        borderWidth: 1,
                        borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.3)' : '#bae6fd',
                        padding: 14,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 11, color: theme.isDark ? '#93c5fd' : '#0369a1', fontWeight: '500' }}>Nomor Rekening Tujuan:</Text>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.isDark ? '#38bdf8' : '#0284c7', fontFamily: 'monospace', letterSpacing: 1 }}>
                          {bank.bankAccount}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleCopyAccount(bank.bankAccount!)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: theme.isDark ? theme.cardBg : '#ffffff',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.isDark ? theme.borderColor : '#bae6fd',
                        }}
                      >
                        {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} color={theme.primaryBlue} />}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: copied ? '#16a34a' : theme.primaryBlue }}>
                          {copied ? 'Tersalin' : 'Salin Rekening'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Kolom Kanan: Form Upload Bukti Transfer */}
              <View style={{ flex: 1, gap: 16 }}>
                <View style={{ backgroundColor: theme.cardBg, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: theme.borderColor }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textDark, marginBottom: 4 }}>
                    Konfirmasi Pembayaran
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16, lineHeight: 18 }}>
                    Setelah melakukan transfer ke rekening di samping, harap unggah foto bukti transfer di bawah ini agar pembayaran dapat segera diverifikasi.
                  </Text>

                  {/* Status jika sudah pernah upload */}
                  {billing.paymentProof && (
                    <View style={{ backgroundColor: theme.sidebarBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.borderColor, marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <CheckCircle2 size={16} color={theme.primaryBlue} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryBlue }}>
                          Bukti Pembayaran Sudah Diunggah
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: theme.textMuted, lineHeight: 16, marginBottom: 8 }}>
                        Bukti transfer Anda sedang dalam antrean verifikasi oleh SuperAdmin. Anda dapat mengunggah foto baru jika ingin mengganti bukti.
                      </Text>
                      <Image
                        source={{ uri: billing.paymentProof.startsWith('http') ? billing.paymentProof : `${api.defaults.baseURL?.replace('/api', '')}${billing.paymentProof}` }}
                        style={{ width: '100%', height: 180, borderRadius: 8, resizeMode: 'contain', backgroundColor: theme.isDark ? '#0f172a' : '#e2e8f0' }}
                      />
                    </View>
                  )}

                  {/* Picker */}
                  {selectedImage ? (
                    <View style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.primaryBlue, padding: 10, backgroundColor: theme.subtleBg, marginBottom: 12 }}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={{ width: '100%', height: 180, borderRadius: 8, resizeMode: 'contain', marginBottom: 10 }}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: theme.isDark ? '#93c5fd' : '#0369a1', flex: 1 }} numberOfLines={1}>
                          {selectedImage.name || 'Foto terpilih'}
                        </Text>
                        <TouchableOpacity
                          onPress={pickImage}
                          style={{
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            backgroundColor: theme.isDark ? theme.cardBg : '#ffffff',
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primaryBlue }}>Ganti Foto</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={pickImage}
                      style={{
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: theme.borderColor,
                        borderRadius: 12,
                        paddingVertical: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.sidebarBg,
                        marginBottom: 12,
                        gap: 8,
                      }}
                    >
                      <UploadCloud size={36} color={theme.primaryBlue} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primaryBlue }}>
                        Pilih Foto Struk / Bukti Transfer
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>
                        Format file JPG atau PNG (Maksimal 5 MB)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleUploadProof}
                    disabled={submitting || !selectedImage}
                    style={{
                      backgroundColor: theme.primaryBlue,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: submitting || !selectedImage ? 0.6 : 1,
                      marginTop: 6,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                        Kirim Bukti Pembayaran
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
