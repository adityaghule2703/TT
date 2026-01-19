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
          <Ionicons name="person-circle" size={12} color="#FFF" />
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
              <Ionicons name="checkmark-circle" size={12} color="#FFF" />
              <Text style={styles.playingCardLabelText}>You're Playing</Text>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedCardOverlay}>
            <View style={styles.completedCardLabel}>
              <Ionicons name="trophy" size={12} color="#FFF" />
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
            color="#FFF" 
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
                <MaterialIcons name="diamond" size={14} color="#F39C12" />
                <Text style={[
                  styles.gameTypeText,
                  isCompleted && styles.completedTypeText
                ]}>
                  ₹{ticketCost}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
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
                <Ionicons name="calendar" size={14} color="#4A90E2" />
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
                <Ionicons name="time" size={14} color="#4A90E2" />
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
                <Ionicons name="person" size={14} color="#4A90E2" />
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
                  <MaterialIcons name="confirmation-number" size={14} color="#4A90E2" />
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
                  <Ionicons name="trophy" size={14} color="#4A90E2" />
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
            <MaterialIcons name="account-balance-wallet" size={18} color="#4A90E2" />
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
            color="#FFF" 
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
        <ActivityIndicator size="small" color="#4A90E2" />
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
          color="#4A90E2" 
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
          <Animated.View 
            style={[
              styles.cloud1, 
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
              styles.cloud2, 
              { 
                transform: [
                  { translateY: translateY2 },
                  { translateX: translateY1 }
                ] 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.sun,
              { 
                transform: [{ rotate: rotate }],
                opacity: pulseAnim
              }
            ]} 
          />
        </View>
        
        <View style={styles.loadingAnimation}>
          <View style={styles.loadingIconWrapper}>
            <Ionicons name="game-controller" size={40} color="#4A90E2" />
          </View>
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loadingSpinner} />
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
        <Animated.View 
          style={[
            styles.cloud1, 
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
            styles.cloud2, 
            { 
              transform: [
                { translateY: translateY2 },
                { translateX: translateY1 }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.sun,
            { 
              transform: [{ rotate: rotate }],
              opacity: pulseAnim
            }
          ]} 
        />
        <View style={styles.skyGradient} />
        <View style={styles.mountain1} />
        <View style={styles.mountain2} />
      </View>

      <Animated.View 
        style={[
          styles.header,
          { 
            transform: [{ scale: pulseAnim }],
            backgroundColor: '#5DADE2'
          }
        ]}
      >
        <View style={styles.headerPattern}>
          <View style={styles.headerCloud1} />
          <View style={styles.headerCloud2} />
          <View style={styles.headerCloud3} />
          
          <Animated.View 
            style={[
              styles.sunRay1,
              { transform: [{ rotate: rotate }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.sunRay2,
              { transform: [{ rotate: rotate }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.sunRay3,
              { transform: [{ rotate: rotate }] }
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
                <Ionicons name="checkmark-circle" size={14} color="#4A90E2" />
                <Text style={styles.playingCountText}>{myGamesCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <Feather name="search" size={20} color="#666" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search games by name or ID..."
              placeholderTextColor="#999"
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
                <Ionicons name="close-circle" size={20} color="#666" />
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
            tintColor="#4A90E2"
            colors={['#4A90E2']}
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
    backgroundColor: "#F0F8FF",
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
    color: '#4682B4',
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
  cloud1: {
    position: 'absolute',
    top: 40,
    left: width * 0.1,
    width: 100,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cloud2: {
    position: 'absolute',
    top: 80,
    right: width * 0.15,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sun: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'linear-gradient(to bottom, rgba(135, 206, 235, 0.2), rgba(135, 206, 235, 0))',
  },
  mountain1: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    width: width + 100,
    height: 200,
    backgroundColor: '#4682B4',
    transform: [{ rotate: '5deg' }],
    opacity: 0.1,
  },
  mountain2: {
    position: 'absolute',
    bottom: 0,
    right: -50,
    width: width + 100,
    height: 150,
    backgroundColor: '#5DADE2',
    transform: [{ rotate: '-5deg' }],
    opacity: 0.08,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
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
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  loadingSpinner: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "#4682B4",
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
  },
  headerCloud1: {
    position: 'absolute',
    top: 20,
    left: 30,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCloud2: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 60,
    height: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerCloud3: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.4,
    width: 40,
    height: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sunRay1: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '0deg' }],
  },
  sunRay2: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '45deg' }],
  },
  sunRay3: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '90deg' }],
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
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  appTagline: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 2,
    fontWeight: "500",
    opacity: 0.9,
  },
  playingCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playingCountText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E8EAED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F0F8FF',
  },
  tabButtonActive: {
    backgroundColor: '#4A90E2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4682B4',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabCountText: {
    color: '#333',
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
    color: "#4682B4",
  },
  gameCount: {
    fontSize: 14,
    color: "#4682B4",
    fontWeight: "500",
    opacity: 0.8,
  },
  gameCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playingGameCard: {
    backgroundColor: "#E3F2FD",
    borderColor: "#4A90E2",
    borderWidth: 2,
  },
  completedGameCard: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
    opacity: 0.95,
  },
  playingCardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  playingCardLabel: {
    backgroundColor: "#4A90E2",
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playingCardLabelText: {
    color: "#FFF",
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
    backgroundColor: "#95A5A6",
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedCardLabelText: {
    color: "#FFF",
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
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
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
    backgroundColor: '#27AE60',
  },
  scheduledBadge: {
    backgroundColor: '#F39C12',
  },
  completedBadge: {
    backgroundColor: '#95A5A6',
  },
  defaultBadge: {
    backgroundColor: '#95A5A6',
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
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
    padding: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  completedGameIconWrapper: {
    backgroundColor: "#E9ECEF",
    borderColor: "#95A5A6",
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
    color: "#4682B4",
    marginBottom: 2,
  },
  completedGameName: {
    color: "#95A5A6",
  },
  gameId: {
    fontSize: 12,
    color: "#4682B4",
    fontWeight: "500",
    opacity: 0.7,
  },
  completedGameId: {
    color: "#95A5A6",
    opacity: 0.7,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  playingBadgeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingBadgeText: {
    fontSize: 10,
    color: "#4A90E2",
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
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    borderColor: "#F39C12",
  },
  freeBadge: {
    backgroundColor: "rgba(39, 174, 96, 0.1)",
    borderColor: "#27AE60",
  },
  completedTypeBadge: {
    backgroundColor: "rgba(149, 165, 166, 0.1)",
    borderColor: "#95A5A6",
  },
  gameTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4682B4",
  },
  completedTypeText: {
    color: "#95A5A6",
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
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  completedDetailIcon: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
  },
  detailLabel: {
    fontSize: 10,
    color: "#4682B4",
    fontWeight: "500",
    marginBottom: 2,
    opacity: 0.7,
  },
  completedDetailLabel: {
    color: "#95A5A6",
  },
  detailText: {
    fontSize: 12,
    color: "#4682B4",
    fontWeight: "600",
  },
  completedDetailText: {
    color: "#95A5A6",
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedPrizeContainer: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
  },
  prizeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  completedPrizeIcon: {
    backgroundColor: "rgba(149, 165, 166, 0.1)",
    borderColor: "#95A5A6",
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 11,
    color: "#4682B4",
    fontWeight: "500",
    marginBottom: 2,
    opacity: 0.7,
  },
  completedPrizeLabel: {
    color: "#95A5A6",
  },
  prizeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4682B4",
  },
  completedPrizeText: {
    color: "#95A5A6",
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  paidButton: {
    backgroundColor: "#4A90E2",
  },
  freeButton: {
    backgroundColor: "#4A90E2",
  },
  playingJoinButton: {
    backgroundColor: "#4A90E2",
  },
  completedJoinButton: {
    backgroundColor: "#95A5A6",
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
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4682B4",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#4682B4",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.7,
  },
  clearFiltersButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  clearFiltersButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  browseGamesButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  browseGamesButtonText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "700",
  },
});