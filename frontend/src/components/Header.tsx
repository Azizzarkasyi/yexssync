import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, subtitle, showBack, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between mb-8">
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3 bg-slate-100 dark:bg-slate-800 rounded-full">
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      
      {rightElement && (
        <View className="ml-4">
          {rightElement}
        </View>
      )}
    </View>
  );
}
