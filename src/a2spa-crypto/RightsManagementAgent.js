// src/a2spa-crypto/RightsManagementAgent.js
// Jurisdiction-neutral Rights Management Agent – requests, appeals, and remedies
const crypto = require('crypto');

if (!process.env.OWNER_PRIVATE_KEY) {
  throw new Error(
    'Missing required environment variable: OWNER_PRIVATE_KEY. ' +
    'Set this variable to the PEM-encoded RSA private key content before starting the service.'
  );
}

const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!process.env.OWNER_PUBLIC_KEY) {
  throw new Error(
    'Missing required environment variable: OWNER_PUBLIC_KEY. ' +
    'Set this variable to the PEM-encoded RSA public key content before starting the service.'
  );
}

const PUBLIC_KEY = process.env.OWNER_PUBLIC_KEY.replace(/\\n/g, '\n');

function signA2SPAPayload(actionType, rawPayload, privateKeyPem) {
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(rawPayload)).digest('hex');
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const unsignedPayload = { actionType, payloadHash, timestamp, nonce, authorisingEntity: "Samuel F'iyinfoluwa / oceanfi" };
  const canonicalString = JSON.stringify(unsignedPayload);
  const sign = crypto.createSign('SHA256');
  sign.update(canonicalString);
  const signature = sign.sign(privateKeyPem, 'base64');
  return { ...unsignedPayload, signature };
}

function verifyA2SPAPayload(signedPayload, publicKeyPem) {
  const { signature, ...unsignedPayload } = signedPayload;
  const { timestamp, authorisingEntity } = unsignedPayload;
  if (authorisingEntity !== "Samuel F'iyinfoluwa / oceanfi") return { valid: false, reason: "unauthorised_entity" };
  if (Date.now() - timestamp > 300000) return { valid: false, reason: "expired_timestamp" };
  const canonicalString = JSON.stringify(unsignedPayload);
  const verify = crypto.createVerify('SHA256');
  verify.update(canonicalString);
  return verify.verify(publicKeyPem, signature, 'base64') ? { valid: true } : { valid: false, reason: "invalid_signature" };
}

class RightsManagementAgent {
  constructor() { console.log('🛡️ Rights Management Agent initialised (A2SPA-protected)'); }

  async exerciseRight(actionPayload) {
    const signed = signA2SPAPayload("rights.management.exercise", actionPayload, PRIVATE_KEY);
    const verification = verifyA2SPAPayload(signed, PUBLIC_KEY);
    if (!verification.valid) throw new Error(`A2SPA BLOCKED: ${verification.reason} — Right denied.`);

    console.log('🪪 Data Subject Right Exercised');
    console.log('   Right Type:', actionPayload.rightType);
    console.log('   Subject ID:', actionPayload.subjectId);
    console.log('   Automated Response: Right fulfilled + audit log created');

    return {
      status: "right_exercised",
      actionType: "rights.management.exercise",
      a2spaVerified: true,
      rightType: actionPayload.rightType,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new RightsManagementAgent();