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

const MobileVerify = ({ navigation }) => {
  const [mobile, setMobile] = useState("");

  const sendOtp = async () => {
    if (!mobile) return Alert.alert("Error", "Please enter mobile number");

    try {
      const res = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/request-registration-otp",
        { mobile }
      );

      Alert.alert("Success", "OTP sent successfully!");

      navigation.navigate("MobileVerifyOtp", {
        mobile,
        otp_code: res.data.otp,
      });
    } catch (err) {
      Alert.alert("Failed", "Unable to send OTP");
      console.log(err);
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
          Enter your mobile number to get OTP
        </Text>

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

        <Text style={styles.footerText}>
          You will receive a 6-digit OTP on your number
        </Text>
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
    marginBottom: 25,
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
});
