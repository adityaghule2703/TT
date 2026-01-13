import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const HostGameCreation = ({ navigation, route }) => {
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form States
  const [loading, setLoading] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameDate, setGameDate] = useState(new Date());
  const [gameStartTime, setGameStartTime] = useState(new Date());
  const [ticketRequestEndDate, setTicketRequestEndDate] = useState(new Date());
  const [ticketRequestEndTime, setTicketRequestEndTime] = useState(new Date());
  const [message, setMessage] = useState('');
  const [ticketType, setTicketType] = useState('paid');
  const [rewardType, setRewardType] = useState('fixed');
  const [ticketCost, setTicketCost] = useState('50');
  const [maxPlayers, setMaxPlayers] = useState('100');
  const [maxTickets, setMaxTickets] = useState('200');
  const [maxWinners, setMaxWinners] = useState('10');
  
  // Date/Time Picker States
  const [showGameDatePicker, setShowGameDatePicker] = useState(false);
  const [showGameTimePicker, setShowGameTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Pattern Selection States
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [patternRewards, setPatternRewards] = useState([]);
  const [patternsList, setPatternsList] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });

  useEffect(() => {
    if (currentStep === 4) {
      fetchPatterns();
    }
  }, [currentStep]);

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
        setPatternsList(response.data.data || []);
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!gameName.trim()) {
          showToast('Please enter a game name', 'error');
          return false;
        }
        return true;
      
      case 2:
        return true;
      
      case 3:
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
        return true;
      
      case 4:
        if (selectedPatterns.length === 0) {
          showToast('Please select at least one pattern', 'error');
          return false;
        }
        
        for (const reward of patternRewards) {
          if (!reward.amount || parseFloat(reward.amount) <= 0) {
            showToast(`Please enter a valid reward amount for ${reward.pattern_name}`, 'error');
            return false;
          }
          if (!reward.reward_count || parseInt(reward.reward_count) <= 0) {
            showToast(`Please enter a valid reward count for ${reward.pattern_name}`, 'error');
            return false;
          }
          if (!reward.min_tickets_required || parseInt(reward.min_tickets_required) <= 0) {
            showToast(`Please enter valid minimum tickets for ${reward.pattern_name}`, 'error');
            return false;
          }
          if (!reward.reward_name || !reward.reward_name.trim()) {
            showToast(`Please enter a reward name for ${reward.pattern_name}`, 'error');
            return false;
          }
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createGame = async () => {
    if (!validateStep(4)) return;

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
        ticket_type: ticketType,
        reward_type: rewardType,
        ticket_cost: ticketType === 'paid' ? parseFloat(ticketCost) : 0,
        max_players: parseInt(maxPlayers),
        max_tickets: parseInt(maxTickets),
        max_winners: parseInt(maxWinners),
        selected_patterns: selectedPatterns.map(p => p.id),
        pattern_rewards: patternRewards.map(reward => ({
          pattern_id: reward.pattern_id,
          reward_name: reward.reward_name.trim(),
          description: reward.description || reward.pattern_description,
          amount: parseFloat(reward.amount),
          reward_count: parseInt(reward.reward_count),
          min_tickets_required: parseInt(reward.min_tickets_required)
        })),
      };

      const response = await axios.post(
        'https://exilance.com/tambolatimez/public/api/host/games/create-with-patterns',
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

      const isSuccess = 
        response.data.success === true || 
        response.data.status === true || 
        response.data.message?.toLowerCase().includes('success') ||
        response.data.data?.id;

      if (isSuccess) {
        showToast(response.data.message || 'Game created successfully!', 'success');
        
        // Navigate back to HostGame which will automatically refresh due to focus event
        setTimeout(() => {
  navigation.goBack();  // This will take you back to the previous screen (HostGame)
}, 1500);
      } else {
        const errorMessage = response.data.message || 
                            response.data.error || 
                            'Failed to create game. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.log('Error creating game:', error);
      
      let errorMessage = error.message || 'Failed to create game. Please try again.';
      
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

  const handlePatternSelect = useCallback((pattern) => {
    setSelectedPatterns(prev => {
      const isSelected = prev.some(p => p.id === pattern.id);
      
      if (isSelected) {
        setPatternRewards(prevRewards => 
          prevRewards.filter(reward => reward.pattern_id !== pattern.id)
        );
        return prev.filter(p => p.id !== pattern.id);
      } else {
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
    });
  }, []);

  const updatePatternReward = useCallback((patternId, field, value) => {
    setPatternRewards(prev => 
      prev.map(reward => 
        reward.pattern_id === patternId 
          ? { ...reward, [field]: value }
          : reward
      )
    );
  }, []);

  const openInlineRewardEdit = useCallback((pattern) => {
    setEditingReward(pattern.id);
  }, []);

  const saveInlineReward = useCallback(() => {
    setEditingReward(null);
  }, []);

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

  const renderPatternItem = useCallback(({ item }) => {
    const isSelected = selectedPatterns.some(p => p.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.patternCard, isSelected && styles.patternCardSelected]}
        onPress={() => handlePatternSelect(item)}
        activeOpacity={0.7}
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
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
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
  }, [selectedPatterns, handlePatternSelect]);

  const getPatternIcon = useCallback((logicType) => {
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
  }, []);

  const getPatternColor = useCallback((logicType) => {
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
  }, []);

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#FFE6E6' }]}>
            <Ionicons name="information-circle" size={18} color="#FF7675" />
          </View>
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Game Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="game-controller" size={18} color="#666" style={styles.inputIcon} />
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
              size={18} 
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
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#E6F0FF' }]}>
            <Ionicons name="time" size={18} color="#2196F3" />
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
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateButtonText} numberOfLines={1}>
                {formatDate(gameDate)}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Start Time *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowGameTimePicker(true)}
            >
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.dateButtonText} numberOfLines={1}>
                {formatTime(gameStartTime)}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
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
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateButtonText} numberOfLines={1}>
                {formatDate(ticketRequestEndDate)}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>End Time *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.dateButtonText} numberOfLines={1}>
                {formatTime(ticketRequestEndTime)}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#E6F7E9' }]}>
            <Ionicons name="settings" size={18} color="#4CAF50" />
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
                  size={14} 
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
                  size={14} 
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
              <Ionicons name="trophy" size={14} color="#666" />
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
              <Ionicons name="logo-rupee" size={18} color="#666" style={styles.inputIcon} />
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
              <Ionicons name="people" size={18} color="#666" style={styles.inputIcon} />
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
              <Ionicons name="ticket" size={18} color="#666" style={styles.inputIcon} />
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
            <Ionicons name="trophy" size={18} color="#666" style={styles.inputIcon} />
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
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="grid" size={18} color="#9C27B0" />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Pattern Selection</Text>
            <Text style={styles.requiredText}>*</Text>
          </View>
          <View style={styles.selectionCountBadge}>
            <Text style={styles.selectionCountText}>
              {selectedPatterns.length} selected
            </Text>
          </View>
        </View>
        
        <Text style={styles.stepDescription}>
          Select game patterns and configure their rewards
        </Text>
        
        {loadingPatterns ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7675" />
            <Text style={styles.loadingText}>Loading patterns...</Text>
          </View>
        ) : patternsList.length > 0 ? (
          <>
            <FlatList
              data={patternsList}
              renderItem={renderPatternItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.patternsGrid}
              numColumns={2}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
            />
            
            {selectedPatterns.length > 0 && (
              <View style={styles.selectedPatternsSection}>
                <Text style={styles.sectionTitle}>Configure Rewards for Selected Patterns</Text>
                
                <View style={styles.selectedPatternsList}>
                  {selectedPatterns.map((pattern) => {
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
                              <Text style={{ color: getPatternColor(pattern.logic_type), fontSize: 16 }}>
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
                              <Ionicons name="pencil" size={12} color="#4CAF50" />
                              <Text style={styles.configureRewardText}>
                                {reward?.amount ? `₹${reward.amount}` : 'Set'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={[styles.configureRewardButton, styles.saveRewardButton]}
                              onPress={saveInlineReward}
                            >
                              <Ionicons name="checkmark" size={12} color="#FFF" />
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
                                <View style={styles.inlineInputGroup}>
                                  <Text style={styles.inlineInputLabel}>Reward Name</Text>
                                  <TextInput
                                    style={styles.inlineInput}
                                    value={reward.reward_name}
                                    onChangeText={(value) => updatePatternReward(pattern.id, 'reward_name', value)}
                                    placeholder="Reward name"
                                  />
                                </View>
                                
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
                                <Text style={styles.rewardName}>{reward.reward_name}</Text>
                                {reward.description && (
                                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                                )}
                                <View style={styles.rewardDetails}>
                                  <View style={styles.rewardDetail}>
                                    <Ionicons name="cash" size={10} color="#4CAF50" />
                                    <Text style={styles.rewardAmount}>₹{reward.amount}</Text>
                                  </View>
                                  <View style={styles.rewardDetail}>
                                    <Ionicons name="trophy" size={10} color="#FF9800" />
                                    <Text style={styles.rewardCount}>×{reward.reward_count}</Text>
                                  </View>
                                  <View style={styles.rewardDetail}>
                                    <Ionicons name="ticket" size={10} color="#2196F3" />
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
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyPatterns}>
            <Ionicons name="grid-outline" size={50} color="#CCC" />
            <Text style={styles.emptyPatternsText}>No patterns available</Text>
            <Text style={styles.emptyPatternsSubtext}>
              Please check your connection or contact support
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Step Progress Bar - Simplified without horizontal lines
  const StepProgress = () => (
    <View style={styles.stepProgressContainer}>
      <View style={styles.stepRow}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.stepColumn}>
            <View style={[
              styles.stepCircle,
              currentStep >= step ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              <Text style={[
                styles.stepNumber,
                currentStep >= step ? styles.stepNumberActive : styles.stepNumberInactive
              ]}>
                {step}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step ? styles.stepLabelActive : styles.stepLabelInactive
            ]} numberOfLines={1}>
              {step === 1 ? 'Basic' : 
               step === 2 ? 'Schedule' : 
               step === 3 ? 'Config' : 
               'Patterns'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FF7675" barStyle="light-content" />
      
      {/* Toast Notification */}
      <Toast />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (currentStep === 1) {
                navigation.goBack();
              } else {
                prevStep();
              }
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create New Game</Text>
            <Text style={styles.headerSubtitle}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>
        </View>
        
        <StepProgress />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStepContent()}
        
        {/* Button Container with fixed logic */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 ? (
            <>
              <TouchableOpacity
                style={styles.prevButton}
                onPress={prevStep}
              >
                <Ionicons name="arrow-back" size={16} color="#FF7675" />
                <Text style={styles.prevButtonText}>Back</Text>
              </TouchableOpacity>
              
              {currentStep < totalSteps ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={nextStep}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                  onPress={createGame}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="rocket" size={16} color="#FFF" />
                      <Text style={styles.createButtonText}>Launch Game</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.nextButtonFull]}
              onPress={nextStep}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

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
    paddingBottom: 20,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FF7675',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  // Step Progress Styles - Simplified
  stepProgressContainer: {
    height: 50,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepColumn: {
    alignItems: 'center',
    width: (width - 40) / 4,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  stepCircleInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FF7675',
  },
  stepNumberInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 60,
  },
  stepLabelActive: {
    color: '#FFF',
  },
  stepLabelInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  // Step Content
  stepContent: {
    paddingHorizontal: 16,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  requiredText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  selectionCountBadge: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  selectionCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF7675',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    minHeight: 46,
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginHorizontal: 6,
    textAlign: 'center',
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8FAFC',
  },
  optionButtonActive: {
    backgroundColor: '#FF7675',
    borderColor: '#FF7675',
  },
  optionButtonText: {
    fontSize: 12,
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
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8FAFC',
  },
  fixedOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  // Pattern Selection Styles - Fixed smaller cards
  patternsGrid: {
    paddingBottom: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  patternCard: {
    width: (width - 80) / 2, // Smaller width: 80 padding (16*2 + 8*2 + extra)
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8, // Smaller padding
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 110, // Smaller height
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
    marginBottom: 6,
  },
  patternTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternTypeText: {
    fontSize: 14,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#999',
  },
  patternName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
    lineHeight: 13,
    flexWrap: 'wrap',
    minHeight: 26, // Fixed height for 2 lines
  },
  patternDescription: {
    fontSize: 9,
    color: '#666',
    lineHeight: 11,
    flexWrap: 'wrap',
    minHeight: 33, // Fixed height for 3 lines
  },
  selectedPatternsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedPatternsList: {
    marginTop: 8,
  },
  selectedPatternCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  selectedPatternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patternInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patternIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  patternText: {
    flex: 1,
  },
  selectedPatternName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  patternType: {
    fontSize: 10,
    color: '#666',
  },
  configureRewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  saveRewardButton: {
    backgroundColor: '#4CAF50',
  },
  configureRewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  saveRewardText: {
    color: '#FFF',
  },
  rewardInfo: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  rewardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    lineHeight: 14,
  },
  rewardDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  rewardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  rewardCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
  },
  rewardMinTickets: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  // Inline Edit Styles - Reduced
  inlineInputGroup: {
    marginBottom: 10,
  },
  inlineInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FFF',
  },
  inlineTextArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  inlineRewardDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inlineRewardDetail: {
    flex: 1,
  },
  inlineRewardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginBottom: 3,
  },
  inlineRewardInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 12,
    color: '#333',
    backgroundColor: '#FFF',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyPatterns: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  emptyPatternsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyPatternsSubtext: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  // Button Container - Fixed equal width
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 10,
    width: width - 32,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF7675',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    minWidth: (width - 42) / 2,
  },
  prevButtonText: {
    color: '#FF7675',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7675',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
    flex: 1,
  },
  nextButtonFull: {
    width: '100%',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    minWidth: (width - 42) / 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 10,
  },
  // Toast Styles
  toast: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});

export default HostGameCreation;