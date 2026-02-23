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

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const SettingsScreen = ({navigation}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [videoAlertsEnabled, setVideoAlertsEnabled] = useState(false);
  const [nightModeEnabled, setNightModeEnabled] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={[styles.header, {paddingTop: STATUS_BAR_HEIGHT + 8}]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>సెట్టింగ్స్</Text>
        <Text style={styles.versionText}>App Version 9.24</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Alert */}
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <Icon name="bell" size={20} color="#E91E63" />
            <View style={styles.alertHeaderText}>
              <Text style={styles.alertTitle}>Missing notifications?</Text>
              <TouchableOpacity>
                <Text style={styles.clickHere}>Click here</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.alertText}>
            If you're not receiving notifications, please check your device settings and ensure notifications are enabled for this app. You may also need to disable battery optimization for uninterrupted alerts.
          </Text>
        </View>

        {/* Toggle Switches Section - 4 columns */}
        {/* <View style={styles.toggleContainer}>
          <View style={styles.toggleColumn}>
            <View style={[styles.toggleIconCircle, {backgroundColor: '#FFEEF3'}]}>
              <Icon name="bell" size={28} color="#E91E63" />
            </View>
            <Text style={styles.toggleLabel}>నోటిఫికేషన్లు</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{false: '#CCCCCC', true: '#FF3B30'}}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CCCCCC"
            />
          </View>

          <View style={styles.toggleColumn}>
            <View style={[styles.toggleIconCircle, {backgroundColor: '#E3F2FD'}]}>
              <Icon name="video" size={28} color="#2196F3" />
            </View>
            <Text style={styles.toggleLabel}>వీడియో అలర్ట్స్</Text>
            <Switch
              value={videoAlertsEnabled}
              onValueChange={setVideoAlertsEnabled}
              trackColor={{false: '#CCCCCC', true: '#FF3B30'}}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CCCCCC"
            />
          </View>

          <View style={styles.toggleColumn}>
            <View style={[styles.toggleIconCircle, {backgroundColor: '#F3E5F5'}]}>
              <Icon name="weather-night" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.toggleLabel}>నైట్ మోడ్</Text>
            <Switch
              value={nightModeEnabled}
              onValueChange={setNightModeEnabled}
              trackColor={{false: '#CCCCCC', true: '#FF3B30'}}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CCCCCC"
            />
          </View>

          <View style={styles.toggleColumn}>
            <View style={[styles.toggleIconCircle, {backgroundColor: '#E8F5E9'}]}>
              <Icon name="map-marker" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.toggleLabel}>లొకేషన్ సర్విస్</Text>
            <Switch
              value={locationServicesEnabled}
              onValueChange={setLocationServicesEnabled}
              trackColor={{false: '#CCCCCC', true: '#FF3B30'}}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CCCCCC"
            />
          </View>
        </View> */}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={()=>navigation.navigate("Bookmarks")} style={styles.actionButton}>
            <Icon name="bookmark-outline" size={20} color="#E74C3C" />
            <Text style={styles.actionButtonText}>బుక్మార్క్స్</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="history" size={20} color="#E74C3C" />
            <Text style={styles.actionButtonText}>క్లియర్ క్యాచ్</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>కాంటాక్ట్ అస్</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="information" size={22} color="#2196F3" />
                <Text style={styles.menuText}>మా గురించి</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="phone" size={22} color="#4CAF50" />
                <Text style={styles.menuText}>సంప్రదింపండి</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="star-outline" size={22} color="#FFC107" />
                <Text style={styles.menuText}>మీ సందేశ</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="file-document-outline" size={22} color="#9C27B0" />
                <Text style={styles.menuText}>నిబంధనలు & షరతులు</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Icon name="message-text-outline" size={22} color="#E91E63" />
                <Text style={styles.menuText}>ప్రైవసీ పాలసీ</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
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
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 12,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  alertBox: {
    backgroundColor: '#FFFBEE',
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
    color: '#333',
  },
  clickHere: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
  },
  alertText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 16,
  },
});

export default SettingsScreen;
