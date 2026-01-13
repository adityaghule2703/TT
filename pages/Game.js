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
  const [activeTab, setActiveTab] = useState('myGames'); // 'myGames' or 'allGames'
  
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // No filter needed as tabs handle separation
  }, [games, searchQuery, userGameData, activeTab]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGames(),
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

  const fetchGames = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        const gamesData = res.data.games.data || [];
        setGames(gamesData);
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

  const isUserPlayingGame = (gameId) => {
    // Check if user has tickets for this game
    const hasTickets = userGameData.myTickets.some(ticket => ticket.game_id == gameId);
    
    // Check if user has pending requests for this game
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

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(game =>
        game.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.game_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter based on active tab
    if (activeTab === 'myGames') {
      filtered = filtered.filter(game => isUserPlayingGame(game.id));
    }
    // For 'allGames' tab, show all games (already filtered by search)

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

  const renderGameCard = (game, index) => {
    const gameIcon = getGameIcon(index);
    const ticketCost = parseFloat(game.ticket_cost || 0);
    const ticketInfo = getUserTicketCount(game.id);
    const isPlaying = isUserPlayingGame(game.id);
    
    return (
      <TouchableOpacity
        key={game.id}
        style={[styles.gameCard, isPlaying && styles.playingGameCard]}
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

        <View style={styles.gameCardPattern} />
        
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
              {isPlaying && renderPlayingBadge(game)}
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
            game.ticket_type === "paid" ? styles.paidButton : styles.freeButton,
            isPlaying && styles.playingJoinButton
          ]}
          onPress={() => navigation.navigate("GameDetails", { game })}
        >
          <Text style={styles.joinButtonText}>
            {isPlaying 
              ? 'VIEW MY GAME' 
              : game.status === 'live' 
                ? 'JOIN GAME' 
                : 'VIEW DETAILS'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
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

  const myGamesCount = games.filter(game => isUserPlayingGame(game.id)).length;
  const filteredGames = getFilteredGames();

  return (
    <View style={styles.container}>
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
          {myGamesCount > 0 && (
            <View style={styles.playingCountBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#40E0D0" />
              <Text style={styles.playingCountText}>{myGamesCount}</Text>
            </View>
          )}
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

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TabButton
          title="My Games"
          count={myGamesCount}
          isActive={activeTab === 'myGames'}
          onPress={() => setActiveTab('myGames')}
        />
        <TabButton
          title="All Games"
          count={games.length}
          isActive={activeTab === 'allGames'}
          onPress={() => setActiveTab('allGames')}
        />
      </View>

      {/* GAMES LIST */}
      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.section}>
          {activeTab === 'myGames' && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Games</Text>
              <Text style={styles.gameCount}>{filteredGames.length} Game{filteredGames.length !== 1 ? 's' : ''}</Text>
            </View>
          )}

          {filteredGames.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons 
                  name={activeTab === 'myGames' ? "game-controller-outline" : "search-outline"} 
                  size={50} 
                  color="#40E0D0" 
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'myGames' 
                  ? 'No Games Found' 
                  : 'No Games Available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No games found for "${searchQuery}"`
                  : activeTab === 'myGames'
                  ? "You haven't joined any games yet. Browse all games to get started!"
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
          ) : (
            <View style={styles.gamesList}>
              {filteredGames.map((game, index) => renderGameCard(game, index))}
            </View>
          )}
        </View>

        {/* BOTTOM SPACE */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

export default Game;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: "#40E0D0",
    paddingTop: 20,
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
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 2,
    fontWeight: "500",
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
    color: '#40E0D0',
    fontSize: 12,
    fontWeight: '700',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F8F9FA',
  },
  tabButtonActive: {
    backgroundColor: '#40E0D0',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 15,
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
  playingGameCard: {
    backgroundColor: "#F0FFFF",
    borderColor: "#40E0D0",
    borderWidth: 2,
  },
  playingCardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  playingCardLabel: {
    backgroundColor: "#40E0D0",
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
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.2)',
  },
  playingBadgeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#40E0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingBadgeText: {
    fontSize: 10,
    color: "#40E0D0",
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
  playingJoinButton: {
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
    marginTop: 20,
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
    marginBottom: 10,
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
    borderColor: "#40E0D0",
  },
  browseGamesButtonText: {
    color: "#40E0D0",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 20,
  },
});