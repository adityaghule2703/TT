import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

const HostDashboard = ({ navigation, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/host/dashboard-summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setStats(response.data.stats);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Add these helper functions inside the HostDashboard component, before the return statement:

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const formatPercentage = (rate) => {
  // Round to nearest whole number
  const roundedRate = Math.round(rate);
  return `${roundedRate}%`;
};

const getDynamicFontSize = (value, isPercentage = false) => {
  const numStr = isPercentage ? formatPercentage(value) : formatNumber(value);
  const length = numStr.length;
  
  // Base font size is 22, reduce based on character count
  if (isPercentage) {
    // For percentages (like "100%" or "99%")
    if (length <= 4) return 22; // 99%
    return 20; // 100%
  } else {
    // For regular numbers
    if (length <= 3) return 22; // 0, 10, 100
    if (length === 4) return 20; // 1000, 1.5K
    if (length === 5) return 18; // 10,000, 99.9K
    if (length === 6) return 16; // 100,000
    return 14; // For very large numbers
  }
};

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = await AsyncStorage.getItem("hostToken");
      if (!token) return;
      
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/host/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.status) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7675" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorTitle}>Dashboard Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF7675"
          colors={['#FF7675']}
        />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.appTitle}>Game Host</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS CARDS */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE6E6' }]}>
            <FontAwesome name="gamepad" size={18} color="#FF7675" />
          </View>
          <Text style={styles.statNumber}>{stats?.games?.total_games || 0}</Text>
          <Text style={styles.statLabel}>Total Games</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFEDED' }]}>
            <FontAwesome name="ticket" size={18} color="#FF7675" />
          </View>
          <Text style={styles.statNumber}>{stats?.tickets?.total_generated || 0}</Text>
          <Text style={styles.statLabel}>Tickets</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE6E6' }]}>
            <FontAwesome name="rupee" size={18} color="#FF7675" />
          </View>
          <Text style={styles.statNumber}>{stats?.revenue?.total_revenue || 0}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* TICKETS ANALYTICS - BIG BANNER CARD */}
      <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Tickets Analytics</Text>
</View>

