import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import axios from "axios";

const MobileVerify = ({ navigation, route }) => {
  const { role = "user" } = route.params || {};
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async () => {
    if (!mobile) return Alert.alert("Error", "Please enter mobile number");
    if (mobile.length !== 10) return Alert.alert("Error", "Enter valid 10-digit mobile number");

    setIsLoading(true);

    try {
      let url = "";
      let type = "";

      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/request-registration-otp";
        type = "user";
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/request-registration-otp";
        type = "host";
      }

      const res = await axios.post(url, { mobile });

      Alert.alert("Success", "OTP sent successfully!");

      navigation.navigate("MobileVerifyOtp", {
        mobile,
        otp_code: res.data.otp,
        role: role,
        type: type,
      });
    } catch (err) {
      console.log(err.response?.data || err);
      Alert.alert("Failed", err.response?.data?.message || "Unable to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.title}>Mobile Verification</Text>
        <Text style={styles.subtitle}>
          Registering as {role === "user" ? "User" : "Host"}
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {role === "user" ? "👤 User Account" : "🎮 Host Account"}
          </Text>
        </View>

        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholderTextColor="#999"
          maxLength={10}
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={sendOtp}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You will receive a 6-digit OTP on your number
        </Text>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Role Selection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MobileVerify;

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
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: role => role === "user" ? "#FFE8E8" : "#E8F4FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 25,
  },
  roleBadgeText: {
    color: role => role === "user" ? "#FF7675" : "#3498db",
    fontWeight: "600",
    fontSize: 14,
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
  footerText: {
    textAlign: "center",
    marginTop: 15,
    color: "#555",
    fontSize: 13,
  },
  backText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});