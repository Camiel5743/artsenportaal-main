const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

// Utility function for Strapi API calls
async function strapiAPI(endpoint, method = 'GET', data = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    };
    
    const response = await axios({
      method,
      url: `${STRAPI_URL}/api/${endpoint}`,
      headers,
      data: data ? { data } : undefined
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error in Strapi API call to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testPatientCreationFlow() {
  console.log('🔍 Testing Patient Creation Flow');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test basic API connectivity
    console.log('1. Testing API connectivity...');
    const healthCheck = await axios.get(`${STRAPI_URL}/_health`).catch(() => null);
    if (healthCheck) {
      console.log('✅ Strapi is running and healthy');
    } else {
      console.log('⚠️  Health check failed, but proceeding...');
    }
    
    // 2. Check current patients
    console.log('\n2. Checking current patients in database...');
    const patientsResponse = await strapiAPI('patients');
    console.log(`📊 Found ${patientsResponse.data?.length || 0} patients in database:`);
    
    if (patientsResponse.data && patientsResponse.data.length > 0) {
      patientsResponse.data.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (ID: ${patient.patientId})`);
        console.log(`      Published: ${patient.publishedAt ? 'Yes' : 'No'}`);
        console.log(`      Created: ${patient.createdAt}`);
      });
    } else {
      console.log('   (No patients found)');
    }
    
    // 3. Test creating a simple patient
    console.log('\n3. Testing patient creation...');
    const testPatientName = `Test Patient ${Date.now()}`;
    const testPatientId = `test-${Date.now()}`;
    
    console.log(`Creating patient: ${testPatientName}`);
    const createResponse = await strapiAPI('patients', 'POST', {
      name: testPatientName,
      patientId: testPatientId,
      publishedAt: new Date().toISOString()
    });
    
    if (createResponse.data) {
      console.log('✅ Patient created successfully:');
      console.log(`   Name: ${createResponse.data.name}`);
      console.log(`   ID: ${createResponse.data.patientId}`);
      console.log(`   Database ID: ${createResponse.data.id}`);
      console.log(`   Published: ${createResponse.data.publishedAt ? 'Yes' : 'No'}`);
      
      // 4. Verify it appears in the list
      console.log('\n4. Verifying patient appears in API...');
      const verifyResponse = await strapiAPI('patients');
      const foundPatient = verifyResponse.data?.find(p => p.patientId === testPatientId);
      
      if (foundPatient) {
        console.log('✅ Patient found in API response');
      } else {
        console.log('❌ Patient NOT found in API response');
      }
      
      // 5. Test the frontend API call format
      console.log('\n5. Testing frontend API format...');
      const frontendResponse = await strapiAPI('patients', 'GET');
      console.log('Frontend API structure:');
      console.log(JSON.stringify(frontendResponse, null, 2));
      
      // 6. Clean up - delete the test patient
      console.log('\n6. Cleaning up test patient...');
      await strapiAPI(`patients/${createResponse.data.documentId}`, 'DELETE');
      console.log('✅ Test patient deleted');
      
    } else {
      console.log('❌ Failed to create patient');
    }
    
    // 7. Check permissions
    console.log('\n7. Checking API permissions...');
    try {
      const permissionsTest = await axios.get(`${STRAPI_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      console.log('✅ API permissions are working');
    } catch (error) {
      console.log('❌ API permissions error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPatientCreationFlow().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
}); 