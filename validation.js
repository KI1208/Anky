/**
 * ValidationService for Flashcard App
 * 
 * This service provides validation functions for flashcards and decks.
 * It handles non-empty text validation and unique deck name validation.
 */

/**
 * ValidationService class that provides validation methods for the application
 */
class ValidationService {
    /**
     * Validate flashcard data
     * @param {Object} flashcardData - Partial or complete flashcard data
     * @param {string} flashcardData.question - The question text
     * @param {string} flashcardData.answer - The answer text
     * @param {string} flashcardData.deckId - The deck ID
     * @param {Deck[]} [existingDecks] - Array of existing decks to validate deckId against
     * @returns {ValidationResult} Validation result with isValid boolean and errors array
     */
    static validateFlashcard(flashcardData, existingDecks = []) {
        const errors = [];

        // Validate question
        const questionValidation = ValidationService.validateNonEmptyText(flashcardData.question, 'Question');
        if (!questionValidation.isValid) {
            errors.push(...questionValidation.errors);
        }

        // Validate answer
        const answerValidation = ValidationService.validateNonEmptyText(flashcardData.answer, 'Answer');
        if (!answerValidation.isValid) {
            errors.push(...answerValidation.errors);
        }

        // Validate deckId
        if (!flashcardData.deckId || typeof flashcardData.deckId !== 'string') {
            errors.push('Deck ID is required and must be a string');
        } else if (flashcardData.deckId.trim() === '') {
            errors.push('Deck ID cannot be empty or only whitespace');
        } else if (existingDecks.length > 0) {
            // Check if the deck exists
            const deckExists = existingDecks.some(deck => deck.id === flashcardData.deckId);
            if (!deckExists) {
                errors.push('Deck ID must reference an existing deck');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate deck data
     * @param {Object} deckData - Partial or complete deck data
     * @param {string} deckData.name - The deck name
     * @param {string} [deckData.description] - Optional deck description
     * @param {string} [deckData.id] - Optional deck ID (for updates)
     * @param {Deck[]} [existingDecks] - Array of existing decks to check for name uniqueness
     * @returns {ValidationResult} Validation result with isValid boolean and errors array
     */
    static validateDeck(deckData, existingDecks = []) {
        const errors = [];

        // Validate name
        const nameValidation = ValidationService.validateNonEmptyText(deckData.name, 'Name');
        if (!nameValidation.isValid) {
            errors.push(...nameValidation.errors);
        } else {
            // Check for unique deck name
            const uniqueNameValidation = ValidationService.validateUniqueDeckName(
                deckData.name, 
                existingDecks, 
                deckData.id
            );
            if (!uniqueNameValidation.isValid) {
                errors.push(...uniqueNameValidation.errors);
            }
        }

        // Validate description if provided
        if (deckData.description !== undefined && deckData.description !== null) {
            if (typeof deckData.description !== 'string') {
                errors.push('Description must be a string');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate that text is non-empty and properly trimmed
     * @param {string} text - The text to validate
     * @param {string} fieldName - The name of the field being validated (for error messages)
     * @returns {ValidationResult} Validation result with isValid boolean and errors array
     */
    static validateNonEmptyText(text, fieldName) {
        const errors = [];

        // Check if text exists and is a string
        if (!text || typeof text !== 'string') {
            errors.push(`${fieldName} is required and must be a string`);
        } else {
            // Check if text is empty or only whitespace
            if (text.trim() === '') {
                errors.push(`${fieldName} cannot be empty or only whitespace`);
            } else if (text !== text.trim()) {
                // Check if text has leading or trailing whitespace
                errors.push(`${fieldName} should not have leading or trailing whitespace`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate that a deck name is unique among existing decks
     * @param {string} deckName - The deck name to validate
     * @param {Deck[]} existingDecks - Array of existing decks
     * @param {string} [excludeId] - Optional deck ID to exclude from uniqueness check (for updates)
     * @returns {ValidationResult} Validation result with isValid boolean and errors array
     */
    static validateUniqueDeckName(deckName, existingDecks = [], excludeId = null) {
        const errors = [];

        if (!deckName || typeof deckName !== 'string') {
            errors.push('Deck name is required for uniqueness validation');
        } else {
            // Check for duplicate names (excluding the deck being updated if excludeId is provided)
            const duplicateDeck = existingDecks.find(deck => 
                deck.id !== excludeId && deck.name === deckName
            );
            
            if (duplicateDeck) {
                errors.push('A deck with this name already exists');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate multiple flashcards at once
     * @param {Object[]} flashcardsData - Array of flashcard data objects
     * @param {Deck[]} [existingDecks] - Array of existing decks to validate against
     * @returns {Object} Object with overall validity and individual results
     */
    static validateMultipleFlashcards(flashcardsData, existingDecks = []) {
        const results = flashcardsData.map((flashcardData, index) => ({
            index,
            ...ValidationService.validateFlashcard(flashcardData, existingDecks)
        }));

        const allValid = results.every(result => result.isValid);
        const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

        return {
            isValid: allValid,
            totalErrors,
            results
        };
    }

    /**
     * Validate multiple decks at once
     * @param {Object[]} decksData - Array of deck data objects
     * @returns {Object} Object with overall validity and individual results
     */
    static validateMultipleDecks(decksData) {
        const results = [];
        const processedDecks = [];

        // Process each deck, building up the list of processed decks for uniqueness validation
        decksData.forEach((deckData, index) => {
            const result = {
                index,
                ...ValidationService.validateDeck(deckData, processedDecks)
            };
            results.push(result);

            // If this deck is valid, add it to the processed list for subsequent validations
            if (result.isValid) {
                processedDecks.push({ id: deckData.id, name: deckData.name });
            }
        });

        const allValid = results.every(result => result.isValid);
        const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

        return {
            isValid: allValid,
            totalErrors,
            results
        };
    }
}

/**
 * ValidationResult type definition (for documentation)
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string[]} errors - Array of error messages
 */

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ValidationService
    };
} else {
    // Make available globally for browser use
    window.ValidationService = ValidationService;
}