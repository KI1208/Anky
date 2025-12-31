/**
 * StudySession UI Component for Flashcard App
 * 
 * This component manages the user interface for study sessions.
 * It handles flashcard display, question/answer reveal, navigation controls,
 * and progress indicators.
 * 
 * Requirements: 3.2, 3.3, 5.3, 5.4, 5.5
 */

class StudySessionUI {
    /**
     * Create a new StudySessionUI component
     * @param {StudyManager} studyManager - The study manager instance
     * @param {DataService} dataService - The data service instance
     */
    constructor(studyManager, dataService) {
        this.studyManager = studyManager;
        this.dataService = dataService;
        this.currentFlashcard = null;
        this.showingAnswer = false;
        this.availableDecks = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadAvailableDecks();
        this.updateUI();
    }

    /**
     * Initialize DOM element references
     * @private
     */
    initializeElements() {
        // Study view elements
        this.studyView = document.getElementById('study-view');
        this.studyContainer = this.studyView.querySelector('.study-container');
        
        // Progress elements
        this.progressIndicator = document.getElementById('study-progress');
        this.currentCardSpan = document.getElementById('current-card');
        this.totalCardsSpan = document.getElementById('total-cards');
        
        // Flashcard display elements
        this.flashcardDisplay = document.getElementById('flashcard-display');
        this.cardContent = document.getElementById('card-content');
        this.cardText = document.getElementById('card-text');
        this.revealButton = document.getElementById('reveal-answer');
        
        // Navigation elements
        this.prevButton = document.getElementById('prev-card');
        this.nextButton = document.getElementById('next-card');
        this.endButton = document.getElementById('end-study');
        
        // Create deck selection UI if not exists
        this.createDeckSelectionUI();
    }

    /**
     * Create deck selection UI for starting study sessions
     * @private
     */
    createDeckSelectionUI() {
        // Check if deck selection already exists
        let deckSelection = this.studyView.querySelector('.deck-selection');
        
        if (!deckSelection) {
            deckSelection = document.createElement('div');
            deckSelection.className = 'deck-selection';
            deckSelection.innerHTML = `
                <h3>Select a Deck to Study</h3>
                <div class="deck-selection-list">
                    <p class="no-decks-message">No decks available. Create some flashcards first!</p>
                </div>
            `;
            
            // Insert before study container
            this.studyView.insertBefore(deckSelection, this.studyContainer);
        }
        
        this.deckSelection = deckSelection;
        this.deckSelectionList = deckSelection.querySelector('.deck-selection-list');
        this.noDecksMessage = deckSelection.querySelector('.no-decks-message');
    }

    /**
     * Set up event listeners for UI interactions
     * @private
     */
    setupEventListeners() {
        // Reveal answer button
        this.revealButton.addEventListener('click', () => {
            this.handleRevealAnswer();
        });

        // Navigation buttons
        this.nextButton.addEventListener('click', () => {
            this.handleNextCard();
        });

        this.prevButton.addEventListener('click', () => {
            this.handlePreviousCard();
        });

        // End study session button
        this.endButton.addEventListener('click', () => {
            this.handleEndSession();
        });

        // Listen for deck updates to refresh available decks
        document.addEventListener('deck-created', () => {
            this.loadAvailableDecks();
        });

        document.addEventListener('deck-updated', () => {
            this.loadAvailableDecks();
        });

        document.addEventListener('deck-deleted', () => {
            this.loadAvailableDecks();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            // Only handle keyboard events when study view is active
            if (!this.studyView.classList.contains('active')) {
                return;
            }

            switch (event.key) {
                case ' ':
                case 'Enter':
                    event.preventDefault();
                    if (this.showingAnswer) {
                        this.handleNextCard();
                    } else {
                        this.handleRevealAnswer();
                    }
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.handlePreviousCard();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.handleNextCard();
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.handleEndSession();
                    break;
            }
        });
    }

    /**
     * Load available decks for study selection
     * @private
     */
    loadAvailableDecks() {
        try {
            const allDecks = this.dataService.loadAllDecks();
            
            // Filter decks that have flashcards
            this.availableDecks = allDecks.filter(deck => {
                const flashcards = this.dataService.loadFlashcardsForDeck(deck.id);
                return flashcards.length > 0;
            });

            this.updateDeckSelection();
        } catch (error) {
            console.error('Failed to load available decks:', error);
            this.availableDecks = [];
            this.updateDeckSelection();
        }
    }

