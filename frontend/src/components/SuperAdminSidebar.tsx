import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  PieChart,
  Building2,
  Users,
  CreditCard,
  Headphones,
  Server,
  Sliders,
  LogOut,
  X,
  Shield,
  Layers,
} from 'lucide-react-native';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import { AuthContext } from '@/context/AuthContext';
import { YexsLogo } from '@/components/YexsLogo';

export interface SuperAdminSidebarProps {
  currentPath: string;
  isDesktop?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SUPERADMIN_NAV_ITEMS = [
  { key: 'ikhtisar', label: 'Ikhtisar', icon: PieChart, path: '/superadmin' },
  { key: 'tenants', label: 'Data Perusahaan', icon: Building2, path: '/superadmin/tenants' },
  { key: 'admins', label: 'Manajemen Admin', icon: Users, path: '/superadmin/admins' },
  { key: 'billing', label: 'Paket & Tagihan', icon: CreditCard, path: '/superadmin/billing' },
  { key: 'tickets', label: 'Tiket Bantuan', icon: Headphones, path: '/superadmin/tickets' },
  { key: 'logs', label: 'Log Sistem', icon: Server, path: '/superadmin/logs' },
  { key: 'settings', label: 'Pengaturan Global', icon: Sliders, path: '/superadmin/settings' },
];

export default function SuperAdminSidebar({
  currentPath,
  isDesktop = true,
  mobileOpen = false,
  onCloseMobile,
}: SuperAdminSidebarProps) {
  const theme = useSuperAdminTheme();
  const { logout } = useContext(AuthContext);

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/superadmin') {
      return currentPath === '/superadmin' || currentPath === '/superadmin/';
    }
    return currentPath.startsWith(itemPath);
  };

  const handleNavigate = (path: string) => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    if (currentPath !== path) {
      router.push(path as any);
    }
  };

  const handleLogout = async () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    try {
      await logout();
    } catch {
      // Ignore
    }
    router.replace('/auth/login');
  };

  const renderContent = (isMobileModal = false) => (
    <View
      style={{
        width: 260,
        backgroundColor: theme.sidebarBg,
        borderRightWidth: isMobileModal ? 0 : 1,
        borderRightColor: theme.border,
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        {/* Brand Header */}
        <View
          style={{
            paddingVertical: 18,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <TouchableOpacity
            onPress={() => handleNavigate('/superadmin')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <YexsLogo size={34} rounded />
            <View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: theme.primaryBlue,
                  letterSpacing: 0.5,
                }}
              >
                YEXSSYNC
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    backgroundColor: theme.activeNavBg,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: theme.primaryBlue,
                      letterSpacing: 0.5,
                    }}
                  >
                    SUPER ADMIN
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {isMobileModal && onCloseMobile && (
            <TouchableOpacity onPress={onCloseMobile} style={{ padding: 4 }}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation Items */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12, gap: 4, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {SUPERADMIN_NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const active = isItemActive(item.path);

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleNavigate(item.path)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: active ? theme.activeNavBg : 'transparent',
                }}
              >
                <IconComponent
                  size={18}
                  color={active ? theme.primaryBlue : theme.textMuted}
                  strokeWidth={active ? 2.5 : 2}
                />
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? '700' : '500',
                    color: active ? theme.primaryBlue : theme.textMuted,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Logout Button */}
      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 8,
            backgroundColor: 'transparent',
          }}
        >
          <LogOut size={18} color={theme.danger} />
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.danger }}>
            Keluar Akun
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      {isDesktop && renderContent(false)}

      {/* Mobile Drawer Modal */}
      {!isDesktop && mobileOpen && (
        <Modal
          visible={mobileOpen}
          transparent
          animationType="fade"
          onRequestClose={onCloseMobile}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            {renderContent(true)}
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={onCloseMobile}
            />
          </View>
        </Modal>
      )}
    </>
  );
}
