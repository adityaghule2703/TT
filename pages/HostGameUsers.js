import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HostGameUsers = ({ route, navigation }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchGameUsers();
  }, [gameId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameUsers();
    setRefreshing(false);
  };

  const fetchGameUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/game/${gameId}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setSummary(response.data.summary);
        setUsers(response.data.users || []);
        setError(null);
      } else {
        throw new Error("Failed to fetch game users");
      }
    } catch (error) {
      console.log("Error fetching game users:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "failed":
        return "#F44336";
      default:
        return "#607D8B";
    }
  };

  const renderUserCard = (user) => (
    <View key={user.user_id} style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {user.user_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.user_name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: getPaymentStatusColor(user.payment_status) + "15" },
          ]}
        >
          <Text
            style={[
              styles.paymentText,
              { color: getPaymentStatusColor(user.payment_status) },
            ]}
          >
            {user.payment_status.charAt(0).toUpperCase() + user.payment_status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{user.mobile}</Text>
          </View>
        </View>

        {/* 2x2 Grid Layout */}
        <View style={styles.statsContainer}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            {/* Request */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="receipt-outline" size={18} color="#3498db" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{user.total_requests}</Text>
                <Text style={styles.statLabel}>Request</Text>
              </View>
            </View>

            {/* Requested */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="ticket-outline" size={18} color="#3498db" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{user.total_tickets_requested}</Text>
                <Text style={styles.statLabel}>Requested</Text>
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.statsRow}>
            {/* Approved */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{user.approved_tickets}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash-outline" size={18} color="#4CAF50" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>₹{user.paid_amount}</Text>
                <Text style={styles.statLabel}>Amount</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Approved Amount</Text>
            <Text style={styles.amountValue}>₹{user.total_amount_approved}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid Amount</Text>
            <Text style={[styles.amountValue, { color: getPaymentStatusColor(user.payment_status) }]}>
              ₹{user.paid_amount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading players list...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={80} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Players</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchGameUsers}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {gameName}
          </Text>
          <Text style={styles.headerSubtitle}>Players List</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchGameUsers}>
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
        {summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Game Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Ionicons name="people-outline" size={24} color="#3498db" />
                <Text style={styles.summaryCount}>{summary.total_users}</Text>
                <Text style={styles.summaryLabel}>Total Players</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="ticket-outline" size={24} color="#4CAF50" />
                <Text style={styles.summaryCount}>{summary.total_approved_tickets}</Text>
                <Text style={styles.summaryLabel}>Approved Tickets</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="cash-outline" size={24} color="#9C27B0" />
                <Text style={styles.summaryCount}>₹{summary.total_paid_amount}</Text>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="stats-chart-outline" size={24} color="#FF9800" />
                <Text style={styles.summaryCount}>{summary.average_tickets_per_user}</Text>
                <Text style={styles.summaryLabel}>Avg Tickets/Player</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <Ionicons name="list-outline" size={20} color="#333" />
            <Text style={styles.listTitle}>Players ({users.length})</Text>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              // TODO: Implement export functionality
              alert("Export feature coming soon!");
            }}
          >
            <Ionicons name="download-outline" size={16} color="#3498db" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.usersContainer}>
          {users.length > 0 ? (
            <>
              {users.map(renderUserCard)}
              <View style={styles.listFooter}>
                <Ionicons name="checkmark-done" size={18} color="#9CA3AF" />
                <Text style={styles.listFooterText}>
                  {users.length} player{users.length !== 1 ? "s" : ""} found
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons
                  name="people-outline"
                  size={80}
                  color="#D1D5DB"
                />
                <View style={styles.emptyDot} />
                <View style={[styles.emptyDot, styles.emptyDot2]} />
              </View>
              <Text style={styles.emptyStateTitle}>No Players Yet</Text>
              <Text style={styles.emptyStateText}>
                No players have joined this game yet. Share the game code with players to get started.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={fetchGameUsers}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.emptyStateButtonText}>
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
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
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3498db",
  },
  userCard: {
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
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  userDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  // 2x2 Grid Container
  statsContainer: {
    marginTop: 8,
  },
  // Each row in the grid
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  // Each individual stat item
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  usersContainer: {
    marginBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: 24,
  },
  emptyDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  emptyDot2: {
    top: 10,
    right: 10,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  listFooterText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HostGameUsers;