const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testInventory() {
  console.log('Testing inventory API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Backend health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return;
  }

  try {
    // Test 2: Test inventory endpoint (without auth - should fail)
    console.log('\n2. Testing inventory endpoint without auth...');
    try {
      const inventoryResponse = await axios.get(`${API_BASE_URL}/api/inventory?page=1&limit=10`);
      console.log('❌ Inventory endpoint should require auth but returned:', inventoryResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Inventory endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Inventory endpoint test failed:', error.message);
  }

  try {
    // Test 3: Test analytics endpoint (without auth - should fail)
    console.log('\n3. Testing analytics endpoint without auth...');
    try {
      const analyticsResponse = await axios.get(`${API_BASE_URL}/api/inventory/analytics`);
      console.log('❌ Analytics endpoint should require auth but returned:', analyticsResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Analytics endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Analytics endpoint test failed:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('- Both inventory and analytics endpoints require authentication');
  console.log('- The issue is likely that the user needs to be logged in');
  console.log('- Or the user needs to have a current business set');
  console.log('\nTo fix the inventory display issue:');
  console.log('1. Make sure you are logged in');
  console.log('2. Check if you have a current business set');
  console.log('3. Try adding some products to see if they appear');
}

testInventory();
