import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { Menu, Sun, Moon, Bell, ChevronDown, CheckCircle, Clock, AlertCircle, X, Shield } from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { AuthContext } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

export interface AdminTopHeaderProps {
  title: string;
  subtitle?: string;
  isDesktop: boolean;
  onOpenMobileMenu: () => void;
  rightAction?: React.ReactNode;
}

export default function AdminTopHeader({
  title,
  subtitle,
  isDesktop,
  onOpenMobileMenu,
  rightAction,
}: AdminTopHeaderProps) {
  const theme = useAdminTheme();
  const { user } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationsList: any[] = [];

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 68,
          paddingVertical: 14,
          marginBottom: 18,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor,
        }}
      >
        {/* Left Title & Mobile Hamburger */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {!isDesktop && (
            <TouchableOpacity
              onPress={onOpenMobileMenu}
              style={{
                padding: 9,
                borderRadius: 8,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.borderColor,
              }}
            >
              <Menu size={20} color={theme.textDark} />
            </TouchableOpacity>
          )}

          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: theme.primaryBlue,
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {rightAction}

          {/* Theme Toggle Sun / Moon */}
          <TouchableOpacity
            onPress={theme.toggleTheme}
            style={{
              padding: 9,
              borderRadius: 8,
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.borderColor,
            }}
          >
            {theme.isDark ? (
              <Sun size={18} color="#f59e0b" />
            ) : (
              <Moon size={18} color={theme.textDark} />
            )}
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            style={{
              position: 'relative',
              padding: 9,
              borderRadius: 8,
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.borderColor,
            }}
          >
            <Bell size={18} color={theme.textDark} />
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
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{notificationsList.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Card with Initials / Photo */}
          <TouchableOpacity
            onPress={() => router.push('/admin/profile')}
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
              borderColor: theme.borderColor,
            }}
          >
            <UserAvatar
              name={user?.name || 'Admin'}
              photo={(user as any)?.photo || (user as any)?.avatar}
              size={34}
            />
            {isDesktop && (
              <View style={{ maxWidth: 140 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: theme.textDark,
                  }}
                  numberOfLines={1}
                >
                  {user?.name || 'Administrator'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }} numberOfLines={1}>
                  {(user as any)?.companyName || 'Admin Perusahaan'}
                </Text>
              </View>
            )}
            <ChevronDown size={14} color={theme.textMuted} />
          </TouchableOpacity>
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
                borderColor: theme.borderColor,
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
                  borderBottomColor: theme.borderColor,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} color={theme.primaryBlue} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                    Notifikasi Terbaru
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 10 }}>
                {notificationsList.length === 0 ? (
                  <View style={{ paddingVertical: 30, alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={32} color={theme.textMuted} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark, marginTop: 8 }}>
                      Tidak Ada Notifikasi Baru
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Semua aktivitas terkini sudah tersinkronisasi.
                    </Text>
                  </View>
                ) : (
                  notificationsList.map((n) => {
                    const Icon = n.icon;
                    return (
                      <View
                        key={n.id}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: theme.subtleBg,
                          marginBottom: 8,
                          flexDirection: 'row',
                          gap: 12,
                        }}
                      >
                        <View style={{ marginTop: 2 }}>
                          <Icon size={18} color={n.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginBottom: 2,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: theme.textDark,
                              }}
                            >
                              {n.title}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted }}>
                              {n.time}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 17 }}>
                            {n.desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View
                style={{
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.borderColor,
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
                    Tandai Semua Sudah Dibaca
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
