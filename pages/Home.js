import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesome, Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

const Home = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Sample images for the slider (you can replace with actual image URLs)
  const sliderImages = [
    { id: 1, uri: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop' },
    { id: 2, uri: 'https://plus.unsplash.com/premium_photo-1722018576685-45a415a4ff67?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 3, uri: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&auto=format&fit=crop' }
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  const slideInterval = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    startAutoSlide();
    
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, []);

  const startAutoSlide = () => {
    slideInterval.current = setInterval(() => {
      setCurrentImageIndex(prevIndex => {
        const nextIndex = prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1;
        
        // Scroll to next image
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        
        return nextIndex;
      });
    }, 3000); // Change slide every 3 seconds
  };

  const onSliderScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/notifications",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const renderImageSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={sliderImages}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onSliderScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={{ uri: item.uri }}
                style={styles.sliderImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View>
          )}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / (width - 40)
            );
            setCurrentImageIndex(slideIndex);
          }}
        />
        
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {sliderImages.map((_, index) => {
            const inputRange = [
              (index - 1) * (width - 40),
              index * (width - 40),
              (index + 1) * (width - 40),
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    width: dotWidth,
                    opacity: opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#40E0D0"
          colors={['#40E0D0']}
        />
      }
    >
      {/* BACKGROUND PATTERNS */}
      <View style={styles.backgroundPatterns}>
        {/* Top right pattern */}
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
        {/* Bottom left pattern */}
        <View style={styles.patternCircle4} />
        <View style={styles.patternCircle5} />
        {/* Geometric patterns */}
        <View style={styles.geometricPattern1} />
        <View style={styles.geometricPattern2} />
        <View style={styles.geometricPattern3} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>Tambola Timez</Text>
            <Text style={styles.appTagline}>Professional Gaming Platform</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#40E0D0" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* WELCOME SECTION WITH IMAGE SLIDER */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomePattern}>
            <View style={styles.welcomePatternCircle} />
            <View style={styles.welcomePatternDots} />
          </View>
          
          {/* Image Slider */}
          {renderImageSlider()}
          
          <View style={styles.welcomeContent}>
            <View>
              <Text style={styles.welcomeTitle}>Welcome to Tambola Timez</Text>
              <Text style={styles.welcomeSubtitle}>
                Experience professional Tambola gaming with fair play and instant payouts
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {['Quick Play', 'Tournaments', 'Private Room', 'How to Play'].map((title, index) => (
            <TouchableOpacity key={index} style={styles.actionCard}>
              <View style={styles.actionCardPattern} />
              <View style={styles.actionIconContainer}>
                <Ionicons 
                  name={['play-circle', 'trophy', 'people', 'help-circle'][index]} 
                  size={28} 
                  color="#40E0D0" 
                />
              </View>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionDescription}>
                {['Start playing immediately', 'Join competitive events', 'Play with friends', 'Learn the rules'][index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GAME MODES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Game Modes</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gameModesContainer}
        >
          {[
            { title: 'Classic', icon: 'casino', color: '#40E0D0', tag: 'Most Popular', tagColor: '#E8F5E9' },
            { title: 'Speed', icon: 'flash', color: '#FF6B35', tag: 'Exciting', tagColor: '#FFF3E0' },
            { title: 'Premium', icon: 'emoji-events', color: '#FFD700', tag: 'Premium', tagColor: '#FFF8E1' }
          ].map((mode, index) => (
            <View key={index} style={styles.gameModeCard}>
              <View style={styles.gameModePattern} />
              <View style={[styles.gameModeIcon, { borderColor: mode.color + '20' }]}>
                <MaterialIcons name={mode.icon} size={32} color={mode.color} />
              </View>
              <Text style={styles.gameModeTitle}>{mode.title}</Text>
              <Text style={styles.gameModeDescription}>
                {index === 0 ? 'Traditional Tambola experience' : 
                 index === 1 ? 'Fast-paced games' : 'Higher stakes, bigger prizes'}
              </Text>
              <View style={[styles.gameModeTag, { backgroundColor: mode.tagColor }]}>
                <Text style={[styles.gameModeTagText, { color: mode.color }]}>{mode.tag}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* FEATURES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.featuresGrid}>
          {[
            { title: 'Secure Platform', description: 'Bank-level security for all transactions', icon: 'shield-checkmark' },
            { title: 'Instant Payouts', description: 'Get your winnings within minutes', icon: 'time' },
            { title: '24/7 Support', description: 'Dedicated customer support team', icon: 'headset' },
            { title: 'Fair Play', description: 'Certified random number generation', icon: 'verified-user' }
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featurePattern} />
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color="#40E0D0" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* GETTING STARTED */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepsPattern} />
          {[
            { number: '1', title: 'Sign Up & Verify', description: 'Create your account and complete verification' },
            { number: '2', title: 'Add Funds', description: 'Deposit using secure payment methods' },
            { number: '3', title: 'Join a Game', description: 'Choose your preferred game mode and start playing' }
          ].map((step, index) => (
            <React.Fragment key={index}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
              {index < 2 && <View style={styles.stepDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* APP INFO */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoPattern} />
          <Text style={styles.infoTitle}>About Tambola Timez</Text>
          <Text style={styles.infoDescription}>
            Tambola Timez is a professional online gaming platform that offers 
            a seamless and secure Tambola experience. We prioritize fair play, 
            transparency, and user satisfaction in every game.
          </Text>
          <View style={styles.infoStats}>
            {['Licensed Platform', 'Secure Payments', '24/7 Games'].map((stat, index) => (
              <View key={index} style={styles.infoStat}>
                <Ionicons name="checkmark-done" size={20} color="#40E0D0" />
                <Text style={styles.infoStatText}>{stat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* BOTTOM SPACE */}
      <View style={styles.bottomSpace} />

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <ActivityIndicator size="large" color="#40E0D0" style={styles.loadingIndicator} />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationIcon}>
                      <Ionicons name="notifications" size={20} color="#40E0D0" />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title || "New Update"}</Text>
                      <Text style={styles.notificationMessage}>
                        {item.message || "Check out the new features!"}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off" size={50} color="#CCC" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Home;

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
    top: 50,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 100,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.05)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 180,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.03)',
  },
  patternCircle4: {
    position: 'absolute',
    bottom: 200,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.08)',
  },
  patternCircle5: {
    position: 'absolute',
    bottom: 250,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.04)',
  },
  geometricPattern1: {
    position: 'absolute',
    top: 300,
    right: -20,
    width: 100,
    height: 100,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.05)',
  },
  geometricPattern2: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.04)',
    transform: [{ rotate: '15deg' }],
  },
  geometricPattern3: {
    position: 'absolute',
    top: 400,
    left: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.06)',
    borderStyle: 'dashed',
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#40E0D0",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 2,
    fontWeight: "500",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC3545",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0, // Changed from 24 to 0
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  welcomePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    overflow: 'hidden',
    zIndex: 1,
  },
  welcomePatternCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  welcomePatternDots: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    borderRadius: 20,
  },
  // Image Slider Styles
  sliderContainer: {
    height: 180,
    position: 'relative',
    marginBottom: 16,
  },
  slide: {
    width: width - 40,
    height: 180,
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#40E0D0',
    marginHorizontal: 4,
  },
  welcomeContent: {
    padding: 24,
    paddingTop: 0,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
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
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  actionCardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
  },
  gameModesContainer: {
    paddingRight: 20,
  },
  gameModeCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  gameModePattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 60,
    height: 60,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
  },
  gameModeIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  gameModeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  gameModeDescription: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 12,
    lineHeight: 16,
  },
  gameModeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gameModeTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureItem: {
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
    top: -10,
    left: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
  stepsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  stepsPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#40E0D0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 18,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginLeft: 16,
    marginRight: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    zIndex: 1,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  infoPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 100,
    height: 100,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 22,
    marginBottom: 20,
  },
  infoStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoStatText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: "#ADB5BD",
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#ADB5BD",
    marginTop: 10,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  closeBtn: {
    backgroundColor: "#40E0D0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});