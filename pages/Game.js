import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  TextInput,
  Keyboard,
  Animated,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const GAME_ICONS = [
  "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
  "https://cdn-icons-png.flaticon.com/512/808/808439.png",
  "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  "https://cdn-icons-png.flaticon.com/512/1086/1086741.png",
  "https://cdn-icons-png.flaticon.com/512/2921/2921222.png",
  "https://cdn-icons-png.flaticon.com/512/3094/3094707.png",
];

// Image slider data
const SLIDER_IMAGES = [
  { 
    id: 1, 
    uri: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop',
    title: 'Win Exciting Prizes',
    subtitle: 'Join premium games for bigger rewards'
  },
  { 
    id: 2, 
    uri: 'https://plus.unsplash.com/premium_photo-1722018576685-45a415a4ff67?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Instant Withdrawals',
    subtitle: 'Get your winnings within minutes'
  },
  { 
    id: 3, 
    uri: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&auto=format&fit=crop',
    title: 'Play Anywhere',
    subtitle: 'Join games from your mobile device'
  }
];

const Game = ({ navigation }) => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalGames: 0,
    freeGames: 0,
    premiumGames: 0,
    totalPlayers: 0,
    liveGames: 0,
    upcomingGames: 0,
  });
  
  // Image slider states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideInterval = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchGames();
    startAutoSlide();
    
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedCategory]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchGames().finally(() => setRefreshing(false));
  }, []);

  const fetchGames = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const res = await axios.get(
      "https://exilance.com/tambolatimez/public/api/user/games",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.data.success) {
      // Access games from games.data instead of directly from games
      const gamesData = res.data.games.data || [];
      setGames(gamesData);
      
      // Use the status_counts from the API response
      const statusCounts = res.data.status_counts || {};
      
      // Calculate statistics using the new API data
      const freeGames = gamesData.filter(g => g.ticket_type === "free").length;
      const premiumGames = gamesData.filter(g => g.ticket_type === "paid").length;
      const liveGames = statusCounts.live || 0;
      const upcomingGames = statusCounts.scheduled || 0;
      const completedGames = statusCounts.completed || 0;
      
      // Calculate total players if available_tickets exists
      const totalPlayers = gamesData.reduce((acc, game) => {
        const players = game.available_tickets || 0;
        return acc + players;
      }, 0);
      
      setStats({
        totalGames: res.data.total_games || gamesData.length,
        freeGames,
        premiumGames,
        totalPlayers,
        liveGames,
        upcomingGames,
        completedGames,
      });
    }
  } catch (error) {
    console.log("Error fetching games:", error);
    alert("Failed to load games!");
  } finally {
    setLoading(false);
  }
};

  const startAutoSlide = () => {
    slideInterval.current = setInterval(() => {
      setCurrentImageIndex(prevIndex => {
        const nextIndex = prevIndex === SLIDER_IMAGES.length - 1 ? 0 : prevIndex + 1;
        
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

  const filterGames = () => {
    let filtered = games;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(game =>
        game.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.game_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => {
        switch(selectedCategory) {
          case 'free':
            return game.ticket_type === "free";
          case 'premium':
            return game.ticket_type === "paid";
          case 'soon':
            if (game.status !== 'scheduled') return false;
            const gameTime = new Date(`${game.game_date}T${game.game_start_time}`);
            const now = new Date();
            const diffHours = (gameTime - now) / (1000 * 60 * 60);
            return diffHours > 0 && diffHours < 2;
          case 'high':
            return game.ticket_type === "paid" && parseFloat(game.ticket_cost) >= 100;
          case 'popular':
            return (game.available_tickets && game.available_tickets < 30) || false;
          default:
            return true;
        }
      });
    }

    setFilteredGames(filtered);
  };

  const getGameIcon = (index) => {
    return GAME_ICONS[index % GAME_ICONS.length];
  };

  const renderImageSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDER_IMAGES}
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
              <View style={styles.slideContent}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
              </View>
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
          {SLIDER_IMAGES.map((_, index) => {
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

  const renderGameCard = (game, index) => {
    const gameIcon = getGameIcon(index);
    const ticketCost = parseFloat(game.ticket_cost || 0);
    
    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("GameDetails", { game })}
      >
        {/* Background Pattern */}
        <View style={styles.gameCardPattern} />
        
        {/* Status Badge - Moved to left side to avoid overlapping */}
        <View style={[styles.statusBadge, 
          game.status === 'live' ? styles.liveBadge :
          game.status === 'scheduled' ? styles.scheduledBadge :
          styles.completedBadge
        ]}>
          <Ionicons 
            name={game.status === 'live' ? 'radio-button-on' : 'time'} 
            size={10} 
            color="#FFF" 
          />
          <Text style={styles.statusText}>
            {game.status === 'live' ? 'LIVE' : 'SOON'}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.gameIconContainer}>
            <View style={styles.gameIconWrapper}>
              <Image source={{ uri: gameIcon }} style={styles.gameIcon} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName} numberOfLines={1}>{game.game_name}</Text>
              <Text style={styles.gameId}>ID: {game.game_code}</Text>
            </View>
          </View>
          
          <View style={[
            styles.gameTypeBadge,
            game.ticket_type === "paid" ? styles.paidBadge : styles.freeBadge
          ]}>
            {game.ticket_type === "paid" ? (
              <>
                <MaterialIcons name="diamond" size={14} color="#FFD700" />
                <Text style={styles.gameTypeText}>₹{ticketCost}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#40E0D0" />
                <Text style={styles.gameTypeText}>FREE</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.gameDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar" size={14} color="#40E0D0" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailText}>
                  {game.game_date_formatted || game.game_date}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={14} color="#40E0D0" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailText}>{game.game_time_formatted || game.game_start_time}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="person" size={14} color="#40E0D0" />
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
                  <MaterialIcons name="confirmation-number" size={14} color="#40E0D0" />
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

        <View style={styles.prizeContainer}>
          <View style={styles.prizeIcon}>
            <MaterialIcons name="account-balance-wallet" size={18} color="#40E0D0" />
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

        <TouchableOpacity 
          style={[
            styles.joinButton,
            game.ticket_type === "paid" ? styles.paidButton : styles.freeButton
          ]}
          onPress={() => navigation.navigate("GameDetails", { game })}
        >
          <Text style={styles.joinButtonText}>
            {game.status === 'live' ? 'JOIN GAME' : 'VIEW DETAILS'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const CategoryItem = ({ title, count, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.categoryItem, isActive && styles.categoryItemActive]}
      onPress={onPress}
    >
      <Text style={[styles.categoryTitle, isActive && styles.categoryTitleActive]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.categoryCount}>
          <Text style={styles.categoryCountText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>
        
        <View style={styles.loadingAnimation}>
          <View style={styles.loadingIconWrapper}>
            <Ionicons name="game-controller" size={40} color="#40E0D0" />
          </View>
          <ActivityIndicator size="large" color="#40E0D0" style={styles.loadingSpinner} />
        </View>
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  const categories = [
    { id: 'all', title: 'All Games', count: stats.totalGames },
    { id: 'free', title: 'Free', count: stats.freeGames },
    { id: 'premium', title: 'Premium', count: stats.premiumGames },
    { id: 'soon', title: 'Starting Soon', count: stats.upcomingGames },
    { id: 'high', title: 'High Prize', count: games.filter(g => g.ticket_type === "paid" && parseFloat(g.ticket_cost) >= 100).length },
    { id: 'popular', title: 'Popular', count: games.filter(g => g.available_tickets && g.available_tickets < 30).length },
  ];

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
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>Tambola Games</Text>
            <Text style={styles.appTagline}>Play, Compete & Win Big</Text>
          </View>
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <Feather name="search" size={20} color="#6C757D" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search games by name or ID..."
            placeholderTextColor="#ADB5BD"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#6C757D" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* IMAGE SLIDER SECTION */}
      <View style={styles.sliderSection}>
        {renderImageSlider()}
      </View>

     

      {/* GAMES LIST */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Games</Text>
          <Text style={styles.gameCount}>{filteredGames.length} Games</Text>
        </View>

        {filteredGames.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="game-controller-outline" size={50} color="#40E0D0" />
            </View>
            <Text style={styles.emptyTitle}>No Games Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `No games found for "${searchQuery}"` : 
               selectedCategory !== 'all' ? `No ${selectedCategory} games available` :
               "Check back later for new exciting games!"}
            </Text>
            {(searchQuery || selectedCategory !== 'all') && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gamesList}>
            {filteredGames.map((game, index) => renderGameCard(game, index))}
          </View>
        )}
      </View>

      {/* BOTTOM SPACE */}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default Game;

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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingAnimation: {
    position: 'relative',
    marginBottom: 20,
  },
  loadingIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(64, 224, 208, 0.2)',
  },
  loadingSpinner: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#212529",
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  sliderSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    zIndex: 1,
  },
  sliderContainer: {
    height: 200,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  slide: {
    width: width - 40,
    height: 200,
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  slideContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  slideSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#40E0D0',
    marginHorizontal: 4,
  },
  categoriesScroll: {
    marginTop: 15,
    zIndex: 1,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
  },
  categoryItemActive: {
    backgroundColor: "#40E0D0",
    borderColor: "#40E0D0",
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
  },
  categoryTitleActive: {
    color: "#FFF",
  },
  categoryCount: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  categoryCountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 15,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  gameCount: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  gameCardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    zIndex: 1,
  },
  liveBadge: {
    backgroundColor: '#4CAF50',
  },
  scheduledBadge: {
    backgroundColor: '#2196F3',
  },
  completedBadge: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 16,
  },
  gameIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  gameIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    padding: 8,
  },
  gameIcon: {
    width: "100%",
    height: "100%",
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  gameId: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "500",
  },
  gameTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginLeft: 8,
    borderWidth: 1,
  },
  paidBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "#FFD700",
  },
  freeBadge: {
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    borderColor: "#40E0D0",
  },
  gameTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#212529",
  },
  gameDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  detailLabel: {
    fontSize: 10,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: "#212529",
    fontWeight: "600",
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  prizeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#40E0D0",
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 2,
  },
  prizeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  paidButton: {
    backgroundColor: "#40E0D0",
  },
  freeButton: {
    backgroundColor: "#40E0D0",
  },
  joinButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
  },
  emptyIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(64, 224, 208, 0.2)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: "#40E0D0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearFiltersButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 20,
  },
});