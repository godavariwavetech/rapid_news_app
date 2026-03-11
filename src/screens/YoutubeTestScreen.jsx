import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const YoutubeTestScreen = () => {
  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  const onStateChange = useCallback((state) => {
    console.log("TEST SCREEN STATE:", state);
    setStatus(state);
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>YouTube Player Test</Text>
      
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          height={200}
          play={playing}
          videoId={"dQw4w9WgXcQ"}
          onChangeState={onStateChange}
          onReady={() => {
            console.log("TEST SCREEN READY");
            setIsReady(true);
          }}
          onError={(e) => console.log("TEST SCREEN ERROR:", e)}
        />
        {!isReady && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Text style={styles.status}>Status: {status}</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: playing ? '#FF5252' : '#4CAF50' }]} 
          onPress={togglePlaying}
        >
          <Text style={styles.buttonText}>{playing ? "PAUSE" : "PLAY"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  status: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default YoutubeTestScreen;
