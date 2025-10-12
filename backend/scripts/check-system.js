const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '4d682e139d517cab23503adc976844622ebcef9ff0dda520483938bfc49b10c8ed152f66eb478fbbb2d1b1220f997e8d2c5c7d79e4e5464ba7123eedf9a3163140b980b7f05b6730803d389743f7b1341d887bc27b8222c53f8df8626ea3a68b55bd28b99d9824f8494cc1430091613b8b9348210c71856fc4809a6cf08fe9b5';

async function checkSystem() {
  console.log('🔍 Patient Creation System Status Check');
  console.log('━'.repeat(50));
  
  let allGood = true;
  
  // 1. Check Node.js version
  console.log(`📦 Node.js version: ${process.version}`);
  
  // 2. Check file system
  console.log('\n📁 File System Check:');
  const templateDir = path.join(__dirname, '../../PatientData/patientxD');
  const scripts = [
    'create-randomized-patient.js',
    'create-multiple-patients.js'
  ];
  
  if (fs.existsSync(templateDir)) {
    console.log('✅ Template data directory exists');
    
    // Check template files
    const templateFiles = ['Patient.csv', 'CMAS.csv', 'Measurement.csv', 'LabResult.csv', 'LabResultGroup.csv'];
    templateFiles.forEach(file => {
      const filePath = path.join(templateDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ Template file: ${file}`);
      } else {
        console.log(`❌ Missing template file: ${file}`);
        allGood = false;
      }
    });
  } else {
    console.log('❌ Template data directory missing');
    allGood = false;
  }
  
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
      allGood = false;
    }
  });
  
  // 3. Check dependencies
  console.log('\n📦 Dependencies Check:');
  const requiredDeps = ['axios', 'csv-writer', 'uuid'];
  const packagePath = path.join(__dirname, '../package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        console.log(`✅ Dependency: ${dep} (${packageJson.dependencies[dep]})`);
      } else {
        console.log(`❌ Missing dependency: ${dep}`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log('❌ Could not read package.json');
    allGood = false;
  }
  
  // 4. Check Strapi connection
  console.log('\n🔌 Strapi Connection Check:');
  try {
    const response = await axios.get(`${STRAPI_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Strapi connection successful');
    console.log(`📊 Found ${response.data.data?.length || 0} patients in database`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n👥 Current patients:');
      response.data.data.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (ID: ${patient.patientId || 'N/A'})`);
      });
    }
  } catch (error) {
    console.log('❌ Could not connect to Strapi');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure Strapi is running: npm run develop');
    allGood = false;
  }
  
  // 5. Final status
  console.log('\n🎯 System Status:');
  if (allGood) {
    console.log('✅ ALL SYSTEMS GO! Ready to create patients.');
    console.log('\n🚀 Quick start:');
    console.log('   • Single patient: node create-randomized-patient.js');
    console.log('   • Multiple patients: node create-multiple-patients.js 3');
  } else {
    console.log('❌ Some issues found. Please fix them before proceeding.');
    console.log('\n🛠️  Common fixes:');
    console.log('   • Start Strapi: cd ../.. && npm run develop');
    console.log('   • Install dependencies: npm install');
    console.log('   • Check template data in PatientData/patientxD/');
  }
  
  return allGood;
}

// Run if called directly
if (require.main === module) {
  checkSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 System check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkSystem }; 