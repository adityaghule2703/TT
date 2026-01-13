import React, { useState, useEffect, useMemo } from 'react';
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
  Dimensions,
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const TICKET_WIDTH = Math.min(width, height) - 100;
const CELL_SIZE = (TICKET_WIDTH - 60) / 9;

const UserGamePatterns = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { selectedPatternId, selectedPattern: selectedPatternFromRoute } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredPatterns, setFilteredPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const filters = [
    { id: 'all', label: 'All Patterns' },
    { id: 'position_based', label: 'Position Based' },
    { id: 'count_based', label: 'Count Based' },
    { id: 'all_numbers', label: 'All Numbers' },
    { id: 'row_complete', label: 'Row Complete' },
    { id: 'number_based', label: 'Number Based' },
    { id: 'number_range', label: 'Number Range' },
    { id: 'unknown', label: 'Other Patterns' },
  ];

  useEffect(() => {
    fetchPatterns();
  }, []);

  useEffect(() => {
    // Filter patterns whenever patterns or filter changes
    const filterPatterns = () => {
      let filtered = [...patterns];
      
      if (selectedFilter !== 'all') {
        filtered = filtered.filter(pattern => {
          if (!pattern) return false;
          
          if (selectedFilter === 'unknown') {
            const logicType = getPatternLogicType(pattern);
            return logicType === 'unknown' || !logicType;
          }
          
          const logicType = getPatternLogicType(pattern);
          return logicType === selectedFilter;
        });
      }
      
      setFilteredPatterns(filtered);
    };

    filterPatterns();
  }, [patterns, selectedFilter]);

  useEffect(() => {
    if (selectedPatternFromRoute) {
      setSelectedPattern(selectedPatternFromRoute);
      const logicType = getPatternLogicType(selectedPatternFromRoute);
      setSelectedFilter(logicType === 'unknown' ? 'unknown' : logicType);
      setTimeout(() => setModalVisible(true), 500);
    } else if (selectedPatternId && patterns.length > 0) {
      const pattern = patterns.find(p => p.id === selectedPatternId);
      if (pattern) {
        setSelectedPattern(pattern);
        const logicType = getPatternLogicType(pattern);
        setSelectedFilter(logicType === 'unknown' ? 'unknown' : logicType);
        setTimeout(() => setModalVisible(true), 500);
      }
    }
  }, [patterns, selectedPatternId, selectedPatternFromRoute]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPatterns();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        'https://exilance.com/tambolatimez/public/api/user/patterns/available',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        const patternsData = response.data.data?.patterns || [];
        setPatterns(patternsData);
        setError(null);
        
        if (selectedPatternId && patternsData.length > 0) {
          const pattern = patternsData.find(p => p.id === selectedPatternId);
          if (pattern && !selectedPattern) {
            setSelectedPattern(pattern);
            const logicType = getPatternLogicType(pattern);
            setSelectedFilter(logicType === 'unknown' ? 'unknown' : logicType);
          }
        }
      } else {
        throw new Error('Failed to fetch patterns');
      }
    } catch (error) {
      console.log('Error fetching patterns:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  // Generate valid tambola ticket with exactly 5 numbers per row
  const generateValidTicketNumbers = useMemo(() => {
    return () => {
      const ticket = Array(3).fill().map(() => Array(9).fill(null));
      const numbersUsed = new Set();
      const numbersByColumn = Array(9).fill().map(() => []);
      
      // Generate numbers for each column (1-3 numbers per column)
      for (let col = 0; col < 9; col++) {
        const min = col === 0 ? 1 : col * 10 + 1;
        const max = col === 8 ? 90 : (col + 1) * 10;
        const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 numbers per column
        
        while (numbersByColumn[col].length < count) {
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!numbersUsed.has(num)) {
            numbersByColumn[col].push(num);
            numbersUsed.add(num);
          }
        }
        numbersByColumn[col].sort((a, b) => a - b);
      }
      
      // Adjust to ensure exactly 15 numbers total
      let totalNumbers = numbersByColumn.reduce((sum, col) => sum + col.length, 0);
      
      // Add numbers if less than 15
      while (totalNumbers < 15) {
        const col = Math.floor(Math.random() * 9);
        if (numbersByColumn[col].length < 3) {
          const min = col === 0 ? 1 : col * 10 + 1;
          const max = col === 8 ? 90 : (col + 1) * 10;
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!numbersUsed.has(num)) {
            numbersByColumn[col].push(num);
            numbersUsed.add(num);
            numbersByColumn[col].sort((a, b) => a - b);
            totalNumbers++;
          }
        }
      }
      
      // Remove numbers if more than 15
      while (totalNumbers > 15) {
        const col = Math.floor(Math.random() * 9);
        if (numbersByColumn[col].length > 1) {
          const removed = numbersByColumn[col].pop();
          numbersUsed.delete(removed);
          totalNumbers--;
        }
      }
      
      // Place numbers in rows ensuring exactly 5 numbers per row
      const rowCounts = [0, 0, 0];
      
      // First, distribute numbers randomly
      for (let col = 0; col < 9; col++) {
        for (let num of numbersByColumn[col]) {
          // Find available rows for this column
          const availableRows = [];
          for (let row = 0; row < 3; row++) {
            if (ticket[row][col] === null && rowCounts[row] < 5) {
              availableRows.push(row);
            }
          }
          
          if (availableRows.length > 0) {
            const randomRow = availableRows[Math.floor(Math.random() * availableRows.length)];
            ticket[randomRow][col] = num;
            rowCounts[randomRow]++;
          }
        }
      }
      
      // Adjust to ensure exactly 5 numbers per row
      for (let row = 0; row < 3; row++) {
        while (rowCounts[row] < 5) {
          // Find a column with less than 3 numbers and this row is empty
          for (let col = 0; col < 9; col++) {
            if (ticket[row][col] === null) {
              const columnCount = ticket.reduce((sum, r) => sum + (r[col] !== null ? 1 : 0), 0);
              if (columnCount < 3) {
                // Add a new number
                const min = col === 0 ? 1 : col * 10 + 1;
                const max = col === 8 ? 90 : (col + 1) * 10;
                let newNum;
                do {
                  newNum = Math.floor(Math.random() * (max - min + 1)) + min;
                } while (numbersUsed.has(newNum));
                
                ticket[row][col] = newNum;
                numbersUsed.add(newNum);
                rowCounts[row]++;
                break;
              }
            }
          }
        }
        
        while (rowCounts[row] > 5) {
          // Move a number to another row
          for (let col = 0; col < 9; col++) {
            if (ticket[row][col] !== null) {
              // Find another row that needs this number
              for (let otherRow = 0; otherRow < 3; otherRow++) {
                if (otherRow !== row && rowCounts[otherRow] < 5 && ticket[otherRow][col] === null) {
                  ticket[otherRow][col] = ticket[row][col];
                  ticket[row][col] = null;
                  rowCounts[row]--;
                  rowCounts[otherRow]++;
                  break;
                }
              }
              if (rowCounts[row] <= 5) break;
            }
          }
        }
      }
      
      return ticket;
    };
  }, []);

  // Parse ticket numbers from string format to valid tambola ticket
  const parseTicketNumbers = useMemo(() => {
    return (ticketString) => {
      if (!ticketString) return generateValidTicketNumbers();
      
      try {
        const ticket = Array(3).fill().map(() => Array(9).fill(null));
        const numbers = ticketString.split(',').map(num => parseInt(num.trim(), 10)).filter(n => !isNaN(n));
        
        if (numbers.length !== 15) {
          console.log('Invalid ticket length:', numbers.length);
          return generateValidTicketNumbers();
        }
        
        // Sort numbers
        numbers.sort((a, b) => a - b);
        
        // Distribute numbers to create valid tambola ticket
        const numbersByColumn = Array(9).fill().map(() => []);
        
        // Group numbers by column
        numbers.forEach(num => {
          if (num >= 1 && num <= 90) {
            const col = Math.floor((num - 1) / 10);
            numbersByColumn[col].push(num);
          }
        });
        
        // Sort numbers in each column
        numbersByColumn.forEach(col => col.sort((a, b) => a - b));
        
        // Place numbers in rows ensuring valid tambola ticket structure
        const rowCounts = [0, 0, 0];
        
        for (let col = 0; col < 9; col++) {
          const columnNumbers = numbersByColumn[col];
          if (columnNumbers.length > 0) {
            // Distribute numbers to rows
            for (let i = 0; i < columnNumbers.length; i++) {
              // Find available rows for this column
              const availableRows = [];
              for (let row = 0; row < 3; row++) {
                if (ticket[row][col] === null && rowCounts[row] < 5) {
                  availableRows.push(row);
                }
              }
              
              if (availableRows.length > 0) {
                // Distribute evenly
                const rowIndex = availableRows[0];
                ticket[rowIndex][col] = columnNumbers[i];
                rowCounts[rowIndex]++;
              }
            }
          }
        }
        
        return ticket;
      } catch (error) {
        console.log('Error parsing ticket:', error);
        return generateValidTicketNumbers();
      }
    };
  }, [generateValidTicketNumbers]);

  // Generate or retrieve ticket for a specific pattern
  const generateTicketForPattern = useMemo(() => {
    const ticketCache = new Map(); // Use local Map instead of React state
    
    return (pattern) => {
      const cacheKey = pattern.id;
      
      if (ticketCache.has(cacheKey)) {
        return ticketCache.get(cacheKey);
      }
      
      let ticket = generateValidTicketNumbers();
      ticketCache.set(cacheKey, ticket);
      return ticket;
    };
  }, [generateValidTicketNumbers]);

  // Get pattern positions relative to actual numbers in each row
  const getPatternPositionsForTicket = (ticket, pattern) => {
    const positions = pattern.positions || pattern.pattern_logic?.rules?.positions || [];
    if (!positions || positions.length === 0) {
      return null;
    }
    
    const patternGrid = Array(3).fill().map(() => Array(9).fill(false));
    
    positions.forEach(pos => {
      const row = pos.row - 1;
      const patternPosition = pos.position;
      
      if (row >= 0 && row < 3) {
        let numberCount = 0;
        for (let col = 0; col < 9; col++) {
          if (ticket[row][col] !== null) {
            numberCount++;
            if (numberCount === patternPosition) {
              patternGrid[row][col] = true;
              break;
            }
          }
        }
      }
    });
    
    return patternGrid;
  };

  const getPatternLogicType = (pattern) => {
    return pattern.pattern_logic?.logic_type || pattern.logic_type || 'unknown';
  };

  const getPatternPositions = (pattern) => {
    return pattern.positions || pattern.pattern_logic?.rules?.positions || [];
  };

  const isPositionBasedPattern = (pattern) => {
    const logicType = getPatternLogicType(pattern);
    return logicType === 'position_based' || pattern.is_position_based;
  };

  const renderPatternCard = (pattern) => {
    if (!pattern) return null;
    
    const isPositionBased = isPositionBasedPattern(pattern);
    
    return (
      <TouchableOpacity
        key={pattern.id}
        style={[
          styles.patternCard,
          selectedPattern?.id === pattern.id && styles.selectedPatternCard,
        ]}
        onPress={() => {
          setSelectedPattern(pattern);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.patternHeader}>
          <View style={styles.patternIcon}>
            <Ionicons 
              name={getPatternIcon(getPatternLogicType(pattern))} 
              size={24} 
              color="#FF7675" 
            />
          </View>
          <View style={styles.patternInfo}>
            <View style={styles.patternNameRow}>
              <Text style={styles.patternName} numberOfLines={1}>
                {pattern.display_name || formatPatternName(pattern.pattern_name)}
              </Text>
            </View>
            <View style={styles.patternMeta}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getPatternColor(getPatternLogicType(pattern)) + '20' }
              ]}>
                <Text style={[
                  styles.typeText,
                  { color: getPatternColor(getPatternLogicType(pattern)) }
                ]}>
                  {formatLogicType(getPatternLogicType(pattern))}
                </Text>
              </View>
              {isPositionBased && getPatternPositions(pattern).length > 0 && (
                <View style={styles.positionsBadge}>
                  <Ionicons name="grid" size={12} color="#666" />
                  <Text style={styles.positionsText}>
                    {getPatternPositions(pattern).length} positions
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
        
        <Text style={styles.patternDescription} numberOfLines={2}>
          {pattern.description}
        </Text>
        
        {isPositionBased && getPatternPositions(pattern).length > 0 && (
          <View style={styles.miniTicketContainer}>
            <MiniTicketGrid pattern={pattern} />
            <View style={styles.positionExplanation}>
              <Text style={styles.positionExplanationText}>
                Positions are relative to actual numbers in each row
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const MiniTicketGrid = ({ pattern }) => {
    const ticketNumbers = useMemo(() => generateTicketForPattern(pattern), [pattern, generateTicketForPattern]);
    const patternGrid = useMemo(() => 
      isPositionBasedPattern(pattern) ? getPatternPositionsForTicket(ticketNumbers, pattern) : null, 
      [pattern, ticketNumbers]
    );
    
    return (
      <View style={styles.miniTicket}>
        {ticketNumbers.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.miniRow}>
            {row.map((cell, colIndex) => (
              <View 
                key={`cell-${rowIndex}-${colIndex}`}
                style={[
                  styles.miniCell,
                  cell !== null && styles.miniCellWithNumber,
                  patternGrid && patternGrid[rowIndex] && patternGrid[rowIndex][colIndex] && styles.miniCellPattern,
                ]}
              >
                {cell !== null && (
                  <Text style={[
                    styles.miniCellNumber,
                    patternGrid && patternGrid[rowIndex] && patternGrid[rowIndex][colIndex] && styles.miniCellNumberPattern,
                  ]}>
                    {cell}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const FullTicketGrid = ({ pattern }) => {
    const ticketNumbers = useMemo(() => generateTicketForPattern(pattern), [pattern, generateTicketForPattern]);
    const patternGrid = useMemo(() => 
      isPositionBasedPattern(pattern) ? getPatternPositionsForTicket(ticketNumbers, pattern) : null, 
      [pattern, ticketNumbers]
    );
    
    return (
      <View style={styles.fullTicketContainer}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketTitle}>
            Pattern Visualization
          </Text>
        </View>
        
        <Text style={styles.ticketSubtitle}>
          Positions are highlighted relative to actual numbers in each row
        </Text>
        
        <View style={styles.fullTicket}>
          {ticketNumbers.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.fullRow}>
              {row.map((cell, colIndex) => (
                <View 
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.fullCell,
                    cell !== null && styles.fullCellWithNumber,
                    patternGrid && patternGrid[rowIndex] && patternGrid[rowIndex][colIndex] && styles.fullCellPattern,
                  ]}
                >
                  {cell !== null && (
                    <>
                      <Text style={[
                        styles.fullCellNumber,
                        patternGrid && patternGrid[rowIndex] && patternGrid[rowIndex][colIndex] && styles.fullCellNumberPattern,
                      ]}>
                        {cell}
                      </Text>
                      {patternGrid && patternGrid[rowIndex] && patternGrid[rowIndex][colIndex] && (
                        <View style={styles.positionIndicator}>
                          <Text style={styles.positionIndicatorText}>
                            {getPositionNumber(ticketNumbers[rowIndex], colIndex)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        
        <View style={styles.positionExplanation}>
          <Text style={styles.positionExplanationText}>
            Example: "Position 3" in Row 2 means the 3rd actual number from left in that row
          </Text>
        </View>
        
        <View style={styles.ticketLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendColorPattern]} />
            <Text style={styles.legendText}>Pattern Position</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendColorNormal]} />
            <Text style={styles.legendText}>Normal Number</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendColorEmpty]} />
            <Text style={styles.legendText}>Empty Cell</Text>
          </View>
        </View>
      </View>
    );
  };

  // Helper to get position number (1-5) for a column in a row
  const getPositionNumber = (row, column) => {
    let position = 0;
    for (let col = 0; col <= column; col++) {
      if (row[col] !== null) {
        position++;
      }
    }
    return position;
  };

  const getPatternIcon = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return 'grid-outline';
      case 'count_based':
        return 'stats-chart-outline';
      case 'all_numbers':
        return 'checkbox-outline';
      case 'row_complete':
        return 'reorder-three-outline';
      case 'number_based':
        return 'calculator-outline';
      case 'number_range':
        return 'funnel-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getPatternColor = (logicType) => {
    switch (logicType) {
      case 'position_based':
        return '#3498db';
      case 'count_based':
        return '#FF9800';
      case 'all_numbers':
        return '#4CAF50';
      case 'row_complete':
        return '#9C27B0';
      case 'number_based':
        return '#F44336';
      case 'number_range':
        return '#607D8B';
      default:
        return '#666';
    }
  };

  const formatPatternName = (name) => {
    if (!name) return 'Unknown Pattern';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatLogicType = (type) => {
    if (!type || type === 'unknown') return 'Pattern';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading patterns...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorTitle}>Patterns Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPatterns}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tambola Patterns</Text>
          <Text style={styles.headerSubtitle}>Explore all available patterns</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
        }
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            {filteredPatterns.length} {filteredPatterns.length === 1 ? 'pattern' : 'patterns'} found
          </Text>
          {selectedFilter !== 'all' && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setSelectedFilter('all')}
            >
              <Ionicons name="close-circle" size={16} color="#3498db" />
              <Text style={styles.clearButtonText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.patternsContainer}>
          {filteredPatterns.length > 0 ? (
            filteredPatterns.map(renderPatternCard)
          ) : patterns.length > 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color="#CCC" />
              <Text style={styles.emptyStateTitle}>No Patterns Found</Text>
              <Text style={styles.emptyStateText}>
                Try changing the filter
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={60} color="#CCC" />
              <Text style={styles.emptyStateTitle}>No Patterns Available</Text>
              <Text style={styles.emptyStateText}>
                Patterns will be available when games start
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {selectedPattern && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <View style={styles.modalTitleRow}>
                      <View style={[
                        styles.modalIcon,
                        { backgroundColor: getPatternColor(getPatternLogicType(selectedPattern)) + '20' }
                      ]}>
                        <Ionicons 
                          name={getPatternIcon(getPatternLogicType(selectedPattern))} 
                          size={24} 
                          color={getPatternColor(getPatternLogicType(selectedPattern))} 
                        />
                      </View>
                      <Text style={styles.modalTitle} numberOfLines={2}>
                        {selectedPattern.display_name || formatPatternName(selectedPattern.pattern_name)}
                      </Text>
                    </View>
                    <View style={styles.modalMetaRow}>
                      <View style={[
                        styles.modalTypeBadge,
                        { backgroundColor: getPatternColor(getPatternLogicType(selectedPattern)) + '20' }
                      ]}>
                        <Text style={[
                          styles.modalTypeText,
                          { color: getPatternColor(getPatternLogicType(selectedPattern)) }
                        ]}>
                          {formatLogicType(getPatternLogicType(selectedPattern))}
                        </Text>
                      </View>
                      {selectedPattern.popular_rank && (
                        <View style={styles.popularityBadge}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.popularityText}>
                            {selectedPattern.popular_rank}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
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
                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                      {selectedPattern.description}
                    </Text>
                  </View>

                  {selectedPattern.example && (
                    <View style={styles.exampleSection}>
                      <Text style={styles.sectionTitle}>Example</Text>
                      <Text style={styles.exampleText}>
                        {selectedPattern.example}
                      </Text>
                    </View>
                  )}

                  {selectedPattern.how_to_win && (
                    <View style={styles.winSection}>
                      <Text style={styles.sectionTitle}>How to Win</Text>
                      <Text style={styles.winText}>
                        {selectedPattern.how_to_win}
                      </Text>
                    </View>
                  )}

                  {isPositionBasedPattern(selectedPattern) && getPatternPositions(selectedPattern).length > 0 && (
                    <>
                      <View style={styles.positionsSection}>
                        <FullTicketGrid pattern={selectedPattern} />
                      </View>
                      
                      <View style={styles.positionsList}>
                        <Text style={styles.sectionTitle}>Pattern Positions</Text>
                        {getPatternPositions(selectedPattern).map((pos, index) => (
                          <View key={index} style={styles.positionItem}>
                            <View style={styles.positionBadge}>
                              <Text style={styles.positionBadgeText}>
                                {pos.row}-{pos.position}
                              </Text>
                            </View>
                            <Text style={styles.positionText}>
                              Row {pos.row}, Position {pos.position} (from left)
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {!isPositionBasedPattern(selectedPattern) && (
                    <View style={styles.infoCard}>
                      <View style={styles.infoHeader}>
                        <Ionicons name="information-circle" size={20} color="#3498db" />
                        <Text style={styles.infoTitle}>How it works</Text>
                      </View>
                      <Text style={styles.infoText}>
                        This pattern is based on {formatLogicType(getPatternLogicType(selectedPattern)).toLowerCase()} logic.
                        {getPatternLogicType(selectedPattern) === 'number_range' && selectedPattern.pattern_logic?.rules && (
                          <Text>
                            {' '}Numbers from {selectedPattern.pattern_logic.rules.min} to {selectedPattern.pattern_logic.rules.max}.
                          </Text>
                        )}
                        {getPatternLogicType(selectedPattern) === 'row_complete' && selectedPattern.pattern_logic?.rules && (
                          <Text>
                            {' '}Complete row {selectedPattern.pattern_logic.rules.row_number}.
                          </Text>
                        )}
                        {getPatternLogicType(selectedPattern) === 'count_based' && selectedPattern.pattern_logic?.rules && (
                          <Text>
                            {' '}First {selectedPattern.pattern_logic.rules.count} numbers.
                          </Text>
                        )}
                        {getPatternLogicType(selectedPattern) === 'all_numbers' && (
                          <Text> All 15 numbers on your ticket.</Text>
                        )}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.modalBottomSpace} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
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
  filtersContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  patternsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  patternCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedPatternCard: {
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#E6F0FF',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternIcon: {
    marginRight: 12,
  },
  patternInfo: {
    flex: 1,
  },
  patternNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  patternMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  positionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  positionsText: {
    fontSize: 10,
    color: '#666',
  },
  patternDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  miniTicketContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  miniTicket: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFF',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniRow: {
    flexDirection: 'row',
    marginBottom: 4,
    justifyContent: 'center',
  },
  miniCell: {
    width: 28,
    height: 28,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 6,
  },
  miniCellWithNumber: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  miniCellPattern: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  miniCellNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  miniCellNumberPattern: {
    color: '#2C3E50',
    fontWeight: '800',
  },
  positionExplanation: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  positionExplanationText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    minHeight: '50%',
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
  modalTitleContainer: {
    flex: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    flex: 1,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  popularityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  popularityText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 10,
  },
  modalBody: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  exampleSection: {
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  exampleText: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  winSection: {
    marginBottom: 20,
    backgroundColor: '#F0F9F0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  winText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    lineHeight: 20,
  },
  positionsSection: {
    marginBottom: 20,
  },
  fullTicketContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  ticketSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  fullTicket: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: TICKET_WIDTH,
    alignSelf: 'center',
  },
  fullRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fullCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  fullCellWithNumber: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fullCellPattern: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  fullCellNumber: {
    fontSize: CELL_SIZE * 0.3,
    fontWeight: '600',
    color: '#2C3E50',
  },
  fullCellNumberPattern: {
    color: '#2C3E50',
    fontWeight: '800',
  },
  positionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFD600',
    borderRadius: 6,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionIndicatorText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#333',
  },
  positionsList: {
    marginBottom: 20,
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  positionBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  positionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  ticketLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  legendColorPattern: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  legendColorNormal: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  legendColorEmpty: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E6F0FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
    gap: 12,
  },
  closeModalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalBottomSpace: {
    height: 20,
  },
});

export default UserGamePatterns;