    /**
     * Update the deck selection UI
     * @private
     */
    updateDeckSelection() {
        if (this.availableDecks.length === 0) {
            this.noDecksMessage.style.display = 'block';
            this.deckSelectionList.innerHTML = '<p class="no-decks-message">No decks with flashcards available. Create some flashcards first!</p>';
            return;
        }

        this.noDecksMessage.style.display = 'none';
        
        const deckButtons = this.availableDecks.map(deck => {
            const flashcardCount = this.dataService.loadFlashcardsForDeck(deck.id).length;
            return `
                <button class="deck-study-button btn btn-primary" data-deck-id="${deck.id}">
                    <div class="deck-study-info">
                        <h4>${this.escapeHtml(deck.name)}</h4>
                        <p>${flashcardCount} card${flashcardCount !== 1 ? 's' : ''}</p>
                        ${deck.description ? `<p class="deck-description">${this.escapeHtml(deck.description)}</p>` : ''}
                    </div>
                </button>
            `;
        }).join('');

        this.deckSelectionList.innerHTML = deckButtons;

        // Add event listeners to deck buttons
        this.deckSelectionList.querySelectorAll('.deck-study-button').forEach(button => {
            button.addEventListener('click', () => {
                const deckId = button.getAttribute('data-deck-id');
                this.startStudySession(deckId);
            });
        });
    }

    /**
     * Start a study session for the specified deck
     * @param {string} deckId - The deck ID to study
     */
    async startStudySession(deckId) {
        try {
            const result = await this.studyManager.startStudySession(deckId);
            
            if (!result.success) {
                this.showError(result.errors.join(', '));
                return;
            }

            // Hide deck selection and show study interface
            this.deckSelection.style.display = 'none';
            this.studyContainer.style.display = 'block';

            // Load and display the first flashcard
            await this.loadCurrentFlashcard();
            this.updateUI();

        } catch (error) {
            console.error('Failed to start study session:', error);
            this.showError('Failed to start study session. Please try again.');
        }
    }

    /**
     * Load the current flashcard from the study session
     * @private
     */
    async loadCurrentFlashcard() {
        try {
            const result = await this.studyManager.getCurrentFlashcard();
            
            if (result.success) {
                this.currentFlashcard = result.flashcard;
                this.showingAnswer = false;
                this.displayQuestion();
            } else {
                console.error('Failed to load current flashcard:', result.errors);
                this.currentFlashcard = null;
            }
        } catch (error) {
            console.error('Error loading current flashcard:', error);
            this.currentFlashcard = null;
        }
    }

    /**
     * Display the question side of the current flashcard
     * Requirements: 3.2 - Initially show only the question
     * @private
     */
    displayQuestion() {
        if (!this.currentFlashcard) {
            this.cardText.textContent = 'No flashcard available';
            this.revealButton.style.display = 'none';
            return;
        }

        this.cardText.textContent = this.currentFlashcard.question;
        this.revealButton.textContent = 'Reveal Answer';
        this.revealButton.style.display = 'block';
        this.showingAnswer = false;

        // Add visual indication that this is the question
        this.cardContent.className = 'card-content question-side';
    }

    /**
     * Display the answer side of the current flashcard
     * Requirements: 3.3 - Display answer text when revealed
     * @private
     */
    displayAnswer() {
        if (!this.currentFlashcard) {
            return;
        }

        this.cardText.textContent = this.currentFlashcard.answer;
        this.revealButton.textContent = 'Next Card';
        this.showingAnswer = true;

        // Add visual indication that this is the answer
        this.cardContent.className = 'card-content answer-side';
    }

    /**
     * Handle reveal answer button click
     * Requirements: 3.3 - Answer reveal functionality
     * @private
     */
    handleRevealAnswer() {
        if (!this.showingAnswer) {
            this.displayAnswer();
        } else {
            // If already showing answer, treat as "next card"
            this.handleNextCard();
        }
    }

    /**
     * Handle next card navigation
     * Requirements: 5.5 - Navigation controls
     * @private
     */
    async handleNextCard() {
        try {
            const result = await this.studyManager.nextFlashcard();
            
            if (result.success) {
                if (result.isComplete) {
                    this.handleSessionComplete();
                } else {
                    await this.loadCurrentFlashcard();
                    this.updateUI();
                }
            } else {
                console.error('Failed to navigate to next card:', result.errors);
            }
        } catch (error) {
            console.error('Error navigating to next card:', error);
        }
    }

    /**
     * Handle previous card navigation
     * Requirements: 5.5 - Navigation controls
     * @private
     */
    async handlePreviousCard() {
        try {
            const result = await this.studyManager.previousFlashcard();
            
            if (result.success) {
                await this.loadCurrentFlashcard();
                this.updateUI();
            } else {
                console.error('Failed to navigate to previous card:', result.errors);
            }
        } catch (error) {
            console.error('Error navigating to previous card:', error);
        }
    }

    /**
     * Handle study session completion
     * @private
     */
    handleSessionComplete() {
        this.showSessionSummary();
    }

