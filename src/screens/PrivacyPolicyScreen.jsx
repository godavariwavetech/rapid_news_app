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

const PrivacyPolicyScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();

  const BulletPoint = ({ children }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: theme.textSecondary }]}>•</Text>
      <Text style={[styles.paragraph, { color: theme.textSecondary, flex: 1, marginTop: 0 }]}>
        {children}
      </Text>
    </View>
  );

  const NumberedPoint = ({ number, children }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: theme.textSecondary, fontWeight: '700' }]}>{number}.</Text>
      <Text style={[styles.paragraph, { color: theme.textSecondary, flex: 1, marginTop: 0 }]}>
        {children}
      </Text>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.mainTitle, { color: theme.text }]}>Privacy Policy – Rapid News</Text>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 1 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>
        
        <Text style={[styles.subTitle, { color: theme.text }]}>1.1 Technological Data:</Text>
        <NumberedPoint number="1">IP Address</NumberedPoint>
        <NumberedPoint number="2">Location (only with user permission)</NumberedPoint>
        <NumberedPoint number="3">Device Camera</NumberedPoint>
        <NumberedPoint number="4">Device Storage</NumberedPoint>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Rapid News App may require access to device storage to save images, videos, and offline news content based on user preferences. Location access helps us deliver relevant local news. Camera access is required when users submit content under the "Reporter" section.
        </Text>

        <Text style={[styles.subTitle, { color: theme.text, marginTop: 16 }]}>1.2 Personally Identifiable Information:</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>This may include:</Text>
        <BulletPoint>Email ID</BulletPoint>
        <BulletPoint>Mobile Number</BulletPoint>
        <BulletPoint>Advertising ID</BulletPoint>
        
        <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: 12 }]}>
          Rapid News collects personal information only in specific situations and it is not mandatory for general app usage. These situations include:
        </Text>
        <NumberedPoint number="1">When users post comments, Email ID may be required (with permission) to maintain a safe and moderated discussion environment.</NumberedPoint>
        <NumberedPoint number="2">When users submit news under the Citizen Reporter feature, Email ID and Mobile Number are required for verification and communication.</NumberedPoint>
        <NumberedPoint number="3">Advertising ID is used only for analytics and re-targeting purposes.</NumberedPoint>
        <NumberedPoint number="4">Mobile number and location are collected only with user consent and are not shared with unauthorized third parties.</NumberedPoint>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 2 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. How Rapid News Uses the Information</Text>
        <BulletPoint>Email ID may be used for login identification and communication.</BulletPoint>
        <BulletPoint>To send updates, notifications, and important app-related information.</BulletPoint>
        <BulletPoint>To personalize user experience and content.</BulletPoint>
        <BulletPoint>To respond to queries, feedback, and support requests.</BulletPoint>
        <BulletPoint>To prevent misuse and ensure compliance with Terms & Conditions.</BulletPoint>
        <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: 12 }]}>
          Users can unsubscribe from promotional emails anytime using the option provided in emails.
        </Text>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 3 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Data Security</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Rapid News implements appropriate security measures to protect user data from unauthorized access, misuse, or disclosure. All personal data is stored securely.
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          However, no system can guarantee complete security, and users are advised to safeguard their device and login details.
        </Text>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 4 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Sharing of Information</Text>
        <NumberedPoint number="1">Rapid News does not sell or rent personal user data.</NumberedPoint>
        <NumberedPoint number="2">Aggregated (non-personal) data may be shared with partners for analytics and service improvement.</NumberedPoint>
        <NumberedPoint number="3">Personal data may be disclosed if required by law or government authorities.</NumberedPoint>
        <NumberedPoint number="4">In case of merger, acquisition, or business transfer, user data may be transferred accordingly.</NumberedPoint>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 5 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. User Choices</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Users receiving promotional emails can opt-out anytime. Even after opting out, users may receive important service-related emails.
        </Text>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 6 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Updates to Privacy Policy</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Rapid News may update this Privacy Policy from time to time. Updated versions will be available on the platform. Users are advised to review it regularly.
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Continued use of the App after updates implies acceptance of the revised policy.
        </Text>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

        {/* Section 7 */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Contact Us</Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          For any questions, concerns, or legal queries regarding this Privacy Policy, you can contact us at:
        </Text>
        <View style={[styles.contactBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F7FA' }]}>
          <Icon name="email" size={20} color="#1DA1F2" />
          <Text style={[styles.contactText, { color: theme.text }]}>support@rapidnewsnetwork.in</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  bulletDot: {
    fontSize: 15,
    marginRight: 8,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default PrivacyPolicyScreen;