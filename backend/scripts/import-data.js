const fs = require('fs');
const csv = require('csv-parse');
const axios = require('axios');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Read Patient data
    const patientData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/Patient.csv')
        .pipe(csv.parse({ delimiter: ',', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.Name && data.Name.trim()) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${patientData.length} patients to import`);

    // Create Patient records
    const createdPatients = [];
    for (const patient of patientData) {
      try {
        const response = await axios.post(`${STRAPI_URL}/api/patients`, {
          data: {
            name: patient.Name,
            publishedAt: new Date()
          }
        }, {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`Created patient: ${patient.Name}`);
        createdPatients.push(response.data.data);
      } catch (err) {
        console.error(`Error creating patient ${patient.Name}:`, err.response?.data || err.message);
      }
    }

    // Read Lab Result data
    const labResultData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/LabResult.csv')
        .pipe(csv.parse({ delimiter: ';', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.ResultName && data.ResultName.trim()) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${labResultData.length} lab results to import`);

    // Create Lab Result records for each patient
    for (const labResult of labResultData) {
      try {
        // Skip empty rows or rows without a result name
        if (!labResult.ResultName) continue;

        // Create a lab result for the first patient (for testing)
        if (createdPatients.length > 0) {
          const response = await axios.post(`${STRAPI_URL}/api/lab-results`, {
            data: {
              resultName: labResult.ResultName,
              unit: labResult.Unit || '',
              value: '0', // Default value since we don't have actual values in the CSV
              patient: createdPatients[0].id,
              publishedAt: new Date()
            }
          }, {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`Created lab result: ${labResult.ResultName}`);
        }
      } catch (err) {
        console.error(`Error creating lab result ${labResult.ResultName}:`, err.response?.data || err.message);
      }
    }

    // Read Measurement data
    const measurementData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('../PatientData/Measurement.csv')
        .pipe(csv.parse({ delimiter: ';', columns: true, trim: true }))
        .on('data', (data) => {
          if (data.DateTime && data.Value) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Found ${measurementData.length} measurements to import`);

    // Create Measurement records for the first patient (for testing)
    for (const measurement of measurementData) {
      try {
        if (!measurement.Value) continue;

        if (createdPatients.length > 0) {
          const response = await axios.post(`${STRAPI_URL}/api/measurements`, {
            data: {
              type: 'General Measurement',
              value: measurement.Value,
              dateTime: measurement.DateTime,
              patient: createdPatients[0].id,
              publishedAt: new Date()
            }
          }, {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`Created measurement: ${measurement.Value}`);
        }
      } catch (err) {
        console.error(`Error creating measurement:`, err.response?.data || err.message);
      }
    }

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error.response?.data || error.message);
  }
}

// Add required dependencies to package.json
const packageJson = require('../package.json');
if (!packageJson.dependencies['csv-parse']) {
  packageJson.dependencies['csv-parse'] = '^4.16.3';
}
if (!packageJson.dependencies.axios) {
  packageJson.dependencies.axios = '^1.6.2';
}
fs.writeFileSync(
  path.join(__dirname, '../package.json'),
  JSON.stringify(packageJson, null, 2)
);

importData(); 