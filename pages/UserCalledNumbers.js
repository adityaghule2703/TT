import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';

const { width } = Dimensions.get("window");
// Calculate size based on 10 items per row with proper spacing
const CELL_SIZE = Math.min((width - 40) / 10 - 4, 36); // Reduced padding and size

const UserCalledNumbers = ({ navigation, route }) => {
  const { calledNumbers } = route.params;
  const [voiceType, setVoiceType] = useState('female');
  const [speaking, setSpeaking] = useState(false);
  const [activeNumber, setActiveNumber] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadVoicePreference();
  }, []);

  const loadVoicePreference = async () => {
    try {
      const savedVoice = await AsyncStorage.getItem('voiceType');
      if (savedVoice) {
        setVoiceType(savedVoice);
      }
    } catch (error) {
      console.log("Error loading voice preference:", error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const speakNumber = async (number) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      setActiveNumber(null);
      stopPulseAnimation();
      return;
    }

    Speech.stop();
    setSpeaking(true);
    setActiveNumber(number);
    startPulseAnimation();

    const numStr = number.toString();
    
    if (numStr.length === 1) {
      const digitWord = getSingleDigitWord(number);
      const speechText = `Single digit ${digitWord}`;
      
      const voiceConfig = {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.8 : 1.0,
        rate: 0.8,
        onDone: () => {
          setSpeaking(false);
          setActiveNumber(null);
          stopPulseAnimation();
        }
      };
      
      Speech.speak(speechText, voiceConfig);
      return;
    }
    
    const singleDigits = numStr.split('').map(digit => {
      switch(digit) {
        case '0': return 'zero';
        case '1': return 'one';
        case '2': return 'two';
        case '3': return 'three';
        case '4': return 'four';
        case '5': return 'five';
        case '6': return 'six';
        case '7': return 'seven';
        case '8': return 'eight';
        case '9': return 'nine';
        default: return digit;
      }
    }).join(' ');
    
    const fullNumberName = getNumberName(number);
    
    const digitsSpeechText = `Number ${singleDigits}`;
    const digitsVoiceConfig = {
      language: 'en-US',
      pitch: voiceType === 'male' ? 0.8 : 1.0,
      rate: 0.8,
      onDone: () => {
        setTimeout(() => {
          const fullNameVoiceConfig = {
            language: 'en-US',
            pitch: voiceType === 'male' ? 0.9 : 1.1,
            rate: 0.9,
            volume: 1.0,
            onDone: () => {
              setSpeaking(false);
              setActiveNumber(null);
              stopPulseAnimation();
            }
          };
          Speech.speak(fullNumberName, fullNameVoiceConfig);
        }, 100);
      }
    };
    
    Speech.speak(digitsSpeechText, digitsVoiceConfig);
  };

  const getSingleDigitWord = (num) => {
    switch(num) {
      case 1: return 'one';
      case 2: return 'two';
      case 3: return 'three';
      case 4: return 'four';
      case 5: return 'five';
      case 6: return 'six';
      case 7: return 'seven';
      case 8: return 'eight';
      case 9: return 'nine';
      default: return 'zero';
    }
  };

  const getNumberName = (num) => {
    const numberNames = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
      6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
      11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
      16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
      21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
      26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
      31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
      36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
      41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
      46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
      51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
      56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
      61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
      66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
      71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five',
      76: 'seventy-six', 77: 'seventy-seven', 78: 'seventy-eight', 79: 'seventy-nine', 80: 'eighty',
      81: 'eighty-one', 82: 'eighty-two', 83: 'eighty-three', 84: 'eighty-four', 85: 'eighty-five',
      86: 'eighty-six', 87: 'eighty-seven', 88: 'eighty-eight', 89: 'eighty-nine', 90: 'ninety'
    };
    
    return numberNames[num] || num.toString();
  };

  const renderNumberGrid = () => {
    const rows = [];
    
    // Create rows of 10 numbers each
    for (let row = 0; row < 9; row++) {
      const rowNumbers = [];
      for (let col = 1; col <= 10; col++) {
        const number = row * 10 + col;
        const isCalled = calledNumbers.includes(number);
        const isActive = activeNumber === number;
        
        rowNumbers.push(
          <TouchableOpacity
            key={number}
            style={[
              styles.numberCell,
              isCalled && styles.calledNumberCell,
              isActive && styles.activeNumberCell,
            ]}
            onPress={() => speakNumber(number)}
            disabled={!isCalled && !isActive}
            activeOpacity={isCalled ? 0.7 : 1}
          >
            <Text style={[
              styles.numberText,
              isCalled && styles.calledNumberText,
              isActive && styles.activeNumberText,
            ]}>
              {number}
            </Text>
            {isActive && (
              <Animated.View 
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.3, 0]
                    })
                  }
                ]} 
              />
            )}
          </TouchableOpacity>
        );
      }
      
      rows.push(
        <View key={row} style={styles.numberRow}>
          {rowNumbers}
        </View>
      );
    }

    return (
      <View style={styles.numberGrid}>
        {rows}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#40E0D0" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.gameName}>Called Numbers</Text>
            <Text style={styles.gameCode}>
              {calledNumbers.length}/90 Numbers Called
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* All Numbers Grid Section */}
          <View style={styles.numbersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Numbers (1-90)</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {calledNumbers.length}/90
                </Text>
              </View>
            </View>
            
            {renderNumberGrid()}
          </View>

          {/* Bottom Space */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10, // Reduced from 12
  },
  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingHorizontal: 15, // Reduced from 20
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Reduced from 15
  },
  backButton: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Reduced from 12
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    flex: 1,
  },
  gameName: {
    fontSize: 22, // Reduced from 24
    fontWeight: "700",
    color: "#212529",
    letterSpacing: -0.5,
  },
  gameCode: {
    fontSize: 13, // Reduced from 14
    color: "#6C757D",
    fontWeight: "500",
    marginTop: 2,
  },
  // Numbers Section
  numbersSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Reduced from 16
    padding: 12, // Reduced from 16
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12, // Reduced from 16
  },
  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: "700",
    color: "#212529",
  },
  sectionBadge: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 4, // Reduced from 6
    borderRadius: 10, // Reduced from 12
  },
  sectionBadgeText: {
    fontSize: 11, // Reduced from 12
    fontWeight: "700",
    color: "#FFF",
  },
  // Number Grid - FIXED FOR NO OVERFLOW
  numberGrid: {
    gap: 4, // Reduced from 6
  },
  numberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4, // Reduced from 6
    marginBottom: 4, // Added margin between rows
  },
  numberCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 6, // Reduced from 8
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  calledNumberCell: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  activeNumberCell: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    zIndex: 10,
  },
  numberText: {
    fontSize: 12, // Reduced from 14
    fontWeight: "600",
    color: "#6C757D",
  },
  calledNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  activeNumberText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  pulseRing: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6, // Reduced from 8
    backgroundColor: '#FF6B35',
    zIndex: 9,
  },
  bottomSpace: {
    height: 20,
  },
});

export default UserCalledNumbers;