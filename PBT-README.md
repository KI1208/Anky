# Property-Based Testing Framework

This document describes the property-based testing framework setup for the Flashcard App.

## Overview

The framework is configured to run all 13 correctness properties defined in the design document using the fast-check library. Each property test validates specific requirements with a minimum of 100 iterations.

## Framework Components

### 1. Core Files

- **`run-all-property-tests.js`** - Main Node.js test runner
- **`run-all-property-tests.html`** - Browser-based test runner
- **`pbt-config.json`** - Configuration file for all property tests
- **`pbt-generators.js`** - Reusable test data generators
- **`PBT-README.md`** - This documentation file

### 2. Package.json Scripts

```json
{
  "test-pbt": "node run-all-property-tests.js",
  "test-pbt-verbose": "node run-all-property-tests.js --verbose", 
  "test-comprehensive": "npm run test-all && npm run test-pbt"
}
```

### 3. Dependencies

- **fast-check** (v3.15.0) - Property-based testing library

## Usage

### Command Line (Node.js)

```bash
# Run all property tests
npm run test-pbt

# Run with verbose output
npm run test-pbt-verbose

# Run all tests (unit + property-based)
npm run test-comprehensive

# Direct execution
node run-all-property-tests.js
node run-all-property-tests.js --verbose
```

### Browser

1. Open `run-all-property-tests.html` in a web browser
2. Click "🚀 Run All Property Tests" button
3. Toggle verbose mode for detailed output
4. View results in the console output area

## Property Tests

The framework is configured to run these 13 property tests:

| Property | Name | Requirements | Status |
|----------|------|--------------|--------|
| 1 | Flashcard Creation and Storage | 1.1 | ⚠️ Not implemented |
| 2 | Flashcard Content Updates | 1.2 | ⚠️ Not implemented |
| 3 | Flashcard Deletion | 1.3 | ⚠️ Not implemented |
| 4 | Flashcard Validation | 1.4 | ✅ Implemented |
| 5 | Deck Creation with Unique Names | 2.1 | ⚠️ Not implemented |
| 6 | Flashcard-Deck Association Management | 2.2, 2.3 | ⚠️ Not implemented |
| 7 | Duplicate Deck Name Prevention | 2.4 | ⚠️ Not implemented |
| 8 | Study Session Initialization | 3.1 | ⚠️ Not implemented |
| 9 | Initial Question Display | 3.2 | ⚠️ Not implemented |
| 10 | Answer Reveal | 3.3 | ⚠️ Not implemented |
| 11 | Study Session Navigation | 3.4 | ⚠️ Not implemented |
| 12 | Study Session Completion | 3.5 | ⚠️ Not implemented |
| 13 | Data Persistence Round-Trip | 4.1-4.4 | ⚠️ Not implemented |

## Configuration

### Test Configuration (pbt-config.json)

```json
{
  "configuration": {
    "numRuns": 100,
    "maxSkipsPerRun": 100,
    "timeout": 5000,
    "verbose": false
  }
}
```

### Generator Configuration

The `pbt-generators.js` file provides reusable generators for:

- Valid/invalid flashcard data
- Valid/invalid deck data  
- Question/answer text with proper validation rules
- Deck IDs and flashcard ID arrays

## Creating New Property Tests

To implement a new property test:

1. **Create test file** following the naming pattern: `test-property-{name}.js`

2. **Use the template structure**:
```javascript
const fc = require('fast-check');
const { validFlashcardGenerator, PBT_CONFIG } = require('./pbt-generators');

function testPropertyName() {
    console.log('Property X: Property Name');
    console.log('Testing that [property description]...');
    
    fc.assert(
        fc.property(
            validFlashcardGenerator(),
            (testData) => {
                // Test implementation
                // Return true if property holds
                return true;
            }
        ),
        PBT_CONFIG
    );
    
    console.log('✅ Property X passed');
    return true;
}

module.exports = { testPropertyName };
```

3. **Add proper annotations**:
```javascript
/**
 * Property X: Property Name
 * **Feature: flashcard-app, Property X: Property Name**
 * **Validates: Requirements X.Y**
 */
```

4. **Test will be automatically discovered** by the test runner

## Best Practices

### 1. Property Design
- Focus on universal properties that should hold for ALL inputs
- Use "for any" quantification in property descriptions
- Test invariants, round-trip properties, and error conditions

### 2. Generator Usage
- Use provided generators from `pbt-generators.js` for consistency
- Filter generators to create valid/invalid data as needed
- Ensure generators produce realistic test data

### 3. Test Implementation
- Keep tests focused on single properties
- Use descriptive error messages with test data
- Run minimum 100 iterations per property (configured in PBT_CONFIG)

### 4. Error Handling
- Catch and report counter-examples clearly
- Include test data in error messages for debugging
- Use fast-check's built-in shrinking for minimal counter-examples

## Integration with CI/CD

The framework integrates with existing test scripts:

```bash
# Full test suite including property tests
npm run test-comprehensive

# Property tests only
npm run test-pbt
```

Exit codes:
- `0` - All tests passed
- `1` - Some tests failed or errors occurred

## Troubleshooting

### Common Issues

1. **Test file not found**: Ensure test files follow naming convention and are in root directory
2. **Generator errors**: Check that generators produce valid data for your use case
3. **Timeout errors**: Increase timeout in `pbt-config.json` for complex properties
4. **Memory issues**: Reduce `numRuns` for memory-intensive tests

### Debugging

Use verbose mode to see detailed output:
```bash
npm run test-pbt-verbose
```

Or enable verbose in browser test runner for stack traces and detailed error information.

## Next Steps

1. Implement remaining 12 property tests
2. Add integration with continuous integration
3. Consider adding performance property tests
4. Extend generators for more complex test scenarios