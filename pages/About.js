import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from 'react-native';
import React from 'react';

const About = () => {
  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>About Tambola Live</Text>

      <View style={styles.bannerCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/3159/3159066.png" }}
          style={styles.bannerImage}
        />
        <Text style={styles.bannerText}>
          Tambola Live is a modern platform to enjoy real-time Tambola games with friends and global players.
        </Text>
      </View>

      <Text style={styles.subTitle}>Our Mission</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>🎯 To deliver fast & fair Tambola games</Text>
        <Text style={styles.infoText}>🤝 To connect real players globally</Text>
        <Text style={styles.infoText}>🎁 To provide exciting rewards daily</Text>
        <Text style={styles.infoText}>🔐 To offer a safe & fun gaming experience</Text>
      </View>

      <Text style={styles.subTitle}>Features</Text>

      <View style={styles.featureCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2721/2721266.png" }}
          style={styles.featureIcon}
        />
        <Text style={styles.featureText}>Instant Matchmaking</Text>
      </View>

      <View style={styles.featureCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png" }}
          style={styles.featureIcon}
        />
        <Text style={styles.featureText}>Multiple Game Modes</Text>
      </View>

      <View style={styles.featureCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/747/747376.png" }}
          style={styles.featureIcon}
        />
        <Text style={styles.featureText}>Secure Private Rooms</Text>
      </View>

      <View style={styles.featureCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/574/574432.png" }}
          style={styles.featureIcon}
        />
        <Text style={styles.featureText}>Daily Winners List</Text>
      </View>

    </ScrollView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", padding: 18 },

  title: { fontSize: 22, fontWeight: "800", marginTop: 10 },

  bannerCard: {
    backgroundColor: "#FF7675",
    marginTop: 20,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerImage: { width: 70, height: 70, marginRight: 15 },
  bannerText: { color: "#fff", fontSize: 14, flex: 1 },

  subTitle: { fontSize: 18, fontWeight: "800", marginTop: 25 },

  infoCard: {
    backgroundColor: "#fff",
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
  },
  infoText: { fontSize: 14, marginVertical: 4, color: "#555" },

  featureCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  featureIcon: { width: 40, height: 40, marginRight: 15 },
  featureText: { fontSize: 15, fontWeight: "700" },
});
