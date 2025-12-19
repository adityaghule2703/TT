import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Faqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [helpLinks, setHelpLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchFaqs(), fetchHelpLinks()]);
  };

  const fetchFaqs = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/faqs",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status && res.data.data) setFaqs(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpLinks = async () => {
    try {
      setLinksLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/help-links",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status && res.data.data) setHelpLinks(res.data.data);
    } catch (err) {
      console.log("Error fetching help links:", err);
    } finally {
      setLinksLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleFaq = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openYouTubeLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening link:', error);
    }
  };

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  const renderHelpLinks = () => {
    if (linksLoading) {
      return (
        <View style={styles.helpLinksContainer}>
          <ActivityIndicator size="small" color="#FF7675" />
        </View>
      );
    }

    if (helpLinks.length === 0) return null;

    return (
      <View style={styles.helpLinksContainer}>
        <View style={styles.helpLinksHeader}>
          <Ionicons name="videocam" size={22} color="#FF7675" />
          <Text style={styles.helpLinksTitle}>Helpful Videos</Text>
        </View>
        <Text style={styles.helpLinksSubtitle}>
          Watch tutorials to learn how to play Tambola games
        </Text>
        
        <View style={styles.linksList}>
          {helpLinks.map((link, index) => (
            <TouchableOpacity
              key={link.key || index}
              style={styles.linkItem}
              onPress={() => openYouTubeLink(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIconContainer}>
                <Ionicons name="play-circle" size={20} color="#FF7675" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle} numberOfLines={2}>
                  {link.title}
                </Text>
                <Text style={styles.linkDescription} numberOfLines={1}>
                  {link.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F6F8FA" barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FF7675"
            colors={["#FF7675"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help Desk</Text>
          <TouchableOpacity>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* TOP ILLUSTRATION */}
        <View style={styles.topImageWrapper}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
            }}
            style={styles.topImage}
          />
        </View>

        {/* INTRO */}
        <Text style={styles.introText}>
          We're here to help you with anything and everything on Tambola Live. Use the search below or check our frequently asked questions.
        </Text>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search Help"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* HELP LINKS SECTION */}
        {renderHelpLinks()}

        {/* FAQ LIST */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {loading && <ActivityIndicator size="large" color="#FF7675" style={{ marginTop: 20 }} />}

        {!loading &&
          filteredFaqs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(faq.id)}
              >
                <View style={styles.faqTitleWrapper}>
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
                    }}
                    style={styles.faqIcon}
                  />
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </View>
                <Text style={styles.toggleIcon}>
                  {expanded[faq.id] ? "−" : "+"}
                </Text>
              </TouchableOpacity>
              {expanded[faq.id] && (
                <View style={styles.faqAnswerWrapper}>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}

        {filteredFaqs.length === 0 && !loading && (
          <Text style={styles.noFaqs}>No FAQs found.</Text>
        )}

        {/* CTA BUTTON */}
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>Still stuck? Help us a mail away</Text>
          <Text style={styles.ctaBtnText}>Send a message</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Faqs;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 15,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "800",
    color: "#333",
  },
  settingsIcon: { 
    fontSize: 22,
    color: "#333",
  },
  topImageWrapper: { 
    alignItems: "center", 
    marginBottom: 15 
  },
  topImage: { 
    width: 120, 
    height: 120, 
    opacity: 0.7 
  },
  introText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
    lineHeight: 20,
  },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 45,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: { 
    fontSize: 14, 
    height: "100%",
    color: "#333",
  },
  // Help Links Styles
  helpLinksContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  helpLinksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  helpLinksTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginLeft: 10,
  },
  helpLinksSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  linksList: {
    gap: 12,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7F7",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE8E8",
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFE8E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  linkDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  // FAQ Section
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 10,
    color: "#333",
  },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
  },
  faqTitleWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  faqIcon: { 
    width: 24, 
    height: 24, 
    marginRight: 10, 
    tintColor: "#FF7675" 
  },
  faqQuestion: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#333", 
    flexShrink: 1 
  },
  toggleIcon: { 
    fontSize: 20, 
    color: "#FF7675", 
    fontWeight: "700" 
  },
  faqAnswerWrapper: {
    backgroundColor: "#FFF7F7",
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#FFE8E8",
  },
  faqAnswer: { 
    fontSize: 14, 
    color: "#555", 
    lineHeight: 20 
  },
  noFaqs: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#777" 
  },
  ctaButton: {
    backgroundColor: "#FF7675",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: { 
    color: "#fff", 
    fontWeight: "600", 
    marginBottom: 6,
    fontSize: 14,
  },
  ctaBtnText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 16 
  },
  bottomSpace: {
    height: 30,
  },
});