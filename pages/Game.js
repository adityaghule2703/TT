import React, { useEffect, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

// Animated game-related icons from CDN (similar to FAQ example)
const GAME_ICONS = [
  "https://cdn-icons-png.flaticon.com/512/2331/2331966.png", // Game controller
  "https://cdn-icons-png.flaticon.com/512/808/808439.png",   // Dice
  "https://cdn-icons-png.flaticon.com/512/869/869869.png",   // Ticket
  "https://cdn-icons-png.flaticon.com/512/1086/1086741.png", // Trophy
  "https://cdn-icons-png.flaticon.com/512/2921/2921222.png", // Celebration
  "https://cdn-icons-png.flaticon.com/512/3094/3094707.png", // Bingo ball
  "https://cdn-icons-png.flaticon.com/512/3048/3048394.png", // Clock
  "https://cdn-icons-png.flaticon.com/512/3126/3126640.png", // Friends playing
];

const Game = ({ navigation }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalGames: 0,
    freeGames: 0,
    premiumGames: 0,
    totalPlayers: 0,
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchGames().finally(() => setRefreshing(false));
  }, []);

  const fetchGames = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games/available",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const gamesData = res.data.games.data;
        setGames(gamesData);
        
        // Calculate stats
        const freeGames = gamesData.filter(g => g.ticket_type === "free").length;
        const premiumGames = gamesData.filter(g => g.ticket_type === "paid").length;
        const totalPlayers = gamesData.reduce((acc, game) => acc + game.max_players, 0);
        
        setStats({
          totalGames: gamesData.length,
          freeGames,
          premiumGames,
          totalPlayers,
        });
      }
    } catch (error) {
      console.log(error);
      alert("Failed to load games!");
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (index) => {
    return GAME_ICONS[index % GAME_ICONS.length];
  };

  const renderGameCard = (game, index) => {
    const gameIcon = getGameIcon(index);
    
    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("GameDetails", { game })}
      >
        {/* Game Icon and Type */}
        <View style={styles.cardHeader}>
          <View style={styles.gameIconContainer}>
            <Image source={{ uri: gameIcon }} style={styles.gameIcon} />
            <View>
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
                <Ionicons name="diamond" size={14} color="#FFD700" />
                <Text style={styles.gameTypeText}>₹{game.ticket_cost}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.gameTypeText}>FREE</Text>
              </>
            )}
          </View>
        </View>

        {/* Game Details */}
        <View style={styles.gameDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color="#FF7675" />
              <Text style={styles.detailText}>
                {new Date(game.game_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#FF7675" />
              <Text style={styles.detailText}>{game.game_start_time}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color="#2196F3" />
              <Text style={styles.detailText}>{game.max_players} Players</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="emoji-events" size={16} color="#FFB300" />
              <Text style={styles.detailText}>{game.max_winners} Winners</Text>
            </View>
          </View>
        </View>

        {/* Prize Pool */}
        <View style={styles.prizeContainer}>
          <MaterialIcons name="account-balance-wallet" size={18} color="#7209B7" />
          <Text style={styles.prizeText}>
            Prize Pool: {game.ticket_type === "paid" 
              ? `₹${game.ticket_cost * game.max_players}`
              : "Exciting Prizes"}
          </Text>
        </View>

        {/* Join Button */}
        <TouchableOpacity 
          style={[
            styles.joinButton,
            game.ticket_type === "paid" ? styles.paidButton : styles.freeButton
          ]}
          onPress={() => navigation.navigate("GameDetails", { game })}
        >
          <Text style={styles.joinButtonText}>
            {game.ticket_type === "paid" ? "Join Premium Game" : "Join Free Game"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const CategoryItem = ({ icon, title, count, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.categoryItem, isActive && styles.categoryItemActive]}
      onPress={onPress}
    >
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryIcon}>{icon}</Text>
        {count > 0 && (
          <View style={styles.categoryCount}>
            <Text style={styles.categoryCountText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.categoryTitle, isActive && styles.categoryTitleActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingAnimation}>
          <Image 
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3300/3300023.png" }}
            style={styles.loadingIcon}
          />
          <ActivityIndicator size="large" color="#FF7675" style={styles.loadingSpinner} />
        </View>
        <Text style={styles.loadingText}>Loading exciting games...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF7675"
          colors={['#FF7675']}
        />
      }
    >
      {/* Header with Animated Icon */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎯 Tambola Live</Text>
          <Text style={styles.headerSubtitle}>
            Join live games, win real prizes, and experience the thrill of Tambola!
          </Text>
        </View>
        <View style={styles.headerIconWrapper}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/2331/2331966.png" }}
            style={styles.headerIcon}
          />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE6E6' }]}>
            <FontAwesome5 name="fire" size={18} color="#FF7675" />
          </View>
          <Text style={styles.statNumber}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Live Games</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E6F7E9' }]}>
            <MaterialIcons name="emoji-events" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>{stats.totalPlayers}</Text>
          <Text style={styles.statLabel}>Total Players</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFF0E6' }]}>
            <Ionicons name="diamond" size={18} color="#FFA726" />
          </View>
          <Text style={styles.statNumber}>{stats.premiumGames}</Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
      </View>

      {/* Improved Categories Section */}
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <CategoryItem
            icon="🎯"
            title="All Games"
            count={stats.totalGames}
            isActive={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          
          <CategoryItem
            icon="🎁"
            title="Free Games"
            count={stats.freeGames}
            isActive={selectedCategory === 'free'}
            onPress={() => setSelectedCategory('free')}
          />
          
          <CategoryItem
            icon="👑"
            title="Premium"
            count={stats.premiumGames}
            isActive={selectedCategory === 'premium'}
            onPress={() => setSelectedCategory('premium')}
          />
          
          <CategoryItem
            icon="⚡"
            title="Starting Soon"
            count={games.filter(g => {
              const gameTime = new Date(`${g.game_date} ${g.game_start_time}`);
              const now = new Date();
              const diffHours = (gameTime - now) / (1000 * 60 * 60);
              return diffHours > 0 && diffHours < 2;
            }).length}
            isActive={selectedCategory === 'soon'}
            onPress={() => setSelectedCategory('soon')}
          />
          
          <CategoryItem
            icon="💰"
            title="High Prize"
            count={games.filter(g => g.ticket_type === "paid" && g.ticket_cost >= 100).length}
            isActive={selectedCategory === 'high'}
            onPress={() => setSelectedCategory('high')}
          />
          
          <CategoryItem
            icon="👥"
            title="Popular"
            count={games.filter(g => g.max_players > 50).length}
            isActive={selectedCategory === 'popular'}
            onPress={() => setSelectedCategory('popular')}
          />
        </ScrollView>
      </View>

      {/* Games List */}
      <View style={styles.gamesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Games</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={18} color="#FF7675" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {games.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png" }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Games Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for new exciting games!
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.refreshButtonText}>Refresh Games</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gamesList}>
            {games.map((game, index) => renderGameCard(game, index))}
          </View>
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default Game;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F8FA",
  },
  loadingAnimation: {
    position: 'relative',
    marginBottom: 20,
  },
  loadingIcon: {
    width: 70,
    height: 70,
    opacity: 0.7,
  },
  loadingSpinner: {
    position: 'absolute',
    top: 5,
    left: 5,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#FF7675",
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    lineHeight: 20,
  },
  headerIconWrapper: {
    marginLeft: 15,
  },
  headerIcon: {
    width: 70,
    height: 70,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginTop: -15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF7675",
    fontWeight: "600",
  },
  categoriesList: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  categoryItem: {
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#E8EAF6",
    minWidth: 85,
  },
  categoryItemActive: {
    backgroundColor: "#FF7675",
    borderColor: "#FF7675",
  },
  categoryIconContainer: {
    position: "relative",
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryCount: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF7675",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCountText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  categoryTitleActive: {
    color: "#FFF",
  },
  gamesSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8EAF6",
    gap: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  gamesList: {
    gap: 15,
  },
  gameCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  gameIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  gameIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    padding: 10,
  },
  gameName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    marginBottom: 2,
  },
  gameId: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  gameTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginLeft: 10,
  },
  paidBadge: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  freeBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  gameTypeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  gameDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    gap: 8,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  paidButton: {
    backgroundColor: "#FF7675",
  },
  freeButton: {
    backgroundColor: "#4CAF50",
  },
  joinButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    marginBottom: 15,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
  },
  refreshButton: {
    backgroundColor: "#FF7675",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  refreshButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 30,
  },
});