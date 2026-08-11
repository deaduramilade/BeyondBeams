// src/a2spa-crypto/keygen.ts
// ONE-TIME KEY GENERATION FOR OWNER (Samuel F'iyinfoluwa / oceanfi)
// NEVER commit private-key.pem to GitHub!

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const KEY_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'owner-private-key.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'owner-public-key.pem');

function generateKeys() {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log('✅ Keys already exist. Delete them only if you want to rotate.');
    return;
  }

  // Generate ECDSA P-256 key pair (secure and standard)
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });

  // Create keys directory (gitignored)
  if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 }); // Owner-only permissions
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

  console.log('🔑 OWNER KEYS GENERATED SUCCESSFULLY');
  console.log('   Private key →', PRIVATE_KEY_PATH);
  console.log('   Public key  →', PUBLIC_KEY_PATH);
  console.log('\n⚠️  NEVER share or commit the private key!');
  console.log('   Add "keys/" to .gitignore if not already present.');
}

generateKeys();

keys/