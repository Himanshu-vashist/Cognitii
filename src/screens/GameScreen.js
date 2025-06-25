import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, Animated } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

// Pool of all possible pairs
const PAIRS_POOL = [
  { id: 1, src: 'http://192.168.253.130:3000/assets/bear.png', label: 'Bear' },
  { id: 2, src: 'http://192.168.253.130:3000/assets/lion.png', label: 'Lion' },
  { id: 3, src: 'http://192.168.253.130:3000/assets/hippo.png', label: 'Hippo' },
  { id: 4, src: 'http://192.168.253.130:3000/assets/apple.png', label: 'Apple' },
  { id: 5, src: 'http://192.168.253.130:3000/assets/ball.jpg', label: 'Ball' },
];

const PAIRS_PER_ROUND = 4;
const TOTAL_ROUNDS = 3;
const ROUND_TIME = 30; // seconds

function shuffleArray(array) {
  return array
    .map((a) => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map((a) => a[1]);
}

function isMatched(matches, type, id) {
  return matches.some(m => m[type] === id);
}

export default function GameScreen({ navigation }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState([]); // [{imageId, wordId, correct}]
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [imageSet, setImageSet] = useState([]); // Current round images
  const [wordSet, setWordSet] = useState([]); // Current round words
  const [timer, setTimer] = useState(ROUND_TIME);
  const [feedback, setFeedback] = useState({}); // {imageId/wordId: 'correct'|'incorrect'}
  const timerRef = useRef();
  const startTimeRef = useRef(Date.now());

  // Animations for feedback
  const shakeAnim = useRef({});
  imageSet.forEach(img => {
    if (!shakeAnim.current[img.id]) shakeAnim.current[img.id] = new Animated.Value(0);
  });
  wordSet.forEach(word => {
    if (!shakeAnim.current[word.id]) shakeAnim.current[word.id] = new Animated.Value(0);
  });

  // Setup round
  useEffect(() => {
    const shuffled = shuffleArray(PAIRS_POOL).slice(0, PAIRS_PER_ROUND);
    setImageSet(shuffleArray(shuffled));
    setWordSet(shuffleArray(shuffled.map(p => ({ id: p.id, text: p.label }))));
    setMatches([]);
    setSelectedImage(null);
    setSelectedWord(null);
    setFeedback({});
    setTimer(ROUND_TIME);
    startTimeRef.current = Date.now();
  }, [round]);

  // Timer logic
  useEffect(() => {
    if (timer <= 0) {
      handleNext();
      return;
    }
    timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  // Feedback animation
  const triggerShake = (id) => {
    Animated.sequence([
      Animated.timing(shakeAnim.current[id], { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim.current[id], { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim.current[id], { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  // Matching logic
  const handleImagePress = (id) => {
    setSelectedImage(id);
    setSelectedWord(null);
  };

  const handleWordPress = (id) => {
    if (selectedImage && !matches.find(m => m.imageId === selectedImage || m.wordId === id)) {
      const img = imageSet.find(i => i.id === selectedImage);
      const word = wordSet.find(w => w.id === id);
      const correct = img && word && img.label === word.text;
      setMatches([...matches, { imageId: selectedImage, wordId: id, correct }]);
      setSelectedImage(null);
      setSelectedWord(null);
      setFeedback(fb => ({ ...fb, [selectedImage]: correct ? 'correct' : 'incorrect', [id]: correct ? 'correct' : 'incorrect' }));
      if (correct) {
        setScore(s => s + 10);
      } else {
        setScore(s => (s > 0 ? s - 5 : 0));
        triggerShake(selectedImage);
        triggerShake(id);
      }
    } else {
      setSelectedWord(id);
    }
  };

  // Next round or finish
  const handleNext = async () => {
    if (round < TOTAL_ROUNDS) {
      setRound(r => r + 1);
    } else {
      // Calculate total correct/incorrect
      const totalCorrect = matches.filter(m => m.correct).length;
      const totalIncorrect = matches.length - totalCorrect;
      const time = (Date.now() - startTimeRef.current) / 1000;
      try {
        await firestore().collection('scores').add({
          time,
          correct: totalCorrect,
          incorrect: totalIncorrect,
          score,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Success', 'Score saved to Firestore!');
      } catch (e) {
        Alert.alert('Firestore Error', e.message || 'Failed to save score.');
      }
      navigation.replace('Success', { time, correct: totalCorrect, incorrect: totalIncorrect, score });
    }
  };

  // Progress
  const progressText = `Round ${round} / ${TOTAL_ROUNDS}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Initial')}>
          <Text style={styles.icon}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{progressText}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>🔊</Text>
        </TouchableOpacity>
      </View>
      {/* Timer & Score */}
      <View style={styles.statusRow}>
        <Text style={styles.timer}>⏰ {timer}s</Text>
        <Text style={styles.score}>⭐ {score}</Text>
      </View>
      {/* Instruction */}
      <Text style={styles.title}>Can you match what goes together?</Text>
      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.col}>
          {imageSet.map((img) => {
            const matched = isMatched(matches, 'imageId', img.id);
            const shake = shakeAnim.current[img.id] || new Animated.Value(0);
            return (
              <Animated.View
                key={img.id}
                style={{
                  transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.imageBox,
                    selectedImage === img.id && styles.selected,
                    matched && (feedback[img.id] === 'correct' ? styles.matched : styles.incorrect),
                  ]}
                  onPress={() => handleImagePress(img.id)}
                  activeOpacity={0.8}
                  disabled={matched}
                >
                  <Image source={{ uri: img.src }} style={styles.image} />
                  {matched && feedback[img.id] === 'correct' && <Text style={styles.checkmark}>✔️</Text>}
                  {matched && feedback[img.id] === 'incorrect' && <Text style={styles.crossmark}>✖️</Text>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        <View style={styles.col}>
          {wordSet.map((word) => {
            const matched = isMatched(matches, 'wordId', word.id);
            const shake = shakeAnim.current[word.id] || new Animated.Value(0);
            return (
              <Animated.View
                key={word.id}
                style={{
                  transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.wordBox,
                    selectedWord === word.id && styles.selected,
                    matched && (feedback[word.id] === 'correct' ? styles.matched : styles.incorrect),
                  ]}
                  onPress={() => handleWordPress(word.id)}
                  activeOpacity={0.8}
                  disabled={matched}
                >
                  <Text style={styles.word}>{word.text}</Text>
                  {matched && feedback[word.id] === 'correct' && <Text style={styles.checkmark}>✔️</Text>}
                  {matched && feedback[word.id] === 'incorrect' && <Text style={styles.crossmark}>✖️</Text>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
      {/* Next Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.nextButtonText}>{round < TOTAL_ROUNDS ? 'Next' : 'Finish'}</Text>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 8,
  },
  timer: {
    fontSize: 18,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  score: {
    fontSize: 18,
    color: '#4BB543',
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
    marginVertical: 14,
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
    marginVertical: 14,
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
  incorrect: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF5252',
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
  crossmark: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 22,
    color: '#FF5252',
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
    fontSize: 28,
    fontWeight: 'bold',
  },
}); 