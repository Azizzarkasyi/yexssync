import { Tabs } from 'expo-router';
import { Home, History, ListChecks, MailOpen, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function UserLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = '#2a75d3';
  const inactiveColor = '#a0aec0';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#eef1f6',
          elevation: 4,
          shadowColor: '#000000',
          shadowOpacity: 0.03,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 15,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Home color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <History color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tugas',
          tabBarIcon: ({ color }) => <ListChecks color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Izin',
          tabBarIcon: ({ color }) => <MailOpen color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={20} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="payslips"
        options={{
          href: null,
          title: 'Slip Gaji',
        }}
      />
    </Tabs>
  );
}

