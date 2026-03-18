import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const AboutUsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8, backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Logo / Title Area */}
        <View style={styles.logoContainer}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F0F8FF' }]}>
            <Icon name="newspaper-variant-multiple-outline" size={48} color="#1DA1F2" />
          </View>
          <Text style={[styles.mainTitle, { color: theme.text }]}>Rapid News</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Content */}
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Rapid News is a modern digital news platform focused on delivering quick, reliable, and mobile-friendly content to users across India. Our goal is to keep audiences informed with short and clear news updates that can be easily consumed anytime, anywhere.
        </Text>

        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We specialize in providing real-time news, local updates, trending stories, and important information in regional languages. By combining technology with content, Rapid News aims to build a strong mobile-first media platform that connects people with the latest happenings around them.
        </Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  }
});

export default AboutUsScreen;