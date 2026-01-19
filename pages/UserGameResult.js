import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Easing,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const UserGameResult = ({ route, navigation }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [myWinnings, setMyWinnings] = useState([]);
  const [allWinners, setAllWinners] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Animation values
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Color scheme matching UserGameRoom
  const PRIMARY_COLOR = "#4A90E2"; // Sky Blue
  const SUCCESS_COLOR = "#27AE60"; // Green
  const WARNING_COLOR = "#F39C12"; // Orange
  const DANGER_COLOR = "#E74C3C"; // Red
  const GRAY_COLOR = "#6C757D"; // Gray
  const LIGHT_GRAY = "#F8F9FA"; // Light gray
  const BORDER_COLOR = "#E9ECEF"; // Border color
  const BACKGROUND_COLOR = "#FFFFFF"; // White
  const SECONDARY_COLOR = "#5DADE2"; // Lighter Sky Blue
  const LIGHT_BLUE = "#F0F8FF"; // Alice Blue background

  // Game Icons
  const GAME_ICONS = {
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    stats: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    winner: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    money: "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
    users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    numbers: "https://cdn-icons-png.flaticon.com/512/3884/3884344.png",
    chart: "https://cdn-icons-png.flaticon.com/512/3094/3094707.png",
    medal: "https://cdn-icons-png.flaticon.com/512/808/808439.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/2821/2821812.png",
  };

  useEffect(() => {
    startAnimations();
    fetchGameResults();
  }, []);

  const startAnimations = () => {
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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const fetchGameResults = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/history/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.status) {
        const data = response.data.data;
        setGameData(data);
        
        // Set tickets
        if (data.my_tickets_complete_data) {
          setMyTickets(data.my_tickets_complete_data);
        }
        
        // Set my winnings
        if (data.my_participation?.winning_patterns) {
          setMyWinnings(data.my_participation.winning_patterns);
        }
        
        // Set all winners
        if (data.all_game_winners?.winners_list) {
          setAllWinners(data.all_game_winners.winners_list);
        }
        
        // Set game stats
        if (data.game_statistics) {
          setGameStats(data.game_statistics);
        }
        
        // Set called numbers
        if (data.number_calling_history?.called_numbers) {
          setCalledNumbers(data.number_calling_history.called_numbers);
        }
      }
    } catch (error) {
      console.log("Error fetching game results:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchGameResults().finally(() => setRefreshing(false));
  }, []);

  const renderBackgroundPatterns = () => (
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
      <View style={styles.skyGradient} />
    </View>
  );

  const renderHeaderPatterns = () => (
    <View style={styles.headerPattern}>
      <View style={styles.headerCloud1} />
      <View style={styles.headerCloud2} />
      
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
    </View>
  );

  const renderTicketGrid = (ticketData) => {
    const TICKET_WIDTH = width - 64;
    const CELL_SIZE = Math.max(24, Math.min((TICKET_WIDTH - 40) / 9, 28));
    
    const processTicketData = (data) => {
      if (!data || !Array.isArray(data)) return Array(3).fill(Array(9).fill(null));
      
      const processedGrid = Array(3).fill().map(() => Array(9).fill(null));
      
      data.forEach((row, rowIndex) => {
        row.forEach((cell) => {
          if (cell && cell.number !== null && cell.column !== undefined) {
            processedGrid[rowIndex][cell.column] = cell;
          }
        });
      });
      
      return processedGrid;
    };

    const processedData = processTicketData(ticketData);

    return (
      <View style={[styles.ticketGridContainer, { height: CELL_SIZE * 3 + 8 }]}>
        {processedData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cell, colIndex) => {
              const cellObj = cell;
              const cellNumber = cellObj?.number;
              const isMarked = cellObj?.is_marked || false;
              const isEmpty = cellNumber === null || cellNumber === undefined;
              
              let cellBackgroundColor;
              let cellBorderColor;
              let textColor;
              
              if (isEmpty) {
                cellBackgroundColor = "#F5F5F5";
                cellBorderColor = "#E0E0E0";
                textColor = "transparent";
              } else if (isMarked) {
                cellBackgroundColor = "#E74C3C";
                cellBorderColor = "#C0392B";
                textColor = "#FFFFFF";
              } else {
                cellBackgroundColor = "#FFF9C4";
                cellBorderColor = "#FFD600";
                textColor = "#2C3E50";
              }
              
              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.ticketCell,
                    { 
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cellBackgroundColor,
                      borderColor: cellBorderColor,
                    },
                    isEmpty ? styles.emptyCell : styles.filledCell,
                    isMarked && styles.markedCell,
                  ]}
                >
                  {!isEmpty && (
                    <Text style={[styles.cellNumber, { color: textColor }]}>
                      {cellNumber}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Game Stats - 2x2 Grid */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Game Statistics</Text>
          <Image source={{ uri: GAME_ICONS.stats }} style={styles.sectionIcon} />
        </View>
        
        {gameStats && (
          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameStats.participant_statistics?.total_participants || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Participants</Text>
                </View>
              </View>
              
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="ticket" size={16} color={SUCCESS_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameStats.ticket_statistics?.allocated_tickets || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Tickets Sold</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={16} color={WARNING_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameStats.winner_statistics?.total_winners || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Winners</Text>
                </View>
              </View>
              
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cash" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    ₹{gameStats.winner_statistics?.total_winnings_distributed || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Total Winnings</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* My Performance - 2x2 Grid */}
      {gameData?.my_participation && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Performance</Text>
            <Image source={{ uri: GAME_ICONS.medal }} style={styles.sectionIcon} />
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="ticket" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameData.my_participation.tickets_count || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>My Tickets</Text>
                </View>
              </View>
              
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-done" size={16} color={SUCCESS_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameData.my_participation.claims_summary?.approved_claims || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Approved</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cash" size={16} color={WARNING_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    ₹{gameData.my_participation.total_winnings || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>My Winnings</Text>
                </View>
              </View>
              
              <View style={styles.statCardSmall}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValueSmall}>
                    {gameData.my_participation.winning_patterns?.length || 0}
                  </Text>
                  <Text style={styles.statLabelSmall}>Patterns Won</Text>
                </View>
              </View>
            </View>
          </View>
          
          {gameData.my_participation.won_this_game && (
            <View style={styles.winnerBadge}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.winnerBadgeText}>YOU WON IN THIS GAME! 🎉</Text>
            </View>
          )}
        </View>
      )}

      {/* Number Calling Summary */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Number Calling Summary</Text>
          <Image source={{ uri: GAME_ICONS.numbers }} style={styles.sectionIcon} />
        </View>
        
        <View style={styles.numberSummary}>
          <View style={styles.numberSummaryItem}>
            <Text style={styles.numberSummaryValue}>{calledNumbers.length}</Text>
            <Text style={styles.numberSummaryLabel}>Numbers Called</Text>
          </View>
          
          <View style={styles.numberSummaryDivider} />
          
          <View style={styles.numberSummaryItem}>
            <Text style={styles.numberSummaryValue}>{90 - calledNumbers.length}</Text>
            <Text style={styles.numberSummaryLabel}>Numbers Left</Text>
          </View>
          
          <View style={styles.numberSummaryDivider} />
          
          <View style={styles.numberSummaryItem}>
            <Text style={styles.numberSummaryValue}>
              {calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : 'N/A'}
            </Text>
            <Text style={styles.numberSummaryLabel}>Last Number</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWinnersTab = () => (
    <View style={styles.tabContent}>
      {/* Top Winners */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Winners</Text>
          <Image source={{ uri: GAME_ICONS.winner }} style={styles.sectionIcon} />
        </View>
        
        {gameData?.all_game_winners?.top_winners && gameData.all_game_winners.top_winners.length > 0 ? (
          <View style={styles.winnersList}>
            {gameData.all_game_winners.top_winners.slice(0, 5).map((winner, index) => (
              <View key={index} style={[
                styles.winnerItem,
                winner.is_me && styles.myWinnerItem
              ]}>
                <View style={styles.winnerRank}>
                  <Text style={styles.winnerRankText}>#{index + 1}</Text>
                </View>
                
                <View style={styles.winnerInfo}>
                  <Text style={[
                    styles.winnerName,
                    winner.is_me && styles.myWinnerName
                  ]}>
                    {winner.winner_name}
                    {winner.is_me && " (You)"}
                  </Text>
                  <Text style={styles.winnerPattern}>{winner.pattern_name}</Text>
                </View>
                
                <View style={styles.winnerPrize}>
                  <Text style={styles.winnerPrizeAmount}>₹{winner.winning_amount}</Text>
                  {index === 0 && (
                    <Ionicons name="trophy" size={12} color="#FFD700" />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={30} color={GRAY_COLOR} />
            <Text style={styles.emptyStateText}>No winners data available</Text>
          </View>
        )}
      </View>

      {/* All Winners List */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Winners</Text>
          <Text style={styles.winnerCount}>
            {gameData?.all_game_winners?.total_winners || 0} Winners
          </Text>
        </View>
        
        {allWinners.length > 0 ? (
          <ScrollView style={styles.allWinnersList} showsVerticalScrollIndicator={false}>
            {allWinners.map((winner, index) => (
              <View key={index} style={[
                styles.allWinnerItem,
                winner.is_me && styles.myAllWinnerItem
              ]}>
                <View style={styles.allWinnerLeft}>
                  <View style={styles.allWinnerAvatar}>
                    <Text style={styles.allWinnerAvatarText}>
                      {winner.winner_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.allWinnerInfo}>
                    <Text style={[
                      styles.allWinnerName,
                      winner.is_me && styles.myAllWinnerName
                    ]}>
                      {winner.winner_name}
                      {winner.is_me && " (You)"}
                    </Text>
                    <Text style={styles.allWinnerPattern}>{winner.reward_name}</Text>
                  </View>
                </View>
                
                <View style={styles.allWinnerRight}>
                  <Text style={styles.allWinnerAmount}>₹{winner.winning_amount}</Text>
                  <Text style={styles.allWinnerTime}>
                    {new Date(winner.approved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color={GRAY_COLOR} />
            <Text style={styles.emptyStateText}>No winners found</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMyTicketsTab = () => (
    <View style={styles.tabContent}>
      {/* My Winnings Summary */}
      {myWinnings.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Winnings</Text>
            <View style={styles.winningsTotal}>
              <Text style={styles.winningsTotalText}>
                ₹{gameData?.my_participation?.total_winnings || 0}
              </Text>
            </View>
          </View>
          
          <View style={styles.myWinningsList}>
            {myWinnings.map((winning, index) => (
              <View key={index} style={styles.winningItem}>
                <View style={styles.winningIcon}>
                  <Ionicons name="trophy" size={18} color={WARNING_COLOR} />
                </View>
                <View style={styles.winningInfo}>
                  <Text style={styles.winningPattern}>{winning.reward_name}</Text>
                  <Text style={styles.winningTicket}>{winning.pattern_name}</Text>
                  <Text style={styles.winningTime}>
                    {new Date(winning.approved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <View style={styles.winningAmountContainer}>
                  <Text style={styles.winningAmount}>₹{winning.winning_amount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* My Tickets - Show like UserGameRoom */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Tickets</Text>
          <Text style={styles.ticketCount}>
            {myTickets.length} Ticket{myTickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {myTickets.length > 0 ? (
          <ScrollView style={styles.myTicketsList} showsVerticalScrollIndicator={false}>
            {myTickets.map((ticket, index) => (
              <View key={index} style={styles.ticketItem}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketNumberContainer}>
                    <Image source={{ uri: GAME_ICONS.ticket }} style={styles.ticketIcon} />
                    <Text style={styles.ticketNumber}>Ticket #{ticket.ticket_number}</Text>
                  </View>
                  <View style={[
                    styles.ticketStatus,
                    ticket.is_completed ? styles.ticketCompleted : styles.ticketIncomplete
                  ]}>
                    <Text style={styles.ticketStatusText}>
                      {ticket.is_completed ? 'FULL HOUSE' : `${ticket.progress_percentage}%`}
                    </Text>
                  </View>
                </View>
                
                {/* Ticket Grid */}
                {renderTicketGrid(ticket.ticket_data)}
                
                <View style={styles.ticketStats}>
                  <View style={styles.ticketStat}>
                    <Ionicons name="checkmark-circle" size={12} color={SUCCESS_COLOR} />
                    <Text style={styles.ticketStatText}>{ticket.marked_numbers_count} Marked</Text>
                  </View>
                  <View style={styles.ticketStat}>
                    <Ionicons name="close-circle" size={12} color={DANGER_COLOR} />
                    <Text style={styles.ticketStatText}>{ticket.unmarked_numbers?.length || 0} Left</Text>
                  </View>
                  {ticket.marked_numbers_count === 15 && (
                    <View style={styles.fullHouseBadge}>
                      <Ionicons name="trophy" size={12} color="#FFD700" />
                      <Text style={styles.fullHouseBadgeText}>FULL HOUSE</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={30} color={GRAY_COLOR} />
            <Text style={styles.emptyStateText}>No tickets found</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCalledNumbersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Called Numbers</Text>
          <Text style={styles.calledCount}>
            {calledNumbers.length}/90 Numbers
          </Text>
        </View>
        
        {calledNumbers.length > 0 ? (
          <View style={styles.numbersGridContainer}>
            {Array.from({ length: 9 }, (_, row) => (
              <View key={row} style={styles.numberRow}>
                {Array.from({ length: 10 }, (_, col) => {
                  const number = row * 10 + col + 1;
                  const isCalled = calledNumbers.includes(number);
                  const isLatest = calledNumbers.length > 0 && 
                    number === calledNumbers[calledNumbers.length - 1];
                  
                  return (
                    <View
                      key={number}
                      style={[
                        styles.numberCell,
                        isCalled && styles.calledNumberCell,
                        isLatest && styles.latestNumberCell,
                      ]}
                    >
                      <Text style={[
                        styles.numberCellText,
                        isCalled && styles.calledNumberText,
                        isLatest && styles.latestNumberText,
                      ]}>
                        {number}
                      </Text>
                      {isLatest && (
                        <View style={styles.latestIndicator}>
                          <Ionicons name="star" size={6} color="#FFF" />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="numbers-outline" size={30} color={GRAY_COLOR} />
            <Text style={styles.emptyStateText}>No numbers called</Text>
          </View>
        )}
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendNormal]} />
            <Text style={styles.legendText}>Not Called</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendCalled]} />
            <Text style={styles.legendText}>Called</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendLatest]} />
            <Text style={styles.legendText}>Latest</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading Game Results...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
      
      {renderBackgroundPatterns()}

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            transform: [{ scale: pulseAnim }],
            backgroundColor: PRIMARY_COLOR
          }
        ]}
      >
        {renderHeaderPatterns()}
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle}>Game Results</Text>
              <View style={styles.gameInfoContainer}>
                <Ionicons name="game-controller" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.gameName} numberOfLines={1}>
                  {gameName || "Tambola Game"}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchGameResults}
            >
              <Feather name="refresh-ccw" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Game Completion Banner */}
          <View style={styles.completionBanner}>
            <View style={styles.completionBannerContent}>
              <Image source={{ uri: GAME_ICONS.celebrate }} style={styles.celebrationIcon} />
              <View style={styles.completionTextContainer}>
                <Text style={styles.completionTitle}>Game Completed!</Text>
                <Text style={styles.completionSubtitle}>
                  All {calledNumbers.length} numbers have been called
                </Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === "overview" && styles.activeTab]}
                onPress={() => setSelectedTab("overview")}
              >
                <Ionicons 
                  name="stats-chart" 
                  size={14} 
                  color={selectedTab === "overview" ? "#FFF" : PRIMARY_COLOR} 
                />
                <Text style={[styles.tabText, selectedTab === "overview" && styles.activeTabText]}>
                  Overview
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, selectedTab === "winners" && styles.activeTab]}
                onPress={() => setSelectedTab("winners")}
              >
                <Ionicons 
                                  name="trophy" 
                size={14} 
                color={selectedTab === "winners" ? "#FFF" : PRIMARY_COLOR} 
              />
              <Text style={[styles.tabText, selectedTab === "winners" && styles.activeTabText]}>
                Winners
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === "mytickets" && styles.activeTab]}
              onPress={() => setSelectedTab("mytickets")}
            >
              <Ionicons 
                name="ticket" 
                size={14} 
                color={selectedTab === "mytickets" ? "#FFF" : PRIMARY_COLOR} 
              />
              <Text style={[styles.tabText, selectedTab === "mytickets" && styles.activeTabText]}>
                My Tickets
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === "numbers" && styles.activeTab]}
              onPress={() => setSelectedTab("numbers")}
            >
              <Ionicons 
                name="grid" 
                size={14} 
                color={selectedTab === "numbers" ? "#FFF" : PRIMARY_COLOR} 
              />
              <Text style={[styles.tabText, selectedTab === "numbers" && styles.activeTabText]}>
                Numbers
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {selectedTab === "overview" && renderOverviewTab()}
        {selectedTab === "winners" && renderWinnersTab()}
        {selectedTab === "mytickets" && renderMyTicketsTab()}
        {selectedTab === "numbers" && renderCalledNumbersTab()}

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
  },
  // Background Patterns
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
    width: 60,
    height: 25,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#4A90E2', // PRIMARY_COLOR
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cloud2: {
    position: 'absolute',
    top: 80,
    right: width * 0.15,
    width: 45,
    height: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#4A90E2', // PRIMARY_COLOR
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'linear-gradient(to bottom, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0))',
  },
  // Header Patterns
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerCloud1: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 45,
    height: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCloud2: {
    position: 'absolute',
    top: 35,
    right: 30,
    width: 30,
    height: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sunRay1: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 45,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '0deg' }],
  },
  sunRay2: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 45,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '45deg' }],
  },
  // Header
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  gameInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  gameName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    flex: 1,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    padding: 12,
  },
  // Completion Banner
  completionBanner: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  completionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  celebrationIcon: {
    width: 32,
    height: 32,
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A90E2', // PRIMARY_COLOR
    marginBottom: 2,
  },
  completionSubtitle: {
    fontSize: 11,
    color: '#6C757D', // GRAY_COLOR
  },
  // Tabs
  tabsContainer: {
    marginBottom: 12,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 5,
  },
  activeTab: {
    backgroundColor: '#4A90E2', // PRIMARY_COLOR
    borderColor: '#4A90E2', // PRIMARY_COLOR
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2', // PRIMARY_COLOR
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    shadowColor: '#4A90E2', // PRIMARY_COLOR
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: '#4A90E2', // PRIMARY_COLOR
  },
  sectionIcon: {
    width: 18,
    height: 18,
  },
  tabContent: {
    marginBottom: 12,
  },
  // Stats Grid (2x2 layout)
  statsGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCardSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statTextContainer: {
    flex: 1,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 2,
  },
  statLabelSmall: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
    fontWeight: '500',
  },
  // Number Summary
  numberSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  numberSummaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4A90E2', // PRIMARY_COLOR
    marginBottom: 2,
  },
  numberSummaryLabel: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
    fontWeight: '500',
  },
  numberSummaryDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#E9ECEF',
  },
  // Winner Badge
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 5,
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#212529',
  },
  // Winners List
  winnerCount: {
    fontSize: 12,
    color: '#4A90E2', // PRIMARY_COLOR
    fontWeight: '600',
  },
  winnersList: {
    gap: 8,
  },
  winnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  myWinnerItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  winnerRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  winnerRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A90E2', // PRIMARY_COLOR
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  myWinnerName: {
    color: '#4A90E2', // PRIMARY_COLOR
  },
  winnerPattern: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
  },
  winnerPrize: {
    alignItems: 'center',
  },
  winnerPrizeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F39C12', // WARNING_COLOR
    marginBottom: 2,
  },
  // All Winners List
  allWinnersList: {
    maxHeight: 250,
  },
  allWinnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  myAllWinnerItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    marginHorizontal: -6,
    paddingHorizontal: 6,
  },
  allWinnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  allWinnerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2', // PRIMARY_COLOR
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  allWinnerAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allWinnerInfo: {
    flex: 1,
  },
  allWinnerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  myAllWinnerName: {
    color: '#4A90E2', // PRIMARY_COLOR
  },
  allWinnerPattern: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
    marginBottom: 2,
  },
  allWinnerRight: {
    alignItems: 'flex-end',
  },
  allWinnerAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F39C12', // WARNING_COLOR
    marginBottom: 2,
  },
  allWinnerTime: {
    fontSize: 9,
    color: '#ADB5BD',
  },
  // My Winnings
  winningsTotal: {
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.2)',
  },
  winningsTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F39C12', // WARNING_COLOR
  },
  myWinningsList: {
    gap: 8,
  },
  winningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  winningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  winningInfo: {
    flex: 1,
  },
  winningPattern: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  winningTicket: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
    marginBottom: 2,
  },
  winningTime: {
    fontSize: 9,
    color: '#ADB5BD',
  },
  winningAmountContainer: {
    alignItems: 'center',
  },
  winningAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F39C12', // WARNING_COLOR
  },
  // My Tickets
  ticketCount: {
    fontSize: 12,
    color: '#4A90E2', // PRIMARY_COLOR
    fontWeight: '600',
  },
  myTicketsList: {
    maxHeight: 500,
  },
  ticketItem: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ticketIcon: {
    width: 18,
    height: 18,
  },
  ticketNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
  },
  ticketStatus: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ticketCompleted: {
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.2)',
  },
  ticketIncomplete: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#27AE60', // SUCCESS_COLOR
  },
  // Ticket Grid
  ticketGridContainer: {
    marginBottom: 8,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ticketCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  emptyCell: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  filledCell: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FFD600',
  },
  markedCell: {
    backgroundColor: '#E74C3C', // DANGER_COLOR
    borderColor: '#C0392B',
  },
  cellNumber: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ticketStatText: {
    fontSize: 10,
    color: '#6C757D', // GRAY_COLOR
  },
  fullHouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 3,
  },
  fullHouseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#212529',
  },
  // Called Numbers
  calledCount: {
    fontSize: 12,
    color: '#4A90E2', // PRIMARY_COLOR
    fontWeight: '600',
  },
  numbersGridContainer: {
    marginBottom: 12,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  numberCell: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 1,
    position: 'relative',
  },
  calledNumberCell: {
    backgroundColor: '#27AE60', // SUCCESS_COLOR
    borderColor: '#27AE60', // SUCCESS_COLOR
  },
  latestNumberCell: {
    backgroundColor: '#F39C12', // WARNING_COLOR
    borderColor: '#F39C12', // WARNING_COLOR
    borderWidth: 1.5,
  },
  numberCellText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C757D', // GRAY_COLOR
  },
  calledNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  latestNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  latestIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  legendNormal: {
    backgroundColor: '#F8F9FA',
  },
  legendCalled: {
    backgroundColor: '#27AE60', // SUCCESS_COLOR
  },
  legendLatest: {
    backgroundColor: '#F39C12', // WARNING_COLOR
  },
  legendText: {
    fontSize: 9,
    color: '#6C757D', // GRAY_COLOR
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#6C757D', // GRAY_COLOR
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  loadingText: {
    fontSize: 14,
    color: '#4A90E2', // PRIMARY_COLOR
    marginTop: 12,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 16,
  },
});

export default UserGameResult;