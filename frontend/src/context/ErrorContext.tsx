import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ErrorContextType {
  showError: (title: string, message: string) => void;
  hideError: () => void;
}

export const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
  hideError: () => {},
});

export const useError = () => useContext(ErrorContext);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [animValue] = useState(new Animated.Value(0));

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setIsVisible(true);
    
    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: false, // Fixed for web
      tension: 65,
      friction: 8,
    }).start();
  };

  const hideError = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // Fixed for web
    }).start(() => {
      setIsVisible(false);
    });
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <ErrorContext.Provider value={{ showError, hideError }}>
      {children}
      
      {isVisible && (
        <Modal
          transparent
          visible={isVisible}
          animationType="none"
          onRequestClose={hideError}
        >
          <View className="flex-1 justify-center items-center bg-black/60 px-5">
            <Animated.View 
              style={{
                opacity,
                transform: [{ translateY }, { scale }],
                width: Platform.OS === 'web' ? Math.min(width - 40, 420) : '100%',
              }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Elegant Error Indicator Banner */}
              <View className="h-2 w-full bg-red-500" />

              <View className="p-6">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
                    <AlertTriangle color="#ef4444" size={24} strokeWidth={2.5} />
                  </View>
                  <TouchableOpacity 
                    onPress={hideError} 
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                  >
                    <X color="#64748b" size={18} />
                  </TouchableOpacity>
                </View>

                <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {errorTitle}
                </Text>
                
                <Text className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  {errorMessage}
                </Text>

                <TouchableOpacity 
                  onPress={hideError}
                  activeOpacity={0.8}
                  className="w-full bg-slate-900 dark:bg-white rounded-2xl py-4 items-center justify-center shadow-lg shadow-slate-900/20"
                >
                  <Text className="text-white dark:text-slate-900 font-bold text-base tracking-wide">
                    Mengerti
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </ErrorContext.Provider>
  );
};
