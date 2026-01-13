// import React, { useEffect, useState } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   ScrollView,
//   TouchableOpacity,
//   Modal,
//   ActivityIndicator,
//   Alert,
//   TextInput,
//   Image,
//   RefreshControl,
//   SafeAreaView,
//   Dimensions,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";

// const { width } = Dimensions.get("window");

// const GameDetails = ({ route, navigation }) => {
//   const { game } = route.params;
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [ticketModalVisible, setTicketModalVisible] = useState(false);
//   const [ticketQuantity, setTicketQuantity] = useState(1);
//   const [ticketMessage, setTicketMessage] = useState("");
//   const [requestLoading, setRequestLoading] = useState(false);
//   const [myTicketCount, setMyTicketCount] = useState(0);
//   const [myRequestCount, setMyRequestCount] = useState(0);
//   const [gameStatus, setGameStatus] = useState(null);
//   const [callingStatus, setCallingStatus] = useState(null);
//   const [calledNumbers, setCalledNumbers] = useState([]);
//   const [timer, setTimer] = useState(0);
//   const [joiningRoom, setJoiningRoom] = useState(false);
//   const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
//   // Add new state for total tickets in game
//   const [totalTicketsInGame, setTotalTicketsInGame] = useState(0);

//   // Toast state
//   const [toast, setToast] = useState({ visible: false, message: "", type: "" });

//   const GAME_IMAGES = {
//     header: "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
//     trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
//     calendar: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
//     ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
//     players: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
//     empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
//     pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
//     celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
//     diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
//     wallet: "https://cdn-icons-png.flaticon.com/512/1061/1061140.png",
//     request: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
//     requests: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
//     live: "https://cdn-icons-png.flaticon.com/512/2809/2809645.png",
//     scheduled: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
//   };

//   const MAX_TICKETS_PER_USER = 4; // Maximum tickets allowed per user

//   useEffect(() => {
//     fetchGameStatus();
//     fetchMyTicketCount();
//     fetchMyRequestCount();
//     fetchTotalTicketsInGame();
    
//     const unsubscribe = navigation.addListener('focus', () => {
//       fetchGameStatus();
//       fetchMyTicketCount();
//       fetchMyRequestCount();
//       fetchTotalTicketsInGame();
//       setJoiningRoom(false);
//       setHasJoinedRoom(false);
//     });

//     return unsubscribe;
//   }, [navigation]);

//   // Calculate remaining tickets user can request
//   const getRemainingTickets = () => {
//     return MAX_TICKETS_PER_USER - totalTicketsInGame;
//   };

//   // Check if user has reached ticket limit
//   const hasReachedTicketLimit = () => {
//     return totalTicketsInGame >= MAX_TICKETS_PER_USER;
//   };

//   // Check if user can request more tickets with selected quantity
//   const canRequestTickets = () => {
//     const remaining = getRemainingTickets();
//     return ticketQuantity <= remaining && remaining > 0;
//   };

//   // Toast Functions
//   const showToast = (message, type = "success") => {
//     setToast({ visible: true, message, type });
//   };

//   const hideToast = () => {
//     setToast({ ...toast, visible: false });
//   };

//   // Toast Component
//   const Toast = () => {
//     if (!toast.visible) return null;
    
//     const backgroundColor = toast.type === "success" ? "#40E0D0" : "#FF6B6B";
    
//     useEffect(() => {
//       const timer = setTimeout(() => {
//         hideToast();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }, []);

