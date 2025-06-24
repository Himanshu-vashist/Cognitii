import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const GameScreen = ({ navigation }) => {
  const [assets, setAssets] = useState([]);
  const [shuffledAssets, setShuffledAssets] = useState([]);
  const [oddOneOut, setOddOneOut] = useState(null);
  const [correctAsset, setCorrectAsset] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/assets')
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          Alert.alert('Error', 'No assets found on the server. Please make sure the server is running and assets are available.');
          setLoading(false);
          return;
        }
        setAssets(data);
        setupGame(data);
        setStartTime(new Date());
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Server Error', 'Could not connect to the asset server. Please make sure it is running.');
        setLoading(false);
      });
  }, []);

  const setupGame = (currentAssets) => {
    if (currentAssets.length < 2) return;

    let oddOneOutIndex = Math.floor(Math.random() * currentAssets.length);
    let correctAssetIndex = Math.floor(Math.random() * currentAssets.length);
    while (correctAssetIndex === oddOneOutIndex) {
      correctAssetIndex = Math.floor(Math.random() * currentAssets.length);
    }

    const oddAsset = currentAssets[oddOneOutIndex];
    const correct = currentAssets[correctAssetIndex];
    setOddOneOut(oddAsset);
    setCorrectAsset(correct);

    let newShuffledAssets = [correct, correct, correct, oddAsset];
    newShuffledAssets.sort(() => Math.random() - 0.5);
    setShuffledAssets(newShuffledAssets);
  };

  const handlePress = (asset) => {
    const endTime = new Date();
    const timeTaken = (endTime - startTime) / 1000;

    if (asset === oddOneOut) {
      const newScore = { ...score, correct: score.correct + 1 };
      setScore(newScore);
      firestore()
        .collection('scores')
        .add({
          time: timeTaken,
          correct: newScore.correct,
          incorrect: newScore.incorrect,
          createdAt: firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          navigation.navigate('Success', {
            time: timeTaken,
            correct: newScore.correct,
            incorrect: newScore.incorrect,
          });
        });
    } else {
      const newScore = { ...score, incorrect: score.incorrect + 1 };
      setScore(newScore);
      Alert.alert('Incorrect!', 'Please try again.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find the odd one out</Text>
      <View style={styles.grid}>
        {shuffledAssets.map((asset, index) => (
          <TouchableOpacity key={index} onPress={() => handlePress(asset)}>
            <Image source={{ uri: asset }} style={styles.image} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  image: {
    width: 150,
    height: 150,
    margin: 10,
  },
});

export default GameScreen; 