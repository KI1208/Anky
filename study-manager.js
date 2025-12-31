/**
 * StudyManager for Flashcard App
 * 
 * This class manages study sessions for flashcard learning.
 * It handles session initialization, flashcard navigation, and progress tracking.
 * 
 * Requirements: 3.1, 3.4, 3.5
 */

/**
 * StudySession class representing an active study session
 */
class StudySession {
    /**
     * Create a new StudySession
     * @param {string} deckId - The deck ID being studied
     * @param {Flashcard[]} flashcards - Array of flashcards in the session
     */
    constructor(deckId, flashcards) {
        this.deckId = deckId;
        this.flashcards = [...flashcards]; // Create a copy to avoid mutations
        this.currentIndex = 0;
        this.startTime = new Date();
        this.endTime = null;
        this.isComplete = false;
        this.reviewedCards = new Set(); // Track which cards have been reviewed
    }

    /**
     * Get the current flashcard
     * @returns {Flashcard|null} Current flashcard or null if session is complete
     */
    getCurrentFlashcard() {
        if (this.isComplete || this.currentIndex >= this.flashcards.length) {
            return null;
        }
        return this.flashcards[this.currentIndex];
    }

    /**
     * Move to the next flashcard
     * @returns {boolean} True if moved to next card, false if session is complete
     */
    nextFlashcard() {
        if (this.isComplete) {
            return false;
        }

        // Mark current card as reviewed
        if (this.currentIndex < this.flashcards.length) {
            this.reviewedCards.add(this.currentIndex);
        }

        this.currentIndex++;

        // Check if session is complete
        if (this.currentIndex >= this.flashcards.length) {
            this.completeSession();
            return false;
        }

        return true;
    }

    /**
     * Move to the previous flashcard
     * @returns {boolean} True if moved to previous card, false if at beginning
     */
    previousFlashcard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    /**
     * Jump to a specific flashcard by index
     * @param {number} index - The index to jump to
     * @returns {boolean} True if jump was successful, false if index is invalid
     */
    jumpToFlashcard(index) {
        if (index >= 0 && index < this.flashcards.length && !this.isComplete) {
            this.currentIndex = index;
            return true;
        }
        return false;
    }

    /**
     * Get session progress information
     * @returns {Object} Progress information
     */
    getProgress() {
        return {
            currentIndex: this.currentIndex,
            totalCards: this.flashcards.length,
            reviewedCount: this.reviewedCards.size,
            percentComplete: this.flashcards.length > 0 ? 
                Math.round((this.reviewedCards.size / this.flashcards.length) * 100) : 100,
            isComplete: this.isComplete,
            hasNext: this.currentIndex < this.flashcards.length - 1,
            hasPrevious: this.currentIndex > 0
        };
    }

    /**
     * Complete the study session
     * @private
     */
    completeSession() {
        this.isComplete = true;
        this.endTime = new Date();
        
        // Mark all cards as reviewed if we've reached the end
        for (let i = 0; i < this.flashcards.length; i++) {
            this.reviewedCards.add(i);
        }
    }

    /**
     * Get session summary
     * @returns {Object} Session summary information
     */
    getSessionSummary() {
        const duration = this.endTime ? 
            Math.round((this.endTime - this.startTime) / 1000) : 
            Math.round((new Date() - this.startTime) / 1000);

        return {
            deckId: this.deckId,
            totalCards: this.flashcards.length,
            reviewedCards: this.reviewedCards.size,
            duration: duration, // in seconds
            startTime: this.startTime,
            endTime: this.endTime,
            isComplete: this.isComplete
        };
    }

    /**
     * Reset the session to the beginning
     */
    reset() {
        this.currentIndex = 0;
        this.isComplete = false;
        this.endTime = null;
        this.reviewedCards.clear();
        this.startTime = new Date();
    }
}

/**
 * StudyManager class that handles study session operations
 * Provides session initialization, navigation, and progress tracking
 */
class StudyManager {
    /**
     * Create a new StudyManager
     * @param {DataService} dataService - The data service for loading flashcards
     */
    constructor(dataService) {
        this.dataService = dataService;
        this.currentSession = null;
    }