//     return (
//       <View style={[styles.toast, { backgroundColor }]}>
//         <Ionicons 
//           name={toast.type === "success" ? "checkmark-circle" : "alert-circle"} 
//           size={20} 
//           color="#FFF" 
//         />
//         <Text style={styles.toastText}>{toast.message}</Text>
//       </View>
//     );
//   };

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     Promise.all([
//       fetchGameStatus(), 
//       fetchMyTicketCount(), 
//       fetchMyRequestCount(),
//       fetchTotalTicketsInGame()
//     ]).finally(() =>
//       setRefreshing(false)
//     );
//   }, []);

//   const fetchGameStatus = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.get(
//         `https://exilance.com/tambolatimez/public/api/user/games/${game.id}/calling-status`,
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
        
//         if (data.calling?.is_running && !data.calling?.is_paused) {
//           setTimer(data.calling?.interval_seconds || 60);
//         }
//       }
//     } catch (error) {
//       console.log("Error fetching game status:", error);
//     }
//   };

//   const fetchMyTicketCount = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const res = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/my-tickets",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.success) {
//         const gameTickets = res.data.tickets.data.filter(
//           (ticket) => ticket.game_id === game.id
//         );
//         setMyTicketCount(gameTickets.length);
//       }
//     } catch (error) {
//       console.log("Error fetching ticket count:", error);
//     }
//   };

//   const fetchMyRequestCount = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const res = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.success) {
//         const gameRequests = res.data.ticket_requests.data.filter(
//           (request) => request.game_id === game.id
//         );
//         setMyRequestCount(gameRequests.length);
//       }
//     } catch (error) {
//       console.log("Error fetching request count:", error);
//     }
//   };

//   const fetchTotalTicketsInGame = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
      
//       // Fetch allocated tickets
//       const ticketsRes = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/my-tickets",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       // Fetch pending ticket requests
//       const requestsRes = await axios.get(
//         "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       if (ticketsRes.data.success && requestsRes.data.success) {
//         // Count allocated tickets for this game
//         const allocatedTickets = ticketsRes.data.tickets.data.filter(
//           (ticket) => ticket.game_id == game.id
//         ).length;
        
//         // Count pending requests for this game (only count pending ones)
//         const pendingRequests = requestsRes.data.ticket_requests.data.filter(
//           (request) => 
//             request.game_id == game.id && 
//             request.status === 'pending'
//         ).length;
        
//         // Calculate total tickets (allocated + pending requests)
//         const total = allocatedTickets + pendingRequests;
//         setTotalTicketsInGame(total);
//       }
//     } catch (error) {
//       console.log("Error fetching total tickets:", error);
//     }
//   };

//   const updateGameRoomStatus = async () => {
//     try {
//       setJoiningRoom(true);
//       const token = await AsyncStorage.getItem("token");
      
//       const response = await axios.post(
//         `https://exilance.com/tambolatimez/public/api/user/game-room/${game.id}/update-status`,
//         {
//           is_active: true
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         setHasJoinedRoom(true);
//         showToast("Joined game room successfully!", "success");
//         navigation.navigate("UserGameRoom", { 
//           gameId: game.id,
//           gameName: game.game_name 
//         });
//         setJoiningRoom(false);
//       } else {
//         showToast(response.data.message || "Failed to join game room", "error");
//         setJoiningRoom(false);
//       }
//     } catch (error) {
//       console.log("Error updating game room status:", error.response?.data || error.message);
//       showToast(
//         error.response?.data?.message || "Failed to join game room. Please try again.",
//         "error"
//       );
//       setJoiningRoom(false);
//     }
//   };

//   const handleRequestTickets = async () => {
//     // Check if user has reached ticket limit
//     if (hasReachedTicketLimit()) {
//       showToast(`You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`, "error");
//       return;
//     }

//     // Check if requested quantity exceeds remaining limit
//     const remaining = getRemainingTickets();
//     if (ticketQuantity > remaining) {
//       showToast(`You can only request up to ${remaining} more ticket(s)`, "error");
//       return;
//     }

//     if (ticketQuantity < 1 || ticketQuantity > 4) {
//       showToast("Ticket quantity must be between 1 and 4", "error");
//       return;
//     }

//     setRequestLoading(true);
//     try {
//       const token = await AsyncStorage.getItem("token");
//       const response = await axios.post(
//         "https://exilance.com/tambolatimez/public/api/user/ticket-requests/send",
//         {
//           game_id: game.id,
//           ticket_quantity: ticketQuantity,
//           message:
//             ticketMessage || `Request for ${ticketQuantity} ticket(s)`,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const isSuccess = 
//         response.data.success === true || 
//         response.data.status === true || 
//         response.data.message?.toLowerCase().includes("success");

//       if (isSuccess) {
//         showToast(response.data.message || "Ticket request submitted successfully!", "success");
        
//         setTicketModalVisible(false);
//         setTicketQuantity(1);
//         setTicketMessage("");
        
//         // Refresh all counts
//         fetchMyRequestCount();
//         fetchMyTicketCount();
//         fetchTotalTicketsInGame();
        
//         setTimeout(() => {
//           navigation.navigate("TicketRequestsScreen", { 
//             gameId: game.id,
//             gameName: game.game_name 
//           });
//         }, 1500);
//       } else {
//         const errorMessage = response.data.message || 
//                             response.data.error || 
//                             "Failed to submit request";
//         showToast(errorMessage, "error");
//       }
//     } catch (error) {
//       console.log("Request error:", error.response?.data || error.message);
      
//       let errorMessage = "Failed to submit ticket request. Please try again.";
      
//       if (error.response) {
//         errorMessage = error.response.data?.message || 
//                       error.response.data?.error || 
//                       `Server error: ${error.response.status}`;
//       } else if (error.request) {
//         errorMessage = "No response from server. Please check your connection.";
//       }
      
//       showToast(errorMessage, "error");
//     } finally {
//       setRequestLoading(false);
//     }
//   };

//   const navigateToTickets = () => {
//     navigation.navigate("TicketsScreen", { game });
//   };

//   const navigateToMyRequests = () => {
//     navigation.navigate("TicketRequestsScreen", { 
//       gameId: game.id,
//       gameName: game.game_name 
//     });
//   };

//   const handleJoinGameRoom = () => {
//     if (!gameStatus || gameStatus.status !== 'live') {
//       showToast("Game is not live yet!", "info");
//       return;
//     }
    
//     if (hasJoinedRoom) {
//       navigation.navigate("UserGameRoom", { 
//         gameId: game.id,
//         gameName: game.game_name 
//       });
//     } else {
//       updateGameRoomStatus();
//     }
//   };

//   const renderTicketLimitInfo = () => {
//     const remaining = getRemainingTickets();
//     const hasLimit = hasReachedTicketLimit();
    
//     return (
//       <View style={[
//         styles.ticketLimitContainer,
//         hasLimit ? styles.ticketLimitReached : styles.ticketLimitAvailable
//       ]}>
//         <View style={styles.ticketLimitIcon}>
//           <Ionicons 
//             name={hasLimit ? "alert-circle" : "ticket"} 
//             size={16} 
//             color={hasLimit ? "#FF6B6B" : "#40E0D0"} 
//           />
//         </View>
//         <View style={styles.ticketLimitInfo}>
//           <Text style={[
//             styles.ticketLimitTitle,
//             hasLimit && styles.ticketLimitTitleReached
//           ]}>
//             {hasLimit ? "Ticket Limit Reached" : "Ticket Limit"}
//           </Text>
//           <Text style={styles.ticketLimitText}>
//             {hasLimit 
//               ? `You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`
//               : `You have ${myTicketCount} allocated + ${myRequestCount} pending = ${totalTicketsInGame}/4 tickets`
//             }
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* Toast Notification */}
//       <Toast />
      
//       <ScrollView
//         style={styles.container}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#40E0D0"
//             colors={["#40E0D0"]}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Background Patterns */}
//         <View style={styles.backgroundPatterns}>
//           <View style={styles.patternCircle1} />
//           <View style={styles.patternCircle2} />
//         </View>

//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerTop}>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Ionicons name="arrow-back" size={24} color="#40E0D0" />
//             </TouchableOpacity>
            
//             <View style={styles.headerTextContainer}>
//               <Text style={styles.gameName} numberOfLines={2} ellipsizeMode="tail">
//                 {game.game_name}
//               </Text>
//               <View style={styles.gameCodeContainer}>
//                 <MaterialIcons
//                   name="fingerprint"
//                   size={16}
//                   color="#6C757D"
//                 />
//                 <Text style={styles.gameCode}>{game.game_code}</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Content */}
//         <View style={styles.content}>
//           {/* Game Status Card */}
//           <View style={styles.card}>
//             <View style={styles.cardPattern} />
            
//             <View style={styles.cardHeader}>
//               <Image
//                 source={{ 
//                   uri: gameStatus?.status === 'live' 
//                     ? GAME_IMAGES.live 
//                     : GAME_IMAGES.scheduled 
//                 }}
//                 style={styles.cardHeaderImage}
//               />
//               <Text style={styles.cardTitle}>
//                 {gameStatus?.status === 'live' ? 'Game Status' : 'Game Schedule'}
//               </Text>
//               <View style={[
//                 styles.statusBadge,
//                 { 
//                   backgroundColor: gameStatus?.status === 'live' 
//                     ? '#4CAF5020' 
//                     : '#40E0D020' 
//                 }
//               ]}>
//                 <Ionicons 
//                   name={gameStatus?.status === 'live' ? 'radio-button-on' : 'time'} 
//                   size={12} 
//                   color={gameStatus?.status === 'live' ? '#4CAF50' : '#40E0D0'} 
//                 />
//                 <Text style={[
//                   styles.statusBadgeText,
//                   { 
//                     color: gameStatus?.status === 'live' 
//                       ? '#4CAF50' 
//                       : '#40E0D0' 
//                   }
//                 ]}>
//                   {gameStatus?.status?.toUpperCase() || 'LOADING'}
//                 </Text>
//               </View>
//             </View>
            
//             {gameStatus?.status === 'live' ? (
//               <View>
//                 <Text style={styles.cardDescription}>
//                   The game is now live! Number calling has started.
//                 </Text>
//                 {callingStatus?.is_running ? (
//                   <View style={styles.statsContainer}>
//                     <View style={styles.statCard}>
//                       <View style={styles.statIcon}>
//                         <Ionicons name="megaphone" size={20} color="#40E0D0" />
//                       </View>
//                       <Text style={styles.statValue}>
//                         {calledNumbers.length}
//                       </Text>
//                       <Text style={styles.statLabel}>Called</Text>
//                     </View>
//                     <View style={styles.statCard}>
//                       <View style={styles.statIcon}>
//                         <Ionicons name="time" size={20} color="#FF6B35" />
//                       </View>
//                       <Text style={styles.statValue}>
//                         {timer}s
//                       </Text>
//                       <Text style={styles.statLabel}>Next Call</Text>
//                     </View>
//                     <View style={styles.statCard}>
//                       <View style={styles.statIcon}>
//                         <Ionicons name="grid" size={20} color="#FFD700" />
//                       </View>
//                       <Text style={styles.statValue}>
//                         {90 - calledNumbers.length}
//                       </Text>
//                       <Text style={styles.statLabel}>Remaining</Text>
//                     </View>
//                   </View>
//                 ) : (
//                   <Text style={styles.waitingText}>
//                     Number calling will start soon...
//                   </Text>
//                 )}
                
//                 <TouchableOpacity
//                   style={[styles.primaryButton, joiningRoom && styles.buttonDisabled]}
//                   onPress={handleJoinGameRoom}
//                   disabled={joiningRoom}
//                 >
//                   {joiningRoom ? (
//                     <ActivityIndicator size="small" color="#FFF" />
//                   ) : (
//                     <>
//                       <Ionicons name="enter" size={20} color="#FFF" />
//                       <Text style={styles.primaryButtonText}>
//                         {hasJoinedRoom ? "Re-enter Game Room" : "Join Game Room"}
//                       </Text>
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               <View>
//                 <Text style={styles.cardDescription}>
//                   Game is scheduled to start on {new Date(game.game_date).toLocaleDateString("en-US", {
//                     weekday: "long",
//                     month: "long",
//                     day: "numeric",
//                     year: "numeric"
//                   })} at {game.game_start_time}
//                 </Text>
//                 <View style={styles.scheduledBadgeContainer}>
//                   <Ionicons name="calendar" size={20} color="#40E0D0" />
//                   <Text style={styles.scheduledBadgeText}>
//                     Game is Scheduled
//                   </Text>
//                 </View>
//               </View>
//             )}
//           </View>

//           {/* Game Details Card */}
//           <View style={styles.card}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Game Details</Text>
//               <Ionicons name="game-controller" size={24} color="#40E0D0" />
//             </View>

//             {/* Date & Time */}
//             <View style={styles.detailRow}>
//               <View style={styles.detailItem}>
//                 <View style={styles.detailIcon}>
//                   <Ionicons name="calendar" size={16} color="#40E0D0" />
//                 </View>
//                 <View>
//                   <Text style={styles.detailLabel}>Date</Text>
//                   <Text style={styles.detailText} numberOfLines={1}>
//                     {new Date(game.game_date).toLocaleDateString("en-US", {
//                       weekday: "short",
//                       month: "short",
//                       day: "numeric",
//                     })}
//                   </Text>
//                 </View>
//               </View>
              
//               <View style={styles.detailItem}>
//                 <View style={styles.detailIcon}>
//                   <Ionicons name="time" size={16} color="#40E0D0" />
//                 </View>
//                 <View>
//                   <Text style={styles.detailLabel}>Time</Text>
//                   <Text style={styles.detailText} numberOfLines={1}>
//                     {game.game_start_time}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* Prize Pool (Replaced Ticket Type) */}
//             <View style={styles.detailRow}>
//               <View style={styles.detailItem}>
//                 <View style={styles.detailIcon}>
//                   <MaterialIcons name="account-balance-wallet" size={16} color="#40E0D0" />
//                 </View>
//                 <View>
//                   <Text style={styles.detailLabel}>Prize Pool</Text>
//                   <Text style={styles.detailText} numberOfLines={1}>
//                     {game.ticket_type === "paid"
//                       ? `₹${(game.ticket_cost * game.max_players).toLocaleString()}`
//                       : "Exciting Prizes"}
//                   </Text>
//                 </View>
//               </View>
              
//               <View style={styles.detailItem}>
//                 <View style={styles.detailIcon}>
//                   <Ionicons name="person" size={16} color="#40E0D0" />
//                 </View>
//                 <View>
//                   <Text style={styles.detailLabel}>Host</Text>
//                   <Text style={styles.detailText} numberOfLines={1}>
//                     {game.user?.name || 'Tambola Timez'}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* Ticket Limit Information */}
//             {renderTicketLimitInfo()}

//             {/* My Tickets Count */}
//             <View style={styles.myCountContainer}>
//               <TouchableOpacity
//                 style={[
//                   styles.countButton,
//                   myTicketCount > 0 ? styles.hasCountButton : styles.noCountButton,
//                 ]}
//                 onPress={navigateToTickets}
//               >
//                 <View style={styles.countIcon}>
//                   <Image
//                     source={{ uri: GAME_IMAGES.ticket }}
//                     style={styles.countIconImage}
//                   />
//                 </View>
//                 <View style={styles.countInfo}>
//                   <Text style={styles.countLabel}>My Tickets</Text>
//                   <Text style={[
//                     styles.countValue,
//                     myTicketCount > 0 ? styles.hasCountValue : styles.noCountValue,
//                   ]}>
//                     {myTicketCount > 0
//                       ? `${myTicketCount} Ticket${myTicketCount > 1 ? "s" : ""}`
//                       : "No Tickets"}
//                   </Text>
//                 </View>
//                 {myTicketCount > 0 && (
//                   <Ionicons name="arrow-forward" size={16} color="#40E0D0" />
//                 )}
//               </TouchableOpacity>

//               {/* My Requests Count */}
//               <TouchableOpacity
//                 style={[
//                   styles.countButton,
//                   myRequestCount > 0 ? styles.hasCountButton : styles.noCountButton,
//                 ]}
//                 onPress={navigateToMyRequests}
//               >
//                 <View style={styles.countIcon}>
//                   <Image
//                     source={{ uri: GAME_IMAGES.requests }}
//                     style={styles.countIconImage}
//                   />
//                 </View>
//                 <View style={styles.countInfo}>
//                   <Text style={styles.countLabel}>My Requests</Text>
//                   <Text style={[
//                     styles.countValue,
//                     myRequestCount > 0 ? styles.hasCountValue : styles.noCountValue,
//                   ]}>
//                     {myRequestCount > 0
//                       ? `${myRequestCount} Request${myRequestCount > 1 ? "s" : ""}`
//                       : "No Requests"}
//                   </Text>
//                 </View>
//                 {myRequestCount > 0 && (
//                   <Ionicons name="arrow-forward" size={16} color="#40E0D0" />
//                 )}
//               </TouchableOpacity>
//             </View>

//             {game.message && (
//               <View style={styles.messageCard}>
//                 <View style={styles.messageHeader}>
//                   <MaterialIcons name="message" size={18} color="#40E0D0" />
//                   <Text style={styles.messageTitle}>Host Message</Text>
//                 </View>
//                 <Text style={styles.messageContent}>{game.message}</Text>
//               </View>
//             )}
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.card}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Actions</Text>
//               <Ionicons name="flash" size={24} color="#40E0D0" />
//             </View>

