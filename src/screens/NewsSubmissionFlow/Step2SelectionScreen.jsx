import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step2SelectionScreen = ({navigation, route}) => {
  const { locationData } = route.params || {};
  const insets = useSafeAreaInsets();
  
  // State for the calculated reach
  const [calculatedReach, setCalculatedReach] = useState(null);
  const [loading, setLoading] = useState(true);

  // Construct location string from data
  const locationString = locationData 
    ? `${locationData.village.name.en}, ${locationData.district.name.en}` 
    : 'Unknown Location';

  // Telugu Options as per your request
  const reachOptions = [
    {
      id: 'high',
      label: 'ఎక్కువ అవకాశాలు', // High Chances
      range: '80-100%',
      description: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి ఎక్కువ అవకాశాలు ఉన్నాయి',
      color: '#4CAF50', // Green
      barWidth: '90%'
    },
    {
      id: 'medium',
      label: 'మధ్యస్థ అవకాశాలు', // Medium Chances
      range: '50-80%',
      description: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి మధ్యస్థంగా అవకాశాలు ఉన్నాయి',
      color: '#FF9800', // Orange
      barWidth: '65%'
    },
    {
      id: 'low',
      label: 'తక్కువ అవకాశాలు', // Low Chances
      range: '< 50%',
      description: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి చాలా తక్కువ అవకాశాలు ఉన్నాయి',
      color: '#F44336', // Red
      barWidth: '40%'
    },
  ];

  useEffect(() => {
    const calculateReach = async () => {
      setLoading(true);
      // Simulate calculation/API call
      setTimeout(() => {
        // Mock Logic: defaulting to 'medium'
        setCalculatedReach('medium'); 
        setLoading(false);
      }, 1000);
    };

    if (locationData) {
      calculateReach();
    }
  }, [locationData]);

  const activeOption = reachOptions.find(o => o.id === calculatedReach) || reachOptions[1];

  const handleNext = () => {
    navigation.navigate('NewsSubmissionStep3', { 
      locationData, 
      reachData: activeOption 
    });
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
        {/* Telugu Header Title */}
        <Text style={styles.headerTitle}>లొకేషన్ ఎంచుకోండి</Text>
        <Text style={styles.stepIndicator}>2 / 4</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Location Display */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconContainer}>
            <Icon name="map-marker-radius" size={28} color="#2196F3" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Selected Location</Text>
            <Text style={styles.locationName}>{locationString}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        ) : (
          <>
            {/* Chart Section */}
            <View style={styles.chartContainer}>
              {/* Using location name as title as per previous design */}
              <Text style={styles.chartTitle}>{locationString}</Text>
              {/* Telugu Subtitle */}
              <Text style={styles.chartSubtitle}>ప్రమాణానికి ఉన్న అవకాశాలు</Text>
              
              <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: activeOption.barWidth, 
                        backgroundColor: activeOption.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.barValue, { color: activeOption.color }]}>
                  {activeOption.range}
                </Text>
              </View>
            </View>

            {/* Reach Options List */}
            <View style={styles.optionsContainer}>
              {reachOptions.map((option) => {
                const isActive = option.id === activeOption.id;
                
                return (
                  <View
                    key={option.id}
                    style={[
                      styles.optionCard,
                      isActive ? styles.optionCardActive : styles.optionCardDisabled,
                      { borderColor: isActive ? option.color : '#F0F0F0' }
                    ]}
                  >
                    {/* Dot Indicator */}
                    <View 
                      style={[
                        styles.optionDot, 
                        { backgroundColor: isActive ? option.color : '#D0D0D0' }
                      ]} 
                    />
                    
                    {/* Text Content */}
                    <View style={styles.optionContent}>
                      {/* Using the Telugu Description provided */}
                      <Text style={[
                        styles.optionDescription,
                        !isActive && styles.disabledText
                      ]}>
                        {option.description}
                      </Text>
                    </View>

                    {/* Active Checkmark */}
                    {isActive && (
                      <Icon name="check-circle" size={24} color={option.color} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { marginBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="arrow-right" size={20} color="#FFF" />
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    fontSize: 16,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
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
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  optionCardActive: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    opacity: 1,
  },
  optionCardDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.5,
    borderWidth: 1,
  },
  disabledText: {
    color: '#999',
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    marginTop: 4,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    backgroundColor: '#FFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Step2SelectionScreen;