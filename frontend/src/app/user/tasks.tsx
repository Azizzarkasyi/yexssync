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
  SafeAreaView,
  useColorScheme,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  Check,
  Clock,
  MapPin,
  CalendarCheck,
  SlidersHorizontal,
  X,
  FileText,
  Info,
  ChevronRight,
  CircleAlert,
  Search,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';

export interface TaskItem {
  id: string | number;
  title: string;
  project: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  deadlineText?: string;
  dueDate?: string | null;
  location?: string | null;
  progress?: number;
  completedAt?: string | null;
  notes?: string | null;
  isToday?: boolean;
}

export default function UserTasksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal state
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

  // Map API data
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

        let deadlineText = 'Hari ini, 17:00 WIB';
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          deadlineText = isNaN(d.getTime())
            ? String(t.dueDate)
            : d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }) + ' WIB';
        }

        return {
          id: t.id,
          title: t.title,
          project,
          description: t.description || 'Tidak ada deskripsi rincian tugas.',
          priority,
          status: normalizedStatus,
          deadlineText,
          dueDate: t.dueDate,
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
                  }) + ' WIB'
                : 'Hari ini'
              : undefined,
          notes: t.notes || (normalizedStatus === 'DONE' ? 'Tugas telah diselesaikan dengan baik.' : undefined),
          isToday: true,
        };
      });
    }

    return [];
  }, [tasks]);

  // Statistics counters
  const totalCount = displayTasks.length;
  const pendingCount = useMemo(() => displayTasks.filter((t) => t.status === 'PENDING').length, [displayTasks]);
  const inProgressCount = useMemo(() => displayTasks.filter((t) => t.status === 'IN_PROGRESS').length, [displayTasks]);
  const doneCount = useMemo(() => displayTasks.filter((t) => t.status === 'DONE').length, [displayTasks]);

  // Status Updater
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
      if (Platform.OS === 'web') {
        window.alert(newStatus === 'DONE' ? 'Tugas berhasil ditandai selesai!' : 'Tugas sedang dikerjakan.');
      } else {
        Alert.alert(
          'Berhasil',
          newStatus === 'DONE' ? 'Tugas berhasil ditandai selesai!' : 'Tugas sedang dikerjakan.'
        );
      }
      fetchTasks();
    } catch (error: any) {
      console.warn('Backend update failed:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    let result = displayTasks;

    if (activeTab === 'PENDING') {
      result = result.filter((t) => t.status === 'PENDING');
    } else if (activeTab === 'IN_PROGRESS') {
      result = result.filter((t) => t.status === 'IN_PROGRESS');
    } else if (activeTab === 'DONE') {
      result = result.filter((t) => t.status === 'DONE');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [displayTasks, activeTab, searchQuery]);

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
      className="flex-1 bg-[#f8fafc] dark:bg-slate-950 items-center"
      style={{ flex: 1, height: '100%', minHeight: '100%' }}
    >
      {/* Responsive Container (aligns with /user) */}
      <View
        className="w-full max-w-3xl flex-1 bg-[#f4f7fb] dark:bg-slate-950 border-x border-[#eef1f6] dark:border-slate-800 shadow-sm"
        style={{ flex: 1, height: '100%', minHeight: 0 }}
      >
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-6 pt-5 pb-4 bg-[#f4f7fb] dark:bg-slate-950 z-10 border-b border-[#eef1f6] dark:border-slate-800">
          <View>
            <Text className="text-[20px] font-bold text-[#1e293b] dark:text-white tracking-tight">
              Daftar Tugas Saya
            </Text>
            <Text className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau progress dan selesaikan pekerjaan tepat waktu
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm"
          >
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView
          className="flex-1 px-6"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
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
          {/* Summary Metric Cards */}
          <View className="flex-row gap-3 mt-4 mb-4">
            {/* Total */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Tugas</Text>
                <View className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/80 items-center justify-center">
                  <ListTodo size={13} color="#2a75d3" strokeWidth={2.5} />
                </View>
              </View>
              <Text className="text-[20px] font-bold text-slate-900 dark:text-white">{totalCount}</Text>
            </View>

            {/* In Progress */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dikerjakan</Text>
                <View className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950/80 items-center justify-center">
                  <SlidersHorizontal size={13} color="#0284c7" strokeWidth={2.5} />
                </View>
              </View>
              <Text className="text-[20px] font-bold text-sky-600 dark:text-sky-400">{inProgressCount}</Text>
            </View>

            {/* Done */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-[14px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Selesai</Text>
                <View className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/80 items-center justify-center">
                  <CheckCircle2 size={13} color="#10b981" strokeWidth={2.5} />
                </View>
              </View>
              <Text className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400">{doneCount}</Text>
            </View>
          </View>

          {/* Search Input */}
          <View className="mb-4">
            <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-[12px] px-3.5 py-2.5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <Search size={16} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Cari tugas atau nama proyek..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-[13px] text-slate-900 dark:text-white"
                style={{ outlineStyle: 'none' } as any}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          >
            {[
              { id: 'ALL', label: `Semua (${totalCount})` },
              { id: 'PENDING', label: `Belum Mulai (${pendingCount})` },
              { id: 'IN_PROGRESS', label: `Dikerjakan (${inProgressCount})` },
              { id: 'DONE', label: `Selesai (${doneCount})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    isActive
                      ? 'bg-[#2a75d3] border-[#2a75d3] shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <Text
                    className={`text-[12px] font-semibold ${
                      isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Task List */}
          <View className="flex-col gap-3.5">
            {filteredTasks.length === 0 ? (
              <View className="py-14 items-center bg-white dark:bg-slate-900 rounded-[16px] p-6 border border-slate-200/80 dark:border-slate-800">
                <View className="w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-800 items-center justify-center mb-3">
                  <FileText size={26} color="#2a75d3" strokeWidth={1.8} />
                </View>
                <Text className="text-[16px] font-bold text-slate-800 dark:text-white">
                  Tidak Ada Tugas
                </Text>
                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 text-center max-w-sm">
                  {searchQuery
                    ? 'Tidak ditemukan tugas yang sesuai dengan pencarian Anda.'
                    : activeTab === 'DONE'
                    ? 'Belum ada tugas yang selesai.'
                    : activeTab === 'IN_PROGRESS'
                    ? 'Belum ada tugas yang sedang Anda kerjakan.'
                    : 'Semua tugas Anda telah selesai atau belum ada tugas yang ditugaskan.'}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'DONE';
                const isInProgress = task.status === 'IN_PROGRESS';

                // Priority style mapping
                const priorityBadge =
                  task.priority === 'HIGH' ? (
                    <View className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200/60 dark:border-rose-900/40 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Tinggi</Text>
                    </View>
                  ) : task.priority === 'MEDIUM' ? (
                    <View className="bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-900/40 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Sedang</Text>
                    </View>
                  ) : (
                    <View className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-900/40 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Rendah</Text>
                    </View>
                  );

                return (
                  <View
                    key={task.id}
                    className={`bg-white dark:bg-slate-900 rounded-[16px] p-4.5 border ${
                      isDone
                        ? 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/10'
                        : isInProgress
                        ? 'border-blue-200/70 dark:border-blue-900/40 shadow-sm'
                        : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                    } flex-col gap-3`}
                  >
                    {/* Header Row: Project, Priority & Status */}
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <View className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
                          <Text className="text-[11px] font-bold text-[#2a75d3] uppercase tracking-wide">
                            {task.project}
                          </Text>
                        </View>
                        {priorityBadge}
                      </View>

                      {/* Status Tag */}
                      {task.status === 'PENDING' && (
                        <View className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Belum Mulai
                          </Text>
                        </View>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <View className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-200/50">
                          <Text className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            Dikerjakan
                          </Text>
                        </View>
                      )}

                      {task.status === 'DONE' && (
                        <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200/50">
                          <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Selesai
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Task Title & Description */}
                    <View>
                      <Text className="text-[15px] font-bold text-slate-900 dark:text-white leading-[1.3] mb-1">
                        {task.title}
                      </Text>
                      <Text
                        className="text-[13px] text-slate-600 dark:text-slate-400 leading-[1.4]"
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>
                    </View>

                    {/* Progress Bar for In-Progress Tasks */}
                    {isInProgress && (
                      <View className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-[10px] border border-slate-100 dark:border-slate-800">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Progress Pengerjaan
                          </Text>
                          <Text className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            {task.progress ?? 50}%
                          </Text>
                        </View>
                        <View className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: `${task.progress ?? 50}%` }}
                          />
                        </View>
                      </View>
                    )}

                    {/* Meta Row: Deadline & Location */}
                    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {task.deadlineText && (
                        <View className="flex-row items-center gap-1.5">
                          <Clock
                            size={13}
                            color={task.priority === 'HIGH' ? '#e11d48' : '#64748b'}
                            strokeWidth={2}
                          />
                          <Text
                            className={`text-[12px] ${
                              task.priority === 'HIGH'
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Deadline: {task.deadlineText}
                          </Text>
                        </View>
                      )}

                      {task.location && (
                        <View className="flex-row items-center gap-1.5">
                          <MapPin size={13} color="#64748b" strokeWidth={2} />
                          <Text className="text-[12px] text-slate-500 dark:text-slate-400">
                            {task.location}
                          </Text>
                        </View>
                      )}

                      {isDone && task.completedAt && (
                        <View className="flex-row items-center gap-1.5">
                          <CalendarCheck size={13} color="#10b981" strokeWidth={2} />
                          <Text className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Diselesaikan: {task.completedAt}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Task Actions */}
                    <View className="flex-row justify-end gap-2 pt-1">
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => openTaskDetail(task)}
                        className="px-3.5 py-2 rounded-[9px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex-row items-center gap-1.5"
                      >
                        <FileText size={13} color={isDark ? '#cbd5e1' : '#334155'} />
                        <Text className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                          Detail
                        </Text>
                      </TouchableOpacity>

                      {task.status === 'PENDING' && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                          className="px-4 py-2 rounded-[9px] bg-[#2a75d3] flex-row items-center gap-1.5 shadow-sm"
                        >
                          <Play size={12} color="#ffffff" fill="#ffffff" />
                          <Text className="text-[12px] font-semibold text-white">
                            Mulai Kerjakan
                          </Text>
                        </TouchableOpacity>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => updateTaskStatus(task.id, 'DONE')}
                          className="px-4 py-2 rounded-[9px] bg-emerald-600 flex-row items-center gap-1.5 shadow-sm"
                        >
                          <Check size={13} color="#ffffff" strokeWidth={3} />
                          <Text className="text-[12px] font-semibold text-white">
                            Tandai Selesai
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
                    <View className="bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">
                      <Text className="text-[11px] font-bold text-[#2a75d3] uppercase">
                        {selectedTask.project}
                      </Text>
                    </View>
                    <View
                      className={`px-2.5 py-1 rounded-md ${
                        selectedTask.priority === 'HIGH'
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600'
                          : selectedTask.priority === 'MEDIUM'
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          selectedTask.priority === 'HIGH'
                            ? 'text-rose-600 dark:text-rose-400'
                            : selectedTask.priority === 'MEDIUM'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Prioritas {selectedTask.priority}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-[18px] font-bold text-slate-900 dark:text-white mb-3 leading-[1.3]">
                    {selectedTask.title}
                  </Text>

                  {/* Meta Box */}
                  <View className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[12px] border border-slate-200/70 dark:border-slate-800 flex-col gap-2.5 mb-4">
                    {selectedTask.deadlineText && (
                      <View className="flex-row items-center gap-2">
                        <Clock size={15} color="#e11d48" strokeWidth={2.2} />
                        <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                          Batas Waktu:{' '}
                          <Text className="font-semibold text-rose-600 dark:text-rose-400">
                            {selectedTask.deadlineText}
                          </Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.location && (
                      <View className="flex-row items-center gap-2">
                        <MapPin size={15} color="#2a75d3" strokeWidth={2.2} />
                        <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                          Lokasi: <Text className="font-semibold">{selectedTask.location}</Text>
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center gap-2">
                      <Layers size={15} color="#64748b" strokeWidth={2.2} />
                      <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                        Status:{' '}
                        <Text
                          className={`font-semibold ${
                            selectedTask.status === 'DONE'
                              ? 'text-emerald-600'
                              : selectedTask.status === 'IN_PROGRESS'
                              ? 'text-sky-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {selectedTask.status === 'DONE'
                            ? 'Selesai'
                            : selectedTask.status === 'IN_PROGRESS'
                            ? `Sedang Dikerjakan (${selectedTask.progress ?? 50}%)`
                            : 'Belum Mulai'}
                        </Text>
                      </Text>
                    </View>

                    {selectedTask.completedAt && (
                      <View className="flex-row items-center gap-2">
                        <CalendarCheck size={15} color="#10b981" strokeWidth={2.2} />
                        <Text className="text-[13px] text-slate-700 dark:text-slate-300">
                          Waktu Selesai:{' '}
                          <Text className="font-semibold text-emerald-600">
                            {selectedTask.completedAt}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description Section */}
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wide">
                    Instruksi & Rincian Tugas
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
                        <Info size={14} color="#10b981" strokeWidth={2.2} />
                        <Text className="text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                          Catatan Penyelesaian
                        </Text>
                      </View>
                      <Text className="text-[12px] text-emerald-700 dark:text-emerald-200 leading-[1.5]">
                        {selectedTask.notes}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons Inside Modal */}
                  <View className="flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {selectedTask.status === 'PENDING' && (
                      <TouchableOpacity
                        disabled={isUpdatingStatus}
                        activeOpacity={0.85}
                        onPress={() => {
                          updateTaskStatus(selectedTask.id, 'IN_PROGRESS');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 py-3 rounded-[12px] bg-[#2a75d3] items-center justify-center flex-row gap-2 shadow-sm"
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
                        className="flex-1 py-3 rounded-[12px] bg-emerald-600 items-center justify-center flex-row gap-2 shadow-sm"
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
                      className="px-5 py-3 rounded-[12px] border border-slate-200 dark:border-slate-700 items-center justify-center"
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
      </View>
    </SafeAreaView>
  );
}
