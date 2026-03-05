import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ToastAndroid, Platform, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { fonts } from '../config/theme';
import api from '../utils/api';
import { applogo } from '../assets'; 

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HALF_HEIGHT = SCREEN_HEIGHT / 2;

const SurveyCard = ({ survey }) => {
  const [voted, setVoted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  // Local state to handle optimistic updates when a user votes
  const [localOptions, setLocalOptions] = useState([]);
  const [localTotalVotes, setLocalTotalVotes] = useState(0);

  useEffect(() => {
    // Initialize the local state when the survey prop changes
    if (survey) {
      setLocalOptions(survey.options || []);
      setLocalTotalVotes(survey.totalVotes || 0);
    }
  }, [survey]);

  const handleVote = async (index) => {
    if (voted) return; // Prevent multiple votes
    
    // 1. Optimistically update local state for instant UI feedback
    setSelectedIndex(index);
    setVoted(true);

    const updatedOptions = [...localOptions];
    updatedOptions[index] = {
      ...updatedOptions[index],
      votes: (updatedOptions[index].votes || 0) + 1
    };
    
    setLocalOptions(updatedOptions);
    setLocalTotalVotes(localTotalVotes + 1);

    // 2. Show Toast message
    if (Platform.OS === 'android') {
      ToastAndroid.show("Thank you for voting!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Success", "Thank you for voting!");
    }

    // 3. Make API call in the background
    try {
      await api.post(`surveys/${survey.id}/vote`, { option_index: index });
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Gradient Background: Shifts diagonally for depth */}
      <LinearGradient 
        colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={styles.background}
      >
        
        {/* Top Section: Logo and Question */}
        <View style={styles.topHalf}>
          {/* Logo positioned at the top */}
          <Image source={applogo} style={styles.logo} resizeMode="contain" />
          
          <View style={styles.glassCardTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TRENDING POLL</Text>
            </View>
            <Text style={styles.question}>{survey.question}</Text>
          </View>
        </View>

        {/* Bottom Section: Voting Options */}
        <View style={styles.bottomHalf}>
          <View style={styles.glassCardBottom}>
            <View style={styles.optionsList}>
              {localOptions.map((option, index) => {
                const isSelected = selectedIndex === index;
                const votes = option.votes || 0;
                
                // Calculate dynamic percentage based on real votes
                const percentage = localTotalVotes > 0 ? Math.round((votes / localTotalVotes) * 100) : 0;
                const fillWidth = voted ? `${percentage}%` : '0%';

                return (
                  <TouchableOpacity 
                    key={option._id || index} 
                    onPress={() => handleVote(index)}
                    style={[styles.optionBtn, isSelected && styles.selectedBtn]}
                    activeOpacity={0.7}
                  >
                    {voted && <View style={[styles.progress, { width: fillWidth }]} />}
                    <View style={styles.optionInner}>
                      <Text style={styles.optionText}>{option.text}</Text>
                      {voted && <Text style={styles.percentText}>{fillWidth}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: SCREEN_HEIGHT, width: SCREEN_WIDTH },
  background: { flex: 1 },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginTop: 50, // Top margin for safe area/branding
    marginBottom: 'auto', 
  },
  topHalf: {
    height: HALF_HEIGHT,
    paddingHorizontal: 20,
    justifyContent: 'flex-end', // Aligns the card just above the flip fold
  },
  bottomHalf: {
    height: HALF_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 0, // Options start immediately at the fold
  },
  // Modern Glassmorphism: Semi-transparency and subtle borders
  glassCardTop: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  glassCardBottom: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 25,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badge: {
    backgroundColor: '#00d2ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 15,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.5 },
  question: {
    fontSize: 24,
    color: '#fff',
    fontFamily: fonts.bold,
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', // Subtle shadow for readability
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  optionsList: { gap: 14 },
  optionBtn: {
    height: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  selectedBtn: { 
    borderColor: '#00d2ff', 
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    borderWidth: 2 
  },
  progress: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 210, 255, 0.35)' 
  },
  optionInner: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 1 },
  optionText: { color: '#fff', fontSize: 17, fontFamily: fonts.medium },
  percentText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 }
});

export default SurveyCard;