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

  const newsFaqData = [
    {
      id: 1,
      question: 'రాపిడ్ న్యూస్‌లో జర్నలిస్ట్‌గా ఎలా చేరవచ్చు?',
      answer: 'ముందుగా యాప్‌లోని Reporter Registration ఆప్షన్‌ను ఎంచుకోండి. మీ పేరు, జిల్లాను నమోదు చేసి, మొబైల్ నంబర్‌ను వెరిఫై చేయండి. రిజిస్ట్రేషన్ పూర్తయిన తర్వాత మీరు ఎంపిక చేసుకున్న జిల్లాకు సంబంధించిన స్థానిక వార్తలను పంపించవచ్చు.\n\nగమనిక: మీరు రిజిస్ట్రేషన్ సమయంలో ఎంచుకున్న జిల్లాకు సంబంధించిన వార్తలను మాత్రమే పంపించగలరు.',
    },
    {
      id: 2,
      question: 'రాపిడ్ న్యూస్‌కు వార్తలను ఎలా పంపించాలి?',
      answer: 'రిజిస్ట్రేషన్ పూర్తయిన తర్వాత స్టోరీస్‌ పోస్ట్‌ చేయండి అనే ఆప్షన్‌పై క్లిక్ చేయండి. వార్త జరిగిన ప్రాంతాన్ని ఎంపిక చేసి, హెడ్‌లైన్, సంబంధిత ఫొటో, పూర్తి వివరాలను నమోదు చేయండి. అన్ని వివరాలను ఒకసారి పరిశీలించిన తర్వాత Submit చేయండి. మీ వార్త పరిశీలన కోసం అడ్మిన్‌కు చేరుతుంది.',
    },
    {
      id: 3,
      question: 'నా వాలెట్‌లోని డబ్బులను ఎలా విత్‌డ్రా చేసుకోవాలి?',
      answer: 'మీరు రిజిస్టర్డ్‌, KYC వెరిఫైడ్ Paytm ఖాతా లేదా అర్హత కలిగిన UPI ఖాతా ద్వారా మీ సంపాదనను పొందవచ్చు. యాప్‌లో మీ UPI ID లేదా అవసరమైన పేమెంట్ వివరాలను నమోదు చేసి, కనీస విత్‌డ్రా పరిమితి చేరుకున్న తర్వాత Withdrawal Request పంపించండి. మీ అభ్యర్థనను పరిశీలించి అడ్మిన్ పేమెంట్ ప్రాసెస్ చేస్తారు.',
    },
    {
      id: 4,
      question: 'రిజిస్ట్రేషన్ తర్వాత జిల్లా లేదా భాషను మార్చుకోవచ్చా?',
      answer: 'రిజిస్ట్రేషన్ సమయంలో ఎంపిక చేసుకున్న జిల్లా, భాషను తర్వాత మార్చుకునే అవకాశం ప్రస్తుతం లేదు. కాబట్టి రిజిస్ట్రేషన్ చేసుకునే ముందే మీకు సంబంధించిన వివరాలను జాగ్రత్తగా ఎంపిక చేసుకోండి.',
    },
    {
      id: 5,
      question: 'నా సంపాదనను ఎప్పుడు పొందగలను?',
      answer: 'జూనియర్ రిపోర్టర్లు కనీసం ₹500 సంపాదించిన తర్వాత విత్‌డ్రా రిక్వెస్ట్ చేసుకోవచ్చు. సీనియర్ రిపోర్టర్లు కనీసం ₹1,000 సంపాదించిన తర్వాత విత్‌డ్రా చేసుకోవచ్చు.',
    },
    {
      id: 6,
      question: 'నా రిపోర్టర్ అకౌంట్ ఎందుకు బ్లాక్ అవుతుంది?',
      answer: 'నకిలీ వార్తలు, ఇతరుల కంటెంట్‌ను కాపీ చేసి పంపించడం, తప్పుడు సమాచారం అందించడం వంటి కారణాలతో రిపోర్టర్ అకౌంట్ బ్లాక్ అయ్యే అవకాశం ఉంది. అకౌంట్ బ్లాక్ చేసే సమయంలో అందుకు సంబంధించిన కారణాన్ని మా ఎడిటోరియల్ టీమ్ తెలియజేస్తుంది.\n\nరాపిడ్ న్యూస్ స్థానికంగా జరిగే వాస్తవ సంఘటనలు, ప్రజా సమస్యలు, తాజా సమాచారాన్ని రిపోర్టర్ల నుంచి ఆశిస్తోంది. వేలాది మంది పాఠకులకు వార్తలు చేరుతున్నందున కంటెంట్ నాణ్యత, విశ్వసనీయత విషయంలో కఠినమైన నిబంధనలు పాటిస్తాము.',
    },
    {
      id: 7,
      question: 'ఒకేసారి రెండు జిల్లాలకు సంబంధించిన వార్తలను పంపవచ్చా?',
      answer: 'లేదు. ప్రతి రిపోర్టర్ ఒక జిల్లాకు మాత్రమే కేటాయించబడతారు. ఆయా జిల్లాల్లోని మండలాలు, తాలూకాలు, ప్రాంతాల వారీగా రిపోర్టర్ల నెట్‌వర్క్ నిర్వహించబడుతుంది. అందువల్ల ఒకే రిపోర్టర్ రెండు వేర్వేరు జిల్లాల వార్తలను పంపించడానికి అనుమతి ఉండదు.',
    },
    {
      id: 8,
      question: 'నేను సీనియర్ జర్నలిస్ట్‌గా ఎలా మారగలను?',
      answer: 'రిపోర్టర్‌గా మీకు మొదటి పేమెంట్ విజయవంతంగా అందిన తర్వాత మీరు సీనియర్ రిపోర్టర్ హోదాకు అర్హులు అవుతారు.',
    },
    {
      id: 9,
      question: 'నేను పంపిన వార్త ఎంత సమయంలో పబ్లిష్ అవుతుంది?',
      answer: 'వార్త అందిన వెంటనే మా ఎడిటోరియల్ టీమ్ పరిశీలన ప్రారంభిస్తుంది. సాధ్యమైనంత త్వరగా వార్తలను ప్రచురించేందుకు ప్రయత్నిస్తాము. అయితే వార్త ప్రాధాన్యత, వివరాల ధృవీకరణ, ఎడిటోరియల్ రివ్యూ వంటి అంశాలను బట్టి ప్రచురణ సమయం మారవచ్చు.',
    },
    {
      id: 10,
      question: 'ఇంగ్లీష్‌లో వార్తలు పంపించే అవకాశం ఉందా?',
      answer: 'రాపిడ్ న్యూస్ ప్రధానంగా ప్రాంతీయ వార్తలపై దృష్టి సారించే హైపర్‌లోకల్ న్యూస్ ప్లాట్‌ఫామ్. అందువల్ల ప్రస్తుతం యాప్‌లో అందుబాటులో ఉన్న ప్రాంతీయ భాషల్లో మాత్రమే వార్తలను పంపించవచ్చు.',
    },
    {
      id: 11,
      question: 'నేను పంపిన ప్రతి వార్తకు డబ్బులు వస్తాయా?',
      answer: 'లేదు. మీరు పంపిన వార్త ఎడిటోరియల్ పరిశీలన అనంతరం ఆమోదం పొంది, ప్రచురితమైతేనే పేమెంట్‌కు అర్హత ఉంటుంది. అయితే ప్రతి ప్రచురిత వార్తకు పేమెంట్ తప్పనిసరిగా ఉండదు. వార్తను ఆమోదించే సమయంలో అడ్మిన్ పేమెంట్ వర్తిస్తుందా లేదా అనేది నిర్ణయిస్తారు. పేమెంట్ వర్తిస్తే మీ వాలెట్‌లో జమ అవుతాయి. వర్తించకపోతే అందుకు సంబంధించిన కారణాన్ని యాప్‌లో చూడవచ్చు.',
    },
    {
      id: 12,
      question: 'నేను ముందుగా వార్త పంపినా, అదే వార్తను మరో రిపోర్టర్ పంపినప్పుడు ఎందుకు ప్రచురిస్తారు?',
      answer: 'కొన్ని సందర్భాల్లో ఒకే సంఘటనకు సంబంధించి పలువురు రిపోర్టర్లు వార్తలు పంపవచ్చు. అలాంటప్పుడు వార్త నాణ్యత, పూర్తి సమాచారం, విశ్వసనీయత, రిపోర్టర్ ట్రస్ట్ స్కోర్, గత పబ్లిషింగ్ రేషియో వంటి అంశాలను పరిశీలించి మెరుగైన కథనాన్ని ప్రచురణకు ఎంపిక చేస్తాము.\n\nఅందువల్ల వార్తను ముందుగా పంపడం ఒక్కటే ప్రచురణకు హామీ కాదు. పూర్తి వివరాలతో, వాస్తవ సమాచారంతో వార్తలను పంపించడం ద్వారా ప్రచురణ అవకాశాలను మెరుగుపరచుకోవచ్చు.',
    },
    {
      id: 13,
      question: 'నా వార్తను రివ్యూ చేయడానికి ఎందుకు ఎక్కువ సమయం పడుతోంది?',
      answer: 'మీరు పంపిన కొన్ని వార్తలు ఎడిటోరియల్ పరిశీలనలో ఎక్కువ సమయం ఉండవచ్చు. వార్తలోని వివరాలను ధృవీకరించడం, సంఘటన ప్రాధాన్యత, సంబంధిత సమాచారం అందుబాటులో ఉండటం వంటి అంశాలను బట్టి సమీక్ష సమయం మారుతుంది. వార్తల కచ్చితత్వానికి ప్రాధాన్యత ఇస్తూ మా టీమ్ ప్రతి కథనాన్ని పరిశీలిస్తుంది.',
    },
    {
      id: 14,
      question: 'నేను పంపిన వార్తలను ఎందుకు తిరస్కరిస్తారు?',
      answer: 'రాపిడ్ న్యూస్‌లో ప్రచురించే ప్రతి వార్త వాస్తవమైనదా, విశ్వసనీయమైనదా అనే విషయాలను మా ఎడిటోరియల్ టీమ్ పరిశీలిస్తుంది. తప్పుడు సమాచారం, అసంపూర్ణ వివరాలు, కాపీ చేసిన కంటెంట్, యాప్ నిబంధనలకు విరుద్ధమైన కథనాలు, చట్టపరమైన సమస్యలకు దారితీసే అంశాలు ఉన్నప్పుడు వార్తలను తిరస్కరించవచ్చు.\n\nఅలాగే, సంఘటన జరిగిన చాలా సమయం తర్వాత వార్త అందినా లేదా ఇప్పటికే మరింత పూర్తి సమాచారంతో కూడిన కథనం ప్రచురణకు అందుబాటులో ఉన్నా మీ వార్తను తిరస్కరించే అవకాశం ఉంటుంది. కాబట్టి వార్తలను వాస్తవ వివరాలతో, వీలైనంత త్వరగా పంపించండి.',
    },
  ];

  // No content provided yet for this tab — shown as a pending state instead
  // of silently duplicating the news FAQ list.
  const adFaqData = [];

  const faqData = activeTab === 'submitted' ? newsFaqData : adFaqData;

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
          <TouchableOpacity style={styles.homeButton} accessibilityRole="button" accessibilityLabel="Go to news"
            onPress={() => navigation.popTo('Main', {screen: 'HomeTab'})}>
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

        <TouchableOpacity
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
        </TouchableOpacity>

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
          {faqData.length === 0 && (
            <Text style={[styles.emptyFaqText, { color: theme.textSecondary }]}>
              త్వరలో అందుబాటులోకి వస్తుంది
            </Text>
          )}
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
  emptyFaqText: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingVertical: 24,
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
