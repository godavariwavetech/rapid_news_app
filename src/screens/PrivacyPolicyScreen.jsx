import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

// TODO: replace with the deployed PDF link once hosted on cPanel.
const PRIVACY_POLICY_PDF_URL = 'https://www.rapidnewsnetwork.in/privacy-policy.pdf';

// Android's WebView has no built-in PDF renderer (unlike iOS's WKWebView),
// so route it through Google Docs' viewer there to actually display the PDF.
const viewerUrl = Platform.select({
  android: `https://docs.google.com/viewer?url=${encodeURIComponent(PRIVACY_POLICY_PDF_URL)}&embedded=true`,
  default: PRIVACY_POLICY_PDF_URL,
});

const PrivacyPolicyScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);

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

      <View style={styles.webviewWrapper}>
        <WebView
          source={{ uri: viewerUrl }}
          style={{ backgroundColor: theme.background }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
        />
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.accentBlue || '#1DA1F2'} />
          </View>
        )}
      </View>
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
  webviewWrapper: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrivacyPolicyScreen;
