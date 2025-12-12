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
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation, onLoginSuccess }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!mobile || !password) {
      return Alert.alert("Error", "Please enter mobile & password");
    }

    try {
      const res = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/login",
        { mobile, password }
      );

      const token = res.data.token;

      if (!token) {
        return Alert.alert("Login Failed", "Invalid credentials");
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

      onLoginSuccess();
    } catch (error) {
      Alert.alert("Login Failed", "Check mobile or password");
      console.log(error);
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue playing</Text>

        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
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

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        {/* Forgot Password Link */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgot}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("MobileVerify")}>
          <Text style={styles.link}>
            Not registered? <Text style={styles.signUp}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;

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

  forgot: {
    textAlign: "center",
    marginTop: 12,
    color: "#FF7675",
    fontSize: 14,
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    marginTop: 15,
    color: "#555",
    fontSize: 14,
  },

  signUp: {
    color: "#FF7675",
    fontWeight: "700",
  },
});
