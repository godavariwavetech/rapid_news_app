import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchMatchDetail, clearMatchDetail } from '../redux/reducers/cricket';

const Row = ({ left, right, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLeft, bold && styles.bold]} numberOfLines={1}>{left}</Text>
    <Text style={[styles.rowRight, bold && styles.bold]}>{right}</Text>
  </View>
);

const FullScorecardScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const matchId = route?.params?.matchId;
  const { detail, loadingDetail } = useSelector((s) => s.cricket);

  useEffect(() => {
    if (matchId) dispatch(fetchMatchDetail(matchId));
    return () => dispatch(clearMatchDetail());
  }, [matchId, dispatch]);

  const innings = detail?.scorecard?.innings || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1c33" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Full Scorecard</Text>
        <View style={{ width: 22 }} />
      </View>

      {loadingDetail && <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />}

      {!loadingDetail && detail && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.scoreHeader}>
            {(detail.teams || []).map((t, i) => (
              <View key={i} style={styles.teamCol}>
                <Text style={styles.teamShort}>{t.short}</Text>
                <Text style={styles.teamScore}>
                  {t.runs != null ? `${t.runs}/${t.wickets ?? 0}` : '—'}
                </Text>
                <Text style={styles.teamOvers}>{t.overs != null ? `${t.overs} ov` : ''}</Text>
              </View>
            ))}
          </View>
          {detail.toss ? <Text style={styles.toss}>{detail.toss}</Text> : null}
          {detail.venue ? <Text style={styles.venue}>{detail.venue}</Text> : null}

          {innings.map((inn, idx) => (
            <View key={idx} style={styles.innings}>
              <Text style={styles.inningsTitle}>
                {inn.team} — {inn.runs}/{inn.wickets} ({inn.overs} ov)
              </Text>

              <Text style={styles.sectionLabel}>BATTING</Text>
              {(inn.batting || []).map((b, i) => (
                <Row
                  key={i}
                  left={`${b.player}${b.dismissal ? `  ${b.dismissal}` : ''}`}
                  right={`${b.runs} (${b.balls})`}
                />
              ))}

              <Text style={styles.sectionLabel}>BOWLING</Text>
              {(inn.bowling || []).map((bw, i) => (
                <Row key={i} left={bw.player} right={`${bw.wickets}/${bw.runs} (${bw.overs})`} />
              ))}

              {inn.fall_of_wickets?.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>FALL OF WICKETS</Text>
                  {inn.fall_of_wickets.map((f, i) => (
                    <Row key={i} left={`${f.player}`} right={`${f.score} (${f.over})`} />
                  ))}
                </>
              )}
            </View>
          ))}

          {detail.source === 'MOCK' && (
            <Text style={styles.mockNote}>Mock data — live provider integration pending.</Text>
          )}
        </ScrollView>
      )}

      {!loadingDetail && !detail && (
        <Text style={styles.empty}>Match not found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1c33' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  teamCol: { alignItems: 'center', flex: 1 },
  teamShort: { color: '#fbbf24', fontWeight: '700', fontSize: 14 },
  teamScore: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  teamOvers: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  toss: { color: '#e2e8f0', textAlign: 'center', marginTop: 6, fontWeight: '600' },
  venue: { color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 2 },
  innings: { marginTop: 20, backgroundColor: '#11294a', borderRadius: 10, padding: 12 },
  inningsTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  sectionLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1e3a5f',
  },
  rowLeft: { color: '#cbd5e1', flex: 1, marginRight: 10 },
  rowRight: { color: '#fff' },
  bold: { fontWeight: '700' },
  mockNote: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  empty: { color: '#cbd5e1', textAlign: 'center', marginTop: 24 },
});

export default FullScorecardScreen;
