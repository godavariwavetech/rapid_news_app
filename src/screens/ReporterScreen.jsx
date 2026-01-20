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

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReporterScreen = ({navigation}) => {
  const dispatch = useDispatch()
  const {reporter} = useSelector((state)=>state.auth)
  const [activeTab, setActiveTab] = useState('submitted');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'SITI సున్నాన్ జడ్యాలిస్తు ఎలా అవ్వాలి',
      answer: 'SITI సున్నాన్ జడ్యాలిస్తు అవ్వడానికి మీరు మా యాప్‌ని డౌన్‌లోడ్ చేసుకుని, రిపోర్టర్ సెక్షన్‌లో రిజిస్టర్ చేసుకోవాలి. మీ వివరాలు నమోదు చేసి, వెరిఫికేషన్ పూర్తి చేయండి.',
    },
    {
      id: 2,
      question: 'SITI సున్నాన్ కు వార్తలు ఎలా సంపాలి',
      answer: 'వార్తలను పంపడానికి యాప్‌లో "వార్తను పంపించండి" ఆప్షన్‌ను ఎంచుకోండి. ఫోటో లేదా వీడియో అప్‌లోడ్ చేసి, వివరణ రాసి సబ్మిట్ చేయండి. మా టీమ్ దీనిని రివ్యూ చేసి ప్రచురిస్తుంది.',
    },
    {
      id: 3,
      question: 'ఫీ-టివిఎం వాటిల్ కు సంబంధించిన డబ్బులను ఎలా రీఫిల్ చేయాలి',
      answer: 'మీ వాలెట్‌ను రీఫిల్ చేయడానికి యాప్‌లో వాలెట్ సెక్షన్‌కు వెళ్లండి. UPI, డెబిట్ కార్డ్, క్రెడిట్ కార్డ్ లేదా నెట్ బ్యాంకింగ్ ద్వారా డబ్బు జోడించవచ్చు.',
    },
    {
      id: 4,
      question: 'జిల్లా మరియు బాసా అమరుమ్మను అవికాశం ఉంద్ప?',
      answer: 'అవును, మీరు మీ జిల్లా మరియు భాష ప్రాధాన్యతలను సెట్టింగ్స్‌లో మార్చుకోవచ్చు. ఇది మీకు సంబంధిత వార్తలను చూపించడంలో సహాయపడుతుంది.',
    },
    {
      id: 5,
      question: 'నేను ఎమ్మదూ డబ్బును పొందగలను?',
      answer: 'మీరు పంపిన వార్తలు ప్రచురించబడినప్పుడు మీకు డబ్బు లభిస్తుంది. ప్రతి వార్త కోసం వ్యూస్ మరియు ఎంగేజ్‌మెంట్ ఆధారంగా చెల్లించబడుతుంది.',
    },
    {
      id: 6,
      question: 'నా అక్షిల్ భార్త అవ్వద్దానికి గల కారణం ఏమిటి?',
      answer: 'అకౌంట్ బ్లాక్ అవ్వడానికి అనేక కారణాలు ఉండవచ్చు - నిబంధనల ఉల్లంఘన, తప్పుడు సమాచారం పంపడం, లేదా స్పామ్ కంటెంట్. మరింత సమాచారం కోసం సపోర్ట్ టీమ్‌ను సంప్రదించండి.',
    },
    {
      id: 7,
      question: 'నేను ఓటి సారి రెండు జిల్లా వార్తలను పంపవచ్చా?',
      answer: 'అవును, మీరు ఒకేసారి బహుళ జిల్లాల నుండి వార్తలను పంపవచ్చు. ప్రతి వార్తకు సరైన లొకేషన్ ట్యాగ్ చేయడం గుర్తుంచుకోండి.',
    },
    {
      id: 8,
      question: 'నేను సిసియర్ జడ్యాలిస్తు ఎలా అవుతాను?',
      answer: 'సీనియర్ జర్నలిస్ట్ అవ్వడానికి మీరు కనీసం 100 వార్తలు పంపాలి మరియు మంచి రేటింగ్ కలిగి ఉండాలి. సీనియర్ జర్నలిస్ట్‌లకు ఎక్కువ బోనస్ మరియు ప్రత్యేక ప్రయోజనాలు లభిస్తాయి.',
    },
    {
      id: 9,
      question: 'వార్తల ప్రమదర్తకమడానికి ఎంత సమయం పడుతుంది?',
      answer: 'సాధారణంగా వార్తలు 2-4 గంటల్లో రివ్యూ చేయబడతాయి. అత్యవసర లేదా బ్రేకింగ్ న్యూస్ కోసం, ఇది 30 నిమిషాల్లో వేగంగా ప్రాసెస్ చేయబడుతుంది.',
    },
    {
      id: 10,
      question: 'నేను అంగ్ భాషలో వార్తలను పంపవచ్చలని అనుకుంటున్నాను, ఆ భాషి అందుబాటులో ఉంద?',
      answer: 'మేము ప్రస్తుతం తెలుగు, హిందీ, తమిళం, కన్నడ మరియు ఇంగ్లీష్ భాషలకు మద్దతు ఇస్తున్నాము. త్వరలో మరిన్ని భాషలు జోడించబడతాయి.',
    },
    {
      id: 11,
      question: 'వార్తలను పంపించేందుకు నాకు డబ్బులు వస్తాయ్?',
      answer: 'అవును, ప్రతి ప్రచురించబడిన వార్తకు మీకు డబ్బు లభిస్తుంది. చెల్లింపు వ్యూస్, షేర్స్ మరియు కంటెంట్ క్వాలిటీపై ఆధారపడి ఉంటుంది.',
    },
    {
      id: 12,
      question: 'నేను వార్తను ముందర పంపవచ్చను, కాని వినిన్నీ కొళ్ళ విధ్వానికి అనుగణంగా ఆ వార్తను ఎదుకు ప్రమదరించేదెదు?',
      answer: 'వార్త మా కమ్యూనిటీ గైడ్‌లైన్స్‌కు అనుగుణంగా లేకపోవడం, తప్పుడు సమాచారం లేదా నాణ్యత ప్రమాణాలను చేరుకోకపోవడం వంటి కారణాల వల్ల తిరస్కరించబడవచ్చు.',
    },
    {
      id: 13,
      question: 'కథనాన్ని రక్షణా చేయద్దానికి చాల సమయం ఎందుకు పడుతుంది?',
      answer: 'ప్రతి కథనాన్ని నాణ్యత, ఖచ్చితత్వం మరియు గైడ్‌లైన్స్ పాటన కోసం మా మోడరేషన్ టీమ్ జాగ్రత్తగా రివ్యూ చేస్తుంది. ఇది మంచి కంటెంట్ ప్రమాణాలను నిర్వహించడానికి అవసరం.',
    },
    {
      id: 14,
      question: 'కథనాలు ఎక్కడుకు సంపణడుతున్నాయ్?',
      answer: 'కథనాలు మా యాప్‌లో మరియు వెబ్‌సైట్‌లో ప్రచురించబడతాయి. అధిక నాణ్యత కథనాలు మా సోషల్ మీడియా ఛానెల్స్‌లో కూడా షేర్ చేయబడతాయి.',
    },
  ];

  const toggleQuestion = (id) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  useEffect(()=>{
    dispatch(getProfile())
  },[])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Image
              source={{uri: 'https://i.pravatar.cc/150?img=33'}}
              style={styles.profileImage}
            />
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.guestText}>{reporter?.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.homeButton}>
            <Icon name="home-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Title */}
        <Text style={styles.sectionTitle}>పొస్ట్ చేయండి</Text>

        {/* Action Cards */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ReporterApp')}>
          <View style={styles.iconCircle}>
            <Icon name="microphone" size={28} color="#E74C3C" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>రిపోర్టర్ అవ్వండి</Text>
            <Text style={styles.actionSubtitle}>
              సున్నాన్ పోస్ట్ చేసి ఆదాయం పొందండి
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdFreeSubscription')}>
          <View style={[styles.iconCircle, {backgroundColor: '#FFE5E5'}]}>
            <Icon name="television" size={28} color="#E74C3C" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              ప్రాసికి ప్రకటనలు పోస్ట్ చేయండి
            </Text>
            <Text style={styles.actionSubtitle}>ఆదాయం పొందండి</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Tabs Section */}
        <Text style={styles.sectionTitle}>తరచుగా అడుగుతున్న ప్రశ్నలు</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'submitted' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('submitted')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'submitted' && styles.activeTabText,
              ]}>
              సున్నాన్ గురించి
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'published' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('published')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'published' && styles.activeTabText,
              ]}>
              ప్రకటన గురించి
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ List with Expandable Answers */}
        <View style={styles.questionsList}>
          {faqData.map((faq) => (
            <View key={faq.id} style={styles.faqContainer}>
              <TouchableOpacity
                style={styles.questionItem}
                activeOpacity={0.7}
                onPress={() => toggleQuestion(faq.id)}>
                <Text style={styles.questionText}>{faq.question}</Text>
                <Icon
                  name={expandedQuestion === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
              
              {expandedQuestion === faq.id && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
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
    backgroundColor: '#F5F6F8',
  },
  headerWrapper: {
    paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
  },
  welcomeSection: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  guestText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  homeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E8EAED',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#1A1A1A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  questionsList: {
    paddingHorizontal: 16,
  },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
    marginRight: 10,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default ReporterScreen;
