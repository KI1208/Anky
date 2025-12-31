/**
 * Data Models for Flashcard App
 * 
 * This file contains the core data models and utilities for the flashcard application.
 * It defines the Flashcard and Deck classes along with ID generation utilities.
 */

/**
 * Utility function to generate unique IDs
 * Uses timestamp and random number to ensure uniqueness
 * @returns {string} A unique identifier
 */
function generateId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomPart}`;
}

/**
 * Flashcard class representing a single flashcard
 * Contains question, answer, and metadata
 */
class Flashcard {
    /**
     * Create a new Flashcard
     * @param {Object} data - Flashcard data
     * @param {string} data.question - The question text
     * @param {string} data.answer - The answer text
     * @param {string} data.deckId - The ID of the deck this flashcard belongs to
     * @param {string} [data.id] - Optional ID (will be generated if not provided)
     * @param {Date} [data.createdAt] - Optional creation date (will be set to now if not provided)
     * @param {Date} [data.updatedAt] - Optional update date (will be set to now if not provided)
     */
    constructor(data) {
        this.id = data.id || generateId();
        this.question = data.question || '';
        this.answer = data.answer || '';
        this.deckId = data.deckId || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }

    /**
     * Update the flashcard content
     * @param {Object} updates - Object containing fields to update
     * @param {string} [updates.question] - New question text
     * @param {string} [updates.answer] - New answer text
     * @param {string} [updates.deckId] - New deck ID
     */
    update(updates) {
        if (updates.question !== undefined) {
            this.question = updates.question;
        }
        if (updates.answer !== undefined) {
            this.answer = updates.answer;
        }
        if (updates.deckId !== undefined) {
            this.deckId = updates.deckId;
        }
        this.updatedAt = new Date();
    }

    /**
     * Convert flashcard to plain object for serialization
     * @returns {Object} Plain object representation of the flashcard
     */
    toJSON() {
        return {
            id: this.id,
            question: this.question,
            answer: this.answer,
            deckId: this.deckId,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Create a Flashcard instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {Flashcard} New Flashcard instance
     */
    static fromJSON(data) {
        return new Flashcard({
            id: data.id,
            question: data.question,
            answer: data.answer,
            deckId: data.deckId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    /**
     * Validate flashcard data
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Check question is non-empty and trimmed
        if (!this.question || typeof this.question !== 'string') {
            errors.push('Question is required and must be a string');
        } else if (this.question.trim() === '') {
            errors.push('Question cannot be empty or only whitespace');
        } else if (this.question !== this.question.trim()) {
            errors.push('Question should not have leading or trailing whitespace');
        }

        // Check answer is non-empty and trimmed
        if (!this.answer || typeof this.answer !== 'string') {
            errors.push('Answer is required and must be a string');
        } else if (this.answer.trim() === '') {
            errors.push('Answer cannot be empty or only whitespace');
        } else if (this.answer !== this.answer.trim()) {
            errors.push('Answer should not have leading or trailing whitespace');
        }

        // Check deckId is provided
        if (!this.deckId || typeof this.deckId !== 'string') {
            errors.push('Deck ID is required and must be a string');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

/**
 * Deck class representing a collection of flashcards
 * Contains name, description, and flashcard references
 */
class Deck {
    /**
     * Create a new Deck
     * @param {Object} data - Deck data
     * @param {string} data.name - The deck name
     * @param {string} [data.description] - Optional deck description
     * @param {string[]} [data.flashcardIds] - Array of flashcard IDs in this deck
     * @param {string} [data.id] - Optional ID (will be generated if not provided)
     * @param {Date} [data.createdAt] - Optional creation date (will be set to now if not provided)
     * @param {Date} [data.updatedAt] - Optional update date (will be set to now if not provided)
     */
    constructor(data) {
        this.id = data.id || generateId();
        this.name = data.name || '';
        this.description = data.description || '';
        this.flashcardIds = data.flashcardIds || [];
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }

    /**
     * Update the deck information
     * @param {Object} updates - Object containing fields to update
     * @param {string} [updates.name] - New deck name
     * @param {string} [updates.description] - New deck description
     */
    update(updates) {
        if (updates.name !== undefined) {
            this.name = updates.name;
        }
        if (updates.description !== undefined) {
            this.description = updates.description;
        }
        this.updatedAt = new Date();
    }

    /**
     * Add a flashcard to this deck
     * @param {string} flashcardId - ID of the flashcard to add
     */
    addFlashcard(flashcardId) {
        if (!this.flashcardIds.includes(flashcardId)) {
            this.flashcardIds.push(flashcardId);
            this.updatedAt = new Date();
        }
    }

    /**
     * Remove a flashcard from this deck
     * @param {string} flashcardId - ID of the flashcard to remove
     */
    removeFlashcard(flashcardId) {
        const index = this.flashcardIds.indexOf(flashcardId);
        if (index > -1) {
            this.flashcardIds.splice(index, 1);
            this.updatedAt = new Date();
        }
    }

    /**
     * Get the number of flashcards in this deck
     * @returns {number} Number of flashcards
     */
    getFlashcardCount() {
        return this.flashcardIds.length;
    }

    /**
     * Convert deck to plain object for serialization
     * @returns {Object} Plain object representation of the deck
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            flashcardIds: [...this.flashcardIds], // Create a copy of the array
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Create a Deck instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {Deck} New Deck instance
     */
    static fromJSON(data) {
        return new Deck({
            id: data.id,
            name: data.name,
            description: data.description,
            flashcardIds: data.flashcardIds || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    /**
     * Validate deck data
     * @param {Deck[]} [existingDecks] - Array of existing decks to check for name uniqueness
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate(existingDecks = []) {
        const errors = [];

        // Check name is non-empty and trimmed
        if (!this.name || typeof this.name !== 'string') {
            errors.push('Name is required and must be a string');
        } else if (this.name.trim() === '') {
            errors.push('Name cannot be empty or only whitespace');
        } else if (this.name !== this.name.trim()) {
            errors.push('Name should not have leading or trailing whitespace');
        } else {
            // Check for duplicate names (excluding this deck if it already exists)
            const duplicateDeck = existingDecks.find(deck => 
                deck.id !== this.id && deck.name === this.name
            );
            if (duplicateDeck) {
                errors.push('A deck with this name already exists');
            }
        }

        // Validate flashcardIds array
        if (!Array.isArray(this.flashcardIds)) {
            errors.push('Flashcard IDs must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Flashcard,
        Deck,
        generateId
    };
} else {
    // Make available globally for browser use
    window.Flashcard = Flashcard;
    window.Deck = Deck;
    window.generateId = generateId;
}