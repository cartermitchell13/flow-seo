require('dotenv').config();
const { apiKeysController } = require('./test-utils/api-keys');

/**
 * Test script for API key encryption and storage
 * Tests:
 * 1. Saving an API key
 * 2. Retrieving the same API key
 * 3. Getting selected provider
 * 4. Verifying encryption (keys should never be stored in plain text)
 */

async function runTests() {
    console.log('\nTesting API Key Encryption System');
    console.log('--------------------------------');

    const testData = {
        userId: 'test-user-123',
        siteId: 'test-site-456',
        provider: 'openai',
        apiKey: 'sk-test-key-789'
    };

    try {
        // Test 1: Save API Key
        console.log('\n1. Testing API Key Storage...');
        await apiKeysController.saveApiKey(
            testData.userId,
            testData.siteId,
            testData.provider,
            testData.apiKey
        );
        console.log('✓ Successfully saved API key');

        // Test 2: Retrieve API Key
        console.log('\n2. Testing API Key Retrieval...');
        const retrievedKey = await apiKeysController.getApiKey(
            testData.userId,
            testData.siteId,
            testData.provider
        );
        
        if (retrievedKey === testData.apiKey) {
            console.log('✓ Successfully retrieved and decrypted API key');
            console.log(`Original:  ${testData.apiKey}`);
            console.log(`Retrieved: ${retrievedKey}`);
        } else {
            throw new Error('Retrieved key does not match original key');
        }

        // Test 3: Get Selected Provider
        console.log('\n3. Testing Provider Selection...');
        const provider = await apiKeysController.getSelectedProvider(
            testData.userId,
            testData.siteId
        );
        
        if (provider === testData.provider) {
            console.log('✓ Successfully retrieved selected provider');
            console.log(`Provider: ${provider}`);
        } else {
            throw new Error('Retrieved provider does not match');
        }

        // Test 4: Verify Database Encryption
        console.log('\n4. Verifying Database Encryption...');
        const db = require('./test-utils/database');
        const rawData = await db.getApiKey(
            testData.userId,
            testData.siteId,
            testData.provider
        );

        if (rawData && !rawData.includes(testData.apiKey)) {
            console.log('✓ API key is properly encrypted in database');
            console.log(`Encrypted data: ${rawData.substring(0, 50)}...`);
        } else {
            throw new Error('API key might not be properly encrypted');
        }

        console.log('\n✨ All tests passed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

runTests();
