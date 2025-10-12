const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

// Utility functions
function randomizeValue(value, percentage = 20) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  const variation = (Math.random() - 0.5) * 2 * (percentage / 100);
  const newValue = num * (1 + variation);
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  return decimalPlaces > 0 ? newValue.toFixed(decimalPlaces) : Math.round(newValue).toString();
}

function randomizeDate(dateStr) {
  // Parse the date (assuming DD-MM-YYYY format)
  const [day, month, year] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  
  // Add random variation of up to 30 days
  const variation = (Math.random() - 0.5) * 60; // -30 to +30 days
  date.setDate(date.getDate() + Math.round(variation));
  
  // Format back to DD-MM-YYYY
  const newDay = String(date.getDate()).padStart(2, '0');
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newYear = date.getFullYear();
  
  return `${newDay}-${newMonth}-${newYear}`;
}

function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
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

// Strapi API helper
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
    console.error(`API Error: ${error.response?.data?.error?.message || error.message}`);
    throw error;
  }
}

// Interactive patient name input
function promptPatientName() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('🏥 Welcome to the Patient Creation System!');
    console.log('━'.repeat(50));
    console.log('This will create a new patient with randomized data based on Patient X template.');
    console.log('');
    rl.question('👤 Enter the new patient name: ', (name) => {
      rl.close();
      resolve(name.trim());
    });
  });
}

