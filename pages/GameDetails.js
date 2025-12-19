import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const GameDetails = ({ route, navigation }) => {
  const { game } = route.params;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ticketMessage, setTicketMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [myTicketCount, setMyTicketCount] = useState(0);
  const [myRequestCount, setMyRequestCount] = useState(0);

  const GAME_IMAGES = {
    header: "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    calendar: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    players: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    wallet: "https://cdn-icons-png.flaticon.com/512/1061/1061140.png",
    request: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
    requests: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
  };

  useEffect(() => {
    fetchMyTicketCount();
    fetchMyRequestCount();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchMyTicketCount(), fetchMyRequestCount()]).finally(() =>
      setRefreshing(false)
    );
  }, []);

  const fetchMyTicketCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const gameTickets = res.data.tickets.data.filter(
          (ticket) => ticket.game_id === game.id
        );
        setMyTicketCount(gameTickets.length);
      }
    } catch (error) {
      console.log("Error fetching ticket count:", error);
    }
  };

  const fetchMyRequestCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const gameRequests = res.data.ticket_requests.data.filter(
          (request) => request.game_id === game.id
        );
        setMyRequestCount(gameRequests.length);
      }
    } catch (error) {
      console.log("Error fetching request count:", error);
    }
  };

  const handleRequestTickets = async () => {
    if (ticketQuantity < 1 || ticketQuantity > 4) {
      Alert.alert(
        "Invalid Quantity",
        "Ticket quantity must be between 1 and 4"
      );
      return;
    }

    setRequestLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/ticket-requests/send",
        {
          game_id: game.id,
          ticket_quantity: ticketQuantity,
          message:
            ticketMessage || `Request for ${ticketQuantity} ticket(s)`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Ticket request submitted successfully!");
        setTicketModalVisible(false);
        setTicketQuantity(1);
        setTicketMessage("");
        // Refresh counts after submitting request
        fetchMyRequestCount();
        fetchMyTicketCount();
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit request");
      }
    } catch (error) {
      console.log("Request error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit ticket request"
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const navigateToTickets = () => {
    navigation.navigate("TicketsScreen", { game });
  };

  const navigateToMyRequests = () => {
    navigation.navigate("TicketRequestsScreen", { 
      gameId: game.id,
      gameName: game.game_name 
    });
  };

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
              <Text style={styles.gameName} numberOfLines={2} ellipsizeMode="tail">
                {game.game_name}
              </Text>
              <View style={styles.gameCodeContainer}>
                <MaterialIcons
                  name="fingerprint"
                  size={16}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.gameCode}>{game.game_code}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Image
                source={{ uri: GAME_IMAGES.ticket }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>₹{game.ticket_cost}</Text>
              <Text style={styles.statLabel}>Ticket Cost</Text>
            </View>

            <View style={styles.statItem}>
              <Image
                source={{ uri: GAME_IMAGES.players }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>{game.max_players}</Text>
              <Text style={styles.statLabel}>Max Players</Text>
            </View>

            <View style={styles.statItem}>
              <Image
                source={{ uri: GAME_IMAGES.trophy }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>{game.max_winners}</Text>
              <Text style={styles.statLabel}>Winners</Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎮 Game Details</Text>
              <Image
                source={{ uri: GAME_IMAGES.celebrate }}
                style={styles.sectionIcon}
              />
            </View>

            {/* Date & Time */}
            <View style={styles.detailRowFixed}>
              <View style={styles.detailLabelContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.calendar }}
                  style={styles.detailRowIcon}
                />
                <Text style={styles.detailLabel}>Date & Time</Text>
              </View>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {new Date(game.game_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  • {game.game_start_time}
                </Text>
              </View>
            </View>

            {/* Ticket Type */}
            <View style={styles.detailRowFixed}>
              <View style={styles.detailLabelContainer}>
                {game.ticket_type === "paid" ? (
                  <Image
                    source={{ uri: GAME_IMAGES.diamond }}
                    style={styles.detailRowIcon}
                  />
                ) : (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#4CAF50"
                  />
                )}
                <Text style={styles.detailLabel}>Ticket Type</Text>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  game.ticket_type === "paid"
                    ? styles.paidType
                    : styles.freeType,
                ]}
              >
                <Text style={styles.typeText} numberOfLines={1}>
                  {game.ticket_type === "paid" ? "Premium" : "Free"}
                </Text>
              </View>
            </View>

            {/* Prize Pool */}
            <View style={styles.detailRowFixed}>
              <View style={styles.detailLabelContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.wallet }}
                  style={styles.detailRowIcon}
                />
                <Text style={styles.detailLabel}>Prize Pool</Text>
              </View>
              <Text style={styles.prizePool} numberOfLines={1}>
                {game.ticket_type === "paid"
                  ? `₹${game.ticket_cost * game.max_players}`
                  : "Exciting Prizes"}
              </Text>
            </View>

            {/* My Tickets Count */}
            <View style={styles.detailRowFixed}>
              <View style={styles.detailLabelContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.ticket }}
                  style={styles.detailRowIcon}
                />
                <Text style={styles.detailLabel}>My Tickets</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.myTicketsBadge,
                  myTicketCount > 0
                    ? styles.hasTicketsBadge
                    : styles.noTicketsBadge,
                ]}
                onPress={navigateToTickets}
              >
                <Text
                  style={[
                    styles.myTicketsText,
                    myTicketCount > 0
                      ? styles.hasTicketsText
                      : styles.noTicketsText,
                  ]}
                >
                  {myTicketCount > 0
                    ? `${myTicketCount} Ticket${myTicketCount > 1 ? "s" : ""}`
                    : "No Tickets"}
                </Text>
                {myTicketCount > 0 && (
                  <Ionicons name="arrow-forward" size={14} color="#4CAF50" />
                )}
              </TouchableOpacity>
            </View>

            {/* My Requests Count */}
            <View style={styles.detailRowFixed}>
              <View style={styles.detailLabelContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.requests }}
                  style={styles.detailRowIcon}
                />
                <Text style={styles.detailLabel}>My Requests</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.myRequestsBadge,
                  myRequestCount > 0
                    ? styles.hasRequestsBadge
                    : styles.noRequestsBadge,
                ]}
                onPress={navigateToMyRequests}
              >
                <Text
                  style={[
                    styles.myRequestsText,
                    myRequestCount > 0
                      ? styles.hasRequestsText
                      : styles.noRequestsText,
                  ]}
                >
                  {myRequestCount > 0
                    ? `${myRequestCount} Request${myRequestCount > 1 ? "s" : ""}`
                    : "No Requests"}
                </Text>
                {myRequestCount > 0 && (
                  <Ionicons name="arrow-forward" size={14} color="#2196F3" />
                )}
              </TouchableOpacity>
            </View>

            {game.message && (
              <View style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <MaterialIcons name="message" size={18} color="#7209B7" />
                  <Text style={styles.messageTitle}>Host Message</Text>
                </View>
                <Text style={styles.messageContent}>{game.message}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.requestButton,
                  game.ticket_type === "paid"
                    ? styles.paidRequestButton
                    : styles.freeRequestButton,
                ]}
                onPress={() => setTicketModalVisible(true)}
              >
                <Image
                  source={{ uri: GAME_IMAGES.request }}
                  style={styles.requestButtonIcon}
                />
                <Text style={styles.requestButtonText}>Request Tickets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.showTicketsButton,
                  myTicketCount === 0 && styles.disabledButton,
                ]}
                onPress={navigateToTickets}
                disabled={myTicketCount === 0}
              >
                <Image
                  source={{ uri: GAME_IMAGES.ticket }}
                  style={styles.showTicketsIcon}
                />
                <Text style={styles.showTicketsText}>
                  {myTicketCount > 0
                    ? `Show My Tickets (${myTicketCount})`
                    : "No Tickets"}
                </Text>
              </TouchableOpacity>

              {/* My Requests Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.myRequestsButton,
                  myRequestCount === 0 && styles.disabledButton,
                ]}
                onPress={navigateToMyRequests}
                disabled={myRequestCount === 0}
              >
                <Image
                  source={{ uri: GAME_IMAGES.requests }}
                  style={styles.myRequestsButtonIcon}
                />
                <Text style={styles.myRequestsButtonText}>
                  {myRequestCount > 0
                    ? `My Requests (${myRequestCount})`
                    : "No Requests"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Game Rewards */}
          {game.pattern_rewards && game.pattern_rewards.length > 0 && (
            <View style={styles.rewardsCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🏆 Game Rewards</Text>
                <Image
                  source={{ uri: GAME_IMAGES.pattern }}
                  style={styles.sectionIcon}
                />
              </View>
              {game.pattern_rewards.map((reward, index) => (
                <View key={reward.pattern_id} style={styles.rewardItem}>
                  <View style={styles.rewardHeader}>
                    <Image
                      source={{ uri: GAME_IMAGES.trophy }}
                      style={styles.rewardIcon}
                    />
                    <Text style={styles.rewardName} numberOfLines={1}>
                      {reward.reward_name}
                    </Text>
                    <Text style={styles.rewardAmount} numberOfLines={1}>
                      ₹{reward.amount}
                    </Text>
                  </View>
                  <Text style={styles.rewardDescription} numberOfLines={2}>
                    {reward.description}
                  </Text>
                  <View style={styles.rewardFooter}>
                    <View style={styles.rewardCount}>
                      <MaterialIcons
                        name="confirmation-number"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.countText} numberOfLines={1}>
                        Count: {reward.reward_count}
                      </Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Text
                        style={styles.rewardBadgeText}
                        numberOfLines={1}
                      >
                        Pattern {reward.pattern_id}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Ticket Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ticketModalVisible}
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎫 Request Tickets</Text>
              <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.gameInfoModal}>
              <Text style={styles.modalGameName} numberOfLines={2}>
                {game.game_name}
              </Text>
              <Text style={styles.modalGamePrice}>
                Ticket Price: ₹{game.ticket_cost} each
              </Text>
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Select Quantity (1-4)</Text>
              <View style={styles.quantitySelector}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.quantityButton,
                      ticketQuantity === num && styles.quantityButtonActive,
                    ]}
                    onPress={() => setTicketQuantity(num)}
                  >
                    <Text
                      style={[
                        styles.quantityButtonText,
                        ticketQuantity === num &&
                          styles.quantityButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Total Amount */}
            <View style={styles.totalSection}>
              <View style={styles.totalLeft}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Image
                  source={{ uri: GAME_IMAGES.wallet }}
                  style={styles.totalIcon}
                />
              </View>
              <Text style={styles.totalAmount} numberOfLines={1}>
                ₹{game.ticket_cost * ticketQuantity}
              </Text>
            </View>

            {/* Message Input */}
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Add a message for the host..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>
                {ticketMessage.length}/200 characters
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setTicketModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  game.ticket_type === "paid"
                    ? styles.paidSubmit
                    : styles.freeSubmit,
                  requestLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleRequestTickets}
                disabled={requestLoading}
              >
                {requestLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Image
                      source={{ uri: GAME_IMAGES.request }}
                      style={styles.submitIcon}
                    />
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
    lineHeight: 28,
  },
  gameCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gameCode: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  content: {
    padding: 20,
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
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  sectionIcon: {
    width: 30,
    height: 30,
    opacity: 0.8,
  },
  detailRowFixed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    minHeight: 50,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  detailRowIcon: {
    width: 22,
    height: 22,
    opacity: 0.8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    minWidth: 90,
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "right",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  paidType: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  freeType: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  prizePool: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7209B7",
    textAlign: 'right',
    flex: 1,
  },
  myTicketsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
  },
  hasTicketsBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  noTicketsBadge: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#9E9E9E",
  },
  myTicketsText: {
    fontSize: 12,
    fontWeight: "700",
  },
  hasTicketsText: {
    color: "#4CAF50",
  },
  noTicketsText: {
    color: "#666",
  },
  myRequestsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
  },
  hasRequestsBadge: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  noRequestsBadge: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#9E9E9E",
  },
  myRequestsText: {
    fontSize: 12,
    fontWeight: "700",
  },
  hasRequestsText: {
    color: "#2196F3",
  },
  noRequestsText: {
    color: "#666",
  },
  messageCard: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7209B7",
  },
  messageContent: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 15,
    gap: 12,
  },
  requestButton: {},
  paidRequestButton: {
    backgroundColor: "#FF7675",
  },
  freeRequestButton: {
    backgroundColor: "#4CAF50",
  },
  requestButtonIcon: {
    width: 24,
    height: 24,
  },
  requestButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  showTicketsButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  showTicketsIcon: {
    width: 24,
    height: 24,
  },
  showTicketsText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "700",
  },
  myRequestsButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  myRequestsButtonIcon: {
    width: 24,
    height: 24,
  },
  myRequestsButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  rewardsCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  rewardItem: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  rewardIcon: {
    width: 24,
    height: 24,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFB300",
    minWidth: 60,
    textAlign: 'right',
  },
  rewardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    lineHeight: 18,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  countText: {
    fontSize: 12,
    color: "#666",
  },
  rewardBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 80,
  },
  rewardBadgeText: {
    fontSize: 11,
    color: "#1976D2",
    fontWeight: "600",
    textAlign: 'center',
  },
  bottomSpace: {
    height: 30,
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
    borderWidth: 1,
    borderColor: "#EEE",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  gameInfoModal: {
    backgroundColor: "#F6F8FA",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  modalGameName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalGamePrice: {
    fontSize: 14,
    color: "#666",
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#F6F8FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  quantityButtonActive: {
    backgroundColor: "#FF7675",
    borderColor: "#FF7675",
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#666",
  },
  quantityButtonTextActive: {
    color: "#FFF",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  totalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalIcon: {
    width: 20,
    height: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF7675",
    maxWidth: 120,
  },
  messageSection: {
    marginBottom: 25,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: "#F6F8FA",
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  submitIcon: {
    width: 20,
    height: 20,
  },
  paidSubmit: {
    backgroundColor: "#FF7675",
  },
  freeSubmit: {
    backgroundColor: "#4CAF50",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});

export default GameDetails;