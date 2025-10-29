const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testNotifications() {
  console.log('Testing notifications API...\n');

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
    // Test 2: Test notifications endpoint
    console.log('\n2. Testing notifications endpoint...');
    const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications?page=1&limit=10`);
    console.log('✅ Notifications endpoint working');
    console.log('Response data:', {
      notifications: notificationsResponse.data.notifications?.length || 0,
      unreadCount: notificationsResponse.data.unreadCount || 0,
      pagination: notificationsResponse.data.pagination || 'No pagination data'
    });
  } catch (error) {
    console.log('❌ Notifications endpoint failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }

  try {
    // Test 3: Test unread count endpoint
    console.log('\n3. Testing unread count endpoint...');
    const unreadResponse = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`);
    console.log('✅ Unread count endpoint working');
    console.log('Unread count:', unreadResponse.data.unreadCount || 0);
  } catch (error) {
    console.log('❌ Unread count endpoint failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }

  console.log('\nNotifications API test completed!');
}

testNotifications();
