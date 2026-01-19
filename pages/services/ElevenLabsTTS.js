import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ElevenLabsTTS {
  constructor() {
    // Use dynamic cache directory to avoid undefined issues
    this.getCacheDirectory();
    this.soundObject = new Audio.Sound();
    this.apiKey = null;
    this.useDeviceTTS = true; // Start with device TTS as default
  }

  async getCacheDirectory() {
    try {
      const FileSystem = require('expo-file-system/legacy');
      if (FileSystem && FileSystem.cacheDirectory) {
        this.cacheDirectory = `${FileSystem.cacheDirectory}elevenlabs/`;
        await this.initCache();
      } else {
        this.cacheDirectory = null;
        console.warn('FileSystem cacheDirectory not available, disabling caching');
      }
    } catch (error) {
      this.cacheDirectory = null;
      console.warn('FileSystem not available, disabling caching:', error);
    }
  }

  async initCache() {
    if (!this.cacheDirectory) return;

    try {
      const legacyFileSystem = require('expo-file-system/legacy');
      const dirInfo = await legacyFileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await legacyFileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing TTS cache:', error);
      this.cacheDirectory = null;
    }
  }

  async setApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      this.apiKey = null;
      this.useDeviceTTS = true;
      await AsyncStorage.removeItem('elevenlabs_api_key');
      return;
    }

    // Fix API key format if needed
    let formattedKey = apiKey.trim();
    if (formattedKey && !formattedKey.startsWith('sk-')) {
      formattedKey = formattedKey.replace('sk_', 'sk-');
    }
    
    this.apiKey = formattedKey;
    await AsyncStorage.setItem('elevenlabs_api_key', formattedKey);
    
    // Test the API key
    const isValid = await this.testApiKey(formattedKey);
    this.useDeviceTTS = !isValid;
    
    if (!isValid) {
      console.warn('Invalid API key, falling back to device TTS');
      this.apiKey = null;
      await AsyncStorage.removeItem('elevenlabs_api_key');
    }
  }

  async testApiKey(apiKey) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (response.status === 401) {
        console.error('API key test failed: Invalid key');
        return false;
      }

      if (!response.ok) {
        console.error('API key test failed:', response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API key test error:', error);
      return false;
    }
  }

  async getApiKey() {
    if (!this.apiKey) {
      this.apiKey = await AsyncStorage.getItem('elevenlabs_api_key');
      
      // If no API key or invalid, use device TTS
      if (!this.apiKey) {
        this.useDeviceTTS = true;
        return null;
      }
      
      // Fix format if needed
      if (this.apiKey && !this.apiKey.startsWith('sk-')) {
        this.apiKey = this.apiKey.replace('sk_', 'sk-');
      }
    }
    
    // Test the API key if we're not already using device TTS
    if (this.apiKey && !this.useDeviceTTS) {
      const isValid = await this.testApiKey(this.apiKey);
      if (!isValid) {
        this.useDeviceTTS = true;
        console.warn('Stored API key is invalid, falling back to device TTS');
        return null;
      }
    }
    
    return this.apiKey;
  }

  async speak(text, voiceId = 'default', voiceName = 'Default') {
    try {
      await this.stop();
      
      // If we're using device TTS or API key is invalid
      if (this.useDeviceTTS || !(await this.getApiKey())) {
        return await this.speakWithDeviceTTS(text);
      }
      
      // Try ElevenLabs TTS
      try {
        const audioUri = await this.getAudioForText(text, voiceId);
        
        if (!audioUri) {
          throw new Error('Failed to generate audio');
        }
        
        await this.soundObject.loadAsync({ uri: audioUri });
        await this.soundObject.playAsync();
        
        return true;
      } catch (error) {
        console.error('ElevenLabs TTS failed, falling back to device TTS:', error);
        this.useDeviceTTS = true;
        return await this.speakWithDeviceTTS(text);
      }
      
    } catch (error) {
      console.error('Error in TTS:', error);
      return await this.speakWithDeviceTTS(text);
    }
  }

  async speakWithDeviceTTS(text) {
    try {
      const Speech = require('expo-speech');
      
      // Stop any ongoing speech
      Speech.stop();
      
      // Speak using device TTS
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });
      
      return true;
    } catch (error) {
      console.error('Device TTS failed:', error);
      return false;
    }
  }

  async getAudioForText(text, voiceId) {
    // If no cache directory or using device TTS, generate directly or use device TTS
    if (!this.cacheDirectory || this.useDeviceTTS) {
      return await this.generateAudio(text, voiceId);
    }

    try {
      const cacheKey = this.generateCacheKey(text, voiceId);
      const cachePath = `${this.cacheDirectory}${cacheKey}.mp3`;
      
      // Check cache using legacy API
      const legacyFileSystem = require('expo-file-system/legacy');
      const fileInfo = await legacyFileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        return cachePath;
      }
      
      const audioData = await this.generateAudio(text, voiceId);
      if (!audioData) {
        return null;
      }
      
      await legacyFileSystem.writeAsStringAsync(cachePath, audioData, {
        encoding: legacyFileSystem.EncodingType.Base64,
      });
      
      return cachePath;
    } catch (error) {
      console.error('Error getting audio:', error);
      return null;
    }
  }

  async generateAudio(text, voiceId) {
    // If using device TTS, return null to trigger device TTS fallback
    if (this.useDeviceTTS) {
      return null;
    }

    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        throw new Error('No valid API key available');
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (response.status === 401) {
        this.useDeviceTTS = true;
        await AsyncStorage.removeItem('elevenlabs_api_key');
        throw new Error('Invalid API key');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64String = this.arrayBufferToBase64(arrayBuffer);
      return base64String;
      
    } catch (error) {
      console.error('Error generating audio:', error);
      this.useDeviceTTS = true;
      throw error;
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  generateCacheKey(text, voiceId) {
    const str = `${text}_${voiceId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  async stop() {
    try {
      await this.soundObject.stopAsync();
      await this.soundObject.unloadAsync();
      
      // Also stop device TTS if it's running
      try {
        const Speech = require('expo-speech');
        Speech.stop();
      } catch (error) {
        // Ignore if Speech not available
      }
    } catch (error) {
      // Ignore errors
    }
  }

  async clearCache() {
    if (!this.cacheDirectory) return;

    try {
      const legacyFileSystem = require('expo-file-system/legacy');
      await legacyFileSystem.deleteAsync(this.cacheDirectory);
      await this.initCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getAvailableVoices() {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey || this.useDeviceTTS) {
        return this.getDefaultVoices();
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (response.status === 401) {
        this.useDeviceTTS = true;
        return this.getDefaultVoices();
      }

      if (!response.ok) {
        console.error('Failed to fetch voices:', response.status);
        return this.getDefaultVoices();
      }

      const data = await response.json();
      return data.voices || this.getDefaultVoices();
    } catch (error) {
      console.error('Error fetching voices:', error);
      return this.getDefaultVoices();
    }
  }

  getDefaultVoices() {
    return [
      {
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam (Device Fallback)',
        category: 'premade',
        labels: { gender: 'male', accent: 'American' }
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Rachel (Device Fallback)',
        category: 'premade',
        labels: { gender: 'female', accent: 'American' }
      }
    ];
  }

  isUsingDeviceTTS() {
    return this.useDeviceTTS;
  }

  async clearApiKey() {
    this.apiKey = null;
    this.useDeviceTTS = true;
    await AsyncStorage.removeItem('elevenlabs_api_key');
  }
}

// Create and export a singleton instance
const ttsService = new ElevenLabsTTS();

export default ttsService;