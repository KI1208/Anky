/**
 * FlashcardCreator UI Component for Flashcard App
 * 
 * This component provides a user interface for creating and editing flashcards.
 * It includes form validation, deck selection, and save/cancel functionality.
 * 
 * Requirements: 5.1
 */

/**
 * FlashcardCreator class that handles the flashcard creation/editing UI
 * Provides form for creating/editing flashcards with validation and save/cancel functionality
 */
class FlashcardCreator {
    /**
     * Create a new FlashcardCreator
     * @param {FlashcardManager} flashcardManager - The flashcard manager for CRUD operations
     * @param {DataService} dataService - The data service for loading decks
     */
    constructor(flashcardManager, dataService) {
        this.flashcardManager = flashcardManager;
        this.dataService = dataService;
        this.currentFlashcard = null; // For edit mode
        this.isEditMode = false;
        
        // Get form elements
        this.questionInput = document.getElementById('question-input');
        this.answerInput = document.getElementById('answer-input');
        this.deckSelect = document.getElementById('deck-select');
        this.saveButton = document.getElementById('save-flashcard');
        this.cancelButton = document.getElementById('cancel-flashcard');
        
        // Initialize the component
        this.init();
    }

    /**
     * Initialize the FlashcardCreator component
     */
    init() {
        this.setupEventListeners();
        this.loadDecks();
        this.clearForm();
    }

