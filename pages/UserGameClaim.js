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
  Alert,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 80) / 9;

const UserGameClaim = ({ navigation, route }) => {
  const { gameId, gameName, ticketId, ticketNumber } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [patternRewards, setPatternRewards] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [myClaims, setMyClaims] = useState([]);

  const GAME_IMAGES = {
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    claim: "https://cdn-icons-png.flaticon.com/512/1006/1006581.png",
    pending: "https://cdn-icons-png.flaticon.com/512/3305/3305800.png",
    approved: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    rejected: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
  };

  useEffect(() => {
    fetchPatternRewards();
    fetchMyClaims();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatternRewards();
    await fetchMyClaims();
    setRefreshing(false);
  };

  const fetchPatternRewards = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const games = response.data.games.data;
        const currentGame = games.find((game) => game.id === parseInt(gameId));

        if (currentGame && currentGame.pattern_rewards) {
          setPatternRewards(currentGame.pattern_rewards);
        } else {
          Alert.alert("Info", "No claimable patterns available for this game");
        }
      } else {
        Alert.alert("Error", "Failed to load game data");
      }
    } catch (error) {
      console.log("Error fetching pattern rewards:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to load pattern rewards. Please try again."
      );
    }
  };

  const fetchMyClaims = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/claims/game/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setMyClaims(response.data.data.claims || []);
      }
    } catch (error) {
      console.log("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedPattern) {
      Alert.alert("Warning", "Please select a pattern to claim");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");

      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/claims/submit",
        {
          game_id: parseInt(gameId),
          ticket_id: parseInt(ticketId),
          reward_name: selectedPattern.reward_name,
          claim_evidence: `Pattern ${selectedPattern.pattern_id} completed on ticket ${ticketNumber}`,
          game_pattern_id: selectedPattern.pattern_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success!",
          response.data.message ||
            "Claim submitted successfully. Waiting for host approval.",
          [
            {
              text: "OK",
              onPress: () => {
                fetchMyClaims();
                setSelectedPattern(null);
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit claim");
      }
    } catch (error) {
      console.log("Error submitting claim:", error);
      let errorMessage = "Failed to submit claim. Please try again.";

      if (error.response) {
        console.log("Error response:", error.response.data);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join("\n");
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTicketGrid = (ticketData) => {
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

              let cellBackgroundColor;
              if (isEmpty) {
                cellBackgroundColor = "#CCCCCC";
              } else if (isMarked) {
                cellBackgroundColor = "#FF5252";
              } else {
                cellBackgroundColor = "#80CBC4";
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
                      <Text style={[styles.cellNumber, { color: "#FFFFFF" }]}>
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return (
          <View style={[styles.statusIcon, { backgroundColor: "#4CAF5020" }]}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        );
      case "rejected":
        return (
          <View style={[styles.statusIcon, { backgroundColor: "#F4433620" }]}>
            <Ionicons name="close-circle" size={16} color="#F44336" />
          </View>
        );
      default:
        return (
          <View style={[styles.statusIcon, { backgroundColor: "#FF980020" }]}>
            <Ionicons name="time" size={16} color="#FF9800" />
          </View>
        );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const renderClaimItem = (claim, index) => (
    <View key={index} style={styles.claimCard}>
      <View style={styles.claimCardHeader}>
        <View style={styles.claimInfo}>
          <Text style={styles.claimPatternName} numberOfLines={1}>
            {claim.reward_name}
          </Text>
          <View style={styles.claimDetails}>
            <View style={styles.claimDetailItem}>
              <Ionicons name="ticket-outline" size={12} color="#6C757D" />
              <Text style={styles.claimDetailText}>
                Ticket #{claim.ticket_number}
              </Text>
            </View>
            <View style={styles.claimDetailItem}>
              <Ionicons name="calendar-outline" size={12} color="#6C757D" />
              <Text style={styles.claimDetailText}>
                {new Date(claim.claimed_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.claimStatusContainer}>
          {getStatusIcon(claim.claim_status)}
          <Text
            style={[
              styles.claimStatusText,
              { color: getStatusColor(claim.claim_status) },
            ]}
          >
            {getStatusText(claim.claim_status)}
          </Text>
        </View>
      </View>

      <View style={styles.claimAmountContainer}>
        <View style={styles.claimAmountBadge}>
          <Ionicons name="cash-outline" size={14} color="#FFF" />
          <Text style={styles.claimAmountText}>₹{claim.winning_amount}</Text>
        </View>
        {claim.host_response && (
          <Text style={styles.hostResponseText} numberOfLines={2}>
            {claim.host_response}
          </Text>
        )}
      </View>

      {claim.ticket_data && claim.ticket_data.length > 0 && (
        <View style={styles.ticketPreview}>
          {renderTicketGrid(claim.ticket_data)}
        </View>
      )}
    </View>
  );

  const renderPatternCard = (pattern, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.patternCard,
        selectedPattern?.pattern_id === pattern.pattern_id &&
          styles.selectedPatternCard,
      ]}
      onPress={() => setSelectedPattern(pattern)}
      activeOpacity={0.7}
    >
      <View style={styles.patternCardHeader}>
        <View style={styles.patternIconContainer}>
          <Image source={{ uri: GAME_IMAGES.trophy }} style={styles.patternIcon} />
        </View>
        <View style={styles.patternInfo}>
          <Text style={styles.patternName} numberOfLines={1}>
            {pattern.reward_name}
          </Text>
          <Text style={styles.patternDescription} numberOfLines={2}>
            {pattern.description}
          </Text>
        </View>
        {selectedPattern?.pattern_id === pattern.pattern_id && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>

      <View style={styles.patternDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Prize:</Text>
          <Text style={styles.detailValue}>₹{pattern.amount}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="ticket-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Tickets:</Text>
          <Text style={styles.detailValue}>{pattern.min_tickets_required}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="trophy-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Available:</Text>
          <Text style={styles.detailValue}>{pattern.reward_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Claim Form...</Text>
      </View>
    );
  }

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
            <Text style={styles.gameName} numberOfLines={1}>
              {gameName}
            </Text>
            <View style={styles.gameCodeContainer}>
              <Ionicons name="ticket-outline" size={16} color="#6C757D" />
              <Text style={styles.gameCode}>Ticket #{ticketNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
          />
        }
      >
        {/* Background Patterns */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Available Patterns */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image
                source={{ uri: GAME_IMAGES.pattern }}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Available Patterns</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{patternRewards.length}</Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>
              Tap on a pattern to select it for your claim
            </Text>

            {patternRewards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.diamond }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Patterns Available</Text>
                <Text style={styles.emptySubtitle}>
                  This game doesn't have any claimable patterns yet
                </Text>
              </View>
            ) : (
              <View style={styles.patternsList}>
                {patternRewards.map((pattern, index) =>
                  renderPatternCard(pattern, index)
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedPattern || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitClaim}
            disabled={!selectedPattern || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  Submit Claim for Approval
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* My Claims Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image source={{ uri: GAME_IMAGES.claim }} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>My Claims</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{myClaims.length}</Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>
              Your previous claims for this game
            </Text>

            {myClaims.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.pending }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Claims Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Submit your first claim using the form above
                </Text>
              </View>
            ) : (
              <View style={styles.claimsList}>
                {myClaims.map((claim, index) => renderClaimItem(claim, index))}
              </View>
            )}
          </View>

          {/* Note */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="#6C757D" />
            <Text style={styles.noteText}>
              Note: Your ticket will be verified by the game host before the
              claim is approved.
            </Text>
          </View>

          {/* Bottom Space */}
          <View style={styles.bottomSpace} />
        </View>
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
    paddingBottom: 40,
  },
  backgroundPatterns: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  patternCircle1: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(64, 224, 208, 0.05)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 107, 53, 0.03)",
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
    justifyContent: "center",
    alignItems: "center",
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
    color: "#FF6B35",
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
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: "relative",
    overflow: "hidden",
  },
  noteCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  noteText: {
    fontSize: 13,
    color: "#FF6B35",
    flex: 1,
    lineHeight: 18,
  },
  // Section Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  sectionSubtitle: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 16,
    fontStyle: "italic",
  },
  countBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  // Pattern Cards
  patternsList: {
    gap: 12,
  },
  patternCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  selectedPatternCard: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "#F1F8E9",
  },
  patternCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  patternIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7E6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  patternIcon: {
    width: 20,
    height: 20,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  patternDescription: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
  },
  selectedIndicator: {
    marginLeft: "auto",
  },
  patternDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: "#6C757D",
    marginRight: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#212529",
  },
  // Submit Button
  submitButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FF6B35",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#CCCCCC",
    borderColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Claims List
  claimsList: {
    gap: 12,
  },
  claimCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  claimCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  claimInfo: {
    flex: 1,
  },
  claimPatternName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
  },
  claimDetails: {
    flexDirection: "row",
    gap: 12,
  },
  claimDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  claimDetailText: {
    fontSize: 11,
    color: "#6C757D",
  },
  claimStatusContainer: {
    alignItems: "center",
    marginLeft: 8,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  claimStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  claimAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  claimAmountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#40E0D0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  claimAmountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  hostResponseText: {
    fontSize: 12,
    color: "#6C757D",
    fontStyle: "italic",
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  // Ticket Preview
  ticketPreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
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
    width: "100%",
    height: "100%",
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Empty State
  emptyContainer: {
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
    paddingHorizontal: 20,
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
  bottomSpace: {
    height: 20,
  },
});

export default UserGameClaim;