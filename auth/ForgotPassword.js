import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import axios from "axios";

const ForgotPassword = ({ navigation, route }) => {
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
        url = "https://exilance.com/tambolatimez/public/api/user/request-forgot-password-otp";
        type = "forgot_user";
      } else {
        // Assuming similar API for host forgot password
        url = "https://exilance.com/tambolatimez/public/api/host/request-forgot-password-otp";
        type = "forgot_host";
      }

      const res = await axios.post(url, { mobile });

      Alert.alert("Success", "OTP sent successfully!");

      navigation.navigate("ForgotPasswordVerify", {
        mobile,
        otp_code: res.data.otp,
        role: role,
        type: type,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Failed", err.response?.data?.message || "Unable to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      /> */}

      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {role === "user" ? "User" : "Host"} Account
        </Text>

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

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPassword;

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
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#777", fontSize: 14, marginBottom: 20 },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 13,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#FF7675",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: { color: "#fff", textAlign: "center", fontSize: 17, fontWeight: "700" },
  backText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});