    /**
     * Start a new study session for a deck
     * @param {string} deckId - The deck ID to study
     * @returns {Promise<{success: boolean, session?: StudySession, errors?: string[]}>} Result object
     */
    async startStudySession(deckId) {
        try {
            if (!deckId || typeof deckId !== 'string') {
                return {
                    success: false,
                    errors: ['Deck ID is required and must be a string']
                };
            }

            // Load the deck to verify it exists
            const deck = this.dataService.loadDeck(deckId);
            if (!deck) {
                return {
                    success: false,
                    errors: ['Deck not found']
                };
            }

            // Load flashcards for the deck
            const flashcards = this.dataService.loadFlashcardsForDeck(deckId);
            if (flashcards.length === 0) {
                return {
                    success: false,
                    errors: ['Deck contains no flashcards to study']
                };
            }

            // Create new study session
            this.currentSession = new StudySession(deckId, flashcards);

            return {
                success: true,
                session: this.currentSession
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to start study session: ${error.message}`]
            };
        }
    }

    /**
     * Get the current active study session
     * @returns {StudySession|null} Current session or null if no active session
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Navigate to the next flashcard in the current session
     * @returns {Promise<{success: boolean, hasNext?: boolean, isComplete?: boolean, errors?: string[]}>} Result object
     */
    async nextFlashcard() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const hasNext = this.currentSession.nextFlashcard();
            
            return {
                success: true,
                hasNext: hasNext,
                isComplete: this.currentSession.isComplete
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to navigate to next flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Navigate to the previous flashcard in the current session
     * @returns {Promise<{success: boolean, hasPrevious?: boolean, errors?: string[]}>} Result object
     */
    async previousFlashcard() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const hasPrevious = this.currentSession.previousFlashcard();
            
            return {
                success: true,
                hasPrevious: hasPrevious
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to navigate to previous flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Jump to a specific flashcard by index
     * @param {number} index - The index to jump to
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async jumpToFlashcard(index) {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            if (typeof index !== 'number' || index < 0) {
                return {
                    success: false,
                    errors: ['Index must be a non-negative number']
                };
            }

            const success = this.currentSession.jumpToFlashcard(index);
            if (!success) {
                return {
                    success: false,
                    errors: ['Invalid flashcard index or session is complete']
                };
            }

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to jump to flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Get the current flashcard in the active session
     * @returns {Promise<{success: boolean, flashcard?: Flashcard, errors?: string[]}>} Result object
     */
    async getCurrentFlashcard() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const flashcard = this.currentSession.getCurrentFlashcard();
            if (!flashcard) {
                return {
                    success: false,
                    errors: ['No current flashcard (session may be complete)']
                };
            }

            return {
                success: true,
                flashcard: flashcard
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get current flashcard: ${error.message}`]
            };
        }
    }

    /**
     * Get progress information for the current session
     * @returns {Promise<{success: boolean, progress?: Object, errors?: string[]}>} Result object
     */
    async getSessionProgress() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const progress = this.currentSession.getProgress();
            
            return {
                success: true,
                progress: progress
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get session progress: ${error.message}`]
            };
        }
    }

    /**
     * Complete the current study session
     * @returns {Promise<{success: boolean, summary?: Object, errors?: string[]}>} Result object
     */
    async completeSession() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            // Force completion if not already complete
            if (!this.currentSession.isComplete) {
                this.currentSession.completeSession();
            }

            const summary = this.currentSession.getSessionSummary();
            
            // Clear the current session
            this.currentSession = null;

            return {
                success: true,
                summary: summary
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to complete session: ${error.message}`]
            };
        }
    }

    /**
     * Reset the current study session to the beginning
     * @returns {Promise<{success: boolean, errors?: string[]}>} Result object
     */
    async resetSession() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            this.currentSession.reset();

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to reset session: ${error.message}`]
            };
        }
    }

    /**
     * End the current study session without completing it
     * @returns {Promise<{success: boolean, summary?: Object, errors?: string[]}>} Result object
     */
    async endSession() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const summary = this.currentSession.getSessionSummary();
            this.currentSession = null;

            return {
                success: true,
                summary: summary
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to end session: ${error.message}`]
            };
        }
    }

    /**
     * Check if there is an active study session
     * @returns {boolean} True if there is an active session
     */
    hasActiveSession() {
        return this.currentSession !== null;
    }

    /**
     * Get session statistics without ending the session
     * @returns {Promise<{success: boolean, summary?: Object, errors?: string[]}>} Result object
     */
    async getSessionSummary() {
        try {
            if (!this.currentSession) {
                return {
                    success: false,
                    errors: ['No active study session']
                };
            }

            const summary = this.currentSession.getSessionSummary();
            
            return {
                success: true,
                summary: summary
            };
        } catch (error) {
            return {
                success: false,
                errors: [`Failed to get session summary: ${error.message}`]
            };
        }
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudyManager, StudySession };
} else {
    // Make available globally for browser use
    window.StudyManager = StudyManager;
    window.StudySession = StudySession;
}