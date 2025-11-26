import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import {
  toggleDarkMode,
  toggleNotifications,
  toggleAutoPlayVideos,
} from '../redux/reducers/settings';
import {logout} from '../redux/reducers/auth';
import {getTranslation} from '../utils/translations';

const ProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const language = useSelector(state => state.settings.language);
  const location = useSelector(state => state.settings.location);
  const notificationsEnabled = useSelector(
    state => state.settings.notificationsEnabled,
  );
  const autoPlayVideos = useSelector(state => state.settings.autoPlayVideos);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = key => getTranslation(language, key);

  const SettingItem = ({icon, title, value, onPress, showSwitch, switchValue}) => (
    <TouchableOpacity
      style={[styles.settingItem, {borderBottomColor: theme.border}]}
      onPress={onPress}
      disabled={showSwitch}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.primary} />
        <Text style={[styles.settingTitle, {color: theme.text}]}>{title}</Text>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onPress}
          trackColor={{false: theme.border, true: theme.primary}}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, {color: theme.textSecondary}]}>
            {value}
          </Text>
          <Icon name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.text}]}>{t('profile')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, {backgroundColor: theme.cardBackground}]}>
          <View
            style={[styles.avatarContainer, {backgroundColor: theme.primary}]}>
            <Icon name="account" size={50} color="#FFFFFF" />
          </View>
          <Text style={[styles.userName, {color: theme.text}]}>Guest User</Text>
          <Text style={[styles.userEmail, {color: theme.textSecondary}]}>
            guest@way2news.com
          </Text>
        </View>

        <View style={[styles.section, {backgroundColor: theme.cardBackground}]}>
          <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>
            {t('settings').toUpperCase()}
          </Text>

          <SettingItem
            icon="translate"
            title={t('language')}
            value={language}
            onPress={() => console.log('Change language')}
          />

          <SettingItem
            icon="map-marker"
            title={t('location')}
            value={location || 'Not set'}
            onPress={() => console.log('Change location')}
          />

          <SettingItem
            icon="theme-light-dark"
            title={t('darkMode')}
            showSwitch
            switchValue={isDarkMode}
            onPress={() => dispatch(toggleDarkMode())}
          />

          <SettingItem
            icon="bell"
            title={t('notifications')}
            showSwitch
            switchValue={notificationsEnabled}
            onPress={() => dispatch(toggleNotifications())}
          />

          <SettingItem
            icon="play-circle"
            title="Auto-play Videos"
            showSwitch
            switchValue={autoPlayVideos}
            onPress={() => dispatch(toggleAutoPlayVideos())}
          />
        </View>

        <View style={[styles.section, {backgroundColor: theme.cardBackground}]}>
          <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>
            ABOUT
          </Text>

          <SettingItem
            icon="information"
            title="About Way2News"
            value="v1.0.0"
            onPress={() => console.log('About')}
          />

          <SettingItem
            icon="file-document"
            title="Privacy Policy"
            onPress={() => console.log('Privacy')}
          />

          <SettingItem
            icon="gavel"
            title="Terms of Service"
            onPress={() => console.log('Terms')}
          />

          <SettingItem
            icon="help-circle"
            title="Help & Support"
            onPress={() => console.log('Help')}
          />
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, {backgroundColor: theme.error}]}
          onPress={() => dispatch(logout())}>
          <Icon name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
