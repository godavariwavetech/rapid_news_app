import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

const ReportsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Reports Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ReportsScreen;
