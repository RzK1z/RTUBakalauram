import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientBackgroundScreen = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6dd5ed', '#2193b0']}
        style={styles.background}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientBackgroundScreen