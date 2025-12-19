import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation, onLoginSuccess }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user"); // 'user' or 'host'
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      return Alert.alert("Error", "Please enter mobile & password");
    }

    setIsLoading(true);

    try {
      let loginUrl = "";
      let tokenKey = "";
      let userKey = "";
      let userData = null;

      if (selectedRole === "user") {
        loginUrl = "https://exilance.com/tambolatimez/public/api/user/login";
        tokenKey = "userToken";
        userKey = "user";
      } else {
        loginUrl = "https://exilance.com/tambolatimez/public/api/host/login";
        tokenKey = "hostToken";
        userKey = "host";
      }

      const res = await axios.post(loginUrl, { mobile, password });
      const token = res.data.token;
      userData = res.data.user || res.data.host || res.data.data || {};

      if (!token) {
        throw new Error("Invalid credentials");
      }

      // Clear previous storage
      await AsyncStorage.multiRemove(["userToken", "hostToken", "user", "host", "token", "userData", "userRole"]);

      // Store role-specific data
      await AsyncStorage.setItem("userRole", selectedRole);
      await AsyncStorage.setItem(tokenKey, token);
      
      // Only store if userData exists and is not null/undefined
      if (userData && typeof userData === 'object') {
        await AsyncStorage.setItem(userKey, JSON.stringify(userData));
        await AsyncStorage.setItem("userData", JSON.stringify({
          ...userData,
          role: selectedRole
        }));
      } else {
        // Store empty object if no user data
        await AsyncStorage.setItem(userKey, JSON.stringify({}));
        await AsyncStorage.setItem("userData", JSON.stringify({
          role: selectedRole
        }));
      }

      // Also store in generic token key for backward compatibility
      await AsyncStorage.setItem("token", token);

      onLoginSuccess();
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Check mobile or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* APP LOGO */}
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png",
        }}
        style={styles.logo}
      />

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        {/* ROLE TABS */}
        <View style={styles.roleTabs}>
          <TouchableOpacity
            style={[
              styles.roleTab,
              selectedRole === "user" && styles.roleTabActive,
            ]}
            onPress={() => setSelectedRole("user")}
          >
            <Text
              style={[
                styles.roleTabText,
                selectedRole === "user" && styles.roleTabTextActive,
              ]}
            >
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleTab,
              selectedRole === "host" && styles.roleTabActive,
            ]}
            onPress={() => setSelectedRole("host")}
          >
            <Text
              style={[
                styles.roleTabText,
                selectedRole === "host" && styles.roleTabTextActive,
              ]}
            >
              Host
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Role Indicator */}
        <View style={styles.roleIndicator}>
          <Text style={styles.roleIndicatorText}>
            Logging in as {selectedRole === "user" ? "User" : "Host"}
          </Text>
        </View>

        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ForgotPassword", { role: selectedRole })
          }
        >
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("ChooseRole")}>
          <Text style={styles.link}>
            Not registered? <Text style={styles.signUp}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F6F8FA",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    marginBottom: 25,
  },
  roleTabs: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  roleTabActive: {
    backgroundColor: "#FF7675",
  },
  roleTabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  roleTabTextActive: {
    color: "#fff",
  },
  roleIndicator: {
    alignItems: "center",
    marginBottom: 20,
  },
  roleIndicatorText: {
    fontSize: 14,
    color: "#FF7675",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#FF7675",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  forgot: {
    textAlign: "center",
    marginTop: 12,
    color: "#FF7675",
    fontSize: 14,
    fontWeight: "600",
  },
  link: {
    textAlign: "center",
    marginTop: 15,
    color: "#555",
    fontSize: 14,
  },
  signUp: {
    color: "#FF7675",
    fontWeight: "700",
  },
});