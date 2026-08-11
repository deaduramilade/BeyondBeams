// src/a2spa-crypto/RealTimeDefenseAgent.js
// Real-Time Defense agent
// ONLY executes after successful A2SPA verification

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
  const { signature, ...unsignedPayload } = signedPayload;

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

class RealTimeDefenseAgent {
  constructor() {
    console.log('🛡️ Real-Time Defense Agent initialised (A2SPA-protected)');
  }

  async executeBreachDetection(actionPayload) {
    const signed = signA2SPAPayload("realtime.defense.breach.detect", actionPayload, PRIVATE_KEY);
    const verification = verifyA2SPAPayload(signed, PUBLIC_KEY);

    if (!verification.valid) {
      throw new Error(`A2SPA BLOCKED: ${verification.reason} — Action denied.`);
    }

    console.log('🚨 BREACH DETECTED (simulated)');
    console.log('   Payload:', actionPayload);
    console.log('   Automated Response: notify accountable incident authority + isolate affected data flow');

    return {
      status: "breach_handled",
      actionType: "realtime.defense.breach.detect",
      a2spaVerified: true,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new RealTimeDefenseAgent();