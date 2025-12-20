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
  Alert,
  Animated,
  Modal,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const HostGameRoom = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [numberCallingStatus, setNumberCallingStatus] = useState(null);
  const [timer, setTimer] = useState(60); // Always starts at 60
  const [nextCallTime, setNextCallTime] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [startingAutoMode, setStartingAutoMode] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNumber, setModalNumber] = useState(null);
  const [intervalModalVisible, setIntervalModalVisible] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState("60");
  
  const timerInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const lastFetchTime = useRef(null);

  useEffect(() => {
    fetchGameStatus();
    startPulseAnimation();

    // Set up interval to fetch status every 10 seconds
    const statusInterval = setInterval(fetchGameStatus, 10000);

    return () => {
      clearInterval(statusInterval);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (numberCallingStatus?.is_running && !numberCallingStatus?.is_paused) {
      startTimer();
    } else {
      // Clear timer when paused or not running
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
  }, [numberCallingStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameStatus();
    setRefreshing(false);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Start from 60 and count down
    setTimer(60);

    timerInterval.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          // When timer reaches 0, fetch new status
          fetchGameStatus();
          return 60; // Reset to 60
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const fetchGameStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/number-calling/status`,
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
        setNumberCallingStatus(data.calling);
        setCalledNumbers(data.numbers.called_numbers || []);
        
        // If game is running and not paused, start/reset timer
        if (data.calling?.is_running && !data.calling?.is_paused) {
          lastFetchTime.current = Date.now();
          
          // Start the timer if not already running
          if (!timerInterval.current) {
            startTimer();
          } else {
            // If timer is already running, reset it to 60
            setTimer(60);
          }
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.log("Error fetching game status:", error);
      setLoading(false);
    }
  };

  const initializeNumberCalling = async () => {
    if (!intervalSeconds || parseInt(intervalSeconds) < 5) {
      Alert.alert("Error", "Please enter a valid interval (minimum 5 seconds)");
      return;
    }

    try {
      setInitializing(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/number-calling/initialize`,
        { interval_seconds: 60 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Number calling initialized successfully!");
        setIntervalModalVisible(false);
        fetchGameStatus();
      } else {
        throw new Error("Failed to initialize number calling");
      }
    } catch (error) {
      console.log("Error initializing number calling:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to initialize number calling"
      );
    } finally {
      setInitializing(false);
    }
  };

  const openInitializeModal = () => {
    setIntervalSeconds("60");
    setIntervalModalVisible(true);
  };

  const startAutoNumberCalling = async () => {
    try {
      setStartingAutoMode(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/number-calling/start-auto`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Auto number calling started!");
        fetchGameStatus();
      } else {
        throw new Error("Failed to start auto number calling");
      }
    } catch (error) {
      console.log("Error starting auto number calling:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to start auto number calling"
      );
    } finally {
      setStartingAutoMode(false);
    }
  };

  const pauseNumberCalling = async () => {
    try {
      setPausing(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/number-calling/pause`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Number calling paused!");
        
        // Clear timer when paused
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
        
        fetchGameStatus();
      } else {
        throw new Error("Failed to pause number calling");
      }
    } catch (error) {
      console.log("Error pausing number calling:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to pause number calling"
      );
    } finally {
      setPausing(false);
    }
  };

  const resumeNumberCalling = async () => {
    try {
      setResuming(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/number-calling/resume`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Number calling resumed!");
        
        // Start timer when resumed
        if (numberCallingStatus?.is_initialized && !timerInterval.current) {
          startTimer();
        }
        
        fetchGameStatus();
      } else {
        throw new Error("Failed to resume number calling");
      }
    } catch (error) {
      console.log("Error resuming number calling:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to resume number calling"
      );
    } finally {
      setResuming(false);
    }
  };

  const showNumberModal = (number) => {
    setModalNumber(number);
    setModalVisible(true);
    
    numberAnim.setValue(0);
    Animated.spring(numberAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const navigateToCalledNumbers = () => {
    navigation.navigate("HostCalledNumbers", {
      gameId: gameId,
      gameName: gameName,
      calledNumbers: calledNumbers,
    });
  };

  const renderNumberGrid = () => {
    const numbers = [];
    for (let i = 1; i <= 90; i++) {
      const isCalled = calledNumbers.includes(i);
      
      numbers.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.numberCell,
            isCalled && styles.calledNumberCell,
          ]}
          onPress={() => showNumberModal(i)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.numberText,
            isCalled && styles.calledNumberText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.numberGrid}>
        {numbers}
      </View>
    );
  };

  const IntervalModal = () => (
    <Modal
      visible={intervalModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !initializing && setIntervalModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Interval Time</Text>
              <TouchableOpacity
                onPress={() => !initializing && setIntervalModalVisible(false)}
                disabled={initializing}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.intervalInputContainer}>
              <Ionicons name="time-outline" size={24} color="#3498db" />
              <TextInput
                style={styles.intervalInput}
                placeholder="Enter interval in seconds"
                keyboardType="numeric"
                value={intervalSeconds}
                onChangeText={setIntervalSeconds}
                maxLength={3}
                editable={!initializing}
              />
            </View>
            
            <Text style={styles.intervalHint}>
              Note: Currently backend uses fixed 60 seconds interval regardless of input.
            </Text>
            
            <View style={styles.intervalExamples}>
              <View style={styles.intervalExample}>
                <Ionicons name="time-outline" size={16} color="#FF9800" />
                <Text style={styles.intervalExampleText}>Current: 60 seconds</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.modalButton,
                initializing && styles.modalButtonDisabled
              ]}
              onPress={initializeNumberCalling}
              disabled={initializing}
            >
              {initializing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>
                    Initialize with 60 seconds interval
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const NumberModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <Animated.View style={[
                styles.modalNumberContainer,
                {
                  transform: [
                    { scale: numberAnim },
                    { rotate: numberAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })}
                  ]
                }
              ]}>
                <Text style={styles.modalNumber}>
                  {modalNumber}
                </Text>
              </Animated.View>
              
              <Text style={styles.modalTitle}>
                {calledNumbers.includes(modalNumber) ? 'Called Number' : 'Available Number'}
              </Text>
              
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="checkmark-circle" size={20} color={calledNumbers.includes(modalNumber) ? "#4CAF50" : "#9CA3AF"} />
                  <Text style={styles.modalStatText}>
                    {calledNumbers.includes(modalNumber) ? 'Called' : 'Not Called'}
                  </Text>
                </View>
                
                <View style={styles.modalStat}>
                  <Ionicons name="time-outline" size={20} color="#FF9800" />
                  <Text style={styles.modalStatText}>
                    Position: {modalNumber}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Game Room...</Text>
      </View>
    );
  }

  const isInitialized = numberCallingStatus?.is_initialized;
  const isRunning = numberCallingStatus?.is_running;
  const isPaused = numberCallingStatus?.is_paused;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{gameName}</Text>
          <Text style={styles.headerSubtitle}>Game Room</Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchGameStatus}
        >
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3498db"
            colors={["#3498db"]}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Game Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons name="broadcast" size={24} color="#2196F3" />
            <Text style={styles.statusTitle}>Game Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: gameStatus?.status === 'live' ? '#4CAF5015' : '#FF980015' }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: gameStatus?.status === 'live' ? '#4CAF50' : '#FF9800' }
              ]}>
                {gameStatus?.status?.toUpperCase() || 'LOADING'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="ticket-outline" size={20} color="#9C27B0" />
              <Text style={styles.statValue}>{calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Called</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="grid-outline" size={20} color="#2196F3" />
              <Text style={styles.statValue}>{90 - calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{timer}s</Text>
              <Text style={styles.statLabel}>Next Call</Text>
            </View>
          </View>
        </View>

        {/* Number Calling Controls */}
        {!isInitialized ? (
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Ionicons name="play-circle-outline" size={24} color="#666" />
              <Text style={styles.controlTitle}>Initialize Number Calling</Text>
            </View>
            <Text style={styles.controlDescription}>
              Initialize the number calling system to start calling numbers automatically with 60 seconds interval.
            </Text>
            <TouchableOpacity
              style={[
                styles.controlButton,
                initializing && styles.controlButtonDisabled
              ]}
              onPress={openInitializeModal}
              disabled={initializing}
            >
              {initializing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#FFF" />
                  <Text style={styles.controlButtonText}>Initialize System</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : isRunning && !isPaused ? (
          <Animated.View style={[
            styles.controlCard,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <View style={styles.controlHeader}>
              <Ionicons name="radio" size={24} color="#4CAF50" />
              <Text style={styles.controlTitle}>Number Calling Active</Text>
            </View>
            <Text style={styles.controlDescription}>
              Auto number calling is running. Next number in {timer} seconds.
              {"\n"}Timer: {timer}s / 60s
            </Text>
            <View style={styles.timerDisplay}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.timerText}>{timer}s</Text>
            </View>
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton, pausing && styles.controlButtonDisabled]}
              onPress={pauseNumberCalling}
              disabled={pausing}
            >
              {pausing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="pause-circle" size={18} color="#FFF" />
                  <Text style={styles.controlButtonText}>Pause Calling</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : isPaused ? (
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Ionicons name="pause-circle" size={24} color="#FF9800" />
              <Text style={styles.controlTitle}>Number Calling Paused</Text>
            </View>
            <Text style={styles.controlDescription}>
              Number calling is currently paused. Tap resume to continue calling numbers.
              {"\n"}Interval: 60 seconds
            </Text>
            <View style={[styles.timerDisplay, styles.pausedTimerDisplay]}>
              <Ionicons name="pause-circle" size={20} color="#FF5722" />
              <Text style={[styles.timerText, styles.pausedTimerText]}>PAUSED</Text>
            </View>
            <TouchableOpacity
              style={[styles.controlButton, styles.resumeButton, resuming && styles.controlButtonDisabled]}
              onPress={resumeNumberCalling}
              disabled={resuming}
            >
              {resuming ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={18} color="#FFF" />
                  <Text style={styles.controlButtonText}>Resume Calling</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Ionicons name="play-circle" size={24} color="#4CAF50" />
              <Text style={styles.controlTitle}>Start Auto Number Calling</Text>
            </View>
            <Text style={styles.controlDescription}>
              Start automatic number calling with 60 seconds intervals.
            </Text>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.startButton,
                startingAutoMode && styles.controlButtonDisabled
              ]}
              onPress={startAutoNumberCalling}
              disabled={startingAutoMode}
            >
              {startingAutoMode ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.controlButtonText}>Start Auto Calling</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Last Called Number */}
        {calledNumbers.length > 0 && (
          <View style={styles.lastCalledCard}>
            <View style={styles.lastCalledHeader}>
              <Ionicons name="megaphone-outline" size={24} color="#9C27B0" />
              <Text style={styles.lastCalledTitle}>Last Called Number</Text>
            </View>
            
            <TouchableOpacity
              style={styles.lastNumberContainer}
              onPress={() => showNumberModal(calledNumbers[calledNumbers.length - 1])}
              activeOpacity={0.8}
            >
              <Text style={styles.lastNumber}>
                {calledNumbers[calledNumbers.length - 1]}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.calledSequence}>
              <Text style={styles.calledSequenceTitle}>Recently Called:</Text>
              <View style={styles.calledSequenceNumbers}>
                {calledNumbers.slice(-5).reverse().map((num, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sequenceNumber}
                    onPress={() => showNumberModal(num)}
                  >
                    <Text style={styles.sequenceNumberText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={navigateToCalledNumbers}
              >
                <Text style={styles.loadMoreText}>View All Called Numbers</Text>
                <Ionicons name="chevron-forward" size={16} color="#3498db" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Numbers Grid */}
        <View style={styles.numbersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={24} color="#333" />
            <Text style={styles.sectionTitle}>All Numbers (1-90)</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {calledNumbers.length}/90 called
              </Text>
            </View>
          </View>
          
          {renderNumberGrid()}
          
          <Text style={styles.numbersHint}>
            Tap on any number to view details. Called numbers are highlighted in green.
          </Text>
        </View>

        {/* Game Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("HostTicketRequests", {
              gameId: gameId,
              gameName: gameName,
            })}
          >
            <Ionicons name="ticket-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Ticket Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => navigation.navigate("HostGameUsers", {
              gameId: gameId,
              gameName: gameName,
            })}
          >
            <Ionicons name="people-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Players List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={navigateToCalledNumbers}
          >
            <Ionicons name="list-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Called Numbers</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.refreshHint}>
          <Ionicons name="arrow-down" size={14} color="#9CA3AF" />
          <Text style={styles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>

      <IntervalModal />
      <NumberModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  controlCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  controlHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  controlDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  pauseButton: {
    backgroundColor: "#FF5722",
  },
  resumeButton: {
    backgroundColor: "#4CAF50",
  },
  controlButtonDisabled: {
    opacity: 0.7,
  },
  controlButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: "#FF9800",
    marginBottom: 16,
  },
  pausedTimerDisplay: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FF5722",
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF9800",
  },
  pausedTimerText: {
    color: "#FF5722",
  },
  lastCalledCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  lastCalledHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  lastCalledTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  lastNumberContainer: {
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    padding: 30,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#7E57C2",
  },
  lastNumber: {
    fontSize: 72,
    fontWeight: "900",
    color: "#7E57C2",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  calledSequence: {
    marginTop: 8,
  },
  calledSequenceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  calledSequenceNumbers: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sequenceNumber: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  sequenceNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E6F0FF",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
  },
  numbersSection: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3498db",
  },
  numberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  numberCell: {
    width: (width - 80) / 10,
    height: (width - 80) / 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  calledNumberCell: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  numberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  calledNumberText: {
    color: "#FFF",
    fontWeight: "700",
  },
  numbersHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  actionsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9C27B0",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryAction: {
    backgroundColor: "#FF9800",
  },
  tertiaryAction: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  refreshHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
    gap: 6,
  },
  refreshHintText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalCloseArea: {
    width: "100%",
  },
  modalNumberContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#7E57C2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#7E57C2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FFF",
  },
  modalStats: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  modalStat: {
    alignItems: "center",
  },
  modalStatText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  intervalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  intervalInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    paddingVertical: 4,
  },
  intervalHint: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
    textAlign: "center",
    fontStyle: "italic",
    color: "#FF9800",
  },
  intervalExamples: {
    marginBottom: 24,
    gap: 8,
  },
  intervalExample: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intervalExampleText: {
    fontSize: 14,
    color: "#666",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HostGameRoom;