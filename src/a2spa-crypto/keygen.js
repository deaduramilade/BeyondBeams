// src/a2spa-crypto/keygen.js
// ONE-TIME OWNER KEY GENERATION — Pure Node.js (no tsx needed)

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'owner-private-key.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'owner-public-key.pem');

function generateKeys() {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log('✅ Keys already exist. Delete them only if you want to rotate keys.');
    return;
  }

  console.log('🔑 Generating ECDSA P-256 key pair for owner...');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });

  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

  console.log('🎉 OWNER KEYS GENERATED SUCCESSFULLY');
  console.log('   Private key →', PRIVATE_KEY_PATH);
  console.log('   Public key  →', PUBLIC_KEY_PATH);
  console.log('\n⚠️  NEVER commit or share the private key!');
  console.log('   keys/ folder is already in .gitignore');
}

generateKeys();