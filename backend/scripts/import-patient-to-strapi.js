const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

async function createPatient() {
  try {
    console.log('Attempting to create Patient X...');

    // Check if the patient already exists
    const existingRes = await axios.get(`${STRAPI_URL}/api/patients?filters[name][$eq]=Patient%20X`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingRes.data.data && existingRes.data.data.length > 0) {
      console.log('Patient X already exists:', existingRes.data.data[0]);
      return existingRes.data.data[0];
    }

    // Create the patient
    const response = await axios.post(`${STRAPI_URL}/api/patients`, {
      data: {
        name: 'Patient X',
        publishedAt: new Date().toISOString()
      }
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Created Patient X:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating patient:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the function
createPatient()
  .then(patient => {
    console.log('Success! Patient data:', patient);
  })
  .catch(error => {
    console.error('Failed to create patient:', error);
  }); 