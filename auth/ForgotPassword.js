import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import axios from "axios";

const ForgotPassword = ({ navigation }) => {
  const [mobile, setMobile] = useState("");

  const sendOtp = async () => {
    if (!mobile) return Alert.alert("Error", "Please enter mobile number");

    try {
      const res = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/request-forgot-password-otp",
        { mobile }
      );

      Alert.alert("Success", "OTP sent successfully!");

      navigation.navigate("ForgotPasswordVerify", {
        mobile,
        otp_code: res.data.otp, // backend returns otp
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Failed", "Unable to send OTP");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your registered mobile number</Text>

        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={sendOtp}>
          <Text style={styles.btnText}>Send OTP</Text>
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
  btnText: { color: "#fff", textAlign: "center", fontSize: 17, fontWeight: "700" },
});
