import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';

const { width } = Dimensions.get("window");

const UserCalledNumbers = ({ navigation, route }) => {
  const { gameName, calledNumbers, voiceType: initialVoiceType } = route.params;
  const [voiceType, setVoiceType] = useState(initialVoiceType || 'female');

  // Function to speak number
  const speakNumber = (number) => {
    Speech.stop();
    
    const numStr = number.toString();
    
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
    
    const speechText = `Number ${singleDigits} ${fullNumberName}`;
    
    const voiceConfig = {
      language: 'en-US',
      pitch: voiceType === 'male' ? 0.8 : 1.0,
      rate: 0.8,
    };
    
    Speech.speak(speechText, voiceConfig);
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

  const getCalledPosition = (number) => {
    const index = calledNumbers.indexOf(number);
    return index >= 0 ? index + 1 : null;
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
            <Text style={styles.pageTitle}>All Called Numbers</Text>
            <Text style={styles.gameInfo} numberOfLines={1}>
              {gameName}
            </Text>
          </View>

          <View style={styles.voiceButton}>
            <Ionicons 
              name={voiceType === 'male' ? "male" : "female"} 
              size={18} 
              color="#40E0D0" 
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calledNumbers.length}</Text>
            <Text style={styles.statLabel}>Total Called</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : '0'}
            </Text>
            <Text style={styles.statLabel}>Latest</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((calledNumbers.length / 90) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Numbers Grid */}
        <View style={styles.numbersGrid}>
          {calledNumbers.slice().reverse().map((number, index) => {
            const position = getCalledPosition(number);
            const isLatest = position === calledNumbers.length;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.numberCard,
                  isLatest && styles.latestNumberCard
                ]}
                onPress={() => speakNumber(number)}
                activeOpacity={0.8}
              >
                <View style={styles.numberHeader}>
                  <Text style={[
                    styles.number,
                    isLatest && styles.latestNumber
                  ]}>
                    {number}
                  </Text>
                  {isLatest && (
                    <View style={styles.latestBadge}>
                      <Ionicons name="star" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={styles.position}>#{position}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {getNumberName(number)}
                </Text>
                <View style={styles.voiceIndicator}>
                  <Ionicons name="volume-high" size={14} color="#40E0D0" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>
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
    padding: 16,
    paddingBottom: 40,
  },
  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#40E0D0",
  },
  gameInfo: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 4,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#40E0D0",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E9ECEF",
  },
  // Numbers Grid
  numbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  numberCard: {
    width: (width - 48) / 3, // 3 items per row with padding
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  latestNumberCard: {
    backgroundColor: "#40E0D0",
    borderColor: "#40E0D0",
  },
  numberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: 'relative',
  },
  number: {
    fontSize: 24,
    fontWeight: "800",
    color: "#212529",
  },
  latestNumber: {
    color: "#FFFFFF",
  },
  latestBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  position: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "600",
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 8,
  },
  voiceIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  bottomSpace: {
    height: 20,
  },
});

export default UserCalledNumbers;