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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Faqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, []);

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

  const toggleFaq = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* INTRO */}
        <Text style={styles.introText}>
          We’re here to help you with anything and everything on Tambola Live. Use the search below or check our frequently asked questions.
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

        {/* FAQ LIST */}
        <Text style={styles.sectionTitle}>FAQ</Text>

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
      </ScrollView>
    </View>
  );
};

export default Faqs;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  settingsIcon: { fontSize: 22 },
  topImageWrapper: { alignItems: "center", marginBottom: 15 },
  topImage: { width: 120, height: 120, opacity: 0.7 },
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
  },
  searchInput: { fontSize: 14, height: "100%" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
  },
  faqTitleWrapper: { flexDirection: "row", alignItems: "center", flex: 1 },
  faqIcon: { width: 24, height: 24, marginRight: 10, tintColor: "#FF7675" },
  faqQuestion: { fontSize: 15, fontWeight: "600", color: "#333", flexShrink: 1 },
  toggleIcon: { fontSize: 20, color: "#FF7675", fontWeight: "700" },
  faqAnswerWrapper: {
    backgroundColor: "#FFF7F7",
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  faqAnswer: { fontSize: 14, color: "#555", lineHeight: 20 },
  noFaqs: { textAlign: "center", marginTop: 20, color: "#777" },
  ctaButton: {
    backgroundColor: "#FF7675",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 25,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "600", marginBottom: 6 },
  ctaBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