// Main patient creation function
async function createRandomizedPatient(patientName) {
  console.log(`\n🎭 Creating patient: ${patientName}`);
  console.log('━'.repeat(50));
  
  try {
    // Check Strapi connection
    console.log('🔌 Testing Strapi connection...');
    await strapiAPI('patients');
    console.log('✅ Connected to Strapi successfully');
    
    const sourceDir = path.join(__dirname, '../../PatientData/patientxD');
    const outputDir = path.join(__dirname, `../../PatientData/patient-${patientName.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const originalPatientId = '55e2d179-d738-47d1-b88c-606833ce4d31';
    const newPatientId = uuidv4();
    const labResultIdMapping = new Map();
    let randomizedCount = 0;
    let randomizedDates = 0;
    
    console.log(`📊 Original Patient ID: ${originalPatientId}`);
    console.log(`🆔 New Patient ID: ${newPatientId}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    
    // 1. Create Patient CSV
    console.log('\n1️⃣ Creating Patient data...');
    const patientData = [{
      PatientID: newPatientId,
      Name: patientName
    }];
    await writeCSV(path.join(outputDir, 'Patient.csv'), patientData, ['PatientID', 'Name']);
    console.log('✅ Patient CSV created');
    
    // 2. Copy LabResultGroup (no changes needed)
    console.log('\n2️⃣ Copying Lab Result Groups...');
    const labResultGroups = readCSV(path.join(sourceDir, 'LabResultGroup.csv'));
    await writeCSV(path.join(outputDir, 'LabResultGroup.csv'), labResultGroups, ['LabResultGroupID', 'GroupName']);
    console.log(`✅ Copied ${labResultGroups.length} lab result groups`);
    
    // 3. Create LabResult with new IDs and new patient ID
    console.log('\n3️⃣ Creating Lab Results...');
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
    console.log(`✅ Created ${newLabResults.length} lab results with new IDs`);
    
    // 4. Randomize CMAS scores
    console.log('\n4️⃣ Randomizing CMAS scores...');
    const originalCMAS = readCSV(path.join(sourceDir, 'CMAS.csv'));
    const newCMAS = originalCMAS.map(score => {
      const randomizedScore = randomizeValue(score.Score, 15); // 15% variation for CMAS
      const randomizedDate = randomizeDate(score.Date);
      
      if (randomizedScore !== score.Score) randomizedCount++;
      if (randomizedDate !== score.Date) randomizedDates++;
      
      return {
        PatientID: newPatientId,
        Date: randomizedDate,
        Score: randomizedScore,
        Category: score.Category
      };
    });
    await writeCSV(path.join(outputDir, 'CMAS.csv'), newCMAS, ['PatientID', 'Date', 'Score', 'Category']);
    console.log(`✅ Randomized ${newCMAS.length} CMAS scores (${randomizedCount} values, ${randomizedDates} dates)`);
    
    // 5. Randomize Measurements
    console.log('\n5️⃣ Randomizing Measurements...');
    const originalMeasurements = readCSV(path.join(sourceDir, 'Measurement.csv'));
    let measurementRandomizedCount = 0;
    let measurementRandomizedDates = 0;
    
    const newMeasurements = originalMeasurements.map(measurement => {
      const newLabResultId = labResultIdMapping.get(measurement.LabResultID);
      if (!newLabResultId) return null;
      
      let newValue = measurement.Value;
      const originalValue = newValue;
      
      // Only randomize numeric values, skip special values
      if (newValue && !newValue.includes('neg') && !newValue.includes('Geen') && 
          !newValue.includes('<Memo>') && !newValue.includes('Serum') && 
          !newValue.includes('Pos') && !newValue.includes('AU/mL') &&
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
          
          if (newValue !== originalValue) {
            measurementRandomizedCount++;
          }
        }
      }
      
      const newDateTime = randomizeDate(measurement.DateTime);
      if (newDateTime !== measurement.DateTime) {
        measurementRandomizedDates++;
      }
      
      return {
        MeasurementID: uuidv4(),
        LabResultID: newLabResultId,
        DateTime: newDateTime,
        Value: newValue
      };
    }).filter(m => m !== null);
    
    await writeCSV(path.join(outputDir, 'Measurement.csv'), newMeasurements, ['MeasurementID', 'LabResultID', 'DateTime', 'Value']);
    console.log(`✅ Randomized ${newMeasurements.length} measurements (${measurementRandomizedCount} values, ${measurementRandomizedDates} dates)`);
    
    console.log('\n📄 CSV files generated successfully!');
    
    // 6. Import to Strapi
    console.log('\n6️⃣ Importing to Strapi...');
    
    // Check if patient already exists
    const existingPatients = await strapiAPI(`patients?filters[patientId][$eq]=${encodeURIComponent(newPatientId)}`);
    if (existingPatients.data && existingPatients.data.length > 0) {
      console.log('⚠️  Patient already exists in Strapi, skipping import');
      return;
    }
    
    // Import Patient
    console.log('👤 Importing patient...');
    const patientResponse = await strapiAPI('patients', 'POST', {
      name: patientName,
      patientId: newPatientId,
      publishedAt: new Date().toISOString()
    });
    console.log(`✅ Patient created in Strapi with ID: ${patientResponse.data.id}`);
    
    // Import Lab Result Groups (ensure they exist)
    console.log('🧪 Ensuring lab result groups exist...');
    const groupsMap = {};
    for (const group of labResultGroups) {
      const existingGroups = await strapiAPI(`lab-result-groups?filters[groupId][$eq]=${encodeURIComponent(group.LabResultGroupID)}`);
      if (existingGroups.data && existingGroups.data.length > 0) {
        groupsMap[group.LabResultGroupID] = existingGroups.data[0].id;
      } else {
        const response = await strapiAPI('lab-result-groups', 'POST', {
          groupName: group.GroupName,
          groupId: group.LabResultGroupID,
          publishedAt: new Date().toISOString()
        });
        groupsMap[group.LabResultGroupID] = response.data.id;
      }
    }
    console.log(`✅ ${Object.keys(groupsMap).length} lab result groups ready`);
    
    // Import Lab Results
    console.log('🔬 Importing lab results...');
    const createdResults = {};
    for (const result of newLabResults) {
      const response = await strapiAPI('lab-results', 'POST', {
        resultName: result.ResultName,
        labResultId: result.LabResultID,
        unit: result.Unit,
        patient: patientResponse.data.id,
        lab_result_group: groupsMap[result.LabResultGroupID],
        publishedAt: new Date().toISOString()
      });
      createdResults[result.LabResultID] = response.data.id;
    }
    console.log(`✅ Imported ${newLabResults.length} lab results`);
    
    // Import Measurements
    console.log('📊 Importing measurements...');
    for (const measurement of newMeasurements) {
      const strapiLabResultId = createdResults[measurement.LabResultID];
      if (strapiLabResultId) {
        // Parse and format the date properly
        const dateStr = measurement.DateTime.replace(/"/g, '').trim();
        let dateTimeStr;
        
        try {
          // Handle DD-MM-YYYY format and convert to ISO string
          const [day, month, year] = dateStr.split('-');
          dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        } catch (error) {
          console.warn(`Invalid date format for measurement: ${dateStr}`);
          continue;
        }
        
        await strapiAPI('measurements', 'POST', {
          measurementId: measurement.MeasurementID,
          value: measurement.Value,
          dateTime: dateTimeStr,
          lab_result: strapiLabResultId,
          publishedAt: new Date().toISOString()
        });
      }
    }
    console.log(`✅ Imported ${newMeasurements.length} measurements`);
    
    // Import CMAS Scores
    console.log('📈 Importing CMAS scores...');
    for (const score of newCMAS) {
      // Convert date from DD-MM-YYYY to YYYY-MM-DD format for Strapi
      const dateParts = score.Date.split('-');
      const strapiDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      
      await strapiAPI('cmas-scores', 'POST', {
        date: strapiDate,
        score: parseFloat(score.Score),
        category: score.Category,
        patient: patientResponse.data.id,
        publishedAt: new Date().toISOString()
      });
    }
    console.log(`✅ Imported ${newCMAS.length} CMAS scores`);
    
    // Final summary
    console.log('\n🎉 SUCCESS! Patient created and imported');
    console.log('━'.repeat(50));
    console.log(`👤 Patient Name: ${patientName}`);
    console.log(`🆔 Patient ID: ${newPatientId}`);
    console.log(`📁 CSV Location: ${outputDir}`);
    console.log('\n📊 Data Summary:');
    console.log(`   • ${newCMAS.length} CMAS scores (${randomizedCount} randomized)`);
    console.log(`   • ${newLabResults.length} lab result types`);
    console.log(`   • ${newMeasurements.length} measurements (${measurementRandomizedCount} randomized)`);
    console.log(`   • ${randomizedDates + measurementRandomizedDates} dates randomized`);
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your frontend to see the new patient');
    console.log('   2. Check multi-patient views');
    console.log('   3. Test patient selection functionality');
    console.log('\n🔄 Run this script again to create more patients!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.error) {
      console.error('API Error Details:', error.response.data.error);
    }
    throw error;
  }
}

// Check for existing patients in Strapi
async function showExistingPatients() {
  try {
    console.log('\n📋 Current patients in Strapi:');
    const patients = await strapiAPI('patients');
    if (patients.data && patients.data.length > 0) {
      patients.data.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (ID: ${patient.patientId || 'N/A'})`);
      });
    } else {
      console.log('   (No patients found)');
    }
  } catch (error) {
    console.log('   (Could not fetch existing patients)');
  }
}

// Main execution
async function main() {
  try {
    // Check for command line argument for non-interactive mode
    const patientName = process.argv[2];
    
    if (patientName) {
      // Non-interactive mode
      console.log(`🚀 Non-interactive mode: Creating patient "${patientName}"`);
      await createRandomizedPatient(patientName);
      return;
    }
    
    // Interactive mode
    // Show existing patients first
    await showExistingPatients();
    
    // Get patient name from user
    const inputPatientName = await promptPatientName();
    
    if (!inputPatientName) {
      console.log('❌ No patient name provided. Exiting...');
      return;
    }
    
    // Create the patient
    await createRandomizedPatient(inputPatientName);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createRandomizedPatient, promptPatientName }; 