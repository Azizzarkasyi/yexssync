import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import {
  Layers,
  PieChart,
  Building2,
  Users,
  CreditCard,
  Headphones,
  Server,
  Sliders,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Ticket,
  RotateCw,
  CheckCheck,
  Timer,
  Download,
  Plus,
  Reply,
  Eye,
  Circle,
  Sun,
  Moon,
  Send,
  MessageSquare,
  Check,
  Clock,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useSuperAdminTheme } from '@/hooks/useSuperAdminTheme';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';

// Ticket Interface
export interface TicketReply {
  id: string;
  sender: string;
  role: 'client' | 'admin';
  message: string;
  time: string;
}

export interface TicketItem {
  id: string;
  ticketId: string;
  clientName: string;
  clientCompany: string;
  subject: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'progress' | 'resolved' | 'closed';
  lastUpdated: string;
  createdAt: string;
  replies: TicketReply[];
}

export default function SuperAdminTicketsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = useSuperAdminTheme();
  const { user, logout } = useContext(AuthContext);
  const { showError } = useError();

  // Navigation & Dropdown States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Tickets Data & Filters
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);

  // Reply Form States
  const [replyMessage, setReplyMessage] = useState('');
  const [replyNextStatus, setReplyNextStatus] = useState<'open' | 'progress' | 'resolved' | 'closed'>('progress');

  // Create Ticket Form States
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDescription, setNewDescription] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      router.replace('/auth/login');
    }
  };

  // Open Reply Modal
  const handleOpenReply = (ticket: TicketItem) => {
    setActiveTicket(ticket);
    setReplyNextStatus(ticket.status === 'open' ? 'progress' : ticket.status);
    setReplyMessage('');
    setShowReplyModal(true);
  };

  // Send Reply
  const handleSendReply = () => {
    if (!activeTicket) return;
    if (!replyMessage.trim()) {
      showError('Validasi Gagal', 'Harap masukkan pesan balasan sebelum mengirim.');
      return;
    }

    const newReply: TicketReply = {
      id: `r_${Date.now()}`,
      sender: user?.name ? `Tim Support (${user.name})` : 'Tim Support YexsSync',
      role: 'admin',
      message: replyMessage.trim(),
      time: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const updated = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          status: replyNextStatus,
          lastUpdated: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          replies: [...t.replies, newReply],
        };
      }
      return t;
    });

    setTickets(updated);
    setShowReplyModal(false);
    setReplyMessage('');
  };

  // Create Internal Ticket
  const handleCreateTicket = () => {
    if (!newClientName.trim() || !newSubject.trim() || !newDescription.trim()) {
      showError('Validasi Gagal', 'Klien/Pengirim, Subjek, dan Deskripsi wajib diisi.');
      return;
    }

    const nextIdNumber = 1043 + tickets.length - 5;
    const newTicket: TicketItem = {
      id: String(Date.now()),
      ticketId: `#TKT-${nextIdNumber}`,
      clientName: newClientName.trim(),
      clientCompany: newClientCompany.trim() || 'Internal YexsSync',
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: 'open',
      lastUpdated: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      createdAt: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      replies: [],
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewSubject('');
    setNewDescription('');
    setNewPriority('medium');
  };

  // Export Tickets to CSV
  const handleExportCSV = () => {
    try {
      const header = 'ID Tiket,Klien,Perusahaan,Subjek,Deskripsi,Prioritas,Status,Pembaruan Terakhir\n';
      const rows = filteredTickets
        .map(
          (t) =>
            `"${t.ticketId}","${t.clientName}","${t.clientCompany}","${t.subject.replace(/"/g, '""')}","${t.description.replace(/"/g, '""')}","${t.priority}","${t.status}","${t.lastUpdated}"`
        )
        .join('\n');
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI(header + rows);

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Tiket_Bantuan_YexsSync_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Fitur ekspor CSV diaktifkan pada browser web.');
      }
    } catch (err: any) {
      showError('Ekspor Gagal', 'Gagal mengunduh CSV tiket: ' + err.message);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      t.ticketId.toLowerCase().includes(query) ||
      t.clientName.toLowerCase().includes(query) ||
      t.clientCompany.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate stats
  const openTicketsCount = tickets.filter((t) => t.status === 'open').length;
  const progressTicketsCount = tickets.filter((t) => t.status === 'progress').length;
  const resolvedTodayCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <View style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: theme.bg }}>
      {/* Unified Super Admin Sidebar */}
      <SuperAdminSidebar
        currentPath="/superadmin/tickets"
        isDesktop={isDesktop}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: isDesktop ? 25 : 15, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Header / Topbar */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 20,
            marginBottom: 20,
            backgroundColor: theme.bg,
            zIndex: 10,
          }}
        >
          {/* Page Title & Hamburger */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => setIsMobileMenuOpen(true)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Menu size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                Tiket Bantuan (Support)
              </Text>
            </View>
          </View>

          {/* Topbar Right */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {/* Search Bar */}
            {isDesktop && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.cardBg,
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.border,
                  width: 250,
                }}
              >
                <Search size={16} color={theme.textMuted} />
                <TextInput
                  placeholder="Cari ID tiket atau subjek..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    borderWidth: 0,
                    outline: 'none',
                    marginLeft: 10,
                    backgroundColor: 'transparent',
                    width: '100%',
                    fontSize: 13,
                    color: theme.text,
                  } as any}
                />
              </View>
            )}

            {/* Theme Toggle Button */}
            <TouchableOpacity
              onPress={theme.toggleTheme}
              title={theme.isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              } as any}
            >
              {theme.isDark ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color={theme.textMuted} />
              )}
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              onPress={() => setShowNotifModal(true)}
              style={{ position: 'relative', cursor: 'pointer' } as any}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} color={theme.textMuted} />
              </View>
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                  minWidth: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>5</Text>
              </View>
            </TouchableOpacity>

            {/* User Profile Pill */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: theme.cardBg,
                  paddingVertical: 5,
                  paddingLeft: 5,
                  paddingRight: 15,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: theme.border,
                  cursor: 'pointer',
                } as any}
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                />
                <View style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                    {user?.name || 'Super Admin'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '500' }}>
                    Super Admin
                  </Text>
                </View>
                <ChevronDown size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <View
                  style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    width: 210,
                    backgroundColor: theme.cardBg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5,
                    padding: 8,
                    zIndex: 50,
                  }}
                >
                  <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                      {user?.email || 'superadmin@yexssync.com'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Hak Akses Penuh</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfileDropdown(false);
                      router.push('/superadmin');
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <PieChart size={15} color={theme.textMuted} />
                    <Text style={{ fontSize: 13, color: theme.text }}>Dashboard Ikhtisar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      marginTop: 4,
                      cursor: 'pointer',
                    } as any}
                  >
                    <LogOut size={15} color="#ef4444" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Keluar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Mobile Search Bar */}
        {!isDesktop && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.cardBg,
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 20,
            }}
          >
            <Search size={16} color={theme.textMuted} />
            <TextInput
              placeholder="Cari ID tiket atau subjek..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                borderWidth: 0,
                outline: 'none',
                marginLeft: 10,
                backgroundColor: 'transparent',
                flex: 1,
                fontSize: 13,
                color: theme.text,
              } as any}
            />
          </View>
        )}

        {/* Summary Cards Khusus Tiket */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 20,
            marginBottom: 25,
          }}
        >
          {/* Card 1: Tiket Baru (Terbuka) */}
          <View
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Tiket Baru (Terbuka)
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                {openTicketsCount || 12}
              </Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.dangerBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ticket size={24} color={theme.dangerText} />
            </View>
          </View>

          {/* Card 2: Sedang Diproses */}
          <View
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Sedang Diproses
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                {progressTicketsCount || 8}
              </Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.warningBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <RotateCw size={24} color="#d97706" />
            </View>
          </View>

          {/* Card 3: Selesai Hari Ini */}
          <View
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Selesai Hari Ini
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                {resolvedTodayCount || 24}
              </Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.successBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CheckCheck size={24} color={theme.successText} />
            </View>
          </View>

          {/* Card 4: Rata-rata Respon */}
          <View
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>
                Rata-rata Respon
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>1j 15m</Text>
            </View>
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                backgroundColor: theme.purpleBg,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Timer size={24} color={theme.purpleText} />
            </View>
          </View>
        </View>

        {/* Toolbar & Filters (.action-toolbar) */}
        <View
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'center' : 'stretch',
            gap: 15,
            backgroundColor: theme.cardBg,
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Filters */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 15,
              alignItems: 'center',
            }}
          >
            {/* Filter Status */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    outline: 'none',
                    color: theme.text,
                    backgroundColor: theme.subtleBg,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="open">Open (Baru)</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 6,
                    backgroundColor: theme.subtleBg,
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  {(['all', 'open', 'progress', 'resolved'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setStatusFilter(st)}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                        backgroundColor: statusFilter === st ? theme.cardBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: statusFilter === st ? theme.accent : theme.textMuted,
                          fontWeight: '500',
                        }}
                      >
                        {st === 'all' ? 'Semua' : st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Filter Prioritas */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <select
                  value={priorityFilter}
                  onChange={(e: any) => setPriorityFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    outline: 'none',
                    color: theme.text,
                    backgroundColor: theme.subtleBg,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="high">Tinggi (High)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="low">Rendah (Low)</option>
                </select>
              ) : (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 6,
                    backgroundColor: theme.subtleBg,
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  {(['all', 'high', 'medium', 'low'] as const).map((pr) => (
                    <TouchableOpacity
                      key={pr}
                      onPress={() => setPriorityFilter(pr)}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 4,
                        backgroundColor: priorityFilter === pr ? theme.cardBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: priorityFilter === pr ? theme.accent : theme.textMuted,
                          fontWeight: '500',
                        }}
                      >
                        {pr === 'all' ? 'Semua' : pr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
            {/* Export Laporan */}
            <TouchableOpacity
              onPress={handleExportCSV}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.border,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              } as any}
            >
              <Download size={15} color={theme.text} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>Export Laporan</Text>
            </TouchableOpacity>

            {/* Buat Tiket Internal */}
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor: theme.accent,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              } as any}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>Buat Tiket Internal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Panel Table (.panel) */}
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <View style={{ minWidth: 980, width: '100%', flex: 1 }}>
              {/* Table Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.subtleBg,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.border,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <View style={{ width: 110, paddingRight: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    ID TIKET
                  </Text>
                </View>
                <View style={{ width: 190, paddingRight: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    KLIEN / PENGIRIM
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 260, paddingRight: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    SUBJEK & DESKRIPSI SINGKAT
                  </Text>
                </View>
                <View style={{ width: 130, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    PRIORITAS
                  </Text>
                </View>
                <View style={{ width: 130, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    STATUS
                  </Text>
                </View>
                <View style={{ width: 170, paddingRight: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 }}>
                    PEMBARUAN TERAKHIR
                  </Text>
                </View>
                <View style={{ width: 100, alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textAlign: 'right' }}>
                    AKSI
                  </Text>
                </View>
              </View>

              {/* Table Rows */}
              {filteredTickets.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={40} color={theme.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                    Tidak ada tiket bantuan yang ditemukan
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                    Coba sesuaikan kata kunci pencarian atau filter status & prioritas Anda.
                  </Text>
                </View>
              ) : (
                filteredTickets.map((ticket, index) => {
                  const isResolvedOrClosed = ticket.status === 'resolved' || ticket.status === 'closed';

                  return (
                    <View
                      key={ticket.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        borderBottomWidth: index === filteredTickets.length - 1 ? 0 : 1,
                        borderBottomColor: theme.border,
                        backgroundColor: isResolvedOrClosed ? (theme.isDark ? '#0f172a' : '#fafbfe') : theme.cardBg,
                      }}
                    >
                      {/* ID Tiket */}
                      <View style={{ width: 110, paddingRight: 8 }}>
                        <Text
                          style={{
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            fontWeight: '600',
                            color: theme.text,
                            backgroundColor: theme.subtleBg,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 4,
                            alignSelf: 'flex-start',
                            fontSize: 13,
                          }}
                        >
                          {ticket.ticketId}
                        </Text>
                      </View>

                      {/* Klien / Pengirim */}
                      <View style={{ width: 190, paddingRight: 12 }}>
                        <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>
                          {ticket.clientName}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.primaryBlue, fontWeight: '500', marginTop: 2 }}>
                          {ticket.clientCompany}
                        </Text>
                      </View>

                      {/* Subjek & Deskripsi Singkat */}
                      <View style={{ flex: 1, minWidth: 260, paddingRight: 16 }}>
                        <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14, marginBottom: 4 }}>
                          {ticket.subject}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 12,
                            color: theme.textMuted,
                            maxWidth: 320,
                          }}
                        >
                          {ticket.description}
                        </Text>
                      </View>

                      {/* Prioritas */}
                      <View style={{ width: 130, paddingRight: 10 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Circle
                            size={9}
                            fill={
                              ticket.priority === 'high'
                                ? '#ef4444'
                                : ticket.priority === 'medium'
                                ? '#d97706'
                                : '#10b981'
                            }
                            color={
                              ticket.priority === 'high'
                                ? '#ef4444'
                                : ticket.priority === 'medium'
                                ? '#d97706'
                                : '#10b981'
                            }
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color:
                                ticket.priority === 'high'
                                  ? '#ef4444'
                                  : ticket.priority === 'medium'
                                  ? '#d97706'
                                  : '#10b981',
                            }}
                          >
                            {ticket.priority === 'high'
                              ? 'High'
                              : ticket.priority === 'medium'
                              ? 'Medium'
                              : 'Low'}
                          </Text>
                        </View>
                      </View>

                      {/* Status */}
                      <View style={{ width: 130, paddingRight: 10 }}>
                        <View
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 20,
                            alignSelf: 'flex-start',
                            backgroundColor:
                              ticket.status === 'open'
                                ? theme.dangerBg
                                : ticket.status === 'progress'
                                ? theme.warningBg
                                : ticket.status === 'resolved'
                                ? theme.successBg
                                : theme.subtleBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color:
                                ticket.status === 'open'
                                  ? theme.dangerText
                                  : ticket.status === 'progress'
                                  ? '#d97706'
                                  : ticket.status === 'resolved'
                                  ? theme.successText
                                  : theme.textMuted,
                            }}
                          >
                            {ticket.status === 'open'
                              ? 'Open'
                              : ticket.status === 'progress'
                              ? 'In Progress'
                              : ticket.status === 'resolved'
                              ? 'Resolved'
                              : 'Closed'}
                          </Text>
                        </View>
                      </View>

                      {/* Pembaruan Terakhir */}
                      <View style={{ width: 170, paddingRight: 10 }}>
                        <Text style={{ fontSize: 12, color: ticket.status === 'open' ? theme.text : theme.textMuted }}>
                          {ticket.lastUpdated}
                        </Text>
                      </View>

                      {/* Aksi */}
                      <View style={{ width: 100, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                        {!isResolvedOrClosed ? (
                          <TouchableOpacity
                            onPress={() => handleOpenReply(ticket)}
                            style={{
                              backgroundColor: theme.infoBg,
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                            } as any}
                          >
                            <Reply size={13} color={theme.infoText} />
                            <Text style={{ color: theme.infoText, fontSize: 12, fontWeight: '600' }}>
                              Balas
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setActiveTicket(ticket);
                              setShowDetailModal(true);
                            }}
                            title="Lihat Detail"
                            style={{
                              padding: 6,
                              cursor: 'pointer',
                            } as any}
                          >
                            <Eye size={18} color={theme.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Pagination */}
          <View
            style={{
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'flex-start',
              gap: 12,
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Menampilkan {filteredTickets.length > 0 ? '1 - ' + filteredTickets.length : '0'} dari {tickets.length} Tiket
            </Text>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity
                disabled
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                }}
              >
                <ChevronLeft size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(1)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.accent,
                  backgroundColor: theme.accent,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(2)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>2</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentPage(3)}
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>3</Text>
              </TouchableOpacity>

              <View
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, color: theme.textMuted }}>...</Text>
              </View>

              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>29</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBg,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <ChevronRight size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: BALAS TIKET */}
      {showReplyModal && activeTicket && (
        <Modal transparent animationType="fade" visible={showReplyModal} onRequestClose={() => setShowReplyModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '90%',
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontWeight: '700',
                      color: theme.accent,
                      fontSize: 15,
                    }}
                  >
                    {activeTicket.ticketId}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    Balas Tiket Bantuan
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowReplyModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Client & Ticket Metadata */}
                <View
                  style={{
                    backgroundColor: theme.subtleBg,
                    padding: 15,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 15,
                  }}
                >
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Klien & Perusahaan:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                      {activeTicket.clientName} ({activeTicket.clientCompany})
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Subjek:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, flex: 1, textAlign: 'right', marginLeft: 15 }}>
                      {activeTicket.subject}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Prioritas:</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color:
                          activeTicket.priority === 'high'
                            ? '#ef4444'
                            : activeTicket.priority === 'medium'
                            ? '#d97706'
                            : '#10b981',
                        textTransform: 'capitalize',
                      }}
                    >
                      {activeTicket.priority}
                    </Text>
                  </View>
                </View>

                {/* Original Client Message */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                  Pesan Asli Pengirim:
                </Text>
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    padding: 14,
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.accent,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                    {activeTicket.description}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, textAlign: 'right' }}>
                    Dibuat: {activeTicket.createdAt}
                  </Text>
                </View>

                {/* Previous Replies Thread */}
                {activeTicket.replies.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Riwayat Balasan Sebelumnya ({activeTicket.replies.length}):
                    </Text>
                    {activeTicket.replies.map((rep) => (
                      <View
                        key={rep.id}
                        style={{
                          backgroundColor: theme.subtleBg,
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>
                            {rep.sender}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>{rep.time}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.text, lineHeight: 18 }}>
                          {rep.message}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Quick Templates */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
                    Pilih Template Tanggapan Cepat:
                  </Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      'Halo, keluhan Anda sedang kami investigasi oleh tim teknis.',
                      'Masalah export telah kami tangani, silakan coba kembali.',
                      'Pembayaran telah terverifikasi, akun perusahaan telah aktif.',
                    ].map((tpl, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setReplyMessage((prev) => (prev ? prev + '\n' + tpl : tpl))}
                        style={{
                          backgroundColor: theme.subtleBg,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: theme.border,
                          cursor: 'pointer',
                        } as any}
                      >
                        <Text style={{ fontSize: 11, color: theme.text }}>
                          {tpl.slice(0, 36)}...
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Reply Message Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Pesan Balasan Anda:
                  </Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Ketikkan balasan resmi untuk klien / admin perusahaan..."
                    placeholderTextColor={theme.placeholder}
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 13,
                      color: theme.text,
                      backgroundColor: theme.cardBg,
                      minHeight: 100,
                      textAlignVertical: 'top',
                    } as any}
                  />
                </View>

                {/* Update Status Option */}
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                    Perbarui Status Tiket Setelah Membalas:
                  </Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { key: 'progress', label: 'In Progress (Sedang Diproses)' },
                      { key: 'resolved', label: 'Resolved (Selesai Ditangani)' },
                      { key: 'closed', label: 'Closed (Tutup Tiket)' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setReplyNextStatus(opt.key as any)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 6,
                          backgroundColor: replyNextStatus === opt.key ? theme.accent : theme.subtleBg,
                          borderWidth: 1,
                          borderColor: replyNextStatus === opt.key ? theme.accent : theme.border,
                          cursor: 'pointer',
                        } as any}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: replyNextStatus === opt.key ? '#ffffff' : theme.text,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: 18,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowReplyModal(false)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    cursor: 'pointer',
                  } as any}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendReply}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    borderRadius: 6,
                    backgroundColor: theme.accent,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  } as any}
                >
                  <Send size={15} color="#ffffff" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Kirim Balasan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 2: BUAT TIKET INTERNAL */}
      {showCreateModal && (
        <Modal transparent animationType="fade" visible={showCreateModal} onRequestClose={() => setShowCreateModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 580,
                maxHeight: '90%',
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Plus size={20} color={theme.accent} />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>
                    Buat Tiket Dukungan Internal
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Klien / Pengirim */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Nama Klien / Pelapor *
                  </Text>
                  <TextInput
                    placeholder="Contoh: Nama Pelapor"
                    placeholderTextColor={theme.placeholder}
                    value={newClientName}
                    onChangeText={setNewClientName}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      fontSize: 13,
                      color: theme.text,
                      backgroundColor: theme.cardBg,
                    } as any}
                  />
                </View>

                {/* Perusahaan */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Nama Perusahaan (Tenant)
                  </Text>
                  <TextInput
                    placeholder="Contoh: PT Nama Perusahaan"
                    placeholderTextColor={theme.placeholder}
                    value={newClientCompany}
                    onChangeText={setNewClientCompany}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      fontSize: 13,
                      color: theme.text,
                      backgroundColor: theme.cardBg,
                    } as any}
                  />
                </View>

                {/* Prioritas */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Tingkat Prioritas
                  </Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                    {[
                      { key: 'high', label: 'Tinggi (High)', color: '#ef4444' },
                      { key: 'medium', label: 'Sedang (Medium)', color: '#d97706' },
                      { key: 'low', label: 'Rendah (Low)', color: '#10b981' },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.key}
                        onPress={() => setNewPriority(p.key as any)}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 6,
                          alignItems: 'center',
                          backgroundColor: newPriority === p.key ? p.color : theme.subtleBg,
                          borderWidth: 1,
                          borderColor: newPriority === p.key ? p.color : theme.border,
                          cursor: 'pointer',
                        } as any}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: newPriority === p.key ? '#ffffff' : theme.text,
                          }}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Subjek */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Subjek Tiket *
                  </Text>
                  <TextInput
                    placeholder="Contoh: Kendala Sinkronisasi Absensi Offline"
                    placeholderTextColor={theme.placeholder}
                    value={newSubject}
                    onChangeText={setNewSubject}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      fontSize: 13,
                      color: theme.text,
                      backgroundColor: theme.cardBg,
                    } as any}
                  />
                </View>

                {/* Deskripsi Masalah */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
                    Deskripsi Masalah / Catatan Dukungan *
                  </Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Jelaskan detail kendala teknis atau kebutuhan yang disampaikan klien..."
                    placeholderTextColor={theme.placeholder}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 13,
                      color: theme.text,
                      backgroundColor: theme.cardBg,
                      minHeight: 90,
                      textAlignVertical: 'top',
                    } as any}
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: 18,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    cursor: 'pointer',
                  } as any}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTicket}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    borderRadius: 6,
                    backgroundColor: theme.accent,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  } as any}
                >
                  <Check size={16} color="#ffffff" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Buat Tiket</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 3: LIHAT DETAIL TIKET */}
      {showDetailModal && activeTicket && (
        <Modal transparent animationType="fade" visible={showDetailModal} onRequestClose={() => setShowDetailModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 620,
                maxHeight: '90%',
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <View>
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700' }}>
                    {activeTicket.ticketId}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    {activeTicket.subject}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDetailModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                {/* Meta details */}
                <View
                  style={{
                    backgroundColor: theme.subtleBg,
                    padding: 14,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Klien:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{activeTicket.clientName}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Perusahaan:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.accent }}>{activeTicket.clientCompany}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Prioritas:</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color:
                          activeTicket.priority === 'high'
                            ? '#ef4444'
                            : activeTicket.priority === 'medium'
                            ? '#d97706'
                            : '#10b981',
                        textTransform: 'uppercase',
                      }}
                    >
                      {activeTicket.priority}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>Status:</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color:
                          activeTicket.status === 'open'
                            ? theme.dangerText
                            : activeTicket.status === 'progress'
                            ? '#d97706'
                            : activeTicket.status === 'resolved'
                            ? theme.successText
                            : theme.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {activeTicket.status}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                  Deskripsi Tiket:
                </Text>
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                    {activeTicket.description}
                  </Text>
                </View>

                {/* Replies Thread */}
                {activeTicket.replies.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                      Log Tanggapan & Balasan:
                    </Text>
                    {activeTicket.replies.map((rep) => (
                      <View
                        key={rep.id}
                        style={{
                          backgroundColor: theme.subtleBg,
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>
                            {rep.sender}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>{rep.time}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.text }}>{rep.message}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 18,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.cardHeaderBg,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    // Quick Reopen / In Progress
                    const newStatus = activeTicket.status === 'closed' ? 'open' : 'progress';
                    setTickets(
                      tickets.map((t) => (t.id === activeTicket.id ? { ...t, status: newStatus } : t))
                    );
                    setShowDetailModal(false);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    cursor: 'pointer',
                  } as any}
                >
                  <Text style={{ fontSize: 13, color: theme.text }}>
                    {activeTicket.status === 'closed' ? 'Buka Kembali Tiket' : 'Ubah ke In Progress'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowDetailModal(false);
                    handleOpenReply(activeTicket);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    backgroundColor: theme.accent,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  } as any}
                >
                  <Reply size={14} color="#ffffff" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>Balas Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 4: NOTIFIKASI */}
      {showNotifModal && (
        <Modal transparent animationType="fade" visible={showNotifModal} onRequestClose={() => setShowNotifModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 450,
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} color={theme.accent} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Notifikasi Tiket Bantuan</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifModal(false)} style={{ cursor: 'pointer' } as any}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <View style={{ padding: 12, borderRadius: 8, backgroundColor: theme.infoBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.infoText }}>
                    Pusat Bantuan Siap
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 2 }}>
                    Tiket aduan dan bantuan teknis dari tenant akan langsung terhubung ke dashboard ini.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowNotifModal(false)}
                style={{
                  marginTop: 18,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: theme.subtleBg,
                  alignItems: 'center',
                  cursor: 'pointer',
                } as any}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>Tutup Notifikasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