    /**
     * Set up event listeners for form interactions
     */
    setupEventListeners() {
        // Save button click
        this.saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // Cancel button click
        this.cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancel();
        });

        // Form validation on input
        this.questionInput.addEventListener('input', () => {
            this.clearFieldError('question');
            this.validateForm();
        });

        this.answerInput.addEventListener('input', () => {
            this.clearFieldError('answer');
            this.validateForm();
        });

        this.deckSelect.addEventListener('change', () => {
            this.clearFieldError('deck');
            this.validateForm();
        });

        // Handle Enter key in textareas (save form)
        this.questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handleSave();
            }
        });

        this.answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handleSave();
            }
        });
    }

    /**
     * Load available decks into the deck selector
     */
    async loadDecks() {
        try {
            const decks = this.dataService.loadAllDecks();
            
            // Clear existing options except the placeholder
            while (this.deckSelect.children.length > 1) {
                this.deckSelect.removeChild(this.deckSelect.lastChild);
            }

            // Add options for each deck
            decks.forEach(deck => {
                const option = document.createElement('option');
                option.value = deck.id;
                option.textContent = `${deck.name} (${deck.getFlashcardCount()} cards)`;
                this.deckSelect.appendChild(option);
            });

            // Update form validation after loading decks
            this.validateForm();
        } catch (error) {
            console.error('Failed to load decks:', error);
            this.showError('Failed to load decks. Please refresh the page.');
        }
    }

    /**
     * Handle save button click
     */
    async handleSave() {
        try {
            // Validate form before saving
            if (!this.validateForm()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();

            // Show loading state
            this.setLoadingState(true);

            let result;
            if (this.isEditMode && this.currentFlashcard) {
                // Update existing flashcard
                result = await this.flashcardManager.updateFlashcard(
                    this.currentFlashcard.id,
                    formData
                );
            } else {
                // Create new flashcard
                result = await this.flashcardManager.createFlashcard(formData);
            }

            if (result.success) {
                // Success - clear form and show success message
                this.clearForm();
                this.showSuccess(
                    this.isEditMode 
                        ? 'Flashcard updated successfully!' 
                        : 'Flashcard created successfully!'
                );
                
                // Exit edit mode
                this.exitEditMode();
                
                // Reload decks to update card counts
                this.loadDecks();
                
                // Trigger custom event for other components to update
                this.dispatchFlashcardEvent('flashcard-saved', result.flashcard);
            } else {
                // Show validation errors
                this.showValidationErrors(result.errors);
            }
        } catch (error) {
            console.error('Failed to save flashcard:', error);
            this.showError('Failed to save flashcard. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        // Clear form and exit edit mode
        this.clearForm();
        this.exitEditMode();
        
        // Clear any error messages
        this.clearAllErrors();
        
        // Trigger custom event
        this.dispatchFlashcardEvent('flashcard-cancelled');
    }

    /**
     * Get form data as an object
     * @returns {Object} Form data object
     */
    getFormData() {
        return {
            question: this.questionInput.value.trim(),
            answer: this.answerInput.value.trim(),
            deckId: this.deckSelect.value
        };
    }

    /**
     * Validate the form and show/hide errors
     * @returns {boolean} True if form is valid
     */
    validateForm() {
        const formData = this.getFormData();
        let isValid = true;

        // Clear previous errors
        this.clearAllErrors();

        // Validate question
        if (!formData.question) {
            this.showFieldError('question', 'Question is required');
            isValid = false;
        }

        // Validate answer
        if (!formData.answer) {
            this.showFieldError('answer', 'Answer is required');
            isValid = false;
        }

        // Validate deck selection
        if (!formData.deckId) {
            this.showFieldError('deck', 'Please select a deck');
            isValid = false;
        }

        // Update save button state
        this.saveButton.disabled = !isValid;

        return isValid;
    }

    /**
     * Clear the form and reset to create mode
     */
    clearForm() {
        this.questionInput.value = '';
        this.answerInput.value = '';
        this.deckSelect.selectedIndex = 0;
        this.clearAllErrors();
        this.validateForm();
    }

    /**
     * Enter edit mode with a specific flashcard
     * @param {Flashcard} flashcard - The flashcard to edit
     */
    enterEditMode(flashcard) {
        this.isEditMode = true;
        this.currentFlashcard = flashcard;
        
        // Populate form with flashcard data
        this.questionInput.value = flashcard.question;
        this.answerInput.value = flashcard.answer;
        this.deckSelect.value = flashcard.deckId;
        
        // Update UI to show edit mode
        this.updateUIForEditMode();
        
        // Validate form
        this.validateForm();
        
        // Focus on question input
        this.questionInput.focus();
    }

    /**
     * Exit edit mode and return to create mode
     */
    exitEditMode() {
        this.isEditMode = false;
        this.currentFlashcard = null;
        this.updateUIForCreateMode();
    }

    /**
     * Update UI elements for edit mode
     */
    updateUIForEditMode() {
        // Update button text
        this.saveButton.textContent = 'Update Flashcard';
        
        // Update form title (if there's a title element)
        const title = document.querySelector('#create-view h2');
        if (title) {
            title.textContent = 'Edit Flashcard';
        }
        
        // Add edit mode class for styling
        const createView = document.getElementById('create-view');
        if (createView) {
            createView.classList.add('edit-mode');
        }
    }

    /**
     * Update UI elements for create mode
     */
    updateUIForCreateMode() {
        // Update button text
        this.saveButton.textContent = 'Save Flashcard';
        
        // Update form title
        const title = document.querySelector('#create-view h2');
        if (title) {
            title.textContent = 'Create Flashcard';
        }
        
        // Remove edit mode class
        const createView = document.getElementById('create-view');
        if (createView) {
            createView.classList.remove('edit-mode');
        }
    }

    /**
     * Show validation errors for specific fields
     * @param {string[]} errors - Array of error messages
     */
    showValidationErrors(errors) {
        errors.forEach(error => {
            // Try to map errors to specific fields
            if (error.toLowerCase().includes('question')) {
                this.showFieldError('question', error);
            } else if (error.toLowerCase().includes('answer')) {
                this.showFieldError('answer', error);
            } else if (error.toLowerCase().includes('deck')) {
                this.showFieldError('deck', error);
            } else {
                // General error
                this.showError(error);
            }
        });
    }

    /**
     * Show error message for a specific field
     * @param {string} fieldName - The field name ('question', 'answer', 'deck')
     * @param {string} message - The error message
     */
    showFieldError(fieldName, message) {
        const field = this.getFieldElement(fieldName);
        if (!field) return;

        // Remove existing error
        this.clearFieldError(fieldName);

        // Add error class to field
        field.classList.add('error');

        // Create and add error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        // Insert error message after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    /**
     * Clear error message for a specific field
     * @param {string} fieldName - The field name
     */
    clearFieldError(fieldName) {
        const field = this.getFieldElement(fieldName);
        if (!field) return;

        // Remove error class
        field.classList.remove('error');

        // Remove error message
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Clear all field errors
     */
    clearAllErrors() {
        ['question', 'answer', 'deck'].forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
        
        // Clear general error messages
        const errorElements = document.querySelectorAll('.general-error');
        errorElements.forEach(element => element.remove());
    }

    /**
     * Get field element by name
     * @param {string} fieldName - The field name
     * @returns {HTMLElement|null} The field element
     */
    getFieldElement(fieldName) {
        switch (fieldName) {
            case 'question':
                return this.questionInput;
            case 'answer':
                return this.answerInput;
            case 'deck':
                return this.deckSelect;
            default:
                return null;
        }
    }

    /**
     * Show general error message
     * @param {string} message - The error message
     */
    showError(message) {
        // Remove existing general errors
        const existingErrors = document.querySelectorAll('.general-error');
        existingErrors.forEach(element => element.remove());

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'general-error error-message';
        errorElement.textContent = message;

        // Insert at the top of the form
        const form = document.querySelector('.flashcard-form');
        if (form) {
            form.insertBefore(errorElement, form.firstChild);
        }
    }

    /**
     * Show success message
     * @param {string} message - The success message
     */
    showSuccess(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .general-error');
        existingMessages.forEach(element => element.remove());

        // Create success element
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;

        // Insert at the top of the form
        const form = document.querySelector('.flashcard-form');
        if (form) {
            form.insertBefore(successElement, form.firstChild);
        }

        // Auto-remove success message after 3 seconds
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.remove();
            }
        }, 3000);
    }

    /**
     * Set loading state for the form
     * @param {boolean} isLoading - Whether the form is in loading state
     */
    setLoadingState(isLoading) {
        this.saveButton.disabled = isLoading;
        this.cancelButton.disabled = isLoading;
        
        if (isLoading) {
            this.saveButton.textContent = this.isEditMode ? 'Updating...' : 'Saving...';
        } else {
            this.saveButton.textContent = this.isEditMode ? 'Update Flashcard' : 'Save Flashcard';
        }
    }

    /**
     * Dispatch custom events for flashcard operations
     * @param {string} eventType - The event type
     * @param {Flashcard} [flashcard] - Optional flashcard data
     */
    dispatchFlashcardEvent(eventType, flashcard = null) {
        const event = new CustomEvent(eventType, {
            detail: {
                flashcard: flashcard,
                isEditMode: this.isEditMode
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Refresh the deck selector (call when decks are updated)
     */
    refreshDecks() {
        this.loadDecks();
    }

    /**
     * Get the current form state
     * @returns {Object} Current form state
     */
    getFormState() {
        return {
            isEditMode: this.isEditMode,
            currentFlashcard: this.currentFlashcard,
            formData: this.getFormData(),
            isValid: this.validateForm()
        };
    }

    /**
     * Check if the form has unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        const formData = this.getFormData();
        
        if (this.isEditMode && this.currentFlashcard) {
            // Check if form data differs from current flashcard
            return (
                formData.question !== this.currentFlashcard.question ||
                formData.answer !== this.currentFlashcard.answer ||
                formData.deckId !== this.currentFlashcard.deckId
            );
        } else {
            // Check if form has any content
            return (
                formData.question !== '' ||
                formData.answer !== '' ||
                formData.deckId !== ''
            );
        }
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlashcardCreator };
} else {
    // Make available globally for browser use
    window.FlashcardCreator = FlashcardCreator;
}