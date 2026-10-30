import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../redux/reducers/auth';
import { useTheme } from '../context/ThemeContext';

// Added these imports for responsive fonts and custom font family
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { fonts } from '../config/theme'; // <-- Adjust this import path if your fonts are located elsewhere

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReporterScreen = ({navigation}) => {
  const dispatch = useDispatch()
  const { theme, isDarkMode } = useTheme();
  const {reporter, reporterToken} = useSelector((state)=>state.auth)
  const [activeTab, setActiveTab] = useState('submitted');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'రాపిడ్ న్యూస్‌లో జర్నలిస్ట్‌గా ఎలా మారాలి?',
      answer: 'రిపోర్టర్‌గా ప్రారంభించాలంటే ముందుగా రిజిస్ట్రేషన్ చేయాలి. అందుకు ఉన్న ఆప్షన్‌పై క్లిక్ చేసి మీ పేరు నమోదు చేయండి. తరువాత మీ జిల్లాను ఎంచుకుని, మొబైల్ నంబర్‌ను వెరిఫై చేయండి. అంతే, మీరు ఎంచుకున్న జిల్లాకు సంబంధించిన వార్తలను పంపించే అవకాశం పొందుతారు. గమనిక: మీరు ఎంచుకున్న జిల్లాకు మాత్రమే వార్తలు పంపగలరు.',
    },
    {
      id: 2,
      question: 'రాపిడ్ న్యూస్‌కు వార్తలను ఎలా పంపాలి?',
      answer: 'రిజిస్ట్రేషన్ పూర్తయ్యాక “షార్ట్ న్యూస్ పోస్ట్ చేయండి” అనే ఆప్షన్‌ను క్లిక్ చేయండి. తరువాత ప్రాంతాన్ని ఎంచుకుని, హెడ్‌లైన్, ఫోటో, పూర్తి వార్తను జాగ్రత్తగా నమోదు చేయండి. ఎలాంటి తప్పులు లేకుండా చెక్ చేసి సబ్మిట్ చేయండి.',
    },
    {
      id: 3,
      question: 'నా అకౌంట్ ఎందుకు బ్లాక్ అవుతుంది?',
      answer: 'మీరు పంపే కంటెంట్ కాపీ చేసినదిగా లేదా అసత్యంగా ఉంటే, సాధారణంగా అకౌంట్ బ్లాక్ అవుతుంది. బ్లాక్ చేసినప్పుడు కారణాన్ని మా టీమ్ తెలియజేస్తుంది. రాపిడ్ న్యూస్ రిపోర్టర్లు తమ పరిసరాల్లో జరుగుతున్న నిజమైన, తాజా వార్తలను మాత్రమే పంపాలి. కాపీ కంటెంట్ అనుమతించబడదు. ప్రచురితమైన వార్తలు అనేక మందికి చేరుతాయి కాబట్టి, ఈ విషయంలో మేము కఠినంగా వ్యవహరిస్తాము.',
    },
    {
      id: 4,
      question: 'వార్త ప్రచురణకు ఎంత సమయం పడుతుంది?',
      answer: 'సాధారణంగా వార్త చాలా త్వరగా, ఒక నిమిషంలోనే ప్రచురితమవుతుంది అని చెప్పవచ్చు. అయితే పరిస్థితుల ఆధారంగా కొంత సమయం మారవచ్చు. మేము వేగంగా మరియు ఖచ్చితమైన వార్తలను అందించడంపై దృష్టి పెడుతున్నాము.',
    },
    {
      id: 5,
      question: 'కథనాలు ఎందుకు తిరస్కరించబడుతాయి?',
      answer: 'రిపోర్టర్లు పంపే ప్రతి కథనాన్ని ప్రచురించే ముందు అది నిజమా? నిబంధనలకు అనుగుణంగా ఉందా? అని పరిశీలిస్తాము. కొన్ని సందర్భాల్లో నిబంధనలు ఉల్లంఘించినా, ఆలస్యంగా వచ్చినా, లేదా చట్టపరమైన సమస్యలు కలిగించే అవకాశం ఉన్నా కథనాన్ని తిరస్కరిస్తాము. ఇది మీకూ, రాపిడ్ న్యూస్‌కూ రక్షణగా ఉంటుంది.',
    },
  ];

  const toggleQuestion = (id) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  useEffect(()=>{
    dispatch(getProfile())
  },[])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.headerWrapper, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.profileSection}>
           {reporter?.username ? <Image
              source={{uri:reporter?.profile_image }}
              style={styles.profileImage}
            />:<Icon name="account-circle" size={48} color={isDarkMode ? '#555' : "#CCC"} />}
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcomeText, { color: theme.text }]}>Welcome</Text>
              <Text style={[styles.guestText, { color: theme.textSecondary }]}>{reporter?.username || "Guest"}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Main')}>
            <Icon name="home-outline" size={30} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>పోస్ట్‌ చేయండి</Text>

        {/* Action Cards */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}
          activeOpacity={0.7}
          onPress={() =>navigation.navigate(reporterToken ? "ReporterApp" :'MobileLogin')}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2D1F1F' : '#FFE5E5' }]}>
            <Icon name="microphone" size={32} color="#E74C3C" />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>రిపోర్టర్‌ అవ్వండి</Text>
            <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
              (న్యూస్‌ పోస్ట్‌ చేయండి)
            </Text>
          </View>
          <Icon name="chevron-right" size={26} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdFreeSubscription')}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2D1F1F' : '#FFE5E5' }]}>
            <Icon name="television" size={32} color="#E74C3C" />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              స్థానిక ప్రకటనలు పోస్ట్‌ చేయండి
            </Text>
          </View>
          <Icon name="chevron-right" size={26} color={theme.textSecondary} />
        </TouchableOpacity> */}

        {/* Tabs Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>తరచుగా అడుగు ప్రశ్నలు</Text>

        <View style={[styles.tabsContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#E8EAED' }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'submitted' && [styles.activeTab, { backgroundColor: isDarkMode ? theme.primary : '#1A1A1A' }],
            ]}
            onPress={() => setActiveTab('submitted')}>
            <Text
              style={[
                styles.tabText,
                { color: isDarkMode ? '#888' : '#666' },
                activeTab === 'submitted' && [styles.activeTabText, { color: isDarkMode ? '#000' : '#FFF' }],
              ]}>
              న్యూస్‌ గురించి  
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'published' && [styles.activeTab, { backgroundColor: isDarkMode ? theme.primary : '#1A1A1A' }],
            ]}
            onPress={() => setActiveTab('published')}>
            <Text
              style={[
                styles.tabText,
                { color: isDarkMode ? '#888' : '#666' },
                activeTab === 'published' && [styles.activeTabText, { color: isDarkMode ? '#000' : '#FFF' }],
              ]}>
              ప్రకటన గురించి
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ List with Expandable Answers */}
        <View style={styles.questionsList}>
          {faqData.map((faq) => (
            <View key={faq.id} style={[styles.faqContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
              <TouchableOpacity
                style={styles.questionItem}
                activeOpacity={0.7}
                onPress={() => toggleQuestion(faq.id)}>
                <Text style={[styles.questionText, { color: theme.text }]}>{faq.question}</Text>
                <Icon
                  name={expandedQuestion === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              
              {expandedQuestion === faq.id && (
                <View style={[styles.answerContainer, { borderTopColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
                  <Text style={[styles.answerText, { color: theme.textSecondary }]}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingTop: STATUS_BAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
  },
  welcomeSection: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: fonts.bold,
    includeFontPadding: false,
  },
  guestText: {
    fontSize: responsiveFontSize(1.8),
    marginTop: 2,
    includeFontPadding: false,
  },
  homeButton: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(2.6),
    fontFamily: fonts.bold,
    includeFontPadding: false,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderRadius: 14,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: fonts.bold,
    includeFontPadding: false,
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: responsiveFontSize(1.8),
    includeFontPadding: false,
    lineHeight: responsiveFontSize(2.6),
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: { },
  tabText: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: fonts.bold,
    includeFontPadding: false,
  },
  activeTabText: { },
  questionsList: {
    paddingHorizontal: 16,
  },
  faqContainer: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  questionText: {
    flex: 1,
    fontSize: responsiveFontSize(2.1),
    fontFamily: fonts.bold,
    includeFontPadding: false,
    lineHeight: responsiveFontSize(3.2), // Added line height to prevent clipping
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 0,
    borderTopWidth: 1,
  },
  answerText: {
    fontSize: responsiveFontSize(1.9),
    includeFontPadding: false,
    lineHeight: responsiveFontSize(3.0), // increased for readability
  },
});

export default ReporterScreen;