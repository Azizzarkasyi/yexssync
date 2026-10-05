import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Play,
  Check,
  Clock,
  User as UserIcon,
  Circle,
  Eye,
  AlertTriangle,
  ArrowDownWideNarrow,
  X,
  FileText,
  Layers,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';

export interface TaskItem {
  id: string | number;
  title: string;
  project: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  deadlineText?: string;
  dueDate?: string | null;
  isOverdue?: boolean;
  creatorName: string;
  location?: string | null;
  progress?: number;
  completedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export default function UserTasksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Segmented Control: 'ACTIVE' (Aktif) | 'DONE' (Selesai)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DONE'>('ACTIVE');

  // Sort State: 'DEADLINE' | 'PRIORITY' | 'NEWEST'
  const [sortBy, setSortBy] = useState<'DEADLINE' | 'PRIORITY' | 'NEWEST'>('DEADLINE');
  const [showSortModal, setShowSortModal] = useState(false);

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const avatarUri =
    (user as any)?.photo ||
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2a75d3&color=fff`;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      let response;
      try {
        response = await api.get('/tasks/my');
      } catch {
        response = await api.get('/tasks/me');
      }

      if (response?.data?.success && Array.isArray(response.data.data)) {
        setTasks(response.data.data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.warn('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  // Map API data into normalized TaskItem
  const displayTasks: TaskItem[] = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasks.map((t: any) => {
        let normalizedStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE' = 'PENDING';
        if (t.status === 'DONE' || t.status === 'COMPLETED') normalizedStatus = 'DONE';
        else if (t.status === 'IN_PROGRESS') normalizedStatus = 'IN_PROGRESS';

        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (t.priority === 'HIGH' || t.priority === 'LOW' || t.priority === 'MEDIUM') {
          priority = t.priority;
        }

        const project = t.project || (t.creator?.department ? t.creator.department : 'Umum');
        const creatorName = t.creator?.name || 'Admin';

        let deadlineText = 'Hari ini, 17:00';
        let isOverdue = false;

        if (t.dueDate) {
          const d = new Date(t.dueDate);
          if (!isNaN(d.getTime())) {
            const now = new Date();
            isOverdue = normalizedStatus !== 'DONE' && d.getTime() < now.getTime();

            const isToday =
              d.getDate() === now.getDate() &&
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear();

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday =
              d.getDate() === yesterday.getDate() &&
              d.getMonth() === yesterday.getMonth() &&
              d.getFullYear() === yesterday.getFullYear();

            const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            if (isToday) {
              deadlineText = `Hari ini, ${timeStr}`;
            } else if (isYesterday) {
              deadlineText = `Kemarin, ${timeStr}`;
            } else {
              deadlineText = d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
            }
          } else {
            deadlineText = String(t.dueDate);
          }
        }

        return {
          id: t.id,
          title: t.title,
          project,
          creatorName,
          description: t.description || 'Tidak ada deskripsi rincian tugas.',
          priority,
          status: normalizedStatus,
          deadlineText,
          dueDate: t.dueDate,
          isOverdue,
          location: t.location || undefined,
          progress: normalizedStatus === 'IN_PROGRESS' ? (t.progress ?? 50) : undefined,
          completedAt:
            normalizedStatus === 'DONE'
              ? t.updatedAt
                ? new Date(t.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Hari ini'
              : undefined,
          notes: t.notes || (normalizedStatus === 'DONE' ? 'Tugas telah diselesaikan dengan baik.' : undefined),
          createdAt: t.createdAt,
        };
      });
    }

    return [];
  }, [tasks]);

  // Counts
  const activeTasks = useMemo(
    () => displayTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'),
    [displayTasks]
  );
  const doneTasks = useMemo(
    () => displayTasks.filter((t) => t.status === 'DONE'),
    [displayTasks]
  );

  const activeCount = activeTasks.length;
  const doneCount = doneTasks.length;

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = activeTab === 'ACTIVE' ? [...activeTasks] : [...doneTasks];

    // Apply sorting
    if (sortBy === 'DEADLINE') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'PRIORITY') {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'NEWEST') {
      result.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return result;
  }, [activeTab, activeTasks, doneTasks, sortBy]);

  // Update Task Status
  const updateTaskStatus = async (taskId: string | number, newStatus: 'IN_PROGRESS' | 'DONE') => {
    setIsUpdatingStatus(true);
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      const msg = newStatus === 'DONE' ? 'Tugas berhasil ditandai selesai!' : 'Tugas sedang dikerjakan.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Berhasil', msg);
      fetchTasks();
    } catch (error: any) {
      console.warn('Backend update failed:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openTaskDetail = (task: TaskItem) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#2a75d3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center"
      style={{ flex: 1, height: '100%', minHeight: '100%' }}
    >
      {/* Responsive App Container */}
      <View
        className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm"
        style={{ flex: 1, height: '100%', minHeight: 0 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-5 pb-4 bg-[#f4f7fb] dark:bg-slate-950 z-10 border-b border-[#eef1f6] dark:border-slate-800">
          <Text className="text-[20px] font-bold text-[#222222] dark:text-white tracking-tight">
            Tugas Saya
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
          >
            <UserAvatar name={user?.name} photo={user?.photo || user?.avatar} size={36} />
          </TouchableOpacity>
        </View>

        {/* Tabs: Segmented Control */}
        <View className="px-6 pt-4 pb-2">
          <View className="bg-[#e2e8f0] dark:bg-slate-800/80 rounded-[14px] p-1 flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('ACTIVE')}
              className={`flex-1 py-2.5 rounded-[11px] items-center justify-center transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  activeTab === 'ACTIVE'
                    ? 'text-[#2a75d3]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Aktif ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DONE')}
              className={`flex-1 py-2.5 rounded-[11px] items-center justify-center transition-all ${
                activeTab === 'DONE'
                  ? 'bg-white dark:bg-slate-900 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  activeTab === 'DONE'
                    ? 'text-[#2a75d3]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Selesai ({doneCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          className="flex-1 px-6"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 110, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2a75d3']}
              tintColor="#2a75d3"
            />
          }
        >
          {/* Filter & Sort Area */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              Menampilkan {filteredTasks.length} tugas
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSortModal(true)}
              className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <ArrowDownWideNarrow size={14} color="#2a75d3" strokeWidth={2.2} />
              <Text className="text-[13px] font-bold text-[#2a75d3]">
                {sortBy === 'DEADLINE'
                  ? 'Deadline'
                  : sortBy === 'PRIORITY'
                  ? 'Prioritas'
                  : 'Terbaru'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Task List */}
          <View className="flex-col gap-3.5">
            {filteredTasks.length === 0 ? (
              <View className="py-14 items-center bg-white dark:bg-slate-900 rounded-[18px] p-6 border border-slate-200/80 dark:border-slate-800">
                <View className="w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-800 items-center justify-center mb-3">
                  <CheckCircle2 size={28} color="#2a75d3" strokeWidth={1.8} />
                </View>
                <Text className="text-[16px] font-bold text-slate-800 dark:text-white">
                  {activeTab === 'ACTIVE'
                    ? 'Semua Tugas Aktif Telah Selesai'
                    : 'Belum Ada Tugas Selesai'}
                </Text>
                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 text-center max-w-sm leading-[1.5]">
                  {activeTab === 'ACTIVE'
                    ? 'Kerja bagus! Tidak ada tugas yang sedang menunggu atau dikerjakan saat ini.'
                    : 'Tugas yang telah Anda selesaikan akan otomatis tercatat pada daftar ini.'}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => {
                const isPending = task.status === 'PENDING';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isDone = task.status === 'DONE';

                return (
                  <View
                    key={task.id}
                    className="bg-white dark:bg-slate-900 rounded-[16px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-col gap-3"
                  >
                    {/* Task Header: Priority & Status */}
                    <View className="flex-row justify-between items-center">
                      {/* Priority */}
                      <View
                        className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-[6px] ${
                          task.priority === 'HIGH'
                            ? 'bg-[#fee2e2] dark:bg-rose-950/60 text-[#dc3545]'
                            : task.priority === 'MEDIUM'
                            ? 'bg-[#fef3c7] dark:bg-amber-950/60 text-[#d97706]'
                            : 'bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0ea5e9]'
                        }`}
                      >
                        <Circle
                          size={6}
                          fill={
                            task.priority === 'HIGH'
                              ? '#dc3545'
                              : task.priority === 'MEDIUM'
                              ? '#d97706'
                              : '#0ea5e9'
                          }
                          color="transparent"
                        />
                        <Text
                          className={`text-[11px] font-bold ${
                            task.priority === 'HIGH'
                              ? 'text-[#dc3545] dark:text-rose-400'
                              : task.priority === 'MEDIUM'
                              ? 'text-[#d97706] dark:text-amber-400'
                              : 'text-[#0ea5e9] dark:text-sky-400'
                          }`}
                        >
                          {task.priority === 'HIGH'
                            ? 'High'
                            : task.priority === 'MEDIUM'
                            ? 'Medium'
                            : 'Low'}
                        </Text>
                      </View>

                      {/* Status */}
                      <View
                        className={`px-2.5 py-1 rounded-[6px] ${
                          isPending
                            ? 'bg-[#f1f5f9] dark:bg-slate-800'
                            : isInProgress
                            ? 'bg-[#e0f2fe] dark:bg-sky-950/70'
                            : 'bg-[#dcfce7] dark:bg-emerald-950/70'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isPending
                              ? 'text-[#475569] dark:text-slate-300'
                              : isInProgress
                              ? 'text-[#0ea5e9] dark:text-sky-400'
                              : 'text-[#28a745] dark:text-emerald-400'
                          }`}
                        >
                          {isPending
                            ? 'PENDING'
                            : isInProgress
                            ? 'IN PROGRESS'
                            : 'SELESAI'}
                        </Text>
                      </View>
                    </View>

                    {/* Task Body: Title & Description */}
                    <View className="flex-col gap-1">
                      <Text className="text-[15px] font-bold text-[#222222] dark:text-white leading-[1.4]">
                        {task.title}
                      </Text>
                      <Text
                        className="text-[13px] text-[#777777] dark:text-slate-400 leading-[1.5]"
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>
                    </View>

                    {/* Task Meta: Clock & Assigner */}
                    <View className="flex-row items-center gap-4 pt-1">
                      {/* Deadline item */}
                      <View
                        className={`flex-row items-center gap-1.5 ${
                          task.isOverdue ? 'text-[#dc3545]' : 'text-[#777777]'
                        }`}
                      >
                        {task.isOverdue ? (
                          <AlertTriangle size={13} color="#dc3545" strokeWidth={2.2} />
                        ) : (
                          <Clock size={13} color="#777777" strokeWidth={2} />
                        )}
                        <Text
                          className={`text-[12px] font-medium ${
                            task.isOverdue
                              ? 'text-[#dc3545] font-semibold'
                              : 'text-[#777777] dark:text-slate-400'
                          }`}
                        >
                          {task.deadlineText}
                        </Text>
                      </View>

                      {/* Creator item */}
                      <View className="flex-row items-center gap-1.5">
                        <UserIcon size={13} color="#777777" strokeWidth={2} />
                        <Text className="text-[12px] font-medium text-[#777777] dark:text-slate-400">
                          By: {task.creatorName}
                        </Text>
                      </View>
                    </View>

                    {/* Task Actions */}
                    <View className="flex-row gap-2.5 pt-3 border-t border-[#eef1f6] dark:border-slate-800">
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => openTaskDetail(task)}
                        className="flex-1 py-2.5 px-3 rounded-[8px] bg-[#f1f5f9] dark:bg-slate-800 flex-row items-center justify-center gap-1.5"
                      >
                        <Eye size={14} color={isDark ? '#cbd5e1' : '#222222'} />
                        <Text className="text-[13px] font-bold text-[#222222] dark:text-slate-200">
                          Detail
                        </Text>
                      </TouchableOpacity>

                      {isPending && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                          className="flex-1 py-2.5 px-3 rounded-[8px] bg-[#0ea5e9] flex-row items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play size={13} color="#ffffff" fill="#ffffff" />
                          <Text className="text-[13px] font-bold text-white">
                            Mulai Kerjakan
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isInProgress && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => updateTaskStatus(task.id, 'DONE')}
                          className="flex-1 py-2.5 px-3 rounded-[8px] bg-[#28a745] flex-row items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                          <Text className="text-[13px] font-bold text-white">
                            Selesai
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Task Detail Modal */}
        <Modal
          visible={showDetailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-4">
            <View className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[85vh]">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 items-center justify-center">
                    <FileText size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[17px] font-bold text-slate-900 dark:text-white">
                    Detail Tugas
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowDetailModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={16} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {selectedTask && (
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {/* Badges */}
                  <View className="flex-row justify-between items-center mb-3">
                    <View
                      className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-[6px] ${
                        selectedTask.priority === 'HIGH'
                          ? 'bg-[#fee2e2] dark:bg-rose-950/60'
                          : selectedTask.priority === 'MEDIUM'
                          ? 'bg-[#fef3c7] dark:bg-amber-950/60'
                          : 'bg-[#e0f2fe] dark:bg-sky-950/60'
                      }`}
                    >
                      <Circle
                        size={6}
                        fill={
                          selectedTask.priority === 'HIGH'
                            ? '#dc3545'
                            : selectedTask.priority === 'MEDIUM'
                            ? '#d97706'
                            : '#0ea5e9'
                        }
                        color="transparent"
                      />
                      <Text
                        className={`text-[11px] font-bold ${
                          selectedTask.priority === 'HIGH'
                            ? 'text-[#dc3545] dark:text-rose-400'
                            : selectedTask.priority === 'MEDIUM'
                            ? 'text-[#d97706] dark:text-amber-400'
                            : 'text-[#0ea5e9] dark:text-sky-400'
                        }`}
                      >
                        Prioritas {selectedTask.priority}
                      </Text>
                    </View>

                    <View
                      className={`px-2.5 py-1 rounded-[6px] ${
                        selectedTask.status === 'PENDING'
                          ? 'bg-[#f1f5f9] dark:bg-slate-800'
                          : selectedTask.status === 'IN_PROGRESS'
                          ? 'bg-[#e0f2fe] dark:bg-sky-950/70'
                          : 'bg-[#dcfce7] dark:bg-emerald-950/70'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          selectedTask.status === 'PENDING'
                            ? 'text-[#475569] dark:text-slate-300'
                            : selectedTask.status === 'IN_PROGRESS'
                            ? 'text-[#0ea5e9] dark:text-sky-400'
                            : 'text-[#28a745] dark:text-emerald-400'
                        }`}
                      >
                        {selectedTask.status === 'PENDING'
                          ? 'PENDING'
                          : selectedTask.status === 'IN_PROGRESS'
                          ? 'IN PROGRESS'
                          : 'SELESAI'}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-[17px] font-bold text-slate-900 dark:text-white mb-2 leading-[1.3]">
                    {selectedTask.title}
                  </Text>

                  {/* Meta Box */}
                  <View className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[12px] border border-slate-200/70 dark:border-slate-800 flex-col gap-2.5 mb-4">
                    <View className="flex-row items-center gap-2">
                      <Clock size={15} color={selectedTask.isOverdue ? '#dc3545' : '#64748b'} strokeWidth={2} />
                      <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                        Batas Waktu:{' '}
                        <Text
                          className={`font-semibold ${
                            selectedTask.isOverdue ? 'text-[#dc3545]' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {selectedTask.deadlineText}
                        </Text>
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <UserIcon size={15} color="#64748b" strokeWidth={2} />
                      <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                        Ditugaskan oleh:{' '}
                        <Text className="font-semibold text-slate-900 dark:text-white">
                          {selectedTask.creatorName}
                        </Text>
                      </Text>
                    </View>

                    {selectedTask.project && (
                      <View className="flex-row items-center gap-2">
                        <Layers size={15} color="#64748b" strokeWidth={2} />
                        <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                          Proyek / Departemen:{' '}
                          <Text className="font-semibold text-slate-900 dark:text-white">
                            {selectedTask.project}
                          </Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.completedAt && (
                      <View className="flex-row items-center gap-2">
                        <CalendarCheck size={15} color="#28a745" strokeWidth={2} />
                        <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                          Waktu Selesai:{' '}
                          <Text className="font-semibold text-[#28a745]">
                            {selectedTask.completedAt}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description Section */}
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">
                    Rincian Instruksi
                  </Text>
                  <View className="bg-white dark:bg-slate-900 p-3.5 rounded-[12px] border border-slate-200/80 dark:border-slate-800 mb-4">
                    <Text className="text-[13px] text-slate-700 dark:text-slate-300 leading-[1.6]">
                      {selectedTask.description}
                    </Text>
                  </View>

                  {/* Catatan Selesai */}
                  {selectedTask.notes && (
                    <View className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-[12px] border border-emerald-200 dark:border-emerald-800">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Info size={14} color="#28a745" strokeWidth={2.2} />
                        <Text className="text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                          Catatan Penyelesaian
                        </Text>
                      </View>
                      <Text className="text-[12px] text-emerald-700 dark:text-emerald-200 leading-[1.5]">
                        {selectedTask.notes}
                      </Text>
                    </View>
                  )}

                  {/* Actions inside modal */}
                  <View className="flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {selectedTask.status === 'PENDING' && (
                      <TouchableOpacity
                        disabled={isUpdatingStatus}
                        activeOpacity={0.85}
                        onPress={() => {
                          updateTaskStatus(selectedTask.id, 'IN_PROGRESS');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 py-3 rounded-[10px] bg-[#0ea5e9] items-center justify-center flex-row gap-2 shadow-sm"
                      >
                        <Play size={14} color="#ffffff" fill="#ffffff" />
                        <Text className="text-[13px] font-bold text-white">
                          Mulai Kerjakan
                        </Text>
                      </TouchableOpacity>
                    )}

                    {selectedTask.status === 'IN_PROGRESS' && (
                      <TouchableOpacity
                        disabled={isUpdatingStatus}
                        activeOpacity={0.85}
                        onPress={() => {
                          updateTaskStatus(selectedTask.id, 'DONE');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 py-3 rounded-[10px] bg-[#28a745] items-center justify-center flex-row gap-2 shadow-sm"
                      >
                        <Check size={16} color="#ffffff" strokeWidth={3} />
                        <Text className="text-[13px] font-bold text-white">
                          Tandai Selesai
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowDetailModal(false)}
                      className="px-5 py-3 rounded-[10px] border border-slate-200 dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        Tutup
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <View className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-[18px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              <Text className="text-[16px] font-bold text-slate-900 dark:text-white mb-3">
                Urutkan Tugas
              </Text>
              <View className="flex-col gap-2">
                {[
                  { id: 'DEADLINE', label: 'Batas Waktu (Deadline Terdekat)' },
                  { id: 'PRIORITY', label: 'Tingkat Prioritas Tertinggi' },
                  { id: 'NEWEST', label: 'Terbaru Ditugaskan' },
                ].map((item) => {
                  const isSelected = sortBy === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSortBy(item.id as any);
                        setShowSortModal(false);
                      }}
                      className={`p-3 rounded-[10px] flex-row justify-between items-center ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-[#2a75d3]'
                          : 'bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      <Text
                        className={`text-[13px] font-semibold ${
                          isSelected ? 'text-[#2a75d3]' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Check size={16} color="#2a75d3" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
