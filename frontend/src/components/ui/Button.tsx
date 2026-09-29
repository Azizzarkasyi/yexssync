import { TouchableOpacity, Text, type TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const baseClasses = "flex-row items-center justify-center rounded-xl transition-all duration-300";
  
  const variantClasses = {
    primary: "bg-primary hover:bg-blue-800 shadow-md shadow-primary/20",
    secondary: "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600",
    outline: "border border-slate-200 dark:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost: "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700",
  };

  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-5 py-3.5",
    lg: "px-8 py-4",
  };

  const textBaseClasses = "font-bold text-center tracking-wide";
  const textVariantClasses = {
    primary: "text-white",
    secondary: "text-slate-900 dark:text-slate-100",
    outline: "text-slate-900 dark:text-slate-100",
    ghost: "text-slate-900 dark:text-slate-100",
  };
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
      activeOpacity={0.8}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={`${textBaseClasses} ${textVariantClasses[variant]} ${textSizeClasses[size]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
