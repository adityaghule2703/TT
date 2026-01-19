import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Login = ({ navigation, onLoginSuccess }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation references
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert("Required", "Please enter mobile number and password");
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    // Button press animation
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();

    try {
      let loginUrl = "";
      let tokenKey = "";
      let userKey = "";

      if (selectedRole === "user") {
        loginUrl = "https://exilance.com/tambolatimez/public/api/user/login";
        tokenKey = "userToken";
        userKey = "user";
      } else {
        loginUrl = "https://exilance.com/tambolatimez/public/api/host/login";
        tokenKey = "hostToken";
        userKey = "host";
      }

      const res = await axios.post(loginUrl, { mobile, password });
      const token = res.data.token;
      const userData = res.data.user || res.data.host || res.data.data || {};

      if (!token) {
        throw new Error("Invalid credentials");
      }

      // Clear previous storage
      await AsyncStorage.multiRemove(["userToken", "hostToken", "user", "host", "token", "userData", "userRole"]);

      // Store data
      await AsyncStorage.setItem("userRole", selectedRole);
      await AsyncStorage.setItem(tokenKey, token);
      await AsyncStorage.setItem(userKey, JSON.stringify(userData));
      await AsyncStorage.setItem("userData", JSON.stringify({ ...userData, role: selectedRole }));
      await AsyncStorage.setItem("token", token);

      // Success animation
      setTimeout(() => {
        onLoginSuccess();
      }, 400);

    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      
      // Error shake animation
      const shake = new Animated.Value(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();

      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid mobile number or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Subtle Background Gradient */}
        <View style={styles.backgroundGradient} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.mainContent,
                {
                  opacity: fadeIn,
                  transform: [{ translateY: cardSlide }]
                }
              ]}
            >
              {/* Simple Welcome Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.appName}>Tambola Timez</Text>
                  <Text style={styles.welcomeText}>Welcome Back!</Text>
                </View>
              </View>

              {/* Glassmorphism Login Card */}
              <View style={styles.card}>
                {/* Glass effect overlay */}
                <View style={styles.glassOverlay} />
                
                {/* Role Selection */}
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === "user" && styles.roleButtonActive,
                    ]}
                    onPress={() => setSelectedRole("user")}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.roleButtonContent,
                      selectedRole === "user" && styles.roleButtonContentActive
                    ]}>
                      <Ionicons 
                        name="person" 
                        size={20} 
                        color={selectedRole === "user" ? "#FFF" : "#4682B4"} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        selectedRole === "user" && styles.roleButtonTextActive
                      ]}>
                        Player
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === "host" && styles.roleButtonActive,
                    ]}
                    onPress={() => setSelectedRole("host")}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.roleButtonContent,
                      selectedRole === "host" && styles.roleButtonContentActive
                    ]}>
                      <Ionicons 
                        name="mic" 
                        size={20} 
                        color={selectedRole === "host" ? "#FFF" : "#4682B4"} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        selectedRole === "host" && styles.roleButtonTextActive
                      ]}>
                        Host
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#4682B4" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Mobile Number"
                      placeholderTextColor="rgba(70, 130, 180, 0.6)"
                      style={styles.input}
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4682B4" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="rgba(70, 130, 180, 0.6)"
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#4682B4" 
                      />
                    </TouchableOpacity>
                  </View>

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        isLoading && styles.loginButtonDisabled
                      ]}
                      onPress={handleLogin}
                      disabled={isLoading}
                      activeOpacity={0.9}
                    >
                      {/* Glass effect overlay */}
                      <View style={styles.glassEffectOverlay} />
                      
                      {isLoading ? (
                        <Ionicons name="reload-circle" size={24} color="#FFF" style={styles.loadingIcon} />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>SIGN IN</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Quick Links */}
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword", { role: selectedRole })}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <View style={styles.separator} />

                  <TouchableOpacity 
                    onPress={() => navigation.navigate("ChooseRole")}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Quick Info */}
              <View style={styles.bottomInfo}>
                <Text style={styles.infoText}>
                  By signing in, you agree to our Terms & Privacy
                </Text>
                <Text style={styles.versionText}>Tambola Timez v1.0</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
    backgroundColor: 'rgba(135, 206, 235, 0.08)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#4682B4',
    marginBottom: 8,
    textShadowColor: 'rgba(70, 130, 180, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  welcomeText: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: '500',
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 25,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 15,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(70, 130, 180, 0.1)',
  },
  roleButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  roleButtonContentActive: {
    backgroundColor: '#4A90E2',
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4682B4',
  },
  roleButtonTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(70, 130, 180, 0.15)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    height: '100%',
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 6,
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassEffectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingIcon: {
    transform: [{ rotate: '0deg' }],
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(70, 130, 180, 0.3)',
  },
  bottomInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoText: {
    color: 'rgba(70, 130, 180, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  versionText: {
    color: 'rgba(70, 130, 180, 0.6)',
    fontSize: 11,
  },
});