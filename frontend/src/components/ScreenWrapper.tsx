import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { View } from 'react-native';

export function ScreenWrapper({ children, className, style, ...props }: SafeAreaViewProps) {
  return (
    <SafeAreaView 
      className={`flex-1 bg-slate-50 dark:bg-slate-900 ${className || ''}`} 
      style={[{ minHeight: '100%', flex: 1 }, style]}
      {...props}
    >
      <View className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ minHeight: 0, height: '100%' }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
