// import React, { useState, useEffect, useRef } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   RefreshControl,
//   Image,
//   Modal,
//   Animated,
//   Easing,
// } from "react-native";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import * as Speech from 'expo-speech';
// import { Snackbar } from 'react-native-paper';

// const { width, height } = Dimensions.get("window");
// const TICKET_WIDTH = width - 24;
// const CELL_SIZE = Math.min((TICKET_WIDTH - 16) / 9, 50);
// const TICKET_GRID_HEIGHT = CELL_SIZE * 3;

// const UserGameRoom = ({ navigation, route }) => {
//   const { gameId, gameName } = route.params;
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [gameStatus, setGameStatus] = useState(null);
//   const [callingStatus, setCallingStatus] = useState(null);
//   const [calledNumbers, setCalledNumbers] = useState([]);
//   const [myTickets, setMyTickets] = useState([]);
//   const [isChatJoined, setIsChatJoined] = useState(false);
//   const [participantCount, setParticipantCount] = useState(0);
//   const [markingLoading, setMarkingLoading] = useState(false);
//   const [voiceType, setVoiceType] = useState('female');
//   const [showVoiceModal, setShowVoiceModal] = useState(false);
//   const [showGameEndModal, setShowGameEndModal] = useState(false);
//   const [gameCompleted, setGameCompleted] = useState(false);
//   const [claims, setClaims] = useState([]);
//   const [snackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarType, setSnackbarType] = useState('info');
//   const [initialClaimsFetched, setInitialClaimsFetched] = useState(false);
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const [patternRewards, setPatternRewards] = useState([]);
//   const [submittingClaim, setSubmittingClaim] = useState(false);
//   const [showWinningCelebration, setShowWinningCelebration] = useState(false);
//   const [winningMessage, setWinningMessage] = useState('');
//   const [winningUser, setWinningUser] = useState('');
//   const [winningAmount, setWinningAmount] = useState(0);
//   const [winningPattern, setWinningPattern] = useState('');
  
//   // New state for tracking patterns per ticket
//   const [patternsByTicket, setPatternsByTicket] = useState({}); // { ticketId: { [patternId]: { count: 1, status: 'approved' | 'pending' | 'rejected' } } }
//   const [totalPatternCounts, setTotalPatternCounts] = useState({}); // { patternId: { claimed: 0, total: 5 } }
  
//   const lastCalledRef = useRef(null);
//   const confettiAnimation = useRef(new Animated.Value(0)).current;
//   const claimsRef = useRef([]);
//   const menuRefs = useRef([]);
//   const lastApprovedClaimRef = useRef(null);
//   const audioEnabled = useRef(true);

//   // Celebration animations - using transform instead of top/left
//   const celebrationOpacity = useRef(new Animated.Value(0)).current;
//   const celebrationScale = useRef(new Animated.Value(0.5)).current;
//   const celebrationTranslateY = useRef(new Animated.Value(50)).current;
//   const confettiTranslateY = useRef([]);

//   // Initialize confetti animations
//   useEffect(() => {
//     confettiTranslateY.current = Array(20).fill().map(() => new Animated.Value(-50));
//   }, []);

//   const GAME_IMAGES = {
//     ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
//     diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
//     celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
//     empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
//     pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
//     live: "https://cdn-icons-png.flaticon.com/512/2809/2809645.png",
//     users: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
//     megaphone: "https://cdn-icons-png.flaticon.com/512/2599/2599562.png",
//     trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
//     voice: "https://cdn-icons-png.flaticon.com/512/727/727240.png",
//     confetti: "https://cdn-icons-png.flaticon.com/512/2821/2821812.png",
//     numbers: "https://cdn-icons-png.flaticon.com/512/3884/3884344.png",
//     claim: "https://cdn-icons-png.flaticon.com/512/1006/1006581.png",
//     firework: "https://cdn-icons-png.flaticon.com/512/599/599499.png",
//     star: "https://cdn-icons-png.flaticon.com/512/1828/1828970.png",
//   };

//   const PRIMARY_COLOR = "#40E0D0";
//   const SUCCESS_COLOR = "#4CAF50";
//   const WARNING_COLOR = "#FFD700";
//   const DANGER_COLOR = "#FF5252";
//   const GRAY_COLOR = "#6C757D";
//   const LIGHT_GRAY = "#F8F9FA";
//   const BORDER_COLOR = "#E9ECEF";
//   const BACKGROUND_COLOR = "#FFFFFF";
//   const SECONDARY_COLOR = "#FF6B35";

//   useEffect(() => {
//     if (calledNumbers.length >= 90 && !gameCompleted) {
//       setGameCompleted(true);
//       setTimeout(() => {
//         setShowGameEndModal(true);
//         startConfettiAnimation();
//       }, 1000);
//     }
//   }, [calledNumbers]);

//   useEffect(() => {
//     fetchGameStatus();
//     fetchMyTickets();
//     checkChatStatus();
//     fetchClaims();
//     fetchPatternRewards();

//     const statusInterval = setInterval(fetchGameStatus, 3000);
//     const claimsInterval = setInterval(fetchClaims, 3000);

//     return () => {
//       clearInterval(statusInterval);
//       clearInterval(claimsInterval);
//       Speech.stop();
//       stopConfettiAnimation();
//       stopWinningCelebration();
//     };
//   }, []);

//   useEffect(() => {
//     claimsRef.current = claims;
//   }, [claims]);

//   // Helper function to process claims and update pattern counts
//   const updatePatternCounts = (claimsData) => {
//     const ticketPatterns = {};
//     const patternCounts = {};

//     // Initialize pattern counts from patternRewards
//     patternRewards.forEach(pattern => {
//       patternCounts[pattern.pattern_id] = {
//         claimed: 0,
//         total: pattern.limit_count || 0, // Get limit from pattern rewards
//         patternName: pattern.reward_name,
//       };
//     });

//     // Process claims
//     claimsData.forEach(claim => {
//       const ticketId = claim.ticket_id;
//       const patternId = claim.game_pattern_id;
      
//       if (!ticketId || !patternId) return;

//       // Initialize ticket entry if not exists
//       if (!ticketPatterns[ticketId]) {
//         ticketPatterns[ticketId] = {};
//       }

//       // Add pattern to ticket's claimed patterns (only count approved/pending)
//       if (claim.claim_status === 'approved' || claim.claim_status === 'pending') {
//         ticketPatterns[ticketId][patternId] = {
//           count: (ticketPatterns[ticketId][patternId]?.count || 0) + 1,
//           status: claim.claim_status,
//         };

//         // Update global pattern count for approved claims only
//         if (claim.claim_status === 'approved' && patternCounts[patternId]) {
//           patternCounts[patternId].claimed += 1;
//         }
//       }
//     });

//     setPatternsByTicket(ticketPatterns);
//     setTotalPatternCounts(patternCounts);
//   };

//   const fetchPatternRewards = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/games",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         const games = response.data.games.data;
//         const currentGame = games.find((game) => game.id === parseInt(gameId));

//         if (currentGame && currentGame.pattern_rewards) {
//           setPatternRewards(currentGame.pattern_rewards);
          
//           // Initialize pattern counts
//           const initialCounts = {};
//           currentGame.pattern_rewards.forEach(pattern => {
//             initialCounts[pattern.pattern_id] = {
//               claimed: 0,
//               total: pattern.limit_count || 0,
//               patternName: pattern.reward_name,
//             };
//           });
//           setTotalPatternCounts(initialCounts);
//         }
//       }
//     } catch (error) {
//       console.log("Error fetching pattern rewards:", error);
//     }
//   };

//   const fetchClaims = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.get(
//         `https://exilance.com/tambolatimez/public/api/user/claims/game/${gameId}/claims`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         const newClaims = response.data.data.claims || [];
//         const previousClaims = claimsRef.current;
        
//         // Update pattern counts
//         updatePatternCounts(newClaims);
        
//         // Check for new or updated claims
//         const notifications = [];
        
//         newClaims.forEach(newClaim => {
//           const oldClaim = previousClaims.find(old => old.id === newClaim.id);
          
//           if (!oldClaim) {
//             // New claim submission
//             if (newClaim.claim_status === 'pending') {
//               notifications.push({
//                 type: 'new_claim',
//                 claim: newClaim,
//                 message: `🎉 ${newClaim.user_name} submitted a ${newClaim.reward_name} claim!`
//               });
//             }
//           } else {
//             // Check for status changes
//             if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'approved') {
//               // Claim got approved - WINNER!
//               notifications.push({
//                 type: 'claim_approved',
//                 claim: newClaim,
//                 message: `🏆 ${newClaim.user_name} WON ₹${newClaim.winning_amount} for ${newClaim.reward_name}! CONGRATULATIONS! 🎊`
//               });
//             } else if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'rejected') {
//               // Claim got rejected
//               notifications.push({
//                 type: 'claim_rejected',
//                 claim: newClaim,
//                 message: `❌ ${newClaim.user_name}'s ${newClaim.reward_name} claim was rejected`
//               });
//             }
//           }
//         });
        
//         // Show notifications with delays to prevent overlapping
//         if (notifications.length > 0) {
//           notifications.forEach((notification, index) => {
//             setTimeout(() => {
//               showNotification(notification);
//             }, index * 1500);
//           });
//         }
        
//         setClaims(newClaims);
        
//         if (!initialClaimsFetched) {
//           setInitialClaimsFetched(true);
//         }
//       }
//     } catch (error) {
//       console.log("Error fetching claims:", error);
//     }
//   };

//   const showNotification = (notification) => {
//     const { type, claim, message } = notification;
    
//     // Set snackbar type based on notification type
//     if (type === 'claim_approved') {
//       setSnackbarType('success');
//       startWinnerCelebration(claim);
//     } else if (type === 'claim_rejected') {
//       setSnackbarType('error');
//     } else {
//       setSnackbarType('info');
//     }
    
//     setSnackbarMessage(message);
//     setSnackbarVisible(true);
    
//     // Speak announcement
//     if (audioEnabled.current) {
//       setTimeout(() => {
//         speakClaimAnnouncement(claim, type);
//       }, 500);
//     }
//   };

//   const startWinnerCelebration = (claim) => {
//     setWinningMessage(`🏆 WINNER! 🏆`);
//     setWinningUser(claim.user_name);
//     setWinningAmount(claim.winning_amount);
//     setWinningPattern(claim.reward_name);
    
//     // Reset animations
//     celebrationOpacity.setValue(0);
//     celebrationScale.setValue(0.5);
//     celebrationTranslateY.setValue(50);

//     // Show celebration
//     setShowWinningCelebration(true);

//     // Animate in
//     Animated.parallel([
//       Animated.timing(celebrationOpacity, {
//         toValue: 1,
//         duration: 300,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//       Animated.timing(celebrationScale, {
//         toValue: 1,
//         duration: 400,
//         easing: Easing.out(Easing.back(1.5)),
//         useNativeDriver: true,
//       }),
//       Animated.timing(celebrationTranslateY, {
//         toValue: 0,
//         duration: 400,
//         easing: Easing.out(Easing.back(1.5)),
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Start confetti animation
//     startConfettiAnimationCelebration();

//     // Auto close after 2 seconds
//     setTimeout(() => {
//       stopWinningCelebration();
//     }, 2000);
//   };

//   const startConfettiAnimationCelebration = () => {
//     confettiTranslateY.current.forEach((anim, index) => {
//       anim.setValue(-50);
//       Animated.timing(anim, {
//         toValue: height + 50,
//         duration: 1500 + Math.random() * 1000,
//         delay: index * 100,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       }).start();
//     });
//   };

//   const stopWinningCelebration = () => {
//     Animated.parallel([
//       Animated.timing(celebrationOpacity, {
//         toValue: 0,
//         duration: 300,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//       Animated.timing(celebrationScale, {
//         toValue: 0.5,
//         duration: 300,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//       Animated.timing(celebrationTranslateY, {
//         toValue: 50,
//         duration: 300,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setShowWinningCelebration(false);
//     });
//   };

