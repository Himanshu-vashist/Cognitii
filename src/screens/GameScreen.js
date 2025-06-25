import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const images = [
  { id: 1, src: 'http://192.168.253.130:3000/assets/bear.png', label: 'Bear' },
  { id: 2, src: 'http://192.168.253.130:3000/assets/lion.png', label: 'Lion' },
];

const words = [
  { id: 1, text: 'Bear' },
  { id: 2, text: 'Lion' },
];

function isMatched(matches, type, id) {
  return matches.some(m => m[type] === id);
}

export default function GameScreen({ navigation }) {
  const [matches, setMatches] = useState([]); // [{imageId, wordId}]
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const startTimeRef = useRef(Date.now());

  // Improved matching: select image, then word, then create match
  const handleImagePress = (id) => {
    setSelectedImage(id);
    setSelectedWord(null);
  };

  const handleWordPress = (id) => {
    if (selectedImage && !matches.find(m => m.imageId === selectedImage || m.wordId === id)) {
      setMatches([...matches, { imageId: selectedImage, wordId: id }]);
      setSelectedImage(null);
      setSelectedWord(null);
    } else {
      setSelectedWord(id);
    }
  };

  const handleNext = async () => {
    if (matches.length < 2) {
      Alert.alert('Complete the matches', 'Please match both images to words before continuing.');
      return;
    }
    // Calculate correct/incorrect
    let correct = 0;
    matches.forEach(match => {
      const img = images.find(i => i.id === match.imageId);
      const word = words.find(w => w.id === match.wordId);
      if (img && word && img.label === word.text) correct++;
    });
    const incorrect = matches.length - correct;
    const time = (Date.now() - startTimeRef.current) / 1000;
    // Save to Firestore
    try {
      await firestore().collection('scores').add({
        time,
        correct,
        incorrect,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Score saved to Firestore');
      Alert.alert('Success', 'Score saved to Firestore!');
    } catch (e) {
      console.error('Firestore error:', e);
      Alert.alert('Firestore Error', e.message || 'Failed to save score.');
    }
    navigation.replace('Success', { time, correct, incorrect });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Initial')}>
          <Text style={styles.icon}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>1/1</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>🔊</Text>
        </TouchableOpacity>
      </View>
      {/* Instruction */}
      <Text style={styles.title}>Can you match what goes together?</Text>
      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.col}>
          {images.map((img) => {
            const matched = isMatched(matches, 'imageId', img.id);
            return (
              <TouchableOpacity
                key={img.id}
                style={[
                  styles.imageBox,
                  selectedImage === img.id && styles.selected,
                  matched && styles.matched,
                ]}
                onPress={() => handleImagePress(img.id)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: img.src }} style={styles.image} />
                {matched && <Text style={styles.checkmark}>✔️</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.col}>
          {words.map((word) => {
            const matched = isMatched(matches, 'wordId', word.id);
            return (
              <TouchableOpacity
                key={word.id}
                style={[
                  styles.wordBox,
                  selectedWord === word.id && styles.selected,
                  matched && styles.matched,
                ]}
                onPress={() => handleWordPress(word.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.word}>{word.text}</Text>
                {matched && <Text style={styles.checkmark}>✔️</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Next Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.nextButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3C7',
    alignItems: 'center',
    paddingTop: 0,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 36,
    marginBottom: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  icon: {
    fontSize: 22,
  },
  progress: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    textAlign: 'center',
    width: '90%',
  },
  gameArea: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    minHeight: height * 0.5,
    marginTop: 10,
    marginBottom: 20,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginVertical: 22,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  image: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  wordBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginVertical: 22,
    paddingHorizontal: 36,
    paddingVertical: 22,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  word: {
    fontSize: 22,
    color: '#222',
    fontWeight: 'bold',
  },
  selected: {
    borderColor: '#6C63FF',
    backgroundColor: '#E6E4FF',
  },
  matched: {
    backgroundColor: '#D4F8E8',
    borderColor: '#4BB543',
    opacity: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 22,
    color: '#4BB543',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#FFB300',
    borderRadius: 32,
    padding: 22,
    position: 'absolute',
    bottom: 44,
    right: 36,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 