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

const MobileVerifyOtp = ({ navigation, route }) => {
  const { mobile, role = "user", type = "user" } = route.params;
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return Alert.alert("Error", "Enter valid 6-digit OTP");
    }

    setIsLoading(true);

    try {
      let url = "";
      let verifyType = type;

      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/verify-otp";
        verifyType = "user";
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/verify-otp";
        verifyType = "host";
      }

      const res = await axios.post(url, {
        mobile,
        code: otp,
        type: verifyType,
      });

      Alert.alert("Success", "OTP Verified!");

      navigation.navigate("Register", {
        mobile,
        otp_code: otp,
        role: role,
      });
    } catch (error) {
      console.log(error.response?.data || error);
      Alert.alert("Error", error.response?.data?.message || "Incorrect OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png",
        }}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          {role === "user" ? "User" : "Host"} Registration
        </Text>

        <View style={styles.mobileInfo}>
          <Text style={styles.mobileText}>Mobile: {mobile}</Text>
        </View>

        <TextInput
          placeholder="Enter 6-digit OTP"
          keyboardType="number-pad"
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholderTextColor="#999"
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={verifyOtp}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Didn't receive OTP? Try again after few seconds
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("MobileVerify", { role: role })
          }
        >
          <Text style={styles.backText}>← Back to Mobile Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MobileVerifyOtp;

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
  mobileInfo: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: "center",
  },
  mobileText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
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