import { View, Text, type ViewProps, type TextProps } from 'react-native';

export function Card({ className, style, ...props }: ViewProps) {
  return (
    <View 
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm shadow-slate-200/40 dark:shadow-none overflow-hidden ${className || ''}`} 
      style={[{ elevation: 2 }, style]}
      {...props} 
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={`p-6 pb-4 ${className || ''}`} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text className={`text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight ${className || ''}`} {...props} />
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={`p-6 ${className || ''}`} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={`p-6 pt-0 flex-row items-center ${className || ''}`} {...props} />;
}
