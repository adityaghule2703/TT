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

const { width, height } = Dimensions.get("window");
const TICKET_WIDTH = width - 32;
const CELL_SIZE = Math.max(28, Math.min((TICKET_WIDTH - 40) / 9, 32));
const TICKET_GRID_HEIGHT = CELL_SIZE * 3;

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
  const announcedClaimIds = useRef(new Set()); // Track announced claims
  const isSubmittingClaimRef = useRef(false); // Prevent multiple submissions

  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const celebrationTranslateY = useRef(new Animated.Value(50)).current;
  const confettiTranslateY = useRef([]);

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    confettiTranslateY.current = Array(15).fill().map(() => new Animated.Value(-50));
    startAnimations();
  }, []);

  const PRIMARY_COLOR = "#4A90E2";
  const SUCCESS_COLOR = "#27AE60";
  const WARNING_COLOR = "#F39C12";
  const DANGER_COLOR = "#E74C3C";
  const GRAY_COLOR = "#6C757D";
  const LIGHT_GRAY = "#F8F9FA";
  const BORDER_COLOR = "#E9ECEF";
  const BACKGROUND_COLOR = "#FFFFFF";
  const SECONDARY_COLOR = "#5DADE2";
  const LIGHT_BLUE = "#F0F8FF";

  const EMPTY_CELL_BG = "#F5F5F5";
  const EMPTY_CELL_BORDER = "#E0E0E0";
  const FILLED_CELL_BG = "#FFF9C4";
  const FILLED_CELL_BORDER = "#FFD600";
  const CELL_TEXT_COLOR = "#2C3E50";
  const MARKED_CELL_BG = "#E74C3C";
  const MARKED_CELL_BORDER = "#C0392B";

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
  };

  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
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
        
        // Clear announced claims when claims list is reset
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
    
    // Skip if this claim was already announced
    if (announcedClaimIds.current.has(claim.id)) {
      return;
    }
    
    // Mark this claim as announced
    announcedClaimIds.current.add(claim.id);
    
    // Clean up old claim IDs after some time
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
        toValue: height + 50,
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
            <Ionicons name="expand" size={14} color={PRIMARY_COLOR} />
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
                        <Ionicons name="star" size={8} color={WARNING_COLOR} />
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
      <View style={[styles.ticketGridContainer, { 
        height: TICKET_GRID_HEIGHT + 8,
        marginBottom: 4
      }]}>
        {processedData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
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
                cellBorderColor = EMPTY_CELL_BORDER;
                textColor = "transparent";
              } else if (isMarked) {
                cellBackgroundColor = MARKED_CELL_BG;
                cellBorderColor = MARKED_CELL_BORDER;
                textColor = "#FFFFFF";
              } else {
                cellBackgroundColor = FILLED_CELL_BG;
                cellBorderColor = FILLED_CELL_BORDER;
                textColor = CELL_TEXT_COLOR;
              }
              
              return (
                <TouchableOpacity
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
                              backgroundColor: WARNING_COLOR,
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
                            styles.cellNumber, 
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
                        <Text style={[styles.cellNumber, { color: textColor }]}>
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
            <Ionicons name="eye-outline" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.viewPatternsButtonText}>Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => openMenu(item.id)}
            ref={el => menuRefs.current[index] = el}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={GRAY_COLOR} />
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
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  ) : (
                    <Ionicons name="refresh" size={20} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={closeMenu}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.patternsMenuScroll}>
              {loadingPatterns ? (
                <View style={styles.patternsLoadingContainer}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text style={styles.patternsLoadingText}>Loading patterns...</Text>
                </View>
              ) : patternsForClaim.length === 0 ? (
                <View style={styles.noPatternsContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color={WARNING_COLOR} />
                  <Text style={styles.noPatternsText}>No patterns available for this game</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefreshPatterns}
                  >
                    <Ionicons name="refresh" size={16} color={PRIMARY_COLOR} />
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
                          color={isClaimed ? SUCCESS_COLOR : (isLimitReached ? DANGER_COLOR : SECONDARY_COLOR)} 
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
                          <ActivityIndicator size="small" color={SECONDARY_COLOR} />
                        ) : (
                          <View style={styles.patternStatusContainer}>
                            {isDisabled && !isClaimed && (
                              <Ionicons name="lock-closed" size={16} color={DANGER_COLOR} />
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
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="refresh" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setShowPatternsModal(false);
                    stopAllBlinking();
                  }}
                  style={styles.patternsModalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.patternsModalSubtitle}>
              Tap on a pattern to see it highlighted on ALL your tickets for 5 seconds
            </Text>
            
            {blinkingPattern && (
              <View style={styles.currentBlinkingPatternContainer}>
                <Ionicons name="star" size={18} color={WARNING_COLOR} />
                <Text style={styles.currentBlinkingPatternText}>
                  Showing: <Text style={styles.currentBlinkingPatternName}>{blinkingPattern.display_name}</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stopBlinkingButton}
                  onPress={stopAllBlinking}
                >
                  <Ionicons name="stop-circle" size={16} color={DANGER_COLOR} />
                  <Text style={styles.stopBlinkingText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.earlyFiveNoteContainer}>
              <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
              <Text style={styles.earlyFiveNoteText}>
                <Text style={styles.earlyFiveNoteBold}>Early Five pattern:</Text> Shows the first 5 called numbers on each ticket
              </Text>
            </View>
            
            {loadingPatterns ? (
              <View style={styles.patternsLoadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.patternsLoadingText}>Loading patterns...</Text>
              </View>
            ) : (
              <ScrollView style={styles.patternsList} showsVerticalScrollIndicator={false}>
                {availablePatterns.length === 0 ? (
                  <View style={styles.noAvailablePatternsContainer}>
                    <Ionicons name="alert-circle-outline" size={40} color={WARNING_COLOR} />
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
                            color={isSelected ? WARNING_COLOR : PRIMARY_COLOR} 
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
                              <Ionicons name="checkmark-circle" size={22} color={SUCCESS_COLOR} />
                            ) : (
                              <Ionicons name="eye" size={18} color={PRIMARY_COLOR} />
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
                <Ionicons name="refresh" size={16} color={GRAY_COLOR} />
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
                  backgroundColor: [DANGER_COLOR, PRIMARY_COLOR, WARNING_COLOR, SUCCESS_COLOR][index % 4],
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
              <Ionicons name="trophy" size={40} color={WARNING_COLOR} style={styles.trophyIcon} />
              
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
                <Ionicons name="sparkles" size={16} color={WARNING_COLOR} />
                <Text style={styles.celebrationText}>CONGRATULATIONS!</Text>
                <Ionicons name="sparkles" size={16} color={WARNING_COLOR} />
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
        return { backgroundColor: SUCCESS_COLOR };
      case 'error':
        return { backgroundColor: DANGER_COLOR };
      case 'warning':
        return { backgroundColor: WARNING_COLOR };
      default:
        return { backgroundColor: PRIMARY_COLOR };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrapper}>
            <MaterialIcons name="confirmation-number" size={40} color={PRIMARY_COLOR} />
          </View>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading Game Room...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#5DADE2" barStyle="light-content" />

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
                <Ionicons name="trophy" size={20} color="#FFF" />
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
                <Ionicons name="close" size={24} color={GRAY_COLOR} />
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
                  color={voiceType === 'female' ? PRIMARY_COLOR : GRAY_COLOR} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Female Voice</Text>
                <Text style={styles.voiceOptionDesc}>Higher pitch, clear pronunciation</Text>
              </View>
              {voiceType === 'female' && (
                <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
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
                  color={voiceType === 'male' ? PRIMARY_COLOR : GRAY_COLOR} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Male Voice</Text>
                <Text style={styles.voiceOptionDesc}>Lower pitch, deeper tone</Text>
              </View>
              {voiceType === 'male' && (
                <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
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
              <Ionicons name="volume-high" size={20} color="#FFF" />
              <Text style={styles.testVoiceButtonText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderPatternMenu()}

      <View style={styles.header}>
        <View style={styles.headerPattern}>
          <View style={styles.headerCloud1} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>Game Room</Text>
              <View style={styles.gameInfoContainer}>
                <Ionicons name="game-controller" size={14} color="rgba(255,255,255,0.8)" />
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
                <Ionicons name={voiceType === 'male' ? "male" : "female"} size={16} color="#FFF" />
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
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            {calledNumbers.length > 0 ? (
              <View style={styles.compactNumberDisplay}>
                <View style={styles.lastNumberLeft}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={{ uri: GAME_IMAGES.megaphone }}
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>Last Called</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.compactLastNumberContainer}
                    onPress={() => speakNumber(calledNumbers[calledNumbers.length - 1])}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.compactLastNumber}>
                      {calledNumbers[calledNumbers.length - 1]}
                    </Text>
                    <Text style={styles.compactLastNumberLabel}>
                      {calledNumbers.length >= 90 || gameStatus?.status === 'completed'
                        ? "Game Completed" 
                        : `Tap to hear`}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentNumbersRight}>
                  <View style={styles.sectionHeader}>
                    <Image
                      source={{ uri: GAME_IMAGES.numbers }}
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>Recent</Text>
                    <TouchableOpacity
                      style={styles.voiceIndicator}
                      onPress={() => setShowVoiceModal(true)}
                    >
                      <Ionicons 
                        name={voiceType === 'male' ? "male" : "female"} 
                        size={14} 
                        color={PRIMARY_COLOR} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.recentNumbersGrid}>
                    {calledNumbers.slice(-4).reverse().map((num, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.numberChip,
                          index === 0 && styles.latestChip
                        ]}
                        onPress={() => speakNumber(num)}
                      >
                        <Text style={[
                          styles.numberChipText,
                          index === 0 && styles.latestChipText
                        ]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    {calledNumbers.length > 4 && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={handleViewAllCalledNumbers}
                      >
                        <Text style={styles.viewMoreText}>More</Text>
                        <Ionicons name="chevron-forward" size={12} color={PRIMARY_COLOR} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.waitingSection}>
                <Ionicons name="hourglass-outline" size={32} color={WARNING_COLOR} />
                <Text style={styles.waitingText}>
                  Waiting for numbers to be called...
                </Text>
              </View>
            )}
          </View>

          {renderAllCalledNumbersSection()}

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
                    <Ionicons name="star" size={14} color={WARNING_COLOR} />
                    <Text style={styles.activePatternText}>
                      Showing: <Text style={styles.activePatternName}>{blinkingPattern.display_name}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.stopBlinkingSmallButton}
                      onPress={stopAllBlinking}
                    >
                      <Ionicons name="close" size={12} color={DANGER_COLOR} />
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
                  Tap numbers to mark/unmark them • Long press to hear number • Tap Patterns to view • Tap ⋮ to submit claim
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
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
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
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  content: {
    padding: 12,
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
  cloud1: {
    position: 'absolute',
    top: 40,
    left: width * 0.1,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cloud2: {
    position: 'absolute',
    top: 80,
    right: width * 0.15,
    width: 60,
    height: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#5DADE2",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    top: 15,
    left: 20,
    width: 60,
    height: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTopRow: {
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  gameInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  gameName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 4,
  },
  voiceButtonText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    shadowColor: "#4A90E2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  compactNumberDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  lastNumberLeft: {
    flex: 1,
    minWidth: 110,
  },
  recentNumbersRight: {
    flex: 1,
    minWidth: 110,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  sectionIcon: {
    width: 18,
    height: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4682B4",
  },
  voiceIndicator: {
    marginLeft: 'auto',
    padding: 3,
  },
  compactLastNumberContainer: {
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  compactLastNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#4A90E2",
    marginBottom: 4,
  },
  compactLastNumberLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: 'center',
  },
  recentNumbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  numberChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  latestChip: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  numberChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
  },
  latestChipText: {
    color: "#FFFFFF",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A90E2",
    gap: 4,
    height: 38,
    minWidth: 80,
  },
  viewMoreText: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "600",
  },
  waitingSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: "#F39C12",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  allNumbersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    shadowColor: '#4A90E2',
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
    color: '#4682B4',
  },
  calledCountBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  calledCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewAllGridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  viewAllGridButtonText: {
    fontSize: 12,
    color: '#4A90E2',
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
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 2,
    position: 'relative',
  },
  calledNumberItem: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  latestNumberItem: {
    backgroundColor: '#F39C12',
    borderColor: '#F39C12',
    borderWidth: 2,
  },
  numberItemTextCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6C757D',
  },
  calledNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  latestNumberText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  latestIndicatorCompact: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
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
    borderTopColor: '#E9ECEF',
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
    borderColor: '#E9ECEF',
  },
  legendNormal: {
    backgroundColor: '#F8F9FA',
  },
  legendCalled: {
    backgroundColor: '#27AE60',
  },
  legendLatest: {
    backgroundColor: '#F39C12',
  },
  legendText: {
    fontSize: 10,
    color: '#6C757D',
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
    borderColor: '#F39C12',
  },
  activePatternText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 6,
    flex: 1,
  },
  activePatternName: {
    fontWeight: '700',
    color: '#F39C12',
  },
  stopBlinkingSmallButton: {
    padding: 3,
  },
  ticketsList: {
    gap: 16,
  },
  ticketWrapper: {
    marginBottom: 6,
  },
  ticketItemContainer: {
    marginBottom: 4,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    color: "#6C757D",
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    gap: 4,
  },
  viewPatternsButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: "600",
  },
  menuButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ticketCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: 12,
  paddingBottom: 10,
  borderWidth: 0,
  position: 'relative',
  overflow: 'hidden',
  shadowColor: "#4A90E2",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 6,
  minHeight: 124,
},
  ticketGridContainer: {
  overflow: 'hidden',
  borderRadius: 6,
  alignSelf: 'center',
  marginHorizontal: 2,
},
 ticketRow: {
  flexDirection: "row",
  justifyContent: "center",
  marginBottom: 2,
},
  ticketCell: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 2,
  },
  emptyCell: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  filledCell: {
    backgroundColor: "#FFF9C4",
    borderColor: "#FFD600",
  },
  markedCell: {
    backgroundColor: "#E74C3C",
    borderColor: "#C0392B",
  },
  cellNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  blinkingCellBorder: {
    borderWidth: 3,
    borderColor: '#F39C12',
  },
  blinkingOverlay: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  ticketsHint: {
    fontSize: 11,
    color: "#6C757D",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  emptyTicketsContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    marginTop: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4682B4",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#4A90E2',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderBottomColor: '#E9ECEF',
  },
  disabledPatternItem: {
    backgroundColor: '#F8F9FA',
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
    color: '#212529',
    marginBottom: 3,
  },
  patternMenuItemDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  patternStatusContainer: {
    marginLeft: 6,
  },
  patternLimitText: {
    color: '#F39C12',
    fontWeight: '600',
  },
  limitReachedText: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  claimedBadge: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 4,
  },
  limitReachedBadge: {
    fontSize: 11,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 4,
  },
  noPatternsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noPatternsText: {
    fontSize: 14,
    color: '#6C757D',
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
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    gap: 6,
  },
  retryButtonText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  disabledPatternName: {
    color: '#6C757D',
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#4A90E2',
  },
  patternsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
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
    borderColor: '#F39C12',
  },
  currentBlinkingPatternText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  currentBlinkingPatternName: {
    fontWeight: '700',
    color: '#F39C12',
  },
  stopBlinkingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E74C3C',
    gap: 4,
  },
  stopBlinkingText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  earlyFiveNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  earlyFiveNoteText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  earlyFiveNoteBold: {
    fontWeight: '700',
    color: '#4A90E2',
  },
  patternsLoadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  patternsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  patternsList: {
    maxHeight: 350,
  },
  patternListItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  selectedPatternListItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
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
    color: '#212529',
    marginBottom: 3,
  },
  patternListItemDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  selectedBadge: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 4,
  },
  noAvailablePatternsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noAvailablePatternsText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  patternsModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 4,
  },
  clearSelectionButtonText: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '600',
  },
  closePatternsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  closePatternsButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#F39C12',
  },
  celebrationInner: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  trophyIcon: {
    marginBottom: 8,
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  winningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 10,
  },
  winnerInfo: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    width: '100%',
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  winnerPattern: {
    fontSize: 13,
    color: '#E74C3C',
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
    borderColor: '#E74C3C',
    width: '100%',
  },
  prizeAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E74C3C',
    marginBottom: 4,
  },
  prizeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C757D',
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
    borderColor: '#F39C12',
  },
  celebrationText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#212529',
    marginHorizontal: 6,
  },
  closeCelebrationButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
  },
  closeCelebrationText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E9ECEF',
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
    color: '#F39C12',
    textAlign: 'center',
  },
  gameEndModalBody: {
    marginBottom: 20,
  },
  gameEndCongratulations: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameEndMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  gameEndStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  endStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  endStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#212529',
    marginBottom: 4,
  },
  endStatLabel: {
    fontSize: 11,
    color: '#6C757D',
    fontWeight: '600',
  },
  gameEndThanks: {
    fontSize: 13,
    color: '#212529',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  gameEndModalFooter: {
    gap: 10,
  },
  viewWinnersButton: {
    backgroundColor: '#F39C12',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewWinnersButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  closeButtonText: {
    color: '#6C757D',
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
    backgroundColor: '#FFFFFF',
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
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 20,
    lineHeight: 18,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 10,
  },
  selectedVoiceOption: {
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
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
    color: '#212529',
    marginBottom: 2,
  },
  voiceOptionDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  testVoiceButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  loadingSpinner: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: 15,
    color: "#4682B4",
    fontWeight: "500",
    marginTop: 16,
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#4A90E2',
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
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
  chatButtonText: {
    color: '#FFF',
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