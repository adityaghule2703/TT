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
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Home = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return; // No token, don't fetch
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
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Tambola Live</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Notification Icon */}
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome name="bell" size={26} color="#FF7675" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Icon */}
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.profileIcon}
          />
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search rooms..."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>

      {/* BANNER */}
      <View style={styles.bannerCard}>
        <View>
          <Text style={styles.bannerTitle}>Play Tambola</Text>
          <Text style={styles.bannerSubTitle}>Win exciting prizes daily!</Text>
          <TouchableOpacity style={styles.getStartedBtn}>
            <Text style={styles.getStartedText}>Play Now</Text>
          </TouchableOpacity>
        </View>

        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/616/616554.png",
          }}
          style={styles.bannerImage}
        />
      </View>

      {/* CATEGORY */}
      <Text style={styles.sectionTitle}>Category</Text>

      <View style={styles.categoryRow}>
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
        ].map((cat, i) => (
          <View key={i} style={styles.categoryCard}>
            <Image source={{ uri: cat.icon }} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{cat.name}</Text>
          </View>
        ))}
      </View>

      {/* RECOMMENDED ROOMS */}
      <Text style={styles.sectionTitle}>Recommended Rooms</Text>

      {[
        { title: "Fast Tambola Room", players: "12/50 joined" },
        { title: "Mega Prize Room", players: "28/50 joined" },
        { title: "Weekend Special", players: "45/50 joined" },
      ].map((room, i) => (
        <View key={i} style={styles.roomCard}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/574/574432.png",
            }}
            style={styles.roomImage}
          />
          <View style={styles.roomInfo}>
            <Text style={styles.roomTitle}>{room.title}</Text>
            <Text style={styles.roomSub}>{room.players}</Text>
          </View>
          <TouchableOpacity style={styles.joinRoomBtn}>
            <Text style={styles.joinRoomText}>Join</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* LIVE MATCHES */}
      <Text style={styles.sectionTitle}>Live Matches</Text>

      <View style={styles.liveRow}>
        {[
          { title: "Quick Battle", players: "34 Playing" },
          { title: "Mega Live", players: "78 Playing" },
        ].map((room, i) => (
          <View key={i} style={styles.liveCard}>
            <Text style={styles.liveTitle}>{room.title}</Text>
            <Text style={styles.livePlayers}>{room.players}</Text>
            <TouchableOpacity style={styles.watchBtn}>
              <Text style={styles.watchText}>Watch</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* RECENT WINNERS */}
      <Text style={styles.sectionTitle}>Recent Winners</Text>

      {[
        { name: "Amit", prize: "Won Full House 🏆" },
        { name: "Neha", prize: "Won Early 5 🎉" },
        { name: "Rahul", prize: "Won Corners ✨" },
      ].map((winner, i) => (
        <View key={i} style={styles.winnerCard}>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Text style={styles.winnerPrize}>{winner.prize}</Text>
        </View>
      ))}

      {/* INFO SECTION */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why Play With Us?</Text>
        <Text style={styles.infoText}>✅ Fast & Fair Games</Text>
        <Text style={styles.infoText}>✅ Real Players</Text>
        <Text style={styles.infoText}>✅ 24x7 Rooms Available</Text>
        <Text style={styles.infoText}>✅ Safe & Fun Experience</Text>
      </View>

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>

            {loadingNotifications ? (
              <ActivityIndicator size="large" color="#FF7675" />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>
                      {item.message}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={<Text>No notifications</Text>}
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

// Styles remain same as previous code, include modal & badge styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 18,
  },
  header: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: { fontSize: 20, fontWeight: "800" },
  profileIcon: { width: 40, height: 40, borderRadius: 20 },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 15,
  },
  searchInput: { height: 45, fontSize: 15 },
  bannerCard: {
    backgroundColor: "#FF7675",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  bannerSubTitle: { fontSize: 13, color: "#fff", marginVertical: 6 },
  getStartedBtn: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  getStartedText: { color: "#FF7675", fontWeight: "700" },
  bannerImage: { width: 80, height: 80 },
  sectionTitle: { marginTop: 25, fontSize: 18, fontWeight: "800" },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  categoryCard: {
    width: "22%",
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  categoryIcon: { width: 32, height: 32, marginBottom: 8 },
  categoryText: { fontSize: 12, fontWeight: "600" },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginTop: 15,
  },
  roomImage: { width: 50, height: 50 },
  roomInfo: { flex: 1, marginLeft: 12 },
  roomTitle: { fontSize: 15, fontWeight: "700" },
  roomSub: { fontSize: 12, color: "#777", marginTop: 4 },
  joinRoomBtn: {
    backgroundColor: "#FF7675",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  joinRoomText: { color: "#fff", fontWeight: "700" },
  liveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  liveCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
  },
  liveTitle: { fontSize: 14, fontWeight: "700" },
  livePlayers: { fontSize: 12, color: "#777", marginVertical: 6 },
  watchBtn: {
    backgroundColor: "#FF7675",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  watchText: { color: "#fff", fontWeight: "700" },
  winnerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  winnerName: { fontWeight: "700" },
  winnerPrize: { color: "#777", fontWeight: "600" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 25,
    marginBottom: 30,
  },
  infoTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  infoText: { fontSize: 13, color: "#777", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  notificationItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
  },
  notificationTitle: { fontWeight: "700", fontSize: 14 },
  notificationMessage: { fontSize: 12, color: "#555", marginTop: 2 },
  notificationDate: { fontSize: 10, color: "#999", marginTop: 2 },
  closeBtn: {
    backgroundColor: "#FF7675",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeBtnText: { color: "#fff", fontWeight: "700" },
});