//   const speakClaimAnnouncement = (claim, type) => {
//     let announcement = '';
    
//     if (type === 'claim_approved') {
//       announcement = `Congratulations! ${claim.user_name} has won ${claim.winning_amount} rupees for completing the ${claim.reward_name} pattern! Tambola!`;
      
//       Speech.speak(announcement, {
//         language: 'en-US',
//         pitch: voiceType === 'male' ? 0.9 : 1.2,
//         rate: 0.9,
//         volume: 1.0,
//       });
      
//       setTimeout(() => {
//         const celebration = "Congratulations to the winner!";
//         Speech.speak(celebration, {
//           language: 'en-US',
//           pitch: voiceType === 'male' ? 1.0 : 1.3,
//           rate: 1.0,
//           volume: 1.0,
//         });
//       }, 3000);
      
//     } else if (type === 'new_claim') {
//       const claimMessage = `${claim.user_name} has submitted a ${claim.reward_name} claim!`;
      
//       Speech.speak(claimMessage, {
//         language: 'en-US',
//         pitch: voiceType === 'male' ? 0.8 : 1.0,
//         rate: 0.8,
//       });

//       setTimeout(() => {
//         const tambolaAnnouncement = "Tambola!";
//         Speech.speak(tambolaAnnouncement, {
//           language: 'en-US',
//           pitch: voiceType === 'male' ? 0.9 : 1.2,
//           rate: 0.9,
//           volume: 1.0,
//         });
//       }, 1500);
//     } else if (type === 'claim_rejected') {
//       const rejectionMessage = `${claim.user_name}'s ${claim.reward_name} claim has been rejected.`;
      
//       Speech.speak(rejectionMessage, {
//         language: 'en-US',
//         pitch: voiceType === 'male' ? 0.8 : 1.0,
//         rate: 0.8,
//       });
//     }
//   };

//   const submitClaim = async (ticketId, pattern) => {
//     if (submittingClaim) return;
    
//     try {
//       setSubmittingClaim(true);
//       const token = await AsyncStorage.getItem("token");
      
//       const ticket = myTickets.find(t => t.id === ticketId);
//       if (!ticket) {
//         showSnackbar("Ticket not found", 'error');
//         return;
//       }

//       // Check if pattern can be claimed for this ticket
//       const ticketPatterns = patternsByTicket[ticketId] || {};
//       const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
//       if (patternOnTicket && patternOnTicket.status !== 'rejected') {
//         showSnackbar(`You have already claimed ${pattern.reward_name} on this ticket`, 'error');
//         return;
//       }

//       // Check if pattern limit is reached globally
//       const patternCount = totalPatternCounts[pattern.pattern_id];
//       if (patternCount && patternCount.total > 0 && patternCount.claimed >= patternCount.total) {
//         showSnackbar(`${pattern.reward_name} claim limit reached (${patternCount.claimed}/${patternCount.total})`, 'error');
//         return;
//       }

//       const response = await axios.post(
//         "https://exilance.com/tambolatimez/public/api/user/claims/submit",
//         {
//           game_id: parseInt(gameId),
//           ticket_id: parseInt(ticketId),
//           reward_name: pattern.reward_name,
//           claim_evidence: `Pattern ${pattern.pattern_id} completed on ticket ${ticket.ticket_number}`,
//           game_pattern_id: pattern.pattern_id,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         showSnackbar(`Claim submitted for ${pattern.reward_name}! Waiting for approval.`, 'info');
//         fetchClaims();
//       } else {
//         showSnackbar(response.data.message || "Failed to submit claim", 'error');
//       }
//     } catch (error) {
//       console.log("Error submitting claim:", error);
//       let errorMessage = "Failed to submit claim. Please try again.";

//       if (error.response) {
//         if (error.response.data && error.response.data.message) {
//           errorMessage = error.response.data.message;
//         } else if (error.response.data && error.response.data.errors) {
//           const errors = error.response.data.errors;
//           errorMessage = Object.values(errors).flat().join("\n");
//         }
//       }

//       showSnackbar(errorMessage, 'error');
//     } finally {
//       setSubmittingClaim(false);
//       setMenuVisible(false);
//       setSelectedTicket(null);
//     }
//   };

//   const showSnackbar = (message, type = 'info') => {
//     setSnackbarType(type);
//     setSnackbarMessage(message);
//     setSnackbarVisible(true);
//   };

//   const startConfettiAnimation = () => {
//     confettiAnimation.setValue(0);
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(confettiAnimation, {
//           toValue: 1,
//           duration: 2000,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//         Animated.timing(confettiAnimation, {
//           toValue: 0,
//           duration: 2000,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//       ]),
//       { iterations: -1 }
//     ).start();
//   };

//   const stopConfettiAnimation = () => {
//     confettiAnimation.stopAnimation();
//     confettiAnimation.setValue(0);
//   };

//   const handleCloseGameEndModal = () => {
//     stopConfettiAnimation();
//     setShowGameEndModal(false);
//     navigation.goBack();
//   };

//   const handleNavigateToClaim = () => {
//     stopConfettiAnimation();
//     setShowGameEndModal(false);
//     if (myTickets.length > 0) {
//       navigation.navigate('UserGameClaim', {
//         gameId,
//         gameName,
//         gameData: gameStatus
//       });
//     } else {
//       navigation.goBack();
//     }
//   };

//   const handleViewWinners = () => {
//     stopConfettiAnimation();
//     setShowGameEndModal(false);
//     navigation.navigate('UserGameWinners', {
//       gameId,
//       gameName,
//       gameData: gameStatus,
//       calledNumbers: calledNumbers
//     });
//   };

//   const handleViewAllCalledNumbers = () => {
//     navigation.navigate('UserCalledNumbers', {
//       gameId,
//       gameName,
//       calledNumbers,
//       voiceType,
//       gameData: gameStatus
//     });
//   };

//   const openMenu = (ticketId) => {
//     setSelectedTicket(ticketId);
//     setMenuVisible(true);
//   };

//   const closeMenu = () => {
//     setMenuVisible(false);
//     setSelectedTicket(null);
//   };

//   useEffect(() => {
//     loadVoicePreference();
//   }, []);

//   const loadVoicePreference = async () => {
//     try {
//       const savedVoice = await AsyncStorage.getItem('voiceType');
//       if (savedVoice) {
//         setVoiceType(savedVoice);
//       }
//     } catch (error) {
//       console.log("Error loading voice preference:", error);
//     }
//   };

//   const saveVoicePreference = async (type) => {
//     try {
//       await AsyncStorage.setItem('voiceType', type);
//       setVoiceType(type);
//       setShowVoiceModal(false);
//     } catch (error) {
//       console.log("Error saving voice preference:", error);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchGameStatus();
//     await fetchMyTickets();
//     await checkChatStatus();
//     await fetchClaims();
//     await fetchPatternRewards();
//     setRefreshing(false);
//   };

//   const fetchGameStatus = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
      
//       const response = await axios.get(
//         `https://exilance.com/tambolatimez/public/api/user/games/${gameId}/calling-status`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         const data = response.data.data;
//         setGameStatus(data.game);
//         setCallingStatus(data.calling);
//         setCalledNumbers(data.numbers.called_numbers || []);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.log("Error fetching game status:", error);
//       setLoading(false);
//     }
//   };

//   const fetchMyTickets = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const res = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/my-tickets",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data.success) {
//         const tickets = res.data.tickets.data.filter((ticket) => ticket.game_id === parseInt(gameId));
//         setMyTickets(tickets);
//       }
//     } catch (error) {
//       console.log("Error fetching tickets:", error);
//     }
//   };

//   const checkChatStatus = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.get(
//         `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/participants`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         setParticipantCount(response.data.total_participants || 0);
//         const tokenData = await AsyncStorage.getItem("user");
//         if (tokenData) {
//           const user = JSON.parse(tokenData);
//           const isParticipant = response.data.data.some(p => p.id === user.id);
//           setIsChatJoined(isParticipant);
//         }
//       }
//     } catch (error) {
//       console.log("Error checking chat status:", error);
//     }
//   };

//   const joinChat = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.post(
//         `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/join`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         setIsChatJoined(true);
//         setParticipantCount(response.data.participant_count || 1);
//         navigation.navigate('UserLiveChat', {
//           gameId,
//           gameName,
//           participantCount: response.data.participant_count || 1
//         });
//       }
//     } catch (error) {
//       console.log("Error joining chat:", error);
//     }
//   };

//   const speakNumber = (number) => {
//     Speech.stop();
    
//     const numStr = number.toString();
    
//     if (numStr.length === 1) {
//       const digitWord = getSingleDigitWord(number);
//       const speechText = `Single digit ${digitWord}`;
      
//       const voiceConfig = {
//         language: 'en-US',
//         pitch: voiceType === 'male' ? 0.8 : 1.0,
//         rate: 0.8,
//       };
      
//       Speech.speak(speechText, voiceConfig);
//       return;
//     }
    
//     const singleDigits = numStr.split('').map(digit => {
//       switch(digit) {
//         case '0': return 'zero';
//         case '1': return 'one';
//         case '2': return 'two';
//         case '3': return 'three';
//         case '4': return 'four';
//         case '5': return 'five';
//         case '6': return 'six';
//         case '7': return 'seven';
//         case '8': return 'eight';
//         case '9': return 'nine';
//         default: return digit;
//       }
//     }).join(' ');
    
//     const fullNumberName = getNumberName(number);
    
//     const digitsSpeechText = `Number ${singleDigits}`;
//     const digitsVoiceConfig = {
//       language: 'en-US',
//       pitch: voiceType === 'male' ? 0.8 : 1.0,
//       rate: 0.8,
//       onDone: () => {
//         setTimeout(() => {
//           const fullNameVoiceConfig = {
//             language: 'en-US',
//             pitch: voiceType === 'male' ? 0.9 : 1.1,
//             rate: 0.9,
//             volume: 1.0,
//           };
//           Speech.speak(fullNumberName, fullNameVoiceConfig);
//         }, 20);
//       }
//     };
    
//     Speech.speak(digitsSpeechText, digitsVoiceConfig);
//   };

//   const getSingleDigitWord = (num) => {
//     switch(num) {
//       case 1: return 'one';
//       case 2: return 'two';
//       case 3: return 'three';
//       case 4: return 'four';
//       case 5: return 'five';
//       case 6: return 'six';
//       case 7: return 'seven';
//       case 8: return 'eight';
//       case 9: return 'nine';
//       default: return 'zero';
//     }
//   };

//   const getNumberName = (num) => {
//     const numberNames = {
//       1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
//       6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
//       11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
//       16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
//       21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
//       26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
//       31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
//       36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
//       41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
//       46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
//       51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
//       56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
//       61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
//       66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
//       71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five',
//       76: 'seventy-six', 77: 'seventy-seven', 78: 'seventy-eight', 79: 'seventy-nine', 80: 'eighty',
//       81: 'eighty-one', 82: 'eighty-two', 83: 'eighty-three', 84: 'eighty-four', 85: 'eighty-five',
//       86: 'eighty-six', 87: 'eighty-seven', 88: 'eighty-eight', 89: 'eighty-nine', 90: 'ninety'
//     };
    
//     return numberNames[num] || num.toString();
//   };

//   useEffect(() => {
//     if (calledNumbers.length > 0) {
//       const latestNumber = calledNumbers[calledNumbers.length - 1];
      
//       if (lastCalledRef.current !== latestNumber) {
//         lastCalledRef.current = latestNumber;
        
//         setTimeout(() => {
//           speakNumber(latestNumber);
//         }, 500);
//       }
//     }
//   }, [calledNumbers]);

//   const markNumberOnTicket = async (ticketId, number) => {
//     try {
//       setMarkingLoading(true);
//       const token = await AsyncStorage.getItem("token");
      
//       await axios.post(
//         "https://exilance.com/tambolatimez/public/api/user/tickets/mark-multiple",
//         {
//           ticket_marks: [
//             {
//               ticket_id: ticketId,
//               numbers: [number]
//             }
//           ]
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//             "Content-Type": "application/json"
//           }
//         }
//       );

//       updateTicketState(ticketId, number, true);
      
//     } catch (error) {
//       console.log("Error marking number:", error);
//     } finally {
//       setMarkingLoading(false);
//     }
//   };

//   const unmarkNumberOnTicket = async (ticketId, number) => {
//     try {
//       setMarkingLoading(true);
//       const token = await AsyncStorage.getItem("token");
      
//       await axios.post(
//         `https://exilance.com/tambolatimez/public/api/user/tickets/${ticketId}/unmark`,
//         {
//           number: number
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: "application/json",
//             "Content-Type": "application/json"
//           }
//         }
//       );

//       updateTicketState(ticketId, number, false);
      
//     } catch (error) {
//       console.log("Error unmarking number:", error);
//     } finally {
//       setMarkingLoading(false);
//     }
//   };

//   const updateTicketState = (ticketId, number, isMarked) => {
//     setMyTickets(prevTickets => 
//       prevTickets.map(ticket => {
//         if (ticket.id === ticketId) {
//           const updatedTicketData = ticket.ticket_data.map(row =>
//             row.map(cell => {
//               if (cell.number === number) {
//                 return { ...cell, is_marked: isMarked };
//               }
//               return cell;
//             })
//           );
          
//           return { 
//             ...ticket, 
//             ticket_data: updatedTicketData 
//           };
//         }
//         return ticket;
//       })
//     );
//   };

//   const handleNumberClick = async (ticketId, cellNumber, isCurrentlyMarked) => {
//     if (cellNumber === null || markingLoading) return;
    
//     if (isCurrentlyMarked) {
//       await unmarkNumberOnTicket(ticketId, cellNumber);
//     } else {
//       await markNumberOnTicket(ticketId, cellNumber);
//     }
//   };

//   const processTicketData = (ticketData) => {
//     if (!ticketData || !Array.isArray(ticketData)) return Array(3).fill(Array(9).fill(null));
    
//     if (ticketData[0] && Array.isArray(ticketData[0]) && ticketData[0][0] && typeof ticketData[0][0] === 'object') {
//       const processedGrid = Array(3).fill().map(() => Array(9).fill(null));
      
//       ticketData.forEach((row, rowIndex) => {
//         row.forEach((cell) => {
//           if (cell && cell.number !== null && cell.column !== undefined) {
//             processedGrid[rowIndex][cell.column] = cell;
//           }
//         });
//       });
      
//       return processedGrid;
//     } else if (ticketData[0] && Array.isArray(ticketData[0])) {
//       return ticketData.map(row => row.map(cell => cell));
//     }
    
//     return Array(3).fill(Array(9).fill(null));
//   };

//   const renderTicketGrid = (ticketData, ticketId) => {
//     const processedData = processTicketData(ticketData);
    
//     return (
//       <View style={[styles.ticketGridContainer, { height: TICKET_GRID_HEIGHT }]}>
//         {processedData.map((row, rowIndex) => (
//           <View key={`row-${rowIndex}`} style={styles.ticketRow}>
//             {row.map((cell, colIndex) => {
//               const cellObj = cell;
//               const cellNumber = cellObj?.number;
//               const isMarked = cellObj?.is_marked || false;
//               const isEmpty = cellNumber === null || cellNumber === undefined;
              
//               let cellBackgroundColor;
//               let textColor;
              
//               if (isEmpty) {
//                 cellBackgroundColor = "#F5F5F5";
//                 textColor = "transparent";
//               } else if (isMarked) {
//                 cellBackgroundColor = "#4CAF50";
//                 textColor = "#FFFFFF";
//               } else {
//                 cellBackgroundColor = "#80CBC4";
//                 textColor = "#FFFFFF";
//               }
              
//               return (
//                 <TouchableOpacity
//                   key={`cell-${rowIndex}-${colIndex}`}
//                   style={[
//                     styles.ticketCell,
//                     { 
//                       width: CELL_SIZE,
//                       height: CELL_SIZE,
//                       backgroundColor: cellBackgroundColor,
//                     },
//                     isEmpty && styles.emptyCell,
//                     isMarked && styles.markedCell,
//                     !isEmpty && !isMarked && styles.numberCell,
//                   ]}
//                   onPress={() => cellNumber && handleNumberClick(ticketId, cellNumber, isMarked)}
//                   onLongPress={() => cellNumber && speakNumber(cellNumber)}
//                   disabled={isEmpty || markingLoading}
//                 >
//                   {!isEmpty && (
//                     <Text style={[styles.cellNumber, { color: textColor }]}>
//                       {cellNumber}
//                     </Text>
//                   )}
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         ))}
//       </View>
//     );
//   };

