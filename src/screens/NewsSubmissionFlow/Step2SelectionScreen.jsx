import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, {Circle, Path, Polygon} from 'react-native-svg';
import api from '../../utils/api';

const LEVELS = [
  {id: 'high', color: '#00C995', text: 'మీరు ఎంచుకున్న ప్రాంతంలో పబ్లిష్ చేయడానికి ఎక్కువ అవకాశాలు ఉన్నాయి'},
  {id: 'medium', color: '#F9A15D', text: 'మీరు ఎంచుకున్న ప్రాంతంలో పబ్లిష్ చేయడానికి మధ్యస్థ అవకాశాలు ఉన్నాయి'},
  {id: 'low', color: '#F34E70', text: 'మీరు ఎంచుకున్న ప్రాంతంలో పబ్లిష్ చేయడానికి చాలా తక్కువ అవకాశాలు ఉన్నాయి'},
];

const displayName = value => typeof value?.name === 'string'
  ? value.name : value?.name?.en || value?.name?.te || '';

const pointOnArc = (percentage, radius = 104) => {
  const angle = Math.PI * (1 - percentage / 100);
  return {x: 160 + radius * Math.cos(angle), y: 150 - radius * Math.sin(angle)};
};

const arcPath = (from, to) => {
  const start = pointOnArc(from);
  const end = pointOnArc(to);
  return `M ${start.x} ${start.y} A 104 104 0 0 1 ${end.x} ${end.y}`;
};

const OpportunityGauge = ({rate}) => {
  const available = Number.isFinite(rate);
  const progress = useRef(new Animated.Value(0)).current;
  const [needlePercent, setNeedlePercent] = useState(0);

  useEffect(() => {
    if (!available) {
      setNeedlePercent(0);
      return undefined;
    }
    progress.setValue(0);
    const listenerId = progress.addListener(({value}) => setNeedlePercent(value));
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, rate)),
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      progress.stopAnimation();
      progress.removeListener(listenerId);
    };
  }, [available, progress, rate]);

  const needle = pointOnArc(needlePercent, 83);
  const dx = needle.x - 160;
  const dy = needle.y - 150;
  const length = Math.hypot(dx, dy) || 1;
  const offsetX = -dy / length * 9;
  const offsetY = dx / length * 9;
  return <View style={styles.gaugeWrap}>
    <Svg width={320} height={174} viewBox="0 0 320 174">
      <Path d={arcPath(0, 33.33)} stroke={LEVELS[2].color} strokeWidth={72} fill="none" />
      <Path d={arcPath(33.33, 66.66)} stroke={LEVELS[1].color} strokeWidth={72} fill="none" />
      <Path d={arcPath(66.66, 100)} stroke={LEVELS[0].color} strokeWidth={72} fill="none" />
      {available && <Polygon points={`${needle.x},${needle.y} ${160 + offsetX},${150 + offsetY} ${160 - offsetX},${150 - offsetY}`} fill="white" />}
      <Circle cx={160} cy={150} r={28} fill="white" />
    </Svg>
    <Text style={styles.gaugeValue}>{available ? `${rate}%` : '--'}</Text>
  </View>;
};

