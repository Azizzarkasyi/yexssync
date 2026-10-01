import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  CheckCircle,
  Home,
  Users,
  ClipboardCheck,
  Mail,
  ListChecks,
  Banknote,
  FileText,
  FileSignature,
  Settings,
  LogOut,
  X,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { AuthContext } from '@/context/AuthContext';
import { YexsLogo } from '@/components/YexsLogo';

export interface AdminSidebarProps {
  currentPath: string;
  isDesktop?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/admin' },
  { label: 'Pegawai', icon: Users, path: '/admin/users' },
  { label: 'Presensi', icon: ClipboardCheck, path: '/admin/attendance' },
  { label: 'Izin/Cuti', icon: Mail, path: '/admin/approvals' },
  { label: 'Manajemen Tugas', icon: ListChecks, path: '/admin/tasks' },
  { label: 'Penggajian', icon: Banknote, path: '/admin/payroll' },
  { label: 'Pengaturan & Profil', icon: Settings, path: '/admin/profile' },
  { label: 'Laporan & Koreksi', icon: FileSignature, path: '/admin/reports' },
];

export default function AdminSidebar({
  currentPath,
  isDesktop = true,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const theme = useAdminTheme();
  const { logout } = useContext(AuthContext);

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/admin') {
      return currentPath === '/admin' || currentPath === '/admin/';
    }
    if (itemPath === '/admin/payroll') {
      return currentPath === '/admin/payroll' || currentPath.startsWith('/admin/payroll/');
    }
    if (itemPath === '/admin/reports') {
      return currentPath.startsWith('/admin/reports');
    }
    if (itemPath === '/admin/profile') {
      return currentPath === '/admin/profile' || currentPath === '/admin/settings';
    }
    return currentPath.startsWith(itemPath);
  };

  const handleNavigate = (path: string) => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    router.push(path as any);
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
    router.replace('/');
  };

  const renderContent = (isMobileModal = false) => (
    <View
      style={{
        width: 250,
        backgroundColor: theme.sidebarBg,
        borderRightWidth: isMobileModal ? 0 : 1,
        borderRightColor: theme.borderColor,
        height: '100%',
        flexDirection: 'column',
      }}
    >
      {/* Brand Header */}
      <View
        style={{
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor,
        }}
      >
        <TouchableOpacity
          onPress={() => handleNavigate('/admin')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <YexsLogo size={28} rounded />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: theme.primaryBlue,
              letterSpacing: 0.5,
            }}
          >
            YEXSSYNC
          </Text>
        </TouchableOpacity>

        {isMobileModal && onCloseMobile && (
          <TouchableOpacity onPress={onCloseMobile} style={{ padding: 4 }}>
            <X size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Nav Menu Items */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 4, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const active = isItemActive(item.path);

          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => handleNavigate(item.path)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
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
                  fontSize: 14,
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

      {/* Bottom Logout Button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.borderColor }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: 'transparent',
          }}
        >
          <LogOut size={18} color={theme.danger} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.danger }}>
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