//   const renderTicketItem = ({ item, index }) => (
//     <View style={styles.ticketItemContainer}>
//       <View style={styles.ticketHeader}>
//         <View style={styles.ticketNumberContainer}>
//           <Image
//             source={{ uri: GAME_IMAGES.ticket }}
//             style={styles.ticketIcon}
//           />
//           <Text style={styles.ticketNumber}>Ticket #{item.ticket_number}</Text>
//         </View>
        
//         <TouchableOpacity
//           style={styles.menuButton}
//           onPress={() => openMenu(item.id)}
//           ref={el => menuRefs.current[index] = el}
//         >
//           <Ionicons name="ellipsis-vertical" size={20} color="#6C757D" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.ticketGridWrapper}>
//         {renderTicketGrid(item.ticket_data, item.id)}
//       </View>
//     </View>
//   );

//   const renderPatternMenu = () => {
//     if (!selectedTicket) return null;

//     const ticketPatterns = patternsByTicket[selectedTicket] || {};
//     const availablePatterns = patternRewards.filter(pattern => {
//       const patternCount = totalPatternCounts[pattern.pattern_id];
//       const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
//       // Pattern is disabled if:
//       // 1. Already claimed on this ticket (and not rejected)
//       // 2. Global limit is reached
//       return !(
//         (patternOnTicket && patternOnTicket.status !== 'rejected') ||
//         (patternCount && patternCount.total > 0 && patternCount.claimed >= patternCount.total)
//       );
//     });

//     return (
//       <Modal
//         transparent={true}
//         visible={menuVisible}
//         animationType="fade"
//         onRequestClose={closeMenu}
//       >
//         <TouchableOpacity
//           style={styles.menuOverlay}
//           activeOpacity={1}
//           onPress={closeMenu}
//         >
//           <View style={styles.menuContainer}>
//             <View style={styles.menuHeader}>
//               <Text style={styles.menuTitle}>Submit Claim</Text>
//               <TouchableOpacity onPress={closeMenu}>
//                 <Ionicons name="close" size={24} color="#6C757D" />
//               </TouchableOpacity>
//             </View>
            
//             <ScrollView style={styles.patternsMenuScroll}>
//               {availablePatterns.length === 0 ? (
//                 <View style={styles.noPatternsContainer}>
//                   <Ionicons name="alert-circle-outline" size={40} color="#FFD700" />
//                   <Text style={styles.noPatternsText}>No available patterns for this ticket</Text>
//                   <Text style={styles.noPatternsSubtext}>
//                     All patterns have been claimed or limits reached
//                   </Text>
//                 </View>
//               ) : (
//                 availablePatterns.map((pattern, index) => {
//                   const patternCount = totalPatternCounts[pattern.pattern_id] || {};
//                   const patternOnTicket = ticketPatterns[pattern.pattern_id];
//                   const isDisabled = patternOnTicket && patternOnTicket.status !== 'rejected';
//                   const isLimitReached = patternCount.total > 0 && patternCount.claimed >= patternCount.total;
                  
//                   return (
//                     <TouchableOpacity
//                       key={index}
//                       style={[
//                         styles.patternMenuItem,
//                         isDisabled && styles.disabledPatternItem
//                       ]}
//                       onPress={() => submitClaim(selectedTicket, pattern)}
//                       disabled={submittingClaim || isDisabled || isLimitReached}
//                     >
//                       <View style={styles.patternMenuItemContent}>
//                         <Ionicons 
//                           name={isDisabled ? "checkmark-circle" : "trophy-outline"} 
//                           size={20} 
//                           color={isDisabled ? SUCCESS_COLOR : SECONDARY_COLOR} 
//                         />
//                         <View style={styles.patternMenuItemInfo}>
//                           <Text style={styles.patternMenuItemName}>
//                             {pattern.reward_name}
//                             {isDisabled && (
//                               <Text style={styles.claimedBadge}> ✓ Claimed</Text>
//                             )}
//                           </Text>
//                           <Text style={styles.patternMenuItemDesc} numberOfLines={2}>
//                             Prize: ₹{pattern.amount}
//                             {patternCount.total > 0 && (
//                               <Text style={styles.patternLimitText}>
//                                 {" "}• Limit: {patternCount.claimed}/{patternCount.total}
//                               </Text>
//                             )}
//                           </Text>
//                         </View>
//                         {submittingClaim && patternOnTicket ? (
//                           <ActivityIndicator size="small" color={SECONDARY_COLOR} />
//                         ) : (
//                           <View style={styles.patternStatusContainer}>
//                             {isLimitReached && (
//                               <Ionicons name="lock-closed" size={16} color={DANGER_COLOR} />
//                             )}
//                           </View>
//                         )}
//                       </View>
//                     </TouchableOpacity>
//                   );
//                 })
//               )}
//             </ScrollView>
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     );
//   };

//   const renderWinningCelebration = () => {
//     if (!showWinningCelebration) return null;

//     return (
//       <Modal
//         transparent={true}
//         visible={showWinningCelebration}
//         animationType="fade"
//         onRequestClose={stopWinningCelebration}
//       >
//         <View style={styles.winningOverlay}>
//           {/* Confetti Animation */}
//           {confettiTranslateY.current.map((anim, index) => (
//             <Animated.View
//               key={`confetti-${index}`}
//               style={[
//                 styles.confettiParticle,
//                 {
//                   left: `${(index * 5) % 100}%`,
//                   transform: [{ translateY: anim }],
//                   backgroundColor: ['#FF6B35', '#40E0D0', '#FFD700', '#4CAF50'][index % 4],
//                 }
//               ]}
//             />
//           ))}

//           {/* Celebration Popup */}
//           <Animated.View style={[
//             styles.celebrationContent,
//             {
//               opacity: celebrationOpacity,
//               transform: [
//                 { scale: celebrationScale },
//                 { translateY: celebrationTranslateY }
//               ],
//             }
//           ]}>
//             <View style={styles.celebrationInner}>
//               <Ionicons name="trophy" size={40} color="#FFD700" style={styles.trophyIcon} />
              
//               <Text style={styles.winningTitle}>{winningMessage}</Text>
              
//               <View style={styles.winnerInfo}>
//                 <Text style={styles.winnerName}>{winningUser}</Text>
//                 <Text style={styles.winnerPattern}>{winningPattern}</Text>
//               </View>
              
//               <View style={styles.prizeAmountContainer}>
//                 <Text style={styles.prizeAmount}>₹{winningAmount}</Text>
//                 <Text style={styles.prizeLabel}>WINNINGS</Text>
//               </View>
              
//               <View style={styles.celebrationMessage}>
//                 <Ionicons name="sparkles" size={16} color="#FFD700" />
//                 <Text style={styles.celebrationText}>CONGRATULATIONS!</Text>
//                 <Ionicons name="sparkles" size={16} color="#FFD700" />
//               </View>
//             </View>

//             <TouchableOpacity
//               style={styles.closeCelebrationButton}
//               onPress={stopWinningCelebration}
//             >
//               <Text style={styles.closeCelebrationText}>Continue</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </View>
//       </Modal>
//     );
//   };

