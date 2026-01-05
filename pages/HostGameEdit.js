import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const HostGameEdit = ({ navigation, route }) => {
  // Get game data from route params
  const { game } = route.params || {};
  
  // Form States
  const [loading, setLoading] = useState(false);
  const [gameName, setGameName] = useState(game?.game_name || '');
  const [gameDate, setGameDate] = useState(new Date(game?.game_date || new Date()));
  const [gameStartTime, setGameStartTime] = useState(new Date());
  const [ticketRequestEndDate, setTicketRequestEndDate] = useState(new Date(game?.ticket_request_end_date || new Date()));
  const [ticketRequestEndTime, setTicketRequestEndTime] = useState(new Date());
  const [message, setMessage] = useState(game?.message || '');
  const [limitedTypeGame, setLimitedTypeGame] = useState(game?.limited_type_game || false);
  const [verifiedPhoneOnly, setVerifiedPhoneOnly] = useState(game?.verified_phone_only || true);
  const [allowLateClaims, setAllowLateClaims] = useState(game?.allow_late_claims || false);
  const [promoteBrand, setPromoteBrand] = useState(game?.promote_brand || true);
  const [ticketType, setTicketType] = useState(game?.ticket_type || 'paid');
  const [rewardType, setRewardType] = useState('fixed');
  const [ticketCost, setTicketCost] = useState(game?.ticket_cost?.toString() || '50');
  const [maxPlayers, setMaxPlayers] = useState(game?.max_players?.toString() || '100');
  const [maxTickets, setMaxTickets] = useState(game?.max_tickets?.toString() || '200');
  const [maxWinners, setMaxWinners] = useState(game?.max_winners?.toString() || '10');
  const [allowSharingClaims, setAllowSharingClaims] = useState(game?.allow_sharing_claims || true);
  const [setRewardLimit, setSetRewardLimit] = useState(game?.set_reward_limit || false);
  
  // Date/Time Picker States
  const [showGameDatePicker, setShowGameDatePicker] = useState(false);
  const [showGameTimePicker, setShowGameTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Pattern Selection States
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [patternRewards, setPatternRewards] = useState([]);
  const [patternsList, setPatternsList] = useState([]);
  const [patternsModalVisible, setPatternsModalVisible] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [patternsModalType, setPatternsModalType] = useState('select');
  const [currentPatternForReward, setCurrentPatternForReward] = useState(null);
  const [editingReward, setEditingReward] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });

  // Parse time strings to Date objects
  useEffect(() => {
    if (game?.game_start_time) {
      const [hours, minutes] = game.game_start_time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      setGameStartTime(timeDate);
    }
    
    if (game?.ticket_request_end_time) {
      const [hours, minutes] = game.ticket_request_end_time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      setTicketRequestEndTime(timeDate);
    }

    // Fetch available patterns
    fetchPatterns();
  }, [game]);

  // Load existing patterns and rewards
  useEffect(() => {
    if (game?.patterns && game?.pattern_rewards) {
      // If patterns are already objects with full data
      if (Array.isArray(game.patterns) && game.patterns.length > 0) {
        setSelectedPatterns(game.patterns);
      }
      
      // Load existing rewards
      if (Array.isArray(game.pattern_rewards) && game.pattern_rewards.length > 0) {
        setPatternRewards(game.pattern_rewards);
      }
    }
  }, [game]);

  // Toast Functions
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Toast Component
  const Toast = () => {
    if (!toast.visible) return null;
    
    const backgroundColor = toast.type === 'success' ? '#4CAF50' : '#FF6B6B';
    
    useEffect(() => {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={[styles.toast, { backgroundColor }]}>
        <Ionicons 
          name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
          size={20} 
          color="#FFF" 
        />
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  const fetchPatterns = async () => {
    try {
      setLoadingPatterns(true);
      const token = await AsyncStorage.getItem('hostToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        'https://exilance.com/tambolatimez/public/api/host/patterns/available',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data.status) {
        const patternsData = response.data.data || [];
        setPatternsList(patternsData);
        
        // If we have existing patterns in the game data, match them with fetched patterns
        if (game?.patterns && Array.isArray(game.patterns) && game.patterns.length > 0) {
          const enhancedPatterns = game.patterns.map(pattern => {
            // If pattern is minimal, find full data
            if (pattern.id && (!pattern.pattern_name || !pattern.description)) {
              const fullPattern = patternsData.find(p => p.id === pattern.id);
              return fullPattern || pattern;
            }
            return pattern;
          });
          setSelectedPatterns(enhancedPatterns);
        }
        
        // Also try to load patterns from selected_patterns if patterns is not available
        else if (game?.selected_patterns && Array.isArray(game.selected_patterns)) {
          const matchedPatterns = game.selected_patterns
            .map(patternId => {
              const pattern = patternsData.find(p => p.id === patternId);
              if (pattern) return pattern;
              // If pattern not found in API, create a minimal object
              return { id: patternId, pattern_name: `Pattern ${patternId}`, description: 'Pattern details not available' };
            })
            .filter(pattern => pattern !== null);
          
          setSelectedPatterns(matchedPatterns);
        }
      } else {
        throw new Error('Failed to fetch patterns');
      }
    } catch (error) {
      console.log('Error fetching patterns:', error);
      showToast('Failed to load patterns', 'error');
    } finally {
      setLoadingPatterns(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const validateForm = () => {
    if (!gameName.trim()) {
      showToast('Please enter a game name', 'error');
      return false;
    }
    
    if (selectedPatterns.length === 0) {
      showToast('Please select at least one pattern', 'error');
      return false;
    }
    
    if (ticketType === 'paid' && (!ticketCost || parseFloat(ticketCost) <= 0)) {
      showToast('Please enter a valid ticket cost', 'error');
      return false;
    }
    
    if (!maxPlayers || parseInt(maxPlayers) <= 0) {
      showToast('Please enter a valid max players count', 'error');
      return false;
    }
    
    if (!maxTickets || parseInt(maxTickets) <= 0) {
      showToast('Please enter a valid max tickets count', 'error');
      return false;
    }
    
    if (!maxWinners || parseInt(maxWinners) <= 0) {
      showToast('Please enter a valid max winners count', 'error');
      return false;
    }
    
    // Validate pattern rewards
    for (const reward of patternRewards) {
      if (!reward.amount || parseFloat(reward.amount) <= 0) {
        showToast(`Please enter a valid reward amount for ${reward.pattern_name || 'pattern'}`, 'error');
        return false;
      }
      if (!reward.reward_count || parseInt(reward.reward_count) <= 0) {
        showToast(`Please enter a valid reward count for ${reward.pattern_name || 'pattern'}`, 'error');
        return false;
      }
      if (!reward.min_tickets_required || parseInt(reward.min_tickets_required) <= 0) {
        showToast(`Please enter valid minimum tickets for ${reward.pattern_name || 'pattern'}`, 'error');
        return false;
      }
      if (!reward.reward_name || !reward.reward_name.trim()) {
        showToast(`Please enter a reward name for ${reward.pattern_name || 'pattern'}`, 'error');
        return false;
      }
    }
    
    return true;
  };

  const updateGame = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('hostToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const gameData = {
        game_name: gameName.trim(),
        game_date: gameDate.toISOString().split('T')[0],
        game_start_time: gameStartTime.toTimeString().split(' ')[0].substring(0, 5),
        ticket_request_end_date: ticketRequestEndDate.toISOString().split('T')[0],
        ticket_request_end_time: ticketRequestEndTime.toTimeString().split(' ')[0].substring(0, 5),
        message: message.trim(),
        limited_type_game: limitedTypeGame,
        verified_phone_only: verifiedPhoneOnly,
        allow_late_claims: allowLateClaims,
        promote_brand: promoteBrand,
        ticket_type: ticketType,
        reward_type: rewardType,
        ticket_cost: ticketType === 'paid' ? parseFloat(ticketCost) : 0,
        max_players: parseInt(maxPlayers),
        max_tickets: parseInt(maxTickets),
        max_winners: parseInt(maxWinners),
        allow_sharing_claims: allowSharingClaims,
        set_reward_limit: setRewardLimit,
        selected_patterns: selectedPatterns.map(p => p.id),
        pattern_rewards: patternRewards.map(reward => ({
          pattern_id: reward.pattern_id,
          reward_name: reward.reward_name.trim(),
          description: reward.description || reward.pattern_description || '',
          amount: parseFloat(reward.amount),
          reward_count: parseInt(reward.reward_count),
          min_tickets_required: parseInt(reward.min_tickets_required)
        })),
      };

      const response = await axios.put(
        `https://exilance.com/tambolatimez/public/api/host/games/${game.id}`,
        gameData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Check for success
      const isSuccess = 
        response.data.success === true || 
        response.data.status === true || 
        response.data.message?.toLowerCase().includes('success') ||
        response.data.data?.id;

      if (isSuccess) {
        // Show success toast
        showToast(response.data.message || 'Game updated successfully!', 'success');
        
        // Navigate back to the previous screen after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = response.data.message || 
                            response.data.error || 
                            'Failed to update game. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.log('Error updating game:', error);
      
      let errorMessage = error.message || 'Failed to update game. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // PATTERN FUNCTIONS
  const handlePatternSelect = (pattern) => {
    setSelectedPatterns(prev => {
      const isSelected = prev.some(p => p.id === pattern.id);
      
      if (isSelected) {
        // Remove pattern
        setPatternRewards(prevRewards => 
          prevRewards.filter(reward => reward.pattern_id !== pattern.id)
        );
        return prev.filter(p => p.id !== pattern.id);
      } else {
        // Add pattern with default reward
        const existingReward = patternRewards.find(r => r.pattern_id === pattern.id);
        
        if (existingReward) {
          // Pattern already has a reward, keep it
          return [...prev, pattern];
        } else {
          // Add new reward with defaults
          const newReward = {
            pattern_id: pattern.id,
            pattern_name: pattern.pattern_name,
            pattern_description: pattern.description,
            reward_name: pattern.pattern_name.replace(/_/g, ' ') + ' Prize',
            description: pattern.description,
            amount: '100',
            reward_count: '1',
            min_tickets_required: '1'
          };
          
          setPatternRewards(prev => [...prev, newReward]);
          return [...prev, pattern];
        }
      }
    });
  };

  const updatePatternReward = (patternId, field, value) => {
    setPatternRewards(prev => 
      prev.map(reward => 
        reward.pattern_id === patternId 
          ? { ...reward, [field]: value }
          : reward
      )
    );
  };

  const openRewardModal = (pattern) => {
    setCurrentPatternForReward(pattern);
    setPatternsModalType('rewards');
    setPatternsModalVisible(true);
  };

  const openInlineRewardEdit = (pattern) => {
    setEditingReward(pattern.id);
  };

  const saveInlineReward = () => {
    setEditingReward(null);
  };

  const renderPatternItem = ({ item }) => {
    const isSelected = selectedPatterns.some(p => p.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.patternCard, isSelected && styles.patternCardSelected]}
        onPress={() => handlePatternSelect(item)}
      >
        <View style={styles.patternCardContent}>
          <View style={styles.patternCardHeader}>
            <View style={[
              styles.patternTypeBadge,
              { backgroundColor: getPatternColor(item.logic_type) + '20' }
            ]}>
              <Text style={[
                styles.patternTypeText,
                { color: getPatternColor(item.logic_type) }
              ]}>
                {getPatternIcon(item.logic_type)}
              </Text>
            </View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            ) : (
              <View style={styles.radioCircle} />
            )}
          </View>
          
          <Text style={styles.patternName} numberOfLines={2}>
            {item.pattern_name.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.patternDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getPatternIcon = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return '🎯';
      case 'count_based':
        return '🔢';
      case 'all_numbers':
        return '⭐';
      case 'row_complete':
        return '📊';
      case 'number_based':
        return '🎲';
      case 'number_range':
        return '📈';
      default:
        return '🎮';
    }
  };

  const getPatternColor = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return '#FF6B6B';
      case 'count_based':
        return '#FF9800';
      case 'all_numbers':
        return '#4CAF50';
      case 'row_complete':
        return '#9C27B0';
      case 'number_based':
        return '#2196F3';
      case 'number_range':
        return '#607D8B';
      default:
        return '#666';
    }
  };

  const PatternsModal = () => (
    <Modal
      visible={patternsModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setPatternsModalVisible(false);
        setPatternsModalType('select');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {patternsModalType === 'select' ? (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Text style={styles.modalTitle}>🎯 Select Game Patterns</Text>
                  <Text style={styles.modalSubtitle}>
                    Choose patterns to include in your game
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setPatternsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {loadingPatterns ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3498db" />
                  <Text style={styles.loadingText}>Loading patterns...</Text>
                </View>
              ) : (
                <FlatList
                  data={patternsList}
                  renderItem={renderPatternItem}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.patternsGrid}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyPatterns}>
                      <Ionicons name="grid-outline" size={60} color="#CCC" />
                      <Text style={styles.emptyPatternsText}>No patterns available</Text>
                    </View>
                  }
                />
              )}

              <View style={styles.modalFooter}>
                <View style={styles.selectionInfo}>
                  <Text style={styles.selectionCount}>
                    {selectedPatterns.length} pattern(s) selected
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setPatternsModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Text style={styles.modalTitle}>💰 Set Reward</Text>
                  <Text style={styles.modalSubtitle}>
                    Configure reward for {currentPatternForReward?.pattern_name.replace(/_/g, ' ')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setPatternsModalType('select');
                    setPatternsModalVisible(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {currentPatternForReward && (
                  <View style={styles.rewardFormCard}>
                    <View style={styles.rewardFormSection}>
                      <Text style={styles.sectionLabel}>Reward Details</Text>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reward Name *</Text>
                        <TextInput
                          style={styles.input}
                          value={
                            patternRewards.find(r => r.pattern_id === currentPatternForReward.id)?.reward_name || ''
                          }
                          onChangeText={(value) => updatePatternReward(currentPatternForReward.id, 'reward_name', value)}
                          placeholder="e.g., First Line Prize"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={
                            patternRewards.find(r => r.pattern_id === currentPatternForReward.id)?.description || ''
                          }
                          onChangeText={(value) => updatePatternReward(currentPatternForReward.id, 'description', value)}
                          placeholder="Describe this reward"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.rewardFormSection}>
                      <Text style={styles.sectionLabel}>Reward Configuration</Text>
                      
                      <View style={styles.row}>
                        <View style={styles.halfInput}>
                          <Text style={styles.inputLabel}>Amount (₹) *</Text>
                          <TextInput
                            style={styles.input}
                            value={
                              patternRewards.find(r => r.pattern_id === currentPatternForReward.id)?.amount || ''
                            }
                            onChangeText={(value) => updatePatternReward(currentPatternForReward.id, 'amount', value)}
                            keyboardType="numeric"
                            placeholder="500"
                          />
                        </View>
                        
                        <View style={styles.halfInput}>
                          <Text style={styles.inputLabel}>Reward Count *</Text>
                          <TextInput
                            style={styles.input}
                            value={
                              patternRewards.find(r => r.pattern_id === currentPatternForReward.id)?.reward_count || ''
                            }
                            onChangeText={(value) => updatePatternReward(currentPatternForReward.id, 'reward_count', value)}
                            keyboardType="numeric"
                            placeholder="1"
                          />
                        </View>
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Min Tickets Required *</Text>
                        <TextInput
                          style={styles.input}
                          value={
                            patternRewards.find(r => r.pattern_id === currentPatternForReward.id)?.min_tickets_required || ''
                          }
                          onChangeText={(value) => updatePatternReward(currentPatternForReward.id, 'min_tickets_required', value)}
                          keyboardType="numeric"
                          placeholder="1"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.doneButton, styles.saveButton]}
                  onPress={() => {
                    setPatternsModalType('select');
                    setPatternsModalVisible(false);
                  }}
                >
                  <Text style={styles.doneButtonText}>Save Reward</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />
      
      {/* Toast Notification */}
      <Toast />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Edit Game</Text>
            <Text style={styles.headerSubtitle}>
              {game?.game_code || 'Update game details'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Game Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFE6E6' }]}>
              <Ionicons name="information-circle" size={20} color="#FF7675" />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Game Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="game-controller" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={gameName}
                onChangeText={setGameName}
                placeholder="Enter game name"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Game Message (Optional)</Text>
            <View style={[styles.inputContainer, styles.messageInputContainer]}>
              <Ionicons 
                name="chatbubble" 
                size={20} 
                color="#666" 
                style={styles.messageInputIcon} 
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter a message for players..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Schedule Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E6F0FF' }]}>
              <Ionicons name="time" size={20} color="#2196F3" />
            </View>
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Game Date *</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowGameDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {formatDate(gameDate)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Start Time *</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowGameTimePicker(true)}
              >
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {formatTime(gameStartTime)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Ticket Request End *</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {formatDate(ticketRequestEndDate)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>End Time *</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.dateButtonText} numberOfLines={1}>
                  {formatTime(ticketRequestEndTime)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Game Configuration Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E6F7E9' }]}>
              <Ionicons name="settings" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.sectionTitle}>Game Configuration</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Ticket Type *</Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    ticketType === 'free' && styles.optionButtonActive
                  ]}
                  onPress={() => setTicketType('free')}
                >
                  <Ionicons 
                    name="gift" 
                    size={16} 
                    color={ticketType === 'free' ? '#FFF' : '#666'} 
                  />
                  <Text style={[
                    styles.optionButtonText,
                    ticketType === 'free' && styles.optionButtonTextActive
                  ]}>
                    Free
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    ticketType === 'paid' && styles.optionButtonActive
                  ]}
                  onPress={() => setTicketType('paid')}
                >
                  <Ionicons 
                    name="cash" 
                    size={16} 
                    color={ticketType === 'paid' ? '#FFF' : '#666'} 
                  />
                  <Text style={[
                    styles.optionButtonText,
                    ticketType === 'paid' && styles.optionButtonTextActive
                  ]}>
                    Paid
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Reward Type *</Text>
              <TouchableOpacity
                style={styles.fixedOptionButton}
              >
                <Ionicons name="trophy" size={16} color="#666" />
                <Text style={styles.fixedOptionText}>
                  Fixed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {ticketType === 'paid' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ticket Cost (₹) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="logo-rupee" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={ticketCost}
                  onChangeText={setTicketCost}
                  keyboardType="numeric"
                  placeholder="Enter ticket price"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Max Players *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="people" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Max Tickets *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="ticket" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={maxTickets}
                  onChangeText={setMaxTickets}
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Winners *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="trophy" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={maxWinners}
                onChangeText={setMaxWinners}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Game Options Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="options" size={20} color="#FF9800" />
            </View>
            <Text style={styles.sectionTitle}>Game Options</Text>
          </View>
          
          {[
            { label: 'Limited Type Game', value: limitedTypeGame, setter: setLimitedTypeGame, description: 'Limit game to specific criteria' },
            { label: 'Verified Phone Only', value: verifiedPhoneOnly, setter: setVerifiedPhoneOnly, description: 'Require verified phone numbers' },
            { label: 'Allow Late Claims', value: allowLateClaims, setter: setAllowLateClaims, description: 'Allow claims after game ends' },
            { label: 'Promote Brand', value: promoteBrand, setter: setPromoteBrand, description: 'Show brand promotion' },
            { label: 'Allow Sharing Claims', value: allowSharingClaims, setter: setAllowSharingClaims, description: 'Allow players to share claims' },
            { label: 'Set Reward Limit', value: setRewardLimit, setter: setSetRewardLimit, description: 'Limit total rewards' },
          ].map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                value={option.value}
                onValueChange={option.setter}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#FFF"
              />
            </View>
          ))}
        </View>

        {/* Pattern Selection Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="grid" size={20} color="#9C27B0" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Pattern Selection</Text>
              <Text style={styles.requiredText}>*</Text>
            </View>
            <TouchableOpacity
              style={styles.selectPatternsButton}
              onPress={() => {
                setPatternsModalType('select');
                setPatternsModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={16} color="#3498db" />
              <Text style={styles.selectPatternsText}>
                {selectedPatterns.length > 0 ? 'Edit Patterns' : 'Select Patterns'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {selectedPatterns.length > 0 ? (
            <>
              <View style={styles.selectedPatternsList}>
                {selectedPatterns.map((pattern, index) => {
                  const reward = patternRewards.find(r => r.pattern_id === pattern.id);
                  const isEditing = editingReward === pattern.id;
                  
                  return (
                    <View key={pattern.id} style={styles.selectedPatternCard}>
                      <View style={styles.selectedPatternHeader}>
                        <View style={styles.patternInfo}>
                          <View style={[
                            styles.patternIcon,
                            { backgroundColor: getPatternColor(pattern.logic_type) + '20' }
                          ]}>
                            <Text style={{ color: getPatternColor(pattern.logic_type) }}>
                              {getPatternIcon(pattern.logic_type)}
                            </Text>
                          </View>
                          <View style={styles.patternText}>
                            <Text style={styles.selectedPatternName} numberOfLines={1}>
                              {pattern.pattern_name.replace(/_/g, ' ')}
                            </Text>
                            <Text style={styles.patternType} numberOfLines={1}>
                              {pattern.logic_type.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        </View>
                        {!isEditing ? (
                          <TouchableOpacity
                            style={styles.configureRewardButton}
                            onPress={() => openInlineRewardEdit(pattern)}
                          >
                            <Ionicons name="pencil" size={14} color="#4CAF50" />
                            <Text style={styles.configureRewardText}>
                              {reward?.amount ? `₹${reward.amount}` : 'Set'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.configureRewardButton, styles.saveRewardButton]}
                            onPress={saveInlineReward}
                          >
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                            <Text style={[styles.configureRewardText, styles.saveRewardText]}>
                              Save
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {reward && reward.reward_name && (
                        <View style={styles.rewardInfo}>
                          {isEditing ? (
                            <>
                              {/* Editable Reward Name */}
                              <View style={styles.inlineInputGroup}>
                                <Text style={styles.inlineInputLabel}>Reward Name</Text>
                                <TextInput
                                  style={styles.inlineInput}
                                  value={reward.reward_name}
                                  onChangeText={(value) => updatePatternReward(pattern.id, 'reward_name', value)}
                                  placeholder="Reward name"
                                />
                              </View>
                              
                              {/* Editable Reward Details */}
                              <View style={styles.inlineRewardDetails}>
                                <View style={styles.inlineRewardDetail}>
                                  <Text style={styles.inlineRewardLabel}>Amount (₹)</Text>
                                  <TextInput
                                    style={styles.inlineRewardInput}
                                    value={reward.amount}
                                    onChangeText={(value) => updatePatternReward(pattern.id, 'amount', value)}
                                    keyboardType="numeric"
                                    placeholder="Amount"
                                  />
                                </View>
                                
                                <View style={styles.inlineRewardDetail}>
                                  <Text style={styles.inlineRewardLabel}>Reward Count</Text>
                                  <TextInput
                                    style={styles.inlineRewardInput}
                                    value={reward.reward_count}
                                    onChangeText={(value) => updatePatternReward(pattern.id, 'reward_count', value)}
                                    keyboardType="numeric"
                                    placeholder="Count"
                                  />
                                </View>
                                
                                <View style={styles.inlineRewardDetail}>
                                  <Text style={styles.inlineRewardLabel}>Min Tickets</Text>
                                  <TextInput
                                    style={styles.inlineRewardInput}
                                    value={reward.min_tickets_required}
                                    onChangeText={(value) => updatePatternReward(pattern.id, 'min_tickets_required', value)}
                                    keyboardType="numeric"
                                    placeholder="Min tickets"
                                  />
                                </View>
                              </View>
                              
                              {/* Editable Description */}
                              <View style={styles.inlineInputGroup}>
                                <Text style={styles.inlineInputLabel}>Description</Text>
                                <TextInput
                                  style={[styles.inlineInput, styles.inlineTextArea]}
                                  value={reward.description}
                                  onChangeText={(value) => updatePatternReward(pattern.id, 'description', value)}
                                  placeholder="Description"
                                  multiline
                                  numberOfLines={2}
                                />
                              </View>
                            </>
                          ) : (
                            <>
                              {/* Non-editable view */}
                              <Text style={styles.rewardName}>{reward.reward_name}</Text>
                              {reward.description && (
                                <Text style={styles.rewardDescription}>{reward.description}</Text>
                              )}
                              <View style={styles.rewardDetails}>
                                <View style={styles.rewardDetail}>
                                  <Ionicons name="cash" size={12} color="#4CAF50" />
                                  <Text style={styles.rewardAmount}>₹{reward.amount}</Text>
                                </View>
                                <View style={styles.rewardDetail}>
                                  <Ionicons name="trophy" size={12} color="#FF9800" />
                                  <Text style={styles.rewardCount}>×{reward.reward_count}</Text>
                                </View>
                                <View style={styles.rewardDetail}>
                                  <Ionicons name="ticket" size={12} color="#2196F3" />
                                  <Text style={styles.rewardMinTickets}>
                                    Min: {reward.min_tickets_required}
                                  </Text>
                                </View>
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
              
              <View style={styles.selectionSummary}>
                <Text style={styles.selectionSummaryText}>
                  🎯 {selectedPatterns.length} pattern(s) selected
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noPatterns}>
              <Ionicons name="grid-outline" size={50} color="#CCC" />
              <Text style={styles.noPatternsText}>No patterns selected</Text>
              <Text style={styles.noPatternsSubtext}>
                Click "Select Patterns" to choose game patterns
              </Text>
            </View>
          )}
        </View>

        {/* Update Game Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={updateGame}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#FFF" />
              <Text style={styles.createButtonText}>Update Game</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Date/Time Pickers */}
      {showGameDatePicker && (
        <DateTimePicker
          value={gameDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowGameDatePicker(false);
            if (date) setGameDate(date);
          }}
        />
      )}
      
      {showGameTimePicker && (
        <DateTimePicker
          value={gameStartTime}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowGameTimePicker(false);
            if (date) setGameStartTime(date);
          }}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={ticketRequestEndDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setTicketRequestEndDate(date);
          }}
        />
      )}
      
      {showEndTimePicker && (
        <DateTimePicker
          value={ticketRequestEndTime}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) setTicketRequestEndTime(date);
          }}
        />
      )}

      {/* Patterns Modal */}
      <PatternsModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  requiredText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  messageInputContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  messageInputIcon: {
    marginLeft: 12,
    marginTop: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    minHeight: 50,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8FAFC',
  },
  optionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#FFF',
  },
  fixedOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8FAFC',
  },
  fixedOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  selectPatternsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectPatternsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  selectedPatternsList: {
    marginBottom: 16,
  },
  selectedPatternCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  selectedPatternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patternIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  patternText: {
    flex: 1,
  },
  selectedPatternName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  patternType: {
    fontSize: 11,
    color: '#666',
  },
  configureRewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  saveRewardButton: {
    backgroundColor: '#4CAF50',
  },
  configureRewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  saveRewardText: {
    color: '#FFF',
  },
  rewardInfo: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  rewardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  rewardDetails: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  rewardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  rewardCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  rewardMinTickets: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  // Inline Edit Styles
  inlineInputGroup: {
    marginBottom: 12,
  },
  inlineInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  inlineTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inlineRewardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inlineRewardDetail: {
    flex: 1,
  },
  inlineRewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  inlineRewardInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FFF',
    textAlign: 'center',
  },
  selectionSummary: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectionSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  noPatterns: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noPatternsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  noPatternsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 20,
  },
  // Toast Styles
  toast: {
    position: 'absolute',
    top: 50,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  patternsGrid: {
    padding: 15,
  },
  patternCard: {
    width: (width * 0.9 - 50) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    margin: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  patternCardSelected: {
    backgroundColor: '#F0F9F0',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  patternCardContent: {
    flex: 1,
  },
  patternCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTypeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternTypeText: {
    fontSize: 18,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
  },
  patternName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  patternDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyPatterns: {
    alignItems: 'center',
    padding: 40,
  },
  emptyPatternsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  rewardFormCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rewardFormSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
});

export default HostGameEdit;