import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/Colors';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

export default function Card({
  children,
  style,
  elevation = 2,
  borderRadius = 16,
  backgroundColor = COLORS.card,
  ...props
}: CardProps) {
  const cardStyle = {
    backgroundColor,
    borderRadius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.1,
    shadowRadius: elevation,
    elevation,
  };

  if (props.onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, cardStyle, style]}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
});