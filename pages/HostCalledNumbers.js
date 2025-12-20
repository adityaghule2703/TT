// HostCalledNumbers.js
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
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HostCalledNumbers = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [gameStatus, setGameStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);

  useEffect(() => {
    fetchGameStatus();
  }, []);

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
        setCalledNumbers(data.numbers.called_numbers || []);
        setLoading(false);
      }
    } catch (error) {
      console.log("Error fetching game status:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to fetch called numbers");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameStatus();
    setRefreshing(false);
  };

  const showNumberDetails = (number) => {
    setSelectedNumber(number);
    setModalVisible(true);
  };

  const renderAllCalledNumbersList = () => {
    if (calledNumbers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color="#DDD" />
          <Text style={styles.emptyText}>No numbers called yet</Text>
          <Text style={styles.emptySubtext}>
            Start number calling from the game room to see called numbers here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.allNumbersListContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>All Called Numbers in Sequence</Text>
          <Text style={styles.listHeaderCount}>{calledNumbers.length} numbers</Text>
        </View>
        
        <ScrollView 
          style={styles.calledNumbersScroll}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.allNumbersGrid}>
            {calledNumbers.map((number, index) => (
              <TouchableOpacity
                key={index}
                style={styles.allNumberItem}
                onPress={() => showNumberDetails(number)}
                activeOpacity={0.7}
              >
                <View style={styles.allNumberItemContent}>
                  <View style={styles.allNumberTopRow}>
                    <View style={styles.sequenceContainer}>
                      <Text style={styles.sequenceText}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.allNumberValue}>{number}</Text>
                    <View style={styles.calledBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.calledBadgeText}>Called</Text>
                    </View>
                  </View>
                  <View style={styles.allNumberBottomRow}>
                    <Text style={styles.callTime}>Called {index + 1} in sequence</Text>
                    <View style={styles.numberIndicator}>
                      <Text style={styles.numberIndicatorText}>Number {number}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
              <View style={styles.modalNumberContainer}>
                <Text style={styles.modalNumber}>
                  {selectedNumber}
                </Text>
              </View>
              
              <Text style={styles.modalTitle}>
                {calledNumbers.includes(selectedNumber) ? 'Called Number' : 'Number Details'}
              </Text>
              
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={calledNumbers.includes(selectedNumber) ? "#4CAF50" : "#9CA3AF"} 
                  />
                  <Text style={[
                    styles.modalStatText,
                    calledNumbers.includes(selectedNumber) ? styles.calledText : styles.notCalledText
                  ]}>
                    {calledNumbers.includes(selectedNumber) ? 'Called' : 'Not Called'}
                  </Text>
                </View>
                
                {calledNumbers.includes(selectedNumber) && (
                  <View style={styles.modalStat}>
                    <Ionicons name="time-outline" size={24} color="#FF9800" />
                    <Text style={styles.modalStatText}>
                      Position: {calledNumbers.indexOf(selectedNumber) + 1}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.modalInfo}>
                <View style={styles.modalInfoItem}>
                  <Ionicons name="cube-outline" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>Number: {selectedNumber}</Text>
                </View>
                
                {calledNumbers.includes(selectedNumber) && (
                  <>
                    <View style={styles.modalInfoItem}>
                      <Ionicons name="list-outline" size={20} color="#666" />
                      <Text style={styles.modalInfoText}>
                        Called #{calledNumbers.indexOf(selectedNumber) + 1} of {calledNumbers.length}
                      </Text>
                    </View>
                    
                    <View style={styles.modalInfoItem}>
                      <Ionicons name="stats-chart-outline" size={20} color="#666" />
                      <Text style={styles.modalInfoText}>
                        {calledNumbers.length} of 90 numbers called
                      </Text>
                    </View>
                  </>
                )}
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
        <Text style={styles.loadingText}>Loading Called Numbers...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerSubtitle}>Called Numbers</Text>
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
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <MaterialCommunityIcons name="numeric" size={24} color="#2196F3" />
            <Text style={styles.statsTitle}>Called Numbers Overview</Text>
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
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Total Called</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="grid-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{90 - calledNumbers.length}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="stats-chart" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>
                {((calledNumbers.length / 90) * 100).toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(calledNumbers.length / 90) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {calledNumbers.length} of 90 numbers called ({((calledNumbers.length / 90) * 100).toFixed(1)}%)
          </Text>
        </View>

        {/* All Called Numbers List */}
        <View style={styles.numbersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color="#333" />
            <Text style={styles.sectionTitle}>All Called Numbers</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {calledNumbers.length} called
              </Text>
            </View>
          </View>
          
          <Text style={styles.sectionDescription}>
            Tap on any number to view details. Scroll to see all {calledNumbers.length} called numbers.
          </Text>
          
          {renderAllCalledNumbersList()}
          
          <TouchableOpacity
            style={styles.backToTopButton}
            onPress={() => {
              if (calledNumbers.length > 0) {
                showNumberDetails(calledNumbers[0]);
              }
            }}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#3498db" />
            <Text style={styles.backToTopText}>View First Number</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Back to Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={fetchGameStatus}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={() => {
              if (calledNumbers.length > 0) {
                showNumberDetails(calledNumbers[calledNumbers.length - 1]);
              } else {
                Alert.alert("Info", "No numbers have been called yet");
              }
            }}
          >
            <Ionicons name="megaphone-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Last Number</Text>
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
  statsCard: {
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
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  statsTitle: {
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
    marginBottom: 20,
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
  progressBar: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
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
    minHeight: 400,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
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
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  allNumbersListContainer: {
    flex: 1,
    height: 400,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  listHeaderCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  calledNumbersScroll: {
    flex: 1,
  },
  allNumbersGrid: {
    gap: 12,
    paddingBottom: 20,
  },
  allNumberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  allNumberItemContent: {
    flex: 1,
  },
  allNumberTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  sequenceContainer: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  sequenceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3498db",
  },
  allNumberValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
  },
  calledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF5015",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  calledBadgeText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
  },
  allNumberBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  callTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  numberIndicator: {
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  numberIndicatorText: {
    fontSize: 10,
    color: "#7E57C2",
    fontWeight: "600",
  },
  backToTopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E6F0FF",
    marginTop: 16,
  },
  backToTopText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
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
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryAction: {
    backgroundColor: "#FF9800",
  },
  tertiaryAction: {
    backgroundColor: "#9C27B0",
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
    alignSelf: "center",
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
    fontSize: 20,
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
    marginTop: 4,
  },
  calledText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  notCalledText: {
    color: "#9CA3AF",
  },
  modalInfo: {
    gap: 12,
    marginBottom: 24,
  },
  modalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#666",
  },
  modalCloseButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalCloseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default HostCalledNumbers;