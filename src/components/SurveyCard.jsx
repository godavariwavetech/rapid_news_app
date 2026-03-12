import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { submitSurveyVote } from '../redux/reducers/news'; // Import the new thunk

const SurveyCard = ({ survey, onAutoNext }) => {
  const dispatch = useDispatch();
  
  // Track local loading state for the specific option being pressed
  const [loadingOptionId, setLoadingOptionId] = useState(null);
  
  // Local state to instantly show selection before Redux completely syncs
  const [selectedOption, setSelectedOption] = useState(survey.voted_option_id || null);

  const handleVote = async (optionId) => {
    // Prevent double voting or voting if already processing
    if (selectedOption || survey.user_voted || loadingOptionId) return;

    setLoadingOptionId(optionId);

    try {
      // Dispatch the Redux action and unwrap to catch success/failure
      const resp = await dispatch(submitSurveyVote({ 
        surveyId: survey.id, 
        optionId: optionId 
      }))

      console.log(resp,">>>>>>>>>>>>>>>>>>>>Responseeeeeeeeemmm survey");

      setSelectedOption(optionId);
      
      // Successfully voted! Wait a brief moment for the user to see their selection, then auto-swipe
      setTimeout(() => {
        if (onAutoNext) {
          onAutoNext();
        }
      }, 500); 

    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setLoadingOptionId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{survey.question}</Text>
      
      <View style={styles.optionsContainer}>
        {survey.options?.map((option) => {
          const isSelected = selectedOption === option._id || survey.voted_option_id === option._id;
          const isVoting = loadingOptionId === option._id;
          
          return (
            <TouchableOpacity 
              key={option._id}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOptionButton
              ]}
              onPress={() => handleVote(option._id)}
              disabled={!!selectedOption || survey.user_voted || !!loadingOptionId}
              activeOpacity={0.7}
            >
              {isVoting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText
                ]}>
                  {option.text}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Optional: Show total votes */}
      <Text style={styles.totalVotesText}>
        Total Votes: {survey.totalVotes || 0}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF', // Adjust based on your theme
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 15, // Adds space between buttons
  },
  optionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#4dabf5', // Highlight color
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalVotesText: {
    marginTop: 30,
    textAlign: 'center',
    color: '#888888',
    fontSize: 14,
  }
});

export default SurveyCard;