const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  console.log('Testing authentication system...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  try {
    // Test 2: Register a test user
    console.log('\n2. Testing user registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    
    const token = registerResponse.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test 3: Test protected route with token
    console.log('\n3. Testing protected route...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route access successful');
    console.log('User data:', meResponse.data.user.name, meResponse.data.user.email);

    // Test 4: Test login
    console.log('\n4. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);

    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.log('❌ Authentication test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message || error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAuth();
