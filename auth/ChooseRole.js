import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

const ChooseRole = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* APP LOGO */}
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png",
        }}
        style={styles.logo}
      />

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Choose Account Type</Text>
        <Text style={styles.subtitle}>Select how you want to use the app</Text>

        {/* USER CARD */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate("MobileVerify", { role: "user" })}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#FF7675" }]}>
            <Text style={styles.icon}>👤</Text>
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>User</Text>
            <Text style={styles.roleDescription}>
              Join games, play and win prizes
            </Text>
          </View>
        </TouchableOpacity>

        {/* HOST CARD */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate("MobileVerify", { role: "host" })}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#3498db" }]}>
            <Text style={styles.icon}>🎮</Text>
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Host</Text>
            <Text style={styles.roleDescription}>
              Create and manage games
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.backText}>
            Already have an account? <Text style={styles.loginText}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChooseRole;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon: {
    fontSize: 28,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: "#666",
  },
  backText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
    fontSize: 14,
  },
  loginText: {
    color: "#FF7675",
    fontWeight: "700",
  },
});