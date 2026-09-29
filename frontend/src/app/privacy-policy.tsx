import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ShieldCheck, MapPin, Camera, Lock, UserCheck } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ShieldCheck size={48} color="#2563eb" />
        <Text style={styles.title}>Kebijakan Privasi YexsSync</Text>
        <Text style={styles.subtitle}>Terakhir diperbarui: 27 September 2026</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.paragraph}>
          Aplikasi YexsSync ("kami", "aplikasi") menghargai dan melindungi privasi seluruh pengguna ("karyawan", "pegawai", "admin"). Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi pribadi Anda saat menggunakan aplikasi presensi dan manajemen HRD YexsSync baik melalui perangkat seluler (Android Play Store) maupun peramban web.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={22} color="#2563eb" />
            <Text style={styles.sectionTitle}>1. Informasi Lokasi (GPS & Geofencing)</Text>
          </View>
          <Text style={styles.paragraph}>
            Aplikasi YexsSync mengakses data lokasi geografis (lintang dan bujur) perangkat Anda semata-mata pada saat Anda menekan tombol "Presensi Masuk" atau "Presensi Pulang". Data lokasi ini digunakan untuk memverifikasi apakah Anda berada di dalam radius area kerja yang telah ditentukan oleh perusahaan (geofence). Kami tidak melakukan pelacakan lokasi latar belakang secara berkelanjutan di luar jam kerja.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Camera size={22} color="#2563eb" />
            <Text style={styles.sectionTitle}>2. Kamera & Data Biometrik Wajah (Face Recognition)</Text>
          </View>
          <Text style={styles.paragraph}>
            Aplikasi memerlukan izin akses kamera untuk mengambil foto selfie dan memverifikasi fitur biometrik wajah. Vektor deskriptor wajah (128-dimensional mathematical array) disimpan secara terenkripsi di database server perusahaan dan hanya digunakan untuk mencocokkan identitas pegawai saat presensi guna mencegah kecurangan (titip absen). Kami tidak membagikan atau menjual data biometrik Anda kepada pihak ketiga mana pun.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={22} color="#2563eb" />
            <Text style={styles.sectionTitle}>3. Keamanan Data & Penyimpanan</Text>
          </View>
          <Text style={styles.paragraph}>
            Semua pertukaran data antara aplikasi klien dan server dilindungi menggunakan enkripsi standar industri HTTPS/TLS dan otentikasi token JWT bertanda tangan digital. Data perusahaan disimpan secara terisolasi dengan arsitektur multi-tenant.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCheck size={22} color="#2563eb" />
            <Text style={styles.sectionTitle}>4. Hak Pengguna & Penghapusan Akun</Text>
          </View>
          <Text style={styles.paragraph}>
            Sesuai dengan kebijakan Google Play Store, pengguna memiliki hak untuk meminta pembaruan data atau penghapusan akun serta riwayat kehadiran dengan menghubungi administrator HRD perusahaan atau melalui email resmi pengembang.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontak Dukungan</Text>
          <Text style={styles.paragraph}>
            Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi tim kami melalui email: support@yexssync.com
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  section: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
});
