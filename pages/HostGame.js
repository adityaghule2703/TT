import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HostGame = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loadingGameDetails, setLoadingGameDetails] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/host/games",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const gamesData = response.data.games.data || [];
        setGames(gamesData);
        setFilteredGames(gamesData);
        setError(null);
      } else {
        throw new Error("Failed to fetch games");
      }
    } catch (error) {
      console.log("Error fetching games:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to load games"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    if (searchQuery.trim() === "") {
      setFilteredGames(games);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = games.filter(
      (game) =>
        game.game_name.toLowerCase().includes(query) ||
        game.game_code.toLowerCase().includes(query)
    );
    
    setFilteredGames(filtered);
  };

  const fetchGameDetails = async (gameId) => {
    try {
      setLoadingGameDetails(true);
      const token = await AsyncStorage.getItem("hostToken");

      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        return response.data.game;
      } else {
        throw new Error("Failed to fetch game details");
      }
    } catch (error) {
      console.log("Error fetching game details:", error);
      throw error;
    } finally {
      setLoadingGameDetails(false);
    }
  };

  const handleGameCardPress = async (game) => {
    try {
      setSelectedGame(game);
      setModalVisible(true);
      
      // Fetch fresh details
      const gameDetails = await fetchGameDetails(game.id);
      setSelectedGame(gameDetails);
    } catch (error) {
      console.log("Error loading game details:", error);
      // Keep showing the initial game data if details fetch fails
    }
  };

  const handleStartGame = async () => {
    if (!selectedGame) return;

    Alert.alert(
      "Start Game",
      `Are you sure you want to start "${selectedGame.game_name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Start Game",
          onPress: async () => {
            try {
              setStartingGame(true);
              const token = await AsyncStorage.getItem("hostToken");

              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/host/games/${selectedGame.id}/start`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success",
                  "Game started successfully!",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        setModalVisible(false);
                        navigation.navigate("HostGameRoom", {
                          gameId: selectedGame.id,
                          gameName: selectedGame.game_name,
                        });
                      }
                    }
                  ]
                );
                // Refresh games list
                fetchGames();
              } else {
                throw new Error("Failed to start game");
              }
            } catch (error) {
              console.log("Error starting game:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || error.message || "Failed to start game"
              );
            } finally {
              setStartingGame(false);
            }
          }
        }
      ]
    );
  };

  const handleEnterGameRoom = () => {
    if (!selectedGame) return;
    
    setModalVisible(false);
    navigation.navigate("HostGameRoom", {
      gameId: selectedGame.id,
      gameName: selectedGame.game_name,
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return "calendar-clock";
      case "active":
        return "play-circle";
      case "completed":
        return "check-circle";
      case "cancelled":
        return "cancel";
      case "live":
        return "broadcast";
      default:
        return "help-circle";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#FF9800";
      case "active":
        return "#4CAF50";
      case "completed":
        return "#9C27B0";
      case "cancelled":
        return "#F44336";
      case "live":
        return "#2196F3";
      default:
        return "#607D8B";
    }
  };

  const renderGameCard = (game) => {
    const gameDate = new Date(game.game_date);
    const formattedDate = gameDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const time = game.game_start_time.substring(0, 5);

    return (
      <TouchableOpacity
        key={game.id}
        style={styles.gameCard}
        onPress={() => handleGameCardPress(game)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.gameTitleContainer}>
            <MaterialCommunityIcons
              name={getStatusIcon(game.status)}
              size={22}
              color={getStatusColor(game.status)}
              style={styles.statusIcon}
            />
            <View style={styles.titleWrapper}>
              <Text style={styles.gameName} numberOfLines={1}>
                {game.game_name}
              </Text>
              <Text style={styles.gameCode}>#{game.game_code}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(game.status) + "15" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(game.status) },
              ]}
            >
              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{formattedDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{game.max_players} players</Text>
            </View>

            <View style={styles.detailItem}>
              {game.ticket_type === "paid" ? (
                <>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>₹{game.ticket_cost}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="gift-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>Free</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="ticket-outline" size={14} color="#666" />
            <Text style={styles.footerText}>{game.max_tickets} tickets</Text>
            {game.selected_patterns?.length > 0 && (
              <View style={styles.patternsInline}>
                <Ionicons name="layers-outline" size={14} color="#7E57C2" />
                <Text style={styles.patternsInlineText}>
                  {game.selected_patterns.length}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>
              {game.status === "live" ? "Enter Game" : "View Details"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const GameDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedGame && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <MaterialCommunityIcons
                      name={getStatusIcon(selectedGame.status)}
                      size={28}
                      color={getStatusColor(selectedGame.status)}
                    />
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedGame.game_name}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        #{selectedGame.game_code}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.statusBar,
                    {
                      backgroundColor:
                        getStatusColor(selectedGame.status) + "15",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBarText,
                      { color: getStatusColor(selectedGame.status) },
                    ]}
                  >
                    {selectedGame.status.charAt(0).toUpperCase() +
                      selectedGame.status.slice(1)}
                  </Text>
                </View>

                {loadingGameDetails ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.modalLoadingText}>
                      Loading game details...
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCard}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#3498db"
                        />
                        <Text style={styles.infoCardLabel}>Date</Text>
                        <Text style={styles.infoCardValue}>
                          {new Date(selectedGame.game_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </Text>
                      </View>

                      <View style={styles.infoCard}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#3498db"
                        />
                        <Text style={styles.infoCardLabel}>Time</Text>
                        <Text style={styles.infoCardValue}>
                          {selectedGame.game_start_time}
                        </Text>
                      </View>

                      <View style={styles.infoCard}>
                        <Ionicons
                          name="people-outline"
                          size={20}
                          color="#3498db"
                        />
                        <Text style={styles.infoCardLabel}>Players</Text>
                        <Text style={styles.infoCardValue}>
                          {selectedGame.max_players}
                        </Text>
                      </View>

                      <View style={styles.infoCard}>
                        {selectedGame.ticket_type === "paid" ? (
                          <>
                            <Ionicons
                              name="cash-outline"
                              size={20}
                              color="#3498db"
                            />
                            <Text style={styles.infoCardLabel}>Cost</Text>
                            <Text style={styles.infoCardValue}>
                              ₹{selectedGame.ticket_cost}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="gift-outline"
                              size={20}
                              color="#3498db"
                            />
                            <Text style={styles.infoCardLabel}>Type</Text>
                            <Text style={styles.infoCardValue}>Free</Text>
                          </>
                        )}
                      </View>
                    </View>

                    <View style={styles.detailsSection}>
                      <View style={styles.detailRowModal}>
                        <Ionicons name="ticket-outline" size={18} color="#666" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>
                            Tickets Available
                          </Text>
                          <Text style={styles.detailValue}>
                            {selectedGame.max_tickets}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRowModal}>
                        <Ionicons name="trophy-outline" size={18} color="#666" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Max Winners</Text>
                          <Text style={styles.detailValue}>
                            {selectedGame.max_winners}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {selectedGame.message && (
                      <View style={styles.messageCard}>
                        <View style={styles.messageHeader}>
                          <Ionicons
                            name="chatbubble-outline"
                            size={18}
                            color="#3498db"
                          />
                          <Text style={styles.messageTitle}>Host Message</Text>
                        </View>
                        <Text style={styles.messageText}>
                          {selectedGame.message}
                        </Text>
                      </View>
                    )}

                    {selectedGame.selected_patterns?.length > 0 && (
                      <View style={styles.patternsSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons
                            name="layers-outline"
                            size={20}
                            color="#7E57C2"
                          />
                          <Text style={styles.sectionTitle}>Game Patterns</Text>
                        </View>

                        <View style={styles.patternsCount}>
                          <Text style={styles.patternsCountText}>
                            {selectedGame.selected_patterns.length} pattern
                            {selectedGame.selected_patterns.length > 1 ? "s" : ""}{" "}
                            selected
                          </Text>
                        </View>

                        {selectedGame.pattern_rewards?.map((reward, index) => (
                          <View key={index} style={styles.rewardCard}>
                            <View style={styles.rewardHeader}>
                              <View style={styles.rewardNameContainer}>
                                <Ionicons
                                  name="ribbon-outline"
                                  size={16}
                                  color="#4CAF50"
                                />
                                <Text style={styles.rewardName}>
                                  {reward.reward_name}
                                </Text>
                              </View>
                              <View style={styles.rewardAmountContainer}>
                                <Text style={styles.rewardAmount}>
                                  ₹{reward.amount}
                                </Text>
                                <Text style={styles.rewardCount}>
                                  ×{reward.reward_count}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.rewardDescription}>
                              {reward.description}
                            </Text>
                            <View style={styles.rewardMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons
                                  name="ticket-outline"
                                  size={12}
                                  color="#666"
                                />
                                <Text style={styles.metaText}>
                                  Min {reward.min_tickets_required} tickets
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.modalBottomSpace} />
                  </ScrollView>
                )}

                <View style={styles.modalActions}>
                  {/* Conditional Buttons */}
                  {selectedGame.status === "live" ? (
                    <TouchableOpacity
                      style={styles.enterGameButton}
                      onPress={handleEnterGameRoom}
                    >
                      <Ionicons name="game-controller" size={18} color="#FFF" />
                      <Text style={styles.enterGameButtonText}>
                        Enter Game Room
                      </Text>
                    </TouchableOpacity>
                  ) : (selectedGame.status === "scheduled" || selectedGame.status === "active") ? (
                    <TouchableOpacity
                      style={[
                        styles.startGameButton,
                        startingGame && styles.startGameButtonDisabled
                      ]}
                      onPress={handleStartGame}
                      disabled={startingGame}
                    >
                      {startingGame ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="play-circle" size={18} color="#FFF" />
                          <Text style={styles.startGameButtonText}>
                            Start Game
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.ticketRequestsButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate("HostTicketRequests", {
                        gameId: selectedGame.id,
                        gameName: selectedGame.game_name,
                      });
                    }}
                  >
                    <Ionicons name="ticket-outline" size={18} color="#FFF" />
                    <Text style={styles.ticketRequestsButtonText}>
                      Ticket Requests
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playersListButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate("HostGameUsers", {
                        gameId: selectedGame.id,
                        gameName: selectedGame.game_name,
                      });
                    }}
                  >
                    <Ionicons name="people-outline" size={18} color="#FFF" />
                    <Text style={styles.playersListButtonText}>
                      Players List
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.secondaryActionText}>Close</Text>
                    </TouchableOpacity>
                    
                    {selectedGame.status !== "live" && (
                      <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.navigate("HostGameEdit", {
                            game: selectedGame,
                          });
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color="#FFF" />
                        <Text style={styles.primaryActionText}>Edit Game</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={80} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Games</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchGames}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tambola Games</Text>
          <Text style={styles.headerSubtitle}>
            {filteredGames.length} {filteredGames.length === 1 ? "game" : "games"} shown
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchGames}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search games by name or code..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.fabPrimary}
        onPress={() => navigation.navigate("HostGameCreation")}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3498db"
            colors={["#3498db"]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredGames.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <Ionicons name="calendar-outline" size={24} color="#3498db" />
              <Text style={styles.statsCount}>{filteredGames.length}</Text>
              <Text style={styles.statsLabel}>Total Games</Text>
            </View>

            <View style={styles.statsCard}>
              <Ionicons name="play-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.statsCount}>
                {filteredGames.filter((g) => g.status === "active" || g.status === "live").length}
              </Text>
              <Text style={styles.statsLabel}>Active/Live</Text>
            </View>

            <View style={styles.statsCard}>
              <Ionicons name="time-outline" size={24} color="#FF9800" />
              <Text style={styles.statsCount}>
                {filteredGames.filter((g) => g.status === "scheduled").length}
              </Text>
              <Text style={styles.statsLabel}>Scheduled</Text>
            </View>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Games</Text>
          <TouchableOpacity
            style={styles.patternsButton}
            onPress={() => navigation.navigate("HostGamePatterns")}
          >
            <Ionicons name="grid-outline" size={16} color="#3498db" />
            <Text style={styles.patternsButtonText}>Patterns</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gamesContainer}>
          {filteredGames.length > 0 ? (
            <>
              {filteredGames.map(renderGameCard)}
              <View style={styles.listFooter}>
                <Ionicons name="checkmark-done" size={18} color="#9CA3AF" />
                <Text style={styles.listFooterText}>
                  {searchQuery ? `Found ${filteredGames.length} games` : "All games loaded"}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons
                  name={searchQuery ? "search-outline" : "game-controller-outline"}
                  size={80}
                  color="#D1D5DB"
                />
                <View style={styles.emptyDot} />
                <View style={[styles.emptyDot, styles.emptyDot2]} />
                <View style={[styles.emptyDot, styles.emptyDot3]} />
              </View>
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? "No Games Found" : "No Games Yet"}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? `No games found matching "${searchQuery}"`
                  : "Create your first tambola game and start hosting exciting matches"
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  if (searchQuery) {
                    setSearchQuery("");
                  } else {
                    navigation.navigate("HostGameCreation");
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={searchQuery ? "refresh" : "add-circle"} 
                  size={18} 
                  color="#FFF" 
                />
                <Text style={styles.emptyStateButtonText}>
                  {searchQuery ? "Clear Search" : "Create First Game"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <GameDetailModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#3498db",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  headerActions: {
    position: "absolute",
    right: 20,
    top: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Simple Search Box
  searchContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  fabPrimary: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  patternsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  patternsButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3498db",
  },
  gameCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  gameTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  gameCode: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
  },
  patternsInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  patternsInlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7E57C2",
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: 24,
  },
  emptyDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  emptyDot2: {
    top: 10,
    right: 10,
  },
  emptyDot3: {
    bottom: 10,
    left: 10,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  listFooterText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusBarText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalLoadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    width: (width * 0.9 - 48 - 12) / 2,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 8,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
    textAlign: "center",
  },
  detailsSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  detailRowModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  messageCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E40AF",
  },
  messageText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    fontStyle: "italic",
  },
  patternsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  patternsCount: {
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  patternsCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7E57C2",
    textAlign: "center",
  },
  rewardCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rewardNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  rewardAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
  },
  rewardCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  rewardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  startGameButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startGameButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  startGameButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  enterGameButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enterGameButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  ticketRequestsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9C27B0",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketRequestsButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  playersListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playersListButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  primaryAction: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBottomSpace: {
    height: 20,
  },
  gamesContainer: {
    marginBottom: 40,
  },
});

export default HostGame;