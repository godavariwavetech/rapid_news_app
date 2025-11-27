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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ContactUsScreen = ({navigation}) => {
  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#808080" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>సంప్రదించండి</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Contact Us</Text>
      </View>

      {/* White Content - Scrollable */}
      <View style={styles.whiteContent}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Contact Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color="#E74C3C" />
              <Text style={styles.sectionTitle}>Contact Details</Text>
            </View>

            <Text style={styles.sectionDescription}>
              For any support / any other queries write to
            </Text>

            <TouchableOpacity
              style={styles.emailRow}
              onPress={() => handleEmailPress('support@sitinews.com')}
              activeOpacity={0.7}>
              <Icon name="email-outline" size={22} color="#666" />
              <View style={styles.emailContent}>
                <Text style={styles.emailLabel}>E-mail:</Text>
                <Text style={styles.emailAddress}>support@sitinews.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Grievance Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color="#E74C3C" />
              <Text style={styles.sectionTitle}>Grievance</Text>
            </View>

            <Text style={styles.sectionDescription}>
              For any complaint, queries or grievance, you can reach out to us
              on the email address provided below.
            </Text>

            <Text style={styles.grievanceSubtitle}>
              The contact details of the Grievance officer:
            </Text>

            <TouchableOpacity
              style={styles.grievanceCard}
              onPress={() => handleEmailPress('grievance@sitinews.com')}
              activeOpacity={0.7}>
              <Icon name="email-outline" size={22} color="#666" />
              <View style={styles.grievanceContent}>
                <Text style={styles.grievanceName}>Mr. S. Raghavendra</Text>
                <Text style={styles.grievanceEmail}>
                  grievance@sitinews.com
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="arrow-right" size={24} color="#E74C3C" />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>

            <View style={styles.addressCard}>
              <Icon
                name="map-marker-outline"
                size={22}
                color="#666"
                style={styles.addressIcon}
              />
              <View style={styles.addressContent}>
                <Text style={styles.addressLine}>SITI News Office</Text>
                <Text style={styles.addressLine}>H.No. 5-4-221, 2nd Floor,</Text>
                <Text style={styles.addressLine}>Metro Plaza Building,</Text>
                <Text style={styles.addressLine}>Abids Main Road,</Text>
                <Text style={styles.addressLine}>
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
    backgroundColor: '#808080',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#808080',
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
    backgroundColor: '#333333',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 10, // Reduced from 20 to 10
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20, // Reduced from 24 to 20
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
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
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
    color: '#333',
  },
  emailAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  grievanceSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  grievanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
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
    color: '#1A1A1A',
    marginBottom: 3,
  },
  grievanceEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F8',
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
    color: '#333',
    lineHeight: 21,
  },
});


export default ContactUsScreen;
