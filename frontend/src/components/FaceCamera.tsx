import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from './ui/Button';

interface FaceCameraProps {
  onCapture: (photoUri: string, descriptor: number[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function FaceCamera({ onCapture, onCancel, isProcessing }: FaceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-black p-6 z-50 absolute inset-0">
        <Text className="text-white text-center mb-4 text-lg">Kami memerlukan akses kamera untuk fitur Face Recognition.</Text>
        <Button onPress={requestPermission}>Izinkan Kamera</Button>
        <Button variant="ghost" className="mt-4" onPress={onCancel}>
          <Text className="text-white">Batal</Text>
        </Button>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current) {
      setIsTakingPhoto(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
        
        // Mock Face Descriptor (Array of 128 zeros) for MVP/Testing
        const mockDescriptor = Array(128).fill(0.1); 
        
        onCapture(photo.uri, mockDescriptor);
      } catch (error) {
        console.error(error);
      } finally {
        setIsTakingPhoto(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-black z-50 absolute inset-0">
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="front" 
        ref={cameraRef}
      >
        <View className="flex-1 bg-black/40 justify-between pb-10 pt-16">
          <View className="items-center px-6">
            <Text className="text-white text-xl font-bold mb-2">Posisikan Wajah Anda</Text>
            <Text className="text-white/80 text-center">
              Pastikan wajah Anda berada di tengah layar dan pencahayaan cukup
            </Text>
          </View>
          
          <View className="flex-row justify-around items-center px-10">
            <TouchableOpacity 
              onPress={onCancel}
              className="bg-white/20 p-4 rounded-full"
              disabled={isTakingPhoto || isProcessing}
            >
              <Text className="text-white font-bold">Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCapture}
              className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 justify-center items-center"
              disabled={isTakingPhoto || isProcessing}
            >
              <View className="absolute z-20 w-16 h-16 bg-white/30 rounded-full items-center justify-center">
                {(isTakingPhoto || isProcessing) && <ActivityIndicator color="#4F46E5" size="large" />}
              </View>
            </TouchableOpacity>
            
            <View className="w-16" />
          </View>
        </View>
      </CameraView>
    </View>
  );
}
