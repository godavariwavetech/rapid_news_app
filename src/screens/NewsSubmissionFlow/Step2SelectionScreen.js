import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step2SelectionScreen = ({navigation, route}) => {
  const {location} = route.params;
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    {
      id: 'good',
      color: '#4CAF50',
      text: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి ఎక్కువ అవకాశాలు ఉన్నాయి',
      type: 'success',
    },
    {
      id: 'medium',
      color: '#FF9800',
      text: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి మధ్యస్థంగా అవకాశాలు ఉన్నాయి',
      type: 'warning',
    },
    {
      id: 'low',
      color: '#F44336',
      text: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి చాలా తక్కువ అవకాశాలు ఉన్నాయి',
      type: 'danger',
    },
  ];

  const handleNext = () => {
    if (selectedOption) {
      navigation.navigate('NewsSubmissionStep3', {location, selectedOption});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>లొకేషన్ ఎంచుకోండి</Text>
        <Text style={styles.stepIndicator}>2 / 4</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View style={styles.locationSection}>
          <Icon name="map-marker" size={24} color="#666" />
          <Text style={styles.locationName}>{location}</Text>
        </View>

        {/* Gauge Chart Placeholder */}
        <View style={styles.chartContainer}>
          <View style={styles.gaugeChart}>
            {/* This would be a real gauge chart component */}
            <Text style={styles.gaugeText}>80%</Text>
          </View>
          <Text style={styles.chartTitle}>{location}</Text>
          <Text style={styles.chartSubtitle}>ప్రమాణానికి ఉన్న అవకాశాలు</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedOption === option.id && styles.optionCardSelected,
                {borderColor: option.color},
              ]}
              onPress={() => setSelectedOption(option.id)}
              activeOpacity={0.7}>
              <View style={[styles.optionDot, {backgroundColor: option.color}]} />
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedOption}
          activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stepIndicator: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  gaugeChart: {
    width: 200,
    height: 120,
    backgroundColor: '#F5F6F8',
    borderRadius: 100,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    marginBottom: 16,
  },
  gaugeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8EAED',
    marginBottom: 12,
    gap: 12,
  },
  optionCardSelected: {
    backgroundColor: '#F5FFF5',
  },
  optionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Step2SelectionScreen;
