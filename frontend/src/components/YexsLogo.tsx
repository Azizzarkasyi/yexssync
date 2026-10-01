import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface YexsLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: number;
  rounded?: boolean;
}

export const YexsLogo: React.FC<YexsLogoProps> = ({
  size = 32,
  showText = false,
  textColor = '#2a75d3',
  textSize = 18,
  rounded = true,
}) => {
  const borderRadius = rounded ? Math.round(size * 0.22) : 0;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            borderRadius: borderRadius,
            overflow: 'hidden',
          },
        ]}
      >
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      {showText && (
        <Text
          style={[
            styles.brandText,
            {
              color: textColor,
              fontSize: textSize,
              marginLeft: 8,
            },
          ]}
        >
          YEXSSYNC
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#08142c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  brandText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default YexsLogo;
