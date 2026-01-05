import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Image,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';

const { width } = Dimensions.get("window");
const TICKET_WIDTH = width - 40;
const CELL_SIZE = (TICKET_WIDTH - 60) / 9;

const UserGameRoom = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [callingStatus, setCallingStatus] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [markingLoading, setMarkingLoading] = useState(false);
  const [voiceType, setVoiceType] = useState('female'); // 'female' or 'male'
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const lastCalledRef = useRef(null);

  const GAME_IMAGES = {
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    live: "https://cdn-icons-png.flaticon.com/512/2809/2809645.png",
    users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    megaphone: "https://cdn-icons-png.flaticon.com/512/2599/2599562.png",
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    voice: "https://cdn-icons-png.flaticon.com/512/727/727240.png",
  };

  // Load saved voice preference
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

  const saveVoicePreference = async (type) => {
    try {
      await AsyncStorage.setItem('voiceType', type);
      setVoiceType(type);
      setShowVoiceModal(false);
    } catch (error) {
      console.log("Error saving voice preference:", error);
    }
  };

  useEffect(() => {
    fetchGameStatus();
    fetchMyTickets();
    checkChatStatus();

    const statusInterval = setInterval(fetchGameStatus, 10000);

    return () => {
      clearInterval(statusInterval);
      Speech.stop();
    };
  }, []);

  // Function to speak number in different formats
  const speakNumber = (number) => {
    Speech.stop();
    
    // Convert number to string
    const numStr = number.toString();
    
    // Format: "Number two five twenty-five"
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
    
    // Get the full number name (1-90)
    const fullNumberName = getNumberName(number);
    
    // Combine both formats
    const speechText = `Number ${singleDigits} ${fullNumberName}`;
    
    // Configure voice based on selection
    const voiceConfig = {
      language: 'en-US',
      pitch: voiceType === 'male' ? 0.8 : 1.0,
      rate: 0.8,
    };
    
    // For iOS/Android, we can try to set voice if available
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

  useEffect(() => {
    if (calledNumbers.length > 0) {
      const latestNumber = calledNumbers[calledNumbers.length - 1];
      
      if (lastCalledRef.current !== latestNumber) {
        lastCalledRef.current = latestNumber;
        
        setTimeout(() => {
          speakNumber(latestNumber);
        }, 500);
      }
    }
  }, [calledNumbers]);

  const checkChatStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setParticipantCount(response.data.total_participants || 0);
        const tokenData = await AsyncStorage.getItem("user");
        if (tokenData) {
          const user = JSON.parse(tokenData);
          const isParticipant = response.data.data.some(p => p.id === user.id);
          setIsChatJoined(isParticipant);
        }
      }
    } catch (error) {
      console.log("Error checking chat status:", error);
    }
  };

  const joinChat = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setIsChatJoined(true);
        setParticipantCount(response.data.participant_count || 1);
        navigation.navigate('UserLiveChat', {
          gameId,
          gameName,
          participantCount: response.data.participant_count || 1
        });
      }
    } catch (error) {
      console.log("Error joining chat:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameStatus();
    await fetchMyTickets();
    await checkChatStatus();
    setRefreshing(false);
  };

  const fetchGameStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/${gameId}/calling-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        setGameStatus(data.game);
        setCallingStatus(data.calling);
        setCalledNumbers(data.numbers.called_numbers || []);
        setLoading(false);
      }
    } catch (error) {
      console.log("Error fetching game status:", error);
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const tickets = res.data.tickets.data.filter((ticket) => ticket.game_id === parseInt(gameId));
        setMyTickets(tickets);
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
    }
  };

  const markNumberOnTicket = async (ticketId, number) => {
    try {
      setMarkingLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/tickets/mark-multiple",
        {
          ticket_marks: [
            {
              ticket_id: ticketId,
              numbers: [number]
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      // Update the ticket in state
      setMyTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.id === ticketId) {
            const updatedTicketData = ticket.ticket_data.map(row =>
              row.map(cell => {
                if (cell.number === number) {
                  return { ...cell, is_marked: true };
                }
                return cell;
              })
            );
            
            return { 
              ...ticket, 
              ticket_data: updatedTicketData 
            };
          }
          return ticket;
        })
      );
      
    } catch (error) {
      console.log("Error marking number:", error);
    } finally {
      setMarkingLoading(false);
    }
  };

  const handleNumberClick = async (ticketId, cellNumber) => {
    if (cellNumber === null || markingLoading) return;
    
    // Mark the number immediately
    await markNumberOnTicket(ticketId, cellNumber);
  };

  const renderTicketGrid = (ticketData, ticketId) => {
    return (
      <View style={styles.ticketGridContainer}>
        <View style={styles.columnNumbers}>
          {Array.from({ length: 9 }).map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.columnNumberCell}>
              <Text style={styles.columnNumberText}>{colIndex + 1}</Text>
            </View>
          ))}
        </View>

        {ticketData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cellObj, colIndex) => {
              const cellNumber = cellObj.number;
              const isMarked = cellObj.is_marked;
              const isEmpty = cellNumber === null;
              
              // Determine cell background color - KEEPING SAME COLORS BUT WITH BETTER CONTRAST
              let cellBackgroundColor;
              if (isEmpty) {
                cellBackgroundColor = "#CCCCCC"; // Gray for empty cells
              } else if (isMarked) {
                cellBackgroundColor = "#FF5252"; // Red for marked cells
              } else {
                cellBackgroundColor = "#80CBC4"; // Medium turquoise for unmarked cells (darker for better contrast)
              }
              
              return (
                <TouchableOpacity
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.ticketCell,
                    { backgroundColor: cellBackgroundColor },
                    isEmpty && styles.emptyCell,
                    isMarked && styles.markedCell,
                  ]}
                  onPress={() => handleNumberClick(ticketId, cellNumber)}
                  onLongPress={() => cellNumber && speakNumber(cellNumber)}
                  disabled={isEmpty || markingLoading || isMarked}
                >
                  {!isEmpty && (
                    <View style={styles.cellContent}>
                      <Text style={[
                        styles.cellNumber,
                        { color: "#FFFFFF" }, // White text for all numbers
                      ]}>
                        {cellNumber}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

// Inside UserGameRoom component, update the renderTicketItem function:

const renderTicketItem = ({ item }) => (
  <View style={styles.ticketCard}>
    <View style={styles.cardPattern} />
    
    <View style={styles.ticketCardHeader}>
      <View style={styles.ticketNumberContainer}>
        <Image
          source={{ uri: GAME_IMAGES.ticket }}
          style={styles.ticketIcon}
        />
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketLabel}>Ticket Number</Text>
          <Text style={styles.ticketNumber}>#{item.ticket_number}</Text>
        </View>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.is_active ? '#4CAF5020' : '#9E9E9E20' }
      ]}>
        <Ionicons
          name="checkmark-circle"
          size={12}
          color={item.is_active ? "#4CAF50" : "#9E9E9E"}
        />
        <Text
          style={[
            styles.statusText,
            { color: item.is_active ? "#4CAF50" : "#9E9E9E" },
          ]}
        >
          {item.is_active ? "Active" : "Inactive"}
        </Text>
      </View>
    </View>

    <View style={styles.ticketPreview}>
      {renderTicketGrid(item.ticket_data, item.id)}
    </View>

    <View style={styles.ticketCardFooter}>
      <View style={styles.ticketInfoRow}>
        <View style={styles.infoItem}>
          <MaterialIcons name="games" size={14} color="#6C757D" />
          <Text style={styles.infoLabel}>Set</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.ticket_set_id.split("_")[1]}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="date-range" size={14} color="#6C757D" />
          <Text style={styles.infoLabel}>Allocated</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {new Date(item.allocated_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="grid" size={14} color="#6C757D" />
          <Text style={styles.infoLabel}>Marked</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.ticket_data.flat().filter(cell => cell.is_marked).length}
          </Text>
        </View>
      </View>
    </View>

    {/* ADDED SUBMIT CLAIM BUTTON */}
    <TouchableOpacity
      style={styles.submitClaimButton}
      onPress={() => navigation.navigate('UserGameClaim', {
        gameId,
        gameName,
        ticketId: item.id,
        ticketNumber: item.ticket_number,
        gameData: gameStatus // Pass the game data which contains pattern rewards
      })}
    >
      <Ionicons name="trophy-outline" size={16} color="#FFF" />
      <Text style={styles.submitClaimButtonText}>Submit Claim</Text>
    </TouchableOpacity>
  </View>
);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Game Room...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Voice Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVoiceModal}
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Voice Type</Text>
              <TouchableOpacity
                onPress={() => setShowVoiceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Choose your preferred voice for number announcements
            </Text>
            
            <TouchableOpacity
              style={[
                styles.voiceOption,
                voiceType === 'female' && styles.selectedVoiceOption
              ]}
              onPress={() => saveVoicePreference('female')}
            >
              <View style={styles.voiceOptionIcon}>
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={voiceType === 'female' ? "#40E0D0" : "#6C757D"} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Female Voice</Text>
                <Text style={styles.voiceOptionDesc}>Higher pitch, clear pronunciation</Text>
              </View>
              {voiceType === 'female' && (
                <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.voiceOption,
                voiceType === 'male' && styles.selectedVoiceOption
              ]}
              onPress={() => saveVoicePreference('male')}
            >
              <View style={styles.voiceOptionIcon}>
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={voiceType === 'male' ? "#40E0D0" : "#6C757D"} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Male Voice</Text>
                <Text style={styles.voiceOptionDesc}>Lower pitch, deeper tone</Text>
              </View>
              {voiceType === 'male' && (
                <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testVoiceButton}
              onPress={() => {
                if (calledNumbers.length > 0) {
                  speakNumber(calledNumbers[calledNumbers.length - 1]);
                } else {
                  speakNumber(25); // Test with number 25
                }
              }}
            >
              <Ionicons name="volume-high" size={20} color="#FFF" />
              <Text style={styles.testVoiceButtonText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.gameName} numberOfLines={1}>
              {gameName}
            </Text>
            <View style={styles.gameCodeContainer}>
              <Ionicons name="game-controller" size={16} color="#6C757D" />
              <Text style={styles.gameCode}>Game Room</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => setShowVoiceModal(true)}
            >
              <Image
                source={{ uri: GAME_IMAGES.voice }}
                style={styles.voiceButtonIcon}
              />
              <Text style={styles.voiceButtonText}>
                {voiceType === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={20} color="#40E0D0" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Patterns */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Game Status Card */}
          <View style={styles.card}>
            <View style={styles.cardPattern} />
            
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: GAME_IMAGES.live }}
                style={styles.cardHeaderImage}
              />
              <Text style={styles.cardTitle}>Live Game Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: '#4CAF5020' }
              ]}>
                <Ionicons name="radio-button-on" size={12} color="#4CAF50" />
                <Text style={[styles.statusBadgeText, { color: "#4CAF50" }]}>
                  LIVE
                </Text>
              </View>
            </View>
            
            <Text style={styles.cardDescription}>
              The game is now live! Number calling has started.
            </Text>

            {calledNumbers.length > 0 ? (
              <View>
                {/* Last Called Number */}
                <View style={styles.lastNumberSection}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={{ uri: GAME_IMAGES.megaphone }}
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>Last Called Number</Text>
                    <TouchableOpacity
                      style={styles.voiceIndicator}
                      onPress={() => setShowVoiceModal(true)}
                    >
                      <Ionicons 
                        name={voiceType === 'male' ? "male" : "female"} 
                        size={16} 
                        color="#40E0D0" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.lastNumberContainer}
                    onPress={() => speakNumber(calledNumbers[calledNumbers.length - 1])}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.lastNumber}>
                      {calledNumbers[calledNumbers.length - 1]}
                    </Text>
                    <Text style={styles.lastNumberLabel}>
                      Tap to hear • Current voice: {voiceType}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Stats Container */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <View style={styles.statIcon}>
                      <Ionicons name="grid" size={18} color="#40E0D0" />
                    </View>
                    <Text style={styles.statValue}>{calledNumbers.length}</Text>
                    <Text style={styles.statLabel}>Total Called</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={styles.statIcon}>
                      <Ionicons name="hourglass" size={18} color="#40E0D0" />
                    </View>
                    <Text style={styles.statValue}>
                      {calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : '0'}
                    </Text>
                    <Text style={styles.statLabel}>Latest</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={styles.statIcon}>
                      <Ionicons name="stats-chart" size={18} color="#40E0D0" />
                    </View>
                    <Text style={styles.statValue}>
                      {calledNumbers.length > 1 ? calledNumbers[calledNumbers.length - 2] : '0'}
                    </Text>
                    <Text style={styles.statLabel}>Previous</Text>
                  </View>
                </View>

                {/* Recent Numbers */}
                <View style={styles.recentNumbersSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={20} color="#40E0D0" />
                    <Text style={styles.sectionTitle}>Recent Numbers</Text>
                  </View>
                  
                  <View style={styles.recentNumbersGrid}>
                    {calledNumbers.slice(-8).reverse().map((num, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.numberChip,
                          index === 0 && styles.latestChip
                        ]}
                        onPress={() => speakNumber(num)}
                      >
                        <Text style={[
                          styles.numberChipText,
                          index === 0 && styles.latestChipText
                        ]}>
                          {num}
                        </Text>
                        {index === 0 && (
                          <Ionicons name="volume-high" size={12} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.waitingSection}>
                <Ionicons name="hourglass-outline" size={40} color="#FFD700" />
                <Text style={styles.waitingText}>
                  Waiting for numbers to be called...
                </Text>
              </View>
            )}
          </View>

          {/* My Tickets Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image
                source={{ uri: GAME_IMAGES.ticket }}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>My Tickets</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{myTickets.length}</Text>
              </View>
            </View>

            {myTickets.length === 0 ? (
              <View style={styles.emptyTicketsContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.empty }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Tickets Allocated</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't been allocated any tickets for this game yet
                </Text>
              </View>
            ) : (
              <>
                {/* Tickets Stats */}
                <View style={styles.ticketsStatsCard}>
                  <View style={styles.ticketStatItem}>
                    <Image
                      source={{ uri: GAME_IMAGES.ticket }}
                      style={styles.ticketStatImage}
                    />
                    <Text style={styles.ticketStatValue}>{myTickets.length}</Text>
                    <Text style={styles.ticketStatLabel}>Total</Text>
                  </View>
                  <View style={styles.ticketStatItem}>
                    <Image
                      source={{ uri: GAME_IMAGES.diamond }}
                      style={styles.ticketStatImage}
                    />
                    <Text style={styles.ticketStatValue}>
                      {myTickets.filter((t) => t.is_active).length}
                    </Text>
                    <Text style={styles.ticketStatLabel}>Active</Text>
                  </View>
                  <View style={styles.ticketStatItem}>
                    <Image
                      source={{ uri: GAME_IMAGES.celebrate }}
                      style={styles.ticketStatImage}
                    />
                    <Text style={styles.ticketStatValue}>
                      {new Set(myTickets.map((t) => t.ticket_set_id)).size}
                    </Text>
                    <Text style={styles.ticketStatLabel}>Sets</Text>
                  </View>
                </View>

                {/* Tickets List */}
                <View style={styles.ticketsList}>
                  {myTickets.map((ticket) => (
                    <View key={ticket.id} style={styles.ticketWrapper}>
                      {renderTicketItem({ item: ticket })}
                    </View>
                  ))}
                </View>

                <Text style={styles.ticketsHint}>
                  Tap numbers to mark them • Long press to hear number • Current voice: {voiceType}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Bottom Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={joinChat}
        activeOpacity={0.9}
      >
        <View style={styles.chatButtonContent}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
          {participantCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>
                {participantCount > 99 ? '99+' : participantCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.chatButtonText}>
          {isChatJoined ? 'Live Chat' : 'Join Chat'}
        </Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  backgroundPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
  },
  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    flex: 1,
  },
  gameName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#40E0D0",
    letterSpacing: -0.5,
  },
  gameCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  gameCode: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 4,
  },
  voiceButtonIcon: {
    width: 16,
    height: 16,
  },
  voiceButtonText: {
    fontSize: 12,
    color: "#40E0D0",
    fontWeight: "600",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  voiceIndicator: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
    lineHeight: 20,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  selectedVoiceOption: {
    borderColor: '#40E0D0',
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  voiceOptionIcon: {
    marginRight: 16,
  },
  voiceOptionInfo: {
    flex: 1,
  },
  voiceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  voiceOptionDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40E0D0',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  testVoiceButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardHeaderImage: {
    width: 24,
    height: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 16,
  },
  // Last Number Section
  lastNumberSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    width: 20,
    height: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  lastNumberContainer: {
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#40E0D0",
  },
  lastNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: "#40E0D0",
    marginBottom: 4,
  },
  lastNumberLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: 'center',
  },
  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "500",
  },
  // Recent Numbers
  recentNumbersSection: {
    marginBottom: 0,
  },
  recentNumbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  numberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  latestChip: {
    backgroundColor: "#40E0D0",
    borderColor: "#40E0D0",
  },
  numberChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
  },
  latestChipText: {
    color: "#FFFFFF",
  },
  // Waiting Section
  waitingSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: "#FF6B35",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  // Count Badge
  countBadge: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  // Empty Tickets
  emptyTicketsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  // Tickets Stats
  ticketsStatsCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  ticketStatItem: {
    flex: 1,
    alignItems: "center",
  },
  ticketStatImage: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  ticketStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 2,
  },
  ticketStatLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "600",
  },
  // Tickets List
  ticketsList: {
    gap: 12,
  },
  ticketWrapper: {
    marginBottom: 8,
  },
  ticketCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  ticketIcon: {
    width: 24,
    height: 24,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 10,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 2,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  ticketPreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  ticketGridContainer: {
    alignItems: "center",
  },
  columnNumbers: {
    flexDirection: "row",
    marginBottom: 2,
  },
  columnNumberCell: {
    width: CELL_SIZE,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  columnNumberText: {
    fontSize: 10,
    color: "#6C757D",
    fontWeight: "600",
  },
  ticketRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  ticketCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#FFFFFF",
  },
  emptyCell: {
    backgroundColor: "#CCCCCC",
  },
  markedCell: {
    backgroundColor: "#FF5252",
    borderColor: "#FF5252",
  },
  cellContent: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ticketCardFooter: {
    marginTop: 4,
  },
  ticketInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6C757D",
    marginTop: 2,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212529",
  },
  ticketsHint: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
  bottomSpace: {
    height: 20,
  },
  // Floating Chat Button
  floatingChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#40E0D0',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chatButtonContent: {
    position: 'relative',
    marginRight: 8,
  },
  chatBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  // Add to the styles section:
submitClaimButton: {
  backgroundColor: "#FF6B35",
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 12,
  gap: 8,
  borderWidth: 1,
  borderColor: '#FF6B35',
},
submitClaimButtonText: {
  color: "#FFF",
  fontSize: 14,
  fontWeight: "600",
},
});

export default UserGameRoom;