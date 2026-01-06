import React, { useState, useEffect, useCallback } from "react";
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
  Modal,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const HostClaimRequests = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState([]);
  const [gameInfo, setGameInfo] = useState(null);
  const [summary, setSummary] = useState({ total_pending: 0, average_waiting_minutes: 0 });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  const fetchClaims = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/claims/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setGameInfo(response.data.data.game);
        setSummary(response.data.data.summary);
        setClaims(response.data.data.claims);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.log("Error fetching claims:", error);
      Alert.alert("Error", "Failed to load claim requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClaims();
  };

  const showClaimDetails = (claim) => {
    setSelectedClaim(claim);
    setDetailModalVisible(true);
  };

  const approveClaim = async (claimId) => {
    Alert.alert(
      "Approve Claim",
      "Are you sure you want to approve this claim? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingClaim(claimId);
              const token = await AsyncStorage.getItem("hostToken");
              
              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/claims/${claimId}/approve`,
                { host_response: "Claim verified and approved" },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (response.data.success) {
                Alert.alert("Success", "Claim approved successfully!");
                // Remove the claim from the list
                setClaims(prev => prev.filter(claim => claim.id !== claimId));
                // Update summary
                setSummary(prev => ({
                  ...prev,
                  total_pending: prev.total_pending - 1
                }));
              }
            } catch (error) {
              console.log("Error approving claim:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to approve claim"
              );
            } finally {
              setProcessingClaim(null);
            }
          }
        }
      ]
    );
  };

  const openRejectModal = (claimId) => {
    const claim = claims.find(c => c.id === claimId);
    setSelectedClaim(claim || null);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    setRejectModalVisible(false);
    setRejectReason("");
    setProcessingClaim(null);
  };

  const rejectClaim = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    if (!selectedClaim) {
      Alert.alert("Error", "No claim selected");
      return;
    }

    const currentClaimId = selectedClaim.id;

    try {
      setProcessingClaim(currentClaimId);
      const token = await AsyncStorage.getItem("hostToken");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/claims/${currentClaimId}/reject`,
        {
          host_response: rejectReason,
          reason: rejectReason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Claim rejected successfully!");
        // Remove the claim from the list
        setClaims(prev => prev.filter(claim => claim.id !== currentClaimId));
        // Update summary
        setSummary(prev => ({
          ...prev,
          total_pending: prev.total_pending - 1
        }));
        closeRejectModal();
      }
    } catch (error) {
      console.log("Error rejecting claim:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to reject claim"
      );
    } finally {
      setProcessingClaim(null);
    }
  };

  const renderTicketGrid = (ticketData) => {
    return (
      <View style={styles.ticketContainer}>
        {ticketData.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.ticketRow}>
            {row.map((cell, cellIndex) => (
              <View
                key={cellIndex}
                style={[
                  styles.ticketCell,
                  cell.is_marked && styles.markedCell,
                  cell.number === null && styles.emptyCell
                ]}
              >
                {cell.number !== null && (
                  <Text style={[
                    styles.ticketNumber,
                    cell.is_marked && styles.markedNumber
                  ]}>
                    {cell.number}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const ClaimDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {selectedClaim && (
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={styles.modalTitle}>Claim Details</Text>
                  <Text style={styles.modalSubtitle}>Ticket #{selectedClaim.ticket_number}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  disabled={!!processingClaim}
                >
                  <Ionicons name="close" size={24} color={!!processingClaim ? "#999" : "#666"} />
                </TouchableOpacity>
              </View>

              {/* User Info */}
              <View style={styles.userInfoCard}>
                <View style={styles.userAvatarContainer}>
                  {selectedClaim.profile_image ? (
                    <Image
                      source={{ uri: selectedClaim.profile_image }}
                      style={styles.userAvatar}
                    />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.userAvatarText}>
                        {selectedClaim.user_name?.charAt(0) || "U"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{selectedClaim.user_name}</Text>
                  <Text style={styles.username}>@{selectedClaim.username}</Text>
                </View>
              </View>

              {/* Claim Info */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="ticket-outline" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Ticket</Text>
                  <Text style={styles.infoValue}>#{selectedClaim.ticket_number}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="pattern" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Pattern</Text>
                  <Text style={styles.infoValue}>{selectedClaim.pattern_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="trophy-outline" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Prize</Text>
                  <Text style={styles.infoValue}>{selectedClaim.reward_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <FontAwesome name="rupee" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>₹{selectedClaim.winning_amount}</Text>
                </View>
              </View>

              {/* Ticket Grid */}
              <View style={styles.ticketSection}>
                <Text style={styles.sectionTitle}>Ticket Pattern</Text>
                <Text style={styles.sectionSubtitle}>
                  Green cells are marked numbers for this pattern
                </Text>
                {renderTicketGrid(selectedClaim.ticket_data)}
              </View>

              {/* Time Info */}
              <View style={styles.timeInfo}>
                <View style={styles.timeItem}>
                  <Ionicons name="time-outline" size={16} color="#FF9800" />
                  <Text style={styles.timeLabel}>Claimed</Text>
                  <Text style={styles.timeValue}>{selectedClaim.time_since_claim}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Ionicons name="hourglass-outline" size={16} color="#2196F3" />
                  <Text style={styles.timeLabel}>Waiting Time</Text>
                  <Text style={styles.timeValue}>{selectedClaim.waiting_time_minutes} min</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    setTimeout(() => openRejectModal(selectedClaim.id), 300);
                  }}
                  disabled={!!processingClaim || !selectedClaim.can_process}
                >
                  <Ionicons name="close-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    setTimeout(() => approveClaim(selectedClaim.id), 300);
                  }}
                  disabled={!!processingClaim || !selectedClaim.can_process}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>

              {!selectedClaim.can_process && (
                <Text style={styles.warningText}>
                  This claim cannot be processed at the moment
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const RejectModal = () => (
    <Modal
      visible={rejectModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!processingClaim) {
          closeRejectModal();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.rejectModalWrapper}>
          <View style={styles.rejectModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Claim</Text>
              <TouchableOpacity
                onPress={closeRejectModal}
                disabled={!!processingClaim}
              >
                <Ionicons name="close" size={24} color={!!processingClaim ? "#999" : "#666"} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.rejectModalContent}>
              <Text style={styles.rejectInstruction}>
                Please provide a reason for rejecting this claim. This will be sent to the user.
              </Text>
              
              <View style={styles.reasonInputContainer}>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter rejection reason..."
                  multiline
                  numberOfLines={6}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  editable={!processingClaim}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={closeRejectModal}
                  disabled={!!processingClaim}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    styles.confirmRejectButton,
                    (!rejectReason.trim() || !!processingClaim) && styles.disabledButton
                  ]}
                  onPress={rejectClaim}
                  disabled={!!processingClaim || !rejectReason.trim()}
                >
                  {processingClaim ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Reject Claim</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Claim Requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#25D366" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{gameName}</Text>
          <Text style={styles.headerSubtitle}>Claim Requests</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="checkmark-done" size={24} color="#25D366" />
          <Text style={styles.summaryTitle}>Pending Claims</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>
              {summary.total_pending} pending
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Ionicons name="time-outline" size={20} color="#FF9800" />
            <Text style={styles.summaryStatValue}>
              {Math.abs(summary.average_waiting_minutes).toFixed(1)} min
            </Text>
            <Text style={styles.summaryStatLabel}>Avg Wait Time</Text>
          </View>
          <View style={styles.summaryStat}>
            <Ionicons name="people-outline" size={20} color="#2196F3" />
            <Text style={styles.summaryStatValue}>{claims.length}</Text>
            <Text style={styles.summaryStatLabel}>Active Claims</Text>
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
            tintColor="#25D366"
            colors={["#25D366"]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {claims.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateTitle}>No Pending Claims</Text>
            <Text style={styles.emptyStateText}>
              All claim requests have been processed. New claims will appear here as players submit them.
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={18} color="#25D366" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.claimsTitle}>Pending Claims ({claims.length})</Text>
            {claims.map((claim) => (
              <TouchableOpacity
                key={claim.id}
                style={styles.claimCard}
                onPress={() => showClaimDetails(claim)}
                activeOpacity={0.7}
              >
                <View style={styles.claimHeader}>
                  <View style={styles.userInfo}>
                    {claim.profile_image ? (
                      <Image
                        source={{ uri: claim.profile_image }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {claim.user_name?.charAt(0) || "U"}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.userName}>{claim.user_name}</Text>
                      <Text style={styles.username}>@{claim.username}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.claimStatus}>
                    <Text style={styles.waitingTime}>
                      {claim.waiting_time_minutes} min ago
                    </Text>
                  </View>
                </View>
                
                <View style={styles.claimDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="ticket-outline" size={14} color="#666" />
                    <Text style={styles.detailText}>Ticket #{claim.ticket_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="pattern" size={14} color="#666" />
                    <Text style={styles.detailText}>{claim.pattern_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome name="rupee" size={14} color="#666" />
                    <Text style={styles.detailText}>₹{claim.winning_amount}</Text>
                  </View>
                </View>
                
                <View style={styles.claimActions}>
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.rejectQuickButton]}
                    onPress={() => openRejectModal(claim.id)}
                    disabled={!!processingClaim || !claim.can_process}
                  >
                    {processingClaim === claim.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="close" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.approveQuickButton]}
                    onPress={() => approveClaim(claim.id)}
                    disabled={!!processingClaim || !claim.can_process}
                  >
                    {processingClaim === claim.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => showClaimDetails(claim)}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#25D366" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            
            <Text style={styles.refreshHint}>
              Pull down to refresh for new claims
            </Text>
          </>
        )}
      </ScrollView>

      <ClaimDetailModal />
      <RejectModal />
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
    backgroundColor: "#25D366",
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
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
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
  summaryBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#25D366",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  claimsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  claimCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E8F5E9",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: "#666",
  },
  claimStatus: {
    alignItems: "flex-end",
  },
  waitingTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  claimActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectQuickButton: {
    backgroundColor: "#FF3B30",
  },
  approveQuickButton: {
    backgroundColor: "#25D366",
  },
  detailsButton: {
    flex: 1,
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
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#25D366",
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  refreshHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
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
    width: "100%",
    maxHeight: height * 0.85,
    backgroundColor: "#FFF",
    borderRadius: 20,
  },
  modalContent: {
    paddingBottom: 30,
  },
  rejectModalWrapper: {
    width: "100%",
    maxHeight: height * 0.6, // Fixed height for reject modal
  },
  rejectModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "100%",
  },
  rejectModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    gap: 16,
  },
  userAvatarContainer: {
    position: "relative",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userAvatarText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: "#666",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  ticketSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  ticketContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 4,
  },
  ticketCell: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    marginHorizontal: 2,
  },
  markedCell: {
    backgroundColor: "#25D366",
  },
  emptyCell: {
    backgroundColor: "transparent",
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  markedNumber: {
    color: "#FFF",
  },
  timeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeItem: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    width: "48%",
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: "#FF3B30",
  },
  approveButton: {
    backgroundColor: "#25D366",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  confirmRejectButton: {
    backgroundColor: "#FF3B30",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 12,
    color: "#FF9800",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    fontStyle: "italic",
  },
  rejectInstruction: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonInputContainer: {
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 14, 
    textAlignVertical: "top",
  },
});

export default HostClaimRequests;