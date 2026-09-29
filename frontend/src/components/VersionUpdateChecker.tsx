import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Linking } from 'react-native';
import { Sparkles, RefreshCw, X } from 'lucide-react-native';
import { APP_ENV } from '@/config/env';
import api from '@/lib/api';

export const VersionUpdateChecker: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const rootUrl = APP_ENV.getApiBaseUrl().replace(/\/api\/?$/, '');
        const res = await fetch(`${rootUrl}/`).then((r) => r.json()).catch(() => null);

        if (res && res.version && res.version !== APP_ENV.APP_VERSION) {
          console.log(`[YexsSync Version] Update detected: Client=${APP_ENV.APP_VERSION}, Server=${res.version}`);
          setServerVersion(res.version);
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Silently catch version check error in offline/local
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      // In native android, open Google Play Store listing
      Linking.openURL('https://play.google.com/store/apps/details?id=com.yexssync.app');
    }
  };

  if (!updateAvailable || isDismissed) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Sparkles size={14} color="#ffffff" />
        </View>
        <Text style={styles.text}>
          Pembaruan YexsSync v{serverVersion || 'Terbaru'} siap digunakan!
        </Text>
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.8}>
          <RefreshCw size={13} color="#2563eb" style={{ marginRight: 4 }} />
          <Text style={styles.updateBtnText}>Perbarui</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsDismissed(true)} style={styles.closeBtn}>
          <X size={15} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 99998,
  },
  content: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    padding: 3,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  updateBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
});

export default VersionUpdateChecker;
