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
  Modal,
  Animated,
  Easing,
  Vibration,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Snackbar } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// EXACT SAME parameters from TicketsScreen
const NUM_COLUMNS = 9;
const CELL_MARGIN = 2;
const TICKET_PADDING = 8;
const HORIZONTAL_MARGIN = 10;

// EXACT SAME calculation from TicketsScreen
const CELL_WIDTH = 
  (SCREEN_WIDTH - 
   HORIZONTAL_MARGIN * 2 - 
   TICKET_PADDING * 2 - 
   CELL_MARGIN * 2 * NUM_COLUMNS) / 
  NUM_COLUMNS;

// Color scheme matching TicketsScreen
const ROW_COLOR_1 = "#004B54"; // Dark teal for even rows
const ROW_COLOR_2 = "#00343A"; // Darker teal for odd rows
const FILLED_CELL_BG = "#D4AF37"; // Gold for filled cells
const CELL_BORDER_COLOR = "#D4AF37"; // Gold border
const NUMBER_COLOR = "#00343A"; // Dark teal for numbers

const PRIMARY_COLOR = "#005F6A"; // Main background color
const SECONDARY_COLOR = "#004B54"; // Dark teal
const ACCENT_COLOR = "#D4AF37"; // Gold
const LIGHT_ACCENT = "#F5E6A8"; // Light gold
const MUTED_GOLD = "#E6D8A2"; // Muted gold for text
const DARK_TEAL = "#00343A"; // Darker teal
const LIGHT_TEAL = "#006B78"; // Light teal
const SUCCESS_GREEN = "#27AE60";
const ERROR_RED = "#E74C3C";
const WARNING_ORANGE = "#F39C12";

// Cell colors for different states
const EMPTY_CELL_BG = "transparent";
const MARKED_CELL_BG = "#E74C3C";
const MARKED_CELL_BORDER = "#C0392B";

