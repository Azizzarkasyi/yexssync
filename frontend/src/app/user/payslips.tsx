import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Platform, Modal, Image } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import { Download, FileText, CheckCircle2, Clock, Eye, X, ExternalLink } from 'lucide-react-native';
import api, { getUploadUrl } from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';
import { Header } from '@/components/Header';

export default function PayslipsScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await api.get('/payrolls/my-payrolls');
      if (response.data.success) {
        setPayrolls(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payrolls', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const getProofUrl = (path: string) => {
    return getUploadUrl(path);
  };

  const downloadExcel = async () => {
    try {
      const response = await api.get('/payrolls/my-payrolls/export', { responseType: 'blob' });
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Slip_Gaji_${user?.name}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } else {
        Alert.alert('Info', 'Fitur download Excel di aplikasi mobile akan segera hadir.');
      }
    } catch (error) {
      Alert.alert('Gagal', 'Gagal mengunduh file Excel');
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </ScreenWrapper>
    );
  }

  const RightAction = (
    <TouchableOpacity onPress={downloadExcel} className="p-2 bg-primary/10 rounded-full">
      <Download size={24} color="#4F46E5" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 24, paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Header title="Slip Gaji Saya" showBack={true} rightElement={RightAction} />
        {payrolls.length === 0 ? (
          <View className="py-10 items-center justify-center flex-1">
            <FileText size={64} color="#cbd5e1" className="mb-4" />
            <Text className="text-slate-500 dark:text-slate-400 text-center">Belum ada riwayat slip gaji.</Text>
          </View>
        ) : (
          payrolls.map((payroll, index) => (
            <Card key={index} className="mb-4">
              <CardContent className="p-5">
                <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <View>
                    <Text className="text-xs text-slate-500 font-semibold mb-1">Periode</Text>
                    <Text className="font-bold text-slate-900 dark:text-white">
                      {new Date(payroll.periodStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(payroll.periodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className={`flex-row items-center px-2 py-1 rounded-full ${payroll.paymentStatus === 'PAID' ? 'bg-green-100 dark:bg-green-950' : 'bg-orange-100 dark:bg-orange-950'}`}>
                    {payroll.paymentStatus === 'PAID' ? <CheckCircle2 size={12} color="#16a34a" /> : <Clock size={12} color="#ea580c" />}
                    <Text className={`text-xs font-bold ml-1 ${payroll.paymentStatus === 'PAID' ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                      {payroll.paymentStatus === 'PAID' ? 'LUNAS' : 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View className="space-y-2 mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-600 dark:text-slate-400">Gaji Pokok</Text>
                    <Text className="font-semibold text-slate-900 dark:text-white">{formatCurrency(payroll.baseSalary)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-600 dark:text-slate-400">Bonus Lembur</Text>
                    <Text className="font-semibold text-green-600">+{formatCurrency(payroll.overtimeBonus)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-600 dark:text-slate-400">Potongan Keterlambatan</Text>
                    <Text className="font-semibold text-red-500">-{formatCurrency(payroll.lateDeductions)}</Text>
                  </View>
                </View>

                <View className="border-t border-slate-100 dark:border-slate-800 pt-3 flex-row justify-between items-center">
                  <Text className="font-bold text-slate-700 dark:text-slate-300">Total Diterima</Text>
                  <Text className="text-xl font-black text-primary">{formatCurrency(payroll.netSalary)}</Text>
                </View>

                {/* Bukti Transfer Pembayaran */}
                {payroll.paymentProof && (
                  <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <Text className="text-xs text-green-700 dark:text-green-400 font-medium ml-1.5">
                        Bukti transfer tersedia
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedProofUrl(payroll.paymentProof)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex-row items-center border border-blue-200 dark:border-blue-800"
                    >
                      <Eye size={14} color="#2563eb" />
                      <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-1.5">
                        Lihat Bukti
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </CardContent>
            </Card>
          ))
        )}

        {/* Modal Lihat Bukti Transfer */}
        {selectedProofUrl && (
          <Modal transparent visible animationType="fade">
            <View className="flex-1 bg-black/75 items-center justify-center p-4">
              <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center">
                    <CheckCircle2 size={18} color="#16a34a" className="mr-2" />
                    <Text className="text-base font-bold text-slate-900 dark:text-white">Bukti Transfer Pembayaran</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedProofUrl(null)}>
                    <X size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View className="my-4 items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl p-2 min-h-[250px] overflow-hidden border border-slate-200 dark:border-slate-800">
                  <Image
                    source={{ uri: getProofUrl(selectedProofUrl) }}
                    className="w-full h-72 rounded-lg"
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-row justify-between items-center pt-2">
                  <TouchableOpacity
                    onPress={() => {
                      const fullUrl = getProofUrl(selectedProofUrl);
                      if (Platform.OS === 'web') {
                        window.open(fullUrl, '_blank');
                      }
                    }}
                    className="flex-row items-center px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg"
                  >
                    <ExternalLink size={14} color="#2563eb" className="mr-1.5" />
                    <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">Buka di Tab Baru</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedProofUrl(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  >
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
