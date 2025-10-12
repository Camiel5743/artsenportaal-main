const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

// Utility Functions
function randomizeValue(value, percentage = 20) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  const variation = (Math.random() - 0.5) * 2 * (percentage / 100);
  const newValue = num * (1 + variation);
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  return decimalPlaces > 0 ? newValue.toFixed(decimalPlaces) : Math.round(newValue).toString();
}

function randomizeDate(dateString) {
  if (!dateString || dateString.trim() === '') return dateString;
  
  try {
    let date;
    
    // Handle YYYY-MM-DD format (used in CMAS data)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      date = new Date(dateString);
    }
    // Handle DD-MM-YYYY format (used in some measurement data)
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString.trim())) {
      const [day, month, year] = dateString.split('-');
      date = new Date(`${year}-${month}-${day}`);
    }
    // Handle DD-MM-YYYYHH:MM format (used in measurement data)
    else if (/^\d{2}-\d{2}-\d{4}\d{2}:\d{2}$/.test(dateString.trim())) {
      const [datePart, timePart] = dateString.split(/(?=\d{2}:\d{2}$)/);
      const [day, month, year] = datePart.split('-');
      date = new Date(`${year}-${month}-${day}T${timePart}:00`);
    }
    // Handle other formats - try to parse directly
    else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn(`Could not parse date: ${dateString}`);
      return dateString; // Return original if invalid
    }
    
    // Randomize by ±6 months
    const monthsShift = (Math.random() - 0.5) * 12;
    date.setMonth(date.getMonth() + monthsShift);
    
    // Return in the same format as input
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      // Return YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    }
    else if (dateString.includes(':')) {
      // Return DD-MM-YYYYHH:MM format
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year}${hours}:${minutes}`;
    } else {
      // Return DD-MM-YYYY format
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    console.warn(`Error processing date ${dateString}:`, error.message);
    return dateString;
  }
}

async function strapiAPI(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    url: `${STRAPI_URL}/api/${endpoint}`,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = { data };
  }
  
  const response = await axios(config);
  return response.data;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

async function writeCSV(filePath, data, headers) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
}

async function createPatientData(patientName) {
  console.log(`🎭 Creating patient data: ${patientName}`);
  
  const sourceDir = path.join(__dirname, '../../PatientData/patientxD');
  const outputDir = path.join(__dirname, `../../PatientData/patient-${patientName.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const newPatientId = uuidv4();
  const labResultIdMapping = new Map();
  
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🆔 New Patient ID: ${newPatientId}`);
  
  // 1. Create Patient.csv
  console.log('📄 Creating Patient.csv...');
  const patientData = [{
    PatientID: newPatientId,
    Name: patientName
  }];
  await writeCSV(path.join(outputDir, 'Patient.csv'), patientData, ['PatientID', 'Name']);
  
  // 2. Copy LabResultGroup.csv
  console.log('📄 Copying LabResultGroup.csv...');
  const labResultGroups = readCSV(path.join(sourceDir, 'LabResultGroup.csv'));
  await writeCSV(path.join(outputDir, 'LabResultGroup.csv'), labResultGroups, ['LabResultGroupID', 'GroupName']);
  
  // 3. Create LabResult.csv with new IDs
  console.log('📄 Creating LabResult.csv...');
  const originalLabResults = readCSV(path.join(sourceDir, 'LabResult.csv'));
  const newLabResults = originalLabResults.map(result => {
    const newLabResultId = uuidv4();
    labResultIdMapping.set(result.LabResultID, newLabResultId);
    return {
      LabResultID: newLabResultId,
      LabResultGroupID: result.LabResultGroupID,
      PatientID: newPatientId,
      ResultName: result.ResultName,
      Unit: result.Unit
    };
  });
  await writeCSV(path.join(outputDir, 'LabResult.csv'), newLabResults, ['LabResultID', 'LabResultGroupID', 'PatientID', 'ResultName', 'Unit']);
  
  // 4. Randomize CMAS.csv
  console.log('🎲 Randomizing CMAS.csv...');
  const originalCMAS = readCSV(path.join(sourceDir, 'CMAS.csv'));
  const newCMAS = originalCMAS.map(cmas => {
    const randomizedScore = randomizeValue(cmas.Score, 15);
    const randomizedDate = randomizeDate(cmas.Date);
    
    return {
      PatientID: newPatientId,
      Date: randomizedDate,
      Score: randomizedScore,
      Category: cmas.Category
    };
  });
  await writeCSV(path.join(outputDir, 'CMAS.csv'), newCMAS, ['PatientID', 'Date', 'Score', 'Category']);
  
  // 5. Randomize Measurement.csv
  console.log('🎲 Randomizing Measurement.csv...');
  const originalMeasurements = readCSV(path.join(sourceDir, 'Measurement.csv'));
  const newMeasurements = originalMeasurements.map(measurement => {
    const newLabResultId = labResultIdMapping.get(measurement.LabResultID);
    if (!newLabResultId) return null;
    
    let newValue = measurement.Value;
    
    // Only randomize numeric values
    if (newValue && 
        !newValue.includes('neg') && 
        !newValue.includes('Geen') && 
        !newValue.includes('<Memo>') &&
        !newValue.includes('Serum') &&
        !newValue.includes('Pos') &&
        newValue.trim() !== '') {
      
      const numCheck = newValue.replace(/^[<>]/, '');
      if (!isNaN(parseFloat(numCheck))) {
        if (newValue.startsWith('<') || newValue.startsWith('>')) {
          const prefix = newValue.charAt(0);
          const numValue = newValue.substring(1);
          newValue = prefix + randomizeValue(numValue, 20);
        } else {
          newValue = randomizeValue(newValue, 20);
        }
      }
    }
    
    return {
      MeasurementID: uuidv4(),
      LabResultID: newLabResultId,
      DateTime: randomizeDate(measurement.DateTime),
      Value: newValue
    };
  }).filter(m => m !== null);
  
  await writeCSV(path.join(outputDir, 'Measurement.csv'), newMeasurements, ['MeasurementID', 'LabResultID', 'DateTime', 'Value']);
  
  console.log(`✅ Generated ${newCMAS.length} CMAS scores and ${newMeasurements.length} measurements`);
  
  return {
    patientId: newPatientId,
    outputDir,
    cmasData: newCMAS,
    labResults: newLabResults,
    measurements: newMeasurements,
    labResultGroups
  };
}

async function importPatientToStrapi(patientData) {
  console.log('📤 Importing patient to Strapi...');
  
  const { patientId, cmasData, labResults, measurements, labResultGroups } = patientData;
  
  try {
    // Check if patient already exists
    const existingPatients = await strapiAPI(`patients?filters[patientId][$eq]=${encodeURIComponent(patientId)}`);
    if (existingPatients.data && existingPatients.data.length > 0) {
      console.log('⚠️ Patient already exists in Strapi, skipping patient creation');
      return existingPatients.data[0];
    }
    
    // 1. Create Patient
    console.log('👤 Creating patient in Strapi...');
    const patientResponse = await strapiAPI('patients', 'POST', {
      name: patientData.patientName || 'Unknown Patient',
      patientId: patientId,
      publishedAt: new Date().toISOString()
    });
    
    const strapiPatientId = patientResponse.data.id;
    console.log(`✅ Patient created with Strapi ID: ${strapiPatientId}`);
    
    // 2. Import Lab Result Groups
    console.log('🧬 Importing lab result groups...');
    const groupMapping = new Map();
    
    for (const group of labResultGroups) {
      try {
        // Check if group already exists
        const existingGroups = await strapiAPI(`lab-result-groups?filters[groupId][$eq]=${encodeURIComponent(group.LabResultGroupID)}`);
        
        if (existingGroups.data && existingGroups.data.length > 0) {
          groupMapping.set(group.LabResultGroupID, existingGroups.data[0].id);
          console.log(`✅ Using existing group: ${group.GroupName}`);
          continue;
        }
        
        const groupResponse = await strapiAPI('lab-result-groups', 'POST', {
          groupName: group.GroupName,
          groupId: group.LabResultGroupID,
          publishedAt: new Date().toISOString()
        });
        groupMapping.set(group.LabResultGroupID, groupResponse.data.id);
        console.log(`✅ Created group: ${group.GroupName}`);
      } catch (err) {
        console.error(`❌ Failed to create group ${group.GroupName}:`, err.message);
      }
    }
    
    console.log(`✅ Processed ${groupMapping.size} lab result groups`);
    
    // 3. Import Lab Results
    console.log('🧪 Importing lab results...');
    const labResultMapping = new Map();
    
    for (const labResult of labResults) {
      try {
        const groupId = groupMapping.get(labResult.LabResultGroupID);
        
        const labResponse = await strapiAPI('lab-results', 'POST', {
          labResultId: labResult.LabResultID,
          resultName: labResult.ResultName,
          unit: labResult.Unit,
          patient: strapiPatientId,
          lab_result_group: groupId,
          publishedAt: new Date().toISOString()
        });
        labResultMapping.set(labResult.LabResultID, labResponse.data.id);
      } catch (err) {
        console.error(`❌ Failed to create lab result ${labResult.ResultName}:`, err.message);
      }
    }
    
    console.log(`✅ Created ${labResultMapping.size} lab results`);
    
    // 4. Import Measurements
    console.log('📊 Importing measurements...');
    let measurementCount = 0;
    let measurementErrors = 0;
    
    for (const measurement of measurements) {
      const strapiLabResultId = labResultMapping.get(measurement.LabResultID);
      if (!strapiLabResultId) continue;
      
      try {
        // Convert DateTime format to ISO format
        let isoDateTime;
        if (measurement.DateTime) {
          // Handle DD-MM-YYYYHH:MM format
          if (/^\d{2}-\d{2}-\d{4}\d{2}:\d{2}$/.test(measurement.DateTime.trim())) {
            const [datePart, timePart] = measurement.DateTime.split(/(?=\d{2}:\d{2}$)/);
            const [day, month, year] = datePart.split('-');
            isoDateTime = new Date(`${year}-${month}-${day}T${timePart}:00`).toISOString();
          }
          // Handle DD-MM-YYYY format
          else if (/^\d{2}-\d{2}-\d{4}$/.test(measurement.DateTime.trim())) {
            const [day, month, year] = measurement.DateTime.split('-');
            isoDateTime = new Date(`${year}-${month}-${day}`).toISOString();
          }
          // Handle YYYY-MM-DD format
          else if (/^\d{4}-\d{2}-\d{2}$/.test(measurement.DateTime.trim())) {
            isoDateTime = new Date(measurement.DateTime).toISOString();
          }
          // Skip malformed dates
          else {
            console.warn(`Skipping measurement with invalid DateTime: ${measurement.DateTime}`);
            measurementErrors++;
            continue;
          }
        } else {
          isoDateTime = new Date().toISOString();
        }
        
        // Verify the date is valid
        if (isNaN(new Date(isoDateTime).getTime())) {
          console.warn(`Skipping measurement with invalid converted DateTime: ${measurement.DateTime} -> ${isoDateTime}`);
          measurementErrors++;
          continue;
        }
        
        await strapiAPI('measurements', 'POST', {
          measurementId: measurement.MeasurementID,
          value: measurement.Value,
          dateTime: isoDateTime,
          lab_result: strapiLabResultId,
          publishedAt: new Date().toISOString()
        });
        
        measurementCount++;
      } catch (err) {
        measurementErrors++;
        if (measurementErrors <= 5) { // Only log first 5 errors to avoid spam
          console.error(`❌ Failed to create measurement:`, err.message);
        }
      }
    }
    
    console.log(`✅ Created ${measurementCount} measurements (${measurementErrors} errors)`);
    
    // 5. Import CMAS Scores
    console.log('📈 Importing CMAS scores...');
    let cmasCount = 0;
    let cmasErrors = 0;
    
    for (const cmas of cmasData) {
      try {
        // Convert date from YYYY-MM-DD to ISO format (should be already valid)
        let isoDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(cmas.Date.trim())) {
          isoDate = cmas.Date; // Keep in YYYY-MM-DD format, not full ISO
        } else {
          console.warn(`Skipping CMAS score with invalid date: ${cmas.Date}`);
          cmasErrors++;
          continue;
        }
        
        // Verify the date is valid
        if (isNaN(new Date(isoDate).getTime())) {
          console.warn(`Skipping CMAS score with invalid converted date: ${cmas.Date} -> ${isoDate}`);
          cmasErrors++;
          continue;
        }
        
        await strapiAPI('cmas-scores', 'POST', {
          date: isoDate,
          score: parseFloat(cmas.Score),
          category: cmas.Category,
          patient: strapiPatientId,
          publishedAt: new Date().toISOString()
        });
        
        cmasCount++;
      } catch (err) {
        cmasErrors++;
        if (cmasErrors <= 5) { // Only log first 5 errors to avoid spam
          console.error(`❌ Failed to create CMAS score:`, err.message);
        }
      }
    }
    
    console.log(`✅ Created ${cmasCount} CMAS scores (${cmasErrors} errors)`);
    
    return {
      id: strapiPatientId,
      patientId: patientId,
      groups: groupMapping.size,
      labResults: labResultMapping.size,
      measurements: measurementCount,
      cmasScores: cmasCount
    };
    
  } catch (error) {
    console.error('❌ Error importing to Strapi:', error.message);
    throw error;
  }
}

async function createAndImportPatient(patientName) {
  console.log('🏥 AUTOMATED PATIENT CREATION WORKFLOW');
  console.log('=' .repeat(50));
  console.log(`👤 Patient: ${patientName}`);
  console.log('');
  
  try {
    // Step 1: Generate randomized patient data
    console.log('🔄 STEP 1: Generating randomized patient data...');
    const patientData = await createPatientData(patientName);
    patientData.patientName = patientName;
    
    // Step 2: Import to Strapi
    console.log('\n🔄 STEP 2: Importing to Strapi...');
    const importResult = await importPatientToStrapi(patientData);
    
    // Success summary
    console.log('\n🎉 SUCCESS! Patient created and imported');
    console.log('=' .repeat(50));
    console.log(`👤 Patient Name: ${patientName}`);
    console.log(`🆔 Patient ID: ${patientData.patientId}`);
    console.log(`📁 Data Directory: ${patientData.outputDir}`);
    console.log(`🏥 Strapi Patient ID: ${importResult.id}`);
    console.log('');
    console.log('📊 Import Summary:');
    console.log(`   • Groups: ${importResult.groups}`);
    console.log(`   • Lab Results: ${importResult.labResults}`);
    console.log(`   • Measurements: ${importResult.measurements}`);
    console.log(`   • CMAS Scores: ${importResult.cmasScores}`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Refresh your frontend to see the new patient');
    console.log('   2. Click on the patient to view detailed data and graphs');
    console.log('   3. Check that CMAS scores and lab results are displayed correctly');
    
    return importResult;
    
  } catch (error) {
    console.error('\n❌ WORKFLOW FAILED:', error.message);
    if (error.response?.data?.error) {
      console.error('API Error Details:', error.response.data.error);
    }
    throw error;
  }
}

// Interactive mode
async function promptPatientName() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('🏥 Automated Patient Creation System');
    console.log('This will create a new patient with randomized data and import it to Strapi');
    console.log('');
    rl.question('👤 Enter the new patient name: ', (name) => {
      rl.close();
      resolve(name.trim());
    });
  });
}

// Main execution
async function main() {
  try {
    // Check if patient name was provided as argument
    const patientName = process.argv[2];
    
    if (patientName) {
      await createAndImportPatient(patientName);
    } else {
      const name = await promptPatientName();
      if (name) {
        await createAndImportPatient(name);
      } else {
        console.log('❌ No patient name provided');
      }
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

// Export for use by other scripts
module.exports = { createAndImportPatient };

// Run if called directly
if (require.main === module) {
  main();
} 