import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  Image,
  Alert,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HostTicketRequests = ({ navigation, route }) => {
  const { gameId, gameName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketRequests, setTicketRequests] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [allocateQuantity, setAllocateQuantity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchTicketRequests();
  }, [gameId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketRequests();
    setRefreshing(false);
  };

  const fetchTicketRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      let url = "https://exilance.com/tambolatimez/public/api/host/ticket-requests";
      if (gameId) {
        url += `?game_id=${gameId}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data.success) {
        setTicketRequests(response.data.ticket_requests.data || []);
        setError(null);
      } else {
        throw new Error("Failed to fetch ticket requests");
      }
    } catch (error) {
      console.log("Error fetching ticket requests:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to load ticket requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (requestId) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`paid_${requestId}`]: true }));
      const token = await AsyncStorage.getItem("hostToken");

      const response = await axios.put(
        `https://exilance.com/tambolatimez/public/api/host/ticket-requests/${requestId}/mark-paid`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Payment marked as paid successfully",
          [{ text: "OK" }]
        );
        
        // Update the request in the list
        setTicketRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, payment_status: "paid" }
              : req
          )
        );
        
        // Update modal if it's open
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(prev => ({ ...prev, payment_status: "paid" }));
        }
      }
    } catch (error) {
      console.log("Error marking as paid:", error);
      Alert.alert(
        "Error",
        `Failed to mark as paid: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoadingActions(prev => ({ ...prev, [`paid_${requestId}`]: false }));
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      setLoadingActions(prev => ({ ...prev, [requestId]: true }));
      const token = await AsyncStorage.getItem("hostToken");

      let url, body;
      
      if (action === "approve") {
        url = `https://exilance.com/tambolatimez/public/api/host/ticket-requests/${requestId}/approve`;
        body = {
          allocate_quantity: allocateQuantity || 2,
          note: note || "Request approved. Tickets allocated successfully."
        };
      } else {
        url = `https://exilance.com/tambolatimez/public/api/host/ticket-requests/${requestId}/reject`;
        body = {
          rejection_reason: rejectionReason || "Not enough tickets available for allocation."
        };
      }

      const response = await axios.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          `Request ${action === "approve" ? "approved" : "rejected"} successfully`,
          [{ text: "OK" }]
        );
        
        // Update the request in the list
        setTicketRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { 
                ...req, 
                status: action === "approve" ? "approved" : "rejected",
                payment_status: action === "approve" ? "paid" : req.payment_status
              }
              : req
          )
        );
        
        // Update modal if it's open
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(prev => ({ 
            ...prev, 
            status: action === "approve" ? "approved" : "rejected",
            payment_status: action === "approve" ? "paid" : prev.payment_status
          }));
        }
        
        // Reset form fields
        setAllocateQuantity("");
        setNote("");
        setRejectionReason("");
        setActionModalVisible(false);
      }
    } catch (error) {
      console.log(`Error ${action}ing request:`, error);
      Alert.alert(
        "Error",
        `Failed to ${action} request: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoadingActions(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleBulkProcess = async () => {
    if (selectedRequests.length === 0) {
      Alert.alert("Error", "Please select at least one request");
      return;
    }

    if (!selectedAction) {
      Alert.alert("Error", "Please select an action (Approve or Reject)");
      return;
    }

    try {
      setLoadingActions(prev => ({ ...prev, bulk: true }));
      const token = await AsyncStorage.getItem("hostToken");

      const body = {
        request_ids: selectedRequests,
        action: selectedAction,
      };

      if (selectedAction === "reject" && rejectionReason) {
        body.rejection_reason = rejectionReason;
      }

      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/host/ticket-requests/bulk-process",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success",
          `${selectedRequests.length} requests ${selectedAction}ed successfully`,
          [{ text: "OK", onPress: () => {
            fetchTicketRequests();
            setBulkSelectMode(false);
            setSelectedRequests([]);
            setSelectedAction(null);
            setRejectionReason("");
            setActionModalVisible(false);
          }}]
        );
      }
    } catch (error) {
      console.log("Error bulk processing requests:", error);
      Alert.alert(
        "Error",
        `Failed to process requests: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoadingActions(prev => ({ ...prev, bulk: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "cancelled":
        return "#9E9E9E";
      default:
        return "#607D8B";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "clock-outline";
      case "approved":
        return "checkmark-circle-outline";
      case "rejected":
        return "close-circle-outline";
      case "cancelled":
        return "ban-outline";
      default:
        return "help-circle-outline";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return "checkmark-circle";
      case "pending":
        return "cash-outline";
      default:
        return "help-circle-outline";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRequestSelection = (requestId) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    } else {
      setSelectedRequests(prev => [...prev, requestId]);
    }
  };

  const selectAllRequests = () => {
    const pendingRequests = ticketRequests
      .filter(req => req.status === "pending")
      .map(req => req.id);
    
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests);
    }
  };

  const renderPaymentStatus = (request) => {
    if (request.status !== "pending") return null;

    return (
      <View style={styles.paymentStatusContainer}>
        <View style={[
          styles.paymentStatusBadge,
          { backgroundColor: getPaymentStatusColor(request.payment_status) + "15" }
        ]}>
          <Ionicons 
            name={getPaymentStatusIcon(request.payment_status)} 
            size={12} 
            color={getPaymentStatusColor(request.payment_status)} 
          />
          <Text style={[
            styles.paymentStatusText,
            { color: getPaymentStatusColor(request.payment_status) }
          ]}>
            {request.payment_status?.toUpperCase() || "PENDING"}
          </Text>
        </View>
        
        {request.payment_status === "pending" && (
          <TouchableOpacity
            style={styles.markPaidButton}
            onPress={() => markAsPaid(request.id)}
            disabled={loadingActions[`paid_${request.id}`]}
          >
            {loadingActions[`paid_${request.id}`] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={12} color="#FFF" />
                <Text style={styles.markPaidText}>Mark Paid</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRequestCard = (request) => (
    <TouchableOpacity
      key={request.id}
      style={[
        styles.requestCard,
        bulkSelectMode && { paddingLeft: 60 },
        selectedRequests.includes(request.id) && styles.selectedCard,
      ]}
      onPress={() => {
        if (bulkSelectMode && request.status === "pending") {
          toggleRequestSelection(request.id);
        } else {
          setSelectedRequest(request);
          setModalVisible(true);
        }
      }}
      activeOpacity={0.9}
    >
      {bulkSelectMode && request.status === "pending" && (
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            selectedRequests.includes(request.id) && styles.checkboxSelected
          ]}>
            {selectedRequests.includes(request.id) && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </View>
        </View>
      )}
      
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {request.user?.profile_image ? (
            <Image 
              source={{ uri: request.user.profile_image }} 
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {request.user?.name?.charAt(0) || "U"}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {request.user?.name || "Unknown User"}
            </Text>
            <Text style={styles.userPhone}>{request.user?.mobile || "No phone"}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + "15" }]}>
          <Ionicons 
            name={getStatusIcon(request.status)} 
            size={14} 
            color={getStatusColor(request.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="ticket-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{request.ticket_quantity} tickets</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.detailText}>₹{request.total_amount}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{formatDate(request.requested_at)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{formatTime(request.requested_at)}</Text>
          </View>
        </View>

        {renderPaymentStatus(request)}
      </View>

      {!bulkSelectMode && request.status === "pending" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => {
              setSelectedRequest(request);
              setSelectedAction("reject");
              setActionModalVisible(true);
            }}
            disabled={loadingActions[request.id]}
          >
            {loadingActions[request.id] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="close" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.approveButton,
              request.payment_status !== "paid" && styles.disabledActionButton
            ]}
            onPress={() => {
              if (request.payment_status === "paid") {
                setSelectedRequest(request);
                setSelectedAction("approve");
                setAllocateQuantity(request.ticket_quantity.toString());
                setActionModalVisible(true);
              } else {
                Alert.alert(
                  "Payment Required",
                  "Please mark payment as paid before approving the request.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Mark as Paid", 
                      onPress: () => markAsPaid(request.id)
                    }
                  ]
                );
              }
            }}
            disabled={loadingActions[request.id] || request.payment_status !== "paid"}
          >
            {loadingActions[request.id] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const ActionModal = () => (
    <Modal
      visible={actionModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setActionModalVisible(false);
        setSelectedAction(null);
        setRejectionReason("");
        setAllocateQuantity("");
        setNote("");
      }}
    >
      <View style={styles.actionModalOverlay}>
        <View style={styles.actionModalContainer}>
          <View style={styles.actionModalContent}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>
                {selectedRequests.length > 1 ? "Bulk Process" : `${selectedAction === "approve" ? "Approve" : "Reject"} Request`}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setActionModalVisible(false);
                  setSelectedAction(null);
                  setRejectionReason("");
                  setAllocateQuantity("");
                  setNote("");
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.actionModalBody}>
              {selectedRequests.length > 1 ? (
                <View style={styles.bulkInfo}>
                  <Text style={styles.bulkInfoText}>
                    Processing {selectedRequests.length} requests
                  </Text>
                </View>
              ) : (
                <View style={styles.requestInfo}>
                  <View style={styles.requestInfoHeader}>
                    <Text style={styles.requestInfoLabel}>User:</Text>
                    <Text style={styles.requestInfoValue}>
                      {selectedRequest?.user?.name || "Unknown User"}
                    </Text>
                  </View>
                  
                  <View style={styles.requestInfoRow}>
                    <View style={styles.requestInfoColumn}>
                      <Text style={styles.requestInfoLabel}>Tickets:</Text>
                      <Text style={styles.requestInfoValue}>
                        {selectedRequest?.ticket_quantity || 0}
                      </Text>
                    </View>
                    
                    <View style={styles.requestInfoColumn}>
                      <Text style={styles.requestInfoLabel}>Amount:</Text>
                      <Text style={styles.requestInfoValue}>
                        ₹{selectedRequest?.total_amount || 0}
                      </Text>
                    </View>
                  </View>

                  {selectedAction === "approve" && (
                    <View style={styles.paymentStatusInfo}>
                      <View style={[
                        styles.paymentStatusBadgeModal,
                        { backgroundColor: getPaymentStatusColor(selectedRequest?.payment_status) + "15" }
                      ]}>
                        <Ionicons 
                          name={getPaymentStatusIcon(selectedRequest?.payment_status)} 
                          size={14} 
                          color={getPaymentStatusColor(selectedRequest?.payment_status)} 
                        />
                        <Text style={[
                          styles.paymentStatusTextModal,
                          { color: getPaymentStatusColor(selectedRequest?.payment_status) }
                        ]}>
                          Payment: {selectedRequest?.payment_status?.toUpperCase() || "PENDING"}
                        </Text>
                      </View>
                      
                      {selectedRequest?.payment_status !== "paid" && (
                        <TouchableOpacity
                          style={styles.markPaidButtonModal}
                          onPress={() => {
                            setActionModalVisible(false);
                            markAsPaid(selectedRequest.id);
                          }}
                          disabled={loadingActions[`paid_${selectedRequest?.id}`]}
                        >
                          {loadingActions[`paid_${selectedRequest?.id}`] ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={14} color="#FFF" />
                              <Text style={styles.markPaidTextModal}>Mark as Paid</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actionForm}>
                {selectedAction === "approve" && (
                  <>
                    {selectedRequest?.payment_status !== "paid" && (
                      <View style={styles.paymentWarning}>
                        <Ionicons name="alert-circle" size={18} color="#FF9800" />
                        <Text style={styles.paymentWarningText}>
                          Payment must be marked as paid before approval
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Allocate Quantity *</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="ticket-outline" size={20} color="#666" />
                        <TextInput
                          style={styles.input}
                          value={allocateQuantity}
                          onChangeText={setAllocateQuantity}
                          placeholder="Enter quantity to allocate"
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.formHint}>
                        Requested: {selectedRequest?.ticket_quantity || 0}
                      </Text>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Note (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#666" />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={note}
                          onChangeText={setNote}
                          placeholder="Enter a note for approval"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>
                  </>
                )}

                {selectedAction === "reject" && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Rejection Reason *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="alert-circle-outline" size={20} color="#666" />
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        placeholder="Enter reason for rejection"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.actionModalActions}>
              <TouchableOpacity
                style={[styles.actionModalButton, styles.cancelButton]}
                onPress={() => {
                  setActionModalVisible(false);
                  setSelectedAction(null);
                  setRejectionReason("");
                  setAllocateQuantity("");
                  setNote("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionModalButton,
                  selectedAction === "approve" ? styles.approveButton : styles.rejectButton,
                  (!selectedAction || 
                   (selectedAction === "approve" && (!allocateQuantity || selectedRequest?.payment_status !== "paid")) ||
                   (selectedAction === "reject" && !rejectionReason)) && styles.disabledButton
                ]}
                onPress={() => {
                  if (selectedRequests.length > 1) {
                    handleBulkProcess();
                  } else if (selectedRequest) {
                    handleRequestAction(selectedRequest.id, selectedAction);
                  }
                }}
                disabled={
                  !selectedAction ||
                  (selectedAction === "approve" && (!allocateQuantity || selectedRequest?.payment_status !== "paid")) ||
                  (selectedAction === "reject" && !rejectionReason) ||
                  loadingActions[selectedRequest?.id] ||
                  loadingActions.bulk
                }
              >
                {loadingActions[selectedRequest?.id] || loadingActions.bulk ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionModalButtonText}>
                    {selectedAction === "approve" ? "Approve" : "Reject"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const RequestDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ticket Request Details</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.userInfoModal}>
                    {selectedRequest.user?.profile_image ? (
                      <Image 
                        source={{ uri: selectedRequest.user.profile_image }} 
                        style={styles.userAvatarModal}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholderModal}>
                        <Text style={styles.avatarTextModal}>
                          {selectedRequest.user?.name?.charAt(0) || "U"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.userDetailsModal}>
                      <Text style={styles.userNameModal}>{selectedRequest.user?.name || "Unknown User"}</Text>
                      <Text style={styles.userPhoneModal}>{selectedRequest.user?.mobile || "No phone"}</Text>
                      <Text style={styles.userUsernameModal}>@{selectedRequest.user?.username || "No username"}</Text>
                    </View>
                  </View>

                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadgeModal, { backgroundColor: getStatusColor(selectedRequest.status) + "15" }]}>
                      <Ionicons 
                        name={getStatusIcon(selectedRequest.status)} 
                        size={18} 
                        color={getStatusColor(selectedRequest.status)} 
                      />
                      <Text style={[styles.statusTextModal, { color: getStatusColor(selectedRequest.status) }]}>
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </Text>
                    </View>

                    <View style={[styles.paymentStatusBadgeModal, { backgroundColor: getPaymentStatusColor(selectedRequest.payment_status) + "15" }]}>
                      <Ionicons 
                        name={getPaymentStatusIcon(selectedRequest.payment_status)} 
                        size={14} 
                        color={getPaymentStatusColor(selectedRequest.payment_status)} 
                      />
                      <Text style={[
                        styles.paymentStatusTextModal,
                        { color: getPaymentStatusColor(selectedRequest.payment_status) }
                      ]}>
                        Payment: {selectedRequest.payment_status?.toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                      <Ionicons name="ticket-outline" size={20} color="#3498db" />
                      <Text style={styles.infoCardLabel}>Tickets</Text>
                      <Text style={styles.infoCardValue}>{selectedRequest.ticket_quantity}</Text>
                    </View>

                    <View style={styles.infoCard}>
                      <Ionicons name="cash-outline" size={20} color="#3498db" />
                      <Text style={styles.infoCardLabel}>Amount</Text>
                      <Text style={styles.infoCardValue}>₹{selectedRequest.total_amount}</Text>
                    </View>

                    <View style={styles.infoCard}>
                      <Ionicons name="card-outline" size={20} color="#3498db" />
                      <Text style={styles.infoCardLabel}>Payment Status</Text>
                      <Text style={styles.infoCardValue}>
                        {selectedRequest.payment_status?.charAt(0).toUpperCase() + selectedRequest.payment_status?.slice(1) || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.infoCard}>
                      <Ionicons name="game-controller-outline" size={20} color="#3498db" />
                      <Text style={styles.infoCardLabel}>Game</Text>
                      <Text style={styles.infoCardValue} numberOfLines={1}>
                        {selectedRequest.game?.game_name || "Unknown Game"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <View style={styles.detailRowModal}>
                      <Ionicons name="calendar-outline" size={18} color="#666" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Requested Date</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(selectedRequest.requested_at)} at {formatTime(selectedRequest.requested_at)}
                        </Text>
                      </View>
                    </View>

                    {selectedRequest.approved_at && (
                      <View style={styles.detailRowModal}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Approved At</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(selectedRequest.approved_at)} at {formatTime(selectedRequest.approved_at)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedRequest.rejected_at && (
                      <View style={styles.detailRowModal}>
                        <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Rejected At</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(selectedRequest.rejected_at)} at {formatTime(selectedRequest.rejected_at)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedRequest.rejection_reason && (
                      <View style={styles.detailRowModal}>
                        <Ionicons name="alert-circle-outline" size={18} color="#FF9800" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Rejection Reason</Text>
                          <Text style={styles.detailValue}>{selectedRequest.rejection_reason}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {selectedRequest.notes && (
                    <View style={styles.notesCard}>
                      <View style={styles.notesHeader}>
                        <Ionicons name="document-text-outline" size={18} color="#3498db" />
                        <Text style={styles.notesTitle}>Notes</Text>
                      </View>
                      <Text style={styles.notesText}>{selectedRequest.notes}</Text>
                    </View>
                  )}

                  <View style={styles.modalBottomSpace} />
                </ScrollView>

                {selectedRequest.status === "pending" && (
                  <View style={styles.modalActions}>
                    {selectedRequest.payment_status === "pending" && (
                      <TouchableOpacity
                        style={[styles.modalActionButton, styles.markPaidButtonFull]}
                        onPress={() => {
                          setModalVisible(false);
                          markAsPaid(selectedRequest.id);
                        }}
                        disabled={loadingActions[`paid_${selectedRequest.id}`]}
                      >
                        {loadingActions[`paid_${selectedRequest.id}`] ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                            <Text style={styles.modalActionButtonText}>Mark as Paid</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.modalRejectButton]}
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedAction("reject");
                        setActionModalVisible(true);
                      }}
                    >
                      <Ionicons name="close" size={18} color="#FFF" />
                      <Text style={styles.modalActionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.modalActionButton, 
                        styles.modalApproveButton,
                        selectedRequest.payment_status !== "paid" && styles.disabledActionButton
                      ]}
                      onPress={() => {
                        if (selectedRequest.payment_status === "paid") {
                          setModalVisible(false);
                          setSelectedAction("approve");
                          setAllocateQuantity(selectedRequest.ticket_quantity.toString());
                          setActionModalVisible(true);
                        } else {
                          Alert.alert(
                            "Payment Required",
                            "Please mark payment as paid before approving the request.",
                            [
                              { text: "Cancel", style: "cancel" },
                              { 
                                text: "Mark as Paid", 
                                onPress: () => {
                                  setModalVisible(false);
                                  markAsPaid(selectedRequest.id);
                                }
                              }
                            ]
                          );
                        }
                      }}
                      disabled={selectedRequest.payment_status !== "paid"}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                      <Text style={styles.modalActionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading ticket requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={80} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Requests</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTicketRequests}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />

      <View style={styles.header}>
        {!bulkSelectMode ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setBulkSelectMode(false);
              setSelectedRequests([]);
            }}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerContent}>
          {bulkSelectMode ? (
            <Text style={styles.headerTitle}>
              {selectedRequests.length} selected
            </Text>
          ) : (
            <>
              <Text style={styles.headerTitle}>
                {gameName ? `${gameName} - Requests` : "Ticket Requests"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {ticketRequests.length} {ticketRequests.length === 1 ? "request" : "requests"} found
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {!bulkSelectMode ? (
            <>
              {ticketRequests.filter(r => r.status === "pending").length > 0 && (
                <TouchableOpacity
                  style={styles.bulkButton}
                  onPress={() => setBulkSelectMode(true)}
                >
                  <Ionicons name="checkbox-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.refreshButton} onPress={fetchTicketRequests}>
                <Ionicons name="refresh" size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={selectAllRequests}
              >
                <Text style={styles.selectAllText}>
                  {selectedRequests.length === ticketRequests.filter(r => r.status === "pending").length 
                    ? "Deselect All" 
                    : "Select All"}
                </Text>
              </TouchableOpacity>
              {selectedRequests.length > 0 && (
                <TouchableOpacity
                  style={styles.processButton}
                  onPress={() => setActionModalVisible(true)}
                >
                  <Ionicons name="play-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3498db"
            colors={["#3498db"]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {ticketRequests.length > 0 ? (
          <>
            {!bulkSelectMode && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={20} color="#FF9800" />
                  <Text style={styles.statCount}>
                    {ticketRequests.filter(r => r.status === "pending").length}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                  <Text style={styles.statCount}>
                    {ticketRequests.filter(r => r.status === "approved").length}
                  </Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="close-circle-outline" size={20} color="#F44336" />
                  <Text style={styles.statCount}>
                    {ticketRequests.filter(r => r.status === "rejected").length}
                  </Text>
                  <Text style={styles.statLabel}>Rejected</Text>
                </View>
              </View>
            )}

            {bulkSelectMode && (
              <View style={styles.bulkHeader}>
                <Text style={styles.bulkTitle}>Select requests to process</Text>
                <Text style={styles.bulkSubtitle}>
                  {selectedRequests.length} of {ticketRequests.filter(r => r.status === "pending").length} selected
                </Text>
              </View>
            )}
            
            <Text style={styles.sectionTitle}>
              {bulkSelectMode ? "Pending Requests" : "All Requests"}
            </Text>
            
            <View style={styles.requestsContainer}>
              {ticketRequests.map(renderRequestCard)}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="ticket-outline" size={80} color="#D1D5DB" />
              <View style={styles.emptyDot} />
              <View style={[styles.emptyDot, styles.emptyDot2]} />
              <View style={[styles.emptyDot, styles.emptyDot3]} />
            </View>
            <Text style={styles.emptyStateTitle}>No Ticket Requests</Text>
            <Text style={styles.emptyStateText}>
              {gameName 
                ? `No ticket requests found for ${gameName}`
                : "No ticket requests found for your games"
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <RequestDetailModal />
      <ActionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#3498db",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  selectAllText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  processButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  bulkHeader: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  bulkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 4,
  },
  bulkSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  selectedCard: {
    borderColor: "#3498db",
    borderWidth: 2,
    backgroundColor: "#F0F9FF",
  },
  checkboxContainer: {
    position: "absolute",
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#3498db",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  paymentStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  paymentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  markPaidButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  markPaidText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  disabledActionButton: {
    opacity: 0.5,
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionModalContainer: {
    width: "100%",
    maxHeight: "80%",
  },
  actionModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  actionModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  actionModalBody: {
    maxHeight: 400,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  bulkInfo: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  bulkInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  requestInfo: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requestInfoHeader: {
    marginBottom: 12,
  },
  requestInfoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  requestInfoColumn: {
    flex: 1,
  },
  requestInfoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  requestInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  paymentStatusInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  paymentStatusBadgeModal: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  paymentStatusTextModal: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  markPaidButtonModal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  markPaidTextModal: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  paymentWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  paymentWarningText: {
    flex: 1,
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "500",
  },
  actionForm: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 36,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  actionModalActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  actionModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  actionModalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: 24,
  },
  emptyDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  emptyDot2: {
    top: 10,
    right: 10,
  },
  emptyDot3: {
    bottom: 10,
    left: 10,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  userInfoModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userAvatarModal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholderModal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarTextModal: {
    fontSize: 24,
    fontWeight: "600",
    color: "#3498db",
  },
  userDetailsModal: {
    flex: 1,
  },
  userNameModal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  userPhoneModal: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userUsernameModal: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadgeModal: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusTextModal: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    width: (width * 0.9 - 48 - 12) / 2,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 8,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
    textAlign: "center",
  },
  detailsSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  detailRowModal: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  notesCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E40AF",
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  markPaidButtonFull: {
    backgroundColor: "#9C27B0",
  },
  modalRejectButton: {
    backgroundColor: "#F44336",
  },
  modalApproveButton: {
    backgroundColor: "#4CAF50",
  },
  modalActionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBottomSpace: {
    height: 20,
  },
  requestsContainer: {
    marginBottom: 40,
  },
});

export default HostTicketRequests;