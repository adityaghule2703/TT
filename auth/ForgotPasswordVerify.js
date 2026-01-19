import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";

const ForgotPasswordVerify = ({ navigation, route }) => {
  const { mobile, role = "user", type = "forgot_user" } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    // Allow only numeric input
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-focus previous input on backspace if current is empty
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    
    if (!otpString || otpString.length !== 6) {
      return Alert.alert("Error", "Enter valid 6-digit OTP");
    }

    setIsLoading(true);

    try {
      let url = "";
      
      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/verify-otp";
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/verify-otp";
      }

      await axios.post(url, {
        mobile,
        code: otpString,
        type: type,
      });

      Alert.alert("Success", "OTP Verified!");

      navigation.navigate("ResetPassword", {
        mobile,
        otp_code: otpString,
        role: role,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err.response?.data?.message || "Incorrect OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const clearOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          {role === "user" ? "User" : "Host"} Password Reset
        </Text>

        <View style={styles.mobileInfo}>
          <Text style={styles.mobileText}>Mobile: {mobile}</Text>
        </View>

        <Text style={styles.instruction}>Enter the 6-digit OTP sent to your mobile</Text>

        {/* OTP Boxes Container with padding */}
        <View style={styles.otpWrapper}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                placeholder="•"
                placeholderTextColor="#999"
                textAlign="center"
                autoFocus={index === 0}
                selectionColor="#FF7675"
              />
            ))}
          </View>
        </View>

        {/* Clear OTP Button */}
        <TouchableOpacity onPress={clearOtp} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear OTP</Text>
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={verifyOtp}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Mobile Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordVerify;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    justifyContent: "center",
    paddingHorizontal: 20,
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
    color: "#333",
    marginBottom: 5,
  },
  subtitle: { 
    textAlign: "center", 
    color: "#777", 
    fontSize: 14, 
    marginBottom: 20,
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
  instruction: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
  },
  otpWrapper: {
    paddingHorizontal: 15, // Added horizontal padding to prevent touching edges
    marginBottom: 15,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Changed back to space-between for even distribution
  },
  otpBox: {
    width: 40,  // Reduced width
    height: 48, // Reduced height
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  otpBoxFilled: {
    borderColor: "#FF7675",
    backgroundColor: "#FFF5F5",
  },
  clearBtn: {
    alignSelf: "center",
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
  },
  clearText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  btn: {
    backgroundColor: "#FF7675",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 5,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: { 
    color: "#fff", 
    textAlign: "center", 
    fontSize: 17, 
    fontWeight: "700" 
  },
  backText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});