const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

// Randomize values
function randomizeValue(value, percentage = 20) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  const variation = (Math.random() - 0.5) * 2 * (percentage / 100);
  const newValue = num * (1 + variation);
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  return decimalPlaces > 0 ? newValue.toFixed(decimalPlaces) : Math.round(newValue).toString();
}

// Randomize dates
function randomizeDate(dateString) {
  if (!dateString || dateString.trim() === '') return dateString;
  
  try {
    let date;
    if (dateString.includes('-') && dateString.length <= 10) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else if (dateString.includes('-') && dateString.length > 10) {
      const [datePart, timePart] = dateString.split(/(?=\d{2}:\d{2}$)/);
      const parts = datePart.split('-');
      if (parts.length >= 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${timePart || '00:00'}`);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString;
    
    const monthsShift = (Math.random() - 0.5) * 12;
    date.setMonth(date.getMonth() + monthsShift);
    
    if (dateString.includes(':')) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year}${hours}:${minutes}`;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    return dateString;
  }
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

// Read CSV
function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
  const headers = lines[0].split(',');
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.replace(/^"|"$/g, '').trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.replace(/^"|"$/g, '').trim());

    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      if (Object.values(record).some(value => value && value.trim())) {
        results.push(record);
      }
    }
  }
  
  return results;
}

// Write CSV
async function writeCSV(filePath, data, headers) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
}

async function createPatient(patientName) {
  console.log(`🎭 Creating patient: ${patientName}`);
  
  try {
    // Check Strapi connection
    await strapiAPI('patients');
    console.log('✅ Connected to Strapi');
    
    const sourceDir = path.join(__dirname, '../../PatientData/patientxD');
    const outputDir = path.join(__dirname, `../../PatientData/mock-${patientName.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const originalPatientId = '55e2d179-d738-47d1-b88c-606833ce4d31';
    const newPatientId = uuidv4();
    const labResultIdMapping = new Map();
    
    // 1. Create Patient
    const patientData = [{
      PatientID: newPatientId,
      Name: patientName
    }];
    await writeCSV(path.join(outputDir, 'Patient.csv'), patientData, ['PatientID', 'Name']);
    
    // 2. Copy LabResultGroup
    const labResultGroups = readCSV(path.join(sourceDir, 'LabResultGroup.csv'));
    await writeCSV(path.join(outputDir, 'LabResultGroup.csv'), labResultGroups, ['LabResultGroupID', 'GroupName']);
    
    // 3. Create LabResult with new IDs
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
    
    // 4. Randomize CMAS
    const originalCMAS = readCSV(path.join(sourceDir, 'CMAS.csv'));
    const newCMAS = originalCMAS.map(cmas => {
      const originalScore = cmas.Score;
      const randomizedScore = randomizeValue(cmas.Score, 15);
      const originalDate = cmas.Date;
      const randomizedDate = randomizeDate(cmas.Date);
      
      console.log(`🎲 CMAS: ${originalScore} → ${randomizedScore}, ${originalDate} → ${randomizedDate}`);
      
      return {
        PatientID: newPatientId,
        Date: randomizedDate,
        Score: randomizedScore,
        Category: cmas.Category
      };
    });
    await writeCSV(path.join(outputDir, 'CMAS.csv'), newCMAS, ['PatientID', 'Date', 'Score', 'Category']);
    
    // 5. Randomize Measurements
    const originalMeasurements = readCSV(path.join(sourceDir, 'Measurement.csv'));
    let randomizedCount = 0;
    const newMeasurements = originalMeasurements.map(measurement => {
      const newLabResultId = labResultIdMapping.get(measurement.LabResultID);
      if (!newLabResultId) return null;
      
      let newValue = measurement.Value;
      const originalValue = newValue;
      
      if (newValue && !newValue.includes('neg') && !newValue.includes('Geen') && 
          !newValue.includes('<Memo>') && !newValue.includes('Serum') && 
          !newValue.includes('Pos') && newValue.trim() !== '') {
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
            randomizedCount++;
            console.log(`🎲 Lab: ${originalValue} → ${newValue}`);
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
    
    console.log(`✅ Randomized ${randomizedCount} out of ${newMeasurements.length} measurements`);
    await writeCSV(path.join(outputDir, 'Measurement.csv'), newMeasurements, ['MeasurementID', 'LabResultID', 'DateTime', 'Value']);
    
    console.log('✅ Generated randomized data');
    
    // Import to Strapi
    console.log('📤 Importing to Strapi...');
    
    // Import Patient
    const existingPatients = await strapiAPI(`patients?filters[patientId][$eq]=${encodeURIComponent(newPatientId)}`);
    if (existingPatients.data && existingPatients.data.length > 0) {
      console.log('⚠️  Patient already exists');
      return;
    }
    
    const patientResponse = await strapiAPI('patients', 'POST', {
      name: patientName,
      patientId: newPatientId,
      publishedAt: new Date().toISOString()
    });
    console.log(`✅ Created patient in Strapi: ${patientName}`);
    
    // Import Lab Result Groups
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
    
    // Import Lab Results
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
    
    // Import Measurements
    for (const measurement of newMeasurements) {
      const dateStr = measurement.DateTime.replace(/"/g, '').trim();
      let dateTimeStr;
      try {
        const [datePart, timePart] = dateStr.split(/(?<=\d{4})|(?<=\d{2}:\d{2}(?:\.\d+)?)/);
        const [day, month, year] = datePart.split('-').map(part => part.trim());
        
        if (!timePart) {
          dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        } else {
          const cleanTimePart = timePart.replace(/\.\d+$/, '').trim();
          const [hours, minutes = '00'] = cleanTimePart.split(':').map(part => part.trim());
          dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;
        }
      } catch (error) {
        continue;
      }

      const labResultId = createdResults[measurement.LabResultID];
      if (!labResultId) continue;

      let value = measurement.Value.trim();
      if (value === '<Memo>') {
        value = 'Memo';
      } else if (value.startsWith('<') && !isNaN(value.substring(1))) {
        value = value.substring(1);
      } else if (value.includes('/')) {
        value = value.split('/')[0].trim();
      }

      await strapiAPI('measurements', 'POST', {
        measurementId: measurement.MeasurementID,
        value: value,
        dateTime: dateTimeStr,
        lab_result: labResultId,
        publishedAt: new Date().toISOString()
      });
    }
    
    // Import CMAS
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
    console.log(`✅ Imported ${newMeasurements.length} measurements`);
    console.log('🎉 SUCCESS! Patient created and imported');
    console.log(`👤 Patient: ${patientName}`);
    console.log(`📊 Data Summary:`);
    console.log(`   • ${newCMAS.length} randomized CMAS scores`);
    console.log(`   • ${newLabResults.length} lab result types`);
    console.log(`   • ${newMeasurements.length} randomized measurements`);
    console.log('💡 Refresh your frontend to see the new patient');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main
async function main() {
  const patientName = process.argv[2];
  
  if (!patientName) {
    console.log('❌ Please provide a patient name');
    console.log('Usage: node create-patient.js "Dr. John Smith"');
    process.exit(1);
  }
  
  await createPatient(patientName);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });
} 