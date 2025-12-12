import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import axios from "axios";

const ResetPassword = ({ navigation, route }) => {
  const { mobile, otp_code } = route.params;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const resetPassword = async () => {
    if (password !== confirm) return Alert.alert("Error", "Passwords do not match");

    try {
      await axios.post("https://exilance.com/tambolatimez/public/api/user/reset-password", {
        mobile,
        otp_code,
        password,
        password_confirmation: confirm,
      });

      Alert.alert("Success", "Password reset successfully!");
      navigation.replace("Login");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to reset password");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter new password</Text>

        <TextInput
          placeholder="New Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={resetPassword}>
          <Text style={styles.btnText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ResetPassword;

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
