import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useDispatch } from 'react-redux';
import { setDarkMode } from '../redux/reducers/settings';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const SettingsScreen = ({navigation}) => {
  const { theme, isDarkMode } = useTheme();
  const dispatch = useDispatch()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [videoAlertsEnabled, setVideoAlertsEnabled] = useState(false);
  const [nightModeEnabled, setNightModeEnabled] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.header, {paddingTop: STATUS_BAR_HEIGHT + 8, backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>సెట్టింగ్స్</Text>
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>App Version 9.24</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Alert */}
        <View style={[styles.alertBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFBEE' }]}>
          <View style={styles.alertHeader}>
            <Icon name="bell" size={20} color={theme.primary} />
            <View style={styles.alertHeaderText}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>Missing notifications?</Text>
              <TouchableOpacity>
                <Text style={[styles.clickHere, { color: theme.accentBlue }]}>Click here</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.alertText, { color: theme.textSecondary }]}>
            If you're not receiving notifications, please check your device settings and ensure notifications are enabled for this app. You may also need to disable battery optimization for uninterrupted alerts.
          </Text>
        </View>

                  {/* Night Mode */}
          <View style={styles.toggleColumn}>
            <View style={[styles.toggleIconCircle, {backgroundColor: '#F3E5F5'}]}>
              <Icon name="weather-night" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.toggleLabel}>నైట్ మోడ్</Text>
            <Switch
              value={nightModeEnabled}
              onValueChange={(value)=>{
                setNightModeEnabled(value)
                dispatch(setDarkMode(value))
              }}
              trackColor={{false: '#CCCCCC', true: '#FF3B30'}}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CCCCCC"
            />
          </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={()=>navigation.navigate("Bookmarks")} style={[styles.actionButton, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E8EAED' }]}>
            <Icon name="bookmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>బుక్మార్క్స్</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E8EAED' }]}>
            <Icon name="history" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>క్లియర్ క్యాచ్</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Us Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>కాంటాక్ట్ అస్</Text>
          
          <View style={[styles.menuCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="information" size={22} color={theme.accentBlue} />
                <Text style={[styles.menuText, { color: theme.text }]}>మా గురించి</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="phone" size={22} color={theme.success} />
                <Text style={[styles.menuText, { color: theme.text }]}>సంప్రదింపండి</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="star-outline" size={22} color={theme.warning} />
                <Text style={[styles.menuText, { color: theme.text }]}>మీ సందేశ</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="file-document-outline" size={22} color={theme.secondary} />
                <Text style={[styles.menuText, { color: theme.text }]}>నిబంధనలు & షరతులు</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="message-text-outline" size={22} color={theme.primary} />
                <Text style={[styles.menuText, { color: theme.text }]}>ప్రైవసీ పాలసీ</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 30}} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  versionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  alertBox: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  alertHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clickHere: {
    fontSize: 15,
    fontWeight: '600',
  },
  alertText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },
  menuCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  toggleColumn: {
    width: '23.5%',
    alignItems: 'center',
  },
  toggleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    height: 28,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
});

export default SettingsScreen;
