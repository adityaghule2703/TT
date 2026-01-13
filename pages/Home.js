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
} from "react-native";
import axios from "axios";
import { FontAwesome, Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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

  useEffect(() => {
    fetchNotifications();
    fetchSliders();
    fetchGames();
    fetchPatterns();
  }, []);

  useEffect(() => {
    if (sliders.length > 1) {
      const interval = setInterval(() => {
        if (activeSlide < sliders.length - 1) {
          setActiveSlide(activeSlide + 1);
        } else {
          setActiveSlide(0);
        }
        
        if (sliderRef.current) {
          sliderRef.current.scrollToIndex({
            index: activeSlide < sliders.length - 1 ? activeSlide + 1 : 0,
            animated: true
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeSlide, sliders.length]);

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
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/sliders"
      );
      if (res.data.success) {
        setSliders(res.data.data);
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
        return '#3498db';
      case 'count_based':
        return '#FF9800';
      case 'all_numbers':
        return '#4CAF50';
      case 'row_complete':
        return '#9C27B0';
      case 'number_based':
        return '#F44336';
      case 'number_range':
        return '#607D8B';
      default:
        return '#40E0D0';
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
        <View style={[styles.patternIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={[styles.patternText, { color: color }]} numberOfLines={1}>
          {pattern.display_name || formatPatternName(pattern.pattern_name)}
        </Text>
        <Text style={styles.patternDescription} numberOfLines={1}>
          {pattern.description || 'Tap to view details'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSliderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.slideContainer}
      activeOpacity={0.9}
      onPress={() => console.log("Slider clicked:", item.id)}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.sliderImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.floor(contentOffset / slideSize);
    
    if (currentIndex !== activeSlide) {
      setActiveSlide(currentIndex);
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
              <Ionicons name="game-controller" size={24} color="#40E0D0" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName} numberOfLines={1}>{game.game_name || "Game"}</Text>
              <Text style={styles.gameId}>ID: {game.game_code || "N/A"}</Text>
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
                  {game.game_date_formatted || game.game_date || "N/A"}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={14} color="#40E0D0" />
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
          ]}
          onPress={() => handleGamePress(game)}
        >
          <Text style={styles.joinButtonText}>
            {game.status === 'live' ? 'JOIN GAME' : 'VIEW DETAILS'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
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
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.appName}>Tambola Timez</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search rooms, games or players..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="filter" size={18} color="#40E0D0" />
          </TouchableOpacity>
        </View>
      </View>

      {loadingSliders ? (
        <View style={styles.sliderLoadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
        </View>
      ) : sliders.length > 0 ? (
        <View style={styles.sliderWrapper}>
          <FlatList
            ref={sliderRef}
            data={sliders}
            renderItem={renderSliderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => ({
              length: width - 40,
              offset: (width - 40) * index,
              index,
            })}
          />
          {renderPagination()}
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
                <Ionicons name="arrow-forward" size={16} color="#40E0D0" />
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Patterns</Text>
        <TouchableOpacity onPress={handleAllPatternsPress}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loadingPatterns ? (
        <View style={styles.patternsLoadingContainer}>
          <ActivityIndicator size="small" color="#40E0D0" />
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Games</Text>
        <TouchableOpacity onPress={handleAllGamesPress}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loadingGames ? (
        <View style={styles.gamesLoadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : games.length > 0 ? (
        <View style={styles.gamesContainer}>
          {games.slice(0, 3).map((game, index) => renderGameCard(game, index))}
        </View>
      ) : (
        <View style={styles.noGamesContainer}>
          <Ionicons name="game-controller-outline" size={50} color="#E0F2F1" />
          <Text style={styles.noGamesText}>No games available at the moment</Text>
          <TouchableOpacity 
            style={styles.refreshGamesBtn}
            onPress={handleAllGamesPress}
          >
            <Text style={styles.refreshGamesText}>Browse Games</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Winners</Text>
        <TouchableOpacity onPress={handleViewAllWinners}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.winnersContainer}>
        {[
          { id: 1, name: "Amit", prize: "Won Full House 🏆", time: "2 min ago", color: "#40E0D0" },
          { id: 2, name: "Neha", prize: "Won Early 5 🎉", time: "5 min ago", color: "#0D9488" },
          { id: 3, name: "Rahul", prize: "Won Corners ✨", time: "10 min ago", color: "#14B8A6" },
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

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why Play With Us?</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#40E0D0" />
            <Text style={styles.infoText}>Fast & Fair Games</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#40E0D0" />
            <Text style={styles.infoText}>Real Players</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#40E0D0" />
            <Text style={styles.infoText}>24x7 Rooms Available</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#40E0D0" />
            <Text style={styles.infoText}>Safe & Fun Experience</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpace} />

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
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
                    <View style={styles.notificationIcon}>
                      <Ionicons name="notifications" size={20} color="#40E0D0" />
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
                    <Ionicons name="notifications-off" size={50} color="#E0F2F1" />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FDFA",
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#40E0D0",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFF",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#40E0D0",
  },
  badgeText: {
    color: "#40E0D0",
    fontSize: 10,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8EAED",
    width: "100%",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#333",
  },
  filterButton: {
    padding: 8,
  },
  sliderWrapper: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
    position: "relative",
    backgroundColor: "#F0FDFA",
  },
  sliderLoadingContainer: {
    height: 180,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: "#0D9488",
    justifyContent: "center",
    alignItems: "center",
  },
  slideContainer: {
    width: width - 40,
    height: 180,
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  paginationContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#40E0D0",
    width: 20,
  },
  paginationDotInactive: {
    backgroundColor: "rgba(64, 224, 208, 0.5)",
  },
  bannerCard: {
    backgroundColor: "#0D9488",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  bannerSubTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
  },
  getStartedBtn: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
    gap: 8,
  },
  getStartedText: {
    color: "#40E0D0",
    fontWeight: "700",
    fontSize: 14,
  },
  bannerImage: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
  },
  seeAll: {
    fontSize: 14,
    color: "#40E0D0",
    fontWeight: "600",
  },
  patternsLoadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: "#0D9488",
    fontSize: 14,
  },
  noPatternsContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPatternsText: {
    color: '#0D9488',
    fontSize: 14,
    marginBottom: 8,
  },
  retryText: {
    color: '#40E0D0',
    fontSize: 14,
    fontWeight: '600',
  },
  patternContainer: {
    paddingHorizontal: 15,
  },
  patternCard: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 90,
  },
  patternIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  patternText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  patternDescription: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
    opacity: 0.8,
  },
  gamesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gamesLoadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noGamesContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
  },
  noGamesText: {
    marginTop: 10,
    color: "#0D9488",
    fontSize: 14,
    textAlign: "center",
  },
  refreshGamesBtn: {
    marginTop: 15,
    backgroundColor: "#40E0D0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshGamesText: {
    color: "#FFF",
    fontWeight: "600",
  },
  gameCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
    position: 'relative',
    overflow: 'hidden',
  },
  playingGameCard: {
    backgroundColor: "#F0FFFF",
    borderColor: "#40E0D0",
    borderWidth: 2,
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
  winnersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  winnerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
  },
  winnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  winnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  winnerInitial: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  winnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D9488",
    marginBottom: 2,
  },
  winnerPrize: {
    fontSize: 13,
    color: "#14B8A6",
  },
  winnerTime: {
    fontSize: 12,
    color: "#0D9488",
    opacity: 0.7,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#0D9488",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
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
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(64, 224, 208, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0D9488",
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(64, 224, 208, 0.1)",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0D9488",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#14B8A6",
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: "#0D9488",
    opacity: 0.7,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#0D9488",
    opacity: 0.7,
    marginTop: 10,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  closeBtn: {
    backgroundColor: "#40E0D0",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Home;