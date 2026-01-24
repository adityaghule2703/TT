import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { FontAwesome, Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [games, setGames] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingSliders, setLoadingSliders] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const sliderRef = useRef(null);
  const scrollInterval = useRef(null);
  
  // Animation values
  const shineAnim = useRef(new Animated.Value(0)).current;
  const chipFloatAnim = useRef(new Animated.Value(0)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNotifications();
    fetchSliders();
    fetchGames();
    fetchPatterns();
    
    // Start background animations
    startAnimations();
  }, []);

  useEffect(() => {
    // Auto-scroll slider
    if (sliders.length > 1) {
      startAutoScroll();
    }
    
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [sliders.length, activeSlide]);

  const startAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    
    scrollInterval.current = setInterval(() => {
      let nextIndex = activeSlide + 1;
      if (nextIndex >= sliders.length) {
        nextIndex = 0;
      }
      
      setActiveSlide(nextIndex);
      if (sliderRef.current) {
        sliderRef.current.scrollToIndex({
          index: nextIndex,
          animated: true
        });
      }
    }, 3000);
  };

  const startAnimations = () => {
    // Shine animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Card rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotateAnim, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Chip float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(chipFloatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(chipFloatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Interpolations
  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100]
  });

  const rotate = cardRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const chipTranslateY = chipFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10]
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
    fetchSliders();
    fetchGames();
    fetchPatterns();
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

  const fetchSliders = async () => {
    try {
      setLoadingSliders(true);
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/sliders"
      );
      console.log("Sliders API Response:", res.data);
      if (res.data.success) {
        setSliders(res.data.data);
      } else {
        console.log("Sliders API returned unsuccessful:", res.data);
      }
    } catch (error) {
      console.log("Error fetching sliders:", error);
    } finally {
      setLoadingSliders(false);
    }
  };

  const fetchGames = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setGames(res.data.games.data || []);
      }
    } catch (error) {
      console.log("Error fetching games:", error);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      setLoadingPatterns(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        console.log("No token found for patterns");
        setLoadingPatterns(false);
        return;
      }

      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/patterns/available",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        const patternsData = response.data.data?.patterns || [];
        setPatterns(patternsData.slice(0, 5));
      } else {
        console.log('Failed to fetch patterns');
      }
    } catch (error) {
      console.log('Error fetching patterns in Home:', error);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleGamePress = (game) => {
    navigation.navigate("Game");
  };

  const handleAllGamesPress = () => {
    navigation.navigate("Game");
  };

  const handleAllPatternsPress = () => {
    navigation.navigate("UserGamePatterns");
  };

  const handleViewAllWinners = () => {
    navigation.navigate("Game");
  };

  const handlePatternPress = (pattern) => {
    navigation.navigate("UserGamePatterns", { 
      selectedPatternId: pattern.id,
      selectedPattern: pattern 
    });
  };

  const getPatternIcon = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return 'grid-outline';
      case 'count_based':
        return 'stats-chart-outline';
      case 'all_numbers':
        return 'checkbox-outline';
      case 'row_complete':
        return 'reorder-three-outline';
      case 'number_based':
        return 'calculator-outline';
      case 'number_range':
        return 'funnel-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getPatternColor = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return '#D4AF37'; // Gold
      case 'count_based':
        return '#FFD700'; // Golden yellow
      case 'all_numbers':
        return '#C5B358'; // Golden bronze
      case 'row_complete':
        return '#F9A825'; // Golden amber
      case 'number_based':
        return '#D4AF37'; // Gold
      case 'number_range':
        return '#FFC72C'; // Golden orange
      default:
        return '#D4AF37';
    }
  };

  const formatPatternName = (name) => {
    if (!name) return 'Unknown Pattern';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderPatternCard = (pattern) => {
    const logicType = pattern.pattern_logic?.logic_type || pattern.logic_type || 'unknown';
    const icon = getPatternIcon(logicType);
    const color = getPatternColor(logicType);
    
    return (
      <TouchableOpacity 
        key={pattern.id} 
        style={styles.patternCard}
        onPress={() => handlePatternPress(pattern)}
      >
        <View style={[styles.patternIconContainer, { backgroundColor: color + '30' }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={[styles.patternText, { color: '#F5E6A8' }]} numberOfLines={2}>
          {pattern.display_name || formatPatternName(pattern.pattern_name)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSliderItem = ({ item, index }) => (
    <View style={styles.slideContainer}>
      <Image
        source={{ 
          uri: item.image_url || 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
        }}
        style={styles.sliderImage}
        resizeMode="cover"
        onError={(error) => {
          console.log("Image loading error:", error.nativeEvent.error);
        }}
      />
      <View style={styles.sliderOverlay} />
      
      <View style={styles.sliderContent}>
        <Text style={styles.sliderTitle}>{item.title || "Tambola Timez"}</Text>
        {item.description && (
          <Text style={styles.sliderDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <TouchableOpacity style={styles.exploreButton}>
          <Text style={styles.exploreButtonText}>Explore</Text>
          <Ionicons name="arrow-forward" size={14} color="#004B54" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.floor(contentOffset / slideSize);
    
    if (currentIndex !== activeSlide) {
      setActiveSlide(currentIndex);
      // Reset auto-scroll timer
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
      startAutoScroll();
    }
  };

  const renderPagination = () => {
    if (sliders.length <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        {sliders.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setActiveSlide(index);
              sliderRef.current?.scrollToIndex({
                index,
                animated: true
              });
              // Reset auto-scroll timer
              if (scrollInterval.current) {
                clearInterval(scrollInterval.current);
              }
              startAutoScroll();
            }}
          >
            <View
              style={[
                styles.paginationDot,
                activeSlide === index
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGameCard = (game, index) => {
    if (!game) return null;
    
    const ticketCost = parseFloat(game.ticket_cost || 0);
    const isPlaying = false;
    
    return (
      <View key={game.id || index} style={[styles.gameCard, isPlaying && styles.playingGameCard]}>
        {/* Game Card Background Pattern */}
        <View style={styles.gameCardBackground}>
          <Animated.View 
            style={[
              styles.cardPattern1,
              { transform: [{ rotate: rotate }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.cardPattern2,
              { transform: [{ translateY: chipTranslateY }] }
            ]}
          />
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, 
          game.status === 'live' ? styles.liveBadge :
          game.status === 'scheduled' ? styles.scheduledBadge :
          styles.completedBadge
        ]}>
          <Ionicons 
            name={game.status === 'live' ? 'radio-button-on' : 'time'} 
            size={12} 
            color="#FFF" 
          />
          <Text style={styles.statusText}>
            {game.status === 'live' ? 'LIVE' : 'SOON'}
          </Text>
        </View>

        {/* Game Header */}
        <View style={styles.cardHeader}>
          <View style={styles.gameIconContainer}>
            <View style={styles.gameIconWrapper}>
              <FontAwesome name="diamond" size={22} color="#D4AF37" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName} numberOfLines={1}>{game.game_name || "Tambola Game"}</Text>
              <Text style={styles.gameId}>ID: {game.game_code || "N/A"}</Text>
            </View>
          </View>
          
          <View style={[
            styles.gameTypeBadge,
            game.ticket_type === "paid" ? styles.paidBadge : styles.freeBadge
          ]}>
            {game.ticket_type === "paid" ? (
              <>
                <FontAwesome name="diamond" size={14} color="#FFD700" />
                <Text style={styles.gameTypeText}>₹{ticketCost}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#FFD700" />
                <Text style={styles.gameTypeText}>FREE</Text>
              </>
            )}
          </View>
        </View>

        {/* Game Details */}
        <View style={styles.gameDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar" size={16} color="#D4AF37" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailText}>
                  {game.game_date_formatted || game.game_date || "N/A"}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={16} color="#D4AF37" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailText}>{game.game_time_formatted || game.game_start_time || "N/A"}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="person" size={16} color="#D4AF37" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Host</Text>
                <Text style={styles.detailText}>
                  {game.user ? game.user.name : 'Tambola Timez'}
                </Text>
              </View>
            </View>
            
            {game.available_tickets !== undefined && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="confirmation-number" size={16} color="#D4AF37" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Tickets</Text>
                  <Text style={styles.detailText}>
                    {game.available_tickets} Left
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Prize Pool */}
        <View style={styles.prizeContainer}>
          <View style={styles.prizeIcon}>
            <FontAwesome name="trophy" size={18} color="#D4AF37" />
          </View>
          <View style={styles.prizeInfo}>
            <Text style={styles.prizeLabel}>Prize Pool</Text>
            <Text style={styles.prizeText}>
              {game.ticket_type === "paid" && game.available_tickets 
                ? `₹${(ticketCost * game.available_tickets).toLocaleString()}`
                : "Exciting Prizes"}
            </Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity 
          style={[
            styles.joinButton,
            game.ticket_type === "paid" ? styles.paidButton : styles.freeButton,
          ]}
          onPress={() => handleGamePress(game)}
        >
          <Text style={styles.joinButtonText}>
            {game.status === 'live' ? 'JOIN GAME' : 'VIEW DETAILS'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome</Text>
            <Text style={styles.appTitle}>Tambola Timez</Text>
          </View>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="notifications" size={26} color="#D4AF37" />
            {notifications.length > 0 && <View style={styles.dot} />}
          </TouchableOpacity>
        </View>

        {/* SLIDER SECTION */}
        {loadingSliders ? (
          <View style={styles.sliderLoadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        ) : sliders.length > 0 ? (
          <View style={styles.sliderSection}>
            <View style={styles.sliderWrapper}>
              <FlatList
                ref={sliderRef}
                data={sliders}
                renderItem={renderSliderItem}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={(event) => {
                  const slideSize = event.nativeEvent.layoutMeasurement.width;
                  const contentOffset = event.nativeEvent.contentOffset.x;
                  const currentIndex = Math.floor(contentOffset / slideSize);
                  setActiveSlide(currentIndex);
                }}
                scrollEventThrottle={16}
                initialScrollIndex={0}
                style={styles.sliderFlatList}
              />
              
              {/* Pagination Dots */}
              {renderPagination()}
              
              {/* Slide Indicator */}
              <View style={styles.slideIndicator}>
                <Text style={styles.slideIndicatorText}>
                  {activeSlide + 1} / {sliders.length}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.bannerCard}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Play Tambola Now</Text>
                <Text style={styles.bannerSubTitle}>Win exciting prizes daily!</Text>
                <TouchableOpacity 
                  style={styles.getStartedBtn}
                  onPress={handleAllGamesPress}
                >
                  <Text style={styles.getStartedText}>Play Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#004B54" />
                </TouchableOpacity>
              </View>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/616/616554.png",
                }}
                style={styles.bannerImage}
              />
            </View>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickAction, styles.depositBtn]}>
            <View style={styles.quickActionIcon}>
              <FontAwesome name="money" size={22} color="#FFF" />
            </View>
            <Text style={styles.quickActionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, styles.withdrawBtn]}>
            <View style={styles.quickActionIcon}>
              <FontAwesome name="bank" size={22} color="#FFF" />
            </View>
            <Text style={styles.quickActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, styles.referBtn]}>
            <View style={styles.quickActionIcon}>
              <FontAwesome name="users" size={22} color="#FFF" />
            </View>
            <Text style={styles.quickActionText}>Refer & Earn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, styles.supportBtn]}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="headset" size={22} color="#FFF" />
            </View>
            <Text style={styles.quickActionText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* PATTERNS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="grid-outline" size={24} color="#D4AF37" />
              <Text style={styles.sectionTitle}>PATTERNS</Text>
            </View>
            <TouchableOpacity onPress={handleAllPatternsPress}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingPatterns ? (
            <View style={styles.patternsLoadingContainer}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Loading patterns...</Text>
            </View>
          ) : patterns.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.patternContainer}
            >
              {patterns.map((pattern) => renderPatternCard(pattern))}
            </ScrollView>
          ) : (
            <View style={styles.noPatternsContainer}>
              <Text style={styles.noPatternsText}>No patterns available</Text>
              <TouchableOpacity onPress={fetchPatterns}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ALL GAMES SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="game-controller-outline" size={24} color="#D4AF37" />
              <Text style={styles.sectionTitle}>ALL GAMES</Text>
            </View>
            <TouchableOpacity onPress={handleAllGamesPress}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingGames ? (
            <View style={styles.gamesLoadingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loadingText}>Loading games...</Text>
            </View>
          ) : games.length > 0 ? (
            <View style={styles.gamesContainer}>
              {games.slice(0, 3).map((game, index) => renderGameCard(game, index))}
            </View>
          ) : (
            <View style={styles.noGamesContainer}>
              <Ionicons name="game-controller-outline" size={55} color="#F5E6A8" />
              <Text style={styles.noGamesText}>No games available at the moment</Text>
              <TouchableOpacity 
                style={styles.refreshGamesBtn}
                onPress={handleAllGamesPress}
              >
                <Text style={styles.refreshGamesText}>Browse Games</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* RECENT WINNERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <FontAwesome name="trophy" size={24} color="#D4AF37" />
              <Text style={styles.sectionTitle}>RECENT WINNERS</Text>
            </View>
            <TouchableOpacity onPress={handleViewAllWinners}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.winnersContainer}>
            {[
              { id: 1, name: "Amit Sharma", prize: "Won Full House 🏆", time: "2 min ago", color: "#D4AF37" },
              { id: 2, name: "Neha Gupta", prize: "Won Early 5 🎉", time: "5 min ago", color: "#FFD700" },
              { id: 3, name: "Rahul Verma", prize: "Won Corners ✨", time: "10 min ago", color: "#C5B358" },
            ].map((winner) => (
              <View key={winner.id} style={styles.winnerCard}>
                <View style={styles.winnerInfo}>
                  <View style={[styles.winnerAvatar, { backgroundColor: winner.color }]}>
                    <Text style={styles.winnerInitial}>{winner.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    <Text style={styles.winnerPrize}>{winner.prize}</Text>
                  </View>
                </View>
                <Text style={styles.winnerTime}>{winner.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* WHY PLAY WITH US SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#D4AF37" />
              <Text style={styles.sectionTitle}>WHY PLAY WITH US</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="checkmark-circle" size={22} color="#D4AF37" />
                </View>
                <Text style={styles.infoText}>Fast & Fair Games</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="checkmark-circle" size={22} color="#D4AF37" />
                </View>
                <Text style={styles.infoText}>Real Players</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="checkmark-circle" size={22} color="#D4AF37" />
                </View>
                <Text style={styles.infoText}>24x7 Rooms Available</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="checkmark-circle" size={22} color="#D4AF37" />
                </View>
                <Text style={styles.infoText}>Safe & Fun Experience</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />

        {/* NOTIFICATIONS MODAL */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={26} color="#F5E6A8" />
                </TouchableOpacity>
              </View>

              {loadingNotifications ? (
                <ActivityIndicator size="large" color="#D4AF37" style={styles.loadingIndicator} />
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item }) => (
                    <View style={styles.notificationItem}>
                      <View style={styles.notificationIcon}>
                        <Ionicons name="notifications" size={22} color="#D4AF37" />
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
                      <Ionicons name="notifications-off" size={55} color="#F5E6A8" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#005F6A", // Main background color
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcome: {
    color: "#E6D8A2",
    fontSize: 14,
  },
  appTitle: {
    color: "#F5E6A8",
    fontSize: 26,
    fontWeight: "bold",
  },
  dot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    backgroundColor: "red",
    borderRadius: 4,
  },
  sliderSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sliderWrapper: {
    height: 220,
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderFlatList: {
    height: 220,
  },
  sliderLoadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0, 75, 84, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  slideContainer: {
    width: width - 40,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 75, 84, 0.4)',
  },
  sliderContent: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
  },
  sliderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5E6A8',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  sliderDescription: {
    fontSize: 15,
    color: '#D4AF37',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#004B54',
    fontSize: 14,
    fontWeight: '700',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    zIndex: 2,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#D4AF37',
    width: 24,
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
  },
  slideIndicator: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  slideIndicatorText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerCard: {
    backgroundColor: '#004B54',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    padding: 25,
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5E6A8',
    marginBottom: 6,
  },
  bannerSubTitle: {
    fontSize: 15,
    color: '#D4AF37',
    marginBottom: 18,
    fontWeight: '600',
  },
  getStartedBtn: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  getStartedText: {
    color: '#004B54',
    fontWeight: '800',
    fontSize: 15,
  },
  bannerImage: {
    width: 110,
    height: 110,
    marginLeft: 15,
  },
  loadingText: {
    marginTop: 10,
    color: '#D4AF37',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 60) / 4,
    paddingVertical: 15,
    borderRadius: 15,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  quickActionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  depositBtn: {
    backgroundColor: '#D4AF37', // Gold
  },
  withdrawBtn: {
    backgroundColor: '#FF6B6B', // Coral Red
  },
  referBtn: {
    backgroundColor: '#4ECDC4', // Turquoise
  },
  supportBtn: {
    backgroundColor: '#9B59B6', // Purple
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5E6A8',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '700',
  },
  patternsLoadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 75, 84, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  noPatternsContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 75, 84, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  noPatternsText: {
    color: '#F5E6A8',
    fontSize: 15,
    marginBottom: 10,
  },
  retryText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '700',
  },
  patternContainer: {
    gap: 15,
  },
  patternCard: {
    alignItems: 'center',
    width: 100,
    backgroundColor: '#004B54',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  patternIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  patternText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  gamesLoadingContainer: {
    padding: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 75, 84, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  noGamesContainer: {
    backgroundColor: '#004B54',
    padding: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  noGamesText: {
    marginTop: 12,
    color: '#F5E6A8',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  refreshGamesBtn: {
    marginTop: 18,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshGamesText: {
    color: '#004B54',
    fontWeight: '800',
    fontSize: 14,
  },
  gamesContainer: {
    gap: 15,
  },
  gameCard: {
    backgroundColor: '#004B54',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gameCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardPattern1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  cardPattern2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveBadge: {
    backgroundColor: '#27AE60',
  },
  scheduledBadge: {
    backgroundColor: '#F39C12',
  },
  completedBadge: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  gameIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  gameIconWrapper: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5E6A8',
    marginBottom: 3,
  },
  gameId: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
  },
  gameTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
    marginLeft: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  paidBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  freeBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
  },
  gameTypeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F5E6A8',
  },
  gameDetails: {
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  detailLabel: {
    fontSize: 11,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 14,
    color: '#F5E6A8',
    fontWeight: '700',
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  prizeIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 3,
  },
  prizeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5E6A8',
  },
  joinButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  paidButton: {
    backgroundColor: '#D4AF37',
  },
  freeButton: {
    backgroundColor: '#FFD700',
  },
  joinButtonText: {
    color: '#004B54',
    fontSize: 15,
    fontWeight: '800',
  },
  winnersContainer: {
    gap: 12,
  },
  winnerCard: {
    backgroundColor: '#004B54',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  winnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  winnerInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5E6A8',
    marginBottom: 3,
  },
  winnerPrize: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  winnerTime: {
    fontSize: 13,
    color: '#F5E6A8',
    opacity: 0.8,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#004B54',
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  infoList: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#F5E6A8',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '75%',
    backgroundColor: '#004B54',
    borderRadius: 22,
    padding: 22,
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5E6A8',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  notificationIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5E6A8',
    marginBottom: 3,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 5,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: '#F5E6A8',
    opacity: 0.7,
    fontWeight: '600',
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },
  emptyText: {
    fontSize: 17,
    color: '#F5E6A8',
    opacity: 0.7,
    marginTop: 12,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginVertical: 22,
  },
  closeBtn: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  closeBtnText: {
    color: '#004B54',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default Home;