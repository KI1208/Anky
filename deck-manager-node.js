/**
 * DeckManager for Flashcard App (Node.js version)
 * 
 * This class provides high-level CRUD operations for decks.
 * It integrates with DataService for persistence and ValidationService for validation.
 * Also handles flashcard-deck association management.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

const { DataService } = require('./data-service-node.js');
const { ValidationService } = require('./validation-node.js');
const { Deck, Flashcard } = require('./models-node.js');

/**
 * DeckManager class that handles deck operations
 * Provides create, read, update, delete operations with validation and
 * flashcard-deck association management
 */
class DeckManager {
    /**
     * Create a new DeckManager instance
     * @param {DataService} dataService - The data service for persistence
     * @param {ValidationService} validationService - The validation service
     */
    constructor(dataService, validationService = ValidationService) {
        this.dataService = dataService;
        this.validationService = validationService;
    }

    /**
     * Create a new deck
     * @param {Object} deckData - The deck data
     * @param {string} deckData.name - The deck name
     * @param {string} [deckData.description] - Optional deck description
     * @returns {Promise<{success: boolean, deck?: Deck, errors?: string[]}>} Result object
     */
    async createDeck(deckData) {
        try {
            // Load existing decks for validation
            const existingDecks = this.dataService.loadAllDecks();
            
            // Validate the deck data
            const validation = this.validationService.validateDeck(deckData, existingDecks);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Create new deck instance
            const deck = new Deck({
                name: deckData.name.trim(),
                description: deckData.description ? deckData.description.trim() : ''
            });

            // Save the deck
            this.dataService.saveDeck(deck);

            return {
                success: true,
                deck: deck
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to create deck: ${error.message}`]
            };
        }
    }

    /**
     * Get a deck by ID
     * @param {string} deckId - The deck ID
     * @returns {Deck|null} The deck or null if not found
     */
    getDeck(deckId) {
        try {
            return this.dataService.loadDeck(deckId);
        } catch (error) {
            console.error(`Failed to get deck ${deckId}:`, error);
            return null;
        }
    }

    /**
     * Get all decks
     * @returns {Deck[]} Array of all decks
     */
    getAllDecks() {
        try {
            return this.dataService.loadAllDecks();
        } catch (error) {
            console.error('Failed to get all decks:', error);
            return [];
        }
    }

    /**
     * Update an existing deck
     * @param {string} deckId - The deck ID to update
     * @param {Object} updates - The updates to apply
     * @param {string} [updates.name] - New deck name
     * @param {string} [updates.description] - New deck description
     * @returns {Promise<{success: boolean, deck?: Deck, errors?: string[]}>} Result object
     */
    async updateDeck(deckId, updates) {
        try {
            // Load the existing deck
            const existingDeck = this.dataService.loadDeck(deckId);
            if (!existingDeck) {
                return {
                    success: false,
                    errors: ['Deck not found']
                };
            }

            // Create updated deck data for validation
            const updatedData = {
                id: deckId,
                name: updates.name !== undefined ? updates.name : existingDeck.name,
                description: updates.description !== undefined ? updates.description : existingDeck.description
            };

            // Load existing decks for validation
            const existingDecks = this.dataService.loadAllDecks();
            
            // Validate the updated data
            const validation = this.validationService.validateDeck(updatedData, existingDecks);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Apply updates to the deck
            const updateObject = {};
            if (updates.name !== undefined) {
                updateObject.name = updates.name.trim();
            }
            if (updates.description !== undefined) {
                updateObject.description = updates.description.trim();
            }

            existingDeck.update(updateObject);

            // Save the updated deck
            this.dataService.saveDeck(existingDeck);

            return {
                success: true,
                deck: existingDeck
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to update deck: ${error.message}`]
            };
        }
    }

    /**
     * Delete a deck and optionally handle associated flashcards
     * @param {string} deckId - The deck ID to delete
     * @param {boolean} [deleteFlashcards=false] - Whether to delete associated flashcards
     * @returns {Promise<{success: boolean, deletedFlashcards?: number, errors?: string[]}>} Result object
     */
    async deleteDeck(deckId, deleteFlashcards = false) {
        try {
            // Check if deck exists
            const deck = this.dataService.loadDeck(deckId);
            if (!deck) {
                return {
                    success: false,
                    errors: ['Deck not found']
                };
            }

            let deletedFlashcards = 0;

            // Handle associated flashcards
            if (deleteFlashcards) {
                // Delete all flashcards in this deck
                const flashcards = this.dataService.loadFlashcardsForDeck(deckId);
                for (const flashcard of flashcards) {
                    this.dataService.deleteFlashcard(flashcard.id);
                    deletedFlashcards++;
                }
            } else {
                // Check if deck has flashcards and warn user
                const flashcards = this.dataService.loadFlashcardsForDeck(deckId);
                if (flashcards.length > 0) {
                    return {
                        success: false,
                        errors: [`Cannot delete deck: it contains ${flashcards.length} flashcard(s). Delete flashcards first or use deleteFlashcards option.`]
                    };
                }
            }

            // Delete the deck
            this.dataService.deleteDeck(deckId);

            return {
                success: true,
                deletedFlashcards: deletedFlashcards
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to delete deck: ${error.message}`]
            };
        }
    }

    /**
     * Add a flashcard to a deck
     * @param {string} deckId - The deck ID
     * @param {string} flashcardId - The flashcard ID
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async addFlashcardToDeck(deckId, flashcardId) {
        try {
            // Load the deck
            const deck = this.dataService.loadDeck(deckId);
            if (!deck) {
                return {
                    success: false,
                    errors: ['Deck not found']
                };
            }

            // Load the flashcard to verify it exists
            const flashcard = this.dataService.loadFlashcard(flashcardId);
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['Flashcard not found']
                };
            }

            // Add flashcard to deck
            deck.addFlashcard(flashcardId);

            // Update flashcard's deckId
            flashcard.update({ deckId: deckId });

            // Save both deck and flashcard
            this.dataService.saveDeck(deck);
            this.dataService.saveFlashcard(flashcard);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to add flashcard to deck: ${error.message}`]
            };
        }
    }

    /**
     * Remove a flashcard from a deck
     * @param {string} deckId - The deck ID
     * @param {string} flashcardId - The flashcard ID
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async removeFlashcardFromDeck(deckId, flashcardId) {
        try {
            // Load the deck
            const deck = this.dataService.loadDeck(deckId);
            if (!deck) {
                return {
                    success: false,
                    errors: ['Deck not found']
                };
            }

            // Load the flashcard
            const flashcard = this.dataService.loadFlashcard(flashcardId);
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['Flashcard not found']
                };
            }

            // Remove flashcard from deck
            deck.removeFlashcard(flashcardId);

            // Clear flashcard's deckId (or set to empty string)
            flashcard.update({ deckId: '' });

            // Save both deck and flashcard
            this.dataService.saveDeck(deck);
            this.dataService.saveFlashcard(flashcard);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to remove flashcard from deck: ${error.message}`]
            };
        }
    }

    /**
     * Get all flashcards in a deck
     * @param {string} deckId - The deck ID
     * @returns {Flashcard[]} Array of flashcards in the deck
     */
    getFlashcardsInDeck(deckId) {
        try {
            return this.dataService.loadFlashcardsForDeck(deckId);
        } catch (error) {
            console.error(`Failed to get flashcards for deck ${deckId}:`, error);
            return [];
        }
    }

    /**
     * Get deck statistics
     * @param {string} deckId - The deck ID
     * @returns {Object|null} Deck statistics or null if deck not found
     */
    getDeckStats(deckId) {
        try {
            const deck = this.dataService.loadDeck(deckId);
            if (!deck) {
                return null;
            }

            const flashcards = this.dataService.loadFlashcardsForDeck(deckId);

            return {
                id: deck.id,
                name: deck.name,
                description: deck.description,
                flashcardCount: flashcards.length,
                createdAt: deck.createdAt,
                updatedAt: deck.updatedAt
            };
        } catch (error) {
            console.error(`Failed to get deck stats for ${deckId}:`, error);
            return null;
        }
    }

    /**
     * Search decks by name
     * @param {string} searchTerm - The search term
     * @returns {Deck[]} Array of matching decks
     */
    searchDecks(searchTerm) {
        try {
            if (!searchTerm || typeof searchTerm !== 'string') {
                return [];
            }

            const allDecks = this.dataService.loadAllDecks();
            const lowerSearchTerm = searchTerm.toLowerCase();

            return allDecks.filter(deck => 
                deck.name.toLowerCase().includes(lowerSearchTerm) ||
                (deck.description && deck.description.toLowerCase().includes(lowerSearchTerm))
            );
        } catch (error) {
            console.error('Failed to search decks:', error);
            return [];
        }
    }

    /**
     * Check if a deck name is available (not already used)
     * @param {string} deckName - The deck name to check
     * @param {string} [excludeId] - Optional deck ID to exclude from check (for updates)
     * @returns {boolean} True if name is available
     */
    isDeckNameAvailable(deckName, excludeId = null) {
        try {
            if (!deckName || typeof deckName !== 'string') {
                return false;
            }

            const existingDecks = this.dataService.loadAllDecks();
            const validation = this.validationService.validateUniqueDeckName(
                deckName.trim(), 
                existingDecks, 
                excludeId
            );

            return validation.isValid;
        } catch (error) {
            console.error('Failed to check deck name availability:', error);
            return false;
        }
    }
}

module.exports = { DeckManager };