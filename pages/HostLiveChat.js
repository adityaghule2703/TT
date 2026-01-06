import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const HostLiveChat = ({ navigation, route }) => {
  const { gameId, gameName, participantCount } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [currentHostId, setCurrentHostId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
 
  const scrollViewRef = useRef(null);
  const messageInputRef = useRef(null);
  const isMounted = useRef(true);
  const pollingIntervalRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const lastMessageIdRef = useRef(null);

  // Track scroll position
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
   
    scrollOffsetRef.current = offsetY;
   
    // If user is near bottom (within 100 pixels), auto-scroll to bottom on new messages
    const isNearBottom = contentHeight - offsetY - layoutHeight < 100;
    setShouldScrollToBottom(isNearBottom);
   
    // Hide scroll to bottom button when near bottom
    setShowScrollToBottom(!isNearBottom && newMessageCount > 0);
  };

  // Filter duplicate messages
  const filterDuplicateMessages = useCallback((newMessages) => {
    if (!newMessages || newMessages.length === 0) return newMessages;
   
    const seenKeys = new Set();
    const filteredMessages = [];
   
    for (const message of newMessages) {
      // Create a unique key for each message
      const timestamp = message.timestamp || new Date().toISOString();
      const messageId = message.id || `${timestamp}_${message.message?.substring(0, 20)}`;
      const key = `${message.type}_${messageId}_${message.sender?.id || 'system'}`;
     
      if (seenKeys.has(key)) {
        continue;
      }
     
      seenKeys.add(key);
      filteredMessages.push({
        ...message,
        _id: key, // Add unique identifier
      });
    }
   
    return filteredMessages;
  }, []);

  // Get the latest message ID
  const getLatestMessageId = (messagesArray) => {
    if (!messagesArray || messagesArray.length === 0) return null;
    return messagesArray[messagesArray.length - 1]?._id ||
           `${messagesArray[messagesArray.length - 1]?.timestamp}_${messagesArray[messagesArray.length - 1]?.message?.substring(0, 10)}`;
  };

  // Fetch current host ID
  const getCurrentHostId = async () => {
    try {
      const tokenData = await AsyncStorage.getItem("host");
      if (tokenData) {
        const host = JSON.parse(tokenData);
        setCurrentHostId(host.id);
        return host.id;
      }
      return null;
    } catch (error) {
      console.log("Error getting host ID:", error);
      return null;
    }
  };

  // Fetch chat messages silently (without affecting scroll)
  const fetchMessagesSilently = async (isManualRefresh = false) => {
    if (!isMounted.current) return;

    try {
      const token = await AsyncStorage.getItem("hostToken");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success && isMounted.current) {
        const newMessages = response.data.data || [];
        const filteredMessages = filterDuplicateMessages(newMessages);
        const currentLatestId = getLatestMessageId(messages);
        const newLatestId = getLatestMessageId(filteredMessages);
       
        setMessages(prevMessages => {
          // Check if messages actually changed
          const prevString = JSON.stringify(prevMessages);
          const newString = JSON.stringify(filteredMessages);
         
          if (prevString !== newString) {
            // Calculate new messages count
            if (!shouldScrollToBottom && currentLatestId !== newLatestId) {
              const prevCount = prevMessages.length;
              const newCount = filteredMessages.length;
              const addedMessages = newCount - prevCount;
             
              if (addedMessages > 0 && !isManualRefresh) {
                setNewMessageCount(prev => prev + addedMessages);
                setShowScrollToBottom(true);
              }
            }
           
            // If user is near bottom or manual refresh, scroll to bottom
            if ((shouldScrollToBottom || isManualRefresh) && filteredMessages.length > prevMessages.length) {
              setTimeout(() => {
                if (isMounted.current && scrollViewRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: true });
                }
              }, 100);
            }
           
            return filteredMessages;
          }
         
          return prevMessages;
        });
      }
    } catch (error) {
      console.log("Error fetching messages silently:", error);
    }
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMessagesSilently(true);
      await fetchParticipants();
      setNewMessageCount(0);
      setShowScrollToBottom(false);
    } catch (error) {
      console.log("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch with loading state
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const filteredMessages = filterDuplicateMessages(response.data.data || []);
        setMessages(filteredMessages);
        lastMessageIdRef.current = getLatestMessageId(filteredMessages);
       
        // Scroll to bottom only on initial load
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          setTimeout(() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: false });
            }
          }, 100);
        }
      }
      setLoading(false);
    } catch (error) {
      console.log("Error fetching messages:", error);
      setLoading(false);
    }
  };

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
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
        setParticipants(response.data.data || []);
      }
    } catch (error) {
      console.log("Error fetching participants:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = await AsyncStorage.getItem("hostToken");
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/send`,
        {
          message: newMessage.trim(),
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
        setNewMessage("");
        const tokenData = await AsyncStorage.getItem("host");
        const host = tokenData ? JSON.parse(tokenData) : null;
       
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageId = `${timestamp}_${newMessage.trim().substring(0, 10)}`;
       
        const newMsg = {
          type: "chat",
          sender: {
            id: host?.id || 0,
            type: "host",
            name: host?.name || "Host",
          },
          message: newMessage.trim(),
          timestamp: timestamp,
          is_muted: false,
          _id: messageId,
        };
       
        setMessages(prev => [...prev, newMsg]);
        setShouldScrollToBottom(true);
        setNewMessageCount(0);
        setShowScrollToBottom(false);
       
        // Scroll to bottom immediately after sending
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 50);
       
        // Fetch updated messages after a delay
        setTimeout(() => fetchMessagesSilently(), 1000);
      }
    } catch (error) {
      console.log("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Mute/unmute participant
  const toggleMuteParticipant = async (participantId, isCurrentlyMuted) => {
    try {
      const token = await AsyncStorage.getItem("hostToken");
      const endpoint = isCurrentlyMuted ? 'unmute' : 'mute';
     
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/${endpoint}`,
        {
          participant_id: participantId,
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
        // Refresh participants list
        await fetchParticipants();
       
        // Add system message about mute/unmute
        const mutedParticipant = participants.find(p => p.id === participantId);
        if (mutedParticipant) {
          const systemMsg = {
            type: "system",
            message: `${mutedParticipant.name} has been ${isCurrentlyMuted ? 'unmuted' : 'muted'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            _id: `system_${Date.now()}`,
          };
         
          setMessages(prev => [...prev, systemMsg]);
        }
      }
    } catch (error) {
      console.log("Error toggling mute:", error);
      alert(`Failed to ${isCurrentlyMuted ? 'unmute' : 'mute'} participant`);
    }
  };

  // Start silent polling
  const startSilentPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
   
    pollingIntervalRef.current = setInterval(() => {
      fetchMessagesSilently();
    }, 5000);
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    setShouldScrollToBottom(true);
    setNewMessageCount(0);
    setShowScrollToBottom(false);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Leave chat
  const leaveChat = async () => {
    stopPolling();
    try {
      const token = await AsyncStorage.getItem("hostToken");
      await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      navigation.goBack();
    } catch (error) {
      console.log("Error leaving chat:", error);
      navigation.goBack();
    }
  };

  useEffect(() => {
    isMounted.current = true;
   
    const initializeChat = async () => {
      await getCurrentHostId();
      await fetchMessages();
      await fetchParticipants();
     
      // Start silent polling
      startSilentPolling();
    };
   
    initializeChat();

    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, []);

  // Add refresh control to ScrollView
  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleManualRefresh}
      colors={["#25D366"]}
      tintColor="#25D366"
    />
  );

  const renderMessage = (message, index) => {
    if (message.type === "system") {
      return (
        <View key={message._id || index} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Ionicons name="information-circle" size={14} color="#666" />
            <Text style={styles.systemMessageText}>{message.message}</Text>
          </View>
          <Text style={styles.systemTimestamp}>{message.timestamp}</Text>
        </View>
      );
    }

    const isHostMessage = message.sender?.type === "host" || message.sender?.is_host;
    const isOwnMessage = isHostMessage && message.sender?.id === currentHostId;

    if (isOwnMessage) {
      // Own message - aligned to right
      return (
        <View key={message._id || index} style={styles.ownMessageContainer}>
          <View style={styles.ownMessageBubble}>
            <Text style={styles.ownMessageText}>
              {message.message}
            </Text>
            <View style={styles.ownMessageFooter}>
              <Text style={styles.ownTimestamp}>
                {message.timestamp}
              </Text>
              <Ionicons
                name="checkmark-done"
                size={12}
                color={message.is_muted ? "#666" : "#34B7F1"}
                style={styles.messageStatusIcon}
              />
            </View>
          </View>
        </View>
      );
    } else {
      // Other person's message - aligned to left
      const isMutedParticipant = participants.find(p =>
        p.id === message.sender?.id && p.is_muted
      );
     
      return (
        <View key={message._id || index} style={styles.otherMessageContainer}>
          <View style={styles.otherMessageBubble}>
            <Text style={styles.senderName}>
              {message.sender?.name || "User"}
              {isHostMessage && " (Host)"}
              {isMutedParticipant && " 🔇"}
            </Text>
            <Text style={[
              styles.otherMessageText,
              isMutedParticipant && styles.mutedMessageText
            ]}>
              {isMutedParticipant ? "[This user is muted]" : message.message}
            </Text>
            <View style={styles.otherMessageFooter}>
              <Text style={styles.otherTimestamp}>
                {message.timestamp}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  };

  const ParticipantsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showParticipantsModal}
      onRequestClose={() => setShowParticipantsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Participants</Text>
            <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
         
          <ScrollView style={styles.participantsList}>
            {participants.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {participant.name?.charAt(0) || "U"}
                  </Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <View style={styles.participantStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: participant.is_online ? '#4CAF50' : '#9E9E9E' }
                    ]} />
                    <Text style={styles.participantStatusText}>
                      {participant.is_online ? 'Online' : 'Offline'}
                    </Text>
                    {participant.is_muted && (
                      <View style={styles.mutedBadge}>
                        <Ionicons name="mic-off" size={10} color="#FF5252" />
                        <Text style={styles.mutedBadgeText}>Muted</Text>
                      </View>
                    )}
                  </View>
                </View>
                {participant.type === 'host' ? (
                  <View style={styles.hostBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.muteActionButton}
                    onPress={() => toggleMuteParticipant(
                      participant.id,
                      participant.is_muted
                    )}
                  >
                    <Ionicons
                      name={participant.is_muted ? "mic" : "mic-off"}
                      size={16}
                      color={participant.is_muted ? "#4CAF50" : "#FF5252"}
                    />
                    <Text style={[
                      styles.muteActionText,
                      { color: participant.is_muted ? "#4CAF50" : "#FF5252" }
                    ]}>
                      {participant.is_muted ? "Unmute" : "Mute"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
         
          <View style={styles.modalFooter}>
            <Text style={styles.totalParticipants}>
              Total: {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading Chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
     
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
       
        <TouchableOpacity
          style={styles.headerContent}
          onPress={() => setShowParticipantsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {gameName}
            </Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {participants.length} online
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Host Chat</Text>
        </TouchableOpacity>
       
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowParticipantsModal(true)}
        >
          <Ionicons name="people" size={22} color="#FFF" />
          {newMessageCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newMessageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
       
        <TouchableOpacity
          style={styles.headerButton}
          onPress={leaveChat}
        >
          <Ionicons name="exit-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
      >
        {/* Welcome message */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeBubble}>
            <Ionicons name="chatbubbles" size={24} color="#075E54" />
            <Text style={styles.welcomeTitle}>Welcome to Host Chat!</Text>
            <Text style={styles.welcomeText}>
              Chat with players and other hosts. You're hosting the chat for {gameName}.
            </Text>
            <View style={styles.welcomeTips}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>You have host privileges</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>Help players with questions</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>Monitor the conversation</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>Mute disruptive users</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubble-outline" size={60} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start the conversation! 👋
            </Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
       
        <View style={styles.messagesSpacer} />
      </ScrollView>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
        >
          <View style={styles.scrollToBottomContent}>
            <Ionicons name="arrow-down" size={18} color="#FFF" />
            <Text style={styles.scrollToBottomText}>
              {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={24} color="#666" />
          </TouchableOpacity>
         
          <TextInput
            ref={messageInputRef}
            style={styles.textInput}
            placeholder="Type a message as host..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
         
          {newMessage.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={22} color="#666" />
            </TouchableOpacity>
          )}
        </View>
       
        <View style={styles.inputFooter}>
          <Text style={styles.charCount}>
            {newMessage.length}/500
          </Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#FF5252' }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ParticipantsModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECE5DD",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#075E54",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginRight: 8,
    flex: 1,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  welcomeBubble: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#075E54",
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  welcomeTips: {
    width: "100%",
    gap: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessage: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "80%",
  },
  systemMessageText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  systemTimestamp: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  // OWN MESSAGE STYLES - Right aligned
  ownMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownMessageBubble: {
    backgroundColor: "#DCF8C6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderTopRightRadius: 4,
    maxWidth: "80%",
    alignSelf: "flex-end",
  },
  ownMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#000",
  },
  ownMessageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  ownTimestamp: {
    fontSize: 11,
    color: "rgba(0,0,0,0.6)",
    marginRight: 4,
  },
  messageStatusIcon: {
    marginLeft: 2,
  },
  // OTHER MESSAGE STYLES - Left aligned
  otherMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  otherMessageBubble: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#075E54",
    marginBottom: 2,
  },
  otherMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  mutedMessageText: {
    color: "#999",
    fontStyle: 'italic',
  },
  otherMessageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  otherTimestamp: {
    fontSize: 11,
    color: "rgba(0,0,0,0.6)",
  },
  messagesSpacer: {
    height: 80,
  },
  inputContainer: {
    backgroundColor: "#F0F0F0",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: "#333",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 12,
    color: "#666",
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
    borderRadius: 25,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#075E54",
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#075E54",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participantAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  participantStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  participantStatusText: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  mutedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  mutedBadgeText: {
    color: "#FF5252",
    fontSize: 10,
    fontWeight: "500",
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  hostBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  muteActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    gap: 4,
  },
  muteActionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  totalParticipants: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#25D366',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  scrollToBottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollToBottomText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HostLiveChat;