import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  Linking 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ContactUsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();

  const handleSupportEmailPress = () => {
    Linking.openURL('mailto:support@rapidnews.in');
  };

  const handleGrievanceEmailPress = () => {
    Linking.openURL('mailto:grievance@rapidnewsnetwork.in');
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Contact Details Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Details</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          For any assistance, feedback, or general queries, you can reach us at:
        </Text>
        
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleSupportEmailPress} 
          style={[styles.contactBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F8FA' }]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(29, 161, 242, 0.1)' }]}>
            <Icon name="email" size={24} color="#1DA1F2" />
          </View>
          <Text style={[styles.contactText, { color: theme.text }]}>support@rapidnews.in</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Grievance Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Grievance</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          If you have any complaints, concerns, or issues related to content or services, please contact us through the email provided below. We are committed to addressing your concerns in a timely manner.
        </Text>
        
        <View style={styles.grievanceInfo}>
          <Text style={[styles.grievanceLabel, { color: theme.textSecondary }]}>Grievance Officer Contact:</Text>
          <Text style={[styles.grievanceName, { color: theme.text }]}>Mr Lakshman K</Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleGrievanceEmailPress} 
          style={[styles.contactBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF0F0' }]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Icon name="alert-circle-outline" size={24} color="#FF3B30" />
          </View>
          <Text style={[styles.contactText, { color: theme.text }]}>grievance@rapidnewsnetwork.in</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Address Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Address</Text>
        
        <View style={[styles.addressCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E8EAED' }]}>
          <View style={styles.addressIconWrapper}>
            <Icon name="map-marker-radius" size={28} color="#FF9500" />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={[styles.addressTitle, { color: theme.text }]}>Rapid News Network</Text>
            <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
              40-1-70, 3rd Floor, Opp Eenadu,{'\n'}
              Bandar Road, Benz Circle,{'\n'}
              Vijayawada, NTR District,{'\n'}
              Andhra Pradesh - 520010
            </Text>
          </View>
        </View>

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 12,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  grievanceInfo: {
    marginBottom: 12,
  },
  grievanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  grievanceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  addressCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  addressIconWrapper: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  addressLine: {
    fontSize: 15,
    lineHeight: 24,
  }
});

export default ContactUsScreen;