//   const getSnackbarStyle = () => {
//     switch (snackbarType) {
//       case 'success':
//         return { backgroundColor: '#4CAF50' };
//       case 'error':
//         return { backgroundColor: '#FF5252' };
//       case 'warning':
//         return { backgroundColor: '#FF9800' };
//       default:
//         return { backgroundColor: '#40E0D0' };
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#40E0D0" />
//         <Text style={styles.loadingText}>Loading Game Room...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

//       {/* Winning Celebration Modal */}
//       {renderWinningCelebration()}

//       {/* Game End Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={showGameEndModal}
//         onRequestClose={handleCloseGameEndModal}
//       >
//         <View style={styles.gameEndModalOverlay}>
//           <Animated.View 
//             style={[
//               styles.confettiContainer,
//               {
//                 transform: [{
//                   translateY: confettiAnimation.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [0, -20]
//                   })
//                 }]
//               }
//             ]}
//           >
//             <Image
//               source={{ uri: GAME_IMAGES.confetti }}
//               style={styles.confettiImage}
//             />
//           </Animated.View>
          
//           <View style={styles.gameEndModalContent}>
//             <View style={styles.gameEndModalHeader}>
//               <Image
//                 source={{ uri: GAME_IMAGES.trophy }}
//                 style={styles.gameEndTrophy}
//               />
//               <Text style={styles.gameEndModalTitle}>Game Complete! 🎉</Text>
//             </View>
            
//             <View style={styles.gameEndModalBody}>
//               <Text style={styles.gameEndCongratulations}>
//                 Congratulations!
//               </Text>
//               <Text style={styles.gameEndMessage}>
//                 All 90 numbers have been called! The game has ended.
//               </Text>
              
//               <View style={styles.gameEndStats}>
//                 <View style={styles.endStatItem}>
//                   <Text style={styles.endStatValue}>{calledNumbers.length}</Text>
//                   <Text style={styles.endStatLabel}>Numbers Called</Text>
//                 </View>
//                 <View style={styles.endStatItem}>
//                   <Text style={styles.endStatValue}>{myTickets.length}</Text>
//                   <Text style={styles.endStatLabel}>Your Tickets</Text>
//                 </View>
//                 <View style={styles.endStatItem}>
//                   <Text style={styles.endStatValue}>
//                     {myTickets.flatMap(t => 
//                       t.ticket_data.flat().filter(cell => cell.is_marked)
//                     ).length}
//                   </Text>
//                   <Text style={styles.endStatLabel}>Marked Numbers</Text>
//                 </View>
//               </View>
              
//               <Text style={styles.gameEndThanks}>
//                 Thank you for playing! Check out the winners and claim your prizes.
//               </Text>
//             </View>
            
//             <View style={styles.gameEndModalFooter}>
//               <TouchableOpacity
//                 style={styles.viewWinnersButton}
//                 onPress={handleViewWinners}
//               >
//                 <Ionicons name="trophy" size={20} color="#FFF" />
//                 <Text style={styles.viewWinnersButtonText}>View Winners</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={styles.closeButton}
//                 onPress={handleCloseGameEndModal}
//               >
//                 <Text style={styles.closeButtonText}>Exit Game Room</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Voice Selection Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showVoiceModal}
//         onRequestClose={() => setShowVoiceModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Voice Type</Text>
//               <TouchableOpacity
//                 onPress={() => setShowVoiceModal(false)}
//                 style={styles.modalCloseButton}
//               >
//                 <Ionicons name="close" size={24} color="#6C757D" />
//               </TouchableOpacity>
//             </View>
            
//             <Text style={styles.modalSubtitle}>
//               Choose your preferred voice for number announcements
//             </Text>
            
//             <TouchableOpacity
//               style={[
//                 styles.voiceOption,
//                 voiceType === 'female' && styles.selectedVoiceOption
//               ]}
//               onPress={() => saveVoicePreference('female')}
//             >
//               <View style={styles.voiceOptionIcon}>
//                 <Ionicons 
//                   name="female" 
//                   size={24} 
//                   color={voiceType === 'female' ? "#40E0D0" : "#6C757D"} 
//                 />
//               </View>
//               <View style={styles.voiceOptionInfo}>
//                 <Text style={styles.voiceOptionName}>Female Voice</Text>
//                 <Text style={styles.voiceOptionDesc}>Higher pitch, clear pronunciation</Text>
//               </View>
//               {voiceType === 'female' && (
//                 <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
//               )}
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.voiceOption,
//                 voiceType === 'male' && styles.selectedVoiceOption
//               ]}
//               onPress={() => saveVoicePreference('male')}
//             >
//               <View style={styles.voiceOptionIcon}>
//                 <Ionicons 
//                   name="male" 
//                   size={24} 
//                   color={voiceType === 'male' ? "#40E0D0" : "#6C757D"} 
//                 />
//               </View>
//               <View style={styles.voiceOptionInfo}>
//                 <Text style={styles.voiceOptionName}>Male Voice</Text>
//                 <Text style={styles.voiceOptionDesc}>Lower pitch, deeper tone</Text>
//               </View>
//               {voiceType === 'male' && (
//                 <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
//               )}
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={styles.testVoiceButton}
//               onPress={() => {
//                 if (calledNumbers.length > 0) {
//                   speakNumber(calledNumbers[calledNumbers.length - 1]);
//                 } else {
//                   speakNumber(25);
//                 }
//               }}
//             >
//               <Ionicons name="volume-high" size={20} color="#FFF" />
//               <Text style={styles.testVoiceButtonText}>Test Voice</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Pattern Menu Modal */}
//       {renderPatternMenu()}

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={24} color="#40E0D0" />
//           </TouchableOpacity>
          
//           <View style={styles.headerTextContainer}>
//             <Text style={styles.gameName} numberOfLines={1}>
//               {gameName}
//             </Text>
//             <View style={styles.gameCodeContainer}>
//               <Ionicons name="game-controller" size={16} color="#6C757D" />
//               <Text style={styles.gameCode}>Game Room</Text>
//             </View>
//           </View>

//           <View style={styles.headerActions}>
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => setShowVoiceModal(true)}
//             >
//               <Image
//                 source={{ uri: GAME_IMAGES.voice }}
//                 style={styles.voiceButtonIcon}
//               />
//               <Text style={styles.voiceButtonText}>
//                 {voiceType === 'male' ? 'Male' : 'Female'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.container}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#40E0D0"
//             colors={["#40E0D0"]}
//             progressViewOffset={20}
//           />
//         }
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Content */}
//         <View style={styles.content}>
//           {/* Last Called Number Card */}
//           <View style={styles.card}>
//             <View style={styles.cardPattern} />
            
//             {calledNumbers.length > 0 ? (
//               <View style={styles.compactNumberDisplay}>
//                 {/* Left side - Last Called Number */}
//                 <View style={styles.lastNumberLeft}>
//                   <View style={styles.sectionHeader}>
//                     <Image
//                       source={{ uri: GAME_IMAGES.megaphone }}
//                       style={styles.sectionIcon}
//                     />
//                     <Text style={styles.sectionTitle}>Last Called</Text>
//                   </View>
                  
//                   <TouchableOpacity
//                     style={styles.compactLastNumberContainer}
//                     onPress={() => speakNumber(calledNumbers[calledNumbers.length - 1])}
//                     activeOpacity={0.8}
//                   >
//                     <Text style={styles.compactLastNumber}>
//                       {calledNumbers[calledNumbers.length - 1]}
//                     </Text>
//                     <Text style={styles.compactLastNumberLabel}>
//                       {calledNumbers.length >= 90 
//                         ? "Game Completed" 
//                         : `Tap to hear`}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>

//                 {/* Right side - Recent Numbers */}
//                 <View style={styles.recentNumbersRight}>
//                   <View style={styles.sectionHeader}>
//                     <Image
//                       source={{ uri: GAME_IMAGES.numbers }}
//                       style={styles.sectionIcon}
//                     />
//                     <Text style={styles.sectionTitle}>Recent</Text>
//                     <TouchableOpacity
//                       style={styles.voiceIndicator}
//                       onPress={() => setShowVoiceModal(true)}
//                     >
//                       <Ionicons 
//                         name={voiceType === 'male' ? "male" : "female"} 
//                         size={16} 
//                         color="#40E0D0" 
//                       />
//                     </TouchableOpacity>
//                   </View>
                  
//                   <View style={styles.recentNumbersGrid}>
//                     {calledNumbers.slice(-4).reverse().map((num, index) => (
//                       <TouchableOpacity
//                         key={index}
//                         style={[
//                           styles.numberChip,
//                           index === 0 && styles.latestChip
//                         ]}
//                         onPress={() => speakNumber(num)}
//                       >
//                         <Text style={[
//                           styles.numberChipText,
//                           index === 0 && styles.latestChipText
//                         ]}>
//                           {num}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
                    
//                     {calledNumbers.length > 4 && (
//                       <TouchableOpacity
//                         style={styles.viewMoreButton}
//                         onPress={handleViewAllCalledNumbers}
//                       >
//                         <Text style={styles.viewMoreText}>View More</Text>
//                         <Ionicons name="chevron-forward" size={14} color="#40E0D0" />
//                       </TouchableOpacity>
//                     )}
//                   </View>
//                 </View>
//               </View>
//             ) : (
//               <View style={styles.waitingSection}>
//                 <Ionicons name="hourglass-outline" size={40} color="#FFD700" />
//                 <Text style={styles.waitingText}>
//                   Waiting for numbers to be called...
//                 </Text>
//               </View>
//             )}
//           </View>

//           {/* My Tickets Section */}
//           <View style={styles.ticketsSection}>
//             {myTickets.length === 0 ? (
//               <View style={styles.emptyTicketsContainer}>
//                 <Image
//                   source={{ uri: GAME_IMAGES.empty }}
//                   style={styles.emptyIcon}
//                 />
//                 <Text style={styles.emptyTitle}>No Tickets Allocated</Text>
//                 <Text style={styles.emptySubtitle}>
//                   You haven't been allocated any tickets for this game yet
//                 </Text>
//               </View>
//             ) : (
//               <>
//                 {/* Tickets List */}
//                 <View style={styles.ticketsList}>
//                   {myTickets.map((ticket, index) => (
//                     <View key={ticket.id} style={styles.ticketWrapper}>
//                       {renderTicketItem({ item: ticket, index })}
//                     </View>
//                   ))}
//                 </View>

//                 <Text style={styles.ticketsHint}>
//                   Tap numbers to mark/unmark them • Long press to hear number • Tap ⋮ to submit claim
//                 </Text>
//               </>
//             )}
//           </View>
//         </View>

//         {/* Bottom Space */}
//         <View style={styles.bottomSpace} />
//       </ScrollView>

//       {/* Floating Chat Button */}
//       <TouchableOpacity
//         style={styles.floatingChatButton}
//         onPress={joinChat}
//         activeOpacity={0.9}
//       >
//         <View style={styles.chatButtonContent}>
//           <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
//           {participantCount > 0 && (
//             <View style={styles.chatBadge}>
//               <Text style={styles.chatBadgeText}>
//                 {participantCount > 99 ? '99+' : participantCount}
//               </Text>
//             </View>
//           )}
//         </View>
//         <Text style={styles.chatButtonText}>
//           {isChatJoined ? 'Live Chat' : 'Join Chat'}
//         </Text>
//       </TouchableOpacity>

