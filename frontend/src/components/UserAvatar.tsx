import React, { useState } from 'react';
import { View, Text, Image, StyleProp, ViewStyle, TextStyle } from 'react-native';

const AVATAR_PALETTE = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#db2777', // Pink
  '#0d9488', // Teal
  '#ea580c', // Orange
];

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getAvatarColor(name?: string | null): string {
  if (!name || typeof name !== 'string') return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

interface UserAvatarProps {
  name?: string | null;
  photo?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderColor?: string;
  borderWidth?: number;
}

export default function UserAvatar({
  name,
  photo,
  size = 36,
  style,
  textStyle,
  borderColor,
  borderWidth = 0,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Consider dummy Pravatar, Unsplash, & ui-avatars links as "not added by user"
  const isDummyOrEmpty =
    !photo ||
    typeof photo !== 'string' ||
    photo.trim() === '' ||
    photo.includes('pravatar.cc') ||
    photo.includes('images.unsplash.com') ||
    photo.includes('ui-avatars.com');

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const fontSize = Math.max(10, Math.round(size * 0.4));

  if (!isDummyOrEmpty && !imageError) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#e2e8f0',
            borderWidth,
            borderColor,
          },
          style,
        ]}
      >
        <Image
          source={{ uri: photo }}
          style={{ width: '100%', height: '100%' }}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: '#ffffff',
            fontSize,
            fontWeight: '700',
            letterSpacing: 0.5,
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}
