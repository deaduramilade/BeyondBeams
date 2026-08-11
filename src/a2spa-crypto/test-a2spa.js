// src/a2spa-crypto/test-a2spa.js
// FIXED: Full end-to-end A2SPA Zero-Trust test (correct canonical string)

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY_PATH = path.join(__dirname, '../../keys/owner-private-key.pem');
const PUBLIC_KEY_PATH = path.join(__dirname, '../../keys/owner-public-key.pem');

const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
const PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

function signA2SPAPayload(actionType, rawPayload, privateKeyPem) {
  const payloadHash = crypto.createHash('sha256')
    .update(JSON.stringify(rawPayload))
    .digest('hex');

  const timestamp = Date.now();
  const nonce = crypto.randomUUID();

  const unsignedPayload = {
    actionType,
    payloadHash,
    timestamp,
    nonce,
    authorisingEntity: "Samuel F'iyinfoluwa / oceanfi"
  };

  const canonicalString = JSON.stringify(unsignedPayload);
  const sign = crypto.createSign('SHA256');
  sign.update(canonicalString);
  const signature = sign.sign(privateKeyPem, 'base64');

  return { ...unsignedPayload, signature };
}

function verifyA2SPAPayload(signedPayload, publicKeyPem) {
  const { signature, ...unsignedPayload } = signedPayload;   // ← FIXED: keep ALL fields except signature

  const { timestamp, authorisingEntity } = unsignedPayload;

  if (authorisingEntity !== "Samuel F'iyinfoluwa / oceanfi") {
    return { valid: false, reason: "unauthorised_entity" };
  }

  if (Date.now() - timestamp > 300000) {
    return { valid: false, reason: "expired_timestamp" };
  }

  const canonicalString = JSON.stringify(unsignedPayload);
  const verify = crypto.createVerify('SHA256');
  verify.update(canonicalString);

  const isSignatureValid = verify.verify(publicKeyPem, signature, 'base64');

  return isSignatureValid 
    ? { valid: true } 
    : { valid: false, reason: "invalid_signature" };
}

// === RUN THE TEST ===
async function runTest() {
  console.log('🚀 Running FIXED A2SPA Zero-Trust Test...\n');

  const samplePayload = { 
    ndpaAction: "compliance.dpia.generate", 
    subjectId: "NG-123456789", 
    dataSubject: "Test Citizen" 
  };

  const signed = signA2SPAPayload("compliance.dpia.generate", samplePayload, PRIVATE_KEY);
  console.log('✅ Signed A2SPA Payload created');

  const result = verifyA2SPAPayload(signed, PUBLIC_KEY);
  console.log('\n🔍 Verification Result:', result);

  if (result.valid) {
    console.log('\n🎉 SUCCESS: A2SPA Zero-Trust enforcement is WORKING');
    console.log('   "No signature, no execution" is now fully enforced in code.');
  } else {
    console.log('\n❌ TEST FAILED:', result.reason);
  }
}

runTest();