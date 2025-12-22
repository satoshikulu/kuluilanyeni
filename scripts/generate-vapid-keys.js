// VAPID Keys Generator for Web Push Protocol
import crypto from 'crypto';

function generateVAPIDKeys() {
  // Generate ECDSA P-256 key pair for VAPID
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  // Convert to base64url format
  const publicKeyBase64 = publicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  const privateKeyBase64 = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  console.log('🔑 VAPID Keys Generated:');
  console.log('');
  console.log('PUBLIC KEY (for frontend):');
  console.log(publicKeyBase64);
  console.log('');
  console.log('PRIVATE KEY (for backend/edge functions):');
  console.log(privateKeyBase64);
  console.log('');
  console.log('📝 Add these to your environment variables:');
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKeyBase64}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKeyBase64}`);
  console.log('');
  console.log('📧 VAPID Subject (your email or website):');
  console.log('mailto:satoshinakamototokyo42@gmail.com');
  
  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

generateVAPIDKeys();