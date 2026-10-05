import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  X,
  PieChart,
  LogOut,
  Shield,
  Activity,
  CheckCircle,
} from 'lucide-react-native';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import { AuthContext } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

export interface SuperAdminTopHeaderProps {
  title: string;
  isDesktop: boolean;
  onOpenMobileMenu: () => void;
  rightAction?: React.ReactNode;
}

export default function SuperAdminTopHeader({
  title,
  isDesktop,
  onOpenMobileMenu,
  rightAction,
}: SuperAdminTopHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const notificationsList: any[] = [];

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    try {
      await logout();
    } catch {
      // Ignore
    }
    router.replace('/auth/login');
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: isDesktop ? 68 : 52,
          paddingTop: isDesktop ? 14 : Math.max(insets.top, 14),
          paddingBottom: 12,
          marginBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: 'transparent',
          width: '100%',
          zIndex: 20,
        }}
      >
        {/* Left Title & Mobile Hamburger */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 12 : 8, flex: 1, minWidth: 0, marginRight: 8 }}>
          {!isDesktop && (
            <TouchableOpacity
              onPress={onOpenMobileMenu}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                flexShrink: 0,
              }}
            >
              <Menu size={18} color={theme.text} />
            </TouchableOpacity>
          )}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: isDesktop ? 22 : 18,
                fontWeight: '700',
                color: theme.primaryBlue,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Right Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 10 : 6, flexShrink: 0 }}>
          {rightAction}

          {/* Theme Toggle Sun / Moon */}
          <TouchableOpacity
            onPress={theme.toggleTheme}
            style={{
              padding: isDesktop ? 9 : 7,
              borderRadius: 8,
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            {theme.isDark ? (
              <Sun size={isDesktop ? 18 : 16} color="#f59e0b" />
            ) : (
              <Moon size={isDesktop ? 18 : 16} color={theme.text} />
            )}
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            style={{
              position: 'relative',
              padding: isDesktop ? 9 : 7,
              borderRadius: 8,
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Bell size={isDesktop ? 18 : 16} color={theme.text} />
            {notificationsList.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  backgroundColor: theme.danger,
                  width: 17,
                  height: 17,
                  borderRadius: 9,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: theme.cardBg,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                  {notificationsList.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Card with Initials / Photo */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setShowProfileDropdown(!showProfileDropdown)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 5,
                paddingHorizontal: 8,
                borderRadius: 24,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <UserAvatar
                name={user?.name || 'Super Admin'}
                photo={(user as any)?.photo || (user as any)?.avatar}
                size={isDesktop ? 34 : 28}
              />
              {isDesktop && (
                <View style={{ maxWidth: 140 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: theme.text,
                    }}
                    numberOfLines={1}
                  >
                    {user?.name || 'Super Admin'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.primaryBlue,
                      fontWeight: '600',
                    }}
                    numberOfLines={1}
                  >
                    Super Admin
                  </Text>
                </View>
              )}
              {isDesktop && <ChevronDown size={14} color={theme.textMuted} />}
            </TouchableOpacity>

            {/* Profile Dropdown Popover */}
            {showProfileDropdown && (
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 50,
                  width: 220,
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 8,
                  zIndex: 100,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View
                  style={{
                    padding: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: theme.text,
                    }}
                    numberOfLines={1}
                  >
                    {user?.email || 'superadmin@yexssync.com'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.success,
                      fontWeight: '600',
                      marginTop: 2,
                    }}
                  >
                    ● Sesi Aktif (Super Admin)
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowProfileDropdown(false);
                    router.push('/superadmin');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    gap: 10,
                  }}
                >
                  <PieChart size={16} color={theme.textMuted} />
                  <Text style={{ fontSize: 13, color: theme.text }}>
                    Dashboard Ikhtisar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <LogOut size={16} color={theme.danger} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.danger,
                    }}
                  >
                    Keluar Akun
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Notifications Modal */}
      {showNotifications && (
        <Modal
          visible={showNotifications}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNotifications(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
              paddingTop: 70,
              paddingRight: 24,
            }}
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          >
            <View
              style={{
                width: 360,
                backgroundColor: theme.cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
                overflow: 'hidden',
              }}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} color={theme.primaryBlue} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: theme.text,
                    }}
                  >
                    Notifikasi Sistem Super Admin
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 10 }}>
                {notificationsList.length === 0 ? (
                  <View
                    style={{
                      paddingVertical: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle size={32} color={theme.success} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.text,
                        marginTop: 8,
                      }}
                    >
                      Semua Layanan Berjalan Normal
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        marginTop: 4,
                        textAlign: 'center',
                        paddingHorizontal: 20,
                      }}
                    >
                      Tidak ada peringatan darurat sistem atau tiket kritis yang tertunda.
                    </Text>
                  </View>
                ) : (
                  notificationsList.map((n) => null)
                )}
              </View>

              <View
                style={{
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.primaryBlue,
                    }}
                  >
                    Tutup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}
