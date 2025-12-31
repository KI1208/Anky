/**
 * DeckManager UI Component for Flashcard App
 * 
 * This component provides a user interface for managing decks.
 * It includes listing decks, creating new decks, editing existing decks,
 * deleting decks, and deck selection for flashcard creation.
 * 
 * Requirements: 5.2
 */

/**
 * DeckManagerUI class that handles the deck management interface
 * Provides interface for listing decks, create/edit/delete deck functionality,
 * and deck selection for flashcard creation
 */
class DeckManagerUI {
    /**
     * Create a new DeckManagerUI
     * @param {DeckManager} deckManager - The deck manager for CRUD operations
     * @param {DataService} dataService - The data service for loading data
     */
    constructor(deckManager, dataService) {
        this.deckManager = deckManager;
        this.dataService = dataService;
        this.currentDeck = null; // For edit mode
        this.isEditMode = false;
        
        // Get UI elements
        this.deckListContainer = document.getElementById('deck-list');
        this.createDeckButton = document.getElementById('create-deck');
        
        // Initialize the component
        this.init();
    }

    /**
     * Initialize the DeckManagerUI component
     */
    init() {
        this.setupEventListeners();
        this.loadAndDisplayDecks();
    }

    /**
     * Set up event listeners for deck management interactions
     */
    setupEventListeners() {
        // Create deck button click
        this.createDeckButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCreateDeckDialog();
        });

        // Listen for flashcard events to update deck counts
        document.addEventListener('flashcard-saved', () => {
            this.loadAndDisplayDecks();
        });

        document.addEventListener('flashcard-deleted', () => {
            this.loadAndDisplayDecks();
        });
    }

    /**
     * Load decks from data service and display them
     */
    async loadAndDisplayDecks() {
        try {
            const decks = this.deckManager.getAllDecks();
            this.displayDecks(decks);
        } catch (error) {
            console.error('Failed to load decks:', error);
            this.showError('Failed to load decks. Please refresh the page.');
        }
    }

    /**
     * Display decks in the deck list container
     * @param {Deck[]} decks - Array of decks to display
     */
    displayDecks(decks) {
        // Clear existing deck items
        this.deckListContainer.innerHTML = '';

        if (decks.length === 0) {
            this.showEmptyState();
            return;
        }

        // Create deck items
        decks.forEach(deck => {
            const deckElement = this.createDeckElement(deck);
            this.deckListContainer.appendChild(deckElement);
        });
    }

    /**
     * Show empty state when no decks exist
     */
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state text-center';
        emptyState.innerHTML = `
            <h3>No decks yet</h3>
            <p>Create your first deck to start organizing your flashcards.</p>
            <button class="btn btn-primary mt-2" onclick="this.parentElement.parentElement.parentElement.querySelector('#create-deck').click()">
                Create Your First Deck
            </button>
        `;
        this.deckListContainer.appendChild(emptyState);
    }

    /**
     * Create a deck element for display
     * @param {Deck} deck - The deck to create an element for
     * @returns {HTMLElement} The deck element
     */
    createDeckElement(deck) {
        const deckElement = document.createElement('div');
        deckElement.className = 'deck-item';
        deckElement.dataset.deckId = deck.id;

        // Get flashcard count
        const flashcards = this.deckManager.getFlashcardsInDeck(deck.id);
        const flashcardCount = flashcards.length;

        deckElement.innerHTML = `
            <h3>${this.escapeHtml(deck.name)}</h3>
            <p class="deck-description">${deck.description ? this.escapeHtml(deck.description) : 'No description'}</p>
            <p class="deck-stats">${flashcardCount} flashcard${flashcardCount !== 1 ? 's' : ''}</p>
            <div class="deck-item-actions">
                <button class="btn btn-primary btn-study" data-deck-id="${deck.id}" ${flashcardCount === 0 ? 'disabled' : ''}>
                    ${flashcardCount === 0 ? 'No Cards' : 'Study'}
                </button>
                <button class="btn btn-secondary btn-edit" data-deck-id="${deck.id}">Edit</button>
                <button class="btn btn-secondary btn-delete" data-deck-id="${deck.id}">Delete</button>
            </div>
        `;

        // Add event listeners to action buttons
        this.setupDeckItemEventListeners(deckElement, deck);

        return deckElement;
    }

    /**
     * Set up event listeners for deck item action buttons
     * @param {HTMLElement} deckElement - The deck element
     * @param {Deck} deck - The deck data
     */
    setupDeckItemEventListeners(deckElement, deck) {
        // Study button
        const studyButton = deckElement.querySelector('.btn-study');
        studyButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleStudyDeck(deck);
        });

        // Edit button
        const editButton = deckElement.querySelector('.btn-edit');
        editButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleEditDeck(deck);
        });

        // Delete button
        const deleteButton = deckElement.querySelector('.btn-delete');
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleDeleteDeck(deck);
        });
    }

    /**
     * Show create deck dialog
     */
    showCreateDeckDialog() {
        this.showDeckDialog('Create New Deck', '', '', (name, description) => {
            this.createDeck(name, description);
        });
    }

    /**
     * Handle edit deck action
     * @param {Deck} deck - The deck to edit
     */
    handleEditDeck(deck) {
        this.showDeckDialog('Edit Deck', deck.name, deck.description, (name, description) => {
            this.updateDeck(deck.id, name, description);
        });
    }

    /**
     * Handle delete deck action
     * @param {Deck} deck - The deck to delete
     */
    async handleDeleteDeck(deck) {
        const flashcards = this.deckManager.getFlashcardsInDeck(deck.id);
        
        let confirmMessage = `Are you sure you want to delete the deck "${deck.name}"?`;
        if (flashcards.length > 0) {
            confirmMessage += `\n\nThis deck contains ${flashcards.length} flashcard${flashcards.length !== 1 ? 's' : ''}. `;
            confirmMessage += 'Do you want to delete the deck and all its flashcards?';
        }

        if (confirm(confirmMessage)) {
            try {
                const result = await this.deckManager.deleteDeck(deck.id, true); // Delete with flashcards
                
                if (result.success) {
                    this.showSuccess(
                        `Deck "${deck.name}" deleted successfully` + 
                        (result.deletedFlashcards > 0 ? ` (${result.deletedFlashcards} flashcards also deleted)` : '')
                    );
                    this.loadAndDisplayDecks();
                    
                    // Trigger event for other components to update
                    this.dispatchDeckEvent('deck-deleted', deck);
                } else {
                    this.showError(result.errors.join(', '));
                }
            } catch (error) {
                console.error('Failed to delete deck:', error);
                this.showError('Failed to delete deck. Please try again.');
            }
        }
    }

    /**
     * Handle study deck action
     * @param {Deck} deck - The deck to study
     */
    handleStudyDeck(deck) {
        // Switch to study view and start session with this deck
        // This will be implemented when study functionality is added
        console.log(`Starting study session for deck: ${deck.name}`);
        
        // For now, just dispatch an event that other components can listen to
        this.dispatchDeckEvent('deck-study-requested', deck);
        
        // Switch to study view
        if (window.flashcardApp) {
            window.flashcardApp.showView('study');
        }
    }

    /**
     * Show deck creation/editing dialog
     * @param {string} title - Dialog title
     * @param {string} initialName - Initial name value
     * @param {string} initialDescription - Initial description value
     * @param {Function} onSave - Callback function when save is clicked
     */
    showDeckDialog(title, initialName, initialDescription, onSave) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>${this.escapeHtml(title)}</h3>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="deck-name-input">Deck Name:</label>
                        <input type="text" id="deck-name-input" class="form-control" value="${this.escapeHtml(initialName)}" placeholder="Enter deck name..." maxlength="100">
                        <div class="field-error" id="name-error" style="display: none;"></div>
                    </div>
                    <div class="form-group">
                        <label for="deck-description-input">Description (optional):</label>
                        <textarea id="deck-description-input" class="form-control" placeholder="Enter deck description..." maxlength="500">${this.escapeHtml(initialDescription)}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-save" disabled>Save</button>
                </div>
            </div>
        `;

        // Add modal styles if not already present
        this.ensureModalStyles();

        // Add to document
        document.body.appendChild(overlay);

        // Get form elements
        const nameInput = overlay.querySelector('#deck-name-input');
        const descriptionInput = overlay.querySelector('#deck-description-input');
        const saveButton = overlay.querySelector('.modal-save');
        const cancelButton = overlay.querySelector('.modal-cancel');
        const closeButton = overlay.querySelector('.modal-close');
        const nameError = overlay.querySelector('#name-error');

        // Validation function
        const validateForm = () => {
            const name = nameInput.value.trim();
            nameError.style.display = 'none';
            nameInput.classList.remove('error');

            if (!name) {
                nameError.textContent = 'Deck name is required';
                nameError.style.display = 'block';
                nameInput.classList.add('error');
                saveButton.disabled = true;
                return false;
            }

            if (name.length > 100) {
                nameError.textContent = 'Deck name must be 100 characters or less';
                nameError.style.display = 'block';
                nameInput.classList.add('error');
                saveButton.disabled = true;
                return false;
            }

            saveButton.disabled = false;
            return true;
        };

        // Set up event listeners
        nameInput.addEventListener('input', validateForm);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !saveButton.disabled) {
                e.preventDefault();
                saveButton.click();
            }
        });

        descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey && !saveButton.disabled) {
                e.preventDefault();
                saveButton.click();
            }
        });

        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (validateForm()) {
                const name = nameInput.value.trim();
                const description = descriptionInput.value.trim();
                
                // Disable form during save
                saveButton.disabled = true;
                saveButton.textContent = 'Saving...';
                nameInput.disabled = true;
                descriptionInput.disabled = true;
                
                try {
                    await onSave(name, description);
                    document.body.removeChild(overlay);
                } catch (error) {
                    // Re-enable form on error
                    saveButton.disabled = false;
                    saveButton.textContent = 'Save';
                    nameInput.disabled = false;
                    descriptionInput.disabled = false;
                    validateForm();
                }
            }
        });

        const closeModal = () => {
            document.body.removeChild(overlay);
        };

        cancelButton.addEventListener('click', closeModal);
        closeButton.addEventListener('click', closeModal);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus name input and validate initial state
        nameInput.focus();
        nameInput.select();
        validateForm();
    }

    /**
     * Create a new deck
     * @param {string} name - Deck name
     * @param {string} description - Deck description
     */
    async createDeck(name, description) {
        try {
            const result = await this.deckManager.createDeck({ name, description });
            
            if (result.success) {
                this.showSuccess(`Deck "${name}" created successfully!`);
                this.loadAndDisplayDecks();
                
                // Trigger event for other components to update
                this.dispatchDeckEvent('deck-created', result.deck);
            } else {
                // Show validation errors in the modal
                throw new Error(result.errors.join(', '));
            }
        } catch (error) {
            console.error('Failed to create deck:', error);
            this.showError(`Failed to create deck: ${error.message}`);
            throw error; // Re-throw to prevent modal from closing
        }
    }

    /**
     * Update an existing deck
     * @param {string} deckId - Deck ID
     * @param {string} name - New deck name
     * @param {string} description - New deck description
     */
    async updateDeck(deckId, name, description) {
        try {
            const result = await this.deckManager.updateDeck(deckId, { name, description });
            
            if (result.success) {
                this.showSuccess(`Deck "${name}" updated successfully!`);
                this.loadAndDisplayDecks();
                
                // Trigger event for other components to update
                this.dispatchDeckEvent('deck-updated', result.deck);
            } else {
                // Show validation errors in the modal
                throw new Error(result.errors.join(', '));
            }
        } catch (error) {
            console.error('Failed to update deck:', error);
            this.showError(`Failed to update deck: ${error.message}`);
            throw error; // Re-throw to prevent modal from closing
        }
    }

    /**
     * Ensure modal styles are present in the document
     */
    ensureModalStyles() {
        if (document.getElementById('deck-modal-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'deck-modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .modal-dialog {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-header {
                padding: 1.5rem 1.5rem 1rem;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
                color: #2c3e50;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #7f8c8d;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-close:hover {
                color: #2c3e50;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .modal-footer {
                padding: 1rem 1.5rem 1.5rem;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
            }

            .form-control {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
                font-family: inherit;
                transition: border-color 0.3s ease;
            }

            .form-control:focus {
                outline: none;
                border-color: #3498db;
            }

            .form-control.error {
                border-color: #e74c3c;
                background-color: #fdf2f2;
            }

            .form-control.error:focus {
                border-color: #c0392b;
                box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
            }

            .empty-state {
                padding: 3rem 2rem;
                color: #7f8c8d;
            }

            .empty-state h3 {
                margin-bottom: 1rem;
                color: #2c3e50;
            }

            .empty-state p {
                margin-bottom: 1.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show success message
     * @param {string} message - The success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - The error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show a message to the user
     * @param {string} message - The message to show
     * @param {string} type - The message type ('success' or 'error')
     */
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.deck-message');
        existingMessages.forEach(element => element.remove());

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `deck-message ${type === 'success' ? 'success-message' : 'error-message'}`;
        messageElement.textContent = message;

        // Insert at the top of the deck view
        const deckView = document.getElementById('decks-view');
        const firstChild = deckView.querySelector('h2').nextSibling;
        deckView.insertBefore(messageElement, firstChild);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    /**
     * Dispatch custom events for deck operations
     * @param {string} eventType - The event type
     * @param {Deck} [deck] - Optional deck data
     */
    dispatchDeckEvent(eventType, deck = null) {
        const event = new CustomEvent(eventType, {
            detail: {
                deck: deck
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh the deck list (call when decks are updated externally)
     */
    refresh() {
        this.loadAndDisplayDecks();
    }

    /**
     * Get all decks for use by other components (e.g., flashcard creation)
     * @returns {Deck[]} Array of all decks
     */
    getAllDecks() {
        return this.deckManager.getAllDecks();
    }

    /**
     * Get deck by ID for use by other components
     * @param {string} deckId - The deck ID
     * @returns {Deck|null} The deck or null if not found
     */
    getDeck(deckId) {
        return this.deckManager.getDeck(deckId);
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeckManagerUI };
} else {
    // Make available globally for browser use
    window.DeckManagerUI = DeckManagerUI;
}