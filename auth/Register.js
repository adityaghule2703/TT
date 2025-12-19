import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import axios from "axios";

const Register = ({ navigation, route }) => {
  const { mobile, otp_code, role = "user" } = route.params;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [referral, setReferral] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerUser = async () => {
    // Validation
    if (!name || !email || !username || !password || !confirm) {
      return Alert.alert("Error", "Please fill all required fields");
    }

    if (password !== confirm) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    setIsLoading(true);

    try {
      let url = "";
      let requestData = {};

      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/register";
        requestData = {
          mobile,
          name,
          email,
          username,
          dob,
          address,
          under_referral: referral,
          otp_code,
          password,
          password_confirmation: confirm,
        };
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/register";
        requestData = {
          mobile,
          name,
          email,
          username,
          dob,
          address,
          under_referral: referral,
          otp_code,
          password,
          password_confirmation: confirm,
        };
      }

      const res = await axios.post(url, requestData);

      Alert.alert(
        "Success",
        `${
          role === "user" ? "User" : "Host"
        } registration successful! Please login.`
      );
      navigation.replace("Login");
    } catch (err) {
      console.log(err.response?.data || err);
      Alert.alert(
        "Registration Failed",
        err.response?.data?.message || "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      />

      <View style={styles.card}>
        <Text style={styles.title}>
          Create {role === "user" ? "User" : "Host"} Account
        </Text>
        <Text style={styles.subtitle}>
          Register as {role === "user" ? "player" : "game host"}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Mobile: {mobile}</Text>
        </View>

        <TextInput
          placeholder="Full Name *"
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Email *"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Username *"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Date of Birth (YYYY-MM-DD)"
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Address"
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Referral Code (Optional)"
          style={styles.input}
          value={referral}
          onChangeText={setReferral}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password * (min 6 characters)"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Confirm Password *"
          secureTextEntry
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={registerUser}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Registering..." : "Register as " + (role === "user" ? "User" : "Host")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.loginText}>Login</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to OTP Verification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F6F8FA",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
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
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
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
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    color: "#444",
  },
  loginText: {
    color: "#FF7675",
    fontWeight: "700",
  },
  backText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});