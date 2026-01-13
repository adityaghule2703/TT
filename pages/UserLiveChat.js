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
  Image,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const UserLiveChat = ({ navigation, route }) => {
  const { gameId, gameName, participantCount } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [muteDetails, setMuteDetails] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // Voice recording states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState(null);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("idle"); // idle, recording, processing
 
  const scrollViewRef = useRef(null);
  const messageInputRef = useRef(null);
  const isMounted = useRef(true);
  const pollingIntervalRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const lastMessageIdRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Initialize audio recording
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Audio recording permission not granted');
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.log('Error setting up audio:', error);
      }
    })();

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Start voice recording
  const startVoiceRecording = async () => {
    if (isMuted) {
      Alert.alert("Muted", "You cannot send messages while muted");
      return;
    }

    try {
      setRecordingDuration(0);
      setRecordingUri(null);
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setShowVoiceRecording(true);
      setRecordingStatus("recording");
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.log('Failed to start recording:', error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  // Stop voice recording
  const stopVoiceRecording = async () => {
    if (!recording || !isRecording) return;

    try {
      setRecordingStatus("processing");
      
      await recording.stopAndUnloadAsync();
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      
      setRecording(null);
      
      Alert.alert(
        "Voice Message",
        "What would you like to do with this recording?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setShowVoiceRecording(false);
              setRecordingDuration(0);
              setRecordingUri(null);
              setRecordingStatus("idle");
            }
          },
          {
            text: "Send",
            onPress: () => sendVoiceMessage(uri)
          },
          {
            text: "Listen Again",
            onPress: () => playRecording(uri)
          }
        ]
      );
      
    } catch (error) {
      console.log('Failed to stop recording:', error);
      Alert.alert("Error", "Failed to stop recording.");
      setRecordingStatus("idle");
      setIsRecording(false);
      setShowVoiceRecording(false);
    }
  };

  // Cancel voice recording
  const cancelVoiceRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    if (recording) {
      recording.stopAndUnloadAsync();
    }
    
    setRecording(null);
    setIsRecording(false);
    setShowVoiceRecording(false);
    setRecordingDuration(0);
    setRecordingUri(null);
    setRecordingStatus("idle");
  };

  // Play recording
  const playRecording = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing recording:', error);
      Alert.alert("Error", "Failed to play recording");
    }
  };

  // Send voice message
  const sendVoiceMessage = async (uri) => {
    if (isMuted) {
      Alert.alert("Muted", "You cannot send messages while muted");
      setShowVoiceRecording(false);
      setRecordingStatus("idle");
      return;
    }

    setUploading(true);
    setRecordingStatus("uploading");

    try {
      const token = await AsyncStorage.getItem("token");
      
      const formData = new FormData();
      formData.append('type', 'media');
      formData.append('message', '🎤 Voice message');
      
      const filename = `voice_${Date.now()}.m4a`;
      const type = 'audio/m4a';
      
      formData.append('attachment', {
        uri: uri,
        type: type,
        name: filename,
      });

      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        const newMsg = response.data.data || {
          id: Date.now().toString(),
          sender_id: currentUserId,
          sender_name: currentUserName,
          sender_type: "user",
          message: '🎤 Voice message',
          type: 'voice',
          attachment_url: response.data.data?.attachment_url || uri,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_muted: false,
        };
       
        setMessages(prev => [...prev, newMsg]);
        setShouldScrollToBottom(true);
        setNewMessageCount(0);
        setShowScrollToBottom(false);
       
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 50);
       
        Alert.alert("Success", "Voice message sent!");
      }
    } catch (error) {
      console.log("Error sending voice message:", error);
      Alert.alert("Error", "Failed to send voice message");
    } finally {
      setUploading(false);
      setShowVoiceRecording(false);
      setRecordingStatus("idle");
      setRecordingDuration(0);
      setRecordingUri(null);
    }
  };

  // Handle voice button press
  const handleVoicePress = () => {
    if (isMuted) {
      Alert.alert("Muted", "You cannot send messages while muted");
      return;
    }

    if (isRecording) {
      stopVoiceRecording();
    } else {
      Alert.alert(
        "Voice Message",
        "Hold the button to record a voice message",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Start Recording",
            onPress: startVoiceRecording
          }
        ]
      );
    }
  };

  // Handle voice playback
  const handleVoicePlay = async (message) => {
    const mediaUrl = message.attachment?.url 
      ? `https://exilance.com/tambolatimez/public${message.attachment.url}`
      : message.attachment_url;
    
    if (!mediaUrl) {
      Alert.alert("Error", "Voice message URL not available");
      return;
    }

    Alert.alert(
      "Voice Message",
      "What would you like to do?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Play",
          onPress: async () => {
            try {
              const { sound } = await Audio.Sound.createAsync(
                { uri: mediaUrl },
                { shouldPlay: true }
              );
              
              await sound.playAsync();
              
              sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                  await sound.unloadAsync();
                }
              });
            } catch (error) {
              console.log("Error playing voice:", error);
              Alert.alert("Error", "Failed to play voice message");
            }
          }
        },
        {
          text: "Download",
          onPress: () => downloadVoiceMessage(mediaUrl, message)
        }
      ]
    );
  };

  // Download voice message
  const downloadVoiceMessage = async (url, message) => {
    setDownloading(true);
    try {
      const filename = message.attachment?.name || `voice_${Date.now()}.m4a`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        Alert.alert("Success", "Voice message downloaded!");
      }
    } catch (error) {
      console.log("Error downloading voice:", error);
      Alert.alert("Error", "Failed to download voice message");
    } finally {
      setDownloading(false);
    }
  };

  // Track scroll position
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
   
    scrollOffsetRef.current = offsetY;
   
    const isNearBottom = contentHeight - offsetY - layoutHeight < 100;
    setShouldScrollToBottom(isNearBottom);
   
    setShowScrollToBottom(!isNearBottom && newMessageCount > 0);
  };

  // Get the latest message ID
  const getLatestMessageId = (messagesArray) => {
    if (!messagesArray || messagesArray.length === 0) return null;
    return messagesArray[messagesArray.length - 1]?.id || null;
  };

  // Fetch current user info
  const getCurrentUserInfo = async () => {
    try {
      const tokenData = await AsyncStorage.getItem("user");
      if (tokenData) {
        const user = JSON.parse(tokenData);
        setCurrentUserId(user.id);
        setCurrentUserName(user.name || "User");
        return user;
      }
      return null;
    } catch (error) {
      console.log("Error getting user info:", error);
      return null;
    }
  };

  // Fetch chat messages
  const fetchMessages = async (isManualRefresh = false) => {
    if (!isMounted.current) return;

    try {
      const token = await AsyncStorage.getItem("token");
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
        const apiMessages = response.data.data || [];
        
        const newMessages = apiMessages.map(msg => {
          if (msg.type === 'system') {
            return {
              id: msg.id.toString(),
              type: "system",
              message: msg.message,
              timestamp: msg.timestamp,
              created_at: msg.created_at,
              metadata: msg.metadata,
              is_muted: msg.is_muted
            };
          }
          
          if (msg.type === 'chat') {
            const messageType = msg.message_type;
            const isVoice = messageType === 'media' && 
                           (msg.attachment?.mime_type?.includes('audio') || 
                            msg.message?.includes('Voice') ||
                            msg.message?.includes('🎤'));
            
            return {
              id: msg.id.toString(),
              type: isVoice ? 'voice' : messageType,
              message: msg.message,
              timestamp: msg.timestamp,
              created_at: msg.created_at,
              sender_id: msg.sender?.id,
              sender_name: msg.sender?.name,
              sender_type: msg.sender?.type,
              is_muted: msg.is_muted,
              attachment: msg.attachment
            };
          }
          
          return {
            id: msg.id.toString(),
            type: "text",
            message: msg.message,
            timestamp: msg.timestamp,
            created_at: msg.created_at,
            sender_id: msg.sender?.id,
            sender_name: msg.sender?.name,
            sender_type: msg.sender?.type,
            is_muted: msg.is_muted,
            attachment: msg.attachment
          };
        });

        const currentLatestId = getLatestMessageId(messages);
        const newLatestId = getLatestMessageId(newMessages);
       
        setMessages(prevMessages => {
          const prevString = JSON.stringify(prevMessages);
          const newString = JSON.stringify(newMessages);
         
          if (prevString !== newString) {
            if (!shouldScrollToBottom && currentLatestId !== newLatestId) {
              const prevCount = prevMessages.length;
              const newCount = newMessages.length;
              const addedMessages = newCount - prevCount;
             
              if (addedMessages > 0 && !isManualRefresh) {
                setNewMessageCount(prev => prev + addedMessages);
                setShowScrollToBottom(true);
              }
            }
           
            if ((shouldScrollToBottom || isManualRefresh) && newMessages.length > prevMessages.length) {
              setTimeout(() => {
                if (isMounted.current && scrollViewRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: true });
                }
              }, 100);
            }
           
            return newMessages;
          }
         
          return prevMessages;
        });
      }
    } catch (error) {
      console.log("Error fetching messages:", error);
    }
  };

  // Fetch mute status
  const fetchMuteStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/mute-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        const { is_muted, remaining_time, muted_details } = response.data.data;
        setIsMuted(is_muted);
        setMuteDetails(muted_details);
      }
    } catch (error) {
      console.log("Error fetching mute status:", error);
    }
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMessages(true);
      await fetchParticipants();
      await fetchMuteStatus();
      setNewMessageCount(0);
      setShowScrollToBottom(false);
    } catch (error) {
      console.log("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch with loading state
  const initialFetch = async () => {
    try {
      await fetchMessages();
      await fetchParticipants();
      await fetchMuteStatus();
      
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true;
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      }
      setLoading(false);
    } catch (error) {
      console.log("Error in initial fetch:", error);
      setLoading(false);
    }
  };

  // Fetch participants
  const fetchParticipants = async () => {
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
        const { participants, total_participants, online_count } = response.data.data;
        setParticipants(participants || []);
        setTotalParticipants(total_participants || 0);
        setOnlineCount(online_count || 0);
      }
    } catch (error) {
      console.log("Error fetching participants:", error);
    }
  };

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending || isMuted) return;

    setSending(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/send`,
        {
          message: newMessage.trim(),
          type: "text",
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
        
        const newMsg = response.data.data || {
          id: Date.now().toString(),
          sender_id: currentUserId,
          sender_name: currentUserName,
          sender_type: "user",
          message: newMessage.trim(),
          type: "text",
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_muted: false,
        };
       
        setMessages(prev => [...prev, newMsg]);
        setShouldScrollToBottom(true);
        setNewMessageCount(0);
        setShowScrollToBottom(false);
       
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 50);
      }
    } catch (error) {
      console.log("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Send image or video
  const sendMedia = async (mediaType, uri) => {
    if (isMuted) {
      Alert.alert("Muted", "You cannot send messages while muted");
      return;
    }

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      
      const formData = new FormData();
      formData.append('type', mediaType);
      
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `${mediaType === 'image' ? 'image' : 'video'}/${match[1]}` : 'image/jpeg';
      
      formData.append('attachment', {
        uri: uri,
        type: type,
        name: filename,
      });

      const response = await axios.post(
        `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        const newMsg = response.data.data || {
          id: Date.now().toString(),
          sender_id: currentUserId,
          sender_name: currentUserName,
          sender_type: "user",
          message: mediaType === 'image' ? '📷 Image' : '🎥 Video',
          type: mediaType,
          attachment_url: response.data.data?.attachment_url || uri,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_muted: false,
        };
       
        setMessages(prev => [...prev, newMsg]);
        setShouldScrollToBottom(true);
        setNewMessageCount(0);
        setShowScrollToBottom(false);
       
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 50);
      }
    } catch (error) {
      console.log("Error sending media:", error);
      Alert.alert("Error", "Failed to send media");
    } finally {
      setUploading(false);
    }
  };

  // Handle attachment press
  const handleAttachmentPress = async () => {
    if (isMuted) {
      Alert.alert("Muted", "You cannot send messages while muted");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload media.');
        return;
      }

      Alert.alert(
        "Send Media",
        "Choose media type",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Image",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0].uri) {
                await sendMedia('image', result.assets[0].uri);
              }
            }
          },
          {
            text: "Video",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0].uri) {
                await sendMedia('media', result.assets[0].uri);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log("Error handling attachment:", error);
      Alert.alert("Error", "Failed to open gallery");
    }
  };

  // Handle video playback
  const handleVideoPress = async (message) => {
    const mediaUrl = message.attachment?.url 
      ? `https://exilance.com/tambolatimez/public${message.attachment.url}`
      : message.attachment_url;
    
    if (!mediaUrl) {
      Alert.alert("Error", "Video URL not available");
      return;
    }

    Alert.alert(
      "Video Options",
      "How would you like to view this video?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Open in Browser",
          onPress: () => openVideoInBrowser(mediaUrl)
        },
        {
          text: "Download & Open",
          onPress: () => downloadAndOpenVideo(mediaUrl, message)
        }
      ]
    );
  };

  // Open video in browser
  const openVideoInBrowser = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      console.log("Error opening URL:", error);
      Alert.alert("Error", "Failed to open video");
    }
  };

  // Download and open video
  const downloadAndOpenVideo = async (url, message) => {
    setDownloading(true);
    try {
      const filename = message.attachment?.name || `video_${Date.now()}.mp4`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        if (Platform.OS === 'ios') {
          Alert.alert("Download Complete", "Video has been downloaded.");
        } else {
          const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: message.attachment?.mime_type || 'video/*',
          });
        }
      }
    } catch (error) {
      console.log("Error downloading video:", error);
      Alert.alert("Error", "Failed to download video");
    } finally {
      setDownloading(false);
    }
  };

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
   
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
      fetchParticipants();
      fetchMuteStatus();
    }, 5000);
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Scroll to bottom
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
      const token = await AsyncStorage.getItem("token");
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
      await getCurrentUserInfo();
      
      try {
        const token = await AsyncStorage.getItem("token");
        await axios.post(
          `https://exilance.com/tambolatimez/public/api/games/${gameId}/chat/join`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        
        await initialFetch();
        startPolling();
      } catch (error) {
        console.log("Error joining chat:", error);
        Alert.alert("Error", "Failed to join chat");
        navigation.goBack();
      }
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
    const isSystem = message.type === "system";
    const isOwnMessage = message.sender_type === "user" && message.sender_id === currentUserId;
    const isVoice = message.type === 'voice';
    const isMedia = message.type === 'image' || message.type === 'media';
    const isVideo = message.type === 'media' && !isVoice;
    const isImage = message.type === 'image';
    const isMutedMessage = message.is_muted;

    if (isSystem) {
      return (
        <View key={message.id || index} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Ionicons name="information-circle" size={14} color="#666" />
            <Text style={styles.systemMessageText}>{message.message}</Text>
          </View>
          <Text style={styles.systemTimestamp}>
            {message.timestamp || new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      );
    }

    if (isVoice) {
      if (isOwnMessage) {
        return (
          <View key={message.id || index} style={styles.ownMessageContainer}>
            <View style={styles.ownMessageBubble}>
              <TouchableOpacity
                style={styles.voiceContainer}
                onPress={() => handleVoicePlay(message)}
                disabled={downloading}
              >
                <View style={styles.voiceContent}>
                  <Ionicons name="mic" size={20} color="#075E54" />
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceText}>Voice message</Text>
                    <Text style={styles.voiceDuration}>
                      {message.attachment?.duration || '00:30'}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="#25D366" />
                </View>
              </TouchableOpacity>
              <View style={styles.ownMessageFooter}>
                <Text style={styles.ownTimestamp}>
                  {message.timestamp || new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color={isMutedMessage ? "#666" : "#34B7F1"}
                  style={styles.messageStatusIcon}
                />
              </View>
            </View>
          </View>
        );
      } else {
        return (
          <View key={message.id || index} style={styles.otherMessageContainer}>
            <View style={styles.otherMessageBubble}>
              <Text style={styles.senderName}>
                {message.sender_name || "User"}
                {message.sender_type === "host" && " (Host)"}
                {isMutedMessage && " 🔇"}
              </Text>
              <TouchableOpacity
                style={styles.voiceContainer}
                onPress={() => handleVoicePlay(message)}
                disabled={downloading}
              >
                <View style={styles.voiceContent}>
                  <Ionicons name="mic" size={20} color="#075E54" />
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceText}>Voice message</Text>
                    <Text style={styles.voiceDuration}>
                      {message.attachment?.duration || '00:30'}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="#25D366" />
                </View>
              </TouchableOpacity>
              <View style={styles.otherMessageFooter}>
                <Text style={styles.otherTimestamp}>
                  {message.timestamp || new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }

    const mediaUrl = message.attachment?.url 
      ? `https://exilance.com/tambolatimez/public${message.attachment.url}`
      : message.attachment_url;

    if (isOwnMessage) {
      return (
        <View key={message.id || index} style={styles.ownMessageContainer}>
          <View style={styles.ownMessageBubble}>
            {isMedia ? (
              <View style={styles.mediaContainer}>
                {isVideo ? (
                  <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => handleVideoPress(message)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <View style={styles.videoThumbnail}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.downloadingText}>Downloading...</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.videoThumbnail}>
                          <Ionicons name="play-circle" size={40} color="#FFF" />
                        </View>
                        {message.message && message.message.trim() && (
                          <Text style={styles.mediaCaption}>{message.message}</Text>
                        )}
                        <View style={styles.videoInfo}>
                          <Ionicons name="videocam" size={12} color="#666" />
                          <Text style={styles.videoText}>Video</Text>
                          <Text style={styles.fileSize}>
                            {message.attachment?.formatted_size || "Unknown size"}
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                ) : isImage ? (
                  <>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                    {message.message && message.message.trim() && (
                      <Text style={styles.mediaCaption}>{message.message}</Text>
                    )}
                    <View style={styles.imageInfo}>
                      <Ionicons name="image" size={12} color="#666" />
                      <Text style={styles.imageText}>Image</Text>
                      <Text style={styles.fileSize}>
                        {message.attachment?.formatted_size || "Unknown size"}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : (
              <Text style={[
                styles.ownMessageText,
                isMutedMessage && styles.mutedMessageText
              ]}>
                {isMutedMessage ? "[This message was sent while muted]" : message.message}
              </Text>
            )}
            <View style={styles.ownMessageFooter}>
              <Text style={styles.ownTimestamp}>
                {message.timestamp || new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons
                name="checkmark-done"
                size={12}
                color={isMutedMessage ? "#666" : "#34B7F1"}
                style={styles.messageStatusIcon}
              />
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View key={message.id || index} style={styles.otherMessageContainer}>
          <View style={styles.otherMessageBubble}>
            <Text style={styles.senderName}>
              {message.sender_name || "User"}
              {message.sender_type === "host" && " (Host)"}
              {isMutedMessage && " 🔇"}
            </Text>
            
            {isMedia ? (
              <View style={styles.mediaContainer}>
                {isVideo ? (
                  <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => handleVideoPress(message)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <View style={styles.videoThumbnail}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.downloadingText}>Downloading...</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.videoThumbnail}>
                          <Ionicons name="play-circle" size={40} color="#FFF" />
                        </View>
                        {message.message && message.message.trim() && (
                          <Text style={styles.mediaCaption}>{message.message}</Text>
                        )}
                        <View style={styles.videoInfo}>
                          <Ionicons name="videocam" size={12} color="#666" />
                          <Text style={styles.videoText}>Video</Text>
                          <Text style={styles.fileSize}>
                            {message.attachment?.formatted_size || "Unknown size"}
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                ) : isImage ? (
                  <>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                    {message.message && message.message.trim() && (
                      <Text style={styles.mediaCaption}>{message.message}</Text>
                    )}
                    <View style={styles.imageInfo}>
                      <Ionicons name="image" size={12} color="#666" />
                      <Text style={styles.imageText}>Image</Text>
                      <Text style={styles.fileSize}>
                        {message.attachment?.formatted_size || "Unknown size"}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : (
              <Text style={[
                styles.otherMessageText,
                isMutedMessage && styles.mutedMessageText
              ]}>
                {isMutedMessage ? "[This user is muted]" : message.message}
              </Text>
            )}
            
            <View style={styles.otherMessageFooter}>
              <Text style={styles.otherTimestamp}>
                {message.timestamp || new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
         
          <View style={styles.participantsStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color="#075E54" />
              <Text style={styles.statText}>Total: {totalParticipants}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="wifi" size={18} color="#4CAF50" />
              <Text style={styles.statText}>Online: {onlineCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="wifi-off" size={18} color="#FF5252" />
              <Text style={styles.statText}>
                Offline: {totalParticipants - onlineCount}
              </Text>
            </View>
          </View>
         
          <ScrollView style={styles.participantsList}>
            {participants.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {participant.name?.charAt(0) || "U"}
                  </Text>
                  <View style={[
                    styles.participantOnlineStatus,
                    { backgroundColor: participant.is_online ? '#4CAF50' : '#9E9E9E' }
                  ]} />
                </View>
                <View style={styles.participantInfo}>
                  <View style={styles.participantNameRow}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    {participant.is_host && (
                      <View style={styles.hostBadge}>
                        <Ionicons name="shield-checkmark" size={10} color="#FFF" />
                        <Text style={styles.hostBadgeText}>Host</Text>
                      </View>
                    )}
                    {participant.is_admin && (
                      <View style={styles.adminBadge}>
                        <Ionicons name="star" size={10} color="#FFF" />
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.participantType}>
                    {participant.type === 'host' ? 'Host' : 'User'}
                  </Text>
                  <Text style={styles.participantLastSeen}>
                    Last seen: {participant.last_seen ? new Date(participant.last_seen).toLocaleTimeString() : 'Never'}
                  </Text>
                </View>
                <View style={styles.participantStatus}>
                  <Text style={[
                    styles.participantStatusText,
                    { color: participant.is_online ? '#4CAF50' : '#9E9E9E' }
                  ]}>
                    {participant.is_online ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
         
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowParticipantsModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
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
                {onlineCount} online / {totalParticipants} total
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Game Chat</Text>
        </TouchableOpacity>
       
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowParticipantsModal(true)}
        >
          <Ionicons name="people" size={22} color="#FFF" />
        </TouchableOpacity>
       
        <TouchableOpacity
          style={styles.headerButton}
          onPress={leaveChat}
        >
          <Ionicons name="exit-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Mute Status Banner */}
      {isMuted && (
        <View style={styles.muteBanner}>
          <Ionicons name="mic-off" size={18} color="#FFF" />
          <Text style={styles.muteText}>
            You are muted{muteDetails?.duration_text ? ` for ${muteDetails.duration_text}` : ''}
            {muteDetails?.reason ? `. Reason: ${muteDetails.reason}` : ''}
          </Text>
        </View>
      )}

      {/* Voice Recording Overlay */}
      {showVoiceRecording && (
        <View style={styles.voiceRecordingOverlay}>
          <View style={styles.voiceRecordingContainer}>
            {isRecording ? (
              <>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
                <Text style={styles.recordingDuration}>
                  {formatDuration(recordingDuration)}
                </Text>
                <View style={styles.voiceWaveformLarge}>
                  <View style={styles.waveBarLarge} />
                  <View style={[styles.waveBarLarge, styles.waveBarMediumLarge]} />
                  <View style={[styles.waveBarLarge, styles.waveBarTallLarge]} />
                  <View style={[styles.waveBarLarge, styles.waveBarMediumLarge]} />
                  <View style={styles.waveBarLarge} />
                  <View style={[styles.waveBarLarge, styles.waveBarMediumLarge]} />
                  <View style={[styles.waveBarLarge, styles.waveBarTallLarge]} />
                  <View style={styles.waveBarLarge} />
                </View>
                <TouchableOpacity
                  style={styles.stopRecordingButton}
                  onPress={stopVoiceRecording}
                >
                  <Ionicons name="stop-circle" size={50} color="#FF5252" />
                  <Text style={styles.stopRecordingText}>Tap to stop</Text>
                </TouchableOpacity>
              </>
            ) : recordingStatus === "processing" ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#25D366" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            ) : recordingStatus === "uploading" ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#25D366" />
                <Text style={styles.processingText}>Sending...</Text>
              </View>
            ) : null}
            
            <TouchableOpacity
              style={styles.cancelRecordingButton}
              onPress={cancelVoiceRecording}
            >
              <Text style={styles.cancelRecordingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
            <Text style={styles.welcomeTitle}>Welcome to Game Chat!</Text>
            <Text style={styles.welcomeText}>
              Chat with other players, share your excitement, and discuss the game!
              This chat is for {gameName} only.
            </Text>
            <View style={styles.welcomeTips}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>Be respectful to other players</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>No spam or advertising</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.tipText}>Have fun and good luck!</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="mic" size={14} color="#2196F3" />
                <Text style={styles.tipText}>Tap and hold to send voice messages</Text>
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
              Be the first to say hello! 👋
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
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttachmentPress}
            disabled={uploading || isMuted}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={isMuted ? "#CCC" : "#666"} />
            ) : (
              <Ionicons 
                name="attach" 
                size={22} 
                color={isMuted ? "#CCC" : "#666"} 
              />
            )}
          </TouchableOpacity>
         
          <TextInput
            ref={messageInputRef}
            style={[
              styles.textInput,
              isMuted && styles.disabledInput
            ]}
            placeholder={isMuted ? "You are muted" : "Type a message..."}
            placeholderTextColor={isMuted ? "#FF5252" : "#999"}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            editable={!isMuted}
          />
         
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoicePress}
            onLongPress={startVoiceRecording}
            disabled={isMuted}
          >
            {isRecording ? (
              <Ionicons name="mic-off" size={24} color="#FF5252" />
            ) : (
              <Ionicons 
                name="mic" 
                size={22} 
                color={isMuted ? "#CCC" : "#666"} 
              />
            )}
          </TouchableOpacity>
         
          {newMessage.trim() && !isMuted ? (
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
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons 
                name="happy-outline" 
                size={24} 
                color={isMuted ? "#CCC" : "#666"} 
              />
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

// Format duration helper function
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  },
  // Mute Banner
  muteBanner: {
    backgroundColor: "#FF5252",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  muteText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Voice Recording Overlay
  voiceRecordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  voiceRecordingContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordingDuration: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  voiceWaveformLarge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    marginBottom: 30,
    gap: 4,
  },
  waveBarLarge: {
    width: 6,
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  waveBarMediumLarge: {
    height: 20,
  },
  waveBarTallLarge: {
    height: 30,
  },
  stopRecordingButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stopRecordingText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  cancelRecordingButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  cancelRecordingText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '600',
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
    maxWidth: "90%",
  },
  systemMessageText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    textAlign: "center",
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
  mutedMessageText: {
    color: "#999",
    fontStyle: 'italic',
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
  // VOICE MESSAGE STYLES - Compact
  voiceContainer: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    marginVertical: 4,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceInfo: {
    flex: 1,
    marginLeft: 10,
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  voiceDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesSpacer: {
    height: 80,
  },
  // MEDIA MESSAGE STYLES
  mediaContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 4,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  mediaCaption: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  // VIDEO STYLES
  videoContainer: {
    width: 200,
  },
  videoThumbnail: {
    width: 200,
    height: 200,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  downloadingText: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 8,
  },
  videoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 4,
    gap: 4,
  },
  videoText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  imageInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 4,
    gap: 4,
  },
  imageText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  fileSize: {
    fontSize: 11,
    color: "#999",
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
  disabledInput: {
    backgroundColor: "#F5F5F5",
    borderColor: "#FFCDD2",
    color: "#FF5252",
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButton: {
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
  // Modal Styles
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
  participantsStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
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
    position: "relative",
  },
  participantAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  participantOnlineStatus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  hostBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9C27B0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  participantType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  participantLastSeen: {
    fontSize: 10,
    color: "#999",
  },
  participantStatus: {
    marginLeft: 8,
  },
  participantStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  closeModalButton: {
    backgroundColor: "#075E54",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#FFF",
    fontSize: 16,
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

export default UserLiveChat;