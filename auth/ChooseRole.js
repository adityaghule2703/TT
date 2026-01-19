import React, { useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Easing,
  Dimensions 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChooseRole = ({ navigation }) => {
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
          <Text style={styles.tagline}>Choose Your Role</Text>
        </View>

        {/* Glassmorphism Card */}
        <View style={styles.card}>
          {/* Glass effect overlay */}
          <View style={styles.glassOverlay} />
          
          <Text style={styles.title}>Select Account Type</Text>
          
          {/* User Option */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("MobileVerify", { role: "user" })}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="person" size={28} color="#4A90E2" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Player</Text>
              <Text style={styles.optionSub}>Play games & win prizes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#4682B4" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Host Option */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("MobileVerify", { role: "host" })}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(93, 173, 226, 0.1)' }]}>
              <Ionicons name="mic" size={28} color="#5DADE2" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Host</Text>
              <Text style={styles.optionSub}>Create & manage games</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#4682B4" />
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <TouchableOpacity 
          style={styles.loginBtn}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.infoText}>
            Choose Player to participate in games, or Host to create and manage your own games
          </Text>
          <Text style={styles.versionText}>Tambola Timez v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default ChooseRole;

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
    marginBottom: 40,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4682B4',
    textAlign: 'center',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(70, 130, 180, 0.1)',
    marginBottom: 12,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 14,
    color: '#718096',
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(70, 130, 180, 0.1)',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  loginText: {
    color: '#718096',
    fontSize: 15,
  },
  loginLink: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoText: {
    color: 'rgba(70, 130, 180, 0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    color: 'rgba(70, 130, 180, 0.6)',
    fontSize: 12,
  },
});