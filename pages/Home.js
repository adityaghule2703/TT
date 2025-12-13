import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesome, Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

const Home = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/notifications",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

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
        {/* Top row with app name and notification */}
        <View style={styles.headerTopRow}>
          <Text style={styles.appName}>Tambola Timez</Text>
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
        
        
        {/* Search bar inside header */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search rooms, games or players..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="filter" size={18} color="#FF7675" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Play Tambola Now</Text>
            <Text style={styles.bannerSubTitle}>Win exciting prizes daily!</Text>
            <TouchableOpacity style={styles.getStartedBtn}>
              <Text style={styles.getStartedText}>Play Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FF7675" />
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/616/616554.png",
            }}
            style={styles.bannerImage}
          />
        </View>
      </View>

      {/* QUICK STATS */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE6E6' }]}>
            <Ionicons name="flame" size={18} color="#FF7675" />
          </View>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Active Rooms</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#E6F0FF' }]}>
            <Ionicons name="people" size={18} color="#2196F3" />
          </View>
          <Text style={styles.statNumber}>1.5K</Text>
          <Text style={styles.statLabel}>Players Online</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#E6F7E9' }]}>
            <MaterialIcons name="emoji-events" size={18} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>Today's Wins</Text>
        </View>
      </View>

      {/* CATEGORY */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {[
          {
            name: "Classic",
            icon: "https://cdn-icons-png.flaticon.com/512/854/854866.png",
          },
          {
            name: "Speed",
            icon: "https://cdn-icons-png.flaticon.com/512/2721/2721266.png",
          },
          {
            name: "Private",
            icon: "https://cdn-icons-png.flaticon.com/512/747/747376.png",
          },
          {
            name: "Mega",
            icon: "https://cdn-icons-png.flaticon.com/512/3159/3159066.png",
          },
          {
            name: "Fun",
            icon: "https://cdn-icons-png.flaticon.com/512/2997/2997911.png",
          },
        ].map((cat, i) => (
          <TouchableOpacity key={i} style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              <Image source={{ uri: cat.icon }} style={styles.categoryIcon} />
            </View>
            <Text style={styles.categoryText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RECOMMENDED ROOMS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended Rooms</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roomsContainer}>
        {[
          { title: "Fast Tambola Room", players: "12/50 joined", type: "free" },
          { title: "Mega Prize Room", players: "28/50 joined", type: "premium" },
          { title: "Weekend Special", players: "45/50 joined", type: "free" },
        ].map((room, i) => (
          <View key={i} style={styles.roomCard}>
            <View style={styles.roomHeader}>
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle}>{room.title}</Text>
                <View style={styles.roomMeta}>
                  <Ionicons name="people" size={14} color="#666" />
                  <Text style={styles.roomSub}>{room.players}</Text>
                </View>
              </View>
              <View style={[
                styles.roomTypeBadge,
                room.type === "premium" ? styles.premiumBadge : styles.freeBadge
              ]}>
                <Text style={styles.roomTypeText}>
                  {room.type === "premium" ? "₹50" : "FREE"}
                </Text>
              </View>
            </View>
            
            <View style={styles.roomFooter}>
              <View style={styles.prizeInfo}>
                <MaterialIcons name="emoji-events" size={16} color="#FFB300" />
                <Text style={styles.prizeText}>
                  {room.type === "premium" ? "Prize: ₹2500" : "Exciting Prizes"}
                </Text>
              </View>
              <TouchableOpacity style={[
                styles.joinRoomBtn,
                room.type === "premium" ? styles.premiumBtn : styles.freeBtn
              ]}>
                <Text style={styles.joinRoomText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* LIVE MATCHES */}
      <View style={styles.sectionHeader}>
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.sectionTitle}>Live Matches</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.liveContainer}
      >
        {[
          { title: "Quick Battle", players: "34 Playing" },
          { title: "Mega Live", players: "78 Playing" },
          { title: "VIP Room", players: "12 Playing" },
        ].map((room, i) => (
          <View key={i} style={styles.liveCard}>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.liveTitle}>{room.title}</Text>
            <Text style={styles.livePlayers}>{room.players}</Text>
            <TouchableOpacity style={styles.watchBtn}>
              <Feather name="eye" size={14} color="#FFF" />
              <Text style={styles.watchText}>Watch</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* RECENT WINNERS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Winners</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.winnersContainer}>
        {[
          { name: "Amit", prize: "Won Full House 🏆", time: "2 min ago" },
          { name: "Neha", prize: "Won Early 5 🎉", time: "5 min ago" },
          { name: "Rahul", prize: "Won Corners ✨", time: "10 min ago" },
        ].map((winner, i) => (
          <View key={i} style={styles.winnerCard}>
            <View style={styles.winnerInfo}>
              <View style={styles.winnerAvatar}>
                <Text style={styles.winnerInitial}>{winner.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.winnerName}>{winner.name}</Text>
                <Text style={styles.winnerPrize}>{winner.prize}</Text>
              </View>
            </View>
            <Text style={styles.winnerTime}>{winner.time}</Text>
          </View>
        ))}
      </View>

      {/* INFO SECTION */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why Play With Us?</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Fast & Fair Games</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Real Players</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>24x7 Rooms Available</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Safe & Fun Experience</Text>
          </View>
        </View>
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
                      <Text style={styles.notificationMessage}>
                        {item.message || "Check out the new features!"}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
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

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FF7675",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
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
  welcomeContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8EAED",
    width: "100%",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#333",
  },
  filterButton: {
    padding: 8,
  },
  bannerCard: {
    backgroundColor: "#FF7675",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  bannerSubTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
  },
  getStartedBtn: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
    gap: 8,
  },
  getStartedText: {
    color: "#FF7675",
    fontWeight: "700",
    fontSize: 14,
  },
  bannerImage: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  statItem: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
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
  categoryContainer: {
    paddingHorizontal: 15,
  },
  categoryCard: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  categoryIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  categoryIcon: {
    width: 32,
    height: 32,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  roomsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roomCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomSub: {
    fontSize: 13,
    color: "#666",
  },
  roomTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  freeBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  roomTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prizeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  prizeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  joinRoomBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  premiumBtn: {
    backgroundColor: "#FF7675",
  },
  freeBtn: {
    backgroundColor: "#4CAF50",
  },
  joinRoomText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5252",
  },
  liveContainer: {
    paddingHorizontal: 15,
  },
  liveCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    width: 180,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5252",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF5252",
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  livePlayers: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  watchBtn: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  watchText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  winnersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  winnerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  winnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  winnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF7675",
    justifyContent: "center",
    alignItems: "center",
  },
  winnerInitial: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  winnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  winnerPrize: {
    fontSize: 13,
    color: "#666",
  },
  winnerTime: {
    fontSize: 12,
    color: "#999",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
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
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
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