import React, { useEffect, useState, useRef } from "react";
import {
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
  Easing,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

// Color scheme matching Home page
const PRIMARY_COLOR = "#005F6A"; // Main background color
const SECONDARY_COLOR = "#004B54"; // Dark teal
const ACCENT_COLOR = "#D4AF37"; // Gold
const LIGHT_ACCENT = "#F5E6A8"; // Light gold
const MUTED_GOLD = "#E6D8A2"; // Muted gold for text
const DARK_TEAL = "#00343A"; // Darker teal
const WHITE = "#FFFFFF";

const GAME_ICONS = [
  "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
  "https://cdn-icons-png.flaticon.com/512/808/808439.png",
  "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  "https://cdn-icons-png.flaticon.com/512/1086/1086741.png",
  "https://cdn-icons-png.flaticon.com/512/2921/2921222.png",
  "https://cdn-icons-png.flaticon.com/512/3094/3094707.png",
];

const Game = ({ navigation }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userGameData, setUserGameData] = useState({
    myTickets: [],
    myRequests: []
  });
  const [activeTab, setActiveTab] = useState('myGames');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Animation values
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAllData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // First floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Second floating animation (different timing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Shine animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Interpolations for animations
  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100]
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    fetchAllData(true).finally(() => setRefreshing(false));
  }, []);

  const fetchAllData = async (reset = false) => {
    if (reset) {
      setGames([]);
    }
    setLoading(true);
    try {
      await Promise.all([
        fetchGames(1, reset),
        fetchMyTickets(),
        fetchMyRequests()
      ]);
    } catch (error) {
      console.log("Error fetching data:", error);
      alert("Failed to load games data!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (page = 1, reset = false) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games?page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        const gamesData = res.data.games.data || [];
        const paginationData = res.data.games;
        
        if (reset) {
          setGames(gamesData);
        } else {
          setGames(prev => [...prev, ...gamesData]);
        }
        
        setCurrentPage(paginationData.current_page);
        setLastPage(paginationData.last_page);
        setHasMore(paginationData.current_page < paginationData.last_page);
      }
    } catch (error) {
      console.log("Error fetching games:", error);
      alert("Failed to load games!");
    }
  };

  const fetchMyTickets = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUserGameData(prev => ({
          ...prev,
          myTickets: res.data.tickets.data || []
        }));
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUserGameData(prev => ({
          ...prev,
          myRequests: res.data.ticket_requests.data || []
        }));
      }
    } catch (error) {
      console.log("Error fetching requests:", error);
    }
  };

  const loadMoreGames = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      fetchGames(nextPage).finally(() => setLoadingMore(false));
    }
  };

  const isUserPlayingGame = (gameId) => {
    const hasTickets = userGameData.myTickets.some(ticket => ticket.game_id == gameId);
    const hasPendingRequests = userGameData.myRequests.some(request => 
      request.game_id == gameId && request.status === 'pending'
    );
    
    return hasTickets || hasPendingRequests;
  };

  const getUserTicketCount = (gameId) => {
    const ticketsCount = userGameData.myTickets.filter(ticket => ticket.game_id == gameId).length;
    const pendingRequestsCount = userGameData.myRequests.filter(request => 
      request.game_id == gameId && request.status === 'pending'
    ).length;
    
    return {
      tickets: ticketsCount,
      pendingRequests: pendingRequestsCount,
      total: ticketsCount + pendingRequestsCount
    };
  };

  const getFilteredGames = () => {
    let filtered = games;

    if (searchQuery.trim()) {
      filtered = filtered.filter(game =>
        game.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.game_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'myGames') {
      filtered = filtered.filter(game => isUserPlayingGame(game.id));
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(game => game.status === 'completed');
    } else if (activeTab === 'allGames') {
      // Show all games including completed
      filtered = filtered;
    }

    return filtered;
  };

  const getGameIcon = (index) => {
    return GAME_ICONS[index % GAME_ICONS.length];
  };

  const renderPlayingBadge = (game) => {
    const ticketInfo = getUserTicketCount(game.id);
    
    if (ticketInfo.total === 0) return null;
    
    return (
      <View style={styles.playingBadge}>
        <View style={styles.playingBadgeIcon}>
          <Ionicons name="person-circle" size={12} color={SECONDARY_COLOR} />
        </View>
        <Text style={styles.playingBadgeText}>
          {ticketInfo.tickets > 0 ? `${ticketInfo.tickets} Ticket${ticketInfo.tickets > 1 ? 's' : ''}` : ''}
          {ticketInfo.tickets > 0 && ticketInfo.pendingRequests > 0 ? ' + ' : ''}
          {ticketInfo.pendingRequests > 0 ? `${ticketInfo.pendingRequests} Request${ticketInfo.pendingRequests > 1 ? 's' : ''}` : ''}
        </Text>
      </View>
    );
  };

  const renderGameCard = ({ item: game, index }) => {
    const gameIcon = getGameIcon(index);
    const ticketCost = parseFloat(game.ticket_cost || 0);
    const ticketInfo = getUserTicketCount(game.id);
    const isPlaying = isUserPlayingGame(game.id);
    const isCompleted = game.status === 'completed';
    const isLive = game.status === 'live';
    const isScheduled = game.status === 'scheduled';
    
    return (
      <TouchableOpacity
        key={game.id}
        style={[
          styles.gameCard, 
          isPlaying && styles.playingGameCard,
          isCompleted && styles.completedGameCard
        ]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("GameDetails", { game })}
      >
        {isPlaying && (
          <View style={styles.playingCardOverlay}>
            <View style={styles.playingCardLabel}>
              <Ionicons name="checkmark-circle" size={12} color={WHITE} />
              <Text style={styles.playingCardLabelText}>You're Playing</Text>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedCardOverlay}>
            <View style={styles.completedCardLabel}>
              <Ionicons name="trophy" size={12} color={WHITE} />
              <Text style={styles.completedCardLabelText}>Game Ended</Text>
            </View>
          </View>
        )}

        <View style={styles.gameCardPattern} />
        
        <View style={[
          styles.statusBadge, 
          isLive ? styles.liveBadge :
          isScheduled ? styles.scheduledBadge :
          isCompleted ? styles.completedBadge :
          styles.defaultBadge
        ]}>
          <Ionicons 
            name={
              isLive ? 'radio-button-on' : 
              isCompleted ? 'checkmark-circle' :
              'time'
            } 
            size={10} 
            color={WHITE} 
          />
          <Text style={styles.statusText}>
            {isLive ? 'LIVE' : 
             isCompleted ? 'COMPLETED' : 
             'SOON'}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.gameIconContainer}>
            <View style={[
              styles.gameIconWrapper,
              isCompleted && styles.completedGameIconWrapper
            ]}>
              <Image source={{ uri: gameIcon }} style={[
                styles.gameIcon,
                isCompleted && { opacity: 0.7 }
              ]} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={[
                styles.gameName,
                isCompleted && styles.completedGameName
              ]} numberOfLines={1}>
                {game.game_name}
              </Text>
              <Text style={[
                styles.gameId,
                isCompleted && styles.completedGameId
              ]}>
                ID: {game.game_code}
              </Text>
              {isPlaying && renderPlayingBadge(game)}
            </View>
          </View>
          
          <View style={[
            styles.gameTypeBadge,
            game.ticket_type === "paid" ? styles.paidBadge : styles.freeBadge,
            isCompleted && styles.completedTypeBadge
          ]}>
            {game.ticket_type === "paid" ? (
              <>
                <MaterialIcons name="diamond" size={14} color={ACCENT_COLOR} />
                <Text style={[
                  styles.gameTypeText,
                  isCompleted && styles.completedTypeText
                ]}>
                  ₹{ticketCost}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color={ACCENT_COLOR} />
                <Text style={[
                  styles.gameTypeText,
                  isCompleted && styles.completedTypeText
                ]}>
                  FREE
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.gameDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={[
                styles.detailIcon,
                isCompleted && styles.completedDetailIcon
              ]}>
                <Ionicons name="calendar" size={14} color={ACCENT_COLOR} />
              </View>
              <View>
                <Text style={[
                  styles.detailLabel,
                  isCompleted && styles.completedDetailLabel
                ]}>
                  Date
                </Text>
                <Text style={[
                  styles.detailText,
                  isCompleted && styles.completedDetailText
                ]}>
                  {game.game_date_formatted || game.game_date}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={[
                styles.detailIcon,
                isCompleted && styles.completedDetailIcon
              ]}>
                <Ionicons name="time" size={14} color={ACCENT_COLOR} />
              </View>
              <View>
                <Text style={[
                  styles.detailLabel,
                  isCompleted && styles.completedDetailLabel
                ]}>
                  Time
                </Text>
                <Text style={[
                  styles.detailText,
                  isCompleted && styles.completedDetailText
                ]}>
                  {game.game_time_formatted || game.game_start_time}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={[
                styles.detailIcon,
                isCompleted && styles.completedDetailIcon
              ]}>
                <Ionicons name="person" size={14} color={ACCENT_COLOR} />
              </View>
              <View>
                <Text style={[
                  styles.detailLabel,
                  isCompleted && styles.completedDetailLabel
                ]}>
                  Host
                </Text>
                <Text style={[
                  styles.detailText,
                  isCompleted && styles.completedDetailText
                ]}>
                  {game.user ? game.user.name : 'Tambola Timez'}
                </Text>
              </View>
            </View>
            
            {game.available_tickets !== undefined && !isCompleted && (
              <View style={styles.detailItem}>
                <View style={[
                  styles.detailIcon,
                  isCompleted && styles.completedDetailIcon
                ]}>
                  <MaterialIcons name="confirmation-number" size={14} color={ACCENT_COLOR} />
                </View>
                <View>
                  <Text style={[
                    styles.detailLabel,
                    isCompleted && styles.completedDetailLabel
                  ]}>
                    Tickets
                  </Text>
                  <Text style={[
                    styles.detailText,
                    isCompleted && styles.completedDetailText
                  ]}>
                    {game.available_tickets} Left
                  </Text>
                </View>
              </View>
            )}
            {isCompleted && (
              <View style={styles.detailItem}>
                <View style={[
                  styles.detailIcon,
                  isCompleted && styles.completedDetailIcon
                ]}>
                  <Ionicons name="trophy" size={14} color={ACCENT_COLOR} />
                </View>
                <View>
                  <Text style={[
                    styles.detailLabel,
                    isCompleted && styles.completedDetailLabel
                  ]}>
                    Status
                  </Text>
                  <Text style={[
                    styles.detailText,
                    isCompleted && styles.completedDetailText
                  ]}>
                    Completed
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[
          styles.prizeContainer,
          isCompleted && styles.completedPrizeContainer
        ]}>
          <View style={[
            styles.prizeIcon,
            isCompleted && styles.completedPrizeIcon
          ]}>
            <MaterialIcons name="account-balance-wallet" size={18} color={ACCENT_COLOR} />
          </View>
          <View style={styles.prizeInfo}>
            <Text style={[
              styles.prizeLabel,
              isCompleted && styles.completedPrizeLabel
            ]}>
              {isCompleted ? 'Prize Pool Was' : 'Prize Pool'}
            </Text>
            <Text style={[
              styles.prizeText,
              isCompleted && styles.completedPrizeText
            ]}>
              {game.ticket_type === "paid" && game.max_tickets 
                ? `₹${(ticketCost * game.max_tickets).toLocaleString()}`
                : "Exciting Prizes"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.joinButton,
            game.ticket_type === "paid" ? styles.paidButton : styles.freeButton,
            isPlaying && styles.playingJoinButton,
            isCompleted && styles.completedJoinButton
          ]}
          onPress={() => navigation.navigate("GameDetails", { game })}
        >
          <Text style={styles.joinButtonText}>
            {isCompleted 
              ? 'VIEW RESULTS' 
              : isPlaying 
                ? 'VIEW MY GAME' 
                : isLive
                  ? 'JOIN GAME' 
                  : 'VIEW DETAILS'}
          </Text>
          <Ionicons 
            name={isCompleted ? "trophy" : "arrow-forward"} 
            size={16} 
            color={WHITE} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const TabButton = ({ title, count, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.tabCount}>
          <Text style={styles.tabCountText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={ACCENT_COLOR} />
        <Text style={styles.loadingMoreText}>Loading more games...</Text>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons 
          name={
            activeTab === 'myGames' ? "game-controller-outline" : 
            activeTab === 'completed' ? "trophy-outline" : 
            "search-outline"
          } 
          size={50} 
          color={ACCENT_COLOR} 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'myGames' 
          ? 'No Games Found' 
          : activeTab === 'completed'
          ? 'No Completed Games'
          : 'No Games Available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No games found for "${searchQuery}"`
          : activeTab === 'myGames'
          ? "You haven't joined any games yet. Browse all games to get started!"
          : activeTab === 'completed'
          ? "No completed games available yet. Check back later!"
          : "Check back later for new exciting games!"}
      </Text>
      {searchQuery && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearFiltersButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'myGames' && !searchQuery && (
        <TouchableOpacity 
          style={styles.browseGamesButton}
          onPress={() => setActiveTab('allGames')}
        >
          <Text style={styles.browseGamesButtonText}>Browse All Games</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {activeTab === 'myGames' && (
          <>
            <Text style={styles.sectionTitle}>My Games</Text>
            <Text style={styles.gameCount}>{getFilteredGames().length} Game{getFilteredGames().length !== 1 ? 's' : ''}</Text>
          </>
        )}
        {activeTab === 'completed' && (
          <>
            <Text style={styles.sectionTitle}>Completed Games</Text>
            <Text style={styles.gameCount}>{getFilteredGames().length} Game{getFilteredGames().length !== 1 ? 's' : ''}</Text>
          </>
        )}
        {activeTab === 'allGames' && (
          <>
            <Text style={styles.sectionTitle}>All Games</Text>
            <Text style={styles.gameCount}>{getFilteredGames().length} Game{getFilteredGames().length !== 1 ? 's' : ''}</Text>
          </>
        )}
      </View>
    </View>
  );

  if (loading && games.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.backgroundPattern}>
          {/* Animated poker chips */}
          <Animated.View 
            style={[
              styles.pokerChip1, 
              { 
                transform: [
                  { translateY: translateY1 },
                  { translateX: translateY2 }
                ] 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.pokerChip2, 
              { 
                transform: [
                  { translateY: translateY2 },
                  { translateX: translateY1 }
                ] 
              }
            ]} 
          />
          
          {/* Animated shine effect */}
          <Animated.View 
            style={[
              styles.shineEffect,
              { 
                transform: [{ translateX: shineTranslateX }],
                opacity: shineAnim
              }
            ]} 
          />
          
          {/* Gold gradient overlay */}
          <View style={styles.goldGradient} />
        </View>
        
        <View style={styles.loadingAnimation}>
          <View style={styles.loadingIconWrapper}>
            <Ionicons name="game-controller" size={40} color={ACCENT_COLOR} />
          </View>
          <ActivityIndicator size="large" color={ACCENT_COLOR} style={styles.loadingSpinner} />
        </View>
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  const myGamesCount = games.filter(game => isUserPlayingGame(game.id)).length;
  const completedGamesCount = games.filter(game => game.status === 'completed').length;
  const allGamesCount = games.length;

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        {/* Animated poker chips */}
        <Animated.View 
          style={[
            styles.pokerChip1, 
            { 
              transform: [
                { translateY: translateY1 },
                { translateX: translateY2 }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.pokerChip2, 
            { 
              transform: [
                { translateY: translateY2 },
                { translateX: translateY1 }
              ] 
            }
          ]} 
        />
        
        {/* Animated shine effect */}
        <Animated.View 
          style={[
            styles.shineEffect,
            { 
              transform: [{ translateX: shineTranslateX }],
              opacity: shineAnim
            }
          ]} 
        />
        
        {/* Gold gradient overlay */}
        <View style={styles.goldGradient} />
        
        {/* Teal gradient overlay */}
        <View style={styles.tealGradient} />
      </View>

      <Animated.View 
        style={[
          styles.header,
          { 
            transform: [{ scale: pulseAnim }],
            backgroundColor: SECONDARY_COLOR
          }
        ]}
      >
        <View style={styles.headerPattern}>
          <Animated.View 
            style={[
              styles.headerShine,
              { transform: [{ translateX: shineTranslateX }] }
            ]} 
          />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>Tambola Games</Text>
              <Text style={styles.appTagline}>Play, Compete & Win Big</Text>
            </View>
            {myGamesCount > 0 && (
              <View style={styles.playingCountBadge}>
                <Ionicons name="checkmark-circle" size={14} color={ACCENT_COLOR} />
                <Text style={styles.playingCountText}>{myGamesCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <Feather name="search" size={20} color={MUTED_GOLD} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search games by name or ID..."
              placeholderTextColor={MUTED_GOLD}
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
                <Ionicons name="close-circle" size={20} color={MUTED_GOLD} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      <View style={styles.tabsContainer}>
        <TabButton
          title="My Games"
          count={myGamesCount}
          isActive={activeTab === 'myGames'}
          onPress={() => setActiveTab('myGames')}
        />
        <TabButton
          title="All Games"
          count={allGamesCount}
          isActive={activeTab === 'allGames'}
          onPress={() => setActiveTab('allGames')}
        />
        <TabButton
          title="Completed"
          count={completedGamesCount}
          isActive={activeTab === 'completed'}
          onPress={() => setActiveTab('completed')}
        />
      </View>

      <FlatList
        data={getFilteredGames()}
        renderItem={renderGameCard}
        keyExtractor={(item) => item.id.toString()}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLOR}
            colors={[ACCENT_COLOR]}
          />
        }
        onEndReached={loadMoreGames}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={renderHeader}
      />
    </View>
  );
};

export default Game;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: LIGHT_ACCENT,
    marginLeft: 10,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  // Poker chip animations
  pokerChip1: {
    position: 'absolute',
    top: 80,
    left: width * 0.1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  pokerChip2: {
    position: 'absolute',
    top: 120,
    right: width * 0.15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  // Shine effect
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  goldGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  tealGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0, 75, 84, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    position: 'relative',
  },
  loadingAnimation: {
    position: 'relative',
    marginBottom: 20,
  },
  loadingIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  loadingSpinner: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  loadingText: {
    fontSize: 16,
    color: LIGHT_ACCENT,
    fontWeight: "500",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  headerContent: {
    paddingHorizontal: 20,
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
    color: LIGHT_ACCENT,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  appTagline: {
    fontSize: 13,
    color: MUTED_GOLD,
    marginTop: 2,
    fontWeight: "500",
    opacity: 0.9,
  },
  playingCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playingCountText: {
    color: SECONDARY_COLOR,
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_TEAL,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: LIGHT_ACCENT,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: DARK_TEAL,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  tabButtonActive: {
    backgroundColor: ACCENT_COLOR,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: LIGHT_ACCENT,
  },
  tabButtonTextActive: {
    color: SECONDARY_COLOR,
  },
  tabCount: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabCountText: {
    color: LIGHT_ACCENT,
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 15,
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
    color: ACCENT_COLOR,
  },
  gameCount: {
    fontSize: 14,
    color: MUTED_GOLD,
    fontWeight: "500",
    opacity: 0.8,
  },
  gameCard: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playingGameCard: {
    backgroundColor: DARK_TEAL,
    borderColor: ACCENT_COLOR,
    borderWidth: 2,
  },
  completedGameCard: {
    backgroundColor: DARK_TEAL,
    borderColor: MUTED_GOLD,
    opacity: 0.95,
  },
  playingCardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  playingCardLabel: {
    backgroundColor: ACCENT_COLOR,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playingCardLabelText: {
    color: SECONDARY_COLOR,
    fontSize: 10,
    fontWeight: "700",
  },
  completedCardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  completedCardLabel: {
    backgroundColor: MUTED_GOLD,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedCardLabelText: {
    color: SECONDARY_COLOR,
    fontSize: 10,
    fontWeight: "700",
  },
  gameCardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  liveBadge: {
    backgroundColor: ACCENT_COLOR,
  },
  scheduledBadge: {
    backgroundColor: ACCENT_COLOR,
  },
  completedBadge: {
    backgroundColor: MUTED_GOLD,
  },
  defaultBadge: {
    backgroundColor: MUTED_GOLD,
  },
  statusText: {
    color: SECONDARY_COLOR,
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
    backgroundColor: DARK_TEAL,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    padding: 8,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  completedGameIconWrapper: {
    backgroundColor: DARK_TEAL,
    borderColor: MUTED_GOLD,
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
    color: LIGHT_ACCENT,
    marginBottom: 2,
  },
  completedGameName: {
    color: MUTED_GOLD,
  },
  gameId: {
    fontSize: 12,
    color: MUTED_GOLD,
    fontWeight: "500",
    opacity: 0.7,
  },
  completedGameId: {
    color: MUTED_GOLD,
    opacity: 0.7,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  playingBadgeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingBadgeText: {
    fontSize: 10,
    color: ACCENT_COLOR,
    fontWeight: "600",
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
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderColor: ACCENT_COLOR,
  },
  freeBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderColor: ACCENT_COLOR,
  },
  completedTypeBadge: {
    backgroundColor: "rgba(230, 216, 162, 0.1)",
    borderColor: MUTED_GOLD,
  },
  gameTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: ACCENT_COLOR,
  },
  completedTypeText: {
    color: MUTED_GOLD,
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
    backgroundColor: DARK_TEAL,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  completedDetailIcon: {
    backgroundColor: DARK_TEAL,
    borderColor: MUTED_GOLD,
  },
  detailLabel: {
    fontSize: 10,
    color: MUTED_GOLD,
    fontWeight: "500",
    marginBottom: 2,
    opacity: 0.7,
  },
  completedDetailLabel: {
    color: MUTED_GOLD,
  },
  detailText: {
    fontSize: 12,
    color: LIGHT_ACCENT,
    fontWeight: "600",
  },
  completedDetailText: {
    color: MUTED_GOLD,
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_TEAL,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  completedPrizeContainer: {
    backgroundColor: DARK_TEAL,
    borderColor: MUTED_GOLD,
  },
  prizeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  completedPrizeIcon: {
    backgroundColor: "rgba(230, 216, 162, 0.1)",
    borderColor: MUTED_GOLD,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 11,
    color: MUTED_GOLD,
    fontWeight: "500",
    marginBottom: 2,
    opacity: 0.7,
  },
  completedPrizeLabel: {
    color: MUTED_GOLD,
  },
  prizeText: {
    fontSize: 16,
    fontWeight: "700",
    color: LIGHT_ACCENT,
  },
  completedPrizeText: {
    color: MUTED_GOLD,
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paidButton: {
    backgroundColor: ACCENT_COLOR,
  },
  freeButton: {
    backgroundColor: ACCENT_COLOR,
  },
  playingJoinButton: {
    backgroundColor: ACCENT_COLOR,
  },
  completedJoinButton: {
    backgroundColor: MUTED_GOLD,
  },
  joinButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    overflow: 'hidden',
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT_COLOR,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: MUTED_GOLD,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.7,
  },
  clearFiltersButton: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  clearFiltersButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
  browseGamesButton: {
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  browseGamesButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
});