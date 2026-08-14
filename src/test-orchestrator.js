// src/test-orchestrator.js
const beyondBeams = require('./BeyondBeams');

async function testOrchestrator() {
  const breachPayload = { 
    breachId: "PUBLIC-BREACH-002",
    affectedRecords: 3421, 
    dataFlow: "public-service-portal"
  };

  try {
    const result = await beyondBeams.execute("realtime.defense.breach.detect", breachPayload);
    console.log('\n🎉 Orchestrator executed successfully through A2SPA:');
    console.log(result);
  } catch (err) {
    console.error('\n❌', err.message);
  }
}

testOrchestrator();
