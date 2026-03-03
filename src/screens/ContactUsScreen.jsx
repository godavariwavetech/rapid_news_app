import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const ContactUsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? theme.background : '#808080' }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? theme.background : "#808080"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : '#808080', paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>సంప్రదించండి</Text>
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: isDarkMode ? '#1A1A1A' : '#333333' }]}>
        <Text style={styles.heroTitle}>Contact Us</Text>
      </View>

      {/* Content - Scrollable */}
      <View style={[styles.whiteContent, { backgroundColor: theme.background }]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Contact Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Details</Text>
            </View>

            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              For any support / any other queries write to
            </Text>

            <TouchableOpacity
              style={[styles.emailRow, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}
              onPress={() => handleEmailPress('support@sitinews.com')}
              activeOpacity={0.7}>
              <Icon name="email-outline" size={22} color={theme.textSecondary} />
              <View style={styles.emailContent}>
                <Text style={[styles.emailLabel, { color: theme.text }]}>E-mail:</Text>
                <Text style={[styles.emailAddress, { color: theme.accentBlue }]}>support@sitinews.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Grievance Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Grievance</Text>
            </View>

            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              For any complaint, queries or grievance, you can reach out to us
              on the email address provided below.
            </Text>

            <Text style={[styles.grievanceSubtitle, { color: theme.text }]}>
              The contact details of the Grievance officer:
            </Text>

            <TouchableOpacity
              style={[styles.grievanceCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}
              onPress={() => handleEmailPress('grievance@sitinews.com')}
              activeOpacity={0.7}>
              <Icon name="email-outline" size={22} color={theme.textSecondary} />
              <View style={styles.grievanceContent}>
                <Text style={[styles.grievanceName, { color: theme.text }]}>Mr. S. Raghavendra</Text>
                <Text style={[styles.grievanceEmail, { color: theme.accentBlue }]}>
                  grievance@sitinews.com
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Address</Text>
            </View>

            <View style={[styles.addressCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
              <Icon
                name="map-marker-outline"
                size={22}
                color={theme.textSecondary}
                style={styles.addressIcon}
              />
              <View style={styles.addressContent}>
                <Text style={[styles.addressLine, { color: theme.text }]}>SITI News Office</Text>
                <Text style={[styles.addressLine, { color: theme.text }]}>H.No. 5-4-221, 2nd Floor,</Text>
                <Text style={[styles.addressLine, { color: theme.text }]}>Metro Plaza Building,</Text>
                <Text style={[styles.addressLine, { color: theme.text }]}>Abids Main Road,</Text>
                <Text style={[styles.addressLine, { color: theme.text }]}>
                  Hyderabad, Telangana – 500001.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whiteContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  emailContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emailAddress: {
    fontSize: 14,
    fontWeight: '600',
  },
  grievanceSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  grievanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  grievanceContent: {
    flex: 1,
  },
  grievanceName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  grievanceEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressLine: {
    fontSize: 14,
    lineHeight: 21,
  },
});


export default ContactUsScreen;
