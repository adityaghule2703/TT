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
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

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
  const [orientation, setOrientation] = useState('PORTRAIT');
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    // Allow all orientations
    ScreenOrientation.unlockAsync();
    
    // Get initial orientation
    checkOrientation();
    
    // Subscribe to orientation changes
    const dimensionSubscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    });
    
    // Also listen to screen orientation changes
    const orientationSubscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const newOrientation = event.orientationInfo.orientation;
      if (newOrientation === 1 || newOrientation === 2) {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
    });
    
    fetchData();
    
    return () => {
      dimensionSubscription?.remove();
      orientationSubscription?.remove();
      // Optional: Lock back to portrait when leaving screen
      // ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const checkOrientation = async () => {
    try {
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      if (currentOrientation === 1 || currentOrientation === 2) {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
    } catch (error) {
      console.log('Error getting orientation:', error);
    }
  };

  const toggleOrientationLock = async () => {
    try {
      if (orientation === 'PORTRAIT') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setOrientation('LANDSCAPE');
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setOrientation('PORTRAIT');
      }
    } catch (error) {
      console.log('Error changing orientation:', error);
    }
  };

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
        <View style={orientation === 'LANDSCAPE' ? styles.helpLinksContainerLandscape : styles.helpLinksContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
        </View>
      );
    }

    if (helpLinks.length === 0) return null;

    return (
      <View style={orientation === 'LANDSCAPE' ? styles.helpLinksContainerLandscape : styles.helpLinksContainer}>
        <View style={styles.helpLinksHeader}>
          <Ionicons name="videocam" size={orientation === 'LANDSCAPE' ? 20 : 22} color="#4A90E2" />
          <Text style={[styles.helpLinksTitle, { fontSize: orientation === 'LANDSCAPE' ? 18 : 20 }]}>
            Helpful Videos
          </Text>
        </View>
        <Text style={[styles.helpLinksSubtitle, { fontSize: orientation === 'LANDSCAPE' ? 13 : 14 }]}>
          Watch tutorials to learn how to play Tambola games
        </Text>
        
        <View style={orientation === 'LANDSCAPE' ? styles.linksListLandscape : styles.linksList}>
          {helpLinks.map((link, index) => (
            <TouchableOpacity
              key={link.key || index}
              style={orientation === 'LANDSCAPE' ? styles.linkItemLandscape : styles.linkItem}
              onPress={() => openYouTubeLink(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIconContainer}>
                <Ionicons name="play-circle" size={20} color="#4A90E2" />
              </View>
              <View style={styles.linkContent}>
                <Text style={[styles.linkTitle, { fontSize: orientation === 'LANDSCAPE' ? 14 : 15 }]} numberOfLines={2}>
                  {link.title}
                </Text>
                <Text style={[styles.linkDescription, { fontSize: orientation === 'LANDSCAPE' ? 12 : 13 }]} numberOfLines={1}>
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
      <StatusBar backgroundColor="#F0F8FF" barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: orientation === 'LANDSCAPE' ? 25 : 20 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#4A90E2"
            colors={["#4A90E2"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={[
          styles.header,
          { marginTop: orientation === 'LANDSCAPE' ? 15 : 25 }
        ]}>
          <Text style={[
            styles.headerTitle,
            { fontSize: orientation === 'LANDSCAPE' ? 24 : 28 }
          ]}>
            Help Desk
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={toggleOrientationLock} style={{ marginRight: 15 }}>
              <Ionicons 
                name={orientation === 'LANDSCAPE' ? 'phone-portrait-outline' : 'phone-landscape-outline'} 
                size={22} 
                color="#4A90E2" 
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TOP ILLUSTRATION */}
        <View style={[
          styles.topImageWrapper,
          { marginBottom: orientation === 'LANDSCAPE' ? 10 : 15 }
        ]}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
            }}
            style={{
              width: orientation === 'LANDSCAPE' ? 80 : 120,
              height: orientation === 'LANDSCAPE' ? 80 : 120,
              opacity: 0.8,
            }}
          />
        </View>

        {/* INTRO */}
        <Text style={[
          styles.introText,
          { 
            fontSize: orientation === 'LANDSCAPE' ? 14 : 15,
            lineHeight: orientation === 'LANDSCAPE' ? 20 : 22,
            marginBottom: orientation === 'LANDSCAPE' ? 15 : 20
          }
        ]}>
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
        <Text style={[
          styles.sectionTitle,
          { fontSize: orientation === 'LANDSCAPE' ? 16 : 18 }
        ]}>
          Frequently Asked Questions
        </Text>

        {loading && <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />}

        {!loading &&
          filteredFaqs.map((faq) => (
            <View key={faq.id} style={[
              styles.faqCard,
              { marginBottom: orientation === 'LANDSCAPE' ? 8 : 12 }
            ]}>
              <TouchableOpacity
                style={[
                  styles.faqHeader,
                  { padding: orientation === 'LANDSCAPE' ? 12 : 18 }
                ]}
                onPress={() => toggleFaq(faq.id)}
              >
                <View style={styles.faqTitleWrapper}>
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
                    }}
                    style={styles.faqIcon}
                  />
                  <Text style={[
                    styles.faqQuestion,
                    { fontSize: orientation === 'LANDSCAPE' ? 14 : 15 }
                  ]}>
                    {faq.question}
                  </Text>
                </View>
                <Ionicons 
                  name={expanded[faq.id] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#4A90E2" 
                />
              </TouchableOpacity>
              {expanded[faq.id] && (
                <View style={[
                  styles.faqAnswerWrapper,
                  { 
                    paddingHorizontal: orientation === 'LANDSCAPE' ? 12 : 18,
                    paddingBottom: orientation === 'LANDSCAPE' ? 12 : 18
                  }
                ]}>
                  <Text style={[
                    styles.faqAnswer,
                    { fontSize: orientation === 'LANDSCAPE' ? 13 : 14 }
                  ]}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}

        {filteredFaqs.length === 0 && !loading && (
          <Text style={styles.noFaqs}>No FAQs found.</Text>
        )}

        {/* CTA BUTTON */}
        <TouchableOpacity style={[
          styles.ctaButton,
          { marginTop: orientation === 'LANDSCAPE' ? 20 : 30 }
        ]}>
          <Text style={styles.ctaText}>Still stuck? Help us a mail away</Text>
          <Text style={styles.ctaBtnText}>Send a message</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={[
          styles.bottomSpace,
          { height: orientation === 'LANDSCAPE' ? 20 : 30 }
        ]} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Faqs;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { 
    fontWeight: "700",
    color: "#4682B4",
    letterSpacing: -0.5,
  },
  topImageWrapper: { 
    alignItems: "center", 
  },
  introText: {
    color: "#4682B4",
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
    color: "#4682B4",
  },
  // Help Links Styles - Portrait
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
  // Help Links Styles - Landscape
  helpLinksContainerLandscape: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    padding: 15,
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
    fontWeight: "700",
    color: "#4682B4",
    marginLeft: 10,
  },
  helpLinksSubtitle: {
    color: "#4682B4",
    marginBottom: 20,
    lineHeight: 20,
  },
  linksList: {
    gap: 12,
  },
  linksListLandscape: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  linkItemLandscape: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontWeight: "600",
    color: "#4682B4",
    marginBottom: 4,
    lineHeight: 20,
  },
  linkDescription: {
    color: "#4682B4",
    lineHeight: 18,
  },
  // FAQ Section
  sectionTitle: { 
    fontWeight: "700", 
    marginBottom: 16,
    color: "#4682B4",
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
  },
  faqQuestion: { 
    fontWeight: "600", 
    color: "#4682B4", 
    flex: 1,
    lineHeight: 20,
  },
  faqAnswerWrapper: {
    backgroundColor: "rgba(74, 144, 226, 0.03)",
    paddingHorizontal: 18,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 144, 226, 0.1)",
  },
  faqAnswer: { 
    color: "#4682B4", 
    lineHeight: 22 
  },
  noFaqs: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#4682B4",
    fontSize: 15,
    fontStyle: "italic",
  },
  ctaButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
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
  },
});