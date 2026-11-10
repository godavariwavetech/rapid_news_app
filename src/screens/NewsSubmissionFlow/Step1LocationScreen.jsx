import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Keyboard, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../utils/api';

const nameOf = location => typeof location?.name === 'string'
  ? location.name : location?.name?.en || location?.name?.te || '';

const Step1LocationScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const trimmedQuery = query.trim();

  // Reporters are assigned to one district — village search should only
  // surface villages within it. `location.district_id` is set right after
  // login; `district_id` (legacy, object-shaped) only after a profile fetch.
  const reporterProfile = useSelector(state => state.auth.reporter?.reporter_profile);
  const reporterDistrictId =
    reporterProfile?.location?.district_id ||
    reporterProfile?.district_id?._id ||
    reporterProfile?.district_id ||
    null;

  useEffect(() => {
    let active = true;
    setResults([]);
    setError(false);
    if (trimmedQuery.length < 2) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const params = {q: trimmedQuery};
      if (reporterDistrictId) {
        params.district_id = reporterDistrictId;
      }
      api.get('/location/search', {params, skipAuth: true})
        .then(response => {
          if (active) {
            setResults(Array.isArray(response.data) ? response.data.filter(item => item?.state?._id && item?.district?._id && item?.village?._id) : []);
          }
        })
        .catch(() => {if (active) {setError(true);}})
        .finally(() => {if (active) {setLoading(false);}});
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmedQuery, reporterDistrictId]);

  const selectLocation = result => {
    Keyboard.dismiss();
    navigation.navigate('NewsSubmissionStep2', {
      locationData: {state: result.state, district: result.district, villages: [result.village]},
    });
  };

  return <View style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={[styles.header, {paddingTop: insets.top + 16}]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
        <Icon name="arrow-left" size={27} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>లోకేషన్ ఎంచుకోండి</Text>
      <Text style={styles.stepIndicator}>1/4</Text>
    </View>

    <View style={styles.body}>
      <View style={styles.prompt}>
        <Icon name="map-marker-radius-outline" size={30} color="#3A3A3A" />
        <Text style={styles.promptText}>న్యూస్ స్థానాన్ని ఎంచుకోండి</Text>
      </View>

      <View style={styles.searchBox}>
        <Icon name="magnify" size={26} color="#909090" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholder="Search for village/town/city name..."
          placeholderTextColor="#858585"
          returnKeyType="search"
          accessibilityLabel="Search news location"
        />
        {!!query && <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search"><Icon name="close" size={22} color="#858585" /></TouchableOpacity>}
      </View>

      {loading && <ActivityIndicator style={styles.loading} color="#2386F6" />}
      {error && <Text style={styles.message}>లొకేషన్లు లోడ్ కాలేదు. మళ్లీ వెతకండి.</Text>}
      {!loading && !error && trimmedQuery.length >= 2 && results.length === 0 && <Text style={styles.message}>ఈ పేరుతో లొకేషన్ దొరకలేదు.</Text>}

      <FlatList
        data={results}
        keyExtractor={item => String(item.village._id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.results}
        renderItem={({item}) => <TouchableOpacity style={styles.resultRow} onPress={() => selectLocation(item)}>
          <Icon name="map-marker-outline" size={23} color="#2386F6" />
          <View style={styles.resultNames}>
            <Text style={styles.resultName}>{nameOf(item.village)}</Text>
            <Text style={styles.resultDetail}>{nameOf(item.district)}, {nameOf(item.state)}{item.pincode ? ` · ${item.pincode}` : ''}</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#999" />
        </TouchableOpacity>}
      />
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F6F6F6'},
  header: {backgroundColor: '#FFF', paddingHorizontal: 26, paddingBottom: 25, flexDirection: 'row', alignItems: 'center'},
  backButton: {marginRight: 26, padding: 4},
  headerTitle: {flex: 1, fontSize: 22, color: '#303030'},
  stepIndicator: {fontSize: 24, color: '#111'},
  body: {flex: 1, paddingHorizontal: 20},
  prompt: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 30, marginBottom: 26},
  promptText: {fontSize: 21, color: '#333'},
  searchBox: {backgroundColor: '#FFF', minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15},
  input: {flex: 1, fontSize: 17, color: '#222', paddingVertical: 10},
  loading: {marginTop: 26},
  message: {fontSize: 15, color: '#777', marginTop: 22, textAlign: 'center'},
  results: {paddingTop: 15, paddingBottom: 20},
  resultRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E7E7E7'},
  resultNames: {flex: 1},
  resultName: {fontSize: 17, color: '#222', fontWeight: '600'},
  resultDetail: {fontSize: 13, color: '#777', marginTop: 3},
});

export default Step1LocationScreen;
