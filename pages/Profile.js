import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const Profile = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      Alert.alert("Logged Out", "You have been logged out successfully.");

      onLogout();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF7675" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: user?.profile_image
              ? user.profile_image
              : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          }}
          style={styles.profilePic}
        />
        <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
      </View>

      <Text style={styles.sectionTitle}>Account Info</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Username: {user?.username || "N/A"}</Text>
        <Text style={styles.infoText}>Email: {user?.email || "N/A"}</Text>
        <Text style={styles.infoText}>Mobile: {user?.mobile || "N/A"}</Text>
        <Text style={styles.infoText}>
          Referral Code: {user?.referral_code || "N/A"}
        </Text>
        <Text style={styles.infoText}>
          Referral Points: {user?.referral_points || "0"}
        </Text>
        <Text style={styles.infoText}>Status: {user?.status || "N/A"}</Text>
        <Text style={styles.infoText}>
          Under Referral: {user?.under_referral || "N/A"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      {[
        "Edit Profile",
        "My Tickets",
        "Notifications",
        "Privacy & Security",
        "Help & Support",
      ].map((item, i) => (
        <View key={i} style={styles.optionCard}>
          <Text style={styles.optionText}>{item}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", padding: 18 },
  header: { alignItems: "center", marginTop: 20 },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  userName: { fontSize: 20, fontWeight: "800", marginTop: 10 },
  sectionTitle: { marginTop: 25, fontSize: 18, fontWeight: "800" },
  infoCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
  },
  infoText: { fontSize: 14, marginVertical: 4, color: "#777" },
  optionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  optionText: { fontSize: 15, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "#FF7675",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 30,
    marginBottom: 50,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