const UserGameRoom = ({ navigation, route }) => {
  const { gameId, gameName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [callingStatus, setCallingStatus] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [markingLoading, setMarkingLoading] = useState(false);
  const [voiceType, setVoiceType] = useState('female');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [claims, setClaims] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('info');
  const [initialClaimsFetched, setInitialClaimsFetched] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [patternRewards, setPatternRewards] = useState([]);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [showWinningCelebration, setShowWinningCelebration] = useState(false);
  const [winningMessage, setWinningMessage] = useState('');
  const [winningUser, setWinningUser] = useState('');
  const [winningAmount, setWinningAmount] = useState(0);
  const [winningPattern, setWinningPattern] = useState('');
  
  const [patternsByTicket, setPatternsByTicket] = useState({});
  const [totalPatternCounts, setTotalPatternCounts] = useState({});
  const [processingCells, setProcessingCells] = useState(new Set());
  
  const [showPatternsModal, setShowPatternsModal] = useState(false);
  const [availablePatterns, setAvailablePatterns] = useState([]);
  const [menuPatterns, setMenuPatterns] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [selectedPatternForView, setSelectedPatternForView] = useState(null);
  
  const [blinkingPattern, setBlinkingPattern] = useState(null);
  const [blinkingCells, setBlinkingCells] = useState({});
  const [blinkingAnimations, setBlinkingAnimations] = useState({});
  
  const [clickSound, setClickSound] = useState(null);
  
  const lastCalledRef = useRef(null);
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const claimsRef = useRef([]);
  const menuRefs = useRef([]);
  const lastApprovedClaimRef = useRef(null);
  const audioEnabled = useRef(true);
  const blinkingIntervals = useRef({});
  const blinkingTimeouts = useRef({});
  const gameEndShownRef = useRef(false);
  const announcedClaimIds = useRef(new Set());
  const isSubmittingClaimRef = useRef(false);

  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const celebrationTranslateY = useRef(new Animated.Value(50)).current;
  const confettiTranslateY = useRef([]);

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  const GAME_IMAGES = {
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    live: "https://cdn-icons-png.flaticon.com/512/2809/2809645.png",
    users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    megaphone: "https://cdn-icons-png.flaticon.com/512/2599/2599562.png",
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    voice: "https://cdn-icons-png.flaticon.com/512/727/727240.png",
    confetti: "https://cdn-icons-png.flaticon.com/512/2821/2821812.png",
    numbers: "https://cdn-icons-png.flaticon.com/512/3884/3884344.png",
    claim: "https://cdn-icons-png.flaticon.com/512/1006/1006581.png",
    firework: "https://cdn-icons-png.flaticon.com/512/599/599499.png",
    star: "https://cdn-icons-png.flaticon.com/512/1828/1828970.png",
  };

  useEffect(() => {
    confettiTranslateY.current = Array(15).fill().map(() => new Animated.Value(-50));
    startAnimations();
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
    outputRange: [-100, SCREEN_WIDTH + 100]
  });

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/click.mp3')
      );
      setClickSound(sound);
    } catch (error) {
      console.log("Error loading sounds:", error);
    }
  };

  const playClickSound = async () => {
    try {
      if (clickSound) {
        await clickSound.setPositionAsync(0);
        await clickSound.playAsync();
      } else {
        if (Platform.OS !== 'web') {
          Vibration.vibrate(50);
        }
      }
    } catch (error) {
      console.log("Error playing sound:", error);
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
    }
  };

  useEffect(() => {
    return () => {
      Object.values(blinkingIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      Object.values(blinkingTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      if (clickSound) {
        clickSound.unloadAsync();
      }
      announcedClaimIds.current.clear();
      Speech.stop();
    };
  }, []);

  const stopAllBlinking = () => {
    Object.values(blinkingIntervals.current).forEach(item => {
      if (item && item.animation && item.animation.stop) {
        item.animation.stop();
      }
    });
    
    Object.values(blinkingTimeouts.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    
    blinkingIntervals.current = {};
    blinkingTimeouts.current = {};
    setBlinkingCells({});
    setBlinkingAnimations({});
    setSelectedPatternForView(null);
    setBlinkingPattern(null);
  };

  const startBlinkingForAllTickets = (pattern, duration = 5000) => {
    stopAllBlinking();
    
    const allBlinkingCells = {};
    const allAnimations = {};
    
    myTickets.forEach(ticket => {
      const patternCells = getPatternCells(ticket, pattern);
      if (patternCells.length > 0) {
        allBlinkingCells[ticket.id] = patternCells;
        
        const animValue = new Animated.Value(0);
        allAnimations[ticket.id] = animValue;
      }
    });
    
    setBlinkingCells(allBlinkingCells);
    setBlinkingAnimations(allAnimations);
    setBlinkingPattern(pattern);
    
    Object.keys(allAnimations).forEach(ticketId => {
      const animValue = allAnimations[ticketId];
      
      const startBlink = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
          ]),
          { iterations: -1 }
        ).start();
      };
      
      blinkingIntervals.current[ticketId] = {
        animation: startBlink,
        start: () => startBlink()
      };
      
      startBlink();
    });

    blinkingTimeouts.current.global = setTimeout(() => {
      stopAllBlinking();
    }, duration);
  };

  const getPatternCells = (ticket, pattern) => {
    const processedData = processTicketData(ticket.ticket_data);
    const cells = [];
    
    switch(pattern.pattern_name) {
      case 'bamboo':
        for (let row = 0; row < 3; row++) {
          const nonEmptyCells = [];
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null) {
              nonEmptyCells.push({ row, col, cell });
            }
          }
          if (nonEmptyCells.length >= 3) {
            cells.push({ row: nonEmptyCells[2].row, col: nonEmptyCells[2].col });
          }
        }
        break;
        
      case 'bottom_line':
        for (let col = 0; col < 9; col++) {
          const cell = processedData[2][col];
          if (cell && cell.number !== null) {
            cells.push({ row: 2, col });
          }
        }
        break;
        
      case 'breakfast':
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null && cell.number >= 1 && cell.number <= 30) {
              cells.push({ row, col });
            }
          }
        }
        break;
        
      case 'dinner':
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null && cell.number >= 61 && cell.number <= 90) {
              cells.push({ row, col });
            }
          }
        }
        break;
        
      case 'early_five':
        const ticketNumbers = [];
        const ticketNumberPositions = {};
        
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null) {
              ticketNumbers.push(cell.number);
              ticketNumberPositions[cell.number] = { row, col };
            }
          }
        }
        
        let foundCount = 0;
        for (const calledNumber of calledNumbers) {
          if (ticketNumberPositions[calledNumber] && foundCount < 5) {
            const position = ticketNumberPositions[calledNumber];
            cells.push({ row: position.row, col: position.col });
            foundCount++;
          }
          if (foundCount >= 5) break;
        }
        break;
        
      case 'four_corners':
        const firstRowCells = [];
        for (let col = 0; col < 9; col++) {
          const cell = processedData[0][col];
          if (cell && cell.number !== null) {
            firstRowCells.push({ row: 0, col, cell });
          }
        }
        if (firstRowCells.length > 0) {
          cells.push({ row: 0, col: firstRowCells[0].col });
          cells.push({ row: 0, col: firstRowCells[firstRowCells.length - 1].col });
        }
        
        const lastRowCells = [];
        for (let col = 0; col < 9; col++) {
          const cell = processedData[2][col];
          if (cell && cell.number !== null) {
            lastRowCells.push({ row: 2, col, cell });
          }
        }
        if (lastRowCells.length > 0) {
          cells.push({ row: 2, col: lastRowCells[0].col });
          cells.push({ row: 2, col: lastRowCells[lastRowCells.length - 1].col });
        }
        break;
        
      case 'full_house':
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null) {
              cells.push({ row, col });
            }
          }
        }
        break;
        
      case 'lunch':
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 9; col++) {
            const cell = processedData[row][col];
            if (cell && cell.number !== null && cell.number >= 31 && cell.number <= 60) {
              cells.push({ row, col });
            }
          }
        }
        break;
        
      case 'middle_line':
        for (let col = 0; col < 9; col++) {
          const cell = processedData[1][col];
          if (cell && cell.number !== null) {
            cells.push({ row: 1, col });
          }
        }
        break;
        
      case 'top_line':
        for (let col = 0; col < 9; col++) {
          const cell = processedData[0][col];
          if (cell && cell.number !== null) {
            cells.push({ row: 0, col });
          }
        }
        break;
        
      default:
        break;
    }
    
    return cells;
  };

  const getPatternDescription = (patternName) => {
    const descriptions = {
      'full_house': 'Mark all numbers on your ticket',
      'early_five': 'First 5 numbers called on your ticket',
      'top_line': 'All numbers in the top row',
      'middle_line': 'All numbers in the middle row',
      'bottom_line': 'All numbers in the bottom row',
      'four_corners': 'Four corner numbers of your ticket',
      'bamboo': 'Third number in each row',
      'breakfast': 'Numbers 1-30',
      'lunch': 'Numbers 31-60',
      'dinner': 'Numbers 61-90',
    };
    
    return descriptions[patternName] || 'Complete this pattern to win prize';
  };

  const fetchPatternRewardCounts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/game/${gameId}/reward-counts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.status) {
        return response.data.data.patterns || [];
      }
      return [];
    } catch (error) {
      console.log("Error fetching pattern reward counts:", error);
      showSnackbar("Failed to load pattern counts", 'error');
      return [];
    }
  };

  const fetchAllPatternsForViewing = async () => {
    try {
      setLoadingPatterns(true);
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/patterns/available",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.status) {
        const patterns = response.data.data.patterns || [];
        
        const transformedPatterns = patterns.map(pattern => ({
          ...pattern,
          display_name: pattern.pattern_name.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        }));
        
        setAvailablePatterns(transformedPatterns);
      }
    } catch (error) {
      console.log("Error fetching patterns for viewing:", error);
      showSnackbar("Failed to load patterns", 'error');
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleViewPatterns = (ticketId) => {
    setSelectedTicket(ticketId);
    setShowPatternsModal(true);
    
    fetchAllPatternsForViewing();
  };

  const handlePatternSelect = (pattern) => {
    setSelectedPatternForView(pattern);
    setBlinkingPattern(pattern);
    setShowPatternsModal(false);
    
    showSnackbar(`Showing ${pattern.display_name} pattern on all tickets`, 'info');
    
    setTimeout(() => {
      startBlinkingForAllTickets(pattern, 5000);
    }, 300);
  };
  
  const checkGameCompletion = () => {
    const isNumbersCompleted = calledNumbers.length >= 90;
    const isGameStatusCompleted = gameStatus?.status === 'completed';
    
    if ((isNumbersCompleted || isGameStatusCompleted) && !gameEndShownRef.current) {
      gameEndShownRef.current = true;
      setGameCompleted(true);
      setShowGameEndModal(true);
      startConfettiAnimation();
    }
  };

  useEffect(() => {
    checkGameCompletion();
  }, [calledNumbers, gameStatus?.status]);

  useEffect(() => {
    fetchGameStatus();
    fetchMyTickets();
    checkChatStatus();
    fetchClaims();
    fetchPatternRewards();
    fetchAllPatternsForViewing();

    const statusInterval = setInterval(fetchGameStatus, 3000);
    const claimsInterval = setInterval(fetchClaims, 3000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(claimsInterval);
      Speech.stop();
      stopConfettiAnimation();
      stopWinningCelebration();
      stopAllBlinking();
    };
  }, []);

  useEffect(() => {
    claimsRef.current = claims;
  }, [claims]);

  const updatePatternCounts = (claimsData) => {
    const ticketPatterns = {};
    const patternCounts = {};

    patternRewards.forEach(pattern => {
      patternCounts[pattern.pattern_id] = {
        claimed: 0,
        total: pattern.limit_count || 0,
        patternName: pattern.reward_name,
      };
    });

    claimsData.forEach(claim => {
      const ticketId = claim.ticket_id;
      const patternId = claim.game_pattern_id;
      
      if (!ticketId || !patternId) return;

      if (!ticketPatterns[ticketId]) {
        ticketPatterns[ticketId] = {};
      }

      if (claim.claim_status === 'approved' || claim.claim_status === 'pending') {
        ticketPatterns[ticketId][patternId] = {
          count: (ticketPatterns[ticketId][patternId]?.count || 0) + 1,
          status: claim.claim_status,
        };

        if (claim.claim_status === 'approved' && patternCounts[patternId]) {
          patternCounts[patternId].claimed += 1;
        }
      }
    });

    setPatternsByTicket(ticketPatterns);
    setTotalPatternCounts(patternCounts);
  };

  const fetchPatternRewards = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const games = response.data.games.data;
        const currentGame = games.find((game) => game.id === parseInt(gameId));

        if (currentGame && currentGame.pattern_rewards) {
          setPatternRewards(currentGame.pattern_rewards);
          
          const initialCounts = {};
          currentGame.pattern_rewards.forEach(pattern => {
            initialCounts[pattern.pattern_id] = {
              claimed: 0,
              total: pattern.limit_count || 0,
              patternName: pattern.reward_name,
            };
          });
          setTotalPatternCounts(initialCounts);
        }
      }
    } catch (error) {
      console.log("Error fetching pattern rewards:", error);
    }
  };

  const fetchClaims = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/claims/game/${gameId}/claims`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const newClaims = response.data.data.claims || [];
        const previousClaims = claimsRef.current;
        
        updatePatternCounts(newClaims);
        
        if (!initialClaimsFetched) {
          announcedClaimIds.current.clear();
        }
        
        const notifications = [];
        
        newClaims.forEach(newClaim => {
          const oldClaim = previousClaims.find(old => old.id === newClaim.id);
          
          if (!oldClaim) {
            if (newClaim.claim_status === 'pending') {
              notifications.push({
                type: 'new_claim',
                claim: newClaim,
                message: `🎉 ${newClaim.user_name} submitted a ${newClaim.reward_name} claim!`
              });
            }
          } else {
            if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'approved') {
              notifications.push({
                type: 'claim_approved',
                claim: newClaim,
                message: `🏆 ${newClaim.user_name} WON ₹${newClaim.winning_amount} for ${newClaim.reward_name}! CONGRATULATIONS! 🎊`
              });
            } else if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'rejected') {
              notifications.push({
                type: 'claim_rejected',
                claim: newClaim,
                message: `❌ ${newClaim.user_name}'s ${newClaim.reward_name} claim was rejected`
              });
            }
          }
        });
        
        if (notifications.length > 0) {
          notifications.forEach((notification, index) => {
            setTimeout(() => {
              showNotification(notification);
            }, index * 2000);
          });
        }
        
        setClaims(newClaims);
        
        if (!initialClaimsFetched) {
          setInitialClaimsFetched(true);
        }
      }
    } catch (error) {
      console.log("Error fetching claims:", error);
    }
  };

  const showNotification = (notification) => {
    const { type, claim, message } = notification;
    
    if (announcedClaimIds.current.has(claim.id)) {
      return;
    }
    
    announcedClaimIds.current.add(claim.id);
    
    setTimeout(() => {
      announcedClaimIds.current.delete(claim.id);
    }, 10000);
    
    if (type === 'claim_approved') {
      setSnackbarType('success');
      startWinnerCelebration(claim);
    } else if (type === 'claim_rejected') {
      setSnackbarType('error');
    } else {
      setSnackbarType('info');
    }
    
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    
    if (audioEnabled.current) {
      Speech.stop();
      
      setTimeout(() => {
        speakClaimAnnouncement(claim, type);
      }, 1000);
    }
  };

  const startWinnerCelebration = (claim) => {
    setWinningMessage(`🏆 WINNER! 🏆`);
    setWinningUser(claim.user_name);
    setWinningAmount(claim.winning_amount);
    setWinningPattern(claim.reward_name);
    
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.5);
    celebrationTranslateY.setValue(50);

    setShowWinningCelebration(true);

    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(celebrationTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    startConfettiAnimationCelebration();

    setTimeout(() => {
      stopWinningCelebration();
    }, 2000);
  };

  const startConfettiAnimationCelebration = () => {
    confettiTranslateY.current.forEach((anim, index) => {
      anim.setValue(-50);
      Animated.timing(anim, {
        toValue: Dimensions.get("window").height + 50,
        duration: 1500 + Math.random() * 1000,
        delay: index * 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  };

  const stopWinningCelebration = () => {
    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationScale, {
        toValue: 0.5,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationTranslateY, {
        toValue: 50,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWinningCelebration(false);
    });
  };

  const speakClaimAnnouncement = (claim, type) => {
    let announcement = '';
    
    if (type === 'claim_approved') {
      const winningAmount = parseFloat(claim.winning_amount);
      
      let amountText;
      if (winningAmount === 1) {
        amountText = '1 rupee';
      } else {
        amountText = `${winningAmount} rupees`;
      }
      
      announcement = `Congratulations! ${claim.user_name} has won ${amountText} for completing the ${claim.reward_name} pattern! Tambola!`;
      
      Speech.speak(announcement, {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.9 : 1.2,
        rate: 0.9,
        volume: 1.0,
        onDone: () => {
          setTimeout(() => {
            const celebration = "Congratulations to the winner!";
            Speech.speak(celebration, {
              language: 'en-US',
              pitch: voiceType === 'male' ? 1.0 : 1.3,
              rate: 1.0,
              volume: 1.0,
            });
          }, 500);
        }
      });
      
    } else if (type === 'new_claim') {
      const claimMessage = `${claim.user_name} has submitted a ${claim.reward_name} claim!`;
      
      Speech.speak(claimMessage, {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.8 : 1.0,
        rate: 0.8,
        onDone: () => {
          setTimeout(() => {
            const tambolaAnnouncement = "Tambola!";
            Speech.speak(tambolaAnnouncement, {
              language: 'en-US',
              pitch: voiceType === 'male' ? 0.9 : 1.2,
              rate: 0.9,
              volume: 1.0,
            });
          }, 300);
        }
      });
    } else if (type === 'claim_rejected') {
      const rejectionMessage = `${claim.user_name}'s ${claim.reward_name} claim has been rejected.`;
      
      Speech.speak(rejectionMessage, {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.8 : 1.0,
        rate: 0.8,
      });
    }
  };

  const submitClaim = async (ticketId, pattern) => {
    if (isSubmittingClaimRef.current) {
      showSnackbar("Please wait, processing previous claim...", 'warning');
      return;
    }
    
    if (submittingClaim) return;
    
    try {
      isSubmittingClaimRef.current = true;
      setSubmittingClaim(true);
      const token = await AsyncStorage.getItem("token");
      
      const ticket = myTickets.find(t => t.id === ticketId);
      if (!ticket) {
        showSnackbar("Ticket not found", 'error');
        isSubmittingClaimRef.current = false;
        return;
      }

      const ticketPatterns = patternsByTicket[ticketId] || {};
      const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
      if (patternOnTicket && patternOnTicket.status !== 'rejected') {
        showSnackbar(`You have already claimed ${pattern.reward_name || pattern.display_name} on this ticket`, 'error');
        isSubmittingClaimRef.current = false;
        return;
      }

      if (pattern.available_reward_count !== undefined && pattern.available_reward_count <= 0) {
        showSnackbar(`${pattern.reward_name || pattern.display_name} claims are no longer available`, 'error');
        isSubmittingClaimRef.current = false;
        return;
      }

      if (pattern.is_reward_available === false) {
        showSnackbar(`${pattern.reward_name || pattern.display_name} is not available for claims`, 'error');
        isSubmittingClaimRef.current = false;
        return;
      }

      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/claims/submit",
        {
          game_id: parseInt(gameId),
          ticket_id: parseInt(ticketId),
          reward_name: pattern.reward_name || pattern.display_name,
          claim_evidence: `Pattern ${pattern.game_pattern_id || pattern.pattern_id} completed on ticket ${ticket.ticket_number}`,
          game_pattern_id: pattern.game_pattern_id || pattern.pattern_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        showSnackbar(`Claim submitted for ${pattern.reward_name || pattern.display_name}! Waiting for approval.`, 'info');
        
        await Promise.all([
          fetchClaims(),
          fetchPatternRewardCounts().then(rewardCountsData => {
            if (rewardCountsData.length > 0) {
              const patternsWithCounts = rewardCountsData.map(pattern => ({
                id: pattern.game_pattern_id,
                pattern_id: pattern.game_pattern_id,
                pattern_name: pattern.pattern_name,
                display_name: pattern.reward_name.replace(' Prize', '').replace(/_/g, ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '),
                amount: pattern.amount,
                total_reward_count: pattern.total_reward_count,
                approved_claims_count: pattern.approved_claims_count,
                pending_claims_count: pattern.pending_claims_count,
                available_reward_count: pattern.available_reward_count,
                is_reward_available: pattern.is_reward_available,
                reward_name: pattern.reward_name,
                game_pattern_id: pattern.game_pattern_id
              }));
              setMenuPatterns(patternsWithCounts);
            }
          }),
        ]);
        
        const updatedTicketPatterns = { ...patternsByTicket };
        if (!updatedTicketPatterns[ticketId]) {
          updatedTicketPatterns[ticketId] = {};
        }
        updatedTicketPatterns[ticketId][pattern.pattern_id] = {
          count: 1,
          status: 'pending',
        };
        setPatternsByTicket(updatedTicketPatterns);
        
      } else {
        showSnackbar(response.data.message || "Failed to submit claim", 'error');
      }
    } catch (error) {
      console.log("Error submitting claim:", error);
      let errorMessage = "Failed to submit claim. Please try again.";

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join("\n");
        }
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      isSubmittingClaimRef.current = false;
      setSubmittingClaim(false);
      setMenuVisible(false);
      setSelectedTicket(null);
    }
  };

  const showSnackbar = (message, type = 'info') => {
    setSnackbarType(type);
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const startConfettiAnimation = () => {
    confettiAnimation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const stopConfettiAnimation = () => {
    confettiAnimation.stopAnimation();
    confettiAnimation.setValue(0);
  };

  const handleCloseGameEndModal = () => {
    stopConfettiAnimation();
    setShowGameEndModal(false);
    navigation.goBack();
  };

  const handleViewWinners = () => {
    stopConfettiAnimation();
    setShowGameEndModal(false);
    navigation.navigate('UserGameWinners', {
      gameId,
      gameName,
      gameData: gameStatus,
      calledNumbers: calledNumbers
    });
  };

  const handleViewAllCalledNumbers = () => {
    navigation.navigate('UserCalledNumbers', {
      gameId,
      gameName,
      calledNumbers,
      voiceType,
      gameData: gameStatus
    });
  };

  const openMenu = async (ticketId) => {
    setSelectedTicket(ticketId);
    setMenuVisible(false);
    
    try {
      const rewardCountsData = await fetchPatternRewardCounts();
      if (rewardCountsData.length > 0) {
        const patternsWithCounts = rewardCountsData.map(pattern => ({
          id: pattern.game_pattern_id,
          pattern_id: pattern.game_pattern_id,
          pattern_name: pattern.pattern_name,
          display_name: pattern.reward_name.replace(' Prize', '').replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          amount: pattern.amount,
          total_reward_count: pattern.total_reward_count,
          approved_claims_count: pattern.approved_claims_count,
          pending_claims_count: pattern.pending_claims_count,
          available_reward_count: pattern.available_reward_count,
          is_reward_available: pattern.is_reward_available,
          reward_name: pattern.reward_name,
          game_pattern_id: pattern.game_pattern_id
        }));
        setMenuPatterns(patternsWithCounts);
      }
    } catch (error) {
      console.log("Error fetching pattern counts:", error);
    }
    
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedTicket(null);
  };

  useEffect(() => {
    loadVoicePreference();
  }, []);

  const loadVoicePreference = async () => {
    try {
      const savedVoice = await AsyncStorage.getItem('voiceType');
      if (savedVoice) {
        setVoiceType(savedVoice);
      }
    } catch (error) {
      console.log("Error loading voice preference:", error);
    }
  };

  const saveVoicePreference = async (type) => {
    try {
      await AsyncStorage.setItem('voiceType', type);
      setVoiceType(type);
      setShowVoiceModal(false);
    } catch (error) {
      console.log("Error saving voice preference:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameStatus();
    await fetchMyTickets();
    await checkChatStatus();
    await fetchClaims();
    await fetchPatternRewards();
    await fetchAllPatternsForViewing();
    setRefreshing(false);
  };

  const fetchGameStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/${gameId}/calling-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        const previousGameStatus = gameStatus?.status;
        const newGameStatus = data.game?.status;
        
        setGameStatus(data.game);
        setCallingStatus(data.calling);
        setCalledNumbers(data.numbers.called_numbers || []);
        setLoading(false);
        
        if (previousGameStatus !== 'completed' && newGameStatus === 'completed') {
          checkGameCompletion();
        }
      }
    } catch (error) {
      console.log("Error fetching game status:", error);
      setLoading(false);
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
        const tickets = res.data.tickets.data.filter((ticket) => ticket.game_id === parseInt(gameId));
        setMyTickets(tickets);
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
    }
  };

  const checkChatStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setParticipantCount(response.data.total_participants || 0);
        const tokenData = await AsyncStorage.getItem("user");
        if (tokenData) {
          const user = JSON.parse(tokenData);
          const isParticipant = response.data.data.some(p => p.id === user.id);
          setIsChatJoined(isParticipant);
        }
      }
    } catch (error) {
      console.log("Error checking chat status:", error);
    }
  };

  const joinChat = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setIsChatJoined(true);
        setParticipantCount(response.data.participant_count || 1);
        navigation.navigate('UserLiveChat', {
          gameId,
          gameName,
          participantCount: response.data.participant_count || 1
        });
      }
    } catch (error) {
      console.log("Error joining chat:", error);
    }
  };

  const speakNumber = (number) => {
    Speech.stop();
    
    const numStr = number.toString();
    
    if (numStr.length === 1) {
      const digitWord = getSingleDigitWord(number);
      const speechText = `Single digit ${digitWord}`;
      
      const voiceConfig = {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.8 : 1.0,
        rate: 0.8,
      };
      
      Speech.speak(speechText, voiceConfig);
      return;
    }
    
    const singleDigits = numStr.split('').map(digit => {
      switch(digit) {
        case '0': return 'zero';
        case '1': return 'one';
        case '2': return 'two';
        case '3': return 'three';
        case '4': return 'four';
        case '5': return 'five';
        case '6': return 'six';
        case '7': return 'seven';
        case '8': return 'eight';
        case '9': return 'nine';
        default: return digit;
      }
    }).join(' ');
    
    const fullNumberName = getNumberName(number);
    
    const digitsSpeechText = `Number ${singleDigits}`;
    const digitsVoiceConfig = {
      language: 'en-US',
      pitch: voiceType === 'male' ? 0.8 : 1.0,
      rate: 0.8,
      onDone: () => {
        setTimeout(() => {
          const fullNameVoiceConfig = {
            language: 'en-US',
            pitch: voiceType === 'male' ? 0.9 : 1.1,
            rate: 0.9,
            volume: 1.0,
          };
          Speech.speak(fullNumberName, fullNameVoiceConfig);
        }, 20);
      }
    };
    
    Speech.speak(digitsSpeechText, digitsVoiceConfig);
  };

  const getSingleDigitWord = (num) => {
    switch(num) {
      case 1: return 'one';
      case 2: return 'two';
      case 3: return 'three';
      case 4: return 'four';
      case 5: return 'five';
      case 6: return 'six';
      case 7: return 'seven';
      case 8: return 'eight';
      case 9: return 'nine';
      default: return 'zero';
    }
  };

  const getNumberName = (num) => {
    const numberNames = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
      6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
      11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
      16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
      21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
      26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
      31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
      36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
      41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
      46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
      51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
      56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
      61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
      66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
      71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five',
      76: 'seventy-six', 77: 'seventy-seven', 78: 'seventy-eight', 79: 'seventy-nine', 80: 'eighty',
      81: 'eighty-one', 82: 'eighty-two', 83: 'eighty-three', 84: 'eighty-four', 85: 'eighty-five',
      86: 'eighty-six', 87: 'eighty-seven', 88: 'eighty-eight', 89: 'eighty-nine', 90: 'ninety'
    };
    
    return numberNames[num] || num.toString();
  };

  useEffect(() => {
    if (calledNumbers.length > 0) {
      const latestNumber = calledNumbers[calledNumbers.length - 1];
      
      if (lastCalledRef.current !== latestNumber) {
        lastCalledRef.current = latestNumber;
        
        setTimeout(() => {
          speakNumber(latestNumber);
        }, 500);
      }
    }
  }, [calledNumbers]);

  const handleNumberClick = async (ticketId, cellNumber, isCurrentlyMarked) => {
    if (cellNumber === null || markingLoading) return;
    
    playClickSound();
    
    const cellKey = `${ticketId}-${cellNumber}`;
    
    setProcessingCells(prev => new Set(prev).add(cellKey));
    
    updateTicketState(ticketId, cellNumber, !isCurrentlyMarked);
    
    makeMarkingApiCall(ticketId, cellNumber, isCurrentlyMarked, cellKey);
  };

  const makeMarkingApiCall = async (ticketId, cellNumber, wasMarked, cellKey) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (wasMarked) {
        await axios.post(
          `https://exilance.com/tambolatimez/public/api/user/tickets/${ticketId}/unmark`,
          { number: cellNumber },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        await axios.post(
          "https://exilance.com/tambolatimez/public/api/user/tickets/mark-multiple",
          {
            ticket_marks: [{ ticket_id: ticketId, numbers: [cellNumber] }]
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json"
            }
          }
        );
      }
      
    } catch (error) {
      console.log("Error marking/unmarking number:", error);
      
      showSnackbar("Failed to update number. Please try again.", 'error');
      updateTicketState(ticketId, cellNumber, wasMarked);
    } finally {
      setProcessingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  const updateTicketState = (ticketId, number, isMarked) => {
    setMyTickets(prevTickets => 
      prevTickets.map(ticket => {
        if (ticket.id === ticketId) {
          const updatedTicketData = ticket.ticket_data.map(row =>
            row.map(cell => {
              if (cell && cell.number === number) {
                return { ...cell, is_marked: isMarked };
              }
              return cell;
            })
          );
          
          return { 
            ...ticket, 
            ticket_data: updatedTicketData 
          };
        }
        return ticket;
      })
    );
  };

  const processTicketData = (ticketData) => {
    if (!ticketData || !Array.isArray(ticketData)) return Array(3).fill(Array(9).fill(null));
    
    if (ticketData[0] && Array.isArray(ticketData[0]) && ticketData[0][0] && typeof ticketData[0][0] === 'object') {
      const processedGrid = Array(3).fill().map(() => Array(9).fill(null));
      
      ticketData.forEach((row, rowIndex) => {
        row.forEach((cell) => {
          if (cell && cell.number !== null && cell.column !== undefined) {
            processedGrid[rowIndex][cell.column] = cell;
          }
        });
      });
      
      return processedGrid;
    } else if (ticketData[0] && Array.isArray(ticketData[0])) {
      return ticketData.map(row => row.map(cell => cell));
    }
    
    return Array(3).fill(Array(9).fill(null));
  };

  const renderAllCalledNumbersSection = () => {
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    const numberRows = [];
    for (let i = 0; i < 9; i++) {
      numberRows.push(allNumbers.slice(i * 10, (i + 1) * 10));
    }

    return (
      <View style={styles.allNumbersCard}>
        <View style={styles.allNumbersHeader}>
          <View style={styles.allNumbersTitleContainer}>
            <Image
              source={{ uri: GAME_IMAGES.numbers }}
              style={styles.allNumbersIcon}
            />
            <Text style={styles.allNumbersTitle}>All Numbers (1-90)</Text>
            <View style={styles.calledCountBadge}>
              <Text style={styles.calledCountText}>{calledNumbers.length}/90</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.viewAllGridButton}
            onPress={handleViewAllCalledNumbers}
          >
            <Text style={styles.viewAllGridButtonText}>View All</Text>
            <Ionicons name="expand" size={14} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.numbersGridCompact}>
          {numberRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.numberRow}>
              {row.map((number) => {
                const isCalled = calledNumbers.includes(number);
                const isLatest = calledNumbers.length > 0 && 
                  number === calledNumbers[calledNumbers.length - 1];
                
                return (
                  <TouchableOpacity
                    key={number}
                    style={[
                      styles.numberItemCompact,
                      isCalled && styles.calledNumberItem,
                      isLatest && styles.latestNumberItem,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.numberItemTextCompact,
                      isCalled && styles.calledNumberText,
                      isLatest && styles.latestNumberText,
                    ]}>
                      {number}
                    </Text>
                    {isLatest && (
                      <View style={styles.latestIndicatorCompact}>
                        <Ionicons name="star" size={8} color={WARNING_ORANGE} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        
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
    );
  };

  const renderTicketGrid = (ticketData, ticketId) => {
    const processedData = processTicketData(ticketData);
    const blinkingAnim = blinkingAnimations[ticketId];
    const currentBlinkingCells = blinkingCells[ticketId] || [];
    
    const blinkingCellMap = {};
    currentBlinkingCells.forEach(cell => {
      const key = `${cell.row}-${cell.col}`;
      blinkingCellMap[key] = true;
    });

    return (
      <View style={styles.ticket}>
        {processedData.map((row, rowIndex) => (
          <View 
            key={`row-${rowIndex}`} 
            style={[
              styles.row,
              { 
                backgroundColor: rowIndex % 2 === 0 ? ROW_COLOR_1 : ROW_COLOR_2,
              }
            ]}
          >
            {row.map((cell, colIndex) => {
              const cellObj = cell;
              const cellNumber = cellObj?.number;
              const isMarked = cellObj?.is_marked || false;
              const isEmpty = cellNumber === null || cellNumber === undefined;
              
              const shouldBlink = blinkingCellMap[`${rowIndex}-${colIndex}`];
              
              let cellBackgroundColor;
              let cellBorderColor;
              let textColor;
              
              if (isEmpty) {
                cellBackgroundColor = EMPTY_CELL_BG;
                cellBorderColor = 'transparent';
                textColor = "transparent";
              } else if (isMarked) {
                cellBackgroundColor = MARKED_CELL_BG;
                cellBorderColor = MARKED_CELL_BORDER;
                textColor = "#FFFFFF";
              } else {
                cellBackgroundColor = FILLED_CELL_BG;
                cellBorderColor = CELL_BORDER_COLOR;
                textColor = NUMBER_COLOR;
              }
              
              return (
                <TouchableOpacity
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    { 
                      width: CELL_WIDTH,
                      height: CELL_WIDTH,
                      margin: CELL_MARGIN,
                      backgroundColor: cellBackgroundColor,
                      borderColor: cellBorderColor,
                    },
                    shouldBlink && styles.blinkingCellBorder,
                  ]}
                  onPress={() => cellNumber && handleNumberClick(ticketId, cellNumber, isMarked)}
                  onLongPress={() => cellNumber && speakNumber(cellNumber)}
                  disabled={isEmpty || markingLoading}
                >
                  {!isEmpty && (
                    <>
                      {shouldBlink && blinkingAnim ? (
                        <Animated.View 
                          style={[
                            styles.blinkingOverlay,
                            {
                              opacity: blinkingAnim,
                              backgroundColor: WARNING_ORANGE,
                              transform: [{
                                scale: blinkingAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.2]
                                })
                              }]
                            }
                          ]}
                        >
                          <Text style={[
                            styles.number, 
                            { 
                              color: textColor,
                              textShadowColor: 'rgba(243, 156, 18, 0.8)',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 4,
                            }
                          ]}>
                            {cellNumber}
                          </Text>
                        </Animated.View>
                      ) : (
                        <Text style={[styles.number, { color: textColor }]}>
                          {cellNumber}
                        </Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderTicketItem = ({ item, index }) => (
    <View style={styles.ticketItemContainer}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketNumberContainer}>
          <Image
            source={{ uri: GAME_IMAGES.ticket }}
            style={styles.ticketIcon}
          />
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketLabel}>Ticket #{item.ticket_number}</Text>
          </View>
        </View>
        
        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={styles.viewPatternsButton}
            onPress={() => handleViewPatterns(item.id)}
          >
            <Ionicons name="eye-outline" size={16} color={ACCENT_COLOR} />
            <Text style={styles.viewPatternsButtonText}>Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => openMenu(item.id)}
            ref={el => menuRefs.current[index] = el}
          >
            <Ionicons name="trophy" size={16} color={SECONDARY_COLOR} />
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ticketCard}>
        {renderTicketGrid(item.ticket_data, item.id)}
      </View>
    </View>
  );

  const renderPatternMenu = () => {
    if (!selectedTicket) return null;

    const ticketPatterns = patternsByTicket[selectedTicket] || {};
    
    const patternsForClaim = menuPatterns.map(pattern => {
      const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
      const hasAvailableRewards = pattern.available_reward_count !== undefined && pattern.available_reward_count > 0;
      const isRewardAvailable = pattern.is_reward_available !== false;
      
      const isClaimed = patternOnTicket && patternOnTicket.status !== 'rejected';
      
      const isDisabled = isClaimed || !hasAvailableRewards || !isRewardAvailable;
      
      return {
        ...pattern,
        isDisabled,
        isClaimed,
        hasAvailableRewards,
        isRewardAvailable,
        patternOnTicket
      };
    });

    const handleRefreshPatterns = async () => {
      try {
        const rewardCountsData = await fetchPatternRewardCounts();
        if (rewardCountsData.length > 0) {
          const patternsWithCounts = rewardCountsData.map(pattern => ({
            id: pattern.game_pattern_id,
            pattern_id: pattern.game_pattern_id,
            pattern_name: pattern.pattern_name,
            display_name: pattern.reward_name.replace(' Prize', '').replace(/_/g, ' ').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            amount: pattern.amount,
            total_reward_count: pattern.total_reward_count,
            approved_claims_count: pattern.approved_claims_count,
            pending_claims_count: pattern.pending_claims_count,
            available_reward_count: pattern.available_reward_count,
            is_reward_available: pattern.is_reward_available,
            reward_name: pattern.reward_name,
            game_pattern_id: pattern.game_pattern_id
          }));
          setMenuPatterns(patternsWithCounts);
          showSnackbar("Patterns refreshed successfully", 'info');
        }
      } catch (error) {
        showSnackbar("Failed to refresh patterns", 'error');
      }
    };

    return (
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Submit Claim</Text>
              <View style={styles.menuHeaderActions}>
                <TouchableOpacity 
                  style={styles.refreshMenuButton}
                  onPress={handleRefreshPatterns}
                  disabled={loadingPatterns}
                >
                  {loadingPatterns ? (
                    <ActivityIndicator size="small" color={ACCENT_COLOR} />
                  ) : (
                    <Ionicons name="refresh" size={20} color={ACCENT_COLOR} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={closeMenu}>
                  <Ionicons name="close" size={24} color={LIGHT_ACCENT} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.patternsMenuScroll}>
              {loadingPatterns ? (
                <View style={styles.patternsLoadingContainer}>
                  <ActivityIndicator size="large" color={ACCENT_COLOR} />
                  <Text style={styles.patternsLoadingText}>Loading patterns...</Text>
                </View>
              ) : patternsForClaim.length === 0 ? (
                <View style={styles.noPatternsContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color={WARNING_ORANGE} />
                  <Text style={styles.noPatternsText}>No patterns available for this game</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefreshPatterns}
                  >
                    <Ionicons name="refresh" size={16} color={ACCENT_COLOR} />
                    <Text style={styles.retryButtonText}>Refresh Patterns</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                patternsForClaim.map((pattern, index) => {
                  const isDisabled = pattern.isDisabled;
                  const isClaimed = pattern.isClaimed;
                  const isLimitReached = !pattern.hasAvailableRewards || !pattern.isRewardAvailable;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.patternMenuItem,
                        isDisabled && styles.disabledPatternItem
                      ]}
                      onPress={() => !isDisabled && submitClaim(selectedTicket, pattern)}
                      disabled={submittingClaim || isDisabled}
                    >
                      <View style={styles.patternMenuItemContent}>
                        <Ionicons 
                          name={isClaimed ? "checkmark-circle" : (isLimitReached ? "lock-closed" : "trophy-outline")} 
                          size={20} 
                          color={isClaimed ? SUCCESS_GREEN : (isLimitReached ? ERROR_RED : ACCENT_COLOR)} 
                        />
                        <View style={styles.patternMenuItemInfo}>
                          <Text style={[
                            styles.patternMenuItemName,
                            isDisabled && styles.disabledPatternName
                          ]}>
                            {pattern.reward_name || pattern.display_name}
                            {isClaimed && (
                              <Text style={styles.claimedBadge}> ✓ Claimed</Text>
                            )}
                            {!isClaimed && isLimitReached && (
                              <Text style={styles.limitReachedBadge}> ✗ Not Available</Text>
                            )}
                          </Text>
                          <Text style={[
                            styles.patternMenuItemDesc,
                            isDisabled && styles.disabledPatternDesc
                          ]} numberOfLines={2}>
                            Prize: ₹{pattern.amount}
                            {pattern.available_reward_count !== undefined && (
                              <Text style={[
                                styles.patternLimitText,
                                isLimitReached && styles.limitReachedText
                              ]}>
                                {" "}• Available: {pattern.available_reward_count}/{pattern.total_reward_count}
                              </Text>
                            )}
                          </Text>
                        </View>
                        {submittingClaim && pattern.patternOnTicket ? (
                          <ActivityIndicator size="small" color={ACCENT_COLOR} />
                        ) : (
                          <View style={styles.patternStatusContainer}>
                            {isDisabled && !isClaimed && (
                              <Ionicons name="lock-closed" size={16} color={ERROR_RED} />
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderPatternsModal = () => {
    if (!selectedTicket) return null;

    return (
      <Modal
        transparent={true}
        visible={showPatternsModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPatternsModal(false);
          stopAllBlinking();
        }}
      >
        <View style={styles.patternsModalOverlay}>
          <View style={styles.patternsModalContainer}>
            <View style={styles.patternsModalHeader}>
              <Text style={styles.patternsModalTitle}>Available Patterns</Text>
              <View style={styles.patternsModalHeaderActions}>
                <TouchableOpacity 
                  onPress={() => fetchAllPatternsForViewing()}
                  style={styles.refreshPatternsButton}
                  disabled={loadingPatterns}
                >
                  {loadingPatterns ? (
                    <ActivityIndicator size="small" color={LIGHT_ACCENT} />
                  ) : (
                    <Ionicons name="refresh" size={20} color={LIGHT_ACCENT} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setShowPatternsModal(false);
                    stopAllBlinking();
                  }}
                  style={styles.patternsModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={LIGHT_ACCENT} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.patternsModalSubtitle}>
              Tap on a pattern to see it highlighted on ALL your tickets for 5 seconds
            </Text>
            
            {blinkingPattern && (
              <View style={styles.currentBlinkingPatternContainer}>
                <Ionicons name="star" size={18} color={WARNING_ORANGE} />
                <Text style={styles.currentBlinkingPatternText}>
                  Showing: <Text style={styles.currentBlinkingPatternName}>{blinkingPattern.display_name}</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stopBlinkingButton}
                  onPress={stopAllBlinking}
                >
                  <Ionicons name="stop-circle" size={16} color={ERROR_RED} />
                  <Text style={styles.stopBlinkingText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.earlyFiveNoteContainer}>
              <Ionicons name="information-circle" size={18} color={ACCENT_COLOR} />
              <Text style={styles.earlyFiveNoteText}>
                <Text style={styles.earlyFiveNoteBold}>Early Five pattern:</Text> Shows the first 5 called numbers on each ticket
              </Text>
            </View>
            
            {loadingPatterns ? (
              <View style={styles.patternsLoadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                <Text style={styles.patternsLoadingText}>Loading patterns...</Text>
              </View>
            ) : (
              <ScrollView style={styles.patternsList} showsVerticalScrollIndicator={false}>
                {availablePatterns.length === 0 ? (
                  <View style={styles.noAvailablePatternsContainer}>
                    <Ionicons name="alert-circle-outline" size={40} color={WARNING_ORANGE} />
                    <Text style={styles.noAvailablePatternsText}>No patterns available</Text>
                  </View>
                ) : (
                  availablePatterns.map((pattern, index) => {
                    const isSelected = selectedPatternForView?.id === pattern.id;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.patternListItem,
                          isSelected && styles.selectedPatternListItem
                        ]}
                        onPress={() => handlePatternSelect(pattern)}
                      >
                        <View style={styles.patternListItemContent}>
                          <Ionicons 
                            name="star" 
                            size={18} 
                            color={isSelected ? WARNING_ORANGE : ACCENT_COLOR} 
                          />
                          <View style={styles.patternListItemInfo}>
                            <Text style={styles.patternListItemName}>
                              {pattern.display_name}
                              {isSelected && (
                                <Text style={styles.selectedBadge}> • Selected</Text>
                              )}
                            </Text>
                            <Text style={styles.patternListItemDesc} numberOfLines={2}>
                              {getPatternDescription(pattern.pattern_name)}
                            </Text>
                          </View>
                          <View style={styles.patternActionContainer}>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={22} color={SUCCESS_GREEN} />
                            ) : (
                              <Ionicons name="eye" size={18} color={ACCENT_COLOR} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
            
            <View style={styles.patternsModalFooter}>
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => {
                  setSelectedPatternForView(null);
                  stopAllBlinking();
                }}
              >
                <Ionicons name="refresh" size={16} color={MUTED_GOLD} />
                <Text style={styles.clearSelectionButtonText}>Clear Selection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closePatternsButton}
                onPress={() => {
                  setShowPatternsModal(false);
                  setSelectedPatternForView(null);
                  stopAllBlinking();
                }}
              >
                <Text style={styles.closePatternsButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderWinningCelebration = () => {
    if (!showWinningCelebration) return null;

    return (
      <Modal
        transparent={true}
        visible={showWinningCelebration}
        animationType="fade"
        onRequestClose={stopWinningCelebration}
      >
        <View style={styles.winningOverlay}>
          {confettiTranslateY.current.map((anim, index) => (
            <Animated.View
              key={`confetti-${index}`}
              style={[
                styles.confettiParticle,
                {
                  left: `${(index * 5) % 100}%`,
                  transform: [{ translateY: anim }],
                  backgroundColor: [ERROR_RED, ACCENT_COLOR, WARNING_ORANGE, SUCCESS_GREEN][index % 4],
                }
              ]}
            />
          ))}

          <Animated.View style={[
            styles.celebrationContent,
            {
              opacity: celebrationOpacity,
              transform: [
                { scale: celebrationScale },
                { translateY: celebrationTranslateY }
              ],
            }
          ]}>
            <View style={styles.celebrationInner}>
              <Ionicons name="trophy" size={40} color={WARNING_ORANGE} style={styles.trophyIcon} />
              
              <Text style={styles.winningTitle}>{winningMessage}</Text>
              
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerName}>{winningUser}</Text>
                <Text style={styles.winnerPattern}>{winningPattern}</Text>
              </View>
              
              <View style={styles.prizeAmountContainer}>
                <Text style={styles.prizeAmount}>₹{winningAmount}</Text>
                <Text style={styles.prizeLabel}>WINNINGS</Text>
              </View>
              
              <View style={styles.celebrationMessage}>
                <Ionicons name="sparkles" size={16} color={WARNING_ORANGE} />
                <Text style={styles.celebrationText}>CONGRATULATIONS!</Text>
                <Ionicons name="sparkles" size={16} color={WARNING_ORANGE} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeCelebrationButton}
              onPress={stopWinningCelebration}
            >
              <Text style={styles.closeCelebrationText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const getSnackbarStyle = () => {
    switch (snackbarType) {
      case 'success':
        return { backgroundColor: SUCCESS_GREEN };
      case 'error':
        return { backgroundColor: ERROR_RED };
      case 'warning':
        return { backgroundColor: WARNING_ORANGE };
      default:
        return { backgroundColor: ACCENT_COLOR };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrapper}>
            <MaterialIcons name="confirmation-number" size={40} color={ACCENT_COLOR} />
          </View>
          <ActivityIndicator size="large" color={ACCENT_COLOR} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading Game Room...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={SECONDARY_COLOR} barStyle="light-content" />

      <View style={styles.backgroundPattern}>
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
        <Animated.View 
          style={[
            styles.pokerChip3, 
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
            styles.shineEffect,
            { 
              transform: [{ translateX: shineTranslateX }],
              opacity: shineAnim
            }
          ]} 
        />
      </View>

      {renderPatternsModal()}
      {renderWinningCelebration()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showGameEndModal}
        onRequestClose={handleCloseGameEndModal}
      >
        <View style={styles.gameEndModalOverlay}>
          <Animated.View 
            style={[
              styles.confettiContainer,
              {
                transform: [{
                  translateY: confettiAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20]
                  })
                }]
              }
            ]}
          >
            <Image
              source={{ uri: GAME_IMAGES.confetti }}
              style={styles.confettiImage}
            />
          </Animated.View>
          
          <View style={styles.gameEndModalContent}>
            <View style={styles.gameEndModalHeader}>
              <Image
                source={{ uri: GAME_IMAGES.trophy }}
                style={styles.gameEndTrophy}
              />
              <Text style={styles.gameEndModalTitle}>
                {gameStatus?.status === 'completed' ? "Game Completed!" : "Game Complete! 🎉"}
              </Text>
            </View>
            
            <View style={styles.gameEndModalBody}>
              <Text style={styles.gameEndCongratulations}>
                Congratulations!
              </Text>
              <Text style={styles.gameEndMessage}>
                {gameStatus?.status === 'completed' 
                  ? "The game has been marked as completed by the host!" 
                  : "All 90 numbers have been called! The game has ended."}
              </Text>
              
              <View style={styles.gameEndStats}>
                <View style={styles.endStatItem}>
                  <Text style={styles.endStatValue}>{calledNumbers.length}</Text>
                  <Text style={styles.endStatLabel}>Numbers Called</Text>
                </View>
                <View style={styles.endStatItem}>
                  <Text style={styles.endStatValue}>{myTickets.length}</Text>
                  <Text style={styles.endStatLabel}>Your Tickets</Text>
                </View>
                <View style={styles.endStatItem}>
                  <Text style={styles.endStatValue}>
                    {myTickets.flatMap(t => 
                      t.ticket_data.flat().filter(cell => cell.is_marked)
                    ).length}
                  </Text>
                  <Text style={styles.endStatLabel}>Marked Numbers</Text>
                </View>
              </View>
              
              <Text style={styles.gameEndThanks}>
                Thank you for playing! Check out the winners and claim your prizes.
              </Text>
            </View>
            
            <View style={styles.gameEndModalFooter}>
              <TouchableOpacity
                style={styles.viewWinnersButton}
                onPress={handleViewWinners}
              >
                <Ionicons name="trophy" size={20} color={SECONDARY_COLOR} />
                <Text style={styles.viewWinnersButtonText}>View Winners</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseGameEndModal}
              >
                <Text style={styles.closeButtonText}>Exit Game Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showVoiceModal}
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Voice Type</Text>
              <TouchableOpacity
                onPress={() => setShowVoiceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={MUTED_GOLD} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Choose your preferred voice for number announcements
            </Text>
            
            <TouchableOpacity
              style={[
                styles.voiceOption,
                voiceType === 'female' && styles.selectedVoiceOption
              ]}
              onPress={() => saveVoicePreference('female')}
            >
              <View style={styles.voiceOptionIcon}>
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={voiceType === 'female' ? ACCENT_COLOR : MUTED_GOLD} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Female Voice</Text>
                <Text style={styles.voiceOptionDesc}>Higher pitch, clear pronunciation</Text>
              </View>
              {voiceType === 'female' && (
                <Ionicons name="checkmark-circle" size={24} color={ACCENT_COLOR} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.voiceOption,
                voiceType === 'male' && styles.selectedVoiceOption
              ]}
              onPress={() => saveVoicePreference('male')}
            >
              <View style={styles.voiceOptionIcon}>
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={voiceType === 'male' ? ACCENT_COLOR : MUTED_GOLD} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Male Voice</Text>
                <Text style={styles.voiceOptionDesc}>Lower pitch, deeper tone</Text>
              </View>
              {voiceType === 'male' && (
                <Ionicons name="checkmark-circle" size={24} color={ACCENT_COLOR} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testVoiceButton}
              onPress={() => {
                if (calledNumbers.length > 0) {
                  speakNumber(calledNumbers[calledNumbers.length - 1]);
                } else {
                  speakNumber(25);
                }
              }}
            >
              <Ionicons name="volume-high" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.testVoiceButtonText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderPatternMenu()}

      <View style={styles.header}>
        <View style={styles.headerPattern}>
          <Animated.View 
            style={[
              styles.headerShine,
              { transform: [{ translateX: shineTranslateX }] }
            ]} 
          />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={ACCENT_COLOR} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Game Room</Text>
              <View style={styles.gameInfoContainer}>
                <Ionicons name="game-controller" size={16} color="rgba(212, 175, 55, 0.8)" />
                <Text style={styles.gameName} numberOfLines={1}>
                  {gameName || "Tambola Game"}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => setShowVoiceModal(true)}
              >
                <Ionicons name={voiceType === 'male' ? "male" : "female"} size={16} color={ACCENT_COLOR} />
                <Text style={styles.voiceButtonText}>
                  {voiceType === 'male' ? 'Male' : 'Female'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLOR}
            colors={[ACCENT_COLOR]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* All Numbers Section moved to top */}
          {renderAllCalledNumbersSection()}

          {/* Last Called Section - updated design */}
          <View style={styles.card}>
            {calledNumbers.length > 0 ? (
              <View style={styles.lastCalledSection}>
                <View style={styles.lastCalledHeader}>
                  <Image
                    source={{ uri: GAME_IMAGES.megaphone }}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Last Called Numbers</Text>
                  <TouchableOpacity
                    style={styles.voiceIndicator}
                    onPress={() => setShowVoiceModal(true)}
                  >
                    <Ionicons 
                      name={voiceType === 'male' ? "male" : "female"} 
                      size={14} 
                      color={ACCENT_COLOR} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.circularNumbersGrid}>
                  {calledNumbers.slice(-5).reverse().map((num, index) => {
                    const isLatest = index === 0;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.circularNumberItem,
                          isLatest && styles.latestCircularNumber
                        ]}
                        onPress={() => speakNumber(num)}
                      >
                        <Text style={[
                          styles.circularNumberText,
                          isLatest && styles.latestCircularNumberText
                        ]}>
                          {num}
                        </Text>
                        {isLatest && (
                          <View style={styles.latestBadge}>
                            <Ionicons name="star" size={8} color={SECONDARY_COLOR} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={handleViewAllCalledNumbers}
                >
                  <Text style={styles.viewAllButtonText}>View All Called Numbers</Text>
                  <Ionicons name="chevron-forward" size={14} color={ACCENT_COLOR} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.waitingSection}>
                <Ionicons name="hourglass-outline" size={32} color={WARNING_ORANGE} />
                <Text style={styles.waitingText}>
                  Waiting for numbers to be called...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.ticketsSection}>
            {myTickets.length === 0 ? (
              <View style={styles.emptyTicketsContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.empty }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Tickets Allocated</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't been allocated any tickets for this game yet
                </Text>
              </View>
            ) : (
              <>
                {blinkingPattern && (
                  <View style={styles.activePatternContainer}>
                    <Ionicons name="star" size={14} color={WARNING_ORANGE} />
                    <Text style={styles.activePatternText}>
                      Showing: <Text style={styles.activePatternName}>{blinkingPattern.display_name}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.stopBlinkingSmallButton}
                      onPress={stopAllBlinking}
                    >
                      <Ionicons name="close" size={12} color={ERROR_RED} />
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.ticketsList}>
                  {myTickets.map((ticket, index) => (
                    <View key={ticket.id} style={styles.ticketWrapper}>
                      {renderTicketItem({ item: ticket, index })}
                    </View>
                  ))}
                </View>

                <Text style={styles.ticketsHint}>
                  Tap numbers to mark/unmark them • Long press to hear number • Tap Patterns to view • Tap Claim to submit
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={joinChat}
        activeOpacity={0.9}
      >
        <View style={styles.chatButtonContent}>
          <Ionicons name="chatbubble-ellipses" size={20} color={SECONDARY_COLOR} />
          {participantCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>
                {participantCount > 99 ? '99+' : participantCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.chatButtonText}>
          {isChatJoined ? 'Chat' : 'Join Chat'}
        </Text>
      </TouchableOpacity>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        style={[styles.snackbar, getSnackbarStyle()]}
      >
        <View style={styles.snackbarContent}>
          {snackbarType === 'success' && (
            <Ionicons name="trophy" size={18} color="#FFF" style={styles.snackbarIcon} />
          )}
          {snackbarType === 'error' && (
            <Ionicons name="close-circle" size={18} color="#FFF" style={styles.snackbarIcon} />
          )}
          {snackbarType === 'info' && (
            <Ionicons name="information-circle" size={18} color="#FFF" style={styles.snackbarIcon} />
          )}
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  content: {
    padding: HORIZONTAL_MARGIN,
    paddingTop: 20,
    zIndex: 1,
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
  pokerChip1: {
    position: 'absolute',
    top: 80,
    left: SCREEN_WIDTH * 0.1,
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
    right: SCREEN_WIDTH * 0.15,
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
  pokerChip3: {
    position: 'absolute',
    top: 180,
    left: SCREEN_WIDTH * 0.6,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: SECONDARY_COLOR,
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
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: LIGHT_ACCENT,
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gameName: {
    fontSize: 14,
    color: MUTED_GOLD,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    gap: 4,
  },
  voiceButtonText: {
    fontSize: 11,
    color: ACCENT_COLOR,
    fontWeight: "600",
  },
  card: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
    shadowColor: ACCENT_COLOR,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  lastCalledSection: {
    marginBottom: 0,
  },
  lastCalledHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  sectionIcon: {
    width: 18,
    height: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ACCENT_COLOR,
    flex: 1,
  },
  voiceIndicator: {
    padding: 3,
  },
  circularNumbersGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  circularNumberItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DARK_TEAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    position: 'relative',
  },
  latestCircularNumber: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
    borderWidth: 2,
  },
  circularNumberText: {
    fontSize: 16,
    fontWeight: "600",
    color: MUTED_GOLD,
  },
  latestCircularNumberText: {
    color: SECONDARY_COLOR,
    fontWeight: "700",
  },
  latestBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: LIGHT_ACCENT,
    borderRadius: 5,
    padding: 1,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: DARK_TEAL,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    gap: 6,
  },
  viewAllButtonText: {
    fontSize: 13,
    color: ACCENT_COLOR,
    fontWeight: "600",
  },
  waitingSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: WARNING_ORANGE,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  allNumbersCard: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  allNumbersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  allNumbersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allNumbersIcon: {
    width: 18,
    height: 18,
  },
  allNumbersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT_COLOR,
  },
  calledCountBadge: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  calledCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: SECONDARY_COLOR,
  },
  viewAllGridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: DARK_TEAL,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  viewAllGridButtonText: {
    fontSize: 12,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  numbersGridCompact: {
    marginVertical: 6,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  numberItemCompact: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: DARK_TEAL,
    marginHorizontal: 2,
    position: 'relative',
  },
  calledNumberItem: {
    backgroundColor: SUCCESS_GREEN,
    borderColor: SUCCESS_GREEN,
  },
  latestNumberItem: {
    backgroundColor: WARNING_ORANGE,
    borderColor: WARNING_ORANGE,
    borderWidth: 2,
  },
  numberItemTextCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED_GOLD,
  },
  calledNumberText: {
    color: SECONDARY_COLOR,
    fontWeight: '700',
  },
  latestNumberText: {
    color: SECONDARY_COLOR,
    fontWeight: '900',
  },
  latestIndicatorCompact: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 5,
    padding: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  legendNormal: {
    backgroundColor: DARK_TEAL,
  },
  legendCalled: {
    backgroundColor: SUCCESS_GREEN,
  },
  legendLatest: {
    backgroundColor: WARNING_ORANGE,
  },
  legendText: {
    fontSize: 10,
    color: MUTED_GOLD,
  },
  ticketsSection: {
    marginBottom: 12,
  },
  activePatternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WARNING_ORANGE,
  },
  activePatternText: {
    fontSize: 13,
    color: MUTED_GOLD,
    marginLeft: 6,
    flex: 1,
  },
  activePatternName: {
    fontWeight: '700',
    color: WARNING_ORANGE,
  },
  stopBlinkingSmallButton: {
    padding: 3,
  },
  ticketsList: {
    gap: 20,
  },
  ticketWrapper: {
    marginBottom: 16,
  },
  ticketItemContainer: {
    marginBottom: 0,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  ticketNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  ticketIcon: {
    width: 20,
    height: 20,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 13,
    color: MUTED_GOLD,
    fontWeight: "600",
  },
  ticketActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewPatternsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_TEAL,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    gap: 4,
  },
  viewPatternsButtonText: {
    fontSize: 12,
    color: ACCENT_COLOR,
    fontWeight: "600",
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 12,
    color: SECONDARY_COLOR,
    fontWeight: "600",
  },
  // Updated ticketCard to match TicketsScreen style
  ticketCard: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 12,
    padding: TICKET_PADDING,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    overflow: "hidden",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  // Updated ticket style - exactly like TicketsScreen
  ticket: {
    backgroundColor: SECONDARY_COLOR,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    overflow: "hidden",
    width: CELL_WIDTH * NUM_COLUMNS + CELL_MARGIN * 2 * NUM_COLUMNS,
    alignSelf: 'center',
  },
  row: {
    flexDirection: "row",
    width: '100%',
  },
  cell: {
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    margin: CELL_MARGIN,
  },
  number: {
    fontSize: 16,
    fontWeight: "bold",
    color: DARK_TEAL,
  },
  blinkingCellBorder: {
    borderWidth: 2,
    borderColor: WARNING_ORANGE,
  },
  blinkingOverlay: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  ticketsHint: {
    fontSize: 11,
    color: MUTED_GOLD,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  emptyTicketsContainer: {
    alignItems: "center",
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 14,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginTop: 12,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
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
    paddingHorizontal: 20,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 14,
    width: '85%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: DARK_TEAL,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT_ACCENT,
  },
  menuHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshMenuButton: {
    padding: 5,
  },
  patternsMenuScroll: {
    maxHeight: 300,
  },
  patternMenuItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  disabledPatternItem: {
    backgroundColor: DARK_TEAL,
    opacity: 0.7,
  },
  patternMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternMenuItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  patternMenuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_ACCENT,
    marginBottom: 3,
  },
  patternMenuItemDesc: {
    fontSize: 12,
    color: MUTED_GOLD,
  },
  patternStatusContainer: {
    marginLeft: 6,
  },
  patternLimitText: {
    color: WARNING_ORANGE,
    fontWeight: '600',
  },
  limitReachedText: {
    color: ERROR_RED,
    fontWeight: '700',
  },
  claimedBadge: {
    fontSize: 11,
    color: SUCCESS_GREEN,
    fontWeight: '600',
    marginLeft: 4,
  },
  limitReachedBadge: {
    fontSize: 11,
    color: ERROR_RED,
    fontWeight: '600',
    marginLeft: 4,
  },
  noPatternsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noPatternsText: {
    fontSize: 14,
    color: MUTED_GOLD,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DARK_TEAL,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 13,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  disabledPatternName: {
    color: MUTED_GOLD,
    textDecorationLine: 'none',
  },
  disabledPatternDesc: {
    color: '#ADB5BD',
  },
  patternsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternsModalContainer: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    width: '90%',
    maxHeight: '75%',
    overflow: 'hidden',
  },
  patternsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: DARK_TEAL,
  },
  patternsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LIGHT_ACCENT,
  },
  patternsModalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshPatternsButton: {
    padding: 5,
  },
  patternsModalCloseButton: {
    padding: 5,
  },
  patternsModalSubtitle: {
    fontSize: 14,
    color: MUTED_GOLD,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_TEAL,
  },
  currentBlinkingPatternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WARNING_ORANGE,
  },
  currentBlinkingPatternText: {
    fontSize: 13,
    color: MUTED_GOLD,
    marginLeft: 8,
    flex: 1,
  },
  currentBlinkingPatternName: {
    fontWeight: '700',
    color: WARNING_ORANGE,
  },
  stopBlinkingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: ERROR_RED,
    gap: 4,
  },
  stopBlinkingText: {
    fontSize: 12,
    color: ERROR_RED,
    fontWeight: '600',
  },
  earlyFiveNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  earlyFiveNoteText: {
    fontSize: 13,
    color: MUTED_GOLD,
    marginLeft: 8,
    flex: 1,
  },
  earlyFiveNoteBold: {
    fontWeight: '700',
    color: ACCENT_COLOR,
  },
  patternsLoadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  patternsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED_GOLD,
  },
  patternsList: {
    maxHeight: 350,
  },
  patternListItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  selectedPatternListItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_COLOR,
  },
  patternListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternListItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  patternListItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_ACCENT,
    marginBottom: 3,
  },
  patternListItemDesc: {
    fontSize: 12,
    color: MUTED_GOLD,
  },
  selectedBadge: {
    fontSize: 12,
    color: SUCCESS_GREEN,
    fontWeight: '600',
    marginLeft: 4,
  },
  noAvailablePatternsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noAvailablePatternsText: {
    fontSize: 14,
    color: MUTED_GOLD,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  patternsModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: DARK_TEAL,
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 4,
  },
  clearSelectionButtonText: {
    fontSize: 13,
    color: MUTED_GOLD,
    fontWeight: '600',
  },
  closePatternsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8,
  },
  closePatternsButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  winningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  celebrationContent: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: WARNING_ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: WARNING_ORANGE,
  },
  celebrationInner: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  trophyIcon: {
    marginBottom: 8,
    shadowColor: WARNING_ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  winningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: ERROR_RED,
    textAlign: 'center',
    marginBottom: 10,
  },
  winnerInfo: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    width: '100%',
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: LIGHT_ACCENT,
    marginBottom: 4,
    textAlign: 'center',
  },
  winnerPattern: {
    fontSize: 13,
    color: ERROR_RED,
    fontWeight: '600',
    textAlign: 'center',
  },
  prizeAmountContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ERROR_RED,
    width: '100%',
  },
  prizeAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: ERROR_RED,
    marginBottom: 4,
  },
  prizeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED_GOLD,
    letterSpacing: 1,
  },
  celebrationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WARNING_ORANGE,
  },
  celebrationText: {
    fontSize: 13,
    fontWeight: '800',
    color: LIGHT_ACCENT,
    marginHorizontal: 6,
  },
  closeCelebrationButton: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: SECONDARY_COLOR,
    width: '100%',
    alignItems: 'center',
  },
  closeCelebrationText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
  confettiParticle: {
    width: 6,
    height: 6,
    borderRadius: 1,
    position: 'absolute',
    top: -50,
  },
  gameEndModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confettiImage: {
    width: 150,
    height: 150,
    opacity: 0.7,
  },
  gameEndModalContent: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  gameEndModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameEndTrophy: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  gameEndModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: WARNING_ORANGE,
    textAlign: 'center',
  },
  gameEndModalBody: {
    marginBottom: 20,
  },
  gameEndCongratulations: {
    fontSize: 20,
    fontWeight: '800',
    color: ACCENT_COLOR,
    textAlign: 'center',
    marginBottom: 10,
  },
  gameEndMessage: {
    fontSize: 14,
    color: MUTED_GOLD,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  gameEndStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: DARK_TEAL,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  endStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  endStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: LIGHT_ACCENT,
    marginBottom: 4,
  },
  endStatLabel: {
    fontSize: 11,
    color: MUTED_GOLD,
    fontWeight: '600',
  },
  gameEndThanks: {
    fontSize: 13,
    color: LIGHT_ACCENT,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  gameEndModalFooter: {
    gap: 10,
  },
  viewWinnersButton: {
    backgroundColor: WARNING_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewWinnersButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: DARK_TEAL,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  closeButtonText: {
    color: MUTED_GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT_ACCENT,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: MUTED_GOLD,
    marginBottom: 20,
    lineHeight: 18,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 10,
  },
  selectedVoiceOption: {
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  voiceOptionIcon: {
    marginRight: 12,
  },
  voiceOptionInfo: {
    flex: 1,
  },
  voiceOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_ACCENT,
    marginBottom: 2,
  },
  voiceOptionDesc: {
    fontSize: 12,
    color: MUTED_GOLD,
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  testVoiceButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  loadingSpinner: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: LIGHT_ACCENT,
    fontWeight: "500",
    marginTop: 20,
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chatButtonContent: {
    position: 'relative',
    marginRight: 6,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ERROR_RED,
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
  },
  chatBadgeText: {
    color: SECONDARY_COLOR,
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
  chatButtonText: {
    color: SECONDARY_COLOR,
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 20,
  },
  snackbar: {
    borderRadius: 6,
    margin: 12,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarIcon: {
    marginRight: 6,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});

export default UserGameRoom;