//             <View style={styles.actionsContainer}>
//               <TouchableOpacity
//                 style={[
//                   styles.actionButton,
//                   styles.primaryActionButton,
//                   game.ticket_type === "paid" ? styles.paidActionButton : styles.freeActionButton,
//                   (hasReachedTicketLimit() || loading) && styles.disabledButton,
//                 ]}
//                 onPress={() => {
//                   if (!hasReachedTicketLimit()) {
//                     setTicketModalVisible(true);
//                   } else {
//                     showToast(`You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`, "error");
//                   }
//                 }}
//                 disabled={hasReachedTicketLimit() || loading}
//               >
//                 <View style={styles.actionButtonIcon}>
//                   <Image
//                     source={{ uri: GAME_IMAGES.request }}
//                     style={styles.actionButtonImage}
//                   />
//                 </View>
//                 <Text style={styles.actionButtonText}>
//                   {hasReachedTicketLimit() ? "Limit Reached" : "Request Tickets"}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.actionButton,
//                   styles.secondaryActionButton,
//                   myTicketCount === 0 && styles.disabledButton,
//                 ]}
//                 onPress={navigateToTickets}
//                 disabled={myTicketCount === 0}
//               >
//                 <View style={styles.actionButtonIcon}>
//                   <Image
//                     source={{ uri: GAME_IMAGES.ticket }}
//                     style={styles.actionButtonImage}
//                   />
//                 </View>
//                 <Text style={styles.secondaryActionButtonText}>
//                   My Tickets
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.actionButton,
//                   styles.secondaryActionButton,
//                   myRequestCount === 0 && styles.disabledButton,
//                 ]}
//                 onPress={navigateToMyRequests}
//                 disabled={myRequestCount === 0}
//               >
//                 <View style={styles.actionButtonIcon}>
//                   <Image
//                     source={{ uri: GAME_IMAGES.requests }}
//                     style={styles.actionButtonImage}
//                   />
//                 </View>
//                 <Text style={styles.secondaryActionButtonText}>
//                   My Requests
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Game Rewards */}
//           {game.pattern_rewards && game.pattern_rewards.length > 0 && (
//             <View style={styles.card}>
//               <View style={styles.sectionHeader}>
//                 <Text style={styles.sectionTitle}>Game Rewards</Text>
//                 <Image
//                   source={{ uri: GAME_IMAGES.trophy }}
//                   style={styles.rewardsIcon}
//                 />
//               </View>
              
//               {game.pattern_rewards.map((reward, index) => (
//                 <View key={reward.pattern_id} style={styles.rewardCard}>
//                   <View style={styles.rewardPattern} />
                  
//                   <View style={styles.rewardHeader}>
//                     <View style={styles.rewardIcon}>
//                       <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
//                     </View>
//                     <View style={styles.rewardInfo}>
//                       <Text style={styles.rewardName} numberOfLines={1}>
//                         {reward.reward_name}
//                       </Text>
//                       <Text style={styles.rewardDescription} numberOfLines={2}>
//                         {reward.description}
//                       </Text>
//                     </View>
//                     <View style={styles.rewardAmountContainer}>
//                       <Text style={styles.rewardAmount} numberOfLines={1}>
//                         ₹{reward.amount}
//                       </Text>
//                     </View>
//                   </View>
                  
//                   <View style={styles.rewardFooter}>
//                     <View style={styles.rewardDetail}>
//                       <MaterialIcons name="confirmation-number" size={14} color="#40E0D0" />
//                       <Text style={styles.rewardDetailText} numberOfLines={1}>
//                         Count: {reward.reward_count}
//                       </Text>
//                     </View>
//                     <View style={styles.patternBadge}>
//                       <Text style={styles.patternBadgeText} numberOfLines={1}>
//                         Pattern {reward.pattern_id}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Bottom Space */}
//         <View style={styles.bottomSpace} />
//       </ScrollView>

//       {/* Ticket Request Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={ticketModalVisible}
//         onRequestClose={() => setTicketModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Request Tickets</Text>
//               <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
//                 <Ionicons name="close" size={24} color="#6C757D" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.modalGameInfo}>
//               <Text style={styles.modalGameName} numberOfLines={2}>
//                 {game.game_name}
//               </Text>
//               <Text style={styles.modalGameId}>ID: {game.game_code}</Text>
//               <View style={styles.modalTicketCost}>
//                 <Text style={[
//                   styles.modalTicketCostText,
//                   { color: game.ticket_type === "paid" ? "#FFD700" : "#40E0D0" }
//                 ]}>
//                   Ticket Price: {game.ticket_type === "paid" ? `₹${game.ticket_cost}` : "FREE"}
//                 </Text>
//               </View>
//             </View>

