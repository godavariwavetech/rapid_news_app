import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lookupExamResult, clearLookup } from '../redux/reducers/exams';

// Hall-ticket entry + result (hybrid): shows an unofficial in-app teaser and a
// button out to the official portal for the authoritative result.
const ExamResultScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const exam = route?.params?.exam || {};
  const { lookup, looking, lookupError } = useSelector((s) => s.exams);

  const [hallTicket, setHallTicket] = useState('');

  useEffect(() => () => dispatch(clearLookup()), [dispatch]);

  const onGetResult = () => {
    if (!hallTicket.trim()) return;
    dispatch(lookupExamResult({ examId: exam._id, hallTicket: hallTicket.trim() }));
  };

  const openPortal = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1c33" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exam.name || 'Exam Results'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Hall Ticket Number"
            placeholderTextColor="#94a3b8"
            value={hallTicket}
            onChangeText={setHallTicket}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.getBtn} onPress={onGetResult} disabled={looking}>
            <Text style={styles.getBtnText}>GET RESULT</Text>
          </TouchableOpacity>
        </View>

        {!hallTicket.trim() && !lookup && (
          <Text style={styles.hint}>Enter Hall Ticket Number</Text>
        )}

        {looking && <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />}

        {lookupError ? <Text style={styles.error}>{lookupError}</Text> : null}

        {lookup && (
          <View style={styles.resultCard}>
            {lookup.found ? (
              <>
                <Text style={styles.resultName}>{lookup.teaser?.name || 'Candidate'}</Text>
                <Text style={styles.resultLabel}>Hall Ticket: {lookup.hall_ticket}</Text>
                {lookup.teaser?.result ? (
                  <View style={styles.resultBadge}>
                    <Text style={styles.resultBadgeText}>{lookup.teaser.result}</Text>
                  </View>
                ) : null}
                <Text style={styles.unofficial}>Unofficial teaser — verify on the official portal.</Text>
              </>
            ) : (
              <Text style={styles.notFound}>
                No matching record in our index. Check the official portal for the authoritative result.
              </Text>
            )}

            {lookup.official_url ? (
              <TouchableOpacity style={styles.portalBtn} onPress={() => openPortal(lookup.official_url)}>
                <Icon name="open-in-new" size={16} color="#fff" />
                <Text style={styles.portalBtnText}>View on official portal</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1c33' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  body: { padding: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14,
    color: '#0f172a', fontSize: 15,
  },
  getBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
  getBtnText: { color: '#fff', fontWeight: '700' },
  hint: { color: '#f87171', textAlign: 'center', marginTop: 16 },
  error: { color: '#f87171', textAlign: 'center', marginTop: 16 },
  resultCard: { backgroundColor: '#11294a', borderRadius: 12, padding: 18, marginTop: 20, alignItems: 'center' },
  resultName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultLabel: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  resultBadge: { backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 6, marginTop: 12 },
  resultBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  unofficial: { color: '#64748b', fontSize: 11, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  notFound: { color: '#cbd5e1', textAlign: 'center', lineHeight: 20 },
  portalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
  },
  portalBtnText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
});

export default ExamResultScreen;
