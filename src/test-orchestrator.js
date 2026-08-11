// src/test-orchestrator.js
const oblivionAI = require('./OblivionAI');

async function testOrchestrator() {
  const breachPayload = { 
    breachId: "PUBLIC-BREACH-002",
    affectedRecords: 3421, 
    dataFlow: "public-service-portal"
  };

  try {
    const result = await oblivionAI.execute("realtime.defense.breach.detect", breachPayload);
    console.log('\n🎉 Orchestrator executed successfully through A2SPA:');
    console.log(result);
  } catch (err) {
    console.error('\n❌', err.message);
  }
}

testOrchestrator();