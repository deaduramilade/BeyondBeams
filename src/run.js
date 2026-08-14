// src/run.js
// BeyondBeams Command-Line Interface
// Usage: node run.js "actionType" "JSON payload"

const beyondBeams = require('./BeyondBeams');

const args = process.argv.slice(2);
const actionType = args[0];
let payload = {};

if (args[1]) {
  try {
    payload = JSON.parse(args[1]);
  } catch (e) {
    console.error("❌ Invalid JSON payload");
    process.exit(1);
  }
}

if (!actionType) {
  console.log("\n🚀 BeyondBeams CLI");
  console.log("Usage: node run.js <actionType> <JSON-payload>\n");
  console.log("Examples:");
  console.log('  node run.js "realtime.defense.breach.detect" \'{"breachId":"TEST-001","affectedRecords":500}\'');
  console.log('  node run.js "compliance.automation.dpia.generate" \'{"projectName":"Portal v2","riskLevel":"High"}\'');
  console.log('  node run.js "predictive.analytics.risk.model" \'{"dataFlow":"Public Service Portal"}\'');
  process.exit(0);
}

console.log(`\n🔥 Executing BeyondBeams action: ${actionType}\n`);

beyondBeams.execute(actionType, payload)
  .then(result => {
    console.log("\n✅ SUCCESS:");
    console.dir(result, { depth: null });
  })
  .catch(err => {
    console.error("\n❌ ERROR:", err.message);
  });
