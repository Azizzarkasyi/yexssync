import 'react-native';

declare module 'react-native' {
  interface TouchableOpacityProps {
    title?: string;
    cursor?: string;
  }
  interface TextProps {
    title?: string;
  }
  interface ViewStyle {
    height?: DimensionValue | string;
    width?: DimensionValue | string;
    minHeight?: DimensionValue | string;
    minWidth?: DimensionValue | string;
    cursor?: string;
    overflowX?: string;
    overflowY?: string;
    outlineStyle?: string;
  }
}