//             {/* Ticket Limit Info in Modal */}
//             <View style={[
//               styles.modalLimitInfo,
//               hasReachedTicketLimit() ? styles.modalLimitReached : styles.modalLimitAvailable
//             ]}>
//               <Ionicons 
//                 name={hasReachedTicketLimit() ? "alert-circle" : "information-circle"} 
//                 size={18} 
//                 color={hasReachedTicketLimit() ? "#FF6B6B" : "#40E0D0"} 
//               />
//               <Text style={styles.modalLimitText}>
//                 {hasReachedTicketLimit() 
//                   ? `You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`
//                   : `You can request up to ${getRemainingTickets()} more ticket(s)`
//                 }
//               </Text>
//             </View>

//             {/* Quantity Selector - Disable if limit reached */}
//             <View style={styles.quantitySection}>
//               <Text style={styles.quantityLabel}>Select Quantity (1-4)</Text>
//               <View style={styles.quantitySelector}>
//                 {[1, 2, 3, 4].map((num) => {
//                   const canSelect = num <= getRemainingTickets() && !hasReachedTicketLimit();
//                   return (
//                     <TouchableOpacity
//                       key={num}
//                       style={[
//                         styles.quantityButton,
//                         ticketQuantity === num && styles.quantityButtonActive,
//                         !canSelect && styles.quantityButtonDisabled,
//                       ]}
//                       onPress={() => canSelect && setTicketQuantity(num)}
//                       disabled={!canSelect}
//                     >
//                       <Text
//                         style={[
//                           styles.quantityButtonText,
//                           ticketQuantity === num && styles.quantityButtonTextActive,
//                           !canSelect && styles.quantityButtonTextDisabled,
//                         ]}
//                       >
//                         {num}
//                       </Text>
//                       {!canSelect && (
//                         <Ionicons 
//                           name="close-circle" 
//                           size={12} 
//                           color="#FF6B6B" 
//                           style={styles.quantityDisabledIcon}
//                         />
//                       )}
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             </View>

//             {/* Total Amount */}
//             {game.ticket_type === "paid" && (
//               <View style={styles.totalSection}>
//                 <View style={styles.totalLabelContainer}>
//                   <Ionicons name="wallet" size={20} color="#40E0D0" />
//                   <Text style={styles.totalLabel}>Total Amount:</Text>
//                 </View>
//                 <Text style={styles.totalAmount} numberOfLines={1}>
//                   ₹{game.ticket_cost * ticketQuantity}
//                 </Text>
//               </View>
//             )}

//             {/* Message Input */}
//             <View style={styles.messageSection}>
//               <Text style={styles.messageLabel}>Message (Optional)</Text>
//               <TextInput
//                 style={styles.messageInput}
//                 value={ticketMessage}
//                 onChangeText={setTicketMessage}
//                 placeholder="Add a message for the host..."
//                 multiline
//                 numberOfLines={3}
//                 maxLength={200}
//                 placeholderTextColor="#ADB5BD"
//               />
//               <Text style={styles.charCount}>
//                 {ticketMessage.length}/200 characters
//               </Text>
//             </View>

