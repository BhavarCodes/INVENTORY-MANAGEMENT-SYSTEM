const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testDirectAuth() {
  console.log('Testing direct authentication (bypassing proxy)...\n');

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
    // Test 2: Register a test user
    console.log('\n2. Testing user registration...');
    const registerData = {
      name: 'Test User Direct',
      email: 'testdirect@example.com',
      password: 'password123',
      phone: '1234567890'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    
    const token = registerResponse.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test 3: Test protected route with token
    console.log('\n3. Testing protected route...');
    const meResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route access successful');
    console.log('User data:', meResponse.data.user.name, meResponse.data.user.email);

    // Test 4: Test login
    console.log('\n4. Testing user login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'testdirect@example.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);

    console.log('\n🎉 All direct authentication tests passed!');
    console.log('\nThe backend is working correctly. The issue is with the frontend proxy.');
    
  } catch (error) {
    console.log('❌ Direct authentication test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message || error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testDirectAuth();
