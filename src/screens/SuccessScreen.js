import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SuccessScreen({ route, navigation }) {
  const { time, correct, incorrect } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Great Job!</Text>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>Time Taken</Text>
        <Text style={styles.scoreValue}>{time ? time.toFixed(2) : '--'}s</Text>
        <Text style={styles.scoreLabel}>Correct</Text>
        <Text style={[styles.scoreValue, styles.correct]}>{correct ?? '--'}</Text>
        <Text style={styles.scoreLabel}>Incorrect</Text>
        <Text style={[styles.scoreValue, styles.incorrect]}>{incorrect ?? '--'}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Game')}>
        <Text style={styles.buttonText}>Play Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 28,
  },
  scoreBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 36,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  correct: {
    color: '#4BB543',
  },
  incorrect: {
    color: '#FF5252',
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 32,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
}); 