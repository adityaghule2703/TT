import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MobileVerify = ({ navigation, route }) => {
  const { role = "user" } = route.params || {};
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation references
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // Start background animations
    startBackgroundAnimations();
  }, []);

  const startBackgroundAnimations = () => {
    // First floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Second floating animation (different timing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for subtle effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Interpolations for animations
  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const sendOtp = async () => {
    if (!mobile) return Alert.alert("Required", "Please enter mobile number");
    if (mobile.length !== 10) return Alert.alert("Invalid", "Enter valid 10-digit mobile number");

    setIsLoading(true);

    try {
      let url = "";
      let type = "";

      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/request-registration-otp";
        type = "user";
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/request-registration-otp";
        type = "host";
      }

      const res = await axios.post(url, { mobile });

      Alert.alert("Success", "OTP sent successfully!");

      navigation.navigate("MobileVerifyOtp", {
        mobile,
        otp_code: res.data.otp,
        role: role,
        type: type,
      });
    } catch (err) {
      console.log(err.response?.data || err);
      Alert.alert("Failed", err.response?.data?.message || "Unable to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sky Background with Animations */}
      <View style={styles.background}>
        {/* Animated floating clouds */}
        <Animated.View 
          style={[
            styles.cloud1, 
            { 
              transform: [
                { translateY: translateY1 },
                { translateX: translateY2 }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.cloud2, 
            { 
              transform: [
                { translateY: translateY2 },
                { translateX: translateY1 }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.cloud3, 
            { 
              transform: [
                { translateY: translateY1 },
                { translateX: translateY2 }
              ] 
            }
          ]} 
        />
        
        {/* Sun */}
        <Animated.View 
          style={[
            styles.sun,
            { 
              transform: [{ rotate: rotate }],
              opacity: pulseAnim
            }
          ]} 
        />
        
        {/* Sky gradient overlay */}
        <View style={styles.skyGradient} />
        
        {/* Mountain silhouette */}
        <View style={styles.mountain1} />
        <View style={styles.mountain2} />
        
        {/* Bird silhouettes */}
        <Animated.View 
          style={[
            styles.bird1,
            { transform: [{ translateX: floatAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50]
            }) }] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.bird2,
            { transform: [{ translateX: floatAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -30]
            }) }] }
          ]} 
        />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Tambola Timez</Text>
          <Text style={styles.tagline}>Mobile Verification</Text>
        </View>

        {/* Glassmorphism Card */}
        <View style={styles.card}>
          {/* Glass effect overlay */}
          <View style={styles.glassOverlay} />
          
          {/* Role Badge */}
          <View style={[
            styles.roleBadge,
            role === "user" ? styles.userBadge : styles.hostBadge
          ]}>
            <Ionicons 
              name={role === "user" ? "person" : "mic"} 
              size={18} 
              color={role === "user" ? "#4682B4" : "#5DADE2"} 
            />
            <Text style={[
              styles.roleBadgeText,
              role === "user" ? styles.userBadgeText : styles.hostBadgeText
            ]}>
              {role === "user" ? "Player Account" : "Host Account"}
            </Text>
          </View>

          {/* Instruction */}
          <Text style={styles.instruction}>
            Enter your mobile number to receive a verification OTP
          </Text>

          {/* Mobile Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={22} color="#4682B4" style={styles.inputIcon} />
            <TextInput
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="rgba(70, 130, 180, 0.6)"
              keyboardType="number-pad"
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              maxLength={10}
            />
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={sendOtp}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {/* Glass effect overlay */}
            <View style={styles.glassEffectOverlay} />
            
            {isLoading ? (
              <Ionicons name="reload-circle" size={24} color="#FFF" style={styles.loadingIcon} />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#FFF" />
                <Text style={styles.btnText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            A 6-digit verification code will be sent to your mobile number
          </Text>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#4682B4" />
            <Text style={styles.backText}>Back to Role Selection</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
          <Text style={styles.versionText}>Tambola Timez v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default MobileVerify;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  // Cloud animations
  cloud1: {
    position: 'absolute',
    top: 60,
    left: SCREEN_WIDTH * 0.1,
    width: 100,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cloud2: {
    position: 'absolute',
    top: 100,
    right: SCREEN_WIDTH * 0.15,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cloud3: {
    position: 'absolute',
    top: 140,
    left: SCREEN_WIDTH * 0.6,
    width: 60,
    height: 25,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  // Sun
  sun: {
    position: 'absolute',
    top: 50,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  // Sky gradient
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
  },
  // Mountains
  mountain1: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    width: SCREEN_WIDTH + 100,
    height: 200,
    backgroundColor: '#4682B4',
    transform: [{ rotate: '5deg' }],
    opacity: 0.1,
  },
  mountain2: {
    position: 'absolute',
    bottom: 0,
    right: -50,
    width: SCREEN_WIDTH + 100,
    height: 150,
    backgroundColor: '#5DADE2',
    transform: [{ rotate: '-5deg' }],
    opacity: 0.08,
  },
  // Birds
  bird1: {
    position: 'absolute',
    top: 170,
    left: 60,
    width: 20,
    height: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '-30deg' }],
  },
  bird2: {
    position: 'absolute',
    top: 200,
    right: 80,
    width: 15,
    height: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '30deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  tagline: {
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  userBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  hostBadge: {
    backgroundColor: 'rgba(93, 173, 226, 0.1)',
    borderColor: 'rgba(93, 173, 226, 0.3)',
  },
  roleBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  userBadgeText: {
    color: '#4682B4',
  },
  hostBadgeText: {
    color: '#5DADE2',
  },
  instruction: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
    marginBottom: 20,
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
  btn: {
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
    marginBottom: 16,
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
  btnDisabled: {
    opacity: 0.7,
  },
  loadingIcon: {
    transform: [{ rotate: '0deg' }],
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(70, 130, 180, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(70, 130, 180, 0.1)',
  },
  backText: {
    color: '#4682B4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomInfoText: {
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