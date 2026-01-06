import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Image,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const TICKET_WIDTH = width - 40;
const CELL_SIZE = (TICKET_WIDTH - 60) / 9;

const UserGameWinners = ({ navigation, route }) => {
  const { gameId, gameName, gameData, calledNumbers } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [winnersData, setWinnersData] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const GAME_IMAGES = {
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    winner: "https://cdn-icons-png.flaticon.com/512/3290/3290402.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    confetti: "https://cdn-icons-png.flaticon.com/512/2821/2821812.png",
    money: "https://cdn-icons-png.flaticon.com/512/3135/3135710.png",
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/claims/game/${gameId}/winners`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setWinnersData(response.data.data);
        // Select first pattern by default
        if (response.data.data.pattern_winners && response.data.data.pattern_winners.length > 0) {
          setSelectedPattern(response.data.data.pattern_winners[0]);
        }
      }
    } catch (error) {
      console.log("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWinners();
    setRefreshing(false);
  };

  const handleViewTicket = (winner) => {
    setSelectedTicket(winner);
    setShowTicketModal(true);
  };

 const renderTicketGrid = (ticketData) => {
  // ticketData is already a 2D array (3x9) from the API
  if (!ticketData || !Array.isArray(ticketData)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ticket data not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.ticketGridContainer}>
      <View style={styles.columnNumbers}>
        {Array.from({ length: 9 }).map((_, colIndex) => (
          <View key={`col-${colIndex}`} style={styles.columnNumberCell}>
            <Text style={styles.columnNumberText}>{colIndex + 1}</Text>
          </View>
        ))}
      </View>

      {ticketData.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.ticketRow}>
          {row.map((cell, colIndex) => {
            const cellNumber = cell?.number;
            const isMarked = cell?.is_marked || false;
            const isEmpty = cellNumber === null || cellNumber === undefined;
            
            let cellBackgroundColor;
            if (isEmpty) {
              cellBackgroundColor = "#CCCCCC"; // Gray for empty cells
            } else if (isMarked) {
              cellBackgroundColor = "#FF5252"; // Red for marked numbers
            } else {
              cellBackgroundColor = "#80CBC4"; // Turquoise for numbers
            }
            
            return (
              <View
                key={`cell-${rowIndex}-${colIndex}`}
                style={[
                  styles.ticketCell,
                  { backgroundColor: cellBackgroundColor },
                  isEmpty && styles.emptyCell,
                  isMarked && styles.markedCell,
                ]}
              >
                {!isEmpty && (
                  <View style={styles.cellContent}>
                    <Text style={[
                      styles.cellNumber,
                      { color: "#FFFFFF" },
                    ]}>
                      {cellNumber}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

  const formatPatternName = (patternName) => {
    return patternName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderPatternTabs = () => {
    if (!winnersData?.pattern_winners?.length) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.patternTabsContainer}
      >
        {winnersData.pattern_winners.map((pattern) => (
          <TouchableOpacity
            key={pattern.game_pattern_id}
            style={[
              styles.patternTab,
              selectedPattern?.game_pattern_id === pattern.game_pattern_id && styles.patternTabActive
            ]}
            onPress={() => setSelectedPattern(pattern)}
          >
            <View style={[
              styles.patternTabIcon,
              selectedPattern?.game_pattern_id === pattern.game_pattern_id && styles.patternTabIconActive
            ]}>
              <Ionicons 
                name="trophy" 
                size={16} 
                color={selectedPattern?.game_pattern_id === pattern.game_pattern_id ? "#FFF" : "#FF6B35"} 
              />
            </View>
            <Text style={[
              styles.patternTabName,
              selectedPattern?.game_pattern_id === pattern.game_pattern_id && styles.patternTabNameActive
            ]}>
              {formatPatternName(pattern.pattern_name)}
            </Text>
            <View style={styles.patternBadge}>
              <Text style={styles.patternBadgeText}>
                {pattern.winner_count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderWinnersList = () => {
    if (!winnersData?.winners || !selectedPattern) return null;

    const filteredWinners = winnersData.winners.filter(
      winner => winner.game_pattern_id === selectedPattern.game_pattern_id
    );

    if (filteredWinners.length === 0) {
      return (
        <View style={styles.noWinnersContainer}>
          <Image
            source={{ uri: GAME_IMAGES.empty }}
            style={styles.noWinnersImage}
          />
          <Text style={styles.noWinnersTitle}>No Winners Yet</Text>
          <Text style={styles.noWinnersSubtitle}>
            No winners found for {formatPatternName(selectedPattern.pattern_name)} pattern
          </Text>
        </View>
      );
    }

    return filteredWinners.map((winner, index) => (
      <View key={winner.id} style={styles.winnerCard}>
        <View style={styles.cardPattern} />
        
        <View style={styles.winnerCardHeader}>
          <View style={styles.winnerInfo}>
            <View style={styles.winnerRank}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.winnerRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.winnerDetails}>
              <Text style={styles.winnerName} numberOfLines={1}>
                {winner.user_name}
              </Text>
              <Text style={styles.winnerUsername}>@{winner.username}</Text>
            </View>
          </View>
          
          <View style={styles.winnerPrize}>
            <View style={styles.prizeAmountContainer}>
              <Image
                source={{ uri: GAME_IMAGES.money }}
                style={styles.moneyIcon}
              />
              <Text style={styles.prizeAmount} numberOfLines={1}>
                {formatAmount(winner.winning_amount)}
              </Text>
            </View>
            <Text style={styles.prizeLabel} numberOfLines={1}>
              {winner.reward_name}
            </Text>
          </View>
        </View>

        <View style={styles.winnerTicketInfo}>
          <View style={styles.ticketNumberBadge}>
            <Ionicons name="ticket" size={14} color="#40E0D0" />
            <Text style={styles.ticketNumberText}>Ticket #{winner.ticket_number}</Text>
          </View>
          <View style={styles.winTimeBadge}>
            <Ionicons name="time" size={14} color="#FF6B35" />
            <Text style={styles.winTimeText}>{winner.time_since_approval}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewTicketButton}
          onPress={() => handleViewTicket(winner)}
        >
          <Ionicons name="eye" size={16} color="#FFF" />
          <Text style={styles.viewTicketButtonText}>View Winning Ticket</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderStats = () => {
    if (!winnersData) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
            <Ionicons name="trophy" size={24} color="#FF6B35" />
          </View>
          <Text style={styles.statValue}>{winnersData.total_winners}</Text>
          <Text style={styles.statLabel}>Total Winners</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(64, 224, 208, 0.1)' }]}>
            <Image
              source={{ uri: GAME_IMAGES.money }}
              style={{ width: 24, height: 24 }}
            />
          </View>
          <Text style={styles.statValue} numberOfLines={1}>
            {formatAmount(winnersData.total_winnings)}
          </Text>
          <Text style={styles.statLabel}>Total Winnings</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
            <Ionicons name="layers" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>
            {winnersData.pattern_winners?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Patterns Won</Text>
        </View>
      </View>
    );
  };

  // Function to count total numbers in ticket
  const countTotalNumbers = (ticketData) => {
    if (!ticketData || !Array.isArray(ticketData)) return 0;
    let count = 0;
    for (let row of ticketData) {
      for (let cell of row) {
        if (cell?.number !== null && cell?.number !== undefined) {
          count++;
        }
      }
    }
    return count;
  };

  // Function to count marked numbers in ticket
  const countMarkedNumbers = (ticketData) => {
    if (!ticketData || !Array.isArray(ticketData)) return 0;
    let count = 0;
    for (let row of ticketData) {
      for (let cell of row) {
        if (cell?.is_marked) {
          count++;
        }
      }
    }
    return count;
  };

  // Function to count called numbers in ticket
  const countCalledNumbers = (ticketData) => {
    if (!ticketData || !Array.isArray(ticketData) || !calledNumbers) return 0;
    let count = 0;
    for (let row of ticketData) {
      for (let cell of row) {
        if (cell?.number !== null && cell?.number !== undefined && calledNumbers.includes(cell.number)) {
          count++;
        }
      }
    }
    return count;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Winners...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Ticket Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTicketModal}
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Winning Ticket</Text>
              <TouchableOpacity
                onPress={() => setShowTicketModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            {selectedTicket && (
              <>
                <View style={styles.modalTicketInfo}>
                  <View style={styles.modalUserInfo}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedTicket.user_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.modalUserDetails}>
                      <Text style={styles.modalUserName} numberOfLines={1}>
                        {selectedTicket.user_name}
                      </Text>
                      <Text style={styles.modalUserUsername} numberOfLines={1}>
                        @{selectedTicket.username}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalPrizeInfo}>
                    <Text style={styles.modalPrizeAmount} numberOfLines={1}>
                      {formatAmount(selectedTicket.winning_amount)}
                    </Text>
                    <Text style={styles.modalPrizeName} numberOfLines={2}>
                      {selectedTicket.reward_name}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalTicketPreview}>
                  <View style={styles.modalTicketHeader}>
                    <Text style={styles.modalTicketNumber}>
                      Ticket #{selectedTicket.ticket_number}
                    </Text>
                    <Text style={styles.modalPatternName}>
                      {formatPatternName(selectedTicket.pattern_name)}
                    </Text>
                  </View>
                  
                  {selectedTicket.ticket_data && renderTicketGrid(selectedTicket.ticket_data)}
                  
                  <View style={styles.modalTicketStats}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {countTotalNumbers(selectedTicket.ticket_data)}
                      </Text>
                      <Text style={styles.modalStatLabel}>Total Numbers</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {countMarkedNumbers(selectedTicket.ticket_data)}
                      </Text>
                      <Text style={styles.modalStatLabel}>Marked</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {countCalledNumbers(selectedTicket.ticket_data)}
                      </Text>
                      <Text style={styles.modalStatLabel}>Called</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <Text style={styles.modalWinTime}>
                    Won {selectedTicket.time_since_approval}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setShowTicketModal(false)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#40E0D0" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.gameName} numberOfLines={1}>
              {gameName}
            </Text>
            <View style={styles.gameCodeContainer}>
              <Ionicons name="trophy" size={16} color="#6C757D" />
              <Text style={styles.gameCode}>Winners</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#40E0D0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Patterns */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.confettiContainer}>
            <Image
              source={{ uri: GAME_IMAGES.confetti }}
              style={styles.confettiImage}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Game Winners Banner */}
          <View style={styles.winnersBanner}>
            <View style={styles.bannerContent}>
              <Image
                source={{ uri: GAME_IMAGES.trophy }}
                style={styles.bannerTrophy}
              />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Game Winners</Text>
                <Text style={styles.bannerSubtitle}>
                  Celebrating our champions and their winning tickets
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          {renderStats()}

          {/* Pattern Tabs */}
          {renderPatternTabs()}

          {/* Winners List */}
          <View style={styles.winnersSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#40E0D0" />
              <Text style={styles.sectionTitle}>Winners List</Text>
              {selectedPattern && (
                <View style={styles.patternInfoBadge}>
                  <Text style={styles.patternInfoText} numberOfLines={1}>
                    {formatPatternName(selectedPattern.pattern_name)} • {formatAmount(selectedPattern.total_amount)}
                  </Text>
                </View>
              )}
            </View>

            {renderWinnersList()}
          </View>

          {/* Current User Status */}
          {winnersData?.current_user && (
            <View style={styles.userStatusCard}>
              <View style={styles.userStatusHeader}>
                <Ionicons 
                  name={winnersData.current_user.is_winner ? "checkmark-circle" : "information-circle"} 
                  size={24} 
                  color={winnersData.current_user.is_winner ? "#4CAF50" : "#FF6B35"} 
                />
                <Text style={[
                  styles.userStatusTitle,
                  { color: winnersData.current_user.is_winner ? "#4CAF50" : "#FF6B35" }
                ]}>
                  {winnersData.current_user.is_winner ? "Congratulations! You're a Winner!" : "Your Status"}
                </Text>
              </View>
              
              {winnersData.current_user.is_winner ? (
                <View style={styles.userWinsList}>
                  {winnersData.current_user.user_wins.map((win, index) => (
                    <View key={index} style={styles.userWinItem}>
                      <Ionicons name="trophy" size={16} color="#FFD700" />
                      <Text style={styles.userWinText}>
                        Won {formatAmount(win.winning_amount)} for {win.pattern_name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.userStatusText}>
                  You didn't win this game. Better luck next time!
                </Text>
              )}
            </View>
          )}

          {/* Game Info */}
          <View style={styles.gameInfoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#40E0D0" />
              <Text style={styles.sectionTitle}>Game Information</Text>
            </View>
            
            <View style={styles.gameInfoGrid}>
              <View style={styles.gameInfoItem}>
                <Ionicons name="game-controller" size={16} color="#6C757D" />
                <Text style={styles.gameInfoLabel}>Game Status</Text>
                <Text style={styles.gameInfoValue}>Completed</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Ionicons name="numbers" size={16} color="#6C757D" />
                <Text style={styles.gameInfoLabel}>Numbers Called</Text>
                <Text style={styles.gameInfoValue}>{calledNumbers?.length || 0}/90</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Ionicons name="calendar" size={16} color="#6C757D" />
                <Text style={styles.gameInfoLabel}>Ended</Text>
                <Text style={styles.gameInfoValue}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backToGameButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={16} color="#FFF" />
            <Text style={styles.backToGameButtonText}>Back to Game Room</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  confettiContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.3,
  },
  confettiImage: {
    width: 200,
    height: 200,
  },
  // Header Styles
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    flex: 1,
  },
  gameName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF6B35",
    letterSpacing: -0.5,
  },
  gameCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  gameCode: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  // Winners Banner - Fixed white text transparency
  winnersBanner: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerTrophy: {
    width: 60,
    height: 60,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.95,
  },
  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#212529",
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "600",
    textAlign: 'center',
  },
  // Pattern Tabs
  patternTabsContainer: {
    marginBottom: 20,
  },
  patternTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 140,
  },
  patternTabActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  patternTabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  patternTabIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternTabName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    flex: 1,
  },
  patternTabNameActive: {
    color: '#FFFFFF',
  },
  patternBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Winners Section
  winnersSection: {
    marginBottom: 20,
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
    color: "#212529",
    flex: 1,
  },
  patternInfoBadge: {
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 1,
  },
  patternInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#40E0D0',
  },
  // Winner Card
  winnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderBottomLeftRadius: 60,
    borderTopRightRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
  },
  winnerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  winnerRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerRankText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6B35',
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 2,
  },
  winnerUsername: {
    fontSize: 12,
    color: '#6C757D',
  },
  winnerPrize: {
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '45%',
    minWidth: 120,
  },
  prizeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  moneyIcon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4CAF50',
    flexShrink: 1,
  },
  prizeLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
  },
  winnerTicketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  ticketNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ticketNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#40E0D0',
  },
  winTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  winTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  viewTicketButton: {
    backgroundColor: "#40E0D0",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#40E0D0',
  },
  viewTicketButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // No Winners
  noWinnersContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  noWinnersImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  noWinnersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  noWinnersSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // User Status Card
  userStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  userStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  userStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  userWinsList: {
    gap: 8,
  },
  userWinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  userWinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  userStatusText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Game Info Card
  gameInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  gameInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  gameInfoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    marginBottom: 2,
  },
  gameInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  // Back Button
  backToGameButton: {
    backgroundColor: "#FF6B35",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  backToGameButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 20,
  },
  // Ticket Grid Styles
  ticketGridContainer: {
    alignItems: "center",
  },
  columnNumbers: {
    flexDirection: "row",
    marginBottom: 2,
  },
  columnNumberCell: {
    width: CELL_SIZE,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  columnNumberText: {
    fontSize: 10,
    color: "#6C757D",
    fontWeight: "600",
  },
  ticketRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  ticketCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#FFFFFF",
    position: 'relative',
  },
  emptyCell: {
    backgroundColor: "#CCCCCC",
  },
  markedCell: {
    backgroundColor: "#FF5252",
    borderColor: "#FF5252",
  },
  cellContent: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  calledIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calledIndicatorText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Modal Styles - Fixed layout issues
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalTicketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#40E0D0',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 2,
  },
  modalUserUsername: {
    fontSize: 14,
    color: '#6C757D',
  },
  modalPrizeInfo: {
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '50%',
  },
  modalPrizeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4CAF50',
    marginBottom: 2,
    textAlign: 'right',
  },
  modalPrizeName: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
    lineHeight: 16,
  },
  modalTicketPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modalTicketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  modalTicketNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginRight: 8,
    marginBottom: 4,
  },
  modalPatternName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 1,
  },
  modalTicketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 2,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  modalFooter: {
    alignItems: 'center',
  },
  modalWinTime: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  // Error container
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UserGameWinners;