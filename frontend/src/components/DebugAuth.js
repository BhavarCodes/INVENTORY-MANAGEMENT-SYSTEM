import React, { useState } from 'react';
import axios from 'axios';

const DebugAuth = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBackendConnection = async () => {
    setLoading(true);
    addResult('Testing backend connection...', 'info');
    
    try {
      const response = await axios.get('/api/health');
      addResult(`✅ Backend health check passed: ${JSON.stringify(response.data)}`, 'success');
    } catch (error) {
      addResult(`❌ Backend health check failed: ${error.message}`, 'error');
      if (error.response) {
        addResult(`Response status: ${error.response.status}`, 'error');
        addResult(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
    setLoading(false);
  };

  const testRegistration = async () => {
    setLoading(true);
    const testEmail = `test${Date.now()}@example.com`;
    addResult(`Testing registration with email: ${testEmail}`, 'info');
    
    try {
      const response = await axios.post('/api/auth/register', {
        name: 'Test User',
        email: testEmail,
        password: 'password123'
      });
      addResult(`✅ Registration successful: ${JSON.stringify(response.data)}`, 'success');
    } catch (error) {
      addResult(`❌ Registration failed: ${error.message}`, 'error');
      if (error.response) {
        addResult(`Response status: ${error.response.status}`, 'error');
        addResult(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    addResult('Testing login with test@example.com', 'info');
    
    try {
      const response = await axios.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      addResult(`✅ Login successful: ${JSON.stringify(response.data)}`, 'success');
    } catch (error) {
      addResult(`❌ Login failed: ${error.message}`, 'error');
      if (error.response) {
        addResult(`Response status: ${error.response.status}`, 'error');
        addResult(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
    setLoading(false);
  };

  const testDirectBackend = async () => {
    setLoading(true);
    addResult('Testing direct backend connection (bypassing proxy)...', 'info');
    
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      addResult(`✅ Direct backend connection successful: ${JSON.stringify(response.data)}`, 'success');
    } catch (error) {
      addResult(`❌ Direct backend connection failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    clearResults();
    addResult('Starting comprehensive authentication tests...', 'info');
    
    await testBackendConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDirectBackend();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRegistration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testLogin();
    
    addResult('All tests completed!', 'info');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Authentication Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button 
          onClick={testBackendConnection} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Backend
        </button>
        
        <button 
          onClick={testRegistration} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Registration
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Login
        </button>
        
        <button 
          onClick={clearResults}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px',
        padding: '15px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3>Test Results:</h3>
        {testResults.length === 0 ? (
          <p>No tests run yet. Click "Run All Tests" to start debugging.</p>
        ) : (
          testResults.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '8px',
                padding: '5px',
                backgroundColor: result.type === 'error' ? '#f8d7da' : 
                               result.type === 'success' ? '#d4edda' : '#d1ecf1',
                border: `1px solid ${result.type === 'error' ? '#f5c6cb' : 
                                   result.type === 'success' ? '#c3e6cb' : '#bee5eb'}`,
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <strong>[{result.timestamp}]</strong> {result.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugAuth;
