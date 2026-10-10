import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  MapPin,
  Navigation,
  Compass,
  Radio,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useGlobalModal } from '@/context/GlobalModalContext';
import { useAdminTheme } from '@/hooks/useAdminTheme';

export const GlobalModal: React.FC = () => {
  const { modalState, hideModal } = useGlobalModal();
  const { visible, options } = modalState;
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarWaveAnim = useRef(new Animated.Value(0)).current;

  // Modal entrance/exit animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Pulse & Radar Wave loop for 'radar' type
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;

    if (visible && options.type === 'radar') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      waveLoop = Animated.loop(
        Animated.timing(radarWaveAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      waveLoop.start();
    }

    return () => {
      if (loop) loop.stop();
      if (waveLoop) waveLoop.stop();
      pulseAnim.setValue(1);
      radarWaveAnim.setValue(0);
    };
  }, [visible, options.type]);

  if (!visible) return null;

  const isDark = theme.isDark;
  const type = options.type || 'info';
  const isRadar = type === 'radar';
  const radar = options.radarData;

  // Icon & Accent Color Config
  let IconComponent = Info;
  let accentColor = '#2a75d3';
  let accentBg = isDark ? 'rgba(42, 117, 211, 0.18)' : '#e8f1fc';
  let badgeBorder = isDark ? 'rgba(42, 117, 211, 0.4)' : '#bfdbfe';

  if (type === 'success') {
    IconComponent = CheckCircle2;
    accentColor = '#10b981';
    accentBg = isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5';
    badgeBorder = isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0';
  } else if (type === 'error') {
    IconComponent = AlertCircle;
    accentColor = '#ef4444';
    accentBg = isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2';
    badgeBorder = isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca';
  } else if (type === 'warning') {
    IconComponent = AlertTriangle;
    accentColor = '#f59e0b';
    accentBg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb';
    badgeBorder = isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a';
  } else if (type === 'confirm') {
    if (options.variant === 'danger') {
      IconComponent = AlertTriangle;
      accentColor = '#ef4444';
      accentBg = isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2';
      badgeBorder = isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca';
    } else {
      IconComponent = Info;
      accentColor = '#2a75d3';
      accentBg = isDark ? 'rgba(42, 117, 211, 0.18)' : '#e8f1fc';
      badgeBorder = isDark ? 'rgba(42, 117, 211, 0.4)' : '#bfdbfe';
    }
  } else if (type === 'radar') {
    if (radar?.isLocked) {
      IconComponent = Check;
      accentColor = '#10b981';
      accentBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5';
      badgeBorder = isDark ? 'rgba(16, 185, 129, 0.5)' : '#a7f3d0';
    } else {
      IconComponent = Radio;
      accentColor = '#0ea5e9';
      accentBg = isDark ? 'rgba(14, 165, 233, 0.18)' : '#f0f9ff';
      badgeBorder = isDark ? 'rgba(14, 165, 233, 0.4)' : '#bae6fd';
    }
  }

  const handleConfirmPress = async () => {
    if (options.onConfirm) {
      await options.onConfirm();
    } else {
      hideModal();
    }
  };

  const handleCancelPress = () => {
    if (options.onCancel) {
      options.onCancel();
    } else {
      hideModal();
    }
  };

  // Wave expansion interpolation
  const waveScale = radarWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const waveOpacity = radarWaveAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.8, 0.4, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancelPress}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          ...(Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any)
            : {}),
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth: width > 500 ? 440 : 360,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 28,
            elevation: 20,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {/* Top Close Button for simple modals */}
          {!isRadar && (
            <TouchableOpacity
              onPress={handleCancelPress}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}

          {/* Icon Section */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
            {isRadar ? (
              // Radar Wave Scanning Visual
              <View
                style={{
                  width: 90,
                  height: 90,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {!radar?.isLocked && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: accentColor,
                      backgroundColor: accentBg,
                      transform: [{ scale: waveScale }],
                      opacity: waveOpacity,
                    }}
                  />
                )}
                <Animated.View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: accentBg,
                    borderWidth: 2,
                    borderColor: badgeBorder,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    transform: [{ scale: radar?.isLocked ? 1 : pulseAnim }],
                  }}
                >
                  <IconComponent size={28} color={accentColor} strokeWidth={2.5} />
                </Animated.View>
              </View>
            ) : (
              // Standard Icon Circle
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: accentBg,
                  borderWidth: 2,
                  borderColor: badgeBorder,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                }}
              >
                <IconComponent size={32} color={accentColor} strokeWidth={2.4} />
              </View>
            )}
          </View>

          {/* Title & Description */}
          <View style={{ alignItems: 'center', marginBottom: isRadar ? 16 : 22 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: isDark ? '#f8fafc' : '#0f172a',
                textAlign: 'center',
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {options.title}
            </Text>
            {options.message ? (
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 20,
                  color: isDark ? '#94a3b8' : '#64748b',
                  textAlign: 'center',
                  paddingHorizontal: 8,
                }}
              >
                {options.message}
              </Text>
            ) : null}
          </View>

          {/* Special Radar Live Status Box */}
          {isRadar && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: radar?.isLocked
                  ? isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'
                  : isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                marginBottom: 20,
              }}
            >
              {/* Office Target Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} color={radar?.isLocked ? '#10b981' : '#2a75d3'} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isDark ? '#cbd5e1' : '#334155',
                    }}
                  >
                    {radar?.officeName || 'Kantor Perusahaan'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#64748b' : '#94a3b8',
                  }}
                >
                  Radius Maks: {radar?.maxRadius || 50}m
                </Text>
              </View>

              {/* Distance Meter & Status Pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                }}
              >
                <View>
                  <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Jarak Terdeteksi
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: radar?.isLocked
                        ? '#10b981'
                        : radar?.currentDistance !== null && radar?.currentDistance !== undefined
                        ? '#0ea5e9'
                        : isDark ? '#64748b' : '#94a3b8',
                      marginTop: 2,
                    }}
                  >
                    {radar?.currentDistance !== null && radar?.currentDistance !== undefined
                      ? `${radar.currentDistance} meter`
                      : 'Memindai...'}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: radar?.isLocked
                      ? isDark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5'
                      : isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
                  }}
                >
                  {radar?.isLocked ? (
                    <>
                      <Check size={14} color="#10b981" strokeWidth={3} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>
                        Terkunci
                      </Text>
                    </>
                  ) : (
                    <>
                      <ActivityIndicator size="small" color="#0ea5e9" />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#0ea5e9' }}>
                        Mencari...
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Status explanation */}
              <Text
                style={{
                  fontSize: 11,
                  color: radar?.isLocked ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
                  marginTop: 8,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {radar?.isLocked
                  ? '✓ Posisi Anda sudah memenuhi radius kantor, siap melanjutkan.'
                  : radar?.statusText || 'Terus memindai sampai sinyal GPS terbaik didapatkan...'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Cancel Button (for Confirm or Radar) */}
            {(type === 'confirm' || isRadar) && (
              <TouchableOpacity
                onPress={handleCancelPress}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#cbd5e1' : '#475569',
                  }}
                >
                  {options.cancelText || 'Batal'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Confirm / Primary Button */}
            {!isRadar || (isRadar && radar?.isLocked) ? (
              <TouchableOpacity
                onPress={handleConfirmPress}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor:
                    type === 'confirm' && options.variant === 'danger'
                      ? '#ef4444'
                      : type === 'success' || (isRadar && radar?.isLocked)
                      ? '#10b981'
                      : '#2a75d3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor:
                    type === 'confirm' && options.variant === 'danger'
                      ? '#ef4444'
                      : type === 'success' || (isRadar && radar?.isLocked)
                      ? '#10b981'
                      : '#2a75d3',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
                  {isRadar && radar?.isLocked
                    ? 'Lanjutkan Sekarang'
                    : options.confirmText || 'Lanjutkan'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
