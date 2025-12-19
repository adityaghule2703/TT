import React, { useState, useEffect } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const TICKET_WIDTH = Math.min(width, height) - 100; // Make it responsive
const CELL_SIZE = (TICKET_WIDTH - 60) / 9; // Adjusted for modal

const HostGamePatterns = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredPatterns, setFilteredPatterns] = useState([]);
  const [ticketCache, setTicketCache] = useState({}); // Cache tickets for each pattern

  const filters = [
    { id: 'all', label: 'All Patterns' },
    { id: 'position_based', label: 'Position Based' },
    { id: 'count_based', label: 'Count Based' },
    { id: 'all_numbers', label: 'All Numbers' },
    { id: 'row_complete', label: 'Row Complete' },
    { id: 'number_based', label: 'Number Based' },
    { id: 'number_range', label: 'Number Range' },
  ];

  useEffect(() => {
    fetchPatterns();
  }, []);

  useEffect(() => {
    filterPatterns();
  }, [patterns, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatterns();
    setRefreshing(false);
  };

  const fetchPatterns = async () => {
    try {
      setLoading(true);
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
        setPatterns(patternsData);
        setError(null);
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

  const filterPatterns = () => {
    let filtered = [...patterns];
    
    // Filter by category
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(pattern => pattern.logic_type === selectedFilter);
    }
    
    setFilteredPatterns(filtered);
  };

  // Generate valid tambola ticket with exactly 5 numbers per row
  const generateValidTicketNumbers = () => {
    const ticket = Array(3).fill().map(() => Array(9).fill(null));
    const numbersUsed = new Set();
    
    // First, ensure each column has valid numbers (1-3 numbers per column)
    const columnNumbers = [];
    
    for (let col = 0; col < 9; col++) {
      columnNumbers[col] = [];
      const min = col === 0 ? 1 : col * 10 + 1;
      const max = col === 8 ? 90 : (col + 1) * 10;
      
      // Determine how many numbers this column should have (1-3)
      const numbersInColumn = Math.floor(Math.random() * 3) + 1;
      
      while (columnNumbers[col].length < numbersInColumn) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!numbersUsed.has(num)) {
          columnNumbers[col].push(num);
          numbersUsed.add(num);
        }
      }
      
      columnNumbers[col].sort((a, b) => a - b);
    }
    
    // Calculate total numbers and adjust to ensure exactly 15 numbers
    let totalNumbers = columnNumbers.reduce((sum, col) => sum + col.length, 0);
    
    // Ensure exactly 15 numbers total
    if (totalNumbers < 15) {
      // Add more numbers to reach 15
      for (let col = 0; col < 9 && totalNumbers < 15; col++) {
        const min = col === 0 ? 1 : col * 10 + 1;
        const max = col === 8 ? 90 : (col + 1) * 10;
        
        while (columnNumbers[col].length < 3 && totalNumbers < 15) {
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!numbersUsed.has(num)) {
            columnNumbers[col].push(num);
            numbersUsed.add(num);
            totalNumbers++;
            columnNumbers[col].sort((a, b) => a - b);
          }
        }
      }
    } else if (totalNumbers > 15) {
      // Remove numbers to reach 15
      for (let col = 8; col >= 0 && totalNumbers > 15; col--) {
        while (columnNumbers[col].length > 1 && totalNumbers > 15) {
          const removed = columnNumbers[col].pop();
          numbersUsed.delete(removed);
          totalNumbers--;
        }
      }
    }
    
    // Distribute numbers to ensure exactly 5 numbers per row
    const rowCounts = [0, 0, 0];
    
    // First pass: Try to distribute numbers evenly
    for (let col = 0; col < 9; col++) {
      for (let numIndex = 0; numIndex < columnNumbers[col].length; numIndex++) {
        // Find row with fewest numbers that doesn't have this column filled yet
        let minRow = -1;
        let minCount = Infinity;
        
        for (let row = 0; row < 3; row++) {
          if (ticket[row][col] === null && rowCounts[row] < minCount && rowCounts[row] < 5) {
            minCount = rowCounts[row];
            minRow = row;
          }
        }
        
        if (minRow !== -1) {
          ticket[minRow][col] = columnNumbers[col][numIndex];
          rowCounts[minRow]++;
        } else {
          // Fallback: find any available spot
          for (let row = 0; row < 3; row++) {
            if (ticket[row][col] === null && rowCounts[row] < 5) {
              ticket[row][col] = columnNumbers[col][numIndex];
              rowCounts[row]++;
              break;
            }
          }
        }
      }
    }
    
    // Second pass: Ensure exactly 5 numbers per row
    for (let row = 0; row < 3; row++) {
      while (rowCounts[row] < 5) {
        // Find a column that has less than 3 numbers and this row is empty
        for (let col = 0; col < 9 && rowCounts[row] < 5; col++) {
          if (ticket[row][col] === null) {
            const columnCount = ticket.reduce((sum, r) => sum + (r[col] !== null ? 1 : 0), 0);
            if (columnCount < 3) {
              // Add a new number to this column
              const min = col === 0 ? 1 : col * 10 + 1;
              const max = col === 8 ? 90 : (col + 1) * 10;
              let newNum;
              do {
                newNum = Math.floor(Math.random() * (max - min + 1)) + min;
              } while (numbersUsed.has(newNum));
              
              ticket[row][col] = newNum;
              numbersUsed.add(newNum);
              rowCounts[row]++;
            }
          }
        }
      }
      
      while (rowCounts[row] > 5) {
        // Find a number to move to another row
        for (let col = 0; col < 9 && rowCounts[row] > 5; col++) {
          if (ticket[row][col] !== null) {
            // Check if another row needs this spot
            for (let otherRow = 0; otherRow < 3; otherRow++) {
              if (otherRow !== row && rowCounts[otherRow] < 5 && ticket[otherRow][col] === null) {
                ticket[otherRow][col] = ticket[row][col];
                ticket[row][col] = null;
                rowCounts[row]--;
                rowCounts[otherRow]++;
                break;
              }
            }
          }
        }
      }
    }
    
    return ticket;
  };

  // Generate ticket for a specific pattern, ensuring pattern positions have numbers
  const generateTicketForPattern = (pattern) => {
    const cacheKey = pattern.id;
    
    // Return cached ticket if available
    if (ticketCache[cacheKey]) {
      return ticketCache[cacheKey];
    }
    
    let ticket;
    let isValid = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    // Keep generating until we get a valid ticket with numbers at pattern positions
    while (!isValid && attempts < maxAttempts) {
      ticket = generateValidTicketNumbers();
      isValid = true;
      
      // For position-based patterns, check if pattern positions have numbers
      if (pattern.logic_type === 'position_based' && pattern.positions) {
        for (const pos of pattern.positions) {
          const row = pos.row - 1;
          const col = pos.position - 1;
          if (row >= 0 && row < 3 && col >= 0 && col < 9) {
            if (ticket[row][col] === null) {
              isValid = false;
              break;
            }
          }
        }
      }
      attempts++;
    }
    
    // If we couldn't generate a valid ticket after max attempts, just use what we have
    if (!isValid && ticket) {
      console.warn('Could not generate perfect ticket for pattern after', maxAttempts, 'attempts');
    }
    
    // Cache the ticket
    setTicketCache(prev => ({
      ...prev,
      [cacheKey]: ticket
    }));
    
    return ticket;
  };

  // Get pattern grid positions
  const getPatternGrid = (positions) => {
    const grid = Array(3).fill().map(() => Array(9).fill(false));
    
    positions.forEach(pos => {
      const row = pos.row - 1;
      const col = pos.position - 1;
      if (row >= 0 && row < 3 && col >= 0 && col < 9) {
        grid[row][col] = true;
      }
    });
    
    return grid;
  };

  const renderPatternCard = (pattern) => {
    const isPositionBased = pattern.logic_type === 'position_based';
    const ticketNumbers = generateTicketForPattern(pattern);
    const patternGrid = isPositionBased && pattern.positions ? getPatternGrid(pattern.positions) : null;
    
    return (
      <TouchableOpacity
        key={pattern.id}
        style={styles.patternCard}
        onPress={() => {
          setSelectedPattern(pattern);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.patternHeader}>
          <View style={styles.patternIcon}>
            <Ionicons 
              name={getPatternIcon(pattern.logic_type)} 
              size={24} 
              color="#3498db" 
            />
          </View>
          <View style={styles.patternInfo}>
            <Text style={styles.patternName} numberOfLines={1}>
              {formatPatternName(pattern.pattern_name)}
            </Text>
            <View style={styles.patternMeta}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getPatternColor(pattern.logic_type) + '20' }
              ]}>
                <Text style={[
                  styles.typeText,
                  { color: getPatternColor(pattern.logic_type) }
                ]}>
                  {formatLogicType(pattern.logic_type)}
                </Text>
              </View>
              {isPositionBased && pattern.positions?.length > 0 && (
                <View style={styles.positionsBadge}>
                  <Ionicons name="grid" size={12} color="#666" />
                  <Text style={styles.positionsText}>
                    {pattern.positions.length} positions
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
        
        {isPositionBased && pattern.positions?.length > 0 && (
          <View style={styles.miniTicketContainer}>
            <MiniTicketGrid 
              numbers={ticketNumbers} 
              patternGrid={patternGrid} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const MiniTicketGrid = ({ numbers, patternGrid }) => {
    return (
      <View style={styles.miniTicket}>
        {numbers.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.miniRow}>
            {row.map((cell, colIndex) => (
              <View 
                key={`cell-${rowIndex}-${colIndex}`}
                style={[
                  styles.miniCell,
                  cell !== null && styles.miniCellWithNumber,
                  patternGrid && patternGrid[rowIndex][colIndex] && styles.miniCellPattern
                ]}
              >
                {cell !== null && (
                  <Text style={[
                    styles.miniCellNumber,
                    patternGrid && patternGrid[rowIndex][colIndex] && styles.miniCellNumberPattern
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
    const ticketNumbers = generateTicketForPattern(pattern);
    const patternGrid = pattern.positions ? getPatternGrid(pattern.positions) : null;
    
    return (
      <View style={styles.fullTicketContainer}>
        <Text style={styles.ticketTitle}>Pattern Visualization</Text>
        <Text style={styles.ticketSubtitle}>
          Pattern positions are highlighted in yellow
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
                    patternGrid && patternGrid[rowIndex][colIndex] && styles.fullCellPattern
                  ]}
                >
                  {cell !== null && (
                    <Text style={[
                      styles.fullCellNumber,
                      patternGrid && patternGrid[rowIndex][colIndex] && styles.fullCellNumberPattern
                    ]}>
                      {cell}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
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
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatLogicType = (type) => {
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tambola Patterns</Text>
        <Text style={styles.headerSubtitle}>Explore available patterns for your games</Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
        }
      >
        {/* Filter Tabs */}
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

        {/* Results Info */}
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

        {/* Patterns List */}
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
                Patterns will be available soon
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Pattern Detail Modal */}
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
                        { backgroundColor: getPatternColor(selectedPattern.logic_type) + '20' }
                      ]}>
                        <Ionicons 
                          name={getPatternIcon(selectedPattern.logic_type)} 
                          size={24} 
                          color={getPatternColor(selectedPattern.logic_type)} 
                        />
                      </View>
                      <Text style={styles.modalTitle} numberOfLines={2}>
                        {formatPatternName(selectedPattern.pattern_name)}
                      </Text>
                    </View>
                    <View style={[
                      styles.modalTypeBadge,
                      { backgroundColor: getPatternColor(selectedPattern.logic_type) + '20' }
                    ]}>
                      <Text style={[
                        styles.modalTypeText,
                        { color: getPatternColor(selectedPattern.logic_type) }
                      ]}>
                        {formatLogicType(selectedPattern.logic_type)}
                      </Text>
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

                  {selectedPattern.logic_type === 'position_based' && selectedPattern.positions?.length > 0 && (
                    <View style={styles.positionsSection}>
                      <FullTicketGrid pattern={selectedPattern} />
                    </View>
                  )}

                  {selectedPattern.logic_type !== 'position_based' && (
                    <View style={styles.infoCard}>
                      <View style={styles.infoHeader}>
                        <Ionicons name="information-circle" size={20} color="#3498db" />
                        <Text style={styles.infoTitle}>How it works</Text>
                      </View>
                      <Text style={styles.infoText}>
                        This pattern is based on {selectedPattern.logic_type.replace('_', ' ')} logic.
                        Players win when they match the specified criteria.
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.modalBottomSpace} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.usePatternButton}
                    onPress={() => {
                      setModalVisible(false);
                      // Add your pattern selection logic here
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.usePatternButtonText}>Use This Pattern</Text>
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
  patternName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
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
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  ticketSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
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
    width: TICKET_WIDTH, // Use the responsive width
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
    fontSize: CELL_SIZE * 0.4, // Responsive font size
    fontWeight: '600',
    color: '#2C3E50',
  },
  fullCellNumberPattern: {
    color: '#2C3E50',
    fontWeight: '800',
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
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  usePatternButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  usePatternButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBottomSpace: {
    height: 20,
  },
});

export default HostGamePatterns;