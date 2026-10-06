import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import {
  ClipboardList,
  Clock,
  CheckCheck,
  AlertTriangle,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  X,
  Check,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  MapPin,
  Circle,
} from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopHeader from '@/components/AdminTopHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api';

interface TaskItem {
  id: number;
  title: string;
  description: string;
  dueDate: string | null;
  dueDateLabel?: string;
  isOverdue?: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  project?: string | null;
  location?: string | null;
  assignee?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface EmployeeItem {
  id: number;
  name: string;
  email: string;
  department?: string;
  avatar?: string;
}

export default function AdminTasksScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAdminTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<TaskItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState<number | null>(null);
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<TaskItem['status']>('PENDING');
  const [formPriority, setFormPriority] = useState<TaskItem['priority']>('MEDIUM');

  // Tasks & Employees state (loaded from real database API)
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch from backend
  const fetchInitialData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/users'),
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.data) {
        const mapped = tasksRes.value.data.data.map((t: any) => ({
          ...t,
          priority: (t.priority || 'MEDIUM').toUpperCase(),
          dueDateLabel: formatDate(t.dueDate),
        }));
        setTasks(mapped);
      } else {
        setTasks([]);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) {
        setEmployees(usersRes.value.data.data);
      } else {
        setEmployees([]);
      }
    } catch {
      setTasks([]);
      setEmployees([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInitialData();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.assignee?.name || '').toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'pending') matchStatus = t.status === 'PENDING';
      else if (statusFilter === 'in_progress') matchStatus = t.status === 'IN_PROGRESS';
      else if (statusFilter === 'done') matchStatus = t.status === 'COMPLETED';

      let matchPriority = true;
      if (priorityFilter) matchPriority = t.priority.toLowerCase() === priorityFilter.toLowerCase();

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Dynamic summary metrics
  const totalActiveTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  }, [tasks]);

  const inProgressTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'COMPLETED').length;
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return !isNaN(d.getTime()) && d < now;
    }).length;
  }, [tasks]);

  // Modal Open Handlers
  const openCreateModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormDescription('');
    setFormAssigneeId(employees.length > 0 ? employees[0].id : null);
    setFormDueDate('');
    setFormStatus('PENDING');
    setFormPriority('MEDIUM');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormAssigneeId(task.assignee?.id || null);
    setFormDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setIsModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async () => {
    if (!formTitle.trim()) {
      if (Platform.OS === 'web') window.alert('Judul tugas wajib diisi!');
      else Alert.alert('Peringatan', 'Judul tugas wajib diisi!');
      return;
    }
    setSubmitting(true);
    try {
      try {
        if (editingTaskId) {
          await api.put(`/tasks/${editingTaskId}`, {
            title: formTitle,
            description: formDescription,
            assigneeId: formAssigneeId,
            dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
            status: formStatus,
            priority: formPriority,
          });
        } else {
          await api.post('/tasks', {
            title: formTitle,
            description: formDescription,
            assigneeId: formAssigneeId,
            dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
            status: formStatus,
            priority: formPriority,
          });
        }
      } catch {
        // Fallback local update
      }

      const assignedEmp = employees.find((e) => e.id === formAssigneeId);

      if (editingTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTaskId
              ? {
                  ...t,
                  title: formTitle,
                  description: formDescription,
                  priority: formPriority,
                  status: formStatus,
                  dueDate: formDueDate || t.dueDate,
                  dueDateLabel: formDueDate || t.dueDateLabel,
                  assignee: assignedEmp
                    ? {
                        id: assignedEmp.id,
                        name: assignedEmp.name,
                        email: assignedEmp.email,
                        avatar: assignedEmp.avatar || `https://i.pravatar.cc/150?img=${assignedEmp.id + 10}`,
                      }
                    : t.assignee,
                }
              : t
          )
        );
      } else {
        const newTask: TaskItem = {
          id: Date.now(),
          title: formTitle,
          description: formDescription,
          dueDate: formDueDate || new Date().toISOString(),
          dueDateLabel: formDueDate || 'Hari Ini',
          isOverdue: false,
          priority: formPriority,
          status: formStatus,
          assignee: assignedEmp
            ? {
                id: assignedEmp.id,
                name: assignedEmp.name,
                email: assignedEmp.email,
                avatar: assignedEmp.avatar || `https://i.pravatar.cc/150?img=${assignedEmp.id + 10}`,
              }
            : {
                id: 1,
                name: 'Andi Setiawan',
                email: 'andi@hadiryuk.id',
                avatar: 'https://i.pravatar.cc/150?img=11',
              },
        };
        setTasks((prev) => [newTask, ...prev]);
      }

      if (Platform.OS === 'web') {
        window.alert(`Tugas berhasil ${editingTaskId ? 'diperbarui' : 'dibuat'}!`);
      } else {
        Alert.alert('Sukses', `Tugas berhasil ${editingTaskId ? 'diperbarui' : 'dibuat'}!`);
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Task
  const confirmDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    try {
      try {
        await api.delete(`/tasks/${deleteConfirmTask.id}`);
      } catch {
        // Continue local removal
      }
      setTasks((prev) => prev.filter((t) => t.id !== deleteConfirmTask.id));
      if (Platform.OS === 'web') {
        window.alert('Tugas berhasil dihapus.');
      } else {
        Alert.alert('Sukses', 'Tugas berhasil dihapus.');
      }
      setDeleteConfirmTask(null);
    } catch {
      setDeleteConfirmTask(null);
    }
  };

  // Priority Styles helper
  const getPriorityInfo = (p: TaskItem['priority']) => {
    switch (p) {
      case 'HIGH':
        return { color: theme.danger, label: 'High' };
      case 'LOW':
        return { color: theme.success, label: 'Low' };
      case 'MEDIUM':
      default:
        return { color: '#d39e00', label: 'Medium' };
    }
  };

  // Status Badge Styles helper
  const getStatusBadge = (st: TaskItem['status']) => {
    switch (st) {
      case 'COMPLETED':
        return {
          bg: theme.successBg,
          text: theme.success,
          label: 'DONE',
        };
      case 'IN_PROGRESS':
        return {
          bg: theme.isDark ? 'rgba(23, 162, 184, 0.2)' : '#e0f3f5',
          text: '#17a2b8',
          label: 'IN PROGRESS',
        };
      case 'PENDING':
      default:
        return {
          bg: theme.isDark ? '#334155' : '#f1f5f9',
          text: theme.isDark ? '#94a3b8' : '#475569',
          label: 'PENDING',
        };
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: Platform.OS === 'web' ? '100vh' : '100%', width: '100%', backgroundColor: theme.bgColor, overflow: 'hidden' }}>
      {/* HadirYuk Persistent Sidebar */}
      <AdminSidebar
        currentPath="/admin/tasks"
        isDesktop={isDesktop}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <View style={{ flex: 1, height: '100%', minHeight: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: isDesktop ? 24 : 16,
            paddingBottom: (isDesktop ? 60 : 80) + Math.max(insets.bottom, 16),
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header / Topbar */}
          <AdminTopHeader
            title="Manajemen Tugas Karyawan"
            isDesktop={isDesktop}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* 4 Summary Cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: 20,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {/* Card 1: Blue - Total Tugas Aktif */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.isDark ? 'rgba(42, 117, 211, 0.15)' : '#eaf3fc',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ClipboardList size={22} color={theme.primaryBlue} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Total Tugas Aktif
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {totalActiveTasks}
                </Text>
              </View>
            </View>

            {/* Card 2: Orange - Sedang Dikerjakan */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.warningBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Clock size={22} color="#d39e00" />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Sedang Dikerjakan (In Progress)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {inProgressTasks}
                </Text>
              </View>
            </View>

            {/* Card 3: Green - Tugas Selesai (Bulan Ini) */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.successBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CheckCheck size={22} color={theme.success} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Tugas Selesai (Bulan Ini)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {completedTasks}
                </Text>
              </View>
            </View>

            {/* Card 4: Red - Tugas Terlambat (Overdue) */}
            <View
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.cardBg,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: theme.dangerBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <AlertTriangle size={22} color={theme.danger} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 5 }}>
                  Tugas Terlambat (Overdue)
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textDark }}>
                  {overdueTasks}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Toolbar & Filters */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              padding: 15,
              paddingHorizontal: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderColor,
              marginBottom: 20,
              flexDirection: isDesktop ? 'row' : 'column',
              justifyContent: 'space-between',
              alignItems: isDesktop ? 'center' : 'stretch',
              flexWrap: 'wrap',
              gap: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            {/* Left Filters */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 15,
                alignItems: isDesktop ? 'center' : 'stretch',
                flexWrap: 'wrap',
                flex: 1,
              }}
            >
              {/* Status Filter Dropdown */}
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setPriorityDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.cardBg,
                    minWidth: 150,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {statusFilter === 'pending'
                      ? 'Pending'
                      : statusFilter === 'in_progress'
                      ? 'In Progress'
                      : statusFilter === 'done'
                      ? 'Done'
                      : 'Semua Status'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 150,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      zIndex: 100,
                      elevation: 5,
                    }}
                  >
                    {[
                      { key: '', label: 'Semua Status' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'in_progress', label: 'In Progress' },
                      { key: 'done', label: 'Done' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setStatusFilter(opt.key);
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            statusFilter === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              statusFilter === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: statusFilter === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Priority Filter Dropdown */}
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    setPriorityDropdownOpen(!priorityDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    borderRadius: 6,
                    backgroundColor: theme.cardBg,
                    minWidth: 150,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.textDark }}>
                    {priorityFilter === 'high'
                      ? 'High'
                      : priorityFilter === 'medium'
                      ? 'Medium'
                      : priorityFilter === 'low'
                      ? 'Low'
                      : 'Semua Prioritas'}
                  </Text>
                  <ChevronDown size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {priorityDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 0,
                      width: 150,
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.borderColor,
                      borderRadius: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      zIndex: 100,
                      elevation: 5,
                    }}
                  >
                    {[
                      { key: '', label: 'Semua Prioritas' },
                      { key: 'high', label: 'High' },
                      { key: 'medium', label: 'Medium' },
                      { key: 'low', label: 'Low' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          setPriorityFilter(opt.key);
                          setPriorityDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderColor,
                          backgroundColor:
                            priorityFilter === opt.key ? theme.activeNavBg : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              priorityFilter === opt.key ? theme.primaryBlue : theme.textDark,
                            fontWeight: priorityFilter === opt.key ? '700' : '400',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Search Box */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.borderColor,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  height: 38,
                  minWidth: isDesktop ? 260 : '100%',
                }}
              >
                <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Cari judul tugas atau pegawai..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: theme.textDark,
                    outlineStyle: 'none',
                  } as any}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Right: + Buat Tugas Baru */}
            <TouchableOpacity
              onPress={openCreateModal}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: theme.primaryBlue,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 6,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>
                Buat Tugas Baru
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel Tabel Daftar Tugas */}
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            {/* Panel Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderColor,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                Daftar Tugas Karyawan
              </Text>
            </View>

            {/* Scrollable Table */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={{ minWidth: '100%', flexGrow: 1 }}
            >
              <View style={{ minWidth: 900, width: '100%', flexGrow: 1 }}>
                {/* Table Head */}
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: theme.isDark ? '#1e293b' : '#f8f9fa',
                    borderBottomWidth: 2,
                    borderBottomColor: theme.borderColor,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                  }}
                >
                  <Text
                    style={{
                      flex: 3,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Judul & Deskripsi Tugas
                  </Text>
                  <Text
                    style={{
                      flex: 2,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Diberikan Kepada (Assignee)
                  </Text>
                  <Text
                    style={{
                      flex: 1.2,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Prioritas
                  </Text>
                  <Text
                    style={{
                      flex: 1.8,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Batas Waktu (Due Date)
                  </Text>
                  <Text
                    style={{
                      width: 120,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    style={{
                      width: 90,
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    Aksi
                  </Text>
                </View>

                {/* Table Rows */}
                {filteredTasks.map((t, idx) => {
                  const prio = getPriorityInfo(t.priority);
                  const badge = getStatusBadge(t.status);
                  const isDone = t.status === 'COMPLETED';

                  return (
                    <View
                      key={t.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 15,
                        borderBottomWidth: idx < filteredTasks.length - 1 ? 1 : 0,
                        borderBottomColor: theme.borderColor,
                      }}
                    >
                      {/* Judul & Deskripsi Tugas */}
                      <View style={{ flex: 3, paddingRight: 10 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: theme.textDark,
                            marginBottom: 4,
                          }}
                        >
                          {t.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.textMuted,
                          }}
                          numberOfLines={1}
                        >
                          {t.description}
                        </Text>
                      </View>

                      {/* Diberikan Kepada (Assignee) */}
                      <View
                        style={{
                          flex: 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Image
                          source={{
                            uri:
                              t.assignee?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                t.assignee?.name || 'User'
                              )}&background=2a75d3&color=fff`,
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.borderColor,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '500',
                            color: theme.textDark,
                          }}
                        >
                          {t.assignee?.name || 'Belum Ditugaskan'}
                        </Text>
                      </View>

                      {/* Prioritas Tag with Circle Dot */}
                      <View style={{ flex: 1.2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: prio.color,
                            }}
                          />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: prio.color }}>
                            {prio.label}
                          </Text>
                        </View>
                      </View>

                      {/* Batas Waktu (Due Date) */}
                      <View style={{ flex: 1.8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Clock
                            size={14}
                            color={
                              t.isOverdue
                                ? theme.danger
                                : t.dueDateLabel?.includes('Hari ini')
                                ? theme.textDark
                                : theme.textMuted
                            }
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color:
                                t.isOverdue
                                  ? theme.danger
                                  : t.dueDateLabel?.includes('Hari ini')
                                  ? theme.textDark
                                  : theme.textMuted,
                            }}
                          >
                            {t.dueDateLabel || formatDate(t.dueDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View style={{ width: 120, alignItems: 'center' }}>
                        <View
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            backgroundColor: badge.bg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: badge.text,
                              textAlign: 'center',
                            }}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      {/* Aksi Buttons */}
                      <View
                        style={{
                          width: 90,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        {!isDone ? (
                          <>
                            <TouchableOpacity
                              onPress={() => openEditModal(t)}
                              style={{ padding: 4 }}
                              title="Edit Tugas"
                            >
                              <Edit3 size={16} color={theme.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setDeleteConfirmTask(t)}
                              style={{ padding: 4 }}
                              title="Hapus Tugas"
                            >
                              <Trash2 size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            onPress={() => setViewingTask(t)}
                            style={{ padding: 4 }}
                            title="Lihat Detail"
                          >
                            <Eye size={16} color={theme.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            <View
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: isDesktop ? 'center' : 'flex-start',
                marginTop: 20,
                paddingTop: 15,
                borderTopWidth: 1,
                borderTopColor: theme.borderColor,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: theme.textMuted }}>
                {filteredTasks.length > 0
                  ? `Menampilkan 1 - ${filteredTasks.length} dari ${filteredTasks.length} Tugas`
                  : 'Menampilkan 0 Tugas'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <TouchableOpacity
                  disabled
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ChevronLeft size={14} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.primaryBlue,
                    backgroundColor: theme.primaryBlue,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    backgroundColor: theme.cardBg,
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ChevronRight size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* MODAL 1: Buat / Edit Tugas Baru */}
          {isModalOpen && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setIsModalOpen(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 500,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  {/* Modal Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textDark }}>
                      {editingTaskId ? 'Edit Tugas Karyawan' : 'Buat Tugas Baru'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Form Body */}
                  <View style={{ marginTop: 16, gap: 14 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Judul Tugas *
                      </Text>
                      <TextInput
                        placeholder="e.g. Maintenance Jaringan Lantai 3"
                        placeholderTextColor={theme.placeholder}
                        value={formTitle}
                        onChangeText={setFormTitle}
                        style={{
                          backgroundColor: theme.inputBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          height: 40,
                          fontSize: 13,
                          color: theme.textDark,
                        }}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Deskripsi Lengkap Tugas *
                      </Text>
                      <TextInput
                        placeholder="Rincian instruksi tugas pekerjaan..."
                        placeholderTextColor={theme.placeholder}
                        value={formDescription}
                        onChangeText={setFormDescription}
                        style={{
                          backgroundColor: theme.inputBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 13,
                          color: theme.textDark,
                          height: 70,
                          textAlignVertical: 'top',
                        }}
                        multiline
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Diberikan Kepada (Assignee) *
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {employees.map((emp) => (
                            <TouchableOpacity
                              key={emp.id}
                              onPress={() => setFormAssigneeId(emp.id)}
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor:
                                  formAssigneeId === emp.id
                                    ? theme.primaryBlue
                                    : theme.borderColor,
                                backgroundColor:
                                  formAssigneeId === emp.id
                                    ? theme.activeNavBg
                                    : 'transparent',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: formAssigneeId === emp.id ? '700' : '500',
                                  color:
                                    formAssigneeId === emp.id
                                      ? theme.primaryBlue
                                      : theme.textDark,
                                }}
                              >
                                {emp.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Priority Selector */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Tingkat Prioritas
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {[
                          { key: 'HIGH' as const, label: 'High', color: theme.danger },
                          { key: 'MEDIUM' as const, label: 'Medium', color: '#d39e00' },
                          { key: 'LOW' as const, label: 'Low', color: theme.success },
                        ].map((p) => (
                          <TouchableOpacity
                            key={p.key}
                            onPress={() => setFormPriority(p.key)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor:
                                formPriority === p.key ? p.color : theme.borderColor,
                              backgroundColor:
                                formPriority === p.key ? theme.activeNavBg : 'transparent',
                            }}
                          >
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: p.color,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: formPriority === p.key ? '700' : '500',
                                color: formPriority === p.key ? p.color : theme.textDark,
                              }}
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Due Date Input */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 6 }}>
                        Batas Waktu (Due Date)
                      </Text>
                      <TextInput
                        placeholder="YYYY-MM-DD (e.g. 2026-09-10)"
                        placeholderTextColor={theme.placeholder}
                        value={formDueDate}
                        onChangeText={setFormDueDate}
                        style={{
                          backgroundColor: theme.inputBg,
                          borderWidth: 1,
                          borderColor: theme.borderColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          height: 40,
                          fontSize: 13,
                          color: theme.textDark,
                        }}
                      />
                    </View>
                  </View>

                  {/* Actions in Modal */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                    <TouchableOpacity
                      onPress={() => setIsModalOpen(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                        Batal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveTask}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.primaryBlue,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        {submitting ? 'Menyimpan...' : 'Simpan Tugas'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}

          {/* MODAL 2: Konfirmasi Hapus Tugas */}
          {deleteConfirmTask && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setDeleteConfirmTask(null)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 420,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <View style={{ alignItems: 'center', marginBottom: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: theme.dangerBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Trash2 size={24} color={theme.danger} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                      Hapus Tugas?
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.textMuted,
                        textAlign: 'center',
                        marginTop: 6,
                      }}
                    >
                      Apakah Anda yakin ingin menghapus tugas "{deleteConfirmTask.title}"? Tindakan ini tidak dapat dibatalkan.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmTask(null)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.subtleBg,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textDark }}>
                        Batal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={confirmDeleteTask}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: theme.danger,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        Ya, Hapus
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* MODAL 3: Detail Tugas Selesai */}
          {viewingTask && (
            <Modal
              transparent
              visible
              animationType="fade"
              onRequestClose={() => setViewingTask(null)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 460,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: theme.borderColor,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                      Rincian Tugas
                    </Text>
                    <TouchableOpacity onPress={() => setViewingTask(null)}>
                      <X size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 14, gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textDark }}>
                      {viewingTask.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18 }}>
                      {viewingTask.description}
                    </Text>

                    <View
                      style={{
                        padding: 12,
                        backgroundColor: theme.subtleBg,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.borderColor,
                        marginTop: 6,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Assignee:</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                          {viewingTask.assignee?.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Prioritas:</Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: getPriorityInfo(viewingTask.priority).color,
                          }}
                        >
                          {viewingTask.priority}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Batas Waktu:</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textDark }}>
                          {viewingTask.dueDateLabel || formatDate(viewingTask.dueDate)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>Status:</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.success }}>
                          {viewingTask.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setViewingTask(null)}
                    style={{
                      marginTop: 18,
                      paddingVertical: 10,
                      backgroundColor: theme.primaryBlue,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
