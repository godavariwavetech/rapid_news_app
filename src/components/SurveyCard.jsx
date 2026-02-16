// src/components/SurveyCard.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../config/theme';
import networkCall from '../utils/networkCall';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SurveyCard = ({ survey }) => {
  const [voted, setVoted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleVote = async (index) => {
    if (voted) return;
    setSelectedIndex(index);
    setVoted(true);

    try {
      // POST {{base_uri}}/surveys/{surveyId}/vote
      await networkCall(`surveys/${survey.id}/vote`, 'POST', {
        option_index: index
      });
    } catch (error) {
      console.error("Vote failed", error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#141E30', '#243B55']} style={styles.background}>
        
        {/* Safe Zone: This ensures content stays away from the middle "cut" line */}
        <View style={styles.contentWrapper}>
          
          <View style={styles.glassCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PUBLIC OPINION</Text>
            </View>

            <Text style={styles.question}>{survey.question}</Text>

            <View style={styles.optionsList}>
              {survey.options.map((option, index) => {
                const isSelected = selectedIndex === index;
                const fillWidth = voted ? (isSelected ? '80%' : '20%') : '0%';

                return (
                  <TouchableOpacity 
                    key={option._id} 
                    onPress={() => handleVote(index)}
                    style={[styles.optionBtn, isSelected && styles.selectedBtn]}
                    activeOpacity={0.8}
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
  background: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentWrapper: {
    width: '90%',
    height: '80%', // Keeps content away from the very top/bottom edges
    justifyContent: 'center', // Keeps content centered away from the middle "cut" line
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    backgroundColor: '#00d2ff',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 20,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold, letterSpacing: 2 },
  question: {
    fontSize: 24,
    color: '#fff',
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsList: { gap: 15 },
  optionBtn: {
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  selectedBtn: { borderColor: '#00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.1)' },
  progress: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 210, 255, 0.2)' },
  optionInner: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  optionText: { color: '#fff', fontSize: 16, fontFamily: fonts.medium },
  percentText: { color: '#00d2ff', fontFamily: fonts.bold }
});

export default SurveyCard;