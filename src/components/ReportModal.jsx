import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { reportNews } from '../redux/reducers/news';
import { lightTheme, darkTheme } from '../config/theme';

const REPORT_REASONS = [
  { label: "Fake News", value: "FAKE_NEWS" },
  { label: "Hate Speech", value: "HATE_SPEECH" },
  { label: "Misleading", value: "MISLEADING" },
  { label: "Violence", value: "VIOLENCE" },
  { label: "Spam", value: "SPAM" },
  { label: "Other", value: "OTHER" },
];

const ReportModal = ({ visible, onClose, newsId }) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [reason, setReason] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!reason) {
      Alert.alert("సమాచారం", "దయచేసి ఒక కారణాన్ని ఎంచుకోండి (Select a reason)");
      return;
    }

    setSubmitting(true);
    const result = await dispatch(reportNews({ newsId, reason, message }));
    setSubmitting(false);

    if (reportNews.fulfilled.match(result)) {
      Alert.alert("ధన్యవాదాలు", "మీ రిపోర్ట్ పంపబడింది. మేము దీనిని పరిశీలిస్తాము.");
      onClose();
      setReason(null);
      setMessage('');
    } else {
      Alert.alert("Error", result?.payload?.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={[styles.sheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Report this Content</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>దయచేసి కారణాన్ని ఎంచుకోండి:</Text>
          
          <View style={styles.grid}>
            {REPORT_REASONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f9f9f9', borderColor: isDarkMode ? '#333' : '#eee' }, reason === item.value && styles.activeChip]}
                onPress={() => setReason(item.value)}
              >
                <Text style={[styles.chipText, { color: isDarkMode ? '#CCC' : '#555' }, reason === item.value && styles.activeChipText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F2F2F2', color: theme.text }]}
            placeholder="Tell us more about the issue (Optional)..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: isDarkMode ? theme.primary : '#1a1a1a' }, !reason && styles.disabledBtn]} 
            onPress={handleReport}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  label: { fontSize: 14, color: '#666', marginBottom: 15, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9' },
  activeChip: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  activeChipText: { color: '#FFF' },
  input: { backgroundColor: '#F2F2F2', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', color: '#333' },
  submitBtn: { backgroundColor: '#1a1a1a', marginTop: 25, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  disabledBtn: { backgroundColor: '#ccc' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default ReportModal;