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
  const { mobile, otp_code } = route.params;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [referral, setReferral] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const registerUser = async () => {
    try {
      await axios.post("https://exilance.com/tambolatimez/public/api/user/register", {
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
      });

      Alert.alert("Success", "Registration complete");
      navigation.replace("Login");
    } catch (err) {
      Alert.alert("Error", "Registration failed");
      console.log(err);
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* PAGE LOGO */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
        style={styles.logo}
      />

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register to start playing</Text>

        <TextInput
          placeholder="Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="DOB (YYYY-MM-DD)"
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
          placeholder="Referral Code"
          style={styles.input}
          value={referral}
          onChangeText={setReferral}
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

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={registerUser}>
          <Text style={styles.btnText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.loginText}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 20,
  },

  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 40,
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

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  link: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#444",
  },

  loginText: {
    color: "#FF7675",
    fontWeight: "700",
  },
});
