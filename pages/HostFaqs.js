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
  TextInput,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HostFaqs = () => {
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [helpLinks, setHelpLinks] = useState([]);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState([]);

  useEffect(() => {
    fetchFaqs();
    fetchHelpLinks();
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [faqs, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFaqs(), fetchHelpLinks()]);
    setRefreshing(false);
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('hostToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        'https://exilance.com/tambolatimez/public/api/host/faqs',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data.status) {
        const faqsData = response.data.data || [];
        setFaqs(faqsData);
        setError(null);
      } else {
        throw new Error('Failed to fetch FAQs');
      }
    } catch (error) {
      console.log('Error fetching FAQs:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpLinks = async () => {
    try {
      setLinksLoading(true);
      const token = await AsyncStorage.getItem('hostToken');
      
      if (!token) {
        console.log('No token for help links');
        return;
      }

      const response = await axios.get(
        'https://exilance.com/tambolatimez/public/api/host/help-links',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data.status) {
        const linksData = response.data.data || [];
        setHelpLinks(linksData);
      } else {
        console.log('Failed to fetch help links:', response.data.message);
      }
    } catch (error) {
      console.log('Error fetching help links:', error);
      // Don't set error state for help links - they're optional
    } finally {
      setLinksLoading(false);
    }
  };

  const filterFaqs = () => {
    let filtered = [...faqs];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredFaqs(filtered);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const openYouTubeLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error opening YouTube link:', error);
      try {
        await Linking.openURL(url);
      } catch (e) {
        console.log('Failed to open link:', e);
      }
    }
  };

  const renderHelpLinks = () => {
    if (linksLoading) {
      return (
        <View style={styles.helpLinksContainer}>
          <ActivityIndicator size="small" color="#3498db" />
        </View>
      );
    }

    if (helpLinks.length === 0) return null;

    return (
      <View style={styles.helpLinksContainer}>
        <View style={styles.helpLinksHeader}>
          <Ionicons name="videocam" size={22} color="#3498db" />
          <Text style={styles.helpLinksTitle}>Helpful Videos</Text>
        </View>
        <Text style={styles.helpLinksSubtitle}>
          Watch tutorials to learn how to host Tambola games
        </Text>
        
        <View style={styles.linksList}>
          {helpLinks.map((link, index) => (
            <TouchableOpacity
              key={link.key || index}
              style={styles.linkItem}
              onPress={() => openYouTubeLink(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIconContainer}>
                <Ionicons name="play-circle" size={20} color="#3498db" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle} numberOfLines={2}>
                  {link.title}
                </Text>
                <Text style={styles.linkDescription} numberOfLines={1}>
                  {link.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFaqItem = (faq) => {
    const isExpanded = expandedId === faq.id;
    
    return (
      <View key={faq.id} style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqQuestionContainer}
          onPress={() => toggleExpand(faq.id)}
          activeOpacity={0.7}
        >
          <View style={styles.questionContent}>
            <View style={styles.questionIcon}>
              <Ionicons name="help-circle-outline" size={20} color="#3498db" />
            </View>
            <View style={styles.questionTextContainer}>
              <Text style={styles.faqQuestion} numberOfLines={isExpanded ? 10 : 2}>
                {faq.question}
              </Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswerContainer}>
            <View style={styles.answerIcon}>
              <Ionicons name="information-circle" size={16} color="#4CAF50" />
            </View>
            <View style={styles.answerContent}>
              <Text style={styles.faqAnswer}>
                {faq.answer}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading FAQs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorTitle}>FAQ Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFaqs}>
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
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search FAQs..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Help Links Section */}
        {renderHelpLinks()}

        {/* FAQ Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'FAQ' : 'FAQs'} found
          </Text>
          {filteredFaqs.length === 0 && faqs.length > 0 && (
            <Text style={styles.noResultsText}>
              No FAQs found for "{searchQuery}"
            </Text>
          )}
        </View>

        {/* FAQ List */}
        <View style={styles.faqsContainer}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map(renderFaqItem)
          ) : faqs.length > 0 ? (
            <View style={styles.emptySearchState}>
              <Ionicons name="search" size={60} color="#CCC" />
              <Text style={styles.emptySearchTitle}>No Results Found</Text>
              <Text style={styles.emptySearchText}>
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={60} color="#CCC" />
              <Text style={styles.emptyStateTitle}>No FAQs Available</Text>
              <Text style={styles.emptyStateText}>
                FAQs will be available soon. Check back later.
              </Text>
            </View>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <Ionicons name="headset" size={24} color="#3498db" />
            <Text style={styles.supportTitle}>Need More Help?</Text>
          </View>
          <Text style={styles.supportText}>
            If you couldn't find the answer to your question, our support team is ready to assist you.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color="#FF9800" />
            <Text style={styles.tipsTitle}>Helpful Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Watch tutorial videos to learn hosting basics
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Click on any question to expand and view the answer
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Contact support if your question isn't answered here
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 30,
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
    marginBottom: 20,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  helpLinksContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  helpLinksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpLinksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  helpLinksSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  linksList: {
    gap: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  linkDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
  },
  faqsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  questionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  questionTextContainer: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  faqAnswerContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  answerIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  answerContent: {
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptySearchState: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  supportCard: {
    backgroundColor: '#E6F0FF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    marginBottom: 16,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 20,
  },
});

export default HostFaqs;