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

const { width, height } = Dimensions.get('window');

const Home = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
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
      {/* ENHANCED TURQUOISE BACKGROUND PATTERNS */}
      <View style={styles.backgroundPatterns}>
        {/* Main turquoise gradient overlay */}
        <View style={styles.turquoiseOverlay} />
        
        {/* Floating circular patterns */}
        <View style={styles.floatingCircle1} />
        <View style={styles.floatingCircle2} />
        <View style={styles.floatingCircle3} />
        <View style={styles.floatingCircle4} />
        <View style={styles.floatingCircle5} />
        
        {/* Geometric turquoise shapes */}
        <View style={styles.geometricShape1} />
        <View style={styles.geometricShape2} />
        <View style={styles.geometricShape3} />
        <View style={styles.geometricShape4} />
        
        {/* Wave patterns */}
        <View style={styles.wavePatternTop} />
        <View style={styles.wavePatternBottom} />
        
        {/* Dot grid pattern */}
        <View style={styles.dotGridPattern} />
        
        {/* Corner accents */}
        <View style={styles.cornerAccentTopLeft} />
        <View style={styles.cornerAccentTopRight} />
        <View style={styles.cornerAccentBottomLeft} />
        <View style={styles.cornerAccentBottomRight} />
        
        {/* Floating triangles */}
        <View style={styles.floatingTriangle1} />
        <View style={styles.floatingTriangle2} />
        <View style={styles.floatingTriangle3} />
        
        {/* Diamond grid pattern */}
        <View style={styles.diamondGrid} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.appName}>Tambola Timez</Text>
            <Text style={styles.appTagline}>Win Big, Play Smart</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </View>
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
          <View style={styles.welcomeCardPattern} />
          {renderImageSlider()}
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Ready to Win?</Text>
            <Text style={styles.welcomeSubtitle}>
              Join thousands of players winning daily
            </Text>
          </View>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsGrid}>
          {[
            { title: 'Quick Play', icon: 'play-circle', color: '#40E0D0' },
            { title: 'Tournaments', icon: 'trophy', color: '#FF6B35' },
            { title: 'Private Room', icon: 'people', color: '#9C27B0' },
            { title: 'How to Play', icon: 'help-circle', color: '#4CAF50' }
          ].map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GAME MODES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Game Modes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Explore</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gameModesContainer}
        >
          {[
            { 
              title: 'Classic', 
              icon: 'casino', 
              color: '#40E0D0', 
              players: '1K+ Online',
              accent: '#E8F5E9' 
            },
            { 
              title: 'Speed', 
              icon: 'flash', 
              color: '#FF6B35', 
              players: 'Fast Games',
              accent: '#FFF3E0' 
            },
            { 
              title: 'Premium', 
              icon: 'emoji-events', 
              color: '#FFD700', 
              players: 'High Stakes',
              accent: '#FFF8E1' 
            },
            { 
              title: 'Jackpot', 
              icon: 'diamond', 
              color: '#9C27B0', 
              players: 'Big Wins',
              accent: '#F3E5F5' 
            }
          ].map((mode, index) => (
            <View key={index} style={styles.gameModeCard}>
              <View style={[styles.gameModeAccent, { backgroundColor: mode.accent }]} />
              <View style={[styles.gameModeIconContainer, { borderColor: `${mode.color}30` }]}>
                <MaterialIcons name={mode.icon} size={26} color={mode.color} />
              </View>
              <Text style={styles.gameModeTitle}>{mode.title}</Text>
              <Text style={styles.gameModePlayers}>{mode.players}</Text>
              <View style={styles.gameModeIndicator}>
                <View style={[styles.gameModeIndicatorDot, { backgroundColor: mode.color }]} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* STATS BAR */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <View style={styles.statsCardPattern} />
          {[
            { value: '50K+', label: 'Players', icon: 'people' },
            { value: '₹10L+', label: 'Won Today', icon: 'cash' },
            { value: '99%', label: 'Payout', icon: 'trending-up' }
          ].map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon} size={18} color="#40E0D0" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FEATURES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why We're #1</Text>
        <View style={styles.featuresGrid}>
          {[
            { title: 'Instant Pay', icon: '⚡' },
            { title: 'Secure', icon: '🔒' },
            { title: '24/7 Games', icon: '🎯' },
            { title: 'Fair Play', icon: '⚖️' }
          ].map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureEmoji}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* LIVE GAMES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Games</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveGamesContainer}>
          {[
            { time: '2 min', prize: '₹5,000', players: '84' },
            { time: '5 min', prize: '₹10,000', players: '126' },
            { time: '10 min', prize: '₹25,000', players: '58' }
          ].map((game, index) => (
            <View key={index} style={styles.liveGameCard}>
              <View style={styles.liveGameHeader}>
                <Text style={styles.liveGameTime}>Starts in {game.time}</Text>
                <View style={styles.liveGameBadge}>
                  <Text style={styles.liveGameBadgeText}>🔥 HOT</Text>
                </View>
              </View>
              <Text style={styles.liveGamePrize}>{game.prize}</Text>
              <Text style={styles.liveGameLabel}>Prize Pool</Text>
              <View style={styles.liveGameFooter}>
                <View style={styles.liveGamePlayers}>
                  <Ionicons name="people" size={14} color="#6C757D" />
                  <Text style={styles.liveGamePlayersText}>{game.players} Playing</Text>
                </View>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* BOTTOM SPACE */}
      <View style={styles.bottomSpace} />

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                <Ionicons name="notifications" size={22} color="#40E0D0" />
                <Text style={styles.modalTitle}>Notifications</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#666" />
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
                    <View style={styles.notificationIndicator} />
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title || "New Update"}</Text>
                      <Text style={styles.notificationMessage}>
                        {item.message || "Check out the new features!"}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Today"}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off" size={50} color="#E9ECEF" />
                    <Text style={styles.emptyText}>No notifications</Text>
                    <Text style={styles.emptySubtext}>We'll notify you when something arrives</Text>
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
    backgroundColor: "#F0FDFA", // Light turquoise background
  },
  backgroundPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
    backgroundColor: '#F0FDFA',
    overflow: 'hidden',
  },
  // Main turquoise overlay
  turquoiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  // Floating circular patterns
  floatingCircle1: {
    position: 'absolute',
    top: 100,
    right: 40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(64, 224, 208, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.15)',
  },
  floatingCircle2: {
    position: 'absolute',
    top: 250,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(64, 224, 208, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.12)',
  },
  floatingCircle3: {
    position: 'absolute',
    bottom: 200,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.1)',
  },
  floatingCircle4: {
    position: 'absolute',
    top: 400,
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.1)',
  },
  floatingCircle5: {
    position: 'absolute',
    bottom: 100,
    left: '30%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.08)',
  },
  // Geometric turquoise shapes
  geometricShape1: {
    position: 'absolute',
    top: 180,
    right: '20%',
    width: 70,
    height: 70,
    backgroundColor: 'rgba(64, 224, 208, 0.07)',
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(64, 224, 208, 0.15)',
  },
  geometricShape2: {
    position: 'absolute',
    bottom: 300,
    left: '15%',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(64, 224, 208, 0.12)',
  },
  geometricShape3: {
    position: 'absolute',
    top: 350,
    right: '10%',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(64, 224, 208, 0.1)',
    borderRadius: 20,
    transform: [{ rotate: '30deg' }],
  },
  geometricShape4: {
    position: 'absolute',
    bottom: 150,
    right: '30%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(64, 224, 208, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(64, 224, 208, 0.13)',
    borderRadius: 15,
    transform: [{ rotate: '-45deg' }],
  },
  // Wave patterns
  wavePatternTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  wavePatternBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  // Dot grid pattern
  dotGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundImage: `radial-gradient(rgba(64, 224, 208, 0.3) 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  },
  // Corner accents
  cornerAccentTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: 'rgba(64, 224, 208, 0.2)',
    borderLeftColor: 'rgba(64, 224, 208, 0.2)',
    borderTopLeftRadius: 30,
  },
  cornerAccentTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopColor: 'rgba(64, 224, 208, 0.15)',
    borderRightColor: 'rgba(64, 224, 208, 0.15)',
    borderTopRightRadius: 25,
  },
  cornerAccentBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 90,
    height: 90,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomColor: 'rgba(64, 224, 208, 0.12)',
    borderLeftColor: 'rgba(64, 224, 208, 0.12)',
    borderBottomLeftRadius: 20,
  },
  cornerAccentBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 110,
    height: 110,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomColor: 'rgba(64, 224, 208, 0.18)',
    borderRightColor: 'rgba(64, 224, 208, 0.18)',
    borderBottomRightRadius: 35,
  },
  // Floating triangles
  floatingTriangle1: {
    position: 'absolute',
    top: 220,
    left: '10%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 43,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(64, 224, 208, 0.07)',
    transform: [{ rotate: '45deg' }],
  },
  floatingTriangle2: {
    position: 'absolute',
    bottom: 350,
    right: '15%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(64, 224, 208, 0.05)',
    transform: [{ rotate: '-30deg' }],
  },
  floatingTriangle3: {
    position: 'absolute',
    top: 450,
    left: '35%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(64, 224, 208, 0.04)',
    transform: [{ rotate: '60deg' }],
  },
  // Diamond grid (simulated with multiple views)
  diamondGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0D9488", // Darker turquoise
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: "#0F766E", // Medium turquoise
    marginTop: 2,
    fontWeight: "600",
  },
  notificationButton: {
    position: "relative",
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(64, 224, 208, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.25)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  welcomeCardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(64, 224, 208, 0.08)',
    borderBottomLeftRadius: 50,
    zIndex: 1,
  },
  sliderContainer: {
    height: 160,
    position: 'relative',
  },
  slide: {
    width: width - 40,
    height: 160,
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#40E0D0',
    marginHorizontal: 3,
  },
  welcomeContent: {
    padding: 20,
    paddingTop: 15,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0D9488",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#0F766E",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0D9488",
  },
  seeAllText: {
    fontSize: 14,
    color: "#40E0D0",
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D9488",
    textAlign: 'center',
  },
  gameModesContainer: {
    paddingRight: 20,
  },
  gameModeCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
  },
  gameModeAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 30,
  },
  gameModeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
  },
  gameModeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0D9488",
    marginBottom: 4,
  },
  gameModePlayers: {
    fontSize: 12,
    color: "#0F766E",
    marginBottom: 12,
  },
  gameModeIndicator: {
    alignItems: 'flex-end',
  },
  gameModeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    zIndex: 1,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.25)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
  },
  statsCardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#40E0D0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#0F766E",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D9488",
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: '700',
  },
  liveGamesContainer: {
    paddingRight: 20,
  },
  liveGameCard: {
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  liveGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveGameTime: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: '500',
  },
  liveGameBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveGameBadgeText: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: '700',
  },
  liveGamePrize: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0D9488",
    marginBottom: 4,
  },
  liveGameLabel: {
    fontSize: 12,
    color: "#0F766E",
    marginBottom: 16,
  },
  liveGameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveGamePlayers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveGamePlayersText: {
    fontSize: 12,
    color: "#0F766E",
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 40,
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
    borderRadius: 24,
    padding: 0,
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(64, 224, 208, 0.2)",
  },
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0D9488",
    marginLeft: 8,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(64, 224, 208, 0.15)",
    alignItems: 'flex-start',
  },
  notificationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#40E0D0",
    marginTop: 6,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D9488",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#0F766E",
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationDate: {
    fontSize: 11,
    color: "#14B8A6",
    fontWeight: '500',
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#0D9488",
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: "#0F766E",
    marginTop: 4,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 40,
  },
  closeBtn: {
    backgroundColor: "#40E0D0",
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(64, 224, 208, 0.2)",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});