//       {/* Snackbar for Notifications */}
//       <Snackbar
//         visible={snackbarVisible}
//         onDismiss={() => setSnackbarVisible(false)}
//         duration={5000}
//         style={[styles.snackbar, getSnackbarStyle()]}
//       >
//         <View style={styles.snackbarContent}>
//           {snackbarType === 'success' && (
//             <Ionicons name="trophy" size={20} color="#FFF" style={styles.snackbarIcon} />
//           )}
//           {snackbarType === 'error' && (
//             <Ionicons name="close-circle" size={20} color="#FFF" style={styles.snackbarIcon} />
//           )}
//           {snackbarType === 'info' && (
//             <Ionicons name="information-circle" size={20} color="#FFF" style={styles.snackbarIcon} />
//           )}
//           <Text style={styles.snackbarText}>{snackbarMessage}</Text>
//         </View>
//       </Snackbar>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   container: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   content: {
//     padding: 12,
//     zIndex: 1,
//   },
//   // Winning Celebration Styles
//   winningOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 9999,
//   },
//   celebrationContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//     width: '80%',
//     maxWidth: 320,
//     shadowColor: '#FFD700',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.4,
//     shadowRadius: 15,
//     elevation: 15,
//     borderWidth: 3,
//     borderColor: '#FFD700',
//   },
//   celebrationInner: {
//     alignItems: 'center',
//     marginBottom: 15,
//     width: '100%',
//   },
//   trophyIcon: {
//     marginBottom: 10,
//     shadowColor: '#FFD700',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.6,
//     shadowRadius: 4,
//   },
//   winningTitle: {
//     fontSize: 20,
//     fontWeight: '900',
//     color: '#FF6B35',
//     textAlign: 'center',
//     marginBottom: 12,
//     textShadowColor: 'rgba(255, 215, 0, 0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   winnerInfo: {
//     backgroundColor: 'rgba(64, 224, 208, 0.1)',
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#40E0D0',
//     width: '100%',
//   },
//   winnerName: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#212529',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   winnerPattern: {
//     fontSize: 14,
//     color: '#FF6B35',
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   prizeAmountContainer: {
//     backgroundColor: 'rgba(255, 107, 53, 0.1)',
//     padding: 15,
//     borderRadius: 15,
//     alignItems: 'center',
//     marginBottom: 15,
//     borderWidth: 2,
//     borderColor: '#FF6B35',
//     width: '100%',
//   },
//   prizeAmount: {
//     fontSize: 32,
//     fontWeight: '900',
//     color: '#FF6B35',
//     textShadowColor: 'rgba(255, 107, 53, 0.2)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//     marginBottom: 4,
//   },
//   prizeLabel: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#6C757D',
//     letterSpacing: 1,
//   },
//   celebrationMessage: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 215, 0, 0.1)',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#FFD700',
//   },
//   celebrationText: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#212529',
//     marginHorizontal: 8,
//   },
//   closeCelebrationButton: {
//     backgroundColor: '#40E0D0',
//     paddingHorizontal: 25,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//     width: '100%',
//     alignItems: 'center',
//   },
//   closeCelebrationText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   confettiParticle: {
//     width: 8,
//     height: 8,
//     borderRadius: 1,
//     position: 'absolute',
//     top: -50,
//   },
//   // Header Styles
//   header: {
//     backgroundColor: "#40E0D0",
//     paddingTop: 20,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E9ECEF",
//     zIndex: 1,
//   },
//   headerTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#F8F9FA",
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   gameName: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     letterSpacing: -0.5,
//   },
//   gameCodeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     marginTop: 2,
//   },
//   gameCode: {
//     fontSize: 14,
//     color: "#6C757D",
//     fontWeight: "500",
//   },
//   headerActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   voiceButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8F9FA",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//     gap: 4,
//   },
//   voiceButtonIcon: {
//     width: 16,
//     height: 16,
//   },
//   voiceButtonText: {
//     fontSize: 12,
//     color: "#40E0D0",
//     fontWeight: "600",
//   },
//   // Menu Styles
//   menuOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   menuContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     width: '80%',
//     maxHeight: '60%',
//     overflow: 'hidden',
//   },
//   menuHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E9ECEF',
//   },
//   menuTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#212529',
//   },
//   patternsMenuScroll: {
//     maxHeight: 300,
//   },
//   patternMenuItem: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E9ECEF',
//   },
//   disabledPatternItem: {
//     backgroundColor: '#F8F9FA',
//     opacity: 0.7,
//   },
//   patternMenuItemContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   patternMenuItemInfo: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   patternMenuItemName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   patternMenuItemDesc: {
//     fontSize: 12,
//     color: '#6C757D',
//   },
//   patternStatusContainer: {
//     marginLeft: 8,
//   },
//   patternLimitText: {
//     color: '#FF6B35',
//     fontWeight: '600',
//   },
//   claimedBadge: {
//     fontSize: 12,
//     color: '#4CAF50',
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   noPatternsContainer: {
//     alignItems: 'center',
//     padding: 32,
//   },
//   noPatternsText: {
//     fontSize: 14,
//     color: '#6C757D',
//     marginTop: 12,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   noPatternsSubtext: {
//     fontSize: 12,
//     color: '#FF6B35',
//     textAlign: 'center',
//     marginTop: 4,
//     fontStyle: 'italic',
//   },
//   // Game End Modal Styles
//   gameEndModalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   confettiContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   confettiImage: {
//     width: 200,
//     height: 200,
//     opacity: 0.7,
//   },
//   gameEndModalContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 24,
//     padding: 24,
//     width: '100%',
//     maxWidth: 400,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//   },
//   gameEndModalHeader: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   gameEndTrophy: {
//     width: 80,
//     height: 80,
//     marginBottom: 16,
//   },
//   gameEndModalTitle: {
//     fontSize: 28,
//     fontWeight: '900',
//     color: '#FF6B35',
//     textAlign: 'center',
//     letterSpacing: -0.5,
//   },
//   gameEndModalBody: {
//     marginBottom: 24,
//   },
//   gameEndCongratulations: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#40E0D0',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   gameEndMessage: {
//     fontSize: 16,
//     color: '#6C757D',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 24,
//   },
//   gameEndStats: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#F8F9FA',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//   },
//   endStatItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   endStatValue: {
//     fontSize: 24,
//     fontWeight: '900',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   endStatLabel: {
//     fontSize: 12,
//     color: '#6C757D',
//     fontWeight: '600',
//   },
//   gameEndThanks: {
//     fontSize: 14,
//     color: '#212529',
//     textAlign: 'center',
//     fontStyle: 'italic',
//     lineHeight: 20,
//   },
//   gameEndModalFooter: {
//     gap: 12,
//   },
//   viewWinnersButton: {
//     backgroundColor: '#FF6B35',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     gap: 8,
//   },
//   viewWinnersButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   closeButton: {
//     backgroundColor: '#F8F9FA',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//   },
//   closeButtonText: {
//     color: '#6C757D',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 24,
//     width: '90%',
//     maxWidth: 400,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#212529',
//   },
//   modalCloseButton: {
//     padding: 4,
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: '#6C757D',
//     marginBottom: 24,
//     lineHeight: 20,
//   },
//   voiceOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//     marginBottom: 12,
//   },
//   selectedVoiceOption: {
//     borderColor: '#40E0D0',
//     backgroundColor: 'rgba(64, 224, 208, 0.05)',
//   },
//   voiceOptionIcon: {
//     marginRight: 16,
//   },
//   voiceOptionInfo: {
//     flex: 1,
//   },
//   voiceOptionName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   voiceOptionDesc: {
//     fontSize: 12,
//     color: '#6C757D',
//   },
//   testVoiceButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#40E0D0',
//     paddingVertical: 14,
//     borderRadius: 12,
//     marginTop: 16,
//     gap: 8,
//   },
//   testVoiceButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Card Styles
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   cardPattern: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     width: 50,
//     height: 50,
//     borderBottomLeftRadius: 16,
//     borderTopRightRadius: 25,
//     backgroundColor: 'rgba(64, 224, 208, 0.03)',
//   },
//   compactNumberDisplay: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     gap: 12,
//   },
//   lastNumberLeft: {
//     flex: 1,
//     minWidth: 120,
//   },
//   recentNumbersRight: {
//     flex: 1,
//     minWidth: 120,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//     paddingHorizontal: 4,
//     gap: 6,
//   },
//   sectionIcon: {
//     width: 18,
//     height: 18,
//   },
//   sectionTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#212529",
//   },
//   voiceIndicator: {
//     marginLeft: 'auto',
//   },
//   compactLastNumberContainer: {
//     alignItems: "center",
//     backgroundColor: "#F3F0FF",
//     padding: 10,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#40E0D0",
//     marginBottom: 8,
//   },
//   compactLastNumber: {
//     fontSize: 32,
//     fontWeight: "900",
//     color: "#40E0D0",
//     marginBottom: 2,
//   },
//   compactLastNumberLabel: {
//     fontSize: 10,
//     color: "#6C757D",
//     fontStyle: "italic",
//     textAlign: 'center',
//   },
//   recentNumbersGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 6,
//     marginTop: 4,
//   },
//   numberChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: 'center',
//     backgroundColor: "#F8F9FA",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//     width: 36,
//     height: 36,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   latestChip: {
//     backgroundColor: "#40E0D0",
//     borderColor: "#40E0D0",
//   },
//   numberChipText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#6C757D",
//   },
//   latestChipText: {
//     color: "#FFFFFF",
//   },
//   viewMoreButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: 'center',
//     backgroundColor: "#FFFFFF",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#40E0D0",
//     gap: 4,
//     height: 36,
//     minWidth: 100,
//   },
//   viewMoreText: {
//     fontSize: 12,
//     color: "#40E0D0",
//     fontWeight: "600",
//   },
//   waitingSection: {
//     alignItems: "center",
//     paddingVertical: 20,
//   },
//   waitingText: {
//     fontSize: 14,
//     color: "#FF6B35",
//     textAlign: "center",
//     marginTop: 12,
//     fontStyle: "italic",
//   },
//   // Tickets Section
//   ticketsSection: {
//     marginBottom: 16,
//   },
//   // Empty Tickets
//   emptyTicketsContainer: {
//     alignItems: "center",
//     paddingVertical: 40,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//     marginTop: 12,
//   },
//   emptyIcon: {
//     width: 80,
//     height: 80,
//     marginBottom: 16,
//     opacity: 0.7,
//   },
//   emptyTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#212529",
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#6C757D",
//     textAlign: "center",
//     marginBottom: 25,
//     paddingHorizontal: 20,
//   },
//   // Tickets List
//   ticketsList: {
    
//   },
//   ticketWrapper: {
//     marginBottom: 0,
//     position: 'relative',
//   },
//   // Ticket Item Container
//   ticketItemContainer: {
//     marginBottom: 0,
//     padding: 0,
//   },
//   // Ticket Header with Ticket Number and Menu Button
//   ticketHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//     paddingHorizontal: 4,
//   },
//   ticketNumberContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   ticketIcon: {
//     width: 16,
//     height: 16,
//   },
//   ticketNumber: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#212529',
//   },
//   menuButton: {
//     padding: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     width: 36,
//     height: 36,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   // Ticket Grid Wrapper
//   ticketGridWrapper: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 8,
//     padding: 8,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     marginBottom: 8,
//     alignItems: 'center',
//   },
//   ticketGridContainer: {
//     overflow: 'hidden',
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     width: CELL_SIZE * 9,
//   },
//   ticketRow: {
//     flexDirection: "row",
//   },
//   ticketCell: {
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 0.5,
//     borderColor: "#E0E0E0",
//   },
//   emptyCell: {
//     backgroundColor: "#F5F5F5",
//   },
//   markedCell: {
//     backgroundColor: "#FF6B35",
//     borderColor: "#FF6B35",
//   },
//   numberCell: {
//     backgroundColor: "#80CBC4",
//   },
//   cellNumber: {
//     fontSize: 16,
//     fontWeight: "700",
//     textShadowColor: 'rgba(0, 0, 0, 0.2)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 1,
//   },
//   ticketsHint: {
//     fontSize: 12,
//     color: "#6C757D",
//     textAlign: "center",
//     marginTop: 16,
//     fontStyle: "italic",
//     lineHeight: 16,
//     paddingHorizontal: 4,
//   },
//   bottomSpace: {
//     height: 20,
//   },
//   // Floating Chat Button
//   floatingChatButton: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     backgroundColor: '#40E0D0',
//     borderRadius: 25,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//   },
//   chatButtonContent: {
//     position: 'relative',
//     marginRight: 8,
//   },
//   chatBadge: {
//     position: 'absolute',
//     top: -6,
//     right: -6,
//     backgroundColor: '#FF6B35',
//     borderRadius: 8,
//     minWidth: 16,
//     height: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#FFF',
//   },
//   chatBadgeText: {
//     color: '#FFF',
//     fontSize: 9,
//     fontWeight: 'bold',
//     paddingHorizontal: 3,
//   },
//   chatButtonText: {
//     color: '#FFF',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   // Loading
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F8F9FA",
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: "#6C757D",
//     fontWeight: "500",
//   },
//   // Snackbar Styles
//   snackbar: {
//     borderRadius: 8,
//     margin: 16,
//   },
//   snackbarContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   snackbarIcon: {
//     marginRight: 8,
//   },
//   snackbarText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     flex: 1,
//   },
// });

// export default UserGameRoom;














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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { Snackbar } from 'react-native-paper';

const { width, height } = Dimensions.get("window");
const TICKET_WIDTH = width - 24;
const CELL_SIZE = Math.min((TICKET_WIDTH - 16) / 9, 50);
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
  
  // New state for tracking patterns per ticket
  const [patternsByTicket, setPatternsByTicket] = useState({});
  const [totalPatternCounts, setTotalPatternCounts] = useState({});
  const [processingCells, setProcessingCells] = useState(new Set());
  
  // New state for pattern viewing
  const [showPatternsModal, setShowPatternsModal] = useState(false);
  const [availablePatterns, setAvailablePatterns] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [selectedPatternForView, setSelectedPatternForView] = useState(null);
  
  // Global blinking states
  const [blinkingPattern, setBlinkingPattern] = useState(null); // Stores the current blinking pattern
  const [blinkingCells, setBlinkingCells] = useState({}); // Stores blinking cells for ALL tickets
  const [blinkingAnimations, setBlinkingAnimations] = useState({}); // Stores animations for ALL tickets
  
  const lastCalledRef = useRef(null);
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const claimsRef = useRef([]);
  const menuRefs = useRef([]);
  const lastApprovedClaimRef = useRef(null);
  const audioEnabled = useRef(true);
  const blinkingIntervals = useRef({});
  const blinkingTimeouts = useRef({});

  // Celebration animations
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const celebrationTranslateY = useRef(new Animated.Value(50)).current;
  const confettiTranslateY = useRef([]);

  // Initialize confetti animations
  useEffect(() => {
    confettiTranslateY.current = Array(20).fill().map(() => new Animated.Value(-50));
  }, []);

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

  const PRIMARY_COLOR = "#40E0D0";
  const SUCCESS_COLOR = "#4CAF50";
  const WARNING_COLOR = "#FFD700";
  const DANGER_COLOR = "#FF5252";
  const GRAY_COLOR = "#6C757D";
  const LIGHT_GRAY = "#F8F9FA";
  const BORDER_COLOR = "#E9ECEF";
  const BACKGROUND_COLOR = "#FFFFFF";
  const SECONDARY_COLOR = "#FF6B35";

  // Clean up blinking intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(blinkingIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      Object.values(blinkingTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const stopAllBlinking = () => {
    Object.values(blinkingIntervals.current).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    Object.values(blinkingTimeouts.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    blinkingIntervals.current = {};
    blinkingTimeouts.current = {};
    setBlinkingCells({});
    setSelectedPatternForView(null);
    setBlinkingPattern(null);
  };

  const startBlinkingForAllTickets = (pattern, duration = 3000) => {
    // Stop any existing blinking first
    stopAllBlinking();
    
    // Calculate blinking cells for ALL tickets
    const allBlinkingCells = {};
    const allAnimations = {};
    
    myTickets.forEach(ticket => {
      const patternCells = getPatternCells(ticket, pattern);
      allBlinkingCells[ticket.id] = patternCells;
      
      // Create animation for each ticket
      allAnimations[ticket.id] = new Animated.Value(0);
    });
    
    setBlinkingCells(allBlinkingCells);
    setBlinkingAnimations(allAnimations);
    
    // Start blinking animation for each ticket
    Object.keys(allAnimations).forEach(ticketId => {
      const animValue = allAnimations[ticketId];
      
      // Start blinking animation
      blinkingIntervals.current[ticketId] = setInterval(() => {
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);
    });

    // Auto stop after duration
    blinkingTimeouts.current.global = setTimeout(() => {
      stopAllBlinking();
    }, duration);
  };

  const stopBlinkingForTicket = (ticketId) => {
    if (blinkingIntervals.current[ticketId]) {
      clearInterval(blinkingIntervals.current[ticketId]);
      delete blinkingIntervals.current[ticketId];
    }
    
    setBlinkingAnimations(prev => {
      const newAnimations = { ...prev };
      delete newAnimations[ticketId];
      return newAnimations;
    });
    
    setBlinkingCells(prev => {
      const newCells = { ...prev };
      delete newCells[ticketId];
      return newCells;
    });
  };

const getPatternCells = (ticket, pattern) => {
  const processedData = processTicketData(ticket.ticket_data);
  const cells = [];
  
  switch(pattern.pattern_name) {
    case 'bamboo':
      // Each row's 3rd number from those that have numbers (not empty)
      for (let row = 0; row < 3; row++) {
        // Get all non-empty cells in this row
        const nonEmptyCells = [];
        for (let col = 0; col < 9; col++) {
          const cell = processedData[row][col];
          if (cell && cell.number !== null) {
            nonEmptyCells.push({ row, col, cell });
          }
        }
        
        // Get the 3rd non-empty cell in this row (index 2)
        if (nonEmptyCells.length >= 3) {
          cells.push({ row: nonEmptyCells[2].row, col: nonEmptyCells[2].col });
        }
      }
      break;
      
    case 'bottom_line':
      // All numbers in bottom row (row index 2)
      for (let col = 0; col < 9; col++) {
        const cell = processedData[2][col];
        if (cell && cell.number !== null) {
          cells.push({ row: 2, col });
        }
      }
      break;
      
    case 'breakfast':
      // Numbers 1-30
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
      // Numbers 61-90
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
      // Find the first 5 called numbers that exist on this ticket
      // Get all numbers on the ticket
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
      
      // Find first 5 called numbers that exist on ticket
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
      // First row: first and last number (from non-empty cells)
      // Last row: first and last number (from non-empty cells)
      
      // First row corners
      const firstRowCells = [];
      for (let col = 0; col < 9; col++) {
        const cell = processedData[0][col];
        if (cell && cell.number !== null) {
          firstRowCells.push({ row: 0, col, cell });
        }
      }
      if (firstRowCells.length > 0) {
        // First number in first row
        cells.push({ row: 0, col: firstRowCells[0].col });
        // Last number in first row
        cells.push({ row: 0, col: firstRowCells[firstRowCells.length - 1].col });
      }
      
      // Last row corners
      const lastRowCells = [];
      for (let col = 0; col < 9; col++) {
        const cell = processedData[2][col];
        if (cell && cell.number !== null) {
          lastRowCells.push({ row: 2, col, cell });
        }
      }
      if (lastRowCells.length > 0) {
        // First number in last row
        cells.push({ row: 2, col: lastRowCells[0].col });
        // Last number in last row
        cells.push({ row: 2, col: lastRowCells[lastRowCells.length - 1].col });
      }
      break;
      
    case 'full_house':
    case 'non_claimers':
      // All numbers
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
      // Numbers 31-60
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
      // All numbers in middle row (row index 1)
      for (let col = 0; col < 9; col++) {
        const cell = processedData[1][col];
        if (cell && cell.number !== null) {
          cells.push({ row: 1, col });
        }
      }
      break;
      
    case 'top_line':
      // All numbers in top row (row index 0)
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

  const fetchAvailablePatterns = async () => {
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
        setAvailablePatterns(response.data.data.patterns || []);
      }
    } catch (error) {
      console.log("Error fetching available patterns:", error);
      showSnackbar("Failed to load patterns", 'error');
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleViewPatterns = (ticketId) => {
    setSelectedTicket(ticketId);
    fetchAvailablePatterns();
    setShowPatternsModal(true);
  };

  const handlePatternSelect = (pattern) => {
    setSelectedPatternForView(pattern);
    setBlinkingPattern(pattern);
    
    // Start blinking for ALL tickets
    startBlinkingForAllTickets(pattern, 3000);
    
    // Show special note for early five pattern
    if (pattern.pattern_name === 'early_five') {
      showSnackbar("Early Five: Shows the first 5 called numbers that appear on each ticket", 'info');
    }
    
    // Close modal immediately after selection
    setTimeout(() => {
      setShowPatternsModal(false);
    }, 300);
  };

  useEffect(() => {
    if (calledNumbers.length >= 90 && !gameCompleted) {
      setGameCompleted(true);
      setTimeout(() => {
        setShowGameEndModal(true);
        startConfettiAnimation();
      }, 1000);
    }
  }, [calledNumbers]);

  useEffect(() => {
    fetchGameStatus();
    fetchMyTickets();
    checkChatStatus();
    fetchClaims();
    fetchPatternRewards();

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

  // Helper function to process claims and update pattern counts
  const updatePatternCounts = (claimsData) => {
    const ticketPatterns = {};
    const patternCounts = {};

    // Initialize pattern counts from patternRewards
    patternRewards.forEach(pattern => {
      patternCounts[pattern.pattern_id] = {
        claimed: 0,
        total: pattern.limit_count || 0, // Get limit from pattern rewards
        patternName: pattern.reward_name,
      };
    });

    // Process claims
    claimsData.forEach(claim => {
      const ticketId = claim.ticket_id;
      const patternId = claim.game_pattern_id;
      
      if (!ticketId || !patternId) return;

      // Initialize ticket entry if not exists
      if (!ticketPatterns[ticketId]) {
        ticketPatterns[ticketId] = {};
      }

      // Add pattern to ticket's claimed patterns (only count approved/pending)
      if (claim.claim_status === 'approved' || claim.claim_status === 'pending') {
        ticketPatterns[ticketId][patternId] = {
          count: (ticketPatterns[ticketId][patternId]?.count || 0) + 1,
          status: claim.claim_status,
        };

        // Update global pattern count for approved claims only
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
          
          // Initialize pattern counts
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
        
        // Update pattern counts
        updatePatternCounts(newClaims);
        
        // Check for new or updated claims
        const notifications = [];
        
        newClaims.forEach(newClaim => {
          const oldClaim = previousClaims.find(old => old.id === newClaim.id);
          
          if (!oldClaim) {
            // New claim submission
            if (newClaim.claim_status === 'pending') {
              notifications.push({
                type: 'new_claim',
                claim: newClaim,
                message: `🎉 ${newClaim.user_name} submitted a ${newClaim.reward_name} claim!`
              });
            }
          } else {
            // Check for status changes
            if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'approved') {
              // Claim got approved - WINNER!
              notifications.push({
                type: 'claim_approved',
                claim: newClaim,
                message: `🏆 ${newClaim.user_name} WON ₹${newClaim.winning_amount} for ${newClaim.reward_name}! CONGRATULATIONS! 🎊`
              });
            } else if (oldClaim.claim_status === 'pending' && newClaim.claim_status === 'rejected') {
              // Claim got rejected
              notifications.push({
                type: 'claim_rejected',
                claim: newClaim,
                message: `❌ ${newClaim.user_name}'s ${newClaim.reward_name} claim was rejected`
              });
            }
          }
        });
        
        // Show notifications with delays to prevent overlapping
        if (notifications.length > 0) {
          notifications.forEach((notification, index) => {
            setTimeout(() => {
              showNotification(notification);
            }, index * 1500);
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
    
    // Set snackbar type based on notification type
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
    
    // Speak announcement
    if (audioEnabled.current) {
      setTimeout(() => {
        speakClaimAnnouncement(claim, type);
      }, 500);
    }
  };

  const startWinnerCelebration = (claim) => {
    setWinningMessage(`🏆 WINNER! 🏆`);
    setWinningUser(claim.user_name);
    setWinningAmount(claim.winning_amount);
    setWinningPattern(claim.reward_name);
    
    // Reset animations
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.5);
    celebrationTranslateY.setValue(50);

    // Show celebration
    setShowWinningCelebration(true);

    // Animate in
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

    // Start confetti animation
    startConfettiAnimationCelebration();

    // Auto close after 2 seconds
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
      announcement = `Congratulations! ${claim.user_name} has won ${claim.winning_amount} rupees for completing the ${claim.reward_name} pattern! Tambola!`;
      
      Speech.speak(announcement, {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.9 : 1.2,
        rate: 0.9,
        volume: 1.0,
      });
      
      setTimeout(() => {
        const celebration = "Congratulations to the winner!";
        Speech.speak(celebration, {
          language: 'en-US',
          pitch: voiceType === 'male' ? 1.0 : 1.3,
          rate: 1.0,
          volume: 1.0,
        });
      }, 3000);
      
    } else if (type === 'new_claim') {
      const claimMessage = `${claim.user_name} has submitted a ${claim.reward_name} claim!`;
      
      Speech.speak(claimMessage, {
        language: 'en-US',
        pitch: voiceType === 'male' ? 0.8 : 1.0,
        rate: 0.8,
      });

      setTimeout(() => {
        const tambolaAnnouncement = "Tambola!";
        Speech.speak(tambolaAnnouncement, {
          language: 'en-US',
          pitch: voiceType === 'male' ? 0.9 : 1.2,
          rate: 0.9,
          volume: 1.0,
        });
      }, 1500);
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
    if (submittingClaim) return;
    
    try {
      setSubmittingClaim(true);
      const token = await AsyncStorage.getItem("token");
      
      const ticket = myTickets.find(t => t.id === ticketId);
      if (!ticket) {
        showSnackbar("Ticket not found", 'error');
        return;
      }

      // Check if pattern can be claimed for this ticket
      const ticketPatterns = patternsByTicket[ticketId] || {};
      const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
      if (patternOnTicket && patternOnTicket.status !== 'rejected') {
        showSnackbar(`You have already claimed ${pattern.reward_name} on this ticket`, 'error');
        return;
      }

      // Check if pattern limit is reached globally
      const patternCount = totalPatternCounts[pattern.pattern_id];
      if (patternCount && patternCount.total > 0 && patternCount.claimed >= patternCount.total) {
        showSnackbar(`${pattern.reward_name} claim limit reached (${patternCount.claimed}/${patternCount.total})`, 'error');
        return;
      }

      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/claims/submit",
        {
          game_id: parseInt(gameId),
          ticket_id: parseInt(ticketId),
          reward_name: pattern.reward_name,
          claim_evidence: `Pattern ${pattern.pattern_id} completed on ticket ${ticket.ticket_number}`,
          game_pattern_id: pattern.pattern_id,
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
        showSnackbar(`Claim submitted for ${pattern.reward_name}! Waiting for approval.`, 'info');
        fetchClaims();
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

  const handleNavigateToClaim = () => {
    stopConfettiAnimation();
    setShowGameEndModal(false);
    if (myTickets.length > 0) {
      navigation.navigate('UserGameClaim', {
        gameId,
        gameName,
        gameData: gameStatus
      });
    } else {
      navigation.goBack();
    }
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

  const openMenu = (ticketId) => {
    setSelectedTicket(ticketId);
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
        setGameStatus(data.game);
        setCallingStatus(data.calling);
        setCalledNumbers(data.numbers.called_numbers || []);
        setLoading(false);
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
    
    const cellKey = `${ticketId}-${cellNumber}`;
    
    // Add to processing set
    setProcessingCells(prev => new Set(prev).add(cellKey));
    
    // OPTIMISTIC UPDATE: Update UI immediately to new state
    updateTicketState(ticketId, cellNumber, !isCurrentlyMarked);
    
    // Make API call in background
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
      
      // REVERT on error
      showSnackbar("Failed to update number. Please try again.", 'error');
      updateTicketState(ticketId, cellNumber, wasMarked); // Revert to original state
    } finally {
      // Remove from processing set
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
          // Create a deep copy to avoid mutating state
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

  const renderTicketGrid = (ticketData, ticketId) => {
    const processedData = processTicketData(ticketData);
    const blinkingAnim = blinkingAnimations[ticketId];
    const currentBlinkingCells = blinkingCells[ticketId] || [];
    
    return (
      <View style={[styles.ticketGridContainer, { height: TICKET_GRID_HEIGHT }]}>
        {processedData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.ticketRow}>
            {row.map((cell, colIndex) => {
              const cellObj = cell;
              const cellNumber = cellObj?.number;
              const isMarked = cellObj?.is_marked || false;
              const isEmpty = cellNumber === null || cellNumber === undefined;
              
              // Check if this cell should blink
              const shouldBlink = currentBlinkingCells.some(
                blinkingCell => blinkingCell.row === rowIndex && blinkingCell.col === colIndex
              );
              
              let cellBackgroundColor;
              let textColor;
              
              if (isEmpty) {
                cellBackgroundColor = "#F5F5F5";
                textColor = "transparent";
              } else if (isMarked) {
                cellBackgroundColor = "#FF6B35";
                textColor = "#FFFFFF";
              } else {
                cellBackgroundColor = "#80CBC4";
                textColor = "#FFFFFF";
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
                    },
                    isEmpty && styles.emptyCell,
                    isMarked && styles.markedCell,
                    !isEmpty && !isMarked && styles.numberCell,
                  ]}
                  onPress={() => cellNumber && handleNumberClick(ticketId, cellNumber, isMarked)}
                  onLongPress={() => cellNumber && speakNumber(cellNumber)}
                  disabled={isEmpty || markingLoading}
                >
                  {!isEmpty && (
                    <Animated.View 
                      style={[
                        styles.cellContent,
                        shouldBlink && blinkingAnim && {
                          backgroundColor: blinkingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [cellBackgroundColor, '#FFD700']
                          })
                        }
                      ]}
                    >
                      <Text style={[styles.cellNumber, { color: textColor }]}>
                        {cellNumber}
                      </Text>
                    </Animated.View>
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
          <Text style={styles.ticketNumber}>Ticket #{item.ticket_number}</Text>
        </View>
        
        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={styles.viewPatternsButton}
            onPress={() => handleViewPatterns(item.id)}
          >
            <Ionicons name="eye-outline" size={16} color="#40E0D0" />
            <Text style={styles.viewPatternsButtonText}>View Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => openMenu(item.id)}
            ref={el => menuRefs.current[index] = el}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6C757D" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ticketGridWrapper}>
        {renderTicketGrid(item.ticket_data, item.id)}
      </View>
    </View>
  );

  const renderPatternMenu = () => {
    if (!selectedTicket) return null;

    const ticketPatterns = patternsByTicket[selectedTicket] || {};
    const availablePatterns = patternRewards.filter(pattern => {
      const patternCount = totalPatternCounts[pattern.pattern_id];
      const patternOnTicket = ticketPatterns[pattern.pattern_id];
      
      // Pattern is disabled if:
      // 1. Already claimed on this ticket (and not rejected)
      // 2. Global limit is reached
      return !(
        (patternOnTicket && patternOnTicket.status !== 'rejected') ||
        (patternCount && patternCount.total > 0 && patternCount.claimed >= patternCount.total)
      );
    });

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
              <TouchableOpacity onPress={closeMenu}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.patternsMenuScroll}>
              {availablePatterns.length === 0 ? (
                <View style={styles.noPatternsContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color="#FFD700" />
                  <Text style={styles.noPatternsText}>No available patterns for this ticket</Text>
                  <Text style={styles.noPatternsSubtext}>
                    All patterns have been claimed or limits reached
                  </Text>
                </View>
              ) : (
                availablePatterns.map((pattern, index) => {
                  const patternCount = totalPatternCounts[pattern.pattern_id] || {};
                  const patternOnTicket = ticketPatterns[pattern.pattern_id];
                  const isDisabled = patternOnTicket && patternOnTicket.status !== 'rejected';
                  const isLimitReached = patternCount.total > 0 && patternCount.claimed >= patternCount.total;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.patternMenuItem,
                        isDisabled && styles.disabledPatternItem
                      ]}
                      onPress={() => submitClaim(selectedTicket, pattern)}
                      disabled={submittingClaim || isDisabled || isLimitReached}
                    >
                      <View style={styles.patternMenuItemContent}>
                        <Ionicons 
                          name={isDisabled ? "checkmark-circle" : "trophy-outline"} 
                          size={20} 
                          color={isDisabled ? SUCCESS_COLOR : SECONDARY_COLOR} 
                        />
                        <View style={styles.patternMenuItemInfo}>
                          <Text style={styles.patternMenuItemName}>
                            {pattern.reward_name}
                            {isDisabled && (
                              <Text style={styles.claimedBadge}> ✓ Claimed</Text>
                            )}
                          </Text>
                          <Text style={styles.patternMenuItemDesc} numberOfLines={2}>
                            Prize: ₹{pattern.amount}
                            {patternCount.total > 0 && (
                              <Text style={styles.patternLimitText}>
                                {" "}• Limit: {patternCount.claimed}/{patternCount.total}
                              </Text>
                            )}
                          </Text>
                        </View>
                        {submittingClaim && patternOnTicket ? (
                          <ActivityIndicator size="small" color={SECONDARY_COLOR} />
                        ) : (
                          <View style={styles.patternStatusContainer}>
                            {isLimitReached && (
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
        }}
      >
        <View style={styles.patternsModalOverlay}>
          <View style={styles.patternsModalContainer}>
            <View style={styles.patternsModalHeader}>
              <Text style={styles.patternsModalTitle}>Available Patterns</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowPatternsModal(false);
                }}
                style={styles.patternsModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.patternsModalSubtitle}>
              Tap on a pattern to see it highlighted on ALL your tickets for 3 seconds
            </Text>
            
            {/* Show current blinking pattern info */}
            {blinkingPattern && (
              <View style={styles.currentBlinkingPatternContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.currentBlinkingPatternText}>
                  Currently showing: <Text style={styles.currentBlinkingPatternName}>{blinkingPattern.display_name}</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stopBlinkingButton}
                  onPress={stopAllBlinking}
                >
                  <Ionicons name="stop-circle" size={16} color="#FF5252" />
                  <Text style={styles.stopBlinkingText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Early Five Note */}
            <View style={styles.earlyFiveNoteContainer}>
              <Ionicons name="information-circle" size={20} color="#40E0D0" />
              <Text style={styles.earlyFiveNoteText}>
                <Text style={styles.earlyFiveNoteBold}>Early Five pattern:</Text> Shows the first 5 called numbers that appear on each ticket
              </Text>
            </View>
            
            {loadingPatterns ? (
              <View style={styles.patternsLoadingContainer}>
                <ActivityIndicator size="large" color="#40E0D0" />
                <Text style={styles.patternsLoadingText}>Loading patterns...</Text>
              </View>
            ) : (
              <ScrollView style={styles.patternsList}>
                {availablePatterns.length === 0 ? (
                  <View style={styles.noAvailablePatternsContainer}>
                    <Ionicons name="alert-circle-outline" size={40} color="#FFD700" />
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
                            size={20} 
                            color={isSelected ? "#FFD700" : "#40E0D0"} 
                          />
                          <View style={styles.patternListItemInfo}>
                            <Text style={styles.patternListItemName}>
                              {pattern.display_name}
                              {isSelected && (
                                <Text style={styles.selectedBadge}> • Selected</Text>
                              )}
                            </Text>
                            <Text style={styles.patternListItemDesc} numberOfLines={2}>
                              {pattern.description}
                            </Text>
                            <Text style={styles.patternListItemExample}>
                              {pattern.example}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                          )}
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
                onPress={stopAllBlinking}
              >
                <Ionicons name="refresh" size={16} color="#6C757D" />
                <Text style={styles.clearSelectionButtonText}>Stop All Blinking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closePatternsButton}
                onPress={() => {
                  setShowPatternsModal(false);
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
          {/* Confetti Animation */}
          {confettiTranslateY.current.map((anim, index) => (
            <Animated.View
              key={`confetti-${index}`}
              style={[
                styles.confettiParticle,
                {
                  left: `${(index * 5) % 100}%`,
                  transform: [{ translateY: anim }],
                  backgroundColor: ['#FF6B35', '#40E0D0', '#FFD700', '#4CAF50'][index % 4],
                }
              ]}
            />
          ))}

          {/* Celebration Popup */}
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
              <Ionicons name="trophy" size={40} color="#FFD700" style={styles.trophyIcon} />
              
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
                <Ionicons name="sparkles" size={16} color="#FFD700" />
                <Text style={styles.celebrationText}>CONGRATULATIONS!</Text>
                <Ionicons name="sparkles" size={16} color="#FFD700" />
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
        return { backgroundColor: '#4CAF50' };
      case 'error':
        return { backgroundColor: '#FF5252' };
      case 'warning':
        return { backgroundColor: '#FF9800' };
      default:
        return { backgroundColor: '#40E0D0' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Game Room...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Patterns Modal */}
      {renderPatternsModal()}

      {/* Winning Celebration Modal */}
      {renderWinningCelebration()}

      {/* Game End Modal */}
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
              <Text style={styles.gameEndModalTitle}>Game Complete! 🎉</Text>
            </View>
            
            <View style={styles.gameEndModalBody}>
              <Text style={styles.gameEndCongratulations}>
                Congratulations!
              </Text>
              <Text style={styles.gameEndMessage}>
                All 90 numbers have been called! The game has ended.
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

      {/* Voice Selection Modal */}
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
                <Ionicons name="close" size={24} color="#6C757D" />
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
                  color={voiceType === 'female' ? "#40E0D0" : "#6C757D"} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Female Voice</Text>
                <Text style={styles.voiceOptionDesc}>Higher pitch, clear pronunciation</Text>
              </View>
              {voiceType === 'female' && (
                <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
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
                  color={voiceType === 'male' ? "#40E0D0" : "#6C757D"} 
                />
              </View>
              <View style={styles.voiceOptionInfo}>
                <Text style={styles.voiceOptionName}>Male Voice</Text>
                <Text style={styles.voiceOptionDesc}>Lower pitch, deeper tone</Text>
              </View>
              {voiceType === 'male' && (
                <Ionicons name="checkmark-circle" size={24} color="#40E0D0" />
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

      {/* Pattern Menu Modal */}
      {renderPatternMenu()}

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
              <Ionicons name="game-controller" size={16} color="#6C757D" />
              <Text style={styles.gameCode}>Game Room</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => setShowVoiceModal(true)}
            >
              <Image
                source={{ uri: GAME_IMAGES.voice }}
                style={styles.voiceButtonIcon}
              />
              <Text style={styles.voiceButtonText}>
                {voiceType === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
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
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Content */}
        <View style={styles.content}>
          {/* Last Called Number Card */}
          <View style={styles.card}>
            <View style={styles.cardPattern} />
            
            {calledNumbers.length > 0 ? (
              <View style={styles.compactNumberDisplay}>
                {/* Left side - Last Called Number */}
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
                      {calledNumbers.length >= 90 
                        ? "Game Completed" 
                        : `Tap to hear`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Right side - Recent Numbers */}
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
                        size={16} 
                        color="#40E0D0" 
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
                        <Text style={styles.viewMoreText}>View More</Text>
                        <Ionicons name="chevron-forward" size={14} color="#40E0D0" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.waitingSection}>
                <Ionicons name="hourglass-outline" size={40} color="#FFD700" />
                <Text style={styles.waitingText}>
                  Waiting for numbers to be called...
                </Text>
              </View>
            )}
          </View>

          {/* My Tickets Section */}
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
                {/* Show blinking pattern info if active */}
                {blinkingPattern && (
                  <View style={styles.activePatternContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.activePatternText}>
                      Showing: <Text style={styles.activePatternName}>{blinkingPattern.display_name}</Text> pattern
                    </Text>
                    <TouchableOpacity
                      style={styles.stopBlinkingSmallButton}
                      onPress={stopAllBlinking}
                    >
                      <Ionicons name="close" size={14} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Tickets List */}
                <View style={styles.ticketsList}>
                  {myTickets.map((ticket, index) => (
                    <View key={ticket.id} style={styles.ticketWrapper}>
                      {renderTicketItem({ item: ticket, index })}
                    </View>
                  ))}
                </View>

                <Text style={styles.ticketsHint}>
                  Tap numbers to mark/unmark them • Long press to hear number • Tap 👁 to view patterns • Tap ⋮ to submit claim
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Bottom Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={joinChat}
        activeOpacity={0.9}
      >
        <View style={styles.chatButtonContent}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
          {participantCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>
                {participantCount > 99 ? '99+' : participantCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.chatButtonText}>
          {isChatJoined ? 'Live Chat' : 'Join Chat'}
        </Text>
      </TouchableOpacity>

      {/* Snackbar for Notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        style={[styles.snackbar, getSnackbarStyle()]}
      >
        <View style={styles.snackbarContent}>
          {snackbarType === 'success' && (
            <Ionicons name="trophy" size={20} color="#FFF" style={styles.snackbarIcon} />
          )}
          {snackbarType === 'error' && (
            <Ionicons name="close-circle" size={20} color="#FFF" style={styles.snackbarIcon} />
          )}
          {snackbarType === 'info' && (
            <Ionicons name="information-circle" size={20} color="#FFF" style={styles.snackbarIcon} />
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
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 12,
    zIndex: 1,
  },
  // Active Pattern Container
  activePatternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  activePatternText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  activePatternName: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  stopBlinkingSmallButton: {
    padding: 4,
  },
  // Current Blinking Pattern Container in Modal
  currentBlinkingPatternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  currentBlinkingPatternText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  currentBlinkingPatternName: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  stopBlinkingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF5252',
    gap: 4,
  },
  stopBlinkingText: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: '600',
  },
  // Winning Celebration Styles
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
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  celebrationInner: {
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  trophyIcon: {
    marginBottom: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  winningTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  winnerInfo: {
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#40E0D0',
    width: '100%',
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  winnerPattern: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    textAlign: 'center',
  },
  prizeAmountContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B35',
    width: '100%',
  },
  prizeAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF6B35',
    textShadowColor: 'rgba(255, 107, 53, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  prizeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C757D',
    letterSpacing: 1,
  },
  celebrationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginHorizontal: 8,
  },
  closeCelebrationButton: {
    backgroundColor: '#40E0D0',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
  },
  closeCelebrationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confettiParticle: {
    width: 8,
    height: 8,
    borderRadius: 1,
    position: 'absolute',
    top: -50,
  },
  // Header Styles
  header: {
    backgroundColor: "#40E0D0",
    paddingTop: 20,
    paddingHorizontal: 20,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 4,
  },
  voiceButtonIcon: {
    width: 16,
    height: 16,
  },
  voiceButtonText: {
    fontSize: 12,
    color: "#40E0D0",
    fontWeight: "600",
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
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
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  patternsMenuScroll: {
    maxHeight: 300,
  },
  patternMenuItem: {
    padding: 16,
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
    marginLeft: 12,
  },
  patternMenuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  patternMenuItemDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  patternStatusContainer: {
    marginLeft: 8,
  },
  patternLimitText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  claimedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  noPatternsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noPatternsText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  noPatternsSubtext: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Patterns Modal Styles
  patternsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  patternsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  patternsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  patternsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  patternsModalCloseButton: {
    padding: 4,
  },
  patternsModalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  // Early Five Note Styles
  earlyFiveNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#40E0D0',
  },
  earlyFiveNoteText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  earlyFiveNoteBold: {
    fontWeight: '700',
    color: '#40E0D0',
  },
  patternsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  patternsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  patternsList: {
    maxHeight: 400,
  },
  patternListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  selectedPatternListItem: {
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#40E0D0',
  },
  patternListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternListItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patternListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  patternListItemDesc: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  patternListItemExample: {
    fontSize: 11,
    color: '#FF6B35',
    fontStyle: 'italic',
  },
  selectedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 6,
  },
  clearSelectionButtonText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
  },
  closePatternsButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#40E0D0',
    borderRadius: 8,
  },
  closePatternsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Ticket Actions Styles
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
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#40E0D0',
    gap: 4,
  },
  viewPatternsButtonText: {
    fontSize: 12,
    color: '#40E0D0',
    fontWeight: '600',
  },
  menuButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Cell Content Style (for blinking)
  cellContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Game End Modal Styles
  gameEndModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confettiImage: {
    width: 200,
    height: 200,
    opacity: 0.7,
  },
  gameEndModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  gameEndModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameEndTrophy: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  gameEndModalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B35',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  gameEndModalBody: {
    marginBottom: 24,
  },
  gameEndCongratulations: {
    fontSize: 22,
    fontWeight: '800',
    color: '#40E0D0',
    textAlign: 'center',
    marginBottom: 12,
  },
  gameEndMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  gameEndStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  endStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  endStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#212529',
    marginBottom: 4,
  },
  endStatLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },
  gameEndThanks: {
    fontSize: 14,
    color: '#212529',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  gameEndModalFooter: {
    gap: 12,
  },
  viewWinnersButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewWinnersButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  closeButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
    lineHeight: 20,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  selectedVoiceOption: {
    borderColor: '#40E0D0',
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  voiceOptionIcon: {
    marginRight: 16,
  },
  voiceOptionInfo: {
    flex: 1,
  },
  voiceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  voiceOptionDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40E0D0',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  testVoiceButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  compactNumberDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  lastNumberLeft: {
    flex: 1,
    minWidth: 120,
  },
  recentNumbersRight: {
    flex: 1,
    minWidth: 120,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  sectionIcon: {
    width: 18,
    height: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
  },
  voiceIndicator: {
    marginLeft: 'auto',
  },
  compactLastNumberContainer: {
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#40E0D0",
    marginBottom: 8,
  },
  compactLastNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: "#40E0D0",
    marginBottom: 2,
  },
  compactLastNumberLabel: {
    fontSize: 10,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: 'center',
  },
  recentNumbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  numberChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  latestChip: {
    backgroundColor: "#40E0D0",
    borderColor: "#40E0D0",
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#40E0D0",
    gap: 4,
    height: 36,
    minWidth: 100,
  },
  viewMoreText: {
    fontSize: 12,
    color: "#40E0D0",
    fontWeight: "600",
  },
  waitingSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: "#FF6B35",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  // Tickets Section
  ticketsSection: {
    marginBottom: 16,
  },
  // Empty Tickets
  emptyTicketsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginTop: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  // Tickets List
  ticketsList: {
    
  },
  ticketWrapper: {
    marginBottom: 0,
    position: 'relative',
  },
  // Ticket Item Container
  ticketItemContainer: {
    marginBottom: 0,
    padding: 0,
  },
  // Ticket Header with Ticket Number and Menu Button
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketIcon: {
    width: 16,
    height: 16,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  // Ticket Grid Wrapper
  ticketGridWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    alignItems: 'center',
  },
  ticketGridContainer: {
    overflow: 'hidden',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: CELL_SIZE * 9,
  },
  ticketRow: {
    flexDirection: "row",
  },
  ticketCell: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  emptyCell: {
    backgroundColor: "#F5F5F5",
  },
  markedCell: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  numberCell: {
    backgroundColor: "#80CBC4",
  },
  cellNumber: {
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ticketsHint: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  bottomSpace: {
    height: 20,
  },
  // Floating Chat Button
  floatingChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#40E0D0',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chatButtonContent: {
    position: 'relative',
    marginRight: 8,
  },
  chatBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  // Snackbar Styles
  snackbar: {
    borderRadius: 8,
    margin: 16,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarIcon: {
    marginRight: 8,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default UserGameRoom;