    /**
     * Handle end session button click
     * @private
     */
    async handleEndSession() {
        if (!this.studyManager.hasActiveSession()) {
            this.returnToSelection();
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to end this study session?');
        if (!confirmed) {
            return;
        }

        try {
            const result = await this.studyManager.endSession();
            
            if (result.success) {
                this.showSessionSummary(result.summary);
            } else {
                console.error('Failed to end session:', result.errors);
                this.returnToSelection();
            }
        } catch (error) {
            console.error('Error ending session:', error);
            this.returnToSelection();
        }
    }

    /**
     * Show session completion summary
     * @param {Object} [summary] - Optional session summary
     * @private
     */
    showSessionSummary(summary = null) {
        if (!summary) {
            // Try to get summary from study manager
            this.studyManager.getSessionSummary().then(result => {
                if (result.success) {
                    this.displaySummary(result.summary);
                } else {
                    this.displayGenericCompletion();
                }
            }).catch(() => {
                this.displayGenericCompletion();
            });
        } else {
            this.displaySummary(summary);
        }
    }

    /**
     * Display the session summary
     * @param {Object} summary - Session summary data
     * @private
     */
    displaySummary(summary) {
        const minutes = Math.floor(summary.duration / 60);
        const seconds = summary.duration % 60;
        const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        this.cardText.innerHTML = `
            <div class="session-summary">
                <h3>Study Session Complete!</h3>
                <div class="summary-stats">
                    <p><strong>Cards Reviewed:</strong> ${summary.reviewedCards} of ${summary.totalCards}</p>
                    <p><strong>Time Spent:</strong> ${timeString}</p>
                    <p><strong>Status:</strong> ${summary.isComplete ? 'Completed' : 'Ended Early'}</p>
                </div>
                <button class="btn btn-primary" onclick="studySessionUI.returnToSelection()">Study Another Deck</button>
            </div>
        `;

        this.revealButton.style.display = 'none';
        this.cardContent.className = 'card-content summary-display';
    }

    /**
     * Display generic completion message
     * @private
     */
    displayGenericCompletion() {
        this.cardText.innerHTML = `
            <div class="session-summary">
                <h3>Study Session Complete!</h3>
                <p>Great job studying!</p>
                <button class="btn btn-primary" onclick="studySessionUI.returnToSelection()">Study Another Deck</button>
            </div>
        `;

        this.revealButton.style.display = 'none';
        this.cardContent.className = 'card-content summary-display';
    }

    /**
     * Return to deck selection view
     */
    returnToSelection() {
        // Reset UI state
        this.currentFlashcard = null;
        this.showingAnswer = false;

        // Show deck selection and hide study interface
        this.deckSelection.style.display = 'block';
        this.studyContainer.style.display = 'none';

        // Refresh available decks
        this.loadAvailableDecks();
    }

    /**
     * Update the UI based on current state
     * Requirements: 5.4 - Progress indicator, 5.5 - Navigation controls
     * @private
     */
    async updateUI() {
        try {
            // Update progress indicator
            await this.updateProgressIndicator();
            
            // Update navigation buttons
            await this.updateNavigationButtons();
            
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    /**
     * Update the progress indicator
     * Requirements: 5.4 - Show progress indicator
     * @private
     */
    async updateProgressIndicator() {
        try {
            const result = await this.studyManager.getSessionProgress();
            
            if (result.success) {
                const progress = result.progress;
                this.currentCardSpan.textContent = progress.currentIndex + 1;
                this.totalCardsSpan.textContent = progress.totalCards;
            } else {
                this.currentCardSpan.textContent = '0';
                this.totalCardsSpan.textContent = '0';
            }
        } catch (error) {
            console.error('Error updating progress indicator:', error);
            this.currentCardSpan.textContent = '0';
            this.totalCardsSpan.textContent = '0';
        }
    }

    /**
     * Update navigation button states
     * Requirements: 5.5 - Navigation controls
     * @private
     */
    async updateNavigationButtons() {
        try {
            const result = await this.studyManager.getSessionProgress();
            
            if (result.success) {
                const progress = result.progress;
                
                // Update previous button
                this.prevButton.disabled = !progress.hasPrevious;
                
                // Update next button
                this.nextButton.disabled = !progress.hasNext;
                
                // Update next button text based on state
                if (this.showingAnswer && !progress.hasNext) {
                    this.nextButton.textContent = 'Complete Session';
                } else {
                    this.nextButton.textContent = 'Next';
                }
            } else {
                this.prevButton.disabled = true;
                this.nextButton.disabled = true;
            }
        } catch (error) {
            console.error('Error updating navigation buttons:', error);
            this.prevButton.disabled = true;
            this.nextButton.disabled = true;
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     * @private
     */
    showError(message) {
        // Create or update error display
        let errorDiv = this.studyView.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            this.studyView.insertBefore(errorDiv, this.studyView.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh the component (reload decks and update UI)
     */
    refresh() {
        this.loadAvailableDecks();
        if (this.studyManager.hasActiveSession()) {
            this.updateUI();
        }
    }

    /**
     * Get the current study session state
     * @returns {Object} Current state information
     */
    getCurrentState() {
        return {
            hasActiveSession: this.studyManager.hasActiveSession(),
            currentFlashcard: this.currentFlashcard,
            showingAnswer: this.showingAnswer,
            availableDecks: this.availableDecks.length
        };
    }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudySessionUI;
} else {
    // Make available globally for browser use
    window.StudySessionUI = StudySessionUI;
}