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
  Animated,
  Modal,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const UserGameRoom = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [callingStatus, setCallingStatus] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNumber, setModalNumber] = useState(null);
  
  const numberAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGameStatus();

    // Set up interval to fetch status every 10 seconds
    const statusInterval = setInterval(fetchGameStatus, 10000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameStatus();
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

  const fetchCalledNumbers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/${gameId}/called-numbers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        setCalledNumbers(data.called_numbers || []);
      }
    } catch (error) {
      console.log("Error fetching called numbers:", error);
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
          disabled={!isCalled} // Only allow clicking called numbers
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
                  <Ionicons name="hash" size={20} color="#FF9800" />
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
        <ActivityIndicator size="large" color="#FF7675" />
        <Text style={styles.loadingText}>Loading Game Room...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FF7675" barStyle="light-content" />

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
            tintColor="#FF7675"
            colors={["#FF7675"]}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Game Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="game-controller" size={24} color="#FF7675" />
            <Text style={styles.statusTitle}>Game Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: gameStatus?.status === 'live' ? '#4CAF5020' : '#FF980020' }
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
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Called</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{90 - calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="grid" size={20} color="#2196F3" />
              <Text style={styles.statValue}>90</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Last Called Number */}
        {calledNumbers.length > 0 ? (
          <View style={styles.lastCalledCard}>
            <View style={styles.lastCalledHeader}>
              <Ionicons name="megaphone" size={24} color="#9C27B0" />
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
                onPress={fetchCalledNumbers}
              >
                <Text style={styles.loadMoreText}>Refresh Called Numbers</Text>
                <Ionicons name="refresh" size={16} color="#FF7675" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noNumbersCard}>
            <View style={styles.noNumbersHeader}>
              <Ionicons name="hourglass-outline" size={24} color="#FF9800" />
              <Text style={styles.noNumbersTitle}>Waiting for Numbers</Text>
            </View>
            <Text style={styles.noNumbersText}>
              No numbers have been called yet. The game will start soon!
            </Text>
            <View style={styles.waitingAnimation}>
              <Ionicons name="game-controller-outline" size={40} color="#FFD700" />
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
            Called numbers are highlighted in green. Tap on called numbers to view details.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate("TicketsScreen", {
              gameId: gameId,
              gameName: gameName,
            })}
          >
            <Ionicons name="ticket-outline" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>My Tickets</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionSecondary]}
            onPress={() => navigation.navigate("TicketRequestsScreen", {
              gameId: gameId,
              gameName: gameName,
            })}
          >
            <Ionicons name="list-outline" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>My Requests</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.refreshHint}>
          <Ionicons name="arrow-down" size={14} color="#9CA3AF" />
          <Text style={styles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>

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
    backgroundColor: "#FF7675",
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
    color: "#2196F3",
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
    color: "#FF7675",
  },
  noNumbersCard: {
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
    alignItems: "center",
  },
  noNumbersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  noNumbersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  noNumbersText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  waitingAnimation: {
    padding: 20,
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
    color: "#2196F3",
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
  quickActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7675",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#FF7675",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionSecondary: {
    backgroundColor: "#2196F3",
  },
  quickActionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
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
    backgroundColor: "#FF7675",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserGameRoom;