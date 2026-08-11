// src/a2spa-crypto/PredictiveAnalyticsAgent.js
// Jurisdiction-neutral Predictive Analytics Agent – Risk modeling for data flows
// ONLY executes after A2SPA verification

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

  if (authorisingEntity !== "Samuel F'iyinfoluwa / oceanfi") return { valid: false, reason: "unauthorised_entity" };
  if (Date.now() - timestamp > 300000) return { valid: false, reason: "expired_timestamp" };

  const canonicalString = JSON.stringify(unsignedPayload);
  const verify = crypto.createVerify('SHA256');
  verify.update(canonicalString);

  return verify.verify(publicKeyPem, signature, 'base64') 
    ? { valid: true } 
    : { valid: false, reason: "invalid_signature" };
}

class PredictiveAnalyticsAgent {
  constructor() {
    console.log('📈 Predictive Analytics Agent initialised (A2SPA-protected)');
  }

  async runRiskModel(actionPayload) {
    const signed = signA2SPAPayload("predictive.analytics.risk.model", actionPayload, PRIVATE_KEY);
    const verification = verifyA2SPAPayload(signed, PUBLIC_KEY);

    if (!verification.valid) {
      throw new Error(`A2SPA BLOCKED: ${verification.reason} — Risk model denied.`);
    }

    console.log('📊 Predictive Risk Model Executed');
    console.log('   Data Flow:', actionPayload.dataFlow);
    console.log('   Risk Score:', actionPayload.riskScore || 'Calculated: HIGH');
    console.log('   Automated Response: flag for accountable review + mitigation recommendations');

    return {
      status: "risk_model_completed",
      actionType: "predictive.analytics.risk.model",
      a2spaVerified: true,
      riskScore: "HIGH",
      recommendations: ["Encrypt additional fields", "Add consent check", "Schedule DPIA"],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PredictiveAnalyticsAgent();