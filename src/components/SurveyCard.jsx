import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated,
  Dimensions,
  ToastAndroid,
  Platform,
  Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient'; 
import { submitSurveyVote } from '../redux/reducers/news';

const { width } = Dimensions.get('window');

// --- Main Survey Component ---
const SurveyCard = ({ survey, onAutoNext }) => {
  const dispatch = useDispatch();
  
  // Extract nested data if it exists (handles both flat and nested { data: {...} } structures)
  const surveyData = survey.data || survey;
  
  const [loadingOptionIndex, setLoadingOptionIndex] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(
    surveyData.voted_option_id !== undefined ? surveyData.voted_option_id : null
  );
  
  // Flag to hide results if the API only returns a "Vote recorded" message without stats
  const [hideResults, setHideResults] = useState(false);
  
  // State to hold results from API response
  const [apiResults, setApiResults] = useState(null);

  // Check both 'has_voted' (new API) and 'user_voted' (fallback)
  const hasVoted = surveyData.has_voted || surveyData.user_voted || selectedOptionIndex !== null;
  
  // Use apiResults if available, otherwise surveyData
  const activeData = apiResults || surveyData;
  
  // Consolidate total votes calculation
  const baseTotalVotes = Number(activeData.total_votes || activeData.totalVotes || 0);

  // Optimistic total votes: increment if user just voted but surveyData hasn't updated yet and no apiResults
  const displayTotalVotes = apiResults 
    ? baseTotalVotes 
    : (selectedOptionIndex !== null && !surveyData.has_voted && !surveyData.user_voted)
      ? baseTotalVotes + 1
      : baseTotalVotes;

  const handleVote = async (index) => {
    if (hasVoted || loadingOptionIndex !== null) return;
    setLoadingOptionIndex(index);

    try {
      const resp = await dispatch(submitSurveyVote({ 
        surveyId: surveyData._id || surveyData.id, 
        optionId: index 
      })).unwrap();

      setSelectedOptionIndex(index);
      
      // Access from resp.data because the thunk returns { surveyId, optionId, data }
      const surveyResponse = resp.data;
      const shouldShowResults = surveyResponse?.show_results && surveyResponse?.results;

      if (shouldShowResults) {
        setApiResults(surveyResponse.results);
        // Let the user admire the stats for 2 seconds.
        setTimeout(() => {
          if (onAutoNext) onAutoNext();
        }, 2000); 
      } else {
        setHideResults(true); 

        // Show Toast/Alert
        if (Platform.OS === 'android') {
          ToastAndroid.show("ఓటు నమోదు చేయబడింది (Vote recorded)", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Vote recorded");
        }

        // Quick transition since there are no results to look at
        setTimeout(() => {
          if (onAutoNext) onAutoNext();
        }, 500); 
      }

    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setLoadingOptionIndex(null);
    }
  };

  return (
    <LinearGradient 
      colors={['#E6F0F9', '#F4F7FA', '#FFFFFF']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={styles.container}
    >
      <View style={styles.card}>
        
        {/* Header: Poll Icon & Label */}
        <View style={styles.headerRow}>
          <View style={styles.iconWrapper}>
            <Icon name="poll" size={20} color="#1DA1F2" />
          </View>
          <Text style={styles.headerLabel}>Today's Poll</Text>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{activeData.question}</Text>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {activeData.options?.map((option, index) => {
            const isSelected = selectedOptionIndex === index || surveyData.voted_option_id === index;
            const isVoting = loadingOptionIndex === index;
            
            // Should we show the results?
            const showResults = hasVoted && !hideResults;

            // Optimistic Calculation
            let currentOptionVotes = Number(option.votes || 0);
            
            if (!apiResults && selectedOptionIndex === index && !surveyData.has_voted && !surveyData.user_voted) {
              currentOptionVotes += 1;
            }

            const percentage = displayTotalVotes > 0 
              ? Math.round((currentOptionVotes / displayTotalVotes) * 100) 
              : 0;

            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionWrapper,
                  !hasVoted && styles.optionWrapperUnvoted,
                  hasVoted && styles.optionWrapperVoted,
                  isSelected && styles.optionWrapperSelected
                ]}
                onPress={() => handleVote(index)}
                disabled={hasVoted || loadingOptionIndex !== null}
                activeOpacity={0.6}
              >
                {/* Content */}
                <View style={styles.optionContent}>
                  <View style={styles.optionTextRow}>
                    {isVoting && (
                      <ActivityIndicator size="small" color="#1DA1F2" style={{marginRight: 8}} />
                    )}
                    
                    {/* Checkmark for Voted Item */}
                    {hasVoted && isSelected && (
                       <Icon name="check-circle" size={18} color="#1DA1F2" style={styles.checkIconInline} />
                    )}

                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.text}
                    </Text>
                  </View>

                  {/* Percentage (Only shown if results exist) */}
                  {showResults && (
                    <View style={styles.resultGroup}>
                      <Text style={[
                        styles.percentageText,
                        isSelected && styles.percentageTextSelected
                      ]}>
                        {percentage}%
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.totalVotesText}>
            {!hasVoted ? 'Tap an option to vote' : (hideResults ? 'Thanks for voting!' : `${displayTotalVotes} votes`)}
          </Text>
        </View>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  iconWrapper: {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
    padding: 6,
    borderRadius: 12,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1DA1F2', 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F1419', 
    marginBottom: 24,
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  optionWrapper: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionWrapperUnvoted: {
    borderWidth: 1.5,
    borderColor: '#C4CFD6', 
  },
  optionWrapperVoted: {
    borderWidth: 1.5,
    borderColor: '#EFF3F4',
    backgroundColor: '#F7F9FA',
  },
  optionWrapperSelected: {
    borderColor: '#1DA1F2',
    backgroundColor: 'rgba(29, 161, 242, 0.05)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    textAlign: 'left',
  },
  optionText: {
    fontSize: 16,
    color: '#0F1419',
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1DA1F2',
    fontWeight: '800',
  },
  resultGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#536471',
  },
  percentageTextSelected: {
    color: '#1DA1F2',
    fontWeight: '800',
  },
  checkIconInline: {
    marginRight: 8,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFF3F4',
  },
  totalVotesText: {
    color: '#536471',
    fontSize: 14,
    fontWeight: '600',
  }
});

export default SurveyCard;