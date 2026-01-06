import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const TICKET_WIDTH = width - 40;
const CELL_SIZE = (TICKET_WIDTH - 60) / 9;

const TicketsScreen = ({ route, navigation }) => {
  const { game } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sets: 0,
  });

  // Color scheme from UserGameRoom
  const PRIMARY_COLOR = "#40E0D0"; // Turquoise
  const SUCCESS_COLOR = "#4CAF50"; // Green
  const WARNING_COLOR = "#FFD700"; // Gold
  const DANGER_COLOR = "#FF5252"; // Red
  const GRAY_COLOR = "#6C757D"; // Gray
  const LIGHT_GRAY = "#F8F9FA"; // Light gray
  const BORDER_COLOR = "#E9ECEF"; // Border color
  const BACKGROUND_COLOR = "#FFFFFF"; // White
  const SECONDARY_COLOR = "#FF6B35"; // Orange

  const GAME_IMAGES = {
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    megaphone: "https://cdn-icons-png.flaticon.com/512/2599/2599562.png",
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const onRefresh = React.useCallback(() => {
    console.log("Refreshing tickets...");
    setRefreshing(true);
    fetchMyTickets().finally(() => {
      setRefreshing(false);
      console.log("Refresh complete");
    });
  }, []);

  const fetchMyTickets = async () => {
    console.log("fetchMyTickets called");
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      console.log("Token found:", token ? "Yes" : "No");
      
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      console.log("Tickets API Response:", res.data);
      
      if (res.data.success) {
        // Filter tickets for the current game if game prop exists
        const tickets = game
          ? res.data.tickets.data.filter((ticket) => ticket.game_id == game.id)
          : res.data.tickets.data;
        
        console.log("Filtered tickets:", tickets.length);
        setMyTickets(tickets);
        
        // Calculate stats
        const activeCount = tickets.filter(t => t.is_active).length;
        const setsCount = getTicketSetCount(tickets);
        
        setStats({
          total: tickets.length,
          active: activeCount,
          sets: setsCount,
        });
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
      console.log("Error response:", error.response?.data);
      Alert.alert("Error", error.response?.data?.message || "Failed to load your tickets");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert ticket_data to the format needed for rendering
  const processTicketData = (ticketData) => {
    if (!ticketData || !Array.isArray(ticketData)) return Array(3).fill(Array(9).fill(null));
    
    // Check if the data is in the new format (array of objects)
    if (ticketData[0] && Array.isArray(ticketData[0]) && ticketData[0][0] && typeof ticketData[0][0] === 'object') {
      // New format: array of objects with number property
      const processedGrid = Array(3).fill().map(() => Array(9).fill(null));
      
      ticketData.forEach((row) => {
        row.forEach((cell) => {
          if (cell && cell.number !== null && cell.row !== undefined && cell.column !== undefined) {
            processedGrid[cell.row][cell.column] = cell.number;
          }
        });
      });
      
      return processedGrid;
    } else if (ticketData[0] && Array.isArray(ticketData[0])) {
      // Old format: simple 2D array
      return ticketData.map(row => row.map(cell => cell));
    }
    
    return Array(3).fill(Array(9).fill(null));
  };

  const renderTicketGrid = (ticketData, isModal = false) => {
    const processedData = processTicketData(ticketData);
    const cellSize = isModal ? (TICKET_WIDTH - 60) / 9 : CELL_SIZE;
    
    return (
      <View style={[styles.ticketGridContainer, isModal && styles.modalTicketGrid]}>
        {/* Column Headers */}
        <View style={styles.columnNumbers}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <View key={`header-${num}`} style={[styles.columnNumberCell, { width: cellSize }]}>
              <Text style={styles.columnNumberText}>{num}</Text>
            </View>
          ))}
        </View>

        {/* Ticket rows */}
        {processedData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cell, colIndex) => {
              const isEmpty = cell === null;
              const cellBackgroundColor = isEmpty ? "#CCCCCC" : "#80CBC4"; // Turquoise for filled cells
              
              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.ticketCell,
                    { width: cellSize, height: cellSize, backgroundColor: cellBackgroundColor },
                    isEmpty && styles.emptyCell,
                    rowIndex === 0 && styles.firstRowCell,
                    rowIndex === 2 && styles.lastRowCell,
                    colIndex === 0 && styles.firstColumnCell,
                    colIndex === 8 && styles.lastColumnCell,
                  ]}
                >
                  {!isEmpty && (
                    <Text style={styles.cellNumber}>{cell}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => {
        setSelectedTicket(item);
        setModalVisible(true);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.cardPattern} />
      
      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.is_active ? '#4CAF5020' : '#6C757D20' }
      ]}>
        <Ionicons
          name={item.is_active ? "checkmark-circle" : "close-circle"}
          size={12}
          color={item.is_active ? SUCCESS_COLOR : GRAY_COLOR}
        />
        <Text style={[styles.statusText, { color: item.is_active ? SUCCESS_COLOR : GRAY_COLOR }]}>
          {item.is_active ? "Active" : "Inactive"}
        </Text>
      </View>

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
      </View>

      <View style={styles.ticketPreview}>
        {renderTicketGrid(item.ticket_data)}
      </View>

      <View style={styles.ticketCardFooter}>
        <View style={styles.ticketInfoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="collections" size={14} color={GRAY_COLOR} />
            <Text style={styles.infoLabel}>Set</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.ticket_set_id?.split("_")[1] || "N/A"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="date-range" size={14} color={GRAY_COLOR} />
            <Text style={styles.infoLabel}>Allocated</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {new Date(item.allocated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            setSelectedTicket(item);
            setModalVisible(true);
          }}
        >
          <Feather name="eye" size={14} color="#FFF" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Calculate ticket set count
  const getTicketSetCount = (tickets) => {
    const sets = new Set(tickets.map(t => t.ticket_set_id));
    return sets.size;
  };

  const StatCard = ({ icon, value, label, color = PRIMARY_COLOR }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: PRIMARY_COLOR }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    console.log("Showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrapper}>
            <MaterialIcons name="confirmation-number" size={40} color={PRIMARY_COLOR} />
          </View>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading your tickets...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Background Patterns */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>My Tickets</Text>
              {game && (
                <View style={styles.gameInfoContainer}>
                  <Ionicons name="game-controller" size={16} color={GRAY_COLOR} />
                  <Text style={styles.gameName} numberOfLines={1}>
                    {game.game_name || "Game"}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Stats Overview */}
          <View style={styles.statsOverview}>
            <StatCard 
              icon="confirmation-number" 
              value={stats.total} 
              label="Total" 
              color={PRIMARY_COLOR} 
            />
            <StatCard 
              icon="check-circle" 
              value={stats.active} 
              label="Active" 
              color={SUCCESS_COLOR} 
            />
            <StatCard 
              icon="collections" 
              value={stats.sets} 
              label="Sets" 
              color={PRIMARY_COLOR} 
            />
          </View>

          {/* Tickets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎫 Allocated Tickets</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{myTickets.length}</Text>
              </View>
            </View>

            {myTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Image
                  source={{ uri: GAME_IMAGES.empty }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Tickets Found</Text>
                <Text style={styles.emptySubtitle}>
                  {game
                    ? "You don't have any tickets for this game yet"
                    : "You haven't been allocated any tickets yet"}
                </Text>
                <TouchableOpacity
                  style={styles.refreshButtonLarge}
                  onPress={fetchMyTickets}
                >
                  <Ionicons name="refresh" size={18} color="#FFF" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ticketsList}>
                {myTickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketWrapper}>
                    {renderTicketItem({ item: ticket })}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bottom Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
            <Text style={styles.infoCardText}>
              • Active tickets are eligible for game participation{'\n'}
              • Each ticket has a unique number and belongs to a set{'\n'}
              • Tickets are automatically allocated for approved requests
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Ticket Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTicket && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <View style={styles.ticketNumberBadge}>
                      <Image
                        source={{ uri: GAME_IMAGES.ticket }}
                        style={styles.ticketNumberIcon}
                      />
                      <Text style={styles.ticketNumberBadgeText}>
                        #{selectedTicket.ticket_number}
                      </Text>
                    </View>
                    <View style={[
                      styles.modalStatusBadge,
                      { backgroundColor: selectedTicket.is_active ? '#4CAF5020' : '#6C757D20' }
                    ]}>
                      <Ionicons
                        name={selectedTicket.is_active ? "checkmark-circle" : "close-circle"}
                        size={12}
                        color={selectedTicket.is_active ? SUCCESS_COLOR : GRAY_COLOR}
                      />
                      <Text style={[styles.modalStatusText, { color: selectedTicket.is_active ? SUCCESS_COLOR : GRAY_COLOR }]}>
                        {selectedTicket.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  {/* <View style={styles.modalInfoGrid}>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoItem}>
                        <View style={styles.modalInfoIcon}>
                          <MaterialIcons name="collections" size={14} color={PRIMARY_COLOR} />
                        </View>
                        <View>
                          <Text style={styles.modalInfoLabel}>Ticket Set</Text>
                          <Text style={styles.modalInfoValue} numberOfLines={1}>
                            {selectedTicket.ticket_set_id || "N/A"}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.modalInfoItem}>
                        <View style={styles.modalInfoIcon}>
                          <MaterialIcons name="date-range" size={14} color={PRIMARY_COLOR} />
                        </View>
                        <View>
                          <Text style={styles.modalInfoLabel}>Allocated Date</Text>
                          <Text style={styles.modalInfoValue} numberOfLines={1}>
                            {new Date(selectedTicket.allocated_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.modalInfoItem}>
                      <View style={styles.modalInfoIcon}>
                        <MaterialIcons name="access-time" size={14} color={PRIMARY_COLOR} />
                      </View>
                      <View>
                        <Text style={styles.modalInfoLabel}>Allocated Time</Text>
                        <Text style={styles.modalInfoValue} numberOfLines={1}>
                          {new Date(selectedTicket.allocated_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View> */}

                  {selectedTicket.game && (
                    <View style={styles.gameCard}>
                      <View style={styles.gameCardHeader}>
                        <Ionicons name="game-controller" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.gameCardTitle}>Game Details</Text>
                      </View>
                      <View style={styles.gameCardContent}>
                        <Text style={styles.gameNameText} numberOfLines={2}>
                          {selectedTicket.game.game_name}
                        </Text>
                        <View style={styles.gameDetailsRow}>
                          <View style={styles.gameDetailItem}>
                            <Feather name="hash" size={12} color={GRAY_COLOR} />
                            <Text style={styles.gameCodeText}>
                              {selectedTicket.game.game_code}
                            </Text>
                          </View>
                          <View style={styles.gameDetailItem}>
                            <Feather name="calendar" size={12} color={GRAY_COLOR} />
                            <Text style={styles.gameTimeText}>
                              {new Date(selectedTicket.game.game_date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.fullTicketContainer}>
                    <Text style={styles.ticketGridTitle}>Ticket Grid</Text>
                    <View style={styles.fullTicketGrid}>
                      {renderTicketGrid(selectedTicket.ticket_data, true)}
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
    marginTop: 20,
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#40E0D0",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  gameInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gameName: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
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
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  statsOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    marginTop: -15,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "600",
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  countBadge: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  ticketsList: {
    gap: 12,
  },
  ticketWrapper: {
    marginBottom: 8,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
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
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ticketCardHeader: {
    marginBottom: 12,
  },
  ticketNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#FFFFFF",
  },
  emptyCell: {
    backgroundColor: "#CCCCCC",
  },
  firstRowCell: {
    borderTopWidth: 2,
    borderTopColor: "#374151",
  },
  lastRowCell: {
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
  },
  firstColumnCell: {
    borderLeftWidth: 2,
    borderLeftColor: "#374151",
  },
  lastColumnCell: {
    borderRightWidth: 2,
    borderRightColor: "#374151",
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ticketCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketInfoRow: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: "flex-start",
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
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#40E0D0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  refreshButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#40E0D0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  refreshButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 20,
  },
  bottomSpace: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 0,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    backgroundColor: "#40E0D0",
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: 'wrap',
  },
  ticketNumberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  ticketNumberIcon: {
    width: 16,
    height: 16,
    tintColor: "#FFF",
  },
  ticketNumberBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalInfoGrid: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalInfoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  modalInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  modalInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalInfoLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  gameCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  gameCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  gameCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212529",
  },
  gameCardContent: {
    gap: 8,
  },
  gameNameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    lineHeight: 20,
  },
  gameDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: 'wrap',
  },
  gameDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gameCodeText: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  gameTimeText: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  fullTicketContainer: {
    marginBottom: 20,
  },
  ticketGridTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
    textAlign: 'center',
  },
  fullTicketGrid: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
  },
  modalTicketGrid: {
    // Additional styles for modal grid if needed
  },
  modalActions: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  closeModalButton: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default TicketsScreen;