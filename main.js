/**
 * Flashcard App - Main Application Entry Point
 * 
 * This file serves as the main application controller that coordinates between
 * different components, manages navigation, and handles application initialization.
 * 
 * Requirements: 5.1, 5.2, 5.3 - Provides clear interfaces for all main functions
 */

class FlashcardApp {
    constructor() {
        this.currentView = 'create';
        this.dataService = null;
        this.flashcards = [];
        this.decks = [];
        
        // Component managers
        this.flashcardManager = null;
        this.deckManager = null;
        this.studyManager = null;
        
        // UI components
        this.flashcardCreator = null;
        this.deckManagerUI = null;
        this.studySessionUI = null;
        
        // Application state
        this.isInitialized = false;
        this.initializationError = null;
        
        this.init();
    }

    /**
     * Initialize the application
     * Coordinates all components and handles application startup
     * Requirements: 5.1, 5.2, 5.3 - Initialize all interfaces
     */
    async init() {
        try {
            console.log('🚀 Initializing Flashcard App...');
            
            // Set up basic event listeners first
            this.setupEventListeners();
            
            // Initialize data layer
            await this.initializeData();
            
            // Initialize business logic components
            this.initializeManagers();
            
            // Initialize UI components
            this.initializeUIComponents();
            
            // Set initial view
            this.showView('create');
            
            // Verify initialization
            this.verifyInitialization();
            
            this.isInitialized = true;
            console.log('✅ Flashcard App initialized successfully');
            
        } catch (error) {
            this.initializationError = error;
            console.error('❌ Failed to initialize Flashcard App:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize business logic managers
     * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.4, 3.5
     * @private
     */
    initializeManagers() {
        try {
            if (!this.dataService) {
                throw new Error('DataService not available for manager initialization');
            }

            // Initialize FlashcardManager
            if (typeof FlashcardManager !== 'undefined' && typeof ValidationService !== 'undefined') {
                this.flashcardManager = new FlashcardManager(this.dataService, ValidationService);
                console.log('✅ FlashcardManager initialized');
            } else {
                throw new Error('FlashcardManager or ValidationService not available');
            }
            
            // Initialize DeckManager
            if (typeof DeckManager !== 'undefined') {
                this.deckManager = new DeckManager(this.dataService, ValidationService);
                console.log('✅ DeckManager initialized');
            } else {
                throw new Error('DeckManager not available');
            }
            
            // Initialize StudyManager
            if (typeof StudyManager !== 'undefined') {
                this.studyManager = new StudyManager(this.dataService);
                console.log('✅ StudyManager initialized');
            } else {
                throw new Error('StudyManager not available');
            }
            
        } catch (error) {
            console.error('Failed to initialize managers:', error);
            throw error;
        }
    }

    /**
     * Initialize UI components
     * Requirements: 5.1, 5.2, 5.3 - Initialize all UI interfaces
     * @private
     */
    initializeUIComponents() {
        try {
            // Initialize FlashcardCreator UI
            if (typeof FlashcardCreator !== 'undefined' && this.flashcardManager) {
                this.flashcardCreator = new FlashcardCreator(this.flashcardManager, this.dataService);
                console.log('✅ FlashcardCreator UI initialized');
            } else {
                console.warn('⚠️ FlashcardCreator UI not available');
            }
            
            // Initialize DeckManagerUI
            if (typeof DeckManagerUI !== 'undefined' && this.deckManager) {
                this.deckManagerUI = new DeckManagerUI(this.deckManager, this.dataService);
                console.log('✅ DeckManagerUI initialized');
            } else {
                console.warn('⚠️ DeckManagerUI not available');
            }
            
            // Initialize StudySessionUI
            if (typeof StudySessionUI !== 'undefined' && this.studyManager) {
                this.studySessionUI = new StudySessionUI(this.studyManager, this.dataService);
                // Make it globally available for button callbacks
                window.studySessionUI = this.studySessionUI;
                console.log('✅ StudySessionUI initialized');
            } else {
                console.warn('⚠️ StudySessionUI not available');
            }
            
            // Set up cross-component communication
            this.setupComponentCommunication();
            
        } catch (error) {
            console.error('Failed to initialize UI components:', error);
            throw error;
        }
    }

    /**
     * Set up communication between components
     * @private
     */
    setupComponentCommunication() {
        // Listen for deck events to update UI components
        document.addEventListener('deck-created', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('deck-updated', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('deck-deleted', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('flashcard-saved', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('flashcard-deleted', () => {
            this.refreshAllComponents();
        });

        // Listen for study session requests
        document.addEventListener('deck-study-requested', (event) => {
            const deck = event.detail.deck;
            if (deck && this.studySessionUI) {
                this.showView('study');
                // The StudySessionUI will handle starting the session
            }
        });
    }

    /**
     * Refresh all components to reflect data changes
     * @private
     */
    refreshAllComponents() {
        try {
            // Refresh FlashcardCreator (deck selector)
            if (this.flashcardCreator && typeof this.flashcardCreator.refreshDecks === 'function') {
                this.flashcardCreator.refreshDecks();
            }
            
            // Refresh DeckManagerUI
            if (this.deckManagerUI && typeof this.deckManagerUI.refresh === 'function') {
                this.deckManagerUI.refresh();
            }
            
            // Refresh StudySessionUI
            if (this.studySessionUI && typeof this.studySessionUI.refresh === 'function') {
                this.studySessionUI.refresh();
            }
            
            // Reload data for main app
            this.loadExistingData();
            
        } catch (error) {
            console.error('Error refreshing components:', error);
        }
    }

    /**
     * Verify that all components initialized correctly
     * @private
     */
    verifyInitialization() {
        const verificationResults = {
            dataModels: typeof Flashcard !== 'undefined' && typeof Deck !== 'undefined',
            validationService: typeof ValidationService !== 'undefined',
            dataService: this.dataService !== null,
            flashcardManager: this.flashcardManager !== null,
            deckManager: this.deckManager !== null,
            studyManager: this.studyManager !== null,
            flashcardCreator: this.flashcardCreator !== null,
            deckManagerUI: this.deckManagerUI !== null,
            studySessionUI: this.studySessionUI !== null
        };

        console.log('🔍 Initialization verification:', verificationResults);

        // Check for critical failures
        const criticalComponents = ['dataModels', 'validationService', 'dataService'];
        const criticalFailures = criticalComponents.filter(component => !verificationResults[component]);
        
        if (criticalFailures.length > 0) {
            throw new Error(`Critical components failed to initialize: ${criticalFailures.join(', ')}`);
        }

        // Log warnings for non-critical failures
        const optionalComponents = ['flashcardCreator', 'deckManagerUI', 'studySessionUI'];
        const optionalFailures = optionalComponents.filter(component => !verificationResults[component]);
        
        if (optionalFailures.length > 0) {
            console.warn(`⚠️ Some UI components not available: ${optionalFailures.join(', ')}`);
            console.warn('Application will run with reduced functionality');
        }

        return verificationResults;
    }

    /**
     * Handle initialization errors
     * @param {Error} error - The initialization error
     * @private
     */
    handleInitializationError(error) {
        // Show error message to user
        this.showGlobalError(`Failed to initialize application: ${error.message}`);
        
        // Try to initialize with minimal functionality
        try {
            console.log('Attempting minimal initialization...');
            this.initializeMinimal();
        } catch (minimalError) {
            console.error('Minimal initialization also failed:', minimalError);
            this.showGlobalError('Application failed to start. Please refresh the page.');
        }
    }

    /**
     * Initialize with minimal functionality as fallback
     * @private
     */
    initializeMinimal() {
        // Initialize empty data structures
        this.flashcards = [];
        this.decks = [];
        
        // Show basic UI
        this.showView('create');
        
        console.log('Running in minimal mode with limited functionality');
    }

    /**
     * Show global error message to user
     * @param {string} message - Error message to display
     * @private
     */
    showGlobalError(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.global-error');
        existingErrors.forEach(element => element.remove());

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'global-error error-message';
        errorElement.innerHTML = `
            <strong>Application Error:</strong> ${message}
            <button onclick="location.reload()" style="margin-left: 1rem;">Refresh Page</button>
        `;

        // Insert at the top of the app
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.insertBefore(errorElement, appContainer.firstChild);
        }
    }

    /**
     * Initialize data service and load existing data from storage
     * Handles empty/corrupted data scenarios gracefully
     * Requirements: 4.3
     */
    async initializeData() {
        try {
            // Initialize DataService
            if (typeof DataService !== 'undefined') {
                this.dataService = new DataService();
                console.log('✅ DataService initialized successfully');
                
                // Check if storage is available
                if (!this.dataService.isAvailable()) {
                    console.warn('⚠️ Storage is not available. Running in session-only mode.');
                    this.handleStorageUnavailable();
                    return;
                }
                
                // Load existing data
                await this.loadExistingData();
                
            } else {
                console.error('❌ DataService not available');
                this.handleDataServiceUnavailable();
            }
        } catch (error) {
            console.error('Failed to initialize data:', error);
            this.handleDataInitializationError(error);
        }
    }

    /**
     * Load existing flashcards and decks from storage
     * Handles corrupted data scenarios
     * @private
     */
    async loadExistingData() {
        try {
            // Load decks first (flashcards reference decks)
            console.log('Loading existing decks...');
            this.decks = this.dataService.loadAllDecks();
            console.log(`✅ Loaded ${this.decks.length} decks`);
            
            // Load all flashcards
            console.log('Loading existing flashcards...');
            const flashcardData = this.dataService.loadAllFlashcards();
            this.flashcards = flashcardData.map(data => {
                try {
                    return Flashcard.fromJSON(data);
                } catch (error) {
                    console.warn('Skipping corrupted flashcard data:', data, error);
                    return null;
                }
            }).filter(flashcard => flashcard !== null);
            
            console.log(`✅ Loaded ${this.flashcards.length} flashcards`);
            
            // Validate data integrity
            this.validateDataIntegrity();
            
            // Update UI with loaded data
            this.updateUIWithLoadedData();
            
        } catch (error) {
            console.error('Failed to load existing data:', error);
            this.handleCorruptedData(error);
        }
    }

    /**
     * Validate data integrity and clean up orphaned references
     * @private
     */
    validateDataIntegrity() {
        try {
            const deckIds = new Set(this.decks.map(deck => deck.id));
            let orphanedFlashcards = 0;
            
            // Check for flashcards with invalid deck references
            this.flashcards = this.flashcards.filter(flashcard => {
                if (!deckIds.has(flashcard.deckId)) {
                    console.warn(`Removing orphaned flashcard: ${flashcard.id} (references non-existent deck: ${flashcard.deckId})`);
                    orphanedFlashcards++;
                    return false;
                }
                return true;
            });
            
            if (orphanedFlashcards > 0) {
                console.log(`🧹 Cleaned up ${orphanedFlashcards} orphaned flashcards`);
                // Save cleaned data back to storage
                this.saveCleanedData();
            }
            
            // Update deck flashcard counts
            this.updateDeckFlashcardCounts();
            
            console.log('✅ Data integrity validation completed');
            
        } catch (error) {
            console.error('Failed to validate data integrity:', error);
        }
    }

    /**
     * Update deck flashcard counts based on actual flashcards
     * @private
     */
    updateDeckFlashcardCounts() {
        const flashcardsByDeck = new Map();
        
        // Group flashcards by deck
        this.flashcards.forEach(flashcard => {
            if (!flashcardsByDeck.has(flashcard.deckId)) {
                flashcardsByDeck.set(flashcard.deckId, []);
            }
            flashcardsByDeck.get(flashcard.deckId).push(flashcard.id);
        });
        
        // Update deck flashcard IDs
        this.decks.forEach(deck => {
            const actualFlashcardIds = flashcardsByDeck.get(deck.id) || [];
            if (JSON.stringify(deck.flashcardIds.sort()) !== JSON.stringify(actualFlashcardIds.sort())) {
                console.log(`Updating flashcard IDs for deck: ${deck.name}`);
                deck.flashcardIds = actualFlashcardIds;
            }
        });
    }

    /**
     * Save cleaned data back to storage after integrity validation
     * @private
     */
    saveCleanedData() {
        try {
            // Save cleaned flashcards
            this.flashcards.forEach(flashcard => {
                this.dataService.saveFlashcard(flashcard);
            });
            
            // Save updated decks
            this.decks.forEach(deck => {
                this.dataService.saveDeck(deck);
            });
            
            console.log('✅ Cleaned data saved to storage');
        } catch (error) {
            console.error('Failed to save cleaned data:', error);
        }
    }

    /**
     * Update UI components with loaded data
     * @private
     */
    updateUIWithLoadedData() {
        try {
            // Update deck selector in flashcard creation form
            this.updateDeckSelector();
            
            // Update deck list in deck management view
            this.updateDeckList();
            
            console.log('✅ UI updated with loaded data');
        } catch (error) {
            console.error('Failed to update UI with loaded data:', error);
        }
    }

    /**
     * Update the deck selector dropdown with loaded decks
     * @private
     */
    updateDeckSelector() {
        const deckSelect = document.getElementById('deck-select');
        if (deckSelect) {
            // Clear existing options except the first one (placeholder)
            while (deckSelect.children.length > 1) {
                deckSelect.removeChild(deckSelect.lastChild);
            }
            
            // Add options for each deck
            this.decks.forEach(deck => {
                const option = document.createElement('option');
                option.value = deck.id;
                option.textContent = `${deck.name} (${deck.getFlashcardCount()} cards)`;
                deckSelect.appendChild(option);
            });
        }
    }

    /**
     * Update the deck list in the deck management view
     * @private
     */
    updateDeckList() {
        // DeckManagerUI handles this now
        if (this.deckManagerUI) {
            this.deckManagerUI.refresh();
        } else {
            // Fallback logging
            console.log('Deck list update - DeckManagerUI not available');
            this.decks.forEach(deck => {
                console.log(`- ${deck.name}: ${deck.getFlashcardCount()} cards`);
            });
        }
    }

    /**
     * Handle scenario where storage is not available
     * @private
     */
    handleStorageUnavailable() {
        // Initialize empty data structures for session-only mode
        this.flashcards = [];
        this.decks = [];
        
        // Show user notification (could be enhanced with UI notification later)
        console.warn('Running in session-only mode. Data will not be saved between sessions.');
        
        // Could add UI notification here in future tasks
    }

    /**
     * Handle scenario where DataService is not available
     * @private
     */
    handleDataServiceUnavailable() {
        // Initialize empty data structures
        this.flashcards = [];
        this.decks = [];
        
        console.error('DataService not available. Application will run with limited functionality.');
    }

    /**
     * Handle data initialization errors
     * @param {Error} error - The initialization error
     * @private
     */
    handleDataInitializationError(error) {
        console.error('Data initialization failed:', error);
        
        // Initialize empty data structures as fallback
        this.flashcards = [];
        this.decks = [];
        
        // Could add user notification here in future tasks
        console.warn('Falling back to empty data state due to initialization error.');
    }

    /**
     * Handle corrupted data scenarios
     * @param {Error} error - The corruption error
     * @private
     */
    handleCorruptedData(error) {
        console.error('Corrupted data detected:', error);
        
        try {
            // Attempt to recover what we can
            this.flashcards = [];
            this.decks = [];
            
            // Try to load decks individually
            console.log('Attempting individual deck recovery...');
            // This would require additional DataService methods for individual recovery
            // For now, start with empty state
            
            console.warn('Data recovery completed. Starting with empty state.');
            
        } catch (recoveryError) {
            console.error('Data recovery failed:', recoveryError);
            this.flashcards = [];
            this.decks = [];
        }
    }

    /**
     * Get all loaded flashcards
     * @returns {Flashcard[]} Array of loaded flashcards
     */
    getFlashcards() {
        return this.flashcards;
    }

    /**
     * Get all loaded decks
     * @returns {Deck[]} Array of loaded decks
     */
    getDecks() {
        return this.decks;
    }

    /**
     * Get the data service instance
     * @returns {DataService|null} The data service instance or null if not available
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Set up event listeners for navigation and basic interactions
     */
    setupEventListeners() {
        // Navigation event listeners
        document.getElementById('nav-create').addEventListener('click', () => {
            this.showView('create');
        });

        document.getElementById('nav-decks').addEventListener('click', () => {
            this.showView('decks');
        });

        document.getElementById('nav-study').addEventListener('click', () => {
            this.showView('study');
        });

        // Basic form event listeners (now handled by FlashcardCreator)
        // The FlashcardCreator component will handle these events directly
        // These are kept as fallbacks in case FlashcardCreator is not available
        document.getElementById('save-flashcard').addEventListener('click', () => {
            if (!this.flashcardCreator) {
                this.handleSaveFlashcard();
            }
        });

        document.getElementById('cancel-flashcard').addEventListener('click', () => {
            if (!this.flashcardCreator) {
                this.handleCancelFlashcard();
            }
        });

        document.getElementById('create-deck').addEventListener('click', () => {
            // DeckManagerUI handles this now
            if (!this.deckManagerUI) {
                this.handleCreateDeck();
            }
        });

        // Study session events are now handled by StudySessionUI component
        // Keep these as fallbacks in case StudySessionUI is not available
        document.getElementById('reveal-answer').addEventListener('click', () => {
            if (!this.studySessionUI) {
                this.handleRevealAnswer();
            }
        });

        document.getElementById('next-card').addEventListener('click', () => {
            if (!this.studySessionUI) {
                this.handleNextCard();
            }
        });

        document.getElementById('prev-card').addEventListener('click', () => {
            if (!this.studySessionUI) {
                this.handlePrevCard();
            }
        });

        document.getElementById('end-study').addEventListener('click', () => {
            if (!this.studySessionUI) {
                this.handleEndStudy();
            }
        });

        // Listen for deck events to update UI components
        document.addEventListener('deck-created', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('deck-updated', () => {
            this.refreshAllComponents();
        });

        document.addEventListener('deck-deleted', () => {
            this.refreshAllComponents();
        });
    }

    /**
     * Show a specific view and update navigation
     * Requirements: 5.1, 5.2, 5.3 - Navigation between different interfaces
     * @param {string} viewName - The name of the view to show ('create', 'decks', 'study')
     */
    showView(viewName) {
        try {
            // Validate view name
            const validViews = ['create', 'decks', 'study'];
            if (!validViews.includes(viewName)) {
                console.error(`Invalid view name: ${viewName}`);
                return;
            }

            // Hide all views
            const views = document.querySelectorAll('.view');
            views.forEach(view => view.classList.remove('active'));

            // Remove active class from all nav buttons
            const navButtons = document.querySelectorAll('.nav-button');
            navButtons.forEach(button => button.classList.remove('active'));

            // Show the selected view
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.classList.add('active');
            } else {
                console.error(`View element not found: ${viewName}-view`);
                return;
            }

            // Activate the corresponding nav button
            const targetNavButton = document.getElementById(`nav-${viewName}`);
            if (targetNavButton) {
                targetNavButton.classList.add('active');
            } else {
                console.warn(`Nav button not found: nav-${viewName}`);
            }

            // Update current view state
            this.currentView = viewName;
            
            // Perform view-specific initialization
            this.onViewChanged(viewName);
            
            console.log(`✅ Switched to ${viewName} view`);
            
        } catch (error) {
            console.error(`Failed to show view ${viewName}:`, error);
        }
    }

    /**
     * Handle view change events
     * @param {string} viewName - The name of the new view
     * @private
     */
    onViewChanged(viewName) {
        try {
            switch (viewName) {
                case 'create':
                    // Refresh deck selector when entering create view
                    if (this.flashcardCreator && typeof this.flashcardCreator.refreshDecks === 'function') {
                        this.flashcardCreator.refreshDecks();
                    }
                    break;
                    
                case 'decks':
                    // Refresh deck list when entering deck management view
                    if (this.deckManagerUI && typeof this.deckManagerUI.refresh === 'function') {
                        this.deckManagerUI.refresh();
                    }
                    break;
                    
                case 'study':
                    // Refresh available decks when entering study view
                    if (this.studySessionUI && typeof this.studySessionUI.refresh === 'function') {
                        this.studySessionUI.refresh();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error handling view change to ${viewName}:`, error);
        }
    }

    /**
     * Handle save flashcard action (fallback - FlashcardCreator handles this)
     */
    handleSaveFlashcard() {
        console.log('Save flashcard clicked - handled by FlashcardCreator component');
        if (this.flashcardCreator) {
            // FlashcardCreator should handle this
            console.log('FlashcardCreator is available and should handle save');
        } else {
            console.log('FlashcardCreator not available - using fallback');
            // Basic fallback functionality
            const questionInput = document.getElementById('question-input');
            const answerInput = document.getElementById('answer-input');
            const deckSelect = document.getElementById('deck-select');
            
            if (!questionInput.value.trim() || !answerInput.value.trim() || !deckSelect.value) {
                alert('Please fill in all fields');
                return;
            }
            
            alert('Flashcard would be saved (FlashcardCreator not available)');
        }
    }

    /**
     * Handle cancel flashcard action
     */
    handleCancelFlashcard() {
        // Clear form fields
        document.getElementById('question-input').value = '';
        document.getElementById('answer-input').value = '';
        document.getElementById('deck-select').selectedIndex = 0;
        console.log('Flashcard form cleared');
    }

    /**
     * Handle create deck action (placeholder for now)
     */
    handleCreateDeck() {
        console.log('Create deck clicked - functionality to be implemented');
        // TODO: Implement in later tasks
    }

    /**
     * Handle reveal answer action (placeholder for now)
     */
    handleRevealAnswer() {
        console.log('Reveal answer clicked - functionality to be implemented');
        // TODO: Implement in later tasks
    }

    /**
     * Handle next card action (placeholder for now)
     */
    handleNextCard() {
        console.log('Next card clicked - functionality to be implemented');
        // TODO: Implement in later tasks
    }

    /**
     * Handle previous card action (placeholder for now)
     */
    handlePrevCard() {
        console.log('Previous card clicked - functionality to be implemented');
        // TODO: Implement in later tasks
    }

    /**
     * Handle end study session action (placeholder for now)
     */
    handleEndStudy() {
        console.log('End study clicked - functionality to be implemented');
        // TODO: Implement in later tasks
    }

    /**
     * Get the current application state
     * @returns {Object} Current application state
     */
    getApplicationState() {
        return {
            isInitialized: this.isInitialized,
            initializationError: this.initializationError,
            currentView: this.currentView,
            hasDataService: this.dataService !== null,
            hasFlashcardManager: this.flashcardManager !== null,
            hasDeckManager: this.deckManager !== null,
            hasStudyManager: this.studyManager !== null,
            hasFlashcardCreator: this.flashcardCreator !== null,
            hasDeckManagerUI: this.deckManagerUI !== null,
            hasStudySessionUI: this.studySessionUI !== null,
            flashcardCount: this.flashcards.length,
            deckCount: this.decks.length
        };
    }

    /**
     * Get component instances for external access
     * @returns {Object} Object containing all component instances
     */
    getComponents() {
        return {
            dataService: this.dataService,
            flashcardManager: this.flashcardManager,
            deckManager: this.deckManager,
            studyManager: this.studyManager,
            flashcardCreator: this.flashcardCreator,
            deckManagerUI: this.deckManagerUI,
            studySessionUI: this.studySessionUI
        };
    }

    /**
     * Navigate to a specific view programmatically
     * @param {string} viewName - The view to navigate to
     * @returns {boolean} True if navigation was successful
     */
    navigateTo(viewName) {
        try {
            this.showView(viewName);
            return true;
        } catch (error) {
            console.error(`Failed to navigate to ${viewName}:`, error);
            return false;
        }
    }

    /**
     * Check if the application is ready for use
     * @returns {boolean} True if application is fully initialized and ready
     */
    isReady() {
        return this.isInitialized && 
               this.initializationError === null && 
               this.dataService !== null;
    }

    /**
     * Restart the application (useful for error recovery)
     */
    async restart() {
        try {
            console.log('🔄 Restarting Flashcard App...');
            
            // Reset state
            this.isInitialized = false;
            this.initializationError = null;
            
            // Clear existing components
            this.flashcardManager = null;
            this.deckManager = null;
            this.studyManager = null;
            this.flashcardCreator = null;
            this.deckManagerUI = null;
            this.studySessionUI = null;
            
            // Reinitialize
            await this.init();
            
        } catch (error) {
            console.error('Failed to restart application:', error);
            this.showGlobalError('Failed to restart application. Please refresh the page.');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flashcardApp = new FlashcardApp();
});

// Export for potential testing (if using modules later)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardApp;
}