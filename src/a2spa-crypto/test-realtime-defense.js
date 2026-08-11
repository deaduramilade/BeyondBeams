// src/a2spa-crypto/test-realtime-defense.js
const defenseAgent = require('./RealTimeDefenseAgent');

async function testDefense() {
  const breachData = { 
    breachId: "NDPC-BREACH-001", 
    affectedRecords: 1247, 
    dataFlow: "government-portal" 
  };

  try {
    const result = await defenseAgent.executeBreachDetection(breachData);
    console.log('\n🎉 Real-Time Defense Agent executed successfully');
    console.log(result);
  } catch (err) {
    console.error('\n❌', err.message);
  }
}

testDefense();