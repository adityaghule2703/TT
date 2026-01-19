import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import React, { useRef, useEffect } from 'react';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const About = () => {
  // Animation values
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start background animations
    startAnimations();
  }, []);

  const startAnimations = () => {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* BACKGROUND PATTERNS WITH ANIMATIONS */}
      <View style={styles.backgroundPatterns}>
        {/* Animated clouds */}
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
        
        {/* Animated sun */}
        <Animated.View 
          style={[
            styles.sun,
            { 
              transform: [{ rotate: rotate }],
              opacity: pulseAnim
            }
          ]} 
        />
        
        {/* Sky gradient */}
        <View style={styles.skyGradient} />
        
        {/* Mountains */}
        <View style={styles.mountain1} />
        <View style={styles.mountain2} />
      </View>

      {/* HEADER */}
      <Animated.View 
        style={[
          styles.header,
          { 
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <Text style={styles.title}>About Tambola Timez</Text>
        <Text style={styles.tagline}>Professional Gaming Platform</Text>
      </Animated.View>

      {/* BANNER CARD */}
      <View style={styles.section}>
        <View style={styles.bannerCard}>
          <View style={styles.bannerPattern} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="game-controller" size={48} color="#4A90E2" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Welcome to Tambola Timez</Text>
              <Text style={styles.bannerText}>
                A premium online Tambola platform designed for professional gaming 
                with fair play, instant payouts, and seamless user experience.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* OUR MISSION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <View style={styles.missionCard}>
          <View style={styles.missionPattern} />
          {[
            { icon: 'target', text: 'Deliver fast & fair Tambola games' },
            { icon: 'users', text: 'Connect real players globally' },
            { icon: 'gift', text: 'Provide exciting rewards daily' },
            { icon: 'shield-alt', text: 'Ensure safe & secure gaming' },
          ].map((item, index) => (
            <View key={index} style={styles.missionItem}>
              <View style={styles.missionIcon}>
                <FontAwesome5 name={item.icon} size={20} color="#4A90E2" />
              </View>
              <Text style={styles.missionText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FEATURES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featuresGrid}>
          {[
            {
              icon: 'flash',
              title: 'Instant Matchmaking',
              description: 'Join games instantly with players worldwide',
              color: '#4A90E2',
            },
            {
              icon: 'layers',
              title: 'Multiple Modes',
              description: 'Classic, Speed, and Premium game modes',
              color: '#7EC8E3',
            },
            {
              icon: 'lock-closed',
              title: 'Secure Rooms',
              description: 'Private rooms with end-to-end encryption',
              color: '#5DADE2',
            },
            {
              icon: 'trophy',
              title: 'Daily Rewards',
              description: 'Win exciting prizes and bonuses daily',
              color: '#4682B4',
            },
          ].map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featurePattern} />
              <View style={[styles.featureIconContainer, { borderColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* WHY CHOOSE US */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.whyCard}>
          <View style={styles.whyPattern} />
          {[
            { icon: 'checkmark-circle', text: 'Licensed & Regulated Platform' },
            { icon: 'checkmark-circle', text: 'Instant Payout System' },
            { icon: 'checkmark-circle', text: '24/7 Customer Support' },
            { icon: 'checkmark-circle', text: 'Certified RNG (Fair Play)' },
            { icon: 'checkmark-circle', text: 'Multiple Payment Options' },
            { icon: 'checkmark-circle', text: 'Regular Tournaments & Events' },
          ].map((item, index) => (
            <View key={index} style={styles.whyItem}>
              <Ionicons name={item.icon} size={20} color="#4A90E2" />
              <Text style={styles.whyText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* OUR VALUES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        <View style={styles.valuesContainer}>
          <View style={styles.valueCard}>
            <View style={styles.valueIcon}>
              <MaterialIcons name="security" size={32} color="#4A90E2" />
            </View>
            <Text style={styles.valueTitle}>Security First</Text>
            <Text style={styles.valueDescription}>
              Your data and transactions are protected with bank-level encryption
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIcon}>
              <MaterialIcons name="balance" size={32} color="#4A90E2" />
            </View>
            <Text style={styles.valueTitle}>Fair Play</Text>
            <Text style={styles.valueDescription}>
              Certified random number generator ensures equal chance for all players
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIcon}>
              <MaterialIcons name="support-agent" size={32} color="#4A90E2" />
            </View>
            <Text style={styles.valueTitle}>Player Support</Text>
            <Text style={styles.valueDescription}>
              Dedicated 24/7 support team to assist with any queries
            </Text>
          </View>
        </View>
      </View>

      {/* GET IN TOUCH */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get In Touch</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactPattern} />
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={24} color="#4A90E2" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@tambolatimez.com</Text>
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.contactItem}>
            <Ionicons name="time" size={24} color="#4A90E2" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Support Hours</Text>
              <Text style={styles.contactValue}>24/7</Text>
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.contactItem}>
            <MaterialIcons name="verified-user" size={24} color="#4A90E2" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Licensed By</Text>
              <Text style={styles.contactValue}>International Gaming Commission</Text>
            </View>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Tambola Timez. All rights reserved.
        </Text>
        <Text style={styles.footerSubtext}>
          Play Responsibly. Must be 18+ to participate.
        </Text>
      </View>
    </ScrollView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  backgroundPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  // Cloud animations
  cloud1: {
    position: 'absolute',
    top: 100,
    right: 40,
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
    top: 200,
    left: 30,
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
    top: 300,
    right: 20,
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
    left: 30,
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
    height: 300,
    backgroundColor: 'linear-gradient(to bottom, rgba(135, 206, 235, 0.2), rgba(135, 206, 235, 0))',
  },
  // Mountains
  mountain1: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    width: width + 100,
    height: 200,
    backgroundColor: '#4682B4',
    transform: [{ rotate: '5deg' }],
    opacity: 0.1,
  },
  mountain2: {
    position: 'absolute',
    bottom: 0,
    right: -50,
    width: width + 100,
    height: 150,
    backgroundColor: '#5DADE2',
    transform: [{ rotate: '-5deg' }],
    opacity: 0.08,
  },
  header: {
    backgroundColor: "#5DADE2",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4682B4",
    marginBottom: 16,
  },
  bannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4682B4",
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  missionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  missionPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.03)',
  },
  missionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  missionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  missionText: {
    fontSize: 15,
    color: "#4682B4",
    fontWeight: "500",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featurePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.02)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4682B4",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  whyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  whyPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: 16,
    backgroundColor: 'rgba(126, 200, 227, 0.02)',
  },
  whyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  whyText: {
    fontSize: 14,
    color: "#4682B4",
    marginLeft: 12,
    fontWeight: "500",
  },
  valuesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  valueCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    alignItems: "center",
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4682B4",
    marginBottom: 4,
    textAlign: "center",
  },
  valueDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.03)',
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#4682B4",
    fontWeight: "500",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    marginVertical: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 144, 226, 0.1)",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#4682B4",
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});