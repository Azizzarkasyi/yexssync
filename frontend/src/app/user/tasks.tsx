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
  const [activeTab, setActiveTab] = useState<'TODAY' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('TODAY');

  // Detail Modal state
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const avatarUri =
    (user as any)?.photo ||
    (user as any)?.avatar ||
    (user as any)?.profilePicture ||
    'https://i.pravatar.cc/150?img=12';


  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // Support both /tasks/my and fallback
      let response;
      try {
        response = await api.get('/tasks/my');
      } catch {
        response = await api.get('/tasks/me');
      }

      if (response?.data?.success && Array.isArray(response.data.data)) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  // Map API data or fallback to defaults
  const displayTasks: TaskItem[] = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasks.map((t: any, index: number) => {
        let normalizedStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE' = 'PENDING';
        if (t.status === 'DONE' || t.status === 'COMPLETED') normalizedStatus = 'DONE';
        else if (t.status === 'IN_PROGRESS') normalizedStatus = 'IN_PROGRESS';

        // Derive priority from task data or fallback
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
          completedAt: normalizedStatus === 'DONE' ? (t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('id-ID') : 'Hari ini') : undefined,
          notes: t.notes || (normalizedStatus === 'DONE' ? 'Tugas telah diselesaikan dengan baik.' : undefined),
          isToday: true,
        };
      });
    }

    return [];
  }, [tasks]);

  // Status Updater
  const updateTaskStatus = async (taskId: string | number, newStatus: 'IN_PROGRESS' | 'DONE') => {
    setIsUpdatingStatus(true);
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      if (typeof taskId === 'number' || !String(taskId).startsWith('mock-')) {
        await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      }
      // If updating the active modal task
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      Alert.alert(
        'Berhasil',
        newStatus === 'DONE'
          ? 'Tugas berhasil ditandai selesai!'
          : 'Tugas sedang dikerjakan.'
      );
      fetchTasks();
    } catch (error: any) {
      console.warn('Backend update failed, using optimistic state', error);
      // Even if mock or offline, keep optimistic update for preview
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Count items for today
  const todayTasks = useMemo(() => displayTasks.filter((t) => t.isToday), [displayTasks]);
  const todayCount = todayTasks.length;

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'TODAY':
        return displayTasks.filter((t) => t.isToday);
      case 'PENDING':
        return displayTasks.filter((t) => t.status === 'PENDING');
      case 'IN_PROGRESS':
        return displayTasks.filter((t) => t.status === 'IN_PROGRESS');
      case 'DONE':
        return displayTasks.filter((t) => t.status === 'DONE');
      default:
        return displayTasks;
    }
  }, [displayTasks, activeTab]);

  const openTaskDetail = (task: TaskItem) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f4f7fb] dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#2a75d3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#e0e5ec] dark:bg-slate-950 items-center" style={{ flex: 1, height: '100%', minHeight: '100%' }}>
      {/* Smartphone Container */}
      <View className="w-full max-w-[414px] flex-1 bg-[#f4f7fb] dark:bg-slate-950 shadow-2xl" style={{ flex: 1, height: '100%', minHeight: 0 }}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3 bg-[#f4f7fb] dark:bg-slate-950 z-10">
          <Text className="text-[18px] font-bold text-[#222222] dark:text-white">
            Daftar Tugas
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/user/profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"
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
          className="flex-1 px-5"
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
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
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1 mb-5"
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {/* Tab: Hari Ini */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('TODAY')}
              className={`px-4 py-2 rounded-full border ${
                activeTab === 'TODAY'
                  ? 'bg-[#2a75d3] border-[#2a75d3]'
                  : 'bg-transparent border-[#eef1f6] dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  activeTab === 'TODAY'
                    ? 'text-white'
                    : 'text-[#777777] dark:text-slate-400'
                }`}
              >
                Hari Ini ({todayCount})
              </Text>
            </TouchableOpacity>

            {/* Tab: Belum Mulai */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-full border ${
                activeTab === 'PENDING'
                  ? 'bg-[#2a75d3] border-[#2a75d3]'
                  : 'bg-transparent border-[#eef1f6] dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  activeTab === 'PENDING'
                    ? 'text-white'
                    : 'text-[#777777] dark:text-slate-400'
                }`}
              >
                Belum Mulai
              </Text>
            </TouchableOpacity>

            {/* Tab: Dikerjakan */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('IN_PROGRESS')}
              className={`px-4 py-2 rounded-full border ${
                activeTab === 'IN_PROGRESS'
                  ? 'bg-[#2a75d3] border-[#2a75d3]'
                  : 'bg-transparent border-[#eef1f6] dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  activeTab === 'IN_PROGRESS'
                    ? 'text-white'
                    : 'text-[#777777] dark:text-slate-400'
                }`}
              >
                Dikerjakan
              </Text>
            </TouchableOpacity>

            {/* Tab: Selesai */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DONE')}
              className={`px-4 py-2 rounded-full border ${
                activeTab === 'DONE'
                  ? 'bg-[#2a75d3] border-[#2a75d3]'
                  : 'bg-transparent border-[#eef1f6] dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  activeTab === 'DONE'
                    ? 'text-white'
                    : 'text-[#777777] dark:text-slate-400'
                }`}
              >
                Selesai
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Task List */}
          <View className="flex-col gap-[15px]">
            {filteredTasks.length === 0 ? (
              <View className="py-12 items-center bg-white dark:bg-slate-900 rounded-[16px] p-6 border border-[#eef1f6] dark:border-slate-800">
                <FileText size={40} color={isDark ? '#64748b' : '#94a3b8'} strokeWidth={1.5} />
                <Text className="text-[15px] font-semibold text-[#222222] dark:text-white mt-3">
                  Tidak Ada Tugas
                </Text>
                <Text className="text-[12px] text-[#777777] dark:text-slate-400 mt-1 text-center">
                  Tidak ada tugas pada kategori filter ini.
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => {
                // Priority border color
                const borderLeftColorClass =
                  task.priority === 'HIGH'
                    ? 'border-l-[#dc3545]'
                    : task.priority === 'MEDIUM'
                    ? 'border-l-[#f59e0b]'
                    : 'border-l-[#28a745]';

                const isDone = task.status === 'DONE';

                return (
                  <View
                    key={task.id}
                    style={isDone ? { opacity: 0.75 } : undefined}
                    className={`bg-white dark:bg-slate-900 rounded-[16px] p-4 shadow-sm shadow-black/5 dark:shadow-none flex-col gap-3 border-l-4 ${borderLeftColorClass} border-r border-t border-b border-r-[#eef1f6] border-t-[#eef1f6] border-b-[#eef1f6] dark:border-r-slate-800 dark:border-t-slate-800 dark:border-b-slate-800`}
                  >
                    {/* Task Header */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-2">
                        <Text className="text-[12px] text-[#2a75d3] font-medium mb-1">
                          {task.project}
                        </Text>
                        <Text className="text-[15px] font-semibold text-[#222222] dark:text-white leading-[1.4]">
                          {task.title}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      {task.status === 'PENDING' && (
                        <View className="px-2 py-1 rounded-[6px] bg-[#f1f5f9] dark:bg-slate-800">
                          <Text className="text-[10px] font-semibold text-[#475569] dark:text-slate-300 uppercase tracking-wider">
                            Belum Mulai
                          </Text>
                        </View>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <View className="px-2 py-1 rounded-[6px] bg-[#e0f2fe] dark:bg-sky-950/80">
                          <Text className="text-[10px] font-semibold text-[#0ea5e9] dark:text-sky-400 uppercase tracking-wider">
                            Dikerjakan
                          </Text>
                        </View>
                      )}

                      {task.status === 'DONE' && (
                        <View className="px-2 py-1 rounded-[6px] bg-[#e6f6eb] dark:bg-emerald-950/80">
                          <Text className="text-[10px] font-semibold text-[#28a745] dark:text-emerald-400 uppercase tracking-wider">
                            Selesai
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Task Meta Box */}
                    <View className="flex-col gap-[6px] bg-[#fafbfe] dark:bg-slate-800/60 p-[10px] rounded-[8px] border border-[#eef1f6] dark:border-slate-800">
                      {/* Meta: Deadline / Clock */}
                      {task.status !== 'DONE' && task.deadlineText && (
                        <View className="flex-row items-center gap-2">
                          <Clock
                            size={14}
                            color={task.priority === 'HIGH' ? '#dc3545' : '#777777'}
                            strokeWidth={2.2}
                          />
                          <Text
                            className={`text-[12px] ${
                              task.priority === 'HIGH'
                                ? 'text-[#dc3545] font-medium'
                                : 'text-[#777777] dark:text-slate-400'
                            }`}
                          >
                            {task.deadlineText}
                          </Text>
                        </View>
                      )}

                      {/* Meta: Location */}
                      {task.location && (
                        <View className="flex-row items-center gap-2">
                          <MapPin size={14} color="#777777" strokeWidth={2.2} />
                          <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                            {task.location}
                          </Text>
                        </View>
                      )}

                      {/* Meta: Progress (for In Progress) */}
                      {task.status === 'IN_PROGRESS' && (
                        <View className="flex-row items-center gap-2">
                          <SlidersHorizontal size={14} color="#0ea5e9" strokeWidth={2.2} />
                          <Text className="text-[12px] text-[#0ea5e9] dark:text-sky-400 font-medium">
                            Progress: {task.progress ?? 60}%
                          </Text>
                        </View>
                      )}

                      {/* Meta: Completed time (for Done) */}
                      {task.status === 'DONE' && (
                        <View className="flex-row items-center gap-2">
                          <CalendarCheck size={14} color="#28a745" strokeWidth={2.2} />
                          <Text className="text-[12px] text-[#777777] dark:text-slate-400">
                            Selesai: {task.completedAt ?? 'Hari ini, 09:30 WIB'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Task Actions */}
                    <View className="flex-row justify-end gap-[10px] mt-1">
                      {/* PENDING ACTIONS */}
                      {task.status === 'PENDING' && (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => openTaskDetail(task)}
                            className="px-4 py-2 rounded-[8px] border border-[#eef1f6] dark:border-slate-700 bg-transparent flex-row items-center gap-[6px]"
                          >
                            <Text className="text-[12px] font-semibold text-[#222222] dark:text-slate-200">
                              Detail
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="px-4 py-2 rounded-[8px] bg-[#2a75d3] flex-row items-center gap-[6px]"
                          >
                            <Play size={12} color="#ffffff" fill="#ffffff" />
                            <Text className="text-[12px] font-semibold text-white">
                              Mulai
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* IN_PROGRESS ACTIONS */}
                      {task.status === 'IN_PROGRESS' && (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => openTaskDetail(task)}
                            className="px-4 py-2 rounded-[8px] border border-[#eef1f6] dark:border-slate-700 bg-transparent flex-row items-center gap-[6px]"
                          >
                            <Text className="text-[12px] font-semibold text-[#222222] dark:text-slate-200">
                              Detail
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => updateTaskStatus(task.id, 'DONE')}
                            className="px-4 py-2 rounded-[8px] bg-[#28a745] flex-row items-center gap-[6px]"
                          >
                            <Check size={14} color="#ffffff" strokeWidth={2.8} />
                            <Text className="text-[12px] font-semibold text-white">
                              Selesai
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* DONE ACTIONS */}
                      {task.status === 'DONE' && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => openTaskDetail(task)}
                          className="px-4 py-2 rounded-[8px] border border-[#eef1f6] dark:border-slate-700 bg-transparent flex-row items-center gap-[6px]"
                        >
                          <Text className="text-[12px] font-semibold text-[#222222] dark:text-slate-200">
                            Lihat Catatan
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

        {/* Task Detail / Catatan Modal */}
        <Modal
          visible={showDetailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end sm:justify-center items-center px-4 pb-6">
            <View className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-[20px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a75d3]/10 items-center justify-center">
                    <FileText size={16} color="#2a75d3" strokeWidth={2.2} />
                  </View>
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white">
                    Detail Tugas
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowDetailModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={15} color={isDark ? '#cbd5e1' : '#64748b'} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {selectedTask && (
                <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} className="max-h-[420px]">
                  {/* Project & Priority Tag */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[12px] text-[#2a75d3] font-semibold">
                      {selectedTask.project}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedTask.priority === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                          : selectedTask.priority === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
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
                  <Text className="text-[16px] font-bold text-[#222222] dark:text-white mb-3 leading-[1.3]">
                    {selectedTask.title}
                  </Text>

                  {/* Info Row Box */}
                  <View className="bg-[#fafbfe] dark:bg-slate-800/70 p-3 rounded-[10px] border border-[#eef1f6] dark:border-slate-800 flex-col gap-2 mb-4">
                    {selectedTask.deadlineText && (
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#dc3545" strokeWidth={2.2} />
                        <Text className="text-[12px] text-slate-700 dark:text-slate-300">
                          Batas Waktu: <Text className="font-semibold">{selectedTask.deadlineText}</Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.location && (
                      <View className="flex-row items-center gap-2">
                        <MapPin size={14} color="#2a75d3" strokeWidth={2.2} />
                        <Text className="text-[12px] text-slate-700 dark:text-slate-300">
                          Lokasi: <Text className="font-semibold">{selectedTask.location}</Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.status === 'IN_PROGRESS' && (
                      <View className="flex-row items-center gap-2">
                        <SlidersHorizontal size={14} color="#0ea5e9" strokeWidth={2.2} />
                        <Text className="text-[12px] text-slate-700 dark:text-slate-300">
                          Status: <Text className="font-semibold text-[#0ea5e9]">Dikerjakan ({selectedTask.progress ?? 60}%)</Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.status === 'DONE' && selectedTask.completedAt && (
                      <View className="flex-row items-center gap-2">
                        <CalendarCheck size={14} color="#28a745" strokeWidth={2.2} />
                        <Text className="text-[12px] text-slate-700 dark:text-slate-300">
                          Waktu Selesai: <Text className="font-semibold text-[#28a745]">{selectedTask.completedAt}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description Section */}
                  <Text className="text-[13px] font-bold text-[#222222] dark:text-white mb-1">
                    Instruksi & Deskripsi
                  </Text>
                  <Text className="text-[13px] text-[#777777] dark:text-slate-300 leading-[1.5] mb-4">
                    {selectedTask.description}
                  </Text>

                  {/* Notes / Catatan if exists */}
                  {selectedTask.notes && (
                    <View className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-[10px] border border-emerald-200 dark:border-emerald-800">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Info size={13} color="#28a745" strokeWidth={2.2} />
                        <Text className="text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                          Catatan Selesai
                        </Text>
                      </View>
                      <Text className="text-[12px] text-emerald-700 dark:text-emerald-200 leading-[1.4]">
                        {selectedTask.notes}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons Inside Modal */}
                  <View className="flex-row gap-3 pt-2">
                    {selectedTask.status === 'PENDING' && (
                      <TouchableOpacity
                        disabled={isUpdatingStatus}
                        activeOpacity={0.85}
                        onPress={() => {
                          updateTaskStatus(selectedTask.id, 'IN_PROGRESS');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 py-2.5 rounded-[10px] bg-[#2a75d3] items-center justify-center flex-row gap-2"
                      >
                        <Play size={14} color="#ffffff" fill="#ffffff" />
                        <Text className="text-[13px] font-semibold text-white">
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
                        className="flex-1 py-2.5 rounded-[10px] bg-[#28a745] items-center justify-center flex-row gap-2"
                      >
                        <Check size={16} color="#ffffff" strokeWidth={2.8} />
                        <Text className="text-[13px] font-semibold text-white">
                          Tandai Selesai
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setShowDetailModal(false)}
                      className="px-4 py-2.5 rounded-[10px] border border-[#eef1f6] dark:border-slate-700 items-center justify-center"
                    >
                      <Text className="text-[13px] font-medium text-[#777777] dark:text-slate-300">
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
