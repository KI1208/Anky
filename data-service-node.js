/**
 * DataService for Flashcard App (Node.js version)
 * 
 * This service provides localStorage-based persistence for flashcards and decks.
 * It handles JSON serialization/deserialization and error handling for localStorage operations.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

const { Flashcard, Deck } = require('./models-node.js');

// Mock localStorage for Node.js environment
class MockLocalStorage {
    constructor() {
        this.data = {};
    }

    getItem(key) {
        return this.data[key] || null;
    }

    setItem(key, value) {
        this.data[key] = value;
    }

    removeItem(key) {
        delete this.data[key];
    }

    clear() {
        this.data = {};
    }
}

// Use mock localStorage in Node.js environment
const localStorage = new MockLocalStorage();

/**
 * DataService class for managing localStorage operations
 * Provides save/load operations for flashcards and decks with error handling
 */
class DataService {
    constructor() {
        // Storage keys for localStorage
        this.FLASHCARDS_KEY = 'flashcards';
        this.DECKS_KEY = 'decks';
        this.METADATA_KEY = 'app_metadata';
        
        // Initialize storage if needed
        this.initializeStorage();
    }

    /**
     * Initialize localStorage with empty data structures if they don't exist
     * @private
     */
    initializeStorage() {
        try {
            if (!this.isStorageAvailable()) {
                console.warn('localStorage is not available. Data will not persist.');
                return;
            }

            // Initialize flashcards if not present
            if (!localStorage.getItem(this.FLASHCARDS_KEY)) {
                localStorage.setItem(this.FLASHCARDS_KEY, JSON.stringify([]));
            }

            // Initialize decks if not present
            if (!localStorage.getItem(this.DECKS_KEY)) {
                localStorage.setItem(this.DECKS_KEY, JSON.stringify([]));
            }

            // Initialize metadata if not present
            if (!localStorage.getItem(this.METADATA_KEY)) {
                const metadata = {
                    version: '1.0.0',
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} True if localStorage is available
     * @private
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Update metadata with current timestamp
     * @private
     */
    updateMetadata() {
        try {
            if (!this.isStorageAvailable()) return;
            
            const metadata = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
            console.error('Failed to update metadata:', error);
        }
    }

    // ==================== FLASHCARD OPERATIONS ====================

    /**
     * Save a flashcard to localStorage
     * @param {Flashcard} flashcard - The flashcard to save
     * @throws {Error} If save operation fails
     */
    saveFlashcard(flashcard) {
        try {
            if (!this.isStorageAvailable()) {
                throw new Error('Storage is not available');
            }

            const flashcards = this.loadAllFlashcards();
            const existingIndex = flashcards.findIndex(f => f.id === flashcard.id);
            
            const flashcardData = flashcard.toJSON();
            
            if (existingIndex >= 0) {
                // Update existing flashcard
                flashcards[existingIndex] = flashcardData;
            } else {
                // Add new flashcard
                flashcards.push(flashcardData);
            }

            localStorage.setItem(this.FLASHCARDS_KEY, JSON.stringify(flashcards));
            this.updateMetadata();
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some data to continue.');
            }
            throw new Error(`Failed to save flashcard: ${error.message}`);
        }
    }

    /**
     * Load a specific flashcard by ID
     * @param {string} id - The flashcard ID
     * @returns {Flashcard|null} The flashcard or null if not found
     */
    loadFlashcard(id) {
        try {
            if (!this.isStorageAvailable()) {
                return null;
            }

            const flashcards = this.loadAllFlashcards();
            const flashcardData = flashcards.find(f => f.id === id);
            
            return flashcardData ? Flashcard.fromJSON(flashcardData) : null;
        } catch (error) {
            console.error(`Failed to load flashcard ${id}:`, error);
            return null;
        }
    }

    /**
     * Load all flashcards from localStorage
     * @returns {Object[]} Array of flashcard data objects
     * @private
     */
    loadAllFlashcards() {
        try {
            if (!this.isStorageAvailable()) {
                return [];
            }

            const data = localStorage.getItem(this.FLASHCARDS_KEY);
            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to load flashcards, returning empty array:', error);
            return [];
        }
    }

    /**
     * Delete a flashcard by ID
     * @param {string} id - The flashcard ID to delete
     * @throws {Error} If delete operation fails
     */
    deleteFlashcard(id) {
        try {
            if (!this.isStorageAvailable()) {
                throw new Error('Storage is not available');
            }

            const flashcards = this.loadAllFlashcards();
            const filteredFlashcards = flashcards.filter(f => f.id !== id);
            
            localStorage.setItem(this.FLASHCARDS_KEY, JSON.stringify(filteredFlashcards));
            this.updateMetadata();
        } catch (error) {
            throw new Error(`Failed to delete flashcard: ${error.message}`);
        }
    }

    /**
     * Load flashcards for a specific deck
     * @param {string} deckId - The deck ID
     * @returns {Flashcard[]} Array of Flashcard instances
     */
    loadFlashcardsForDeck(deckId) {
        try {
            const flashcards = this.loadAllFlashcards();
            const deckFlashcards = flashcards
                .filter(f => f.deckId === deckId)
                .map(f => Flashcard.fromJSON(f));
            
            return deckFlashcards;
        } catch (error) {
            console.error(`Failed to load flashcards for deck ${deckId}:`, error);
            return [];
        }
    }

    // ==================== DECK OPERATIONS ====================

    /**
     * Save a deck to localStorage
     * @param {Deck} deck - The deck to save
     * @throws {Error} If save operation fails
     */
    saveDeck(deck) {
        try {
            if (!this.isStorageAvailable()) {
                throw new Error('Storage is not available');
            }

            const decks = this.loadAllDecksData();
            const existingIndex = decks.findIndex(d => d.id === deck.id);
            
            const deckData = deck.toJSON();
            
            if (existingIndex >= 0) {
                // Update existing deck
                decks[existingIndex] = deckData;
            } else {
                // Add new deck
                decks.push(deckData);
            }

            localStorage.setItem(this.DECKS_KEY, JSON.stringify(decks));
            this.updateMetadata();
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some data to continue.');
            }
            throw new Error(`Failed to save deck: ${error.message}`);
        }
    }

    /**
     * Load a specific deck by ID
     * @param {string} id - The deck ID
     * @returns {Deck|null} The deck or null if not found
     */
    loadDeck(id) {
        try {
            if (!this.isStorageAvailable()) {
                return null;
            }

            const decks = this.loadAllDecksData();
            const deckData = decks.find(d => d.id === id);
            
            return deckData ? Deck.fromJSON(deckData) : null;
        } catch (error) {
            console.error(`Failed to load deck ${id}:`, error);
            return null;
        }
    }

    /**
     * Load all decks as Deck instances
     * @returns {Deck[]} Array of Deck instances
     */
    loadAllDecks() {
        try {
            const decksData = this.loadAllDecksData();
            return decksData.map(d => Deck.fromJSON(d));
        } catch (error) {
            console.error('Failed to load decks:', error);
            return [];
        }
    }

    /**
     * Load all decks data from localStorage
     * @returns {Object[]} Array of deck data objects
     * @private
     */
    loadAllDecksData() {
        try {
            if (!this.isStorageAvailable()) {
                return [];
            }

            const data = localStorage.getItem(this.DECKS_KEY);
            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to load decks data, returning empty array:', error);
            return [];
        }
    }

    /**
     * Delete a deck by ID
     * @param {string} id - The deck ID to delete
     * @throws {Error} If delete operation fails
     */
    deleteDeck(id) {
        try {
            if (!this.isStorageAvailable()) {
                throw new Error('Storage is not available');
            }

            const decks = this.loadAllDecksData();
            const filteredDecks = decks.filter(d => d.id !== id);
            
            localStorage.setItem(this.DECKS_KEY, JSON.stringify(filteredDecks));
            this.updateMetadata();
        } catch (error) {
            throw new Error(`Failed to delete deck: ${error.message}`);
        }
    }

    // ==================== UTILITY OPERATIONS ====================

    /**
     * Clear all data from localStorage
     * @throws {Error} If clear operation fails
     */
    clearAllData() {
        try {
            if (!this.isStorageAvailable()) {
                throw new Error('Storage is not available');
            }

            localStorage.removeItem(this.FLASHCARDS_KEY);
            localStorage.removeItem(this.DECKS_KEY);
            localStorage.removeItem(this.METADATA_KEY);
            
            // Reinitialize with empty data
            this.initializeStorage();
        } catch (error) {
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    }

    /**
     * Get storage metadata
     * @returns {Object|null} Metadata object or null if not available
     */
    getMetadata() {
        try {
            if (!this.isStorageAvailable()) {
                return null;
            }

            const data = localStorage.getItem(this.METADATA_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load metadata:', error);
            return null;
        }
    }

    /**
     * Check if storage is available and functional
     * @returns {boolean} True if storage is working
     */
    isAvailable() {
        return this.isStorageAvailable();
    }
}

module.exports = { DataService };