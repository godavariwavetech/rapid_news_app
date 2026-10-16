import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchLiveMatches } from '../redux/reducers/cricket';

// Compact live-score card (way2news-style). Renders the first currently-live
// match; tap "Full Scorecard" to open the detail screen. Returns null when no
// match is live, so it's safe to drop anywhere.
const LiveScoreCard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { liveMatches } = useSelector((s) => s.cricket);

  useEffect(() => {
    dispatch(fetchLiveMatches());
  }, [dispatch]);

  if (!liveMatches || liveMatches.length === 0) return null;

  const match = liveMatches[0];
  const [a, b] = match.teams || [];

  const teamScore = (t) =>
    t && t.runs != null ? `${t.runs}/${t.wickets ?? 0}` : '—';
  const teamOvers = (t) => (t && t.overs != null ? `${t.overs} OVERS` : '');

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={styles.liveDot} />
        <Text style={styles.titleText}>LIVE CRICKET SCORE</Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.team}>
          <Text style={styles.teamShort}>{a?.short}</Text>
          <Text style={styles.teamScore}>{teamScore(a)}</Text>
          <Text style={styles.teamOvers}>{teamOvers(a)}</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.team}>
          <Text style={styles.teamShort}>{b?.short}</Text>
          <Text style={styles.teamScore}>{teamScore(b)}</Text>
          <Text style={styles.teamOvers}>{teamOvers(b)}</Text>
        </View>
      </View>

      {match.toss ? <Text style={styles.toss}>{match.toss}</Text> : null}

      {match.recent_balls?.length > 0 && (
        <View style={styles.ballsRow}>
          {match.recent_balls.map((ball, i) => (
            <View key={i} style={[styles.ball, ball === 'W' && styles.ballW]}>
              <Text style={styles.ballText}>{ball}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.fullBtn}
        onPress={() => navigation?.navigate('FullScorecard', { matchId: match.match_id })}
      >
        <Text style={styles.fullBtnText}>FULL SCORECARD</Text>
        <Icon name="chevron-double-right" size={16} color="#60a5fa" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    margin: 14,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#0f2540',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 6 },
  titleText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  team: { alignItems: 'center', flex: 1 },
  teamShort: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  teamScore: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  teamOvers: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  vs: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  toss: { color: '#e2e8f0', fontSize: 12, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  ballsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  ball: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e3a5f', borderWidth: 1, borderColor: '#334155',
  },
  ballW: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  ballText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#334155',
  },
  fullBtnText: { color: '#60a5fa', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginRight: 4 },
});

export default LiveScoreCard;
