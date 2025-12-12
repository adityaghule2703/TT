import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import axios from "axios";

const ForgotPasswordVerify = ({ navigation, route }) => {
  const { mobile } = route.params;
  const [otp, setOtp] = useState("");

  const verifyOtp = async () => {
    try {
      await axios.post("https://exilance.com/tambolatimez/public/api/user/verify-otp", {
        mobile,
        code: otp,
        type: "forgot_user",
      });

      Alert.alert("Success", "OTP Verified!");

      navigation.navigate("ResetPassword", {
        mobile,
        otp_code: otp,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Incorrect OTP");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to your mobile</Text>

        <TextInput
          placeholder="OTP"
          keyboardType="number-pad"
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={verifyOtp}>
          <Text style={styles.btnText}>Verify OTP</Text>
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
  logo: { width: 90, height: 90, alignSelf: "center", marginBottom: 20 },
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
