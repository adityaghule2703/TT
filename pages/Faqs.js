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
          <ActivityIndicator size="small" color="#40E0D0" />
        </View>
      );
    }

    if (helpLinks.length === 0) return null;

    return (
      <View style={styles.helpLinksContainer}>
        <View style={styles.helpLinksHeader}>
          <Ionicons name="videocam" size={22} color="#40E0D0" />
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
                <Ionicons name="play-circle" size={20} color="#40E0D0" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle} numberOfLines={2}>
                  {link.title}
                </Text>
                <Text style={styles.linkDescription} numberOfLines={1}>
                  {link.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6C757D" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help Desk</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#40E0D0" />
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
          We're here to help you with anything and everything on Tambola Timez. Use the search below or check our frequently asked questions.
        </Text>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search Help"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#ADB5BD"
          />
        </View>

        {/* HELP LINKS SECTION */}
        {renderHelpLinks()}

        {/* FAQ LIST */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {loading && <ActivityIndicator size="large" color="#40E0D0" style={{ marginTop: 20 }} />}

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
                <Ionicons 
                  name={expanded[faq.id] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#40E0D0" 
                />
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
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    letterSpacing: -0.5,
  },
  topImageWrapper: { 
    alignItems: "center", 
    marginBottom: 15 
  },
  topImage: { 
    width: 120, 
    height: 120, 
    opacity: 0.8,
    // Removed tintColor to keep original image colors
  },
  introText: {
    fontSize: 15,
    color: "#6C757D",
    marginBottom: 20,
    lineHeight: 22,
    textAlign: "center",
  },
  searchBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 50,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: { 
    fontSize: 15, 
    height: "100%",
    color: "#212529",
  },
  // Help Links Styles
  helpLinksContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginLeft: 10,
  },
  helpLinksSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 20,
    lineHeight: 20,
  },
  linksList: {
    gap: 12,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(64, 224, 208, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
    lineHeight: 20,
  },
  linkDescription: {
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 18,
  },
  // FAQ Section
  sectionTitle: { 
    fontSize: 18,
    fontWeight: "700", 
    marginBottom: 16,
    color: "#212529",
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  faqTitleWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1,
    gap: 12,
  },
  faqIcon: { 
    width: 24, 
    height: 24, 
    // Removed tintColor to keep original image colors
  },
  faqQuestion: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#212529", 
    flex: 1,
    lineHeight: 20,
  },
  faqAnswerWrapper: {
    backgroundColor: "rgba(64, 224, 208, 0.03)",
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(64, 224, 208, 0.1)",
  },
  faqAnswer: { 
    fontSize: 14, 
    color: "#495057", 
    lineHeight: 22 
  },
  noFaqs: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#6C757D",
    fontSize: 15,
    fontStyle: "italic",
  },
  ctaButton: {
    backgroundColor: "#40E0D0",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#40E0D0",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  ctaText: { 
    color: "#FFFFFF", 
    fontWeight: "500", 
    marginBottom: 6,
    fontSize: 14,
  },
  ctaBtnText: { 
    color: "#FFFFFF", 
    fontWeight: "700", 
    fontSize: 16 
  },
  bottomSpace: {
    height: 30,
  },
});