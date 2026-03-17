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

// --- Animated Progress Bar Component ---
const AnimatedProgressBar = ({ percentage, isSelected }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800, 
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <Animated.View
      style={[
        styles.progressFill,
        isSelected ? styles.progressFillSelected : styles.progressFillUnselected,
        {
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
};

// --- Main Survey Component ---
const SurveyCard = ({ survey, onAutoNext }) => {
  const dispatch = useDispatch();
  
  const [loadingOptionIndex, setLoadingOptionIndex] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(
    survey.voted_option_id !== undefined ? survey.voted_option_id : null
  );
  
  // Flag to hide results if the API only returns a "Vote recorded" message without stats
  const [hideResults, setHideResults] = useState(false);

  const hasVoted = survey.user_voted || selectedOptionIndex !== null;
  const totalVotes = survey.total_votes || survey.totalVotes || 0;

  const handleVote = async (index) => {
    if (hasVoted || loadingOptionIndex !== null) return;
    setLoadingOptionIndex(index);

    try {
      const resp = await dispatch(submitSurveyVote({ 
        surveyId: survey.id || survey._id, 
        optionId: index 
      })).unwrap();

      setSelectedOptionIndex(index);
      
      // Check if the API ONLY returned a message (no options array, no total_votes)
      const isMessageOnly = resp.data?.message === "Vote recorded" && !resp.data?.options && typeof resp.data?.total_votes === 'undefined';

      if (isMessageOnly) {
        setHideResults(true); // Suppress the progress bar animations

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

      } else {
        // API returned results. Let the user admire the stats for 2 seconds.
        setTimeout(() => {
          if (onAutoNext) onAutoNext();
        }, 2000); 
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
        <Text style={styles.questionText}>{survey.question}</Text>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {survey.options?.map((option, index) => {
            const isSelected = selectedOptionIndex === index || survey.voted_option_id === index;
            const isVoting = loadingOptionIndex === index;
            
            // Should we show the results/bars?
            const showBars = hasVoted && !hideResults;

            // Optimistic Calculation (Will be overridden by Redux if the API returned exact numbers)
            let currentOptionVotes = option.votes || 0;
            let currentTotalVotes = totalVotes;
            
            if (selectedOptionIndex === index && !survey.user_voted) {
              currentOptionVotes += 1;
              currentTotalVotes += 1;
            }

            const percentage = currentTotalVotes > 0 
              ? Math.round((currentOptionVotes / currentTotalVotes) * 100) 
              : 0;

            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionWrapper,
                  !hasVoted && styles.optionWrapperUnvoted,
                  hasVoted && styles.optionWrapperVoted
                ]}
                onPress={() => handleVote(index)}
                disabled={hasVoted || loadingOptionIndex !== null}
                activeOpacity={0.6}
              >
                {/* Background Fill Animation */}
                {showBars && (
                  <AnimatedProgressBar 
                    percentage={percentage} 
                    isSelected={isSelected} 
                  />
                )}

                {/* Foreground Content */}
                <View style={styles.optionContent}>
                  <View style={styles.optionTextRow}>
                    {isVoting && (
                      <ActivityIndicator size="small" color="#1DA1F2" style={{marginRight: 8}} />
                    )}
                    
                    {/* Checkmark next to text for Message-Only success */}
                    {!showBars && hasVoted && isSelected && (
                       <Icon name="check-circle" size={18} color="#1DA1F2" style={styles.checkIconInline} />
                    )}

                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.text}
                    </Text>
                  </View>

                  {/* Percentage & Checkmark (Only shown if results exist) */}
                  {showBars && (
                    <View style={styles.resultGroup}>
                      <Text style={[
                        styles.percentageText,
                        isSelected && styles.percentageTextSelected
                      ]}>
                        {percentage}%
                      </Text>
                      {isSelected && (
                        <Icon name="check-circle" size={18} color="#1DA1F2" style={styles.checkIcon} />
                      )}
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
            {!hasVoted ? 'Tap an option to vote' : (hideResults ? 'Thanks for voting!' : `${currentTotalVotes || totalVotes} votes`)}
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
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 450, 
    backgroundColor: '#FFFFFF',
    borderRadius: 24, 
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)', 
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
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionWrapperUnvoted: {
    borderWidth: 1.5,
    borderColor: '#C4CFD6', 
  },
  optionWrapperVoted: {
    borderWidth: 0,
    backgroundColor: '#F7F9FA',
  },
  progressFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  progressFillSelected: {
    backgroundColor: 'rgba(29, 161, 242, 0.15)', 
  },
  progressFillUnselected: {
    backgroundColor: '#EBEFF2', 
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  optionTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#0F1419',
    fontWeight: '600',
  },
  optionTextSelected: {
    fontWeight: '800',
  },
  resultGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  checkIcon: {
    marginLeft: 4,
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