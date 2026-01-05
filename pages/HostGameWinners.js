import React, { useState, useEffect } from "react";
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
  Image,
  Modal,
  RefreshControl,
  FlatList,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const TICKET_WIDTH = width - 80;
const CELL_SIZE = (TICKET_WIDTH - 40) / 9;

const HostGameWinners = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [winnersData, setWinnersData] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/claims/game/${gameId}/winners`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setWinnersData(response.data.data);
      } else {
        throw new Error("Failed to fetch winners");
      }
    } catch (error) {
      console.log("Error fetching winners:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to fetch winners"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWinners();
    setRefreshing(false);
  };

  const renderTicketGrid = (ticketData) => {
    return (
      <View style={styles.ticketGridContainer}>
        {/* Column Numbers (1-9) */}
        <View style={styles.columnNumbers}>
          {Array.from({ length: 9 }).map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.columnNumberCell}>
              <Text style={styles.columnNumberText}>{colIndex + 1}</Text>
            </View>
          ))}
        </View>

        {/* Ticket Rows */}
        {ticketData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cell, colIndex) => {
              const cellNumber = cell.number;
              const isMarked = cell.is_marked;
              const isEmpty = cellNumber === null;
              
              // Determine cell background color
              let cellBackgroundColor;
              if (isEmpty) {
                cellBackgroundColor = "#CCCCCC"; // Gray for empty cells
              } else if (isMarked) {
                cellBackgroundColor = "#FF5252"; // Red for marked cells
              } else {
                cellBackgroundColor = "#80CBC4"; // Medium turquoise for unmarked cells
              }
              
              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.ticketCell,
                    { backgroundColor: cellBackgroundColor },
                    isEmpty && styles.emptyCell,
                    isMarked && styles.markedCell,
                  ]}
                >
                  {!isEmpty && (
                    <View style={styles.cellContent}>
                      <Text style={[
                        styles.cellNumber,
                        { color: "#FFFFFF" },
                      ]}>
                        {cellNumber}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderWinnerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.winnerCard}
      onPress={() => {
        setSelectedWinner(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.winnerHeader}>
        <View style={styles.winnerProfile}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          <View style={styles.winnerInfo}>
            <Text style={styles.winnerName}>{item.user_name}</Text>
            <Text style={styles.winnerUsername}>@{item.username}</Text>
          </View>
        </View>
        <View style={styles.winnerBadge}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
        </View>
      </View>

      <View style={styles.winnerDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="ticket-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Ticket #{item.ticket_number}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="ribbon-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.reward_name}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#4CAF50" />
          <Text style={[styles.detailText, styles.winningAmount]}>
            ₹{item.winning_amount}
          </Text>
        </View>
      </View>

      <View style={styles.ticketPreview}>
        <View style={styles.ticketPreviewContainer}>
          <Text style={styles.ticketPreviewTitle}>Winning Ticket</Text>
          {renderTicketGrid(item.ticket_data)}
        </View>
      </View>

      <View style={styles.timeAgoContainer}>
        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
        <Text style={styles.timeAgoText}>
          Approved {item.time_since_approval}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const PatternWinnersCard = () => {
    if (!winnersData?.pattern_winners?.length) return null;

    return (
      <View style={styles.patternCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={24} color="#333" />
          <Text style={styles.sectionTitle}>Winning Patterns</Text>
        </View>
        
        <View style={styles.patternsContainer}>
          {winnersData.pattern_winners.map((pattern, index) => (
            <View key={index} style={styles.patternItem}>
              <View style={styles.patternHeader}>
                <View style={styles.patternNameContainer}>
                  <Ionicons name="sparkles" size={16} color="#FF9800" />
                  <Text style={styles.patternName}>
                    {pattern.pattern_name.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.patternBadge}>
                  <Text style={styles.patternBadgeText}>
                    {pattern.winner_count} winner{pattern.winner_count > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.patternStats}>
                <View style={styles.patternStat}>
                  <Text style={styles.patternStatLabel}>Total Amount</Text>
                  <Text style={styles.patternStatValue}>₹{pattern.total_amount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const SummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.summaryTitle}>Winners Summary</Text>
      </View>
      
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{winnersData?.total_winners || 0}</Text>
          <Text style={styles.summaryStatLabel}>Total Winners</Text>
        </View>
        
        <View style={styles.summaryStatDivider} />
        
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>₹{winnersData?.total_winnings || 0}</Text>
          <Text style={styles.summaryStatLabel}>Total Winnings</Text>
        </View>
        
        <View style={styles.summaryStatDivider} />
        
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{winnersData?.pattern_winners?.length || 0}</Text>
          <Text style={styles.summaryStatLabel}>Winning Patterns</Text>
        </View>
      </View>
    </View>
  );

  const WinnerModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Winner Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedWinner && (
              <>
                <View style={styles.modalWinnerInfo}>
                  <View style={styles.modalProfile}>
                    {selectedWinner.profile_image ? (
                      <Image
                        source={{ uri: selectedWinner.profile_image }}
                        style={styles.modalProfileImage}
                      />
                    ) : (
                      <View style={styles.modalProfileImagePlaceholder}>
                        <Ionicons name="person" size={32} color="#666" />
                      </View>
                    )}
                    <View style={styles.modalUserInfo}>
                      <Text style={styles.modalUserName}>{selectedWinner.user_name}</Text>
                      <Text style={styles.modalUserUsername}>@{selectedWinner.username}</Text>
                      <Text style={styles.modalUserTicket}>Ticket #{selectedWinner.ticket_number}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalPrizeInfo}>
                    <View style={styles.modalPrizeBadge}>
                      <Ionicons name="trophy" size={20} color="#FFD700" />
                      <Text style={styles.modalPrizeText}>{selectedWinner.reward_name}</Text>
                    </View>
                    <Text style={styles.modalPrizeAmount}>₹{selectedWinner.winning_amount}</Text>
                  </View>
                </View>
                
                <View style={styles.modalPatternInfo}>
                  <View style={styles.modalPatternItem}>
                    <Ionicons name="sparkles" size={16} color="#FF9800" />
                    <Text style={styles.modalPatternText}>
                      {selectedWinner.pattern_name.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalPatternItem}>
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.modalPatternText}>
                      Approved {selectedWinner.time_since_approval}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalTicketSection}>
                  <Text style={styles.modalTicketTitle}>Winning Ticket #{selectedWinner.ticket_number}</Text>
                  <View style={styles.modalTicketContainer}>
                    {renderTicketGrid(selectedWinner.ticket_data)}
                    
                    <View style={styles.ticketLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, styles.unmarkedColor]} />
                        <Text style={styles.legendText}>Unmarked</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, styles.markedColor]} />
                        <Text style={styles.legendText}>Marked (Winning)</Text>
                      </View>
                    </View>
                    
                    <View style={styles.patternInfo}>
                      <Ionicons name="sparkles" size={16} color="#FF9800" />
                      <Text style={styles.patternInfoText}>
                        Pattern: {selectedWinner.pattern_name.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Winners...</Text>
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
          <Text style={styles.headerSubtitle}>Game Winners</Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchWinners}
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
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {(!winnersData?.winners || winnersData.winners.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={80} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No Winners Yet</Text>
            <Text style={styles.emptyStateText}>
              There are no winners for this game yet. 
              Winners will appear here once claims are approved.
            </Text>
          </View>
        ) : (
          <>
            <SummaryCard />
            
            <PatternWinnersCard />
            
            <View style={styles.winnersSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={24} color="#333" />
                <Text style={styles.sectionTitle}>All Winners</Text>
                <View style={styles.winnersCountBadge}>
                  <Text style={styles.winnersCountText}>
                    {winnersData.total_winners} winners
                  </Text>
                </View>
              </View>
              
              <FlatList
                data={winnersData.winners}
                renderItem={renderWinnerItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.winnersList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </>
        )}
        
        <View style={styles.refreshHint}>
          <Ionicons name="arrow-down" size={14} color="#9CA3AF" />
          <Text style={styles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>

      <WinnerModal />
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
    paddingBottom: 20,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#666",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryStat: {
    alignItems: "center",
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  patternCard: {
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
  patternsContainer: {
    gap: 12,
  },
  patternItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  patternHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  patternNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  patternName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  patternBadge: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3498db",
  },
  patternStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patternStat: {
    alignItems: "center",
  },
  patternStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  patternStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  winnersSection: {
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
  winnersCountBadge: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  winnersCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3498db",
  },
  winnersList: {
    gap: 12,
  },
  winnerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  winnerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  winnerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  winnerUsername: {
    fontSize: 14,
    color: "#666",
  },
  winnerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3CD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  winnerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  winningAmount: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  ticketPreview: {
    marginBottom: 12,
  },
  ticketPreviewContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ticketPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  ticketGridContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  columnNumbers: {
    flexDirection: "row",
    marginBottom: 2,
  },
  columnNumberCell: {
    width: CELL_SIZE,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  columnNumberText: {
    fontSize: 11,
    color: "#666",
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
  timeAgoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  timeAgoText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContainer: {
    flex: 1,
    marginTop: 40,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  modalWinnerInfo: {
    marginBottom: 20,
  },
  modalProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  modalProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalProfileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  modalUserUsername: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalUserTicket: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "600",
  },
  modalPrizeInfo: {
    backgroundColor: "#FFF3CD",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  modalPrizeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalPrizeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  modalPrizeAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4CAF50",
    textAlign: "center",
  },
  modalPatternInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  modalPatternItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalPatternText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modalTicketSection: {
    marginBottom: 20,
  },
  modalTicketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  modalTicketContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ticketLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unmarkedColor: {
    backgroundColor: "#80CBC4",
  },
  markedColor: {
    backgroundColor: "#FF5252",
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  patternInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  patternInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalCloseButtonText: {
    color: "#FFF",
    fontSize: 16,
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
});

export default HostGameWinners;