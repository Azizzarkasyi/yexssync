import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  CreditCard,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Copy,
  Building2,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '@/lib/api';

export interface TenantPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentUploaded?: () => void;
}

export default function TenantPaymentModal({
  visible,
  onClose,
  onPaymentUploaded,
}: TenantPaymentModalProps) {
  const [loading, setLoading] = useState(false);
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

  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get('/config/billing');
      if (res.data?.success && res.data.data) {
        setBillingData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load billing status for tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchBillingInfo();
      setSelectedImage(null);
      setCopied(false);
    }
  }, [visible]);

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
          window.alert('Bukti pembayaran berhasil diunggah! SuperAdmin akan segera memverifikasi pembayaran Anda.');
        } else {
          Alert.alert('Sukses', 'Bukti pembayaran berhasil diunggah! SuperAdmin akan segera memverifikasi pembayaran Anda.');
        }
        fetchBillingInfo();
        if (onPaymentUploaded) onPaymentUploaded();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 18,
            width: '100%',
            maxWidth: 540,
            maxHeight: '92%',
            padding: 22,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header Modal */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: isBlocked ? '#fee2e2' : '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
                {isBlocked ? <ShieldAlert size={22} color="#dc2626" /> : <CreditCard size={22} color="#0284c7" />}
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b' }}>
                  Tagihan Langganan Aplikasi
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  YexsSync Presensi & Payroll
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 8, backgroundColor: '#f1f5f9' }}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>Memeriksa tagihan aktif...</Text>
            </View>
          ) : !billing ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <CheckCircle2 size={32} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>
                Tidak Ada Tagihan Tertunggak
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, maxWidth: 360, lineHeight: 18 }}>
                Semua tagihan langganan perusahaan Anda telah lunas dan seluruh layanan presensi karyawan aktif normal.
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#0284c7' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Tutup</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* Alert Banner Status */}
              {isBlocked ? (
                <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={22} color="#dc2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#991b1b' }}>
                      Layanan Presensi Saat Ini Ditangguhkan
                    </Text>
                    <Text style={{ fontSize: 11, color: '#b91c1c', marginTop: 2, lineHeight: 16 }}>
                      Tagihan telah melewati batas masa tenggat pembayaran. Seluruh karyawan saat ini tidak dapat melakukan presensi sampai bukti transfer diunggah & diverifikasi.
                    </Text>
                  </View>
                </View>
              ) : isInGrace ? (
                <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={22} color="#d97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>
                      Peringatan Masa Tenggat: Sisa {daysLeft} Hari Lagi
                    </Text>
                    <Text style={{ fontSize: 11, color: '#b45309', marginTop: 2, lineHeight: 16 }}>
                      Segera lakukan pembayaran sebelum batas toleransi berakhir agar absensi seluruh karyawan tidak terblokir otomatis.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={20} color="#0284c7" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369a1' }}>
                      Tagihan Bulan {billing.month}/{billing.year} Menunggu Pembayaran
                    </Text>
                    <Text style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>
                      Jatuh tempo pada {formatDateIndo(billing.dueDate || subStatus?.dueDate)}.
                    </Text>
                  </View>
                </View>
              )}

              {/* Rincian Biaya */}
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Periode Tagihan:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>Bulan {billing.month} / {billing.year}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Jumlah Karyawan Aktif:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>{billing.userCount} Orang</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Tarif per Karyawan:</Text>
                  <Text style={{ fontSize: 12, color: '#1e293b' }}>{formatRupiah(billing.costPerUser)} / bulan</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Batas Akhir Toleransi (Masa Tenggat):</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isBlocked ? '#dc2626' : '#1e293b' }}>
                    {formatDateIndo(subStatus?.deadlineDate)}
                  </Text>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>Total yang Harus Dibayar:</Text>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0284c7' }}>{formatRupiah(billing.amount)}</Text>
                </View>
              </View>

              {/* Rekening Tujuan Transfer */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Rekening Tujuan Pembayaran Resmi
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Bank:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>{bank?.bankName || 'BCA / Mandiri'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Atas Nama:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>{bank?.bankAccountName || 'PT YexsSync Indonesia'}</Text>
                  </View>
                </View>

                {bank?.bankAccount && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: '#0369a1' }}>Nomor Rekening:</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0284c7', fontFamily: 'monospace' }}>
                        {bank.bankAccount}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCopyAccount(bank.bankAccount!)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd' }}
                    >
                      {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#0284c7" />}
                      <Text style={{ fontSize: 11, fontWeight: '700', color: copied ? '#16a34a' : '#0284c7' }}>
                        {copied ? 'Tersalin' : 'Salin Rekening'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Status Bukti Pembayaran yang Ada */}
              {billing.paymentProof ? (
                <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 size={16} color="#0284c7" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
                      Bukti Pembayaran Sudah Diunggah
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748b', lineHeight: 15, marginBottom: 8 }}>
                    Bukti transfer Anda telah diterima oleh sistem dan sedang dalam antrean verifikasi SuperAdmin. Jika Anda ingin mengganti bukti transfer, silakan pilih foto baru di bawah.
                  </Text>
                  <Image
                    source={{ uri: billing.paymentProof.startsWith('http') ? billing.paymentProof : `${api.defaults.baseURL?.replace('/api', '')}${billing.paymentProof}` }}
                    style={{ width: '100%', height: 160, borderRadius: 8, resizeMode: 'contain', backgroundColor: '#e2e8f0' }}
                  />
                </View>
              ) : null}

              {/* Form Upload Bukti Baru */}
              <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>
                  Unggah Bukti Struk Transfer:
                </Text>

                {selectedImage ? (
                  <View style={{ borderRadius: 10, borderWidth: 1, borderColor: '#0284c7', padding: 10, backgroundColor: '#f0f9ff', marginBottom: 10 }}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={{ width: '100%', height: 160, borderRadius: 8, resizeMode: 'contain', marginBottom: 8 }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#0369a1', flex: 1 }} numberOfLines={1}>
                        {selectedImage.name || 'Foto terpilih'}
                      </Text>
                      <TouchableOpacity onPress={pickImage} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd' }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284c7' }}>Ganti Foto</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: '#cbd5e1',
                      borderRadius: 12,
                      paddingVertical: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8fafc',
                      marginBottom: 10,
                      gap: 6,
                    }}
                  >
                    <UploadCloud size={28} color="#0284c7" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0284c7' }}>
                      Pilih Foto Struk / Bukti Transfer
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      Format JPG atau PNG (Maks 5 MB)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleUploadProof}
                  disabled={submitting || !selectedImage}
                  style={{
                    backgroundColor: '#0284c7',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: submitting || !selectedImage ? 0.6 : 1,
                    marginTop: 4,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                      Kirim Bukti Pembayaran
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
