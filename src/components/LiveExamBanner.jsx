import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLiveExams } from '../redux/reducers/exams';

// Home/discovery LIVE banner for exams whose results are open. Tapping opens
// the hall-ticket result screen. Renders nothing when no exam is live.
const LiveExamBanner = ({ navigation }) => {
  const dispatch = useDispatch();
  const { liveExams } = useSelector((s) => s.exams);

  useEffect(() => {
    dispatch(fetchLiveExams());
  }, [dispatch]);

  if (!liveExams || liveExams.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {liveExams.map((exam) => (
        <TouchableOpacity
          key={exam._id}
          style={styles.banner}
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('ExamResult', { exam })}
        >
          <View style={styles.liveRow}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.title}>
            {exam.banner || `${exam.name} results are `}
            <Text style={styles.titleAccent}>LIVE now</Text>
          </Text>
          <Text style={styles.cta}>Enter hall ticket to check result ›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 12 },
  banner: { backgroundColor: '#14342b', borderRadius: 12, padding: 16, marginBottom: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 6 },
  liveText: { color: '#f59e0b', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  titleAccent: { color: '#fbbf24', fontWeight: '800' },
  cta: { color: '#86efac', fontSize: 12, marginTop: 8, fontWeight: '600' },
});

export default LiveExamBanner;
