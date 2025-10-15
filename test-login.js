// Test script to diagnose login authentication issues
const API_BASE_URL = 'https://be-tpms.connectis.my.id';

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test basic connectivity
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Health check status:', healthResponse.status);
    console.log('Health check response:', await healthResponse.text());
  } catch (error) {
    console.error('Health check failed:', error.message);
  }

  try {
    // Test dashboard stats endpoint
    const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Stats check status:', statsResponse.status);
    console.log('Stats check response:', await statsResponse.text());
  } catch (error) {
    console.error('Stats check failed:', error.message);
  }
}

async function testLogin() {
  console.log('🔑 Testing login with demo credentials...');
  
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('Login response status:', response.status);
    console.log('Login response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('Login response body:', responseText);
    
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Invalid credentials or authentication endpoint issue');
    } else if (response.status === 404) {
      console.error('❌ 404 Not Found - Login endpoint may not exist');
    } else if (response.status === 500) {
      console.error('❌ 500 Server Error - Backend server issue');
    }

    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('Parsed JSON response:', jsonResponse);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.error('Login request failed:', error.message);
  }
}

async function testAlternativeEndpoints() {
  console.log('🔍 Testing alternative login endpoints...');
  
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  const endpoints = [
    '/api/login',
    '/api/user/login',
    '/api/users/login',
    '/auth/login',
    '/login'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      console.log(`${endpoint} - Status: ${response.status}`);
      
      if (response.status !== 404) {
        const responseText = await response.text();
        console.log(`${endpoint} - Response:`, responseText.substring(0, 200));
      }
    } catch (error) {
      console.log(`${endpoint} - Error:`, error.message);
    }
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 Starting login diagnostics...\n');
  
  await testBackendConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testLogin();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testAlternativeEndpoints();
  
  console.log('\n✅ Diagnostics complete!');
}

runDiagnostics();
