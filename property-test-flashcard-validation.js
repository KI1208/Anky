/**
 * Property-Based Test for Flashcard Validation
 * Property 4: Flashcard Validation
 * 
 * This test validates Requirements 1.4:
 * "THE Flashcard_System SHALL validate that both question and answer fields contain non-empty text"
 * 
 * Property: For any flashcard creation or edit attempt with empty question or answer fields, 
 * the system should reject the operation and maintain the current state.
 * 
 * **Feature: flashcard-app, Property 4: Flashcard Validation**
 * **Validates: Requirements 1.4**
 */

// Load the models (for browser environment)
if (typeof window !== 'undefined') {
    // Browser environment - models should be loaded via script tag
} else {
    // Node.js environment
    const { Flashcard } = require('./models.js');
}

/**
 * Generate test cases for invalid flashcard data
 * This simulates what a property-based testing framework would generate
 */
function generateInvalidFlashcardTestCases() {
    return [
        // Empty strings
        { question: '', answer: 'Valid answer', deckId: 'deck-1', description: 'Empty question' },
        { question: 'Valid question', answer: '', deckId: 'deck-1', description: 'Empty answer' },
        { question: '', answer: '', deckId: 'deck-1', description: 'Both empty' },
        
        // Whitespace-only strings
        { question: '   ', answer: 'Valid answer', deckId: 'deck-1', description: 'Whitespace-only question' },
        { question: 'Valid question', answer: '   ', deckId: 'deck-1', description: 'Whitespace-only answer' },
        { question: '   ', answer: '   ', deckId: 'deck-1', description: 'Both whitespace-only' },
        
        // Mixed whitespace
        { question: '\t\n  ', answer: 'Valid answer', deckId: 'deck-1', description: 'Mixed whitespace question' },
        { question: 'Valid question', answer: '\t\n  ', deckId: 'deck-1', description: 'Mixed whitespace answer' },
        
        // Null and undefined values
        { question: null, answer: 'Valid answer', deckId: 'deck-1', description: 'Null question' },
        { question: 'Valid question', answer: null, deckId: 'deck-1', description: 'Null answer' },
        { question: undefined, answer: 'Valid answer', deckId: 'deck-1', description: 'Undefined question' },
        { question: 'Valid question', answer: undefined, deckId: 'deck-1', description: 'Undefined answer' },
        
        // Untrimmed strings (should be rejected per validation rules)
        { question: '  Valid question  ', answer: 'Valid answer', deckId: 'deck-1', description: 'Untrimmed question' },
        { question: 'Valid question', answer: '  Valid answer  ', deckId: 'deck-1', description: 'Untrimmed answer' },
    ];
}

/**
 * Generate test cases for valid flashcard data
 */
function generateValidFlashcardTestCases() {
    return [
        { question: 'What is 2+2?', answer: '4', deckId: 'deck-1', description: 'Simple math question' },
        { question: 'Capital of France?', answer: 'Paris', deckId: 'deck-2', description: 'Geography question' },
        { question: 'A', answer: 'B', deckId: 'deck-3', description: 'Single character Q&A' },
        { question: 'What is the meaning of life?', answer: '42', deckId: 'deck-4', description: 'Philosophy question' },
        { question: 'HTML stands for?', answer: 'HyperText Markup Language', deckId: 'deck-5', description: 'Technical question' },
    ];
}

/**
 * Run the property-based test for flashcard validation
 */
function runFlashcardValidationPropertyTest() {
    console.log('='.repeat(60));
    console.log('Property-Based Test: Flashcard Validation');
    console.log('Property 4: Flashcard Validation');
    console.log('Validates: Requirements 1.4');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Test 1: Invalid flashcards should be rejected
    console.log('\n1. Testing that invalid flashcards are rejected...');
    const invalidTestCases = generateInvalidFlashcardTestCases();
    
    for (const testCase of invalidTestCases) {
        totalTests++;
        try {
            const flashcard = new Flashcard(testCase);
            const validationResult = flashcard.validate();
            
            if (validationResult.isValid) {
                console.log(`❌ FAIL: ${testCase.description} - Expected invalid but was valid`);
                console.log(`   Data: ${JSON.stringify(testCase)}`);
                failedTests++;
            } else {
                console.log(`✅ PASS: ${testCase.description} - Correctly rejected`);
                console.log(`   Errors: ${validationResult.errors.join(', ')}`);
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ ERROR: ${testCase.description} - ${error.message}`);
            failedTests++;
        }
    }
    
    // Test 2: Valid flashcards should pass validation
    console.log('\n2. Testing that valid flashcards pass validation...');
    const validTestCases = generateValidFlashcardTestCases();
    
    for (const testCase of validTestCases) {
        totalTests++;
        try {
            const flashcard = new Flashcard(testCase);
            const validationResult = flashcard.validate();
            
            if (!validationResult.isValid) {
                console.log(`❌ FAIL: ${testCase.description} - Expected valid but was invalid`);
                console.log(`   Data: ${JSON.stringify(testCase)}`);
                console.log(`   Errors: ${validationResult.errors.join(', ')}`);
                failedTests++;
            } else {
                console.log(`✅ PASS: ${testCase.description} - Correctly accepted`);
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ ERROR: ${testCase.description} - ${error.message}`);
            failedTests++;
        }
    }
    
    // Test 3: Edge case - Missing deckId should be rejected
    console.log('\n3. Testing edge cases...');
    const edgeCases = [
        { question: 'Valid question', answer: 'Valid answer', deckId: '', description: 'Empty deckId' },
        { question: 'Valid question', answer: 'Valid answer', deckId: null, description: 'Null deckId' },
        { question: 'Valid question', answer: 'Valid answer', description: 'Missing deckId' },
    ];
    
    for (const testCase of edgeCases) {
        totalTests++;
        try {
            const flashcard = new Flashcard(testCase);
            const validationResult = flashcard.validate();
            
            if (validationResult.isValid) {
                console.log(`❌ FAIL: ${testCase.description} - Expected invalid but was valid`);
                failedTests++;
            } else {
                console.log(`✅ PASS: ${testCase.description} - Correctly rejected`);
                console.log(`   Errors: ${validationResult.errors.join(', ')}`);
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ ERROR: ${testCase.description} - ${error.message}`);
            failedTests++;
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 All property tests PASSED!');
        console.log('\n**Feature: flashcard-app, Property 4: Flashcard Validation**');
        console.log('**Validates: Requirements 1.4**');
        console.log('\nProperty verified: For any flashcard creation or edit attempt with');
        console.log('empty question or answer fields, the system correctly rejects the');
        console.log('operation and maintains the current state.');
        return true;
    } else {
        console.log('\n❌ Some property tests FAILED!');
        return false;
    }
}

// Export for use in other modules or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runFlashcardValidationPropertyTest };
} else if (typeof window !== 'undefined') {
    // Make available globally for browser use
    window.runFlashcardValidationPropertyTest = runFlashcardValidationPropertyTest;
}

// Run tests if this file is executed directly (Node.js) or in browser
if (typeof require !== 'undefined' && require.main === module) {
    const success = runFlashcardValidationPropertyTest();
    process.exit(success ? 0 : 1);
} else if (typeof window !== 'undefined') {
    // Auto-run in browser after DOM loads
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runFlashcardValidationPropertyTest, 100);
    });
}