/**
 * FlashcardManager for Flashcard App
 * 
 * This class provides high-level CRUD operations for flashcards.
 * It integrates with DataService for persistence and ValidationService for validation.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

/**
 * FlashcardManager class that handles flashcard operations
 * Provides create, read, update, delete operations with validation and persistence
 */
class FlashcardManager {
    /**
     * Create a new FlashcardManager
     * @param {DataService} dataService - The data service for persistence
     * @param {ValidationService} validationService - The validation service
     */
    constructor(dataService, validationService) {
        this.dataService = dataService;
        this.validationService = validationService;
    }

    /**
     * Create a new flashcard
     * @param {Object} flashcardData - The flashcard data
     * @param {string} flashcardData.question - The question text
     * @param {string} flashcardData.answer - The answer text
     * @param {string} flashcardData.deckId - The deck ID
     * @returns {Promise<{success: boolean, flashcard?: Flashcard, errors?: string[]}>} Result object
     */
    async createFlashcard(flashcardData) {
        try {
            // Load existing decks for validation
            const existingDecks = this.dataService.loadAllDecks();
            
            // Validate the flashcard data
            const validation = this.validationService.validateFlashcard(flashcardData, existingDecks);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Create the flashcard instance
            const flashcard = new Flashcard({
                question: flashcardData.question.trim(),
                answer: flashcardData.answer.trim(),
                deckId: flashcardData.deckId
            });

            // Save to storage
            this.dataService.saveFlashcard(flashcard);

            // Update the deck's flashcard list
            const deck = this.dataService.loadDeck(flashcardData.deckId);
            if (deck) {
                deck.addFlashcard(flashcard.id);
                this.dataService.saveDeck(deck);
            }

            return {
                success: true,
                flashcard: flashcard
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to create flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Get a flashcard by ID
     * @param {string} id - The flashcard ID
     * @returns {Promise<{success: boolean, flashcard?: Flashcard, errors?: string[]}>} Result object
     */
    async getFlashcard(id) {
        try {
            if (!id || typeof id !== 'string') {
                return {
                    success: false,
                    errors: ['Flashcard ID is required and must be a string']
                };
            }

            const flashcard = this.dataService.loadFlashcard(id);
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['Flashcard not found']
                };
            }

            return {
                success: true,
                flashcard: flashcard
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Update an existing flashcard
     * @param {string} id - The flashcard ID
     * @param {Object} updates - The updates to apply
     * @param {string} [updates.question] - New question text
     * @param {string} [updates.answer] - New answer text
     * @param {string} [updates.deckId] - New deck ID
     * @returns {Promise<{success: boolean, flashcard?: Flashcard, errors?: string[]}>} Result object
     */
    async updateFlashcard(id, updates) {
        try {
            if (!id || typeof id !== 'string') {
                return {
                    success: false,
                    errors: ['Flashcard ID is required and must be a string']
                };
            }

            // Load the existing flashcard
            const flashcard = this.dataService.loadFlashcard(id);
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['Flashcard not found']
                };
            }

            // Create updated flashcard data for validation
            const updatedData = {
                question: updates.question !== undefined ? updates.question : flashcard.question,
                answer: updates.answer !== undefined ? updates.answer : flashcard.answer,
                deckId: updates.deckId !== undefined ? updates.deckId : flashcard.deckId
            };

            // Load existing decks for validation
            const existingDecks = this.dataService.loadAllDecks();
            
            // Validate the updated data
            const validation = this.validationService.validateFlashcard(updatedData, existingDecks);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Handle deck change if deckId is being updated
            const oldDeckId = flashcard.deckId;
            const newDeckId = updatedData.deckId;
            
            if (oldDeckId !== newDeckId) {
                // Remove from old deck
                const oldDeck = this.dataService.loadDeck(oldDeckId);
                if (oldDeck) {
                    oldDeck.removeFlashcard(id);
                    this.dataService.saveDeck(oldDeck);
                }

                // Add to new deck
                const newDeck = this.dataService.loadDeck(newDeckId);
                if (newDeck) {
                    newDeck.addFlashcard(id);
                    this.dataService.saveDeck(newDeck);
                }
            }

            // Apply updates to the flashcard
            const updateObject = {};
            if (updates.question !== undefined) {
                updateObject.question = updates.question.trim();
            }
            if (updates.answer !== undefined) {
                updateObject.answer = updates.answer.trim();
            }
            if (updates.deckId !== undefined) {
                updateObject.deckId = updates.deckId;
            }

            flashcard.update(updateObject);

            // Save the updated flashcard
            this.dataService.saveFlashcard(flashcard);

            return {
                success: true,
                flashcard: flashcard
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to update flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Delete a flashcard
     * @param {string} id - The flashcard ID
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async deleteFlashcard(id) {
        try {
            if (!id || typeof id !== 'string') {
                return {
                    success: false,
                    errors: ['Flashcard ID is required and must be a string']
                };
            }

            // Load the flashcard to get its deck ID
            const flashcard = this.dataService.loadFlashcard(id);
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['Flashcard not found']
                };
            }

            // Remove from its deck
            const deck = this.dataService.loadDeck(flashcard.deckId);
            if (deck) {
                deck.removeFlashcard(id);
                this.dataService.saveDeck(deck);
            }

            // Delete the flashcard
            this.dataService.deleteFlashcard(id);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to delete flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Get all flashcards for a specific deck
     * @param {string} deckId - The deck ID
     * @returns {Promise<{success: boolean, flashcards?: Flashcard[], errors?: string[]}>} Result object
     */
    async getFlashcardsForDeck(deckId) {
        try {
            if (!deckId || typeof deckId !== 'string') {
                return {
                    success: false,
                    errors: ['Deck ID is required and must be a string']
                };
            }

            const flashcards = this.dataService.loadFlashcardsForDeck(deckId);
            
            return {
                success: true,
                flashcards: flashcards
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get flashcards for deck: ${error.message}`]
            };
        }
    }

    /**
     * Get all flashcards in the system
     * @returns {Promise<{success: boolean, flashcards?: Flashcard[], errors?: string[]}>} Result object
     */
    async getAllFlashcards() {
        try {
            const flashcardsData = this.dataService.loadAllFlashcards();
            const flashcards = flashcardsData.map(data => Flashcard.fromJSON(data));
            
            return {
                success: true,
                flashcards: flashcards
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get all flashcards: ${error.message}`]
            };
        }
    }

    /**
     * Search flashcards by question or answer content
     * @param {string} searchTerm - The search term
     * @param {string} [deckId] - Optional deck ID to limit search to specific deck
     * @returns {Promise<{success: boolean, flashcards?: Flashcard[], errors?: string[]}>} Result object
     */
    async searchFlashcards(searchTerm, deckId = null) {
        try {
            if (!searchTerm || typeof searchTerm !== 'string') {
                return {
                    success: false,
                    errors: ['Search term is required and must be a string']
                };
            }

            const searchTermLower = searchTerm.toLowerCase().trim();
            if (searchTermLower === '') {
                return {
                    success: false,
                    errors: ['Search term cannot be empty']
                };
            }

            let flashcards;
            if (deckId) {
                flashcards = this.dataService.loadFlashcardsForDeck(deckId);
            } else {
                const flashcardsData = this.dataService.loadAllFlashcards();
                flashcards = flashcardsData.map(data => Flashcard.fromJSON(data));
            }

            const matchingFlashcards = flashcards.filter(flashcard => 
                flashcard.question.toLowerCase().includes(searchTermLower) ||
                flashcard.answer.toLowerCase().includes(searchTermLower)
            );

            return {
                success: true,
                flashcards: matchingFlashcards
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to search flashcards: ${error.message}`]
            };
        }
    }

    /**
     * Validate a flashcard without saving it
     * @param {Object} flashcardData - The flashcard data to validate
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async validateFlashcard(flashcardData) {
        try {
            const existingDecks = this.dataService.loadAllDecks();
            const validation = this.validationService.validateFlashcard(flashcardData, existingDecks);
            
            return {
                success: validation.isValid,
                errors: validation.isValid ? [] : validation.errors
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to validate flashcard: ${error.message}`]
            };
        }
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlashcardManager };
} else {
    // Make available globally for browser use
    window.FlashcardManager = FlashcardManager;
}