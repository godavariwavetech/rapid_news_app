import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';

const ReportsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statsColumn}>
              <View style={styles.statItemSmall}>
                <Text style={styles.statLabel}>Published</Text>
                <Text style={styles.statNumberSmall}>3</Text>
              </View>
              <View style={styles.statItemSmall}>
                <Text style={styles.statLabel}>Rejected</Text>
                <Text style={styles.statNumberSmall}>0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Day Report Card */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Day Report</Text>
            <Text style={styles.reportRole}>Day Reporter</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
              <View style={styles.progressHandle} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsColumn: {
    flex: 1,
    gap: 16,
  },
  statItemSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumberSmall: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reportRole: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '20%',
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },
  progressHandle: {
    position: 'absolute',
    left: '20%',
    top: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    transform: [{translateX: -10}, {translateY: -10}],
  },
});

export default ReportsScreen;
