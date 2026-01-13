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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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
  const floatingBallsAnim = useRef(new Animated.Value(0)).current;
  const numberParticlesAnim = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;

  // Create multiple floating balls
  const floatingBalls = Array.from({ length: 8 }, (_, i) => ({
    x: useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current,
    y: useRef(new Animated.Value(Math.random() * 200)).current,
    scale: useRef(new Animated.Value(0.3 + Math.random() * 0.7)).current,
    opacity: useRef(new Animated.Value(0.1 + Math.random() * 0.2)).current,
  }));

  // Create number particles
  const numberParticles = Array.from({ length: 15 }, (_, i) => ({
    x: useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current,
    y: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    number: Math.floor(Math.random() * 90) + 1,
  }));

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(particleScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }),
    ]).start();

    // Start floating balls animation
    floatingBalls.forEach((ball) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ball.x, {
              toValue: Math.random() * SCREEN_WIDTH,
              duration: 3000 + Math.random() * 4000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
          ]),
          Animated.sequence([
            Animated.timing(ball.y, {
              toValue: 150 + Math.random() * 100,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
            Animated.timing(ball.y, {
              toValue: Math.random() * 200,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
          ]),
          Animated.sequence([
            Animated.timing(ball.scale, {
              toValue: 0.5 + Math.random() * 0.5,
              duration: 1500 + Math.random() * 2000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
            Animated.timing(ball.scale, {
              toValue: 0.3 + Math.random() * 0.4,
              duration: 1500 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });

    // Start number particles animation
    numberParticles.forEach((particle, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
          Animated.timing(particle.y, {
            toValue: SCREEN_HEIGHT * 0.4,
            duration: 2500 + index * 200,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
        ]).start();
      }, index * 150);
    });

  }, []);

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
  };

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

      // Success animation with particle effects
      numberParticles.forEach((particle) => {
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });

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
        {/* Animated Background Elements */}
        <View style={styles.background}>
          {/* Floating colored balls */}
          {floatingBalls.map((ball, index) => (
            <Animated.View
              key={index}
              style={[
                styles.floatingBall,
                {
                  backgroundColor: index % 3 === 0 ? '#5D5FEF' : index % 3 === 1 ? '#FF6B6B' : '#4ECDC4',
                  transform: [
                    { translateX: ball.x },
                    { translateY: ball.y },
                    { scale: ball.scale },
                  ],
                  opacity: ball.opacity,
                },
              ]}
            />
          ))}

          {/* Number particles */}
          {numberParticles.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.numberParticle,
                {
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: particle.scale },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            >
              <Text style={styles.numberText}>{particle.number}</Text>
            </Animated.View>
          ))}
        </View>

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
              {/* Animated Header */}
              <View style={styles.header}>
                <Animated.View 
                  style={[
                    styles.headerIconContainer,
                    {
                      transform: [{ scale: particleScale }]
                    }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="dice-multiple" 
                    size={32} 
                    color="#5D5FEF" 
                  />
                </Animated.View>
                <Text style={styles.appName}>Tambola Timez</Text>
                <Text style={styles.tagline}>Quick Sign In</Text>
              </View>

              {/* Compact Login Card */}
              <Animated.View style={styles.card}>
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
                    <Ionicons 
                      name="person" 
                      size={18} 
                      color={selectedRole === "user" ? "#FFF" : "#666"} 
                    />
                    <Text style={[
                      styles.roleButtonText,
                      selectedRole === "user" && styles.roleButtonTextActive
                    ]}>
                      Player
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === "host" && styles.roleButtonActive,
                    ]}
                    onPress={() => setSelectedRole("host")}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="mic" 
                      size={18} 
                      color={selectedRole === "host" ? "#FFF" : "#666"} 
                    />
                    <Text style={[
                      styles.roleButtonText,
                      selectedRole === "host" && styles.roleButtonTextActive
                    ]}>
                      Host
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Feather name="smartphone" size={18} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Mobile Number"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Feather name="lock" size={18} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#999"
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
                      <Feather 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={18} 
                        color="#666" 
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
                      {isLoading ? (
                        <Feather name="loader" size={20} color="#FFF" style={styles.loadingIcon} />
                      ) : (
                        <Text style={styles.loginButtonText}>SIGN IN</Text>
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
              </Animated.View>

              {/* Bottom Quick Info */}
              <View style={styles.bottomInfo}>
                <Text style={styles.infoText}>
                  By signing in, you agree to our Terms & Privacy
                </Text>
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
    backgroundColor: '#F8FAFF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingBall: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  numberParticle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5D5FEF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#5D5FEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#718096',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: '#5D5FEF',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    height: '100%',
  },
  passwordToggle: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#5D5FEF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5D5FEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingIcon: {
    transform: [{ rotate: '0deg' }],
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkText: {
    color: '#5D5FEF',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E0',
  },
  bottomInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});