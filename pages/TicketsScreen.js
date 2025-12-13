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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const TICKET_WIDTH = width - 40;
const CELL_SIZE = (TICKET_WIDTH - 40) / 9;

const TicketsScreen = ({ route, navigation }) => {
  const { game } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const GAME_IMAGES = {
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMyTickets().finally(() => setRefreshing(false));
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Filter tickets for the current game if game prop exists
        const tickets = game
          ? res.data.tickets.data.filter((ticket) => ticket.game_id === game.id)
          : res.data.tickets.data;
        setMyTickets(tickets);
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
      Alert.alert("Error", "Failed to load your tickets");
    } finally {
      setLoading(false);
    }
  };

  const renderTicketGrid = (ticketData) => {
    return (
      <View style={styles.ticketGridContainer}>
        {/* Column numbers */}
        <View style={styles.columnNumbers}>
          {Array.from({ length: 9 }).map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.columnNumberCell}>
              <Text style={styles.columnNumberText}>{colIndex + 1}</Text>
            </View>
          ))}
        </View>

        {/* Ticket rows */}
        {ticketData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cell, colIndex) => (
              <View
                key={`cell-${rowIndex}-${colIndex}`}
                style={[
                  styles.ticketCell,
                  cell !== null && styles.filledCell,
                  rowIndex === 0 && styles.firstRowCell,
                  rowIndex === 2 && styles.lastRowCell,
                ]}
              >
                {cell !== null && (
                  <Text
                    style={[
                      styles.cellNumber,
                      getCellColor(cell, colIndex + 1),
                    ]}
                  >
                    {cell}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const getCellColor = (number, column) => {
    const colors = {
      1: "#FF5252", // Red for 1-9
      2: "#FF9800", // Orange for 10-19
      3: "#FFEB3B", // Yellow for 20-29
      4: "#4CAF50", // Green for 30-39
      5: "#2196F3", // Blue for 40-49
      6: "#9C27B0", // Purple for 50-59
      7: "#E91E63", // Pink for 60-69
      8: "#795548", // Brown for 70-79
      9: "#607D8B", // Gray for 80-90
    };
    return { color: colors[column] || "#333" };
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
      <View style={styles.ticketCardHeader}>
        <View style={styles.ticketNumberContainer}>
          <Image
            source={{ uri: GAME_IMAGES.ticket }}
            style={styles.ticketIcon}
          />
          <Text style={styles.ticketNumber}>Ticket #{item.ticket_number}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons
            name="checkmark-circle"
            size={14}
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
        {renderTicketGrid(item.ticket_data)}
      </View>

      <View style={styles.ticketCardFooter}>
        <View style={styles.ticketInfo}>
          <View style={styles.infoItem}>
            <MaterialIcons name="games" size={12} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              Set: {item.ticket_set_id.split("_")[1]}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="date-range" size={12} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {new Date(item.allocated_at).toLocaleDateString()}
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
          <Text style={styles.viewButtonText}>View Full</Text>
          <Ionicons name="expand" size={12} color="#FF7675" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF7675"
            colors={["#FF7675"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle} numberOfLines={1}>
                My Tickets
              </Text>
              {game && (
                <View style={styles.gameInfoHeader}>
                  <Text style={styles.gameName} numberOfLines={1}>
                    {game.game_name}
                  </Text>
                  <View style={styles.gameCodeBadge}>
                    <MaterialIcons
                      name="fingerprint"
                      size={12}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.gameCodeText}>{game.game_code}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7675" />
              <Text style={styles.loadingText}>Loading your tickets...</Text>
            </View>
          ) : myTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
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
                style={styles.refreshButton}
                onPress={fetchMyTickets}
              >
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Image
                    source={{ uri: GAME_IMAGES.ticket }}
                    style={styles.statImage}
                  />
                  <Text style={styles.statValue}>{myTickets.length}</Text>
                  <Text style={styles.statLabel}>Total Tickets</Text>
                </View>
                <View style={styles.statItem}>
                  <Image
                    source={{ uri: GAME_IMAGES.diamond }}
                    style={styles.statImage}
                  />
                  <Text style={styles.statValue}>
                    {myTickets.filter((t) => t.is_active).length}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statItem}>
                  <Image
                    source={{ uri: GAME_IMAGES.celebrate }}
                    style={styles.statImage}
                  />
                  <Text style={styles.statValue}>
                    {new Set(myTickets.map((t) => t.ticket_set_id)).size}
                  </Text>
                  <Text style={styles.statLabel}>Ticket Sets</Text>
                </View>
              </View>

              <View style={styles.ticketsContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    🎫 Allocated Tickets ({myTickets.length})
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap on any ticket to view details
                  </Text>
                </View>

                <View style={styles.ticketsList}>
                  {myTickets.map((ticket) => (
                    <View key={ticket.id} style={styles.ticketWrapper}>
                      {renderTicketItem({ item: ticket })}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Ticket Detail Modal */}
      <Modal
        animationType="slide"
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
                    <Text style={styles.modalTitle}>
                      Ticket #{selectedTicket.ticket_number}
                    </Text>
                    <View style={styles.modalStatusBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color={selectedTicket.is_active ? "#4CAF50" : "#9E9E9E"}
                      />
                      <Text
                        style={[
                          styles.modalStatusText,
                          {
                            color: selectedTicket.is_active
                              ? "#4CAF50"
                              : "#9E9E9E",
                          },
                        ]}
                      >
                        {selectedTicket.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalTicketInfo}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoItem}>
                      <MaterialIcons name="games" size={14} color="#666" />
                      <Text style={styles.modalInfoLabel}>Ticket Set:</Text>
                      <Text style={styles.modalInfoValue} numberOfLines={1}>
                        {selectedTicket.ticket_set_id}
                      </Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <MaterialIcons name="date-range" size={14} color="#666" />
                      <Text style={styles.modalInfoLabel}>Allocated:</Text>
                      <Text style={styles.modalInfoValue} numberOfLines={1}>
                        {new Date(
                          selectedTicket.allocated_at
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {selectedTicket.game && (
                    <View style={styles.gameCard}>
                      <View style={styles.gameCardHeader}>
                        <MaterialIcons name="sports-esports" size={16} color="#7209B7" />
                        <Text style={styles.gameCardTitle}>Game Details</Text>
                      </View>
                      <View style={styles.gameCardContent}>
                        <Text style={styles.gameNameText} numberOfLines={2}>
                          {selectedTicket.game.game_name}
                        </Text>
                        <Text style={styles.gameCodeText} numberOfLines={1}>
                          Code: {selectedTicket.game.game_code}
                        </Text>
                        <Text style={styles.gameTimeText} numberOfLines={1}>
                          {new Date(
                            selectedTicket.game.game_date
                          ).toLocaleDateString()} •{" "}
                          {selectedTicket.game.game_start_time}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.modalTicketGrid}>
                  {renderTicketGrid(selectedTicket.ticket_data)}
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
    backgroundColor: "#F6F8FA",
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FF7675",
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
  },
  gameInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gameName: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  gameCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  gameCodeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 40,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7675",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statImage: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  ticketsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  ticketsList: {
    gap: 16,
  },
  ticketWrapper: {
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    opacity: 0.8,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ticketPreview: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  ticketGridContainer: {
    alignItems: "center",
  },
  columnNumbers: {
    flexDirection: "row",
    marginBottom: 4,
  },
  columnNumberCell: {
    width: CELL_SIZE,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  columnNumberText: {
    fontSize: 10,
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
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  firstRowCell: {
    borderTopWidth: 2,
    borderTopColor: "#FF5252",
  },
  lastRowCell: {
    borderBottomWidth: 2,
    borderBottomColor: "#607D8B",
  },
  filledCell: {
    backgroundColor: "#FFF9E6",
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  ticketCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketInfo: {
    flex: 1,
    gap: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  viewButtonText: {
    fontSize: 12,
    color: "#FF7675",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modalStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalTicketInfo: {
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  modalInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8F9FF",
    padding: 10,
    borderRadius: 10,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginRight: 4,
  },
  modalInfoValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  gameCard: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  gameCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  gameCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7209B7",
  },
  gameCardContent: {
    gap: 4,
  },
  gameNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  gameTimeText: {
    fontSize: 12,
    color: "#666",
  },
  modalTicketGrid: {
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  modalActions: {
    alignItems: "center",
  },
  closeModalButton: {
    backgroundColor: "#FF7675",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default TicketsScreen;