const Step2SelectionScreen = ({navigation, route}) => {
  const {locationData} = route.params || {};
  const villages = useMemo(() => locationData?.villages || (locationData?.village ? [locationData.village] : []), [locationData]);
  const districtId = locationData?.district?._id;
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    let active = true;
    if (!districtId || !villages.length) {
      return undefined;
    }
    setLoading(true);
    Promise.allSettled(villages.map(village => api.get('/news/submission-approval-rate', {
      params: {district_id: districtId, village_id: village._id}, timeout: 8000,
    }))).then(results => {
      if (!active) {
        return;
      }
      const nextRates = {};
      results.forEach((result, index) => {
        nextRates[villages[index]._id] = result.status === 'fulfilled' ? result.value.data : null;
      });
      setRates(nextRates);
    }).finally(() => {if (active) {setLoading(false);}});
    return () => {active = false;};
  }, [villages, districtId, attempt]);

  const selectedVillage = villages[selectedIndex];
  const selectedRate = rates[selectedVillage?._id];
  const rate = showDemo ? 80 : selectedRate?.approval_rate;
  const available = Number.isFinite(rate);
  const activeLevel = available ? (rate >= 70 ? 'high' : rate >= 40 ? 'medium' : 'low') : null;
  const requestFailed = !loading && selectedRate === null;

  return <View style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={[styles.header, {paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : insets.top + 14}]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
        <Icon name="arrow-left" size={26} color="#303030" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>లోకేషన్ ఎంచుకోండి</Text>
      <Text style={styles.stepIndicator}>2/4</Text>
    </View>

    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
      <View style={styles.locationRow}>
        <Icon name="map-marker-outline" size={29} color="#333" />
        <Text style={styles.locationName}>{displayName(selectedVillage) || displayName(locationData?.district)}</Text>
      </View>
      {villages.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.villageTabs}>
        {villages.map((village, index) => <TouchableOpacity key={village._id} style={[styles.villageTab, selectedIndex === index && styles.villageTabSelected]} onPress={() => {setSelectedIndex(index); setShowDemo(false);}}>
          <Text style={[styles.villageTabText, selectedIndex === index && styles.villageTabTextSelected]}>{displayName(village)}</Text>
        </TouchableOpacity>)}
      </ScrollView>}

      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#2386F6" /><Text style={styles.note}>సమాచారం తెస్తున్నాం...</Text></View> : <>
        <OpportunityGauge rate={rate} />
        <Text style={styles.gaugeLocation}>{displayName(selectedVillage) || displayName(locationData?.district)}</Text>
        <Text style={styles.gaugeSubtitle}>ప్రచురణకు ఉన్న అవకాశాలు</Text>
        {!available && <View style={styles.unavailable}>
          <Text style={styles.note}>{requestFailed ? 'ప్రస్తుతం అవకాశాల సమాచారం అందుబాటులో లేదు.' : 'శాతం చూపడానికి తగిన సమాచారం లేదు.'} వార్తను కొనసాగించవచ్చు.</Text>
          {requestFailed && <TouchableOpacity style={styles.retryButton} onPress={() => setAttempt(value => value + 1)}><Text style={styles.retry}>మళ్లీ ప్రయత్నించండి</Text></TouchableOpacity>}
          {__DEV__ && <TouchableOpacity style={styles.demoButton} onPress={() => setShowDemo(true)}><Text style={styles.demoButtonText}>80% నమూనా చూడండి</Text></TouchableOpacity>}
        </View>}
        <View style={styles.levels}>
          {LEVELS.map(level => <View key={level.id} style={[styles.levelRow, activeLevel === level.id && {borderColor: level.color, backgroundColor: `${level.color}14`}]}>
            <View style={[styles.levelDot, {backgroundColor: level.color}]} />
            <Text style={[styles.levelText, activeLevel && activeLevel !== level.id && styles.levelTextInactive]}>{level.text}</Text>
          </View>)}
        </View>
        {showDemo ? <View style={styles.unavailable}>
          <Text style={styles.note}>DEMO · ఇది నమూనా మాత్రమే, నిజమైన అవకాశాల శాతం కాదు.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setShowDemo(false)}><Text style={styles.retry}>వాస్తవ డేటా చూడండి</Text></TouchableOpacity>
        </View> : available && <Text style={styles.note}>గత 30 రోజులలో {selectedRate.approved}/{selectedRate.sample_size} వార్తలు ఆమోదం పొందాయి{selectedRate.scope === 'district' ? ' (జిల్లా ఆధారంగా)' : ''}. ఇది కొత్త వార్త ఆమోదానికి హామీ కాదు.</Text>}
      </>}
    </ScrollView>
    <TouchableOpacity style={[styles.nextButton, {paddingBottom: Math.max(insets.bottom, 14)}]} onPress={() => navigation.navigate('NewsSubmissionStep3', {locationData})} activeOpacity={0.8}>
      <Text style={styles.nextText}>తరువాత</Text><Icon name="arrow-right" size={27} color="#FFF" />
    </TouchableOpacity>
  </View>;
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F6F6F6'},
  header: {backgroundColor: '#FFF', paddingHorizontal: 26, paddingBottom: 25, flexDirection: 'row', alignItems: 'center'},
  backButton: {marginRight: 26, padding: 4},
  headerTitle: {flex: 1, fontSize: 22, color: '#303030'},
  stepIndicator: {fontSize: 24, color: '#111'},
  content: {flex: 1},
  contentInner: {paddingBottom: 100},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 33, marginHorizontal: 29},
  locationName: {fontSize: 22, color: '#151515', borderBottomWidth: 2, borderStyle: 'dotted', borderBottomColor: '#333', paddingBottom: 5},
  villageTabs: {marginTop: 16, paddingHorizontal: 28, maxHeight: 50},
  villageTab: {borderRadius: 18, borderWidth: 1, borderColor: '#D2D8DC', paddingHorizontal: 14, paddingVertical: 8, marginRight: 8},
  villageTabSelected: {borderColor: '#2386F6', backgroundColor: '#E9F3FF'},
  villageTabText: {fontSize: 14, color: '#555'},
  villageTabTextSelected: {color: '#1673D3', fontWeight: '700'},
  loading: {alignItems: 'center', paddingTop: 80},
  gaugeWrap: {width: 320, height: 174, alignSelf: 'center', marginTop: 32, alignItems: 'center'},
  gaugeValue: {position: 'absolute', bottom: 10, fontSize: 16, color: '#737373'},
  gaugeLocation: {fontSize: 23, color: '#323232', textAlign: 'center'},
  gaugeSubtitle: {fontSize: 19, color: '#B0B0B0', textAlign: 'center', marginTop: 20},
  levels: {marginTop: 36, marginHorizontal: 20},
  levelRow: {minHeight: 76, borderWidth: 1, borderColor: 'transparent', borderRadius: 5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, paddingVertical: 10, marginBottom: 10},
  levelDot: {width: 29, height: 29, borderRadius: 15, marginRight: 19},
  levelText: {flex: 1, fontSize: 17, lineHeight: 26, color: '#343434'},
  levelTextInactive: {color: '#AFAFAF'},
  note: {fontSize: 13, lineHeight: 20, color: '#757575', textAlign: 'center', marginHorizontal: 28, marginTop: 12},
  unavailable: {alignItems: 'center', marginTop: 14},
  retryButton: {paddingHorizontal: 18, paddingVertical: 10, marginTop: 4},
  demoButton: {borderWidth: 1, borderColor: '#2386F6', borderRadius: 7, paddingHorizontal: 18, paddingVertical: 10, marginTop: 5},
  demoButtonText: {fontSize: 14, fontWeight: '700', color: '#2386F6'},
  retry: {fontSize: 14, fontWeight: '700', color: '#2386F6', marginTop: 10},
  nextButton: {backgroundColor: '#2386F6', minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 14},
  nextText: {color: '#FFF', fontSize: 19, fontWeight: '700'},
});

export default Step2SelectionScreen;
