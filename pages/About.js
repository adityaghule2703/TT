import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import React from 'react';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const About = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* BACKGROUND PATTERNS */}
      <View style={styles.backgroundPatterns}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
        <View style={styles.geometricPattern1} />
        <View style={styles.geometricPattern2} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>About Tambola Timez</Text>
        <Text style={styles.tagline}>Professional Gaming Platform</Text>
      </View>

      {/* BANNER CARD */}
      <View style={styles.section}>
        <View style={styles.bannerCard}>
          <View style={styles.bannerPattern} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="game-controller" size={48} color="#40E0D0" />
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
                <FontAwesome5 name={item.icon} size={20} color="#40E0D0" />
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
              color: '#40E0D0',
            },
            {
              icon: 'layers',
              title: 'Multiple Modes',
              description: 'Classic, Speed, and Premium game modes',
              color: '#FF6B35',
            },
            {
              icon: 'lock-closed',
              title: 'Secure Rooms',
              description: 'Private rooms with end-to-end encryption',
              color: '#4CD964',
            },
            {
              icon: 'trophy',
              title: 'Daily Rewards',
              description: 'Win exciting prizes and bonuses daily',
              color: '#FFD700',
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
              <Ionicons name={item.icon} size={20} color="#40E0D0" />
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
              <MaterialIcons name="security" size={32} color="#40E0D0" />
            </View>
            <Text style={styles.valueTitle}>Security First</Text>
            <Text style={styles.valueDescription}>
              Your data and transactions are protected with bank-level encryption
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIcon}>
              <MaterialIcons name="balance" size={32} color="#40E0D0" />
            </View>
            <Text style={styles.valueTitle}>Fair Play</Text>
            <Text style={styles.valueDescription}>
              Certified random number generator ensures equal chance for all players
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIcon}>
              <MaterialIcons name="support-agent" size={32} color="#40E0D0" />
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
            <Ionicons name="mail" size={24} color="#40E0D0" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@tambolatimez.com</Text>
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.contactItem}>
            <Ionicons name="time" size={24} color="#40E0D0" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Support Hours</Text>
              <Text style={styles.contactValue}>24/7</Text>
            </View>
          </View>
          <View style={styles.contactDivider} />
          <View style={styles.contactItem}>
            <MaterialIcons name="verified-user" size={24} color="#40E0D0" />
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
    backgroundColor: "#F8F9FA",
  },
  backgroundPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.08)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.06)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 300,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.04)',
  },
  geometricPattern1: {
    position: 'absolute',
    bottom: 100,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.04)',
    transform: [{ rotate: '45deg' }],
  },
  geometricPattern2: {
    position: 'absolute',
    top: 400,
    right: 30,
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.05)',
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  header: {
    backgroundColor: "#40E0D0",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#6C757D",
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
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  bannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  bannerPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
  },
  missionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  missionPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
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
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  missionText: {
    fontSize: 15,
    color: "#495057",
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
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  featurePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
  },
  whyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  whyPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.02)',
  },
  whyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  whyText: {
    fontSize: 14,
    color: "#495057",
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
    borderColor: "#E9ECEF",
    alignItems: "center",
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
    textAlign: "center",
  },
  valueDescription: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  contactPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 16,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
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
    color: "#6C757D",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#ADB5BD",
    textAlign: "center",
  },
});