import { TextInput, type TextInputProps, View, Text } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="w-full mb-5">
      {label && (
        <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <TextInput
        className={`px-5 py-4 rounded-2xl border bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 transition-all duration-300 ${
          error 
            ? 'border-red-500 focus:bg-white dark:focus:bg-slate-800' 
            : 'border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-slate-800 focus:shadow-sm focus:shadow-primary/10'
        } ${className || ''}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="mt-1.5 text-sm font-medium text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
}
