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
  const [processingClaim, setProcessingClaim] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });
  
  // Bulk processing states
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  
  const fetchCalledNumbers = async () => {
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
        setCalledNumbers(data.numbers?.called_numbers || []);
      }
    } catch (error) {
      console.log("Error fetching called numbers:", error);
    }
  };

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
        // Clear selected claims on refresh
        setSelectedClaims([]);
        await fetchCalledNumbers();
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

  // Bulk processing functions
  const toggleClaimSelection = (claimId) => {
    setSelectedClaims(prev => {
      if (prev.includes(claimId)) {
        return prev.filter(id => id !== claimId);
      } else {
        return [...prev, claimId];
      }
    });
  };

  const selectAllClaims = () => {
    if (selectedClaims.length === claims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(claims.map(claim => claim.id));
    }
  };

  const openBulkActionModal = () => {
    if (selectedClaims.length === 0) {
      Alert.alert("No Claims Selected", "Please select at least one claim to process.");
      return;
    }
    setBulkActionModalVisible(true);
  };

  const closeBulkActionModal = () => {
    setBulkActionModalVisible(false);
  };

  const processBulkClaims = async (action) => {
    if (selectedClaims.length === 0) return;

    const actionText = action === "approve" ? "Approve" : "Reject";
    const confirmMessage = action === "approve" 
      ? `Are you sure you want to approve ${selectedClaims.length} selected claim(s)?`
      : `Are you sure you want to reject ${selectedClaims.length} selected claim(s)?`;

    Alert.alert(
      `${actionText} Selected Claims`,
      confirmMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            try {
              setBulkProcessing(true);
              const token = await AsyncStorage.getItem("hostToken");
              
              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/claims/bulk-process`,
                {
                  claim_ids: selectedClaims,
                  action: action,
                  host_response: `${actionText}d ${selectedClaims.length} claims in bulk`
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success", 
                  `${selectedClaims.length} claim(s) ${actionText.toLowerCase()}d successfully!`
                );
                
                // Remove processed claims from the list
                setClaims(prev => prev.filter(claim => !selectedClaims.includes(claim.id)));
                setSummary(prev => ({
                  ...prev,
                  total_pending: prev.total_pending - selectedClaims.length
                }));
                
                // Clear selected claims
                setSelectedClaims([]);
                closeBulkActionModal();
                
                // Refresh data
                fetchClaims();
              }
            } catch (error) {
              console.log("Error processing bulk claims:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || `Failed to ${actionText.toLowerCase()} claims`
              );
            } finally {
              setBulkProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Function to render all called numbers in a compact grid
  const renderAllCalledNumbers = () => {
    if (calledNumbers.length === 0) {
      return (
        <View style={styles.noCalledNumbers}>
          <Ionicons name="megaphone-outline" size={24} color="#9CA3AF" />
          <Text style={styles.noCalledNumbersText}>No numbers called yet</Text>
        </View>
      );
    }

    // Calculate cell size to fit all numbers in the modal
    const cellSize = Math.min(28, (width - 60) / 10); // Compact size, max 10 per row
    
    return (
      <View style={styles.allNumbersContainer}>
        <Text style={styles.calledNumbersTitle}>
          All Called Numbers ({calledNumbers.length}/90)
        </Text>
        
        <View style={styles.calledNumbersGrid}>
          {Array.from({ length: 90 }, (_, i) => i + 1).map((number) => {
            const isCalled = calledNumbers.includes(number);
            
            return (
              <View key={number} style={[styles.numberCell, { width: cellSize, height: cellSize }]}>
                <View style={[
                  styles.numberCellInner,
                  isCalled && styles.calledNumberCell
                ]}>
                  <Text style={[
                    styles.numberText,
                    isCalled && styles.calledNumberText
                  ]}>
                    {number}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        
        <View style={styles.calledNumbersSummary}>
          <View style={styles.summaryItem}>
            <View style={styles.calledIndicator} />
            <Text style={styles.summaryText}>
              Called ({calledNumbers.length})
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={styles.uncalledIndicator} />
            <Text style={styles.summaryText}>
              Remaining ({90 - calledNumbers.length})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ClaimDetailModal = () => {
    if (!selectedClaim) return null;
    
    return (
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Simplified Header with Player Name */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Claim Verification</Text>
                <Text style={styles.playerName}>
                  Player: {selectedClaim.user_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                disabled={!!processingClaim}
              >
                <Ionicons name="close" size={24} color={!!processingClaim ? "#999" : "#666"} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <View style={styles.modalScrollContainer}>
              <ScrollView 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Pattern and Prize Info */}
                <View style={styles.claimInfoCard}>
                  <View style={styles.claimInfoRow}>
                    <View style={styles.infoItem}>
                      <MaterialIcons name="pattern" size={16} color="#25D366" />
                      <Text style={styles.infoLabel}>Pattern:</Text>
                      <Text style={styles.infoValue}>{selectedClaim.pattern_name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <FontAwesome name="rupee" size={16} color="#25D366" />
                      <Text style={styles.infoLabel}>Prize:</Text>
                      <Text style={styles.infoValue}>₹{selectedClaim.winning_amount}</Text>
                    </View>
                  </View>
                  <View style={styles.claimInfoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={16} color="#FF9800" />
                      <Text style={styles.infoLabel}>Submitted:</Text>
                      <Text style={styles.infoValue}>{selectedClaim.waiting_time_minutes} min ago</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="ticket-outline" size={16} color="#2196F3" />
                      <Text style={styles.infoLabel}>Ticket:</Text>
                      <Text style={styles.infoValue}>#{selectedClaim.ticket_number}</Text>
                    </View>
                  </View>
                </View>

                {/* All Called Numbers Grid */}
                <View style={styles.calledNumbersSection}>
                  {renderAllCalledNumbers()}
                </View>

                {/* Ticket Grid */}
                <View style={styles.ticketSection}>
                  <Text style={styles.sectionTitle}>
                    Player's Ticket
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Green cells are marked numbers for {selectedClaim.pattern_name} pattern
                  </Text>
                  {selectedClaim.ticket_data && renderTicketGrid(selectedClaim.ticket_data)}
                </View>
              </ScrollView>
            </View>

            {/* Fixed Footer with Action Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => {
                  setDetailModalVisible(false);
                  setTimeout(() => rejectClaim(selectedClaim.id), 300);
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
          </View>
        </View>
      </Modal>
    );
  };

  const BulkActionModal = () => {
    return (
      <Modal
        visible={bulkActionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBulkActionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalContainer}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>
                Process {selectedClaims.length} Selected Claim(s)
              </Text>
              <TouchableOpacity onPress={closeBulkActionModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.bulkModalContent}>
              <Text style={styles.bulkModalText}>
                Choose an action for the selected {selectedClaims.length} claim(s):
              </Text>
              
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.bulkRejectButton]}
                onPress={() => processBulkClaims("reject")}
                disabled={bulkProcessing}
              >
                {bulkProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#FFF" />
                    <Text style={styles.bulkActionButtonText}>Reject Selected</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.bulkApproveButton]}
                onPress={() => processBulkClaims("approve")}
                disabled={bulkProcessing}
              >
                {bulkProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.bulkActionButtonText}>Approve Selected</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bulkCancelButton}
                onPress={closeBulkActionModal}
                disabled={bulkProcessing}
              >
                <Text style={styles.bulkCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
                Alert.alert(
                  "Success", 
                  "Claim approved successfully!",
                  [
                    { 
                      text: "OK", 
                      onPress: () => {
                        navigation.navigate('HostGameRoom', { 
                          gameId, 
                          gameName 
                        });
                      }
                    }
                  ]
                );
                
                setClaims(prev => prev.filter(claim => claim.id !== claimId));
                setSummary(prev => ({
                  ...prev,
                  total_pending: prev.total_pending - 1
                }));
                
                fetchClaims();
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

  const rejectClaim = async (claimId) => {
    const claim = claims.find(c => c.id === claimId);
    
    Alert.alert(
      "Reject Claim",
      "Are you sure you want to reject this claim? This action cannot be undone.\n\nReason: Pattern doesn't match or numbers not called",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingClaim(claimId);
              const token = await AsyncStorage.getItem("hostToken");
              
              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/claims/${claimId}/reject`,
                {
                  host_response: "Pattern doesn't match or numbers not called",
                  reason: "Pattern doesn't match or numbers not called"
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success", 
                  "Claim rejected successfully!",
                  [
                    { 
                      text: "OK", 
                      onPress: () => {
                        navigation.navigate('HostGameRoom', { 
                          gameId, 
                          gameName 
                        });
                      }
                    }
                  ]
                );
                
                setClaims(prev => prev.filter(claim => claim.id !== claimId));
                setSummary(prev => ({
                  ...prev,
                  total_pending: prev.total_pending - 1
                }));
                
                fetchClaims();
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
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
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

      {/* Summary Card with Bulk Actions */}
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
          <View style={styles.summaryStat}>
            <Ionicons name="checkbox-outline" size={20} color="#9C27B0" />
            <Text style={styles.summaryStatValue}>{selectedClaims.length}</Text>
            <Text style={styles.summaryStatLabel}>Selected</Text>
          </View>
        </View>
        
        {/* Bulk Actions Row */}
        {claims.length > 0 && (
          <View style={styles.bulkActionsRow}>
            <TouchableOpacity
              style={[styles.bulkActionButtonSmall, styles.selectAllButton]}
              onPress={selectAllClaims}
            >
              <Ionicons 
                name={selectedClaims.length === claims.length ? "checkbox" : "square-outline"} 
                size={18} 
                color="#25D366" 
              />
              <Text style={styles.bulkActionButtonTextSmall}>
                {selectedClaims.length === claims.length ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            
            {selectedClaims.length > 0 && (
              <TouchableOpacity
                style={[styles.bulkActionButtonSmall, styles.processSelectedButton]}
                onPress={openBulkActionModal}
                disabled={bulkProcessing}
              >
                {bulkProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={18} color="#FFF" />
                    <Text style={[styles.bulkActionButtonTextSmall, { color: "#FFF" }]}>
                      Process Selected ({selectedClaims.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
            {claims.map((claim) => {
              const isSelected = selectedClaims.includes(claim.id);
              
              return (
                <TouchableOpacity
                  key={claim.id}
                  style={[
                    styles.claimCard,
                    isSelected && styles.selectedClaimCard
                  ]}
                  onPress={() => showClaimDetails(claim)}
                  onLongPress={() => toggleClaimSelection(claim.id)}
                  activeOpacity={0.7}
                  delayLongPress={300}
                >
                  <View style={styles.claimHeader}>
                    <View style={styles.userInfo}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleClaimSelection(claim.id)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                      
                      <View style={styles.userInfoText}>
                        <Text style={styles.userName}>{claim.user_name}</Text>
                        <Text style={styles.username}>@{claim.username}</Text>
                        <View style={styles.patternContainer}>
                          <MaterialIcons name="pattern" size={12} color="#25D366" />
                          <Text style={styles.patternName}>{claim.pattern_name}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.claimStatus}>
                      <Text style={styles.waitingTime}>
                        {claim.waiting_time_minutes} min ago
                      </Text>
                      <View style={styles.amountContainer}>
                        <FontAwesome name="rupee" size={14} color="#25D366" />
                        <Text style={styles.winningAmount}>₹{claim.winning_amount}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.claimActions}>
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.rejectQuickButton]}
                      onPress={() => rejectClaim(claim.id)}
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
                      <Text style={styles.detailsButtonText}>Verify Claim</Text>
                      <Ionicons name="chevron-forward" size={16} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {selectedClaims.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryText}>
                  {selectedClaims.length} claim(s) selected
                </Text>
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => setSelectedClaims([])}
                >
                  <Text style={styles.clearSelectionText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.refreshHint}>
              Pull down to refresh for new claims • Long press to select multiple
            </Text>
          </>
        )}
      </ScrollView>

      <ClaimDetailModal />
      <BulkActionModal />
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
    marginBottom: 16,
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  // Bulk Actions
  bulkActionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  bulkActionButtonSmall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  selectAllButton: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E6F0FF",
  },
  processSelectedButton: {
    backgroundColor: "#9C27B0",
    borderWidth: 1,
    borderColor: "#8E24AA",
  },
  bulkActionButtonTextSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#25D366",
  },
  claimsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
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
  selectedClaimCard: {
    backgroundColor: "#F0F7FF",
    borderColor: "#2196F3",
    borderWidth: 2,
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
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  userInfoText: {
    flex: 1,
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
    marginBottom: 4,
  },
  patternContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  patternName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#25D366",
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
    marginBottom: 4,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  winningAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#25D366",
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
  selectedSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  selectedSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BDBDBD",
  },
  clearSelectionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
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
    height: height * 0.85,
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Bulk Modal
  bulkModalContainer: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: 'hidden',
  },
  bulkModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bulkModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  bulkModalContent: {
    padding: 20,
  },
  bulkModalText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bulkRejectButton: {
    backgroundColor: "#FF3B30",
  },
  bulkApproveButton: {
    backgroundColor: "#25D366",
  },
  bulkActionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bulkCancelButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  bulkCancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
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
    marginBottom: 6,
  },
  playerName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modalScrollContainer: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 30,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  // Claim Info Card
  claimInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  claimInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  // Called Numbers Section
  calledNumbersSection: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  allNumbersContainer: {
    marginBottom: 8,
  },
  calledNumbersTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  calledNumbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  numberCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  numberCellInner: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  calledNumberCell: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  numberText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  calledNumberText: {
    color: "#FFF",
    fontWeight: "700",
  },
  calledNumbersSummary: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calledIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  uncalledIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryText: {
    fontSize: 12,
    color: "#666",
  },
  noCalledNumbers: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
  },
  noCalledNumbersText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },
  // Ticket Section
  ticketSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 10,
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
    width: 28,
    height: 28,
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
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  markedNumber: {
    color: "#FFF",
  },
  // Modal Actions
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectButton: {
    backgroundColor: "#FF3B30",
  },
  approveButton: {
    backgroundColor: "#25D366",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HostClaimRequests;