import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const HostSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [requestStartDate, setRequestStartDate] = useState('');
  const [requestEndDate, setRequestEndDate] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptionData();
    setRefreshing(false);
  };

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('hostToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      // Fetch plans
      const plansResponse = await axios.get(
        'https://exilance.com/tambolatimez/public/api/host/subscriptions/plans',
        { headers }
      );

      // Fetch subscription requests (this includes current status in response)
      const requestsResponse = await axios.get(
        'https://exilance.com/tambolatimez/public/api/host/subscriptions/requests',
        { headers }
      );

      if (plansResponse.data.status && requestsResponse.data.status) {
        setPlans(plansResponse.data.data.plans || []);
        setSubscriptionRequests(requestsResponse.data.data.requests || []);
        setCurrentSubscription(requestsResponse.data.data.current_subscription || null);
        setCurrentStatus(requestsResponse.data.data.current_subscription || null);
        setError(null);
      } else {
        throw new Error('Failed to fetch subscription data');
      }
    } catch (error) {
      console.log('Error fetching subscription data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    
    // Set default dates based on plan duration
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let endDate = new Date(today);
    if (plan.duration === 'years') {
      endDate.setFullYear(today.getFullYear() + plan.duration_value);
    } else if (plan.duration === 'months') {
      endDate.setMonth(today.getMonth() + plan.duration_value);
    } else if (plan.duration === 'days') {
      endDate.setDate(today.getDate() + plan.duration_value);
    }
    
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    setRequestStartDate(startDate);
    setRequestEndDate(formattedEndDate);
    setShowDateInputs(false); // Hide date inputs initially
    setModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedPlan) return;

    // Validate dates
    if (!requestStartDate || !requestEndDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    // Check if end date is after start date
    const start = new Date(requestStartDate);
    const end = new Date(requestEndDate);
    if (end <= start) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('hostToken');
      if (!token) return;

      const response = await axios.post(
        'https://exilance.com/tambolatimez/public/api/host/subscriptions/send-request',
        {
          plan_id: selectedPlan.id,
          requested_start_date: requestStartDate,
          requested_end_date: requestEndDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        Alert.alert('Success', 'Subscription request sent successfully!');
        setModalVisible(false);
        fetchSubscriptionData(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to send request');
      }
    } catch (error) {
      console.log('Error submitting request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to send subscription request'
      );
    }
  };

  const handleCancelRequest = async (requestId) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this subscription request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('hostToken');
              if (!token) return;

              const response = await axios.delete(
                `https://exilance.com/tambolatimez/public/api/host/subscriptions/requests/${requestId}/cancel`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                  },
                }
              );

              if (response.data.status) {
                Alert.alert('Success', 'Subscription request cancelled successfully!');
                fetchSubscriptionData(); // Refresh data
              } else {
                throw new Error(response.data.message || 'Failed to cancel request');
              }
            } catch (error) {
              console.log('Error cancelling request:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || error.message || 'Failed to cancel request'
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'inactive':
        return '#F44336';
      case 'expired':
        return '#9E9E9E';
      case 'cancelled':
        return '#607D8B';
      case 'rejected':
        return '#F44336';
      case 'approved':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const calculateSavings = (original, discounted) => {
    if (!discounted || !original) return 0;
    const originalNum = parseFloat(original);
    const discountedNum = parseFloat(discounted);
    return Math.round(((originalNum - discountedNum) / originalNum) * 100);
  };

  const renderPlanCard = (plan) => (
    <View key={plan.id} style={styles.planCard}>
      {plan.is_popular && (
        <View style={styles.popularBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.popularBadgeText}>POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planName} numberOfLines={2}>
            {plan.name}
          </Text>
          <Text style={styles.planDuration}>
            {plan.duration_value} {plan.duration}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          {plan.has_discount && plan.discounted_price ? (
            <>
              <Text style={styles.discountedPrice}>
                {formatPrice(plan.discounted_price)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(plan.original_price)}
              </Text>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>
                  Save {calculateSavings(plan.original_price, plan.discounted_price)}%
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.regularPrice}>
              {formatPrice(plan.original_price)}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.planDescription} numberOfLines={2}>
        {plan.description}
      </Text>

      {plan.features && plan.features.length > 0 && (
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText} numberOfLines={1}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.selectPlanButton,
          (currentStatus?.has_pending_request || currentStatus?.has_active_subscription) && 
          styles.disabledButton
        ]}
        onPress={() => handlePlanSelect(plan)}
        disabled={currentStatus?.has_pending_request || currentStatus?.has_active_subscription}
      >
        <Text style={styles.selectPlanButtonText}>
          {currentStatus?.has_pending_request || currentStatus?.has_active_subscription
            ? 'Request Already Sent'
            : 'Select Plan'}
        </Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = (request, index) => {
    const isPending = request.status === 'pending';
    
    return (
      <View key={request.id} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyPlanInfo}>
            <Text style={styles.historyPlanName} numberOfLines={1}>
              {request.plan?.name || 'Unknown Plan'}
            </Text>
            <View style={styles.historyPriceContainer}>
              {request.discounted_price && request.discounted_price !== request.plan_price ? (
                <>
                  <Text style={styles.historyDiscountedPrice} numberOfLines={1}>
                    {formatPrice(request.discounted_price)}
                  </Text>
                  <Text style={styles.historyOriginalPrice} numberOfLines={1}>
                    {formatPrice(request.original_price)}
                  </Text>
                </>
              ) : (
                <Text style={styles.historyRegularPrice} numberOfLines={1}>
                  {formatPrice(request.plan_price)}
                </Text>
              )}
            </View>
          </View>
          <View style={[
            styles.historyStatusBadge,
            { backgroundColor: getStatusColor(request.status) + '20' }
          ]}>
            <Text style={[styles.historyStatusText, { color: getStatusColor(request.status) }]}>
              {request.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.historyDetails}>
          <View style={styles.historyDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.historyDetailText} numberOfLines={1}>
              Requested Start: {formatDate(request.requested_start_date)}
            </Text>
          </View>
          <View style={styles.historyDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.historyDetailText} numberOfLines={1}>
              Requested End: {formatDate(request.requested_end_date)}
            </Text>
          </View>
          
          {request.approved_start_date && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
              <Text style={styles.historyDetailText} numberOfLines={1}>
                Approved Start: {formatDate(request.approved_start_date)}
              </Text>
            </View>
          )}
          
          {request.approved_end_date && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
              <Text style={styles.historyDetailText} numberOfLines={1}>
                Approved End: {formatDate(request.approved_end_date)}
              </Text>
            </View>
          )}
          
          {request.rejection_reason && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
              <Text style={[styles.historyDetailText, { color: '#F44336' }]} numberOfLines={2}>
                Reason: {request.rejection_reason}
              </Text>
            </View>
          )}
          
          {request.admin_notes && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="document-text-outline" size={14} color="#666" />
              <Text style={styles.historyDetailText} numberOfLines={2}>
                Notes: {request.admin_notes}
              </Text>
            </View>
          )}
          
          <View style={styles.historyDetailRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.historyDetailText} numberOfLines={1}>
              Requested on: {formatDateTime(request.created_at)}
            </Text>
          </View>
          
          {request.approved_at && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="checkmark-outline" size={14} color="#4CAF50" />
              <Text style={styles.historyDetailText} numberOfLines={1}>
                Approved on: {formatDateTime(request.approved_at)}
              </Text>
            </View>
          )}
          
          {request.rejected_at && (
            <View style={styles.historyDetailRow}>
              <Ionicons name="close-outline" size={14} color="#F44336" />
              <Text style={styles.historyDetailText} numberOfLines={1}>
                Rejected on: {formatDateTime(request.rejected_at)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Remove cancel button from history tab */}
        {/* {isPending && (
          <TouchableOpacity
            style={styles.cancelRequestButton}
            onPress={() => handleCancelRequest(request.id)}
          >
            <Ionicons name="close-circle" size={16} color="#F44336" />
            <Text style={styles.cancelRequestText}>Cancel Request</Text>
          </TouchableOpacity>
        )} */}
      </View>
    );
  };

  const renderCurrentStatus = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Ionicons name="card-outline" size={24} color="#3498db" />
        <Text style={styles.statusTitle}>Current Subscription Status</Text>
      </View>
      
      <View style={styles.statusContent}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[
            styles.statusValueBadge,
            { backgroundColor: getStatusColor(currentStatus?.status) + '20' }
          ]}>
            <Text style={[
              styles.statusValueText,
              { color: getStatusColor(currentStatus?.status) }
            ]}>
              {currentStatus?.status?.toUpperCase() || 'INACTIVE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Active Subscription:</Text>
          <Text style={styles.statusValue}>
            {currentStatus?.has_active_subscription ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Pending Request:</Text>
          <Text style={styles.statusValue}>
            {currentStatus?.has_pending_request ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {currentStatus?.plan && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Plan:</Text>
              <Text style={styles.statusValue} numberOfLines={1}>
                {currentStatus.plan.name}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Start Date:</Text>
              <Text style={styles.statusValue}>{formatDate(currentStatus.start_date)}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>End Date:</Text>
              <Text style={styles.statusValue}>{formatDate(currentStatus.end_date)}</Text>
            </View>
            
            {currentStatus.days_remaining > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Days Remaining:</Text>
                <Text style={styles.statusValue}>{currentStatus.days_remaining}</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Show cancel button ONLY in Plans tab - removed from here */}
      {/* {currentStatus?.has_pending_request && subscriptionRequests.length > 0 && (
        <TouchableOpacity
          style={styles.cancelCurrentRequestButton}
          onPress={() => {
            // Find the pending request
            const pendingRequest = subscriptionRequests.find(req => req.status === 'pending');
            if (pendingRequest) {
              handleCancelRequest(pendingRequest.id);
            }
          }}
        >
          <Ionicons name="close-circle" size={16} color="#F44336" />
          <Text style={styles.cancelCurrentRequestText}>Cancel Pending Request</Text>
        </TouchableOpacity>
      )} */}
    </View>
  );

  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorTitle}>Subscription Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptionData}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <Text style={styles.headerSubtitle}>Choose the perfect plan for your hosting needs</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
          onPress={() => setActiveTab('plans')}
        >
          <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
            Plans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'status' && styles.activeTab]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>
            Status
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>


      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans.length > 0 ? (
            plans.map(renderPlanCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={60} color="#CCC" />
              <Text style={styles.emptyStateText}>No subscription plans available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for new plans</Text>
            </View>
          )}
        </>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <>
          {renderCurrentStatus()}
          
          {/* Remove pending request card from Status tab */}
          {/* {currentStatus?.has_pending_request && subscriptionRequests.length > 0 && (
            <View style={styles.pendingRequestCard}>
              <View style={styles.pendingRequestHeader}>
                <Ionicons name="time-outline" size={24} color="#FF9800" />
                <Text style={styles.pendingRequestTitle}>Pending Request</Text>
              </View>
              <Text style={styles.pendingRequestText}>
                Your subscription request is under review by the admin. 
                You'll be notified once it's approved.
              </Text>
              <TouchableOpacity
                style={styles.cancelPendingRequestButton}
                onPress={() => {
                  const pendingRequest = subscriptionRequests.find(req => req.status === 'pending');
                  if (pendingRequest) {
                    handleCancelRequest(pendingRequest.id);
                  }
                }}
              >
                <Ionicons name="close-circle" size={16} color="#F44336" />
                <Text style={styles.cancelPendingRequestText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          )} */}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          <Text style={styles.sectionTitle}>Subscription Requests</Text>
          {subscriptionRequests.length > 0 ? (
            subscriptionRequests.map(renderRequestItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={60} color="#CCC" />
              <Text style={styles.emptyStateText}>No subscription requests</Text>
              <Text style={styles.emptyStateSubtext}>
                Your subscription requests will appear here
              </Text>
            </View>
          )}
        </>
      )}

      {/* Info Banner */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color="#3498db" />
          <Text style={styles.infoTitle}>How It Works</Text>
        </View>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              1. Select a plan that fits your needs
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              2. Your request will be reviewed by admin
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              3. Start hosting games once approved
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpace} />

      {/* Request Modal - Simplified without DateTimePicker */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Subscription</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <>
                <View style={styles.selectedPlanCard}>
                  <Text style={styles.selectedPlanName} numberOfLines={2}>
                    {selectedPlan.name}
                  </Text>
                  <Text style={styles.selectedPlanPrice}>
                    {selectedPlan.has_discount && selectedPlan.discounted_price
                      ? formatPrice(selectedPlan.discounted_price)
                      : formatPrice(selectedPlan.original_price)}
                  </Text>
                  <Text style={styles.selectedPlanDuration}>
                    {selectedPlan.duration_value} {selectedPlan.duration}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.toggleDateInputsButton}
                  onPress={() => setShowDateInputs(!showDateInputs)}
                >
                  <Ionicons 
                    name={showDateInputs ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#3498db" 
                  />
                  <Text style={styles.toggleDateInputsText}>
                    {showDateInputs ? 'Hide Date Selection' : 'Customize Dates (Optional)'}
                  </Text>
                </TouchableOpacity>

                {showDateInputs && (
                  <>
                    <View style={styles.dateInfo}>
                      <Ionicons name="information-circle" size={16} color="#666" />
                      <Text style={styles.dateInfoText}>
                        Default dates are set based on plan duration. You can customize them if needed.
                      </Text>
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateInputLabel}>Start Date (YYYY-MM-DD)</Text>
                      <View style={styles.dateInput}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.dateInputText}>
                          {requestStartDate}
                        </Text>
                      </View>
                      <Text style={styles.dateHelperText}>
                        Suggested: {formatDate(requestStartDate)}
                      </Text>
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateInputLabel}>End Date (YYYY-MM-DD)</Text>
                      <View style={styles.dateInput}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.dateInputText}>
                          {requestEndDate}
                        </Text>
                      </View>
                      <Text style={styles.dateHelperText}>
                        Suggested: {formatDate(requestEndDate)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitRequestButton}
                    onPress={handleSubmitRequest}
                  >
                    <Text style={styles.submitRequestButtonText}>Send Request</Text>
                    <Ionicons name="send" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 30,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#3498db',
  },
  statusCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  statusContent: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusValueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cancelCurrentRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  cancelCurrentRequestText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
    marginRight: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    textAlign: 'right',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
    textAlign: 'right',
  },
  regularPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    textAlign: 'right',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  selectPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  selectPlanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  historyCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyPlanInfo: {
    flex: 1,
    marginRight: 10,
  },
  historyPlanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  historyPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDiscountedPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  historyOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  historyRegularPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyDetails: {
    gap: 8,
    marginBottom: 12,
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDetailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  cancelRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelRequestText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pendingRequestCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFECB3',
    marginBottom: 20,
  },
  pendingRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
    marginLeft: 12,
  },
  pendingRequestText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
    marginBottom: 16,
  },
  cancelPendingRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelPendingRequestText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  bottomSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  selectedPlanCard: {
    backgroundColor: '#E6F0FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedPlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedPlanPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3498db',
    marginBottom: 4,
  },
  selectedPlanDuration: {
    fontSize: 14,
    color: '#666',
  },
  toggleDateInputsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleDateInputsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateInfoText: {
    fontSize: 12,
    color: '#5D4037',
    marginLeft: 8,
    flex: 1,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateInputText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dateHelperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelModalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitRequestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitRequestButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default HostSubscription;