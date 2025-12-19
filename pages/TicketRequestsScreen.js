import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const TicketRequestsScreen = ({ route, navigation }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);

  const REQUEST_IMAGES = {
    pending: "https://cdn-icons-png.flaticon.com/512/2516/2516753.png",
    approved: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    rejected: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
    cancelled: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
    request: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
  };

  useEffect(() => {
    fetchTicketRequests();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTicketRequests().finally(() => setRefreshing(false));
  }, []);

  const fetchTicketRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const gameRequests = response.data.ticket_requests.data.filter(
          (request) => request.game_id === gameId
        );
        setRequests(gameRequests);
      }
    } catch (error) {
      console.log("Error fetching ticket requests:", error);
      Alert.alert("Error", "Failed to fetch ticket requests");
    } finally {
      setLoading(false);
    }
  };

  const cancelTicketRequest = async (requestId) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this ticket request?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/user/my-ticket-requests/${requestId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (response.data.success) {
                Alert.alert("Success", "Ticket request cancelled successfully!");
                fetchTicketRequests();
              } else {
                Alert.alert("Error", response.data.message || "Failed to cancel request");
              }
            } catch (error) {
              console.log("Cancel error:", error.response?.data || error.message);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel ticket request"
              );
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "#4CAF50";
      case "pending": return "#FFB300";
      case "rejected": return "#F44336";
      case "cancelled": return "#9E9E9E";
      default: return "#666";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "approved": return "#E8F5E9";
      case "pending": return "#FFF8E1";
      case "rejected": return "#FFEBEE";
      case "cancelled": return "#F5F5F5";
      default: return "#F5F7FA";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7675" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

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
              <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                My Ticket Requests
              </Text>
              <View style={styles.gameCodeContainer}>
                <MaterialIcons
                  name="games"
                  size={16}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.gameName} numberOfLines={1}>
                  {gameName}
                </Text>
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
                source={{ uri: REQUEST_IMAGES.request }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>{requests.length}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>

            <View style={styles.statItem}>
              <Image
                source={{ uri: REQUEST_IMAGES.pending }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>
                {requests.filter(r => r.status === "pending").length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statItem}>
              <Image
                source={{ uri: REQUEST_IMAGES.approved }}
                style={styles.statImage}
              />
              <Text style={styles.statValue}>
                {requests.filter(r => r.status === "approved").length}
              </Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>

          {/* Requests Card */}
          <View style={styles.requestsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Ticket Requests</Text>
              <TouchableOpacity onPress={fetchTicketRequests}>
                <Ionicons name="refresh" size={22} color="#FF7675" />
              </TouchableOpacity>
            </View>

            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Image
                  source={{ uri: REQUEST_IMAGES.empty }}
                  style={styles.emptyImage}
                />
                <Text style={styles.emptyTitle}>No Requests Found</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't made any requests for this game yet
                </Text>
                <TouchableOpacity
                  style={styles.newRequestButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="add-circle" size={18} color="#FFF" />
                  <Text style={styles.newRequestButtonText}>Make New Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              requests.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestId}>Request #{request.id}</Text>
                      <Text style={styles.requestDate}>
                        {formatDate(request.requested_at)} • {formatTime(request.requested_at)}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(request.status) }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) }
                      ]}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="confirmation-number" size={16} color="#FF7675" />
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>
                          {request.ticket_quantity} Ticket{request.ticket_quantity > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="account-balance-wallet" size={16} color="#4CAF50" />
                        <Text style={styles.detailLabel}>Amount:</Text>
                        <Text style={styles.detailValue}>₹{request.total_amount}</Text>
                      </View>
                    </View>

                    <View style={styles.paymentStatusRow}>
                      <MaterialIcons name="payment" size={16} color="#2196F3" />
                      <Text style={styles.paymentLabel}>Payment Status:</Text>
                      <View style={[
                        styles.paymentBadge,
                        request.payment_status === "paid" ? styles.paidBadge : styles.pendingBadge
                      ]}>
                        <Text style={styles.paymentBadgeText}>
                          {request.payment_status.charAt(0).toUpperCase() + request.payment_status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {request.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Your Message:</Text>
                      <Text style={styles.notesText}>{request.notes}</Text>
                    </View>
                  )}

                  {request.rejection_reason && (
                    <View style={styles.rejectionContainer}>
                      <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                      <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    {request.status === "pending" ? (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancelTicketRequest(request.id)}
                      >
                        <Ionicons name="close-circle" size={18} color="#FFF" />
                        <Text style={styles.cancelButtonText}>Cancel Request</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.cancelButton, styles.disabledButton]}
                        disabled={true}
                      >
                        <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                        <Text style={[styles.cancelButtonText, styles.disabledButtonText]}>
                          Request {request.status}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F8FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#2196F3",
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
  headerTitle: {
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
  gameName: {
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
  requestsCard: {
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  newRequestButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  newRequestButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  requestItem: {
    backgroundColor: "#F8F9FF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginRight: 6,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: "#E8F5E9",
  },
  pendingBadge: {
    backgroundColor: "#FFF8E1",
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  notesContainer: {
    backgroundColor: "rgba(114, 9, 183, 0.05)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#7209B7",
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7209B7",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  rejectionContainer: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#F44336",
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F44336",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#9E9E9E",
  },
  disabledButtonText: {
    color: "rgba(255,255,255,0.7)",
  },
  bottomSpace: {
    height: 20,
  },
});

export default TicketRequestsScreen;