//             {/* Modal Actions */}
//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => setTicketModalVisible(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.submitButton,
//                   game.ticket_type === "paid"
//                     ? styles.paidSubmit
//                     : styles.freeSubmit,
//                   (requestLoading || hasReachedTicketLimit() || !canRequestTickets()) && styles.submitButtonDisabled,
//                 ]}
//                 onPress={handleRequestTickets}
//                 disabled={requestLoading || hasReachedTicketLimit() || !canRequestTickets()}
//               >
//                 {requestLoading ? (
//                   <ActivityIndicator size="small" color="#FFF" />
//                 ) : (
//                   <>
//                     <Ionicons name="send" size={18} color="#FFF" />
//                     <Text style={styles.submitButtonText}>
//                       {hasReachedTicketLimit() ? "Limit Reached" : "Submit Request"}
//                     </Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
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
//   // Toast Styles
//   toast: {
//     position: 'absolute',
//     top: 60,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     zIndex: 999,
//   },
//   toastText: {
//     color: '#FFF',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 10,
//     flex: 1,
//   },
//   backgroundPatterns: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     zIndex: 0,
//   },
//   patternCircle1: {
//     position: 'absolute',
//     top: 50,
//     right: 20,
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(64, 224, 208, 0.05)',
//   },
//   patternCircle2: {
//     position: 'absolute',
//     bottom: 200,
//     left: -30,
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(255, 107, 53, 0.03)',
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
//   content: {
//     padding: 20,
//     zIndex: 1,
//     marginTop: 0,
//   },
//   // Card Styles
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
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
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//     gap: 12,
//   },
//   cardHeaderImage: {
//     width: 24,
//     height: 24,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#212529",
//     flex: 1,
//   },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     gap: 4,
//   },
//   statusBadgeText: {
//     fontSize: 10,
//     fontWeight: "700",
//   },
//   cardDescription: {
//     fontSize: 14,
//     color: "#6C757D",
//     lineHeight: 20,
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 16,
//   },
//   statCard: {
//     alignItems: "center",
//     flex: 1,
//   },
//   statIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 10,
//     backgroundColor: "#F8F9FA",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 6,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#212529",
//     marginBottom: 2,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: "#6C757D",
//     fontWeight: "500",
//   },
//   waitingText: {
//     fontSize: 14,
//     color: "#FF6B35",
//     fontStyle: "italic",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   primaryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#40E0D0",
//     paddingVertical: 14,
//     borderRadius: 10,
//     gap: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   primaryButtonText: {
//     color: "#FFF",
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   scheduledBadgeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F8F9FA",
//     paddingVertical: 14,
//     borderRadius: 10,
//     gap: 8,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   scheduledBadgeText: {
//     color: "#40E0D0",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#212529",
//   },
//   // Ticket Limit Styles
//   ticketLimitContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 16,
//     borderWidth: 1,
//     gap: 12,
//   },
//   ticketLimitReached: {
//     backgroundColor: "rgba(255, 107, 107, 0.05)",
//     borderColor: "rgba(255, 107, 107, 0.2)",
//   },
//   ticketLimitAvailable: {
//     backgroundColor: "rgba(64, 224, 208, 0.05)",
//     borderColor: "rgba(64, 224, 208, 0.2)",
//   },
//   ticketLimitIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     backgroundColor: "#FFFFFF",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   ticketLimitInfo: {
//     flex: 1,
//   },
//   ticketLimitTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#40E0D0",
//     marginBottom: 2,
//   },
//   ticketLimitTitleReached: {
//     color: "#FF6B6B",
//   },
//   ticketLimitText: {
//     fontSize: 12,
//     color: "#6C757D",
//     lineHeight: 16,
//   },
//   detailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   detailItem: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 8,
//     flex: 1,
//   },
//   detailIcon: {
//     width: 28,
//     height: 28,
//     borderRadius: 8,
//     backgroundColor: "#F8F9FA",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   detailLabel: {
//     fontSize: 10,
//     color: "#6C757D",
//     fontWeight: "500",
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: "#212529",
//     fontWeight: "600",
//   },
//   myCountContainer: {
//     gap: 8,
//     marginBottom: 16,
//   },
//   countButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     borderRadius: 10,
//     borderWidth: 1,
//     gap: 12,
//   },
//   hasCountButton: {
//     backgroundColor: "#F8F9FA",
//     borderColor: "#E9ECEF",
//   },
//   noCountButton: {
//     backgroundColor: "#F8F9FA",
//     borderColor: "#E9ECEF",
//     opacity: 0.7,
//   },
//   countIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#F8F9FA",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   countIconImage: {
//     width: 20,
//     height: 20,
//   },
//   countInfo: {
//     flex: 1,
//   },
//   countLabel: {
//     fontSize: 11,
//     color: "#6C757D",
//     fontWeight: "500",
//     marginBottom: 2,
//   },
//   countValue: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   hasCountValue: {
//     color: "#40E0D0",
//   },
//   noCountValue: {
//     color: "#6C757D",
//   },
//   messageCard: {
//     backgroundColor: "#F8F9FA",
//     borderRadius: 10,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   messageHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 8,
//   },
//   messageTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#40E0D0",
//   },
//   messageContent: {
//     fontSize: 13,
//     color: "#6C757D",
//     lineHeight: 18,
//   },
//   actionsContainer: {
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 14,
//     borderRadius: 10,
//     gap: 8,
//   },
//   actionButtonIcon: {
//     width: 24,
//     height: 24,
//   },
//   actionButtonImage: {
//     width: "100%",
//     height: "100%",
//   },
//   primaryActionButton: {},
//   paidActionButton: {
//     backgroundColor: "#40E0D0",
//   },
//   freeActionButton: {
//     backgroundColor: "#40E0D0",
//   },
//   actionButtonText: {
//     color: "#FFF",
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   secondaryActionButton: {
//     backgroundColor: "#FFF",
//     borderWidth: 1,
//     borderColor: "#40E0D0",
//   },
//   secondaryActionButtonText: {
//     color: "#40E0D0",
//     fontSize: 14,
//     fontWeight: "700",
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   rewardsIcon: {
//     width: 24,
//     height: 24,
//   },
//   rewardCard: {
//     backgroundColor: "#F8F9FA",
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   rewardPattern: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     width: 40,
//     height: 40,
//     borderBottomLeftRadius: 10,
//     borderTopRightRadius: 15,
//     backgroundColor: 'rgba(64, 224, 208, 0.03)',
//   },
//   rewardHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     marginBottom: 8,
//   },
//   rewardIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#F8F9FA",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   rewardInfo: {
//     flex: 1,
//   },
//   rewardName: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#212529",
//     marginBottom: 2,
//   },
//   rewardDescription: {
//     fontSize: 12,
//     color: "#6C757D",
//     lineHeight: 16,
//   },
//   rewardAmountContainer: {
//     minWidth: 60,
//   },
//   rewardAmount: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#FF6B35",
//     textAlign: 'right',
//   },
//   rewardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   rewardDetail: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   rewardDetailText: {
//     fontSize: 11,
//     color: "#6C757D",
//   },
//   patternBadge: {
//     backgroundColor: "rgba(64, 224, 208, 0.1)",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   patternBadgeText: {
//     fontSize: 10,
//     color: "#40E0D0",
//     fontWeight: "600",
//   },
//   bottomSpace: {
//     height: 20,
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   modalContainer: {
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     padding: 20,
//     width: "100%",
//     maxWidth: 400,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#212529",
//   },
//   modalGameInfo: {
//     backgroundColor: "#F8F9FA",
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   modalGameName: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#212529",
//     marginBottom: 4,
//   },
//   modalGameId: {
//     fontSize: 13,
//     color: "#6C757D",
//     marginBottom: 8,
//   },
//   modalTicketCost: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   modalTicketCostText: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   // Modal Limit Info
//   modalLimitInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 15,
//     gap: 10,
//     borderWidth: 1,
//   },
//   modalLimitReached: {
//     backgroundColor: "rgba(255, 107, 107, 0.05)",
//     borderColor: "rgba(255, 107, 107, 0.2)",
//   },
//   modalLimitAvailable: {
//     backgroundColor: "rgba(64, 224, 208, 0.05)",
//     borderColor: "rgba(64, 224, 208, 0.2)",
//   },
//   modalLimitText: {
//     flex: 1,
//     fontSize: 13,
//     color: "#6C757D",
//     lineHeight: 18,
//   },
//   quantitySection: {
//     marginBottom: 20,
//   },
//   quantityLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#212529",
//     marginBottom: 12,
//   },
//   quantitySelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   quantityButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: "#F8F9FA",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//     position: 'relative',
//   },
//   quantityButtonActive: {
//     backgroundColor: "#40E0D0",
//     borderColor: "#40E0D0",
//   },
//   quantityButtonDisabled: {
//     backgroundColor: "#F8F9FA",
//     opacity: 0.5,
//   },
//   quantityButtonText: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#6C757D",
//   },
//   quantityButtonTextActive: {
//     color: "#FFF",
//   },
//   quantityButtonTextDisabled: {
//     color: "#ADB5BD",
//     textDecorationLine: 'line-through',
//   },
//   quantityDisabledIcon: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#FFF',
//     borderRadius: 6,
//   },
//   totalSection: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#F8F9FA",
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   totalLabelContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#212529",
//   },
//   totalAmount: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#40E0D0",
//   },
//   messageSection: {
//     marginBottom: 20,
//   },
//   messageLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#212529",
//     marginBottom: 8,
//   },
//   messageInput: {
//     backgroundColor: "#F8F9FA",
//     borderRadius: 10,
//     padding: 15,
//     fontSize: 14,
//     minHeight: 80,
//     textAlignVertical: "top",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   charCount: {
//     fontSize: 12,
//     color: "#6C757D",
//     textAlign: "right",
//     marginTop: 4,
//   },
//   modalActions: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E9ECEF",
//   },
//   cancelButtonText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#6C757D",
//   },
//   submitButton: {
//     flex: 2,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 14,
//     borderRadius: 10,
//     gap: 8,
//   },
//   paidSubmit: {
//     backgroundColor: "#40E0D0",
//   },
//   freeSubmit: {
//     backgroundColor: "#40E0D0",
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#FFF",
//   },
// });

// export default GameDetails;














import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  AppState,
  Linking,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const GameDetails = ({ route, navigation }) => {
  const { game } = route.params;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ticketMessage, setTicketMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [myTicketCount, setMyTicketCount] = useState(0);
  const [myRequestCount, setMyRequestCount] = useState(0);
  const [gameStatus, setGameStatus] = useState(null);
  const [callingStatus, setCallingStatus] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [timer, setTimer] = useState(0);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [totalTicketsInGame, setTotalTicketsInGame] = useState(0);
  
  // Polling state
  const [isPolling, setIsPolling] = useState(true);
  const pollingIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  const GAME_IMAGES = {
    header: "https://cdn-icons-png.flaticon.com/512/2331/2331966.png",
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    calendar: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
    ticket: "https://cdn-icons-png.flaticon.com/512/2589/2589909.png",
    players: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
    empty: "https://cdn-icons-png.flaticon.com/512/4076/4076478.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    wallet: "https://cdn-icons-png.flaticon.com/512/1061/1061140.png",
    request: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
    requests: "https://cdn-icons-png.flaticon.com/512/159/159832.png",
    live: "https://cdn-icons-png.flaticon.com/512/2809/2809645.png",
    scheduled: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
  };

  const MAX_TICKETS_PER_USER = 4;
  
  // Polling configuration
  const POLLING_INTERVAL = 4000;
  const POLLING_INTERVAL_BACKGROUND = 30000;
  const MAX_POLLING_DURATION = 300000;

  // Get WhatsApp number dynamically from game data
  const getWhatsAppNumber = () => {
    // Use host_mobile from game object
    if (game.host_mobile) {
      return game.host_mobile;
    }
    // Fallback to user.mobile if host_mobile doesn't exist
    if (game.user?.mobile) {
      return game.user.mobile;
    }
    // Default fallback
    return "8007395749";
  };

  const createWhatsAppMessage = () => {
    const gameDate = new Date(game.game_date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    
    const gameType = game.ticket_type === "paid" ? "Paid Game" : "Free Game";
    const ticketCost = game.ticket_type === "paid" ? `₹${game.ticket_cost}` : "FREE";
    const totalAmount = game.ticket_type === "paid" ? `₹${game.ticket_cost * ticketQuantity}` : "FREE";
    const hostName = game.user?.name || "Game Host";
    
    return `🎯 *TAMBOOLA TICKET REQUEST* 🎯

🎮 *Game Details:*
• Game Name: ${game.game_name}
• Game ID: ${game.game_code}
• Date: ${gameDate} ${game.game_start_time}
• Type: ${gameType} ${ticketCost !== "FREE" ? `(${ticketCost} per ticket)` : ""}
• Host: ${hostName}

🎫 *Ticket Request:*
• Quantity: ${ticketQuantity} ticket${ticketQuantity > 1 ? "s" : ""}
• Total Amount: ${totalAmount}

📝 *Additional Message:*
${ticketMessage || "Please approve my ticket request. Looking forward to the game!"}

💰 *Payment Information:*
• UPI ID: ${getWhatsAppNumber()}@ybl
• PhonePe/Paytm: ${getWhatsAppNumber()}
• Please send payment screenshot with your name

✅ *Confirmation Required:*
Please confirm my ticket allocation and share payment details if needed.

Thank you! 🙏
Looking forward to playing Tambola! 🎲🎉`;
  };

  const redirectToWhatsApp = () => {
    // Get dynamic WhatsApp number
    const whatsappNumber = getWhatsAppNumber();
    
    // Create attractive WhatsApp message
    const message = createWhatsAppMessage();
    
    // Format WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    
    // Check if WhatsApp is installed
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // If WhatsApp is not installed, use web version
          const webWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((error) => {
        console.log("Error opening WhatsApp:", error);
        Alert.alert(
          "Error",
          "Could not open WhatsApp. Please make sure WhatsApp is installed on your device.",
          [{ text: "OK" }]
        );
      });
  };

  useEffect(() => {
    console.log("GameDetails screen mounted");
    console.log("Game host mobile:", game.host_mobile);
    console.log("Game user mobile:", game.user?.mobile);
    
    fetchAllData();
    startPolling();
    
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    
    const autoStopTimer = setTimeout(() => {
      if (isPolling) {
        console.log("Auto-stopping polling after maximum duration");
        stopPolling();
      }
    }, MAX_POLLING_DURATION);

    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused, refreshing data");
      fetchAllData();
      setJoiningRoom(false);
      setHasJoinedRoom(false);
    });

    return () => {
      console.log("GameDetails screen unmounting, cleaning up...");
      stopPolling();
      subscription.remove();
      clearTimeout(autoStopTimer);
      unsubscribe();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    console.log("App state changed:", nextAppState);
    
    if (nextAppState.match(/inactive|background/) && appState.current === "active") {
      adjustPollingForBackground();
    } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      adjustPollingForForeground();
    }
    
    appState.current = nextAppState;
  };

  const startPolling = () => {
    console.log("Starting polling with 4-second interval...");
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("Polling interval triggered (4s)");
      fetchGameStatusSilently();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    console.log("Stopping polling...");
    setIsPolling(false);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const adjustPollingForBackground = () => {
    if (!pollingIntervalRef.current) return;
    
    console.log("Adjusting to background polling interval");
    clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("Background polling interval triggered (30s)");
      fetchGameStatusSilently();
    }, POLLING_INTERVAL_BACKGROUND);
  };

  const adjustPollingForForeground = () => {
    if (!pollingIntervalRef.current) return;
    
    console.log("Adjusting to foreground polling interval");
    clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("Foreground polling interval triggered (4s)");
      fetchGameStatusSilently();
    }, POLLING_INTERVAL);
  };

  const togglePolling = () => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGameStatus(),
        fetchMyTicketCount(),
        fetchMyRequestCount(),
        fetchTotalTicketsInGame()
      ]);
    } catch (error) {
      console.log("Error fetching all data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameStatusSilently = async () => {
    try {
      console.log("Silent fetch: Checking game status");
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/${game.id}/calling-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        
        const hasGameChanged = JSON.stringify(gameStatus) !== JSON.stringify(data.game);
        const hasCallingChanged = JSON.stringify(callingStatus) !== JSON.stringify(data.calling);
        const hasNumbersChanged = JSON.stringify(calledNumbers) !== JSON.stringify(data.numbers?.called_numbers || []);
        
        if (hasGameChanged || hasCallingChanged || hasNumbersChanged) {
          console.log("Game status changes detected, updating UI");
          
          setGameStatus(data.game);
          setCallingStatus(data.calling);
          setCalledNumbers(data.numbers?.called_numbers || []);
          
          if (data.calling?.is_running && !data.calling?.is_paused) {
            setTimer(data.calling?.interval_seconds || 60);
          }
          
          
        }
      }
    } catch (error) {
      console.log("Silent fetch error:", error.message);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const Toast = () => {
    if (!toast.visible) return null;
    
    const backgroundColor = toast.type === "success" ? "#40E0D0" : "#FF6B6B";
    
    useEffect(() => {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={[styles.toast, { backgroundColor }]}>
        <Ionicons 
          name={toast.type === "success" ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color="#FFF" 
        />
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchGameStatus(), 
      fetchMyTicketCount(), 
      fetchMyRequestCount(),
      fetchTotalTicketsInGame()
    ]).finally(() =>
      setRefreshing(false)
    );
  }, []);

  const fetchGameStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/user/games/${game.id}/calling-status`,
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
        setCalledNumbers(data.numbers?.called_numbers || []);
        
        if (data.calling?.is_running && !data.calling?.is_paused) {
          setTimer(data.calling?.interval_seconds || 60);
        }
      }
    } catch (error) {
      console.log("Error fetching game status:", error);
    }
  };

  const fetchMyTicketCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const gameTickets = res.data.tickets.data.filter(
          (ticket) => ticket.game_id == game.id
        );
        setMyTicketCount(gameTickets.length);
      }
    } catch (error) {
      console.log("Error fetching ticket count:", error);
    }
  };

  const fetchMyRequestCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const gameRequests = res.data.ticket_requests.data.filter(
          (request) => request.game_id === game.id
        );
        setMyRequestCount(gameRequests.length);
      }
    } catch (error) {
      console.log("Error fetching request count:", error);
    }
  };

  const fetchTotalTicketsInGame = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const ticketsRes = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-tickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const requestsRes = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/my-ticket-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (ticketsRes.data.success && requestsRes.data.success) {
        const allocatedTickets = ticketsRes.data.tickets.data.filter(
          (ticket) => ticket.game_id == game.id
        ).length;
        
        const pendingRequests = requestsRes.data.ticket_requests.data.filter(
          (request) => 
            request.game_id == game.id && 
            request.status === 'pending'
        ).length;
        
        const total = allocatedTickets + pendingRequests;
        setTotalTicketsInGame(total);
      }
    } catch (error) {
      console.log("Error fetching total tickets:", error);
    }
  };

  const updateGameRoomStatus = async () => {
    try {
      setJoiningRoom(true);
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/user/game-room/${game.id}/update-status`,
        {
          is_active: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        setHasJoinedRoom(true);
        showToast("Joined game room successfully!", "success");
        navigation.navigate("UserGameRoom", { 
          gameId: game.id,
          gameName: game.game_name 
        });
        setJoiningRoom(false);
      } else {
        showToast(response.data.message || "Failed to join game room", "error");
        setJoiningRoom(false);
      }
    } catch (error) {
      console.log("Error updating game room status:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to join game room. Please try again.",
        "error"
      );
      setJoiningRoom(false);
    }
  };

  const handleRequestTickets = async () => {
    if (hasReachedTicketLimit()) {
      showToast(`You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`, "error");
      return;
    }

    const remaining = getRemainingTickets();
    if (ticketQuantity > remaining) {
      showToast(`You can only request up to ${remaining} more ticket(s)`, "error");
      return;
    }

    if (ticketQuantity < 1 || ticketQuantity > 4) {
      showToast("Ticket quantity must be between 1 and 4", "error");
      return;
    }

    setRequestLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/ticket-requests/send",
        {
          game_id: game.id,
          ticket_quantity: ticketQuantity,
          message:
            ticketMessage || `Request for ${ticketQuantity} ticket(s)`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const isSuccess = 
        response.data.success === true || 
        response.data.status === true || 
        response.data.message?.toLowerCase().includes("success");

      if (isSuccess) {
        const whatsappNumber = getWhatsAppNumber();
        showToast(`Ticket request submitted! Opening WhatsApp to ${whatsappNumber}...`, "success");
        
        setTicketModalVisible(false);
        setTicketQuantity(1);
        setTicketMessage("");
        
        fetchMyRequestCount();
        fetchMyTicketCount();
        fetchTotalTicketsInGame();
        
        // Redirect to WhatsApp
        setTimeout(() => {
          redirectToWhatsApp();
        }, 1000);
        
        // Optionally navigate to TicketRequestsScreen after delay
        setTimeout(() => {
          navigation.navigate("TicketRequestsScreen", { 
            gameId: game.id,
            gameName: game.game_name 
          });
        }, 4000);
      } else {
        const errorMessage = response.data.message || 
                            response.data.error || 
                            "Failed to submit request";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.log("Request error:", error.response?.data || error.message);
      
      let errorMessage = "Failed to submit ticket request. Please try again.";
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      
      showToast(errorMessage, "error");
    } finally {
      setRequestLoading(false);
    }
  };

  const navigateToTickets = () => {
    navigation.navigate("TicketsScreen", { game });
  };

  const navigateToMyRequests = () => {
    navigation.navigate("TicketRequestsScreen", { 
      gameId: game.id,
      gameName: game.game_name 
    });
  };

  const handleJoinGameRoom = () => {
    if (!gameStatus || gameStatus.status !== 'live') {
      showToast("Game is not live yet!", "info");
      return;
    }
    
    if (hasJoinedRoom) {
      navigation.navigate("UserGameRoom", { 
        gameId: game.id,
        gameName: game.game_name 
      });
    } else {
      updateGameRoomStatus();
    }
  };

  const renderTicketLimitInfo = () => {
    const remaining = getRemainingTickets();
    const hasLimit = hasReachedTicketLimit();
    
    return (
      <View style={[
        styles.ticketLimitContainer,
        hasLimit ? styles.ticketLimitReached : styles.ticketLimitAvailable
      ]}>
        <View style={styles.ticketLimitIcon}>
          <Ionicons 
            name={hasLimit ? "alert-circle" : "ticket"} 
            size={16} 
            color={hasLimit ? "#FF6B6B" : "#40E0D0"} 
          />
        </View>
        <View style={styles.ticketLimitInfo}>
          <Text style={[
            styles.ticketLimitTitle,
            hasLimit && styles.ticketLimitTitleReached
          ]}>
            {hasLimit ? "Ticket Limit Reached" : "Ticket Limit"}
          </Text>
          <Text style={styles.ticketLimitText}>
            {hasLimit 
              ? `You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`
              : `You have ${myTicketCount} allocated + ${myRequestCount} pending = ${totalTicketsInGame}/4 tickets`
            }
          </Text>
        </View>
      </View>
    );
  };

  const getRemainingTickets = () => {
    return MAX_TICKETS_PER_USER - totalTicketsInGame;
  };

  const hasReachedTicketLimit = () => {
    return totalTicketsInGame >= MAX_TICKETS_PER_USER;
  };

  const canRequestTickets = () => {
    const remaining = getRemainingTickets();
    return ticketQuantity <= remaining && remaining > 0;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#40E0D0"
            colors={["#40E0D0"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#40E0D0" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.gameName} numberOfLines={2} ellipsizeMode="tail">
                {game.game_name}
              </Text>
              <View style={styles.gameCodeContainer}>
                <MaterialIcons
                  name="fingerprint"
                  size={16}
                  color="#6C757D"
                />
                <Text style={styles.gameCode}>{game.game_code}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchAllData}
            >
              <Feather name="refresh-ccw" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          
         
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardPattern} />
            
            <View style={styles.cardHeader}>
              <Image
                source={{ 
                  uri: gameStatus?.status === 'live' 
                    ? GAME_IMAGES.live 
                    : GAME_IMAGES.scheduled 
                }}
                style={styles.cardHeaderImage}
              />
              <Text style={styles.cardTitle}>
                {gameStatus?.status === 'live' ? 'Game Status' : 'Game Schedule'}
              </Text>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: gameStatus?.status === 'live' 
                    ? '#4CAF5020' 
                    : '#40E0D020' 
                }
              ]}>
                <Ionicons 
                  name={gameStatus?.status === 'live' ? 'radio-button-on' : 'time'} 
                  size={12} 
                  color={gameStatus?.status === 'live' ? '#4CAF50' : '#40E0D0'} 
                />
                <Text style={[
                  styles.statusBadgeText,
                  { 
                    color: gameStatus?.status === 'live' 
                      ? '#4CAF50' 
                      : '#40E0D0' 
                  }
                ]}>
                  {gameStatus?.status?.toUpperCase() || 'LOADING'}
                </Text>
              </View>
            </View>
            
            {gameStatus?.status === 'live' ? (
              <View>
                <Text style={styles.cardDescription}>
                  The game is now live! Number calling has started.
                </Text>
                {callingStatus?.is_running ? (
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <View style={styles.statIcon}>
                        <Ionicons name="megaphone" size={20} color="#40E0D0" />
                      </View>
                      <Text style={styles.statValue}>
                        {calledNumbers.length}
                      </Text>
                      <Text style={styles.statLabel}>Called</Text>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statIcon}>
                        <Ionicons name="time" size={20} color="#FF6B35" />
                      </View>
                      <Text style={styles.statValue}>
                        {timer}s
                      </Text>
                      <Text style={styles.statLabel}>Next Call</Text>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statIcon}>
                        <Ionicons name="grid" size={20} color="#FFD700" />
                      </View>
                      <Text style={styles.statValue}>
                        {90 - calledNumbers.length}
                      </Text>
                      <Text style={styles.statLabel}>Remaining</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.waitingText}>
                    Number calling will start soon...
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[styles.primaryButton, joiningRoom && styles.buttonDisabled]}
                  onPress={handleJoinGameRoom}
                  disabled={joiningRoom}
                >
                  {joiningRoom ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="enter" size={20} color="#FFF" />
                      <Text style={styles.primaryButtonText}>
                        {hasJoinedRoom ? "Re-enter Game Room" : "Join Game Room"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.cardDescription}>
                  Game is scheduled to start on {new Date(game.game_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })} at {game.game_start_time}
                </Text>
                <View style={styles.scheduledBadgeContainer}>
                  <Ionicons name="calendar" size={20} color="#40E0D0" />
                  <Text style={styles.scheduledBadgeText}>
                    Game is Scheduled
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Game Details</Text>
              <Ionicons name="game-controller" size={24} color="#40E0D0" />
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={16} color="#40E0D0" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {new Date(game.game_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time" size={16} color="#40E0D0" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {game.game_start_time}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="account-balance-wallet" size={16} color="#40E0D0" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Prize Pool</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {game.ticket_type === "paid"
                      ? `₹${(game.ticket_cost * game.max_players).toLocaleString()}`
                      : "Exciting Prizes"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="person" size={16} color="#40E0D0" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Host</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {game.user?.name || 'Tambola Timez'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="call" size={16} color="#40E0D0" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Host Contact</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {getWhatsAppNumber()}
                  </Text>
                </View>
              </View>
            </View>

            {renderTicketLimitInfo()}

            <View style={styles.myCountContainer}>
              <TouchableOpacity
                style={[
                  styles.countButton,
                  myTicketCount > 0 ? styles.hasCountButton : styles.noCountButton,
                ]}
                onPress={navigateToTickets}
              >
                <View style={styles.countIcon}>
                  <Image
                    source={{ uri: GAME_IMAGES.ticket }}
                    style={styles.countIconImage}
                  />
                </View>
                <View style={styles.countInfo}>
                  <Text style={styles.countLabel}>My Tickets</Text>
                  <Text style={[
                    styles.countValue,
                    myTicketCount > 0 ? styles.hasCountValue : styles.noCountValue,
                  ]}>
                    {myTicketCount > 0
                      ? `${myTicketCount} Ticket${myTicketCount > 1 ? "s" : ""}`
                      : "No Tickets"}
                  </Text>
                </View>
                {myTicketCount > 0 && (
                  <Ionicons name="arrow-forward" size={16} color="#40E0D0" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.countButton,
                  myRequestCount > 0 ? styles.hasCountButton : styles.noCountButton,
                ]}
                onPress={navigateToMyRequests}
              >
                <View style={styles.countIcon}>
                  <Image
                    source={{ uri: GAME_IMAGES.requests }}
                    style={styles.countIconImage}
                  />
                </View>
                <View style={styles.countInfo}>
                  <Text style={styles.countLabel}>My Requests</Text>
                  <Text style={[
                    styles.countValue,
                    myRequestCount > 0 ? styles.hasCountValue : styles.noCountValue,
                  ]}>
                    {myRequestCount > 0
                      ? `${myRequestCount} Request${myRequestCount > 1 ? "s" : ""}`
                      : "No Requests"}
                  </Text>
                </View>
                {myRequestCount > 0 && (
                  <Ionicons name="arrow-forward" size={16} color="#40E0D0" />
                )}
              </TouchableOpacity>
            </View>

            {game.message && (
              <View style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <MaterialIcons name="message" size={18} color="#40E0D0" />
                  <Text style={styles.messageTitle}>Host Message</Text>
                </View>
                <Text style={styles.messageContent}>{game.message}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <Ionicons name="flash" size={24} color="#40E0D0" />
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryActionButton,
                  game.ticket_type === "paid" ? styles.paidActionButton : styles.freeActionButton,
                  (hasReachedTicketLimit() || loading) && styles.disabledButton,
                ]}
                onPress={() => {
                  if (!hasReachedTicketLimit()) {
                    setTicketModalVisible(true);
                  } else {
                    showToast(`You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`, "error");
                  }
                }}
                disabled={hasReachedTicketLimit() || loading}
              >
                <View style={styles.actionButtonIcon}>
                  <Image
                    source={{ uri: GAME_IMAGES.request }}
                    style={styles.actionButtonImage}
                  />
                </View>
                <Text style={styles.actionButtonText}>
                  {hasReachedTicketLimit() ? "Limit Reached" : "Request Tickets"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryActionButton,
                  myTicketCount === 0 && styles.disabledButton,
                ]}
                onPress={navigateToTickets}
                disabled={myTicketCount === 0}
              >
                <View style={styles.actionButtonIcon}>
                  <Image
                    source={{ uri: GAME_IMAGES.ticket }}
                    style={styles.actionButtonImage}
                  />
                </View>
                <Text style={styles.secondaryActionButtonText}>
                  My Tickets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryActionButton,
                  myRequestCount === 0 && styles.disabledButton,
                ]}
                onPress={navigateToMyRequests}
                disabled={myRequestCount === 0}
              >
                <View style={styles.actionButtonIcon}>
                  <Image
                    source={{ uri: GAME_IMAGES.requests }}
                    style={styles.actionButtonImage}
                  />
                </View>
                <Text style={styles.secondaryActionButtonText}>
                  My Requests
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {game.pattern_rewards && game.pattern_rewards.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Game Rewards</Text>
                <Image
                  source={{ uri: GAME_IMAGES.trophy }}
                  style={styles.rewardsIcon}
                />
              </View>
              
              {game.pattern_rewards.map((reward, index) => (
                <View key={reward.pattern_id} style={styles.rewardCard}>
                  <View style={styles.rewardPattern} />
                  
                  <View style={styles.rewardHeader}>
                    <View style={styles.rewardIcon}>
                      <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
                    </View>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName} numberOfLines={1}>
                        {reward.reward_name}
                      </Text>
                      <Text style={styles.rewardDescription} numberOfLines={2}>
                        {reward.description}
                      </Text>
                    </View>
                    <View style={styles.rewardAmountContainer}>
                      <Text style={styles.rewardAmount} numberOfLines={1}>
                        ₹{reward.amount}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.rewardFooter}>
                    <View style={styles.rewardDetail}>
                      <MaterialIcons name="confirmation-number" size={14} color="#40E0D0" />
                      <Text style={styles.rewardDetailText} numberOfLines={1}>
                        Count: {reward.reward_count}
                      </Text>
                    </View>
                    <View style={styles.patternBadge}>
                      <Text style={styles.patternBadgeText} numberOfLines={1}>
                        Pattern {reward.pattern_id}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={ticketModalVisible}
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Tickets</Text>
              <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalGameInfo}>
              <Text style={styles.modalGameName} numberOfLines={2}>
                {game.game_name}
              </Text>
              <Text style={styles.modalGameId}>ID: {game.game_code}</Text>
              <View style={styles.modalTicketCost}>
                <Text style={[
                  styles.modalTicketCostText,
                  { color: game.ticket_type === "paid" ? "#FFD700" : "#40E0D0" }
                ]}>
                  Ticket Price: {game.ticket_type === "paid" ? `₹${game.ticket_cost}` : "FREE"}
                </Text>
              </View>
              <View style={styles.modalHostInfo}>
                <Text style={styles.modalHostText}>
                  Host: {game.user?.name || "Game Host"} ({getWhatsAppNumber()})
                </Text>
              </View>
            </View>

            <View style={[
              styles.modalLimitInfo,
              hasReachedTicketLimit() ? styles.modalLimitReached : styles.modalLimitAvailable
            ]}>
              <Ionicons 
                name={hasReachedTicketLimit() ? "alert-circle" : "information-circle"} 
                size={18} 
                color={hasReachedTicketLimit() ? "#FF6B6B" : "#40E0D0"} 
              />
              <Text style={styles.modalLimitText}>
                {hasReachedTicketLimit() 
                  ? `You have reached the maximum limit of ${MAX_TICKETS_PER_USER} tickets`
                  : `You can request up to ${getRemainingTickets()} more ticket(s)`
                }
              </Text>
            </View>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Select Quantity (1-4)</Text>
              <View style={styles.quantitySelector}>
                {[1, 2, 3, 4].map((num) => {
                  const canSelect = num <= getRemainingTickets() && !hasReachedTicketLimit();
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.quantityButton,
                        ticketQuantity === num && styles.quantityButtonActive,
                        !canSelect && styles.quantityButtonDisabled,
                      ]}
                      onPress={() => canSelect && setTicketQuantity(num)}
                      disabled={!canSelect}
                    >
                      <Text
                        style={[
                          styles.quantityButtonText,
                          ticketQuantity === num && styles.quantityButtonTextActive,
                          !canSelect && styles.quantityButtonTextDisabled,
                        ]}
                      >
                        {num}
                      </Text>
                      {!canSelect && (
                        <Ionicons 
                          name="close-circle" 
                          size={12} 
                          color="#FF6B6B" 
                          style={styles.quantityDisabledIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {game.ticket_type === "paid" && (
              <View style={styles.totalSection}>
                <View style={styles.totalLabelContainer}>
                  <Ionicons name="wallet" size={20} color="#40E0D0" />
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                </View>
                <Text style={styles.totalAmount} numberOfLines={1}>
                  ₹{game.ticket_cost * ticketQuantity}
                </Text>
            </View>
            )}

            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Add a message for the host..."
                multiline
                numberOfLines={3}
                maxLength={200}
                placeholderTextColor="#ADB5BD"
              />
              <Text style={styles.charCount}>
                {ticketMessage.length}/200 characters
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setTicketModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  game.ticket_type === "paid"
                    ? styles.paidSubmit
                    : styles.freeSubmit,
                  (requestLoading || hasReachedTicketLimit() || !canRequestTickets()) && styles.submitButtonDisabled,
                ]}
                onPress={handleRequestTickets}
                disabled={requestLoading || hasReachedTicketLimit() || !canRequestTickets()}
              >
                {requestLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>
                      {hasReachedTicketLimit() ? "Limit Reached" : "Submit Request"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
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
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginLeft: 10,
  },
  pollingIndicatorContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 5,
  },
  pollingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pollingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pollingText: {
    flex: 1,
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pollingToggleButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pollingToggleText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pollingSubText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: 'italic',
  },
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardHeaderImage: {
    width: 24,
    height: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "500",
  },
  waitingText: {
    fontSize: 14,
    color: "#FF6B35",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#40E0D0",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  scheduledBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  scheduledBadgeText: {
    color: "#40E0D0",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  ticketLimitContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  ticketLimitReached: {
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  ticketLimitAvailable: {
    backgroundColor: "rgba(64, 224, 208, 0.05)",
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  ticketLimitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  ticketLimitInfo: {
    flex: 1,
  },
  ticketLimitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#40E0D0",
    marginBottom: 2,
  },
  ticketLimitTitleReached: {
    color: "#FF6B6B",
  },
  ticketLimitText: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
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
  myCountContainer: {
    gap: 8,
    marginBottom: 16,
  },
  countButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  hasCountButton: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
  },
  noCountButton: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
    opacity: 0.7,
  },
  countIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  countIconImage: {
    width: 20,
    height: 20,
  },
  countInfo: {
    flex: 1,
  },
  countLabel: {
    fontSize: 11,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 2,
  },
  countValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  hasCountValue: {
    color: "#40E0D0",
  },
  noCountValue: {
    color: "#6C757D",
  },
  messageCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#40E0D0",
  },
  messageContent: {
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonIcon: {
    width: 24,
    height: 24,
  },
  actionButtonImage: {
    width: "100%",
    height: "100%",
  },
  primaryActionButton: {},
  paidActionButton: {
    backgroundColor: "#40E0D0",
  },
  freeActionButton: {
    backgroundColor: "#40E0D0",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryActionButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#40E0D0",
  },
  secondaryActionButtonText: {
    color: "#40E0D0",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  rewardsIcon: {
    width: 24,
    height: 24,
  },
  rewardCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  rewardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 15,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
  },
  rewardAmountContainer: {
    minWidth: 60,
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B35",
    textAlign: 'right',
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardDetailText: {
    fontSize: 11,
    color: "#6C757D",
  },
  patternBadge: {
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  patternBadgeText: {
    fontSize: 10,
    color: "#40E0D0",
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  modalGameInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  modalGameName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  modalGameId: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 8,
  },
  modalTicketCost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTicketCostText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalHostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHostText: {
    fontSize: 12,
    color: "#6C757D",
  },
  modalLimitInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 10,
    borderWidth: 1,
  },
  modalLimitReached: {
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  modalLimitAvailable: {
    backgroundColor: "rgba(64, 224, 208, 0.05)",
    borderColor: "rgba(64, 224, 208, 0.2)",
  },
  modalLimitText: {
    flex: 1,
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 18,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
  },
  quantityButtonActive: {
    backgroundColor: "#40E0D0",
    borderColor: "#40E0D0",
  },
  quantityButtonDisabled: {
    backgroundColor: "#F8F9FA",
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6C757D",
  },
  quantityButtonTextActive: {
    color: "#FFF",
  },
  quantityButtonTextDisabled: {
    color: "#ADB5BD",
    textDecorationLine: 'line-through',
  },
  quantityDisabledIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 6,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  totalLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#40E0D0",
  },
  messageSection: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  charCount: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "right",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  paidSubmit: {
    backgroundColor: "#40E0D0",
  },
  freeSubmit: {
    backgroundColor: "#40E0D0",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});

export default GameDetails;