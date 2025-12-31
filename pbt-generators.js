/**
 * Property-Based Test Generators
 * 
 * Reusable generators for creating test data across all property-based tests.
 * Uses fast-check library for generating random test data.
 */

const fc = require('fast-check');

/**
 * Generator for valid flashcard question text
 */
const validQuestionGenerator = () => 
    fc.string({ minLength: 1, maxLength: 500 })
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

/**
 * Generator for valid flashcard answer text
 */
const validAnswerGenerator = () => 
    fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

/**
 * Generator for valid deck names
 */
const validDeckNameGenerator = () => 
    fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

/**
 * Generator for valid deck IDs
 */
const validDeckIdGenerator = () => 
    fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0);

/**
 * Generator for invalid (empty/whitespace) strings
 */
const invalidStringGenerator = () => 
    fc.oneof(
        fc.constant(''),           // Empty string
        fc.constant('   '),        // Only spaces
        fc.constant('\t'),         // Only tab
        fc.constant('\n'),         // Only newline
        fc.constant('  \t  \n  '), // Mixed whitespace
        fc.constant(null),         // Null value
        fc.constant(undefined)     // Undefined value
    );

/**
 * Generator for valid flashcard data
 */
const validFlashcardGenerator = () => 
    fc.record({
        question: validQuestionGenerator(),
        answer: validAnswerGenerator(),
        deckId: validDeckIdGenerator()
    });
/**
 * Generator for invalid flashcard data (empty/whitespace question or answer)
 */
const invalidFlashcardGenerator = () => 
    fc.oneof(
        // Invalid question, valid answer
        fc.record({
            question: invalidStringGenerator(),
            answer: validAnswerGenerator(),
            deckId: validDeckIdGenerator()
        }),
        // Valid question, invalid answer
        fc.record({
            question: validQuestionGenerator(),
            answer: invalidStringGenerator(),
            deckId: validDeckIdGenerator()
        }),
        // Both invalid
        fc.record({
            question: invalidStringGenerator(),
            answer: invalidStringGenerator(),
            deckId: validDeckIdGenerator()
        })
    );

/**
 * Generator for valid deck data
 */
const validDeckGenerator = () => 
    fc.record({
        name: validDeckNameGenerator(),
        description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
    });

/**
 * Generator for flashcard IDs
 */
const flashcardIdGenerator = () => 
    fc.string({ minLength: 1, maxLength: 50 });

/**
 * Generator for arrays of flashcard IDs
 */
const flashcardIdsArrayGenerator = () => 
    fc.array(flashcardIdGenerator(), { minLength: 0, maxLength: 20 });

/**
 * Configuration for property-based tests
 */
const PBT_CONFIG = {
    numRuns: 100,           // Minimum iterations as specified in design
    maxSkipsPerRun: 100,
    timeout: 5000,
    verbose: false
};

module.exports = {
    // Generators
    validQuestionGenerator,
    validAnswerGenerator,
    validDeckNameGenerator,
    validDeckIdGenerator,
    invalidStringGenerator,
    validFlashcardGenerator,
    invalidFlashcardGenerator,
    validDeckGenerator,
    flashcardIdGenerator,
    flashcardIdsArrayGenerator,
    
    // Configuration
    PBT_CONFIG,
    
    // Fast-check reference for convenience
    fc
};