import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useGlobalModal } from '@/context/GlobalModalContext';
import YexsLogo from '@/components/YexsLogo';
import UserAvatar from '@/components/UserAvatar';

export interface UserTopHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showAvatar?: boolean;
  onAvatarPress?: () => void;
  rightAction?: React.ReactNode;
}

export default function UserTopHeader({
  title,
  subtitle,
  showLogo = false,
  showBack = false,
  onBack,
  showNotification = true,
  onNotificationPress,
  showAvatar = true,
  onAvatarPress,
  rightAction,
}: UserTopHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(AuthContext);
  const { showInfo } = useGlobalModal();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      showInfo('Notifikasi', 'Tidak ada notifikasi baru untuk Anda saat ini.');
    }
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/user/profile');
    }
  };

  return (
    <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#f4f7fb] dark:bg-slate-950 z-10 border-b border-[#eef1f6] dark:border-slate-800">
      {/* Left: Back button / Logo / Title */}
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0 pr-3">
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBackPress}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-white dark:bg-slate-900 border border-[#eef1f6] dark:border-slate-800 mr-0.5"
          >
            <ArrowLeft size={16} color={isDark ? '#cbd5e1' : '#222222'} strokeWidth={2.2} />
          </TouchableOpacity>
        )}

        {showLogo ? (
          <View className="flex-row items-center gap-2">
            <YexsLogo size={24} rounded />
            <Text className="text-[18px] font-bold text-[#2a75d3] tracking-tight">
              YEXSSYNC
            </Text>
          </View>
        ) : (
          <View className="flex-1 min-w-0">
            <Text
              className="text-[18px] font-bold text-[#222222] dark:text-white tracking-tight"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="text-[11px] text-[#777777] dark:text-slate-400 font-medium"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Right: Actions */}
      <View className="flex-row items-center gap-3 flex-shrink-0">
        {showNotification && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNotificationPress}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} color={isDark ? '#cbd5e1' : '#222222'} />
          </TouchableOpacity>
        )}

        {showAvatar && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAvatarPress}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserAvatar
              name={user?.name}
              photo={(user as any)?.photo || (user as any)?.avatar || (user as any)?.profilePicture}
              size={32}
            />
          </TouchableOpacity>
        )}

        {rightAction}
      </View>
    </View>
  );
}