<View style={styles.ticketsBannerCard}>
  <View style={styles.ticketsBannerContent}>
    <View style={styles.ticketsBannerTextContainer}>
      <Text style={styles.ticketsBannerTitle}>Ticket Performance</Text>
      <Text style={styles.ticketsBannerSubTitle}>Track your ticket sales and distribution</Text>
      
      <View style={styles.ticketsStatsRow}>
        <View style={styles.ticketStatMini}>
          <Text 
            style={[
              styles.ticketStatMiniValue,
              { 
                fontSize: getDynamicFontSize(stats?.tickets?.total_allocated || 0)
              }
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatNumber(stats?.tickets?.total_allocated || 0)}
          </Text>
          <Text style={styles.ticketStatMiniLabel} numberOfLines={1}>
            Allocated
          </Text>
        </View>
        
        <View style={styles.ticketStatDivider} />
        
        <View style={styles.ticketStatMini}>
          <Text 
            style={[
              styles.ticketStatMiniValue,
              { 
                fontSize: getDynamicFontSize(stats?.tickets?.total_available || 0)
              }
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatNumber(stats?.tickets?.total_available || 0)}
          </Text>
          <Text style={styles.ticketStatMiniLabel} numberOfLines={1}>
            Available
          </Text>
        </View>
        
        <View style={styles.ticketStatDivider} />
        
        <View style={styles.ticketStatMini}>
          <Text 
            style={[
              styles.ticketStatMiniValue,
              { 
                fontSize: getDynamicFontSize(stats?.tickets?.allocation_rate || 0, true)
              }
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatPercentage(stats?.tickets?.allocation_rate || 0)}
          </Text>
          <Text style={[styles.ticketStatMiniLabel, styles.compactLabel]} numberOfLines={1}>
            Allocation Rate
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.ticketsViewBtn}>
        <Text style={styles.ticketsViewText}>View Detailed Report</Text>
        <Ionicons name="arrow-forward" size={16} color="#FF7675" />
      </TouchableOpacity>
    </View>
    <Image
      source={{
        uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      }}
      style={styles.ticketsBannerImage}
    />
  </View>
</View>

      {/* TODAY'S GAMES & UPCOMING */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Games Overview</Text>
      </View>

      <View style={styles.gamesOverview}>
        <View style={styles.gameStatCard}>
          <View style={styles.gameStatHeader}>
            <View style={[styles.gameStatIcon, { backgroundColor: '#FFEDED' }]}>
              <Ionicons name="today-outline" size={20} color="#FF7675" />
            </View>
            <View style={styles.gameStatTextContainer}>
              <Text style={styles.gameStatTitle}>Today's Games</Text>
            </View>
          </View>
          <Text style={styles.gameStatValue}>{stats?.games?.todays_games || 0}</Text>
          <Text style={styles.gameStatSub}>Live today</Text>
        </View>

        <View style={styles.gameStatCard}>
          <View style={styles.gameStatHeader}>
            <View style={[styles.gameStatIcon, { backgroundColor: '#FFEDED' }]}>
              <Ionicons name="calendar-outline" size={20} color="#FF7675" />
            </View>
            <View style={styles.gameStatTextContainer}>
              <Text style={styles.gameStatTitle}>Upcoming</Text>
            </View>
          </View>
          <Text style={styles.gameStatValue}>{stats?.games?.upcoming_games || 0}</Text>
          <Text style={styles.gameStatSub}>Scheduled</Text>
        </View>
      </View>

      {/* PENDING REQUESTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
      </View>

      <View style={styles.requestsCard}>
        <View style={styles.requestHeader}>
          <View style={[styles.requestIcon, { backgroundColor: '#FFEDED' }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF7675" />
          </View>
          <View style={styles.requestTextContainer}>
            <Text style={styles.requestTitle}>Action Required</Text>
            <Text style={styles.requestCount} numberOfLines={1}>
              {stats?.requests?.pending_requests || 0} requests pending
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewRequestsBtn}>
          <Text style={styles.viewRequestsText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color="#FF7675" />
        </TouchableOpacity>
      </View>

      {/* GAMES BY STATUS */}
      {stats?.games?.games_by_status?.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Games by Status</Text>
          </View>

          <View style={styles.statusContainer}>
            {stats.games.games_by_status.map((status, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusInfo}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status.status) }]} />
                  <Text style={styles.statusLabel} numberOfLines={1}>{status.status}</Text>
                </View>
                <Text style={styles.statusCount}>{status.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* RECENT GAMES */}
      {stats?.recent_games?.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Games</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentGamesContainer}>
            {stats.recent_games.slice(0, 3).map((game, index) => (
              <View key={index} style={styles.recentGameCard}>
                <View style={styles.recentGameHeader}>
                  <Text style={styles.recentGameTitle} numberOfLines={1}>
                    {game.name || "Unnamed Game"}
                  </Text>
                  <View style={[
                    styles.recentGameStatus,
                    { backgroundColor: getStatusColor(game.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.recentGameStatusText,
                      { color: getStatusColor(game.status) }
                    ]}>
                      {game.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentGameDetails}>
                  {game.date && (
                    <View style={styles.recentGameDetail}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.recentGameDetailText} numberOfLines={1}>
                        {new Date(game.date).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  )}
                  {game.participants && (
                    <View style={styles.recentGameDetail}>
                      <Ionicons name="people-outline" size={14} color="#666" />
                      <Text style={styles.recentGameDetailText} numberOfLines={1}>
                        {game.participants} participants
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={60} color="#CCC" />
          <Text style={styles.emptyStateTitle}>No Games Yet</Text>
          <Text style={styles.emptyStateText}>Create your first game to get started</Text>
          <TouchableOpacity style={styles.createGameBtn}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.createGameText}>Create New Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QUICK ACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFEDED' }]}>
            <Ionicons name="add-circle-outline" size={24} color="#FF7675" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>New Game</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFEDED' }]}>
            <Ionicons name="ticket-outline" size={24} color="#FF7675" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>Generate Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFEDED' }]}>
            <Ionicons name="bar-chart-outline" size={24} color="#FF7675" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SPACE */}
      <View style={styles.bottomSpace} />

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <ActivityIndicator size="large" color="#FF7675" style={styles.loadingIndicator} />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationIcon}>
                      <Ionicons name="notifications" size={20} color="#FF7675" />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title || "New Update"}</Text>
                      <Text style={styles.notificationMessage} numberOfLines={3}>
                        {item.message || "Check out the new features!"}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : "Just now"}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off" size={50} color="#CCC" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HostDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 30,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7675",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: "#FF7675",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    marginLeft: 10,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFF",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF7675",
  },
  badgeText: {
    color: "#FF7675",
    fontSize: 10,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: -20,
  },
  statItem: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  compactLabel: {
  fontSize: 10,
  letterSpacing: -0.2,
  paddingHorizontal: 2,
},
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  seeAll: {
    fontSize: 14,
    color: "#FF7675",
    fontWeight: "600",
  },
  // TICKETS ANALYTICS BANNER
  ticketsBannerCard: {
    backgroundColor: "#FF7675",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  ticketsBannerContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  ticketsBannerTextContainer: {
    flex: 1,
  },
  ticketsBannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  ticketsBannerSubTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
  },
  ticketsStatsRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "rgba(255,255,255,0.15)",
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 8,
  marginBottom: 16,
  minHeight: 90,
  justifyContent: 'space-between',
},
  ticketStatMini: {
  flex: 1,
  alignItems: "center",
  minWidth: 0,
  paddingHorizontal: 2,
  justifyContent: 'center',
},
  ticketStatMiniValue: {
  fontWeight: "800",
  color: "#FFF",
  marginBottom: 2,
  textAlign: 'center',
  minHeight: 26,
},
  ticketStatMiniLabel: {
  fontSize: 12,
  color: "rgba(255,255,255,0.9)",
  textAlign: 'center',
  flexShrink: 1,
  minHeight: 14,
},
  ticketStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  ticketsViewBtn: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
    gap: 8,
  },
  ticketsViewText: {
    color: "#FF7675",
    fontWeight: "700",
    fontSize: 14,
  },
  ticketsBannerImage: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },
  gamesOverview: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  gameStatCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  gameStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gameStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  gameStatTextContainer: {
    flex: 1,
  },
  gameStatTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  gameStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  gameStatSub: {
    fontSize: 12,
    color: "#666",
  },
  requestsCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dynamicNumberSize: {
  fontWeight: "800",
  color: "#FFF",
  marginBottom: 2,
  textAlign: 'center',
  minHeight: 26,
},
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestTextContainer: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  requestCount: {
    fontSize: 14,
    color: "#666",
  },
  viewRequestsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDED",
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewRequestsText: {
    color: "#FF7675",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  statusContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textTransform: "capitalize",
    flex: 1,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  recentGamesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  recentGameCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  recentGameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentGameTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  recentGameStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentGameStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  recentGameDetails: {
    flexDirection: "row",
    gap: 16,
    flexWrap: 'wrap',
  },
  recentGameDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  recentGameDetailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    maxWidth: width * 0.3,
  },
  emptyState: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  createGameBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7675",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createGameText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    minHeight: 100,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  bottomSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    lineHeight: 18,
  },
  notificationDate: {
    fontSize: 11,
    color: "#999",
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  closeBtn: {
    backgroundColor: "#FF7675",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});