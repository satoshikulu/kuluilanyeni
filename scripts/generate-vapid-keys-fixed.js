// Fixed VAPID Keys Generator for Web Push Protocol
import crypto from 'crypto';

function base64urlEscape(str) {
  return str.replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
}

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

  // Convert to base64url format (proper Web Push format)
  const publicKeyBase64url = base64urlEscape(publicKey.toString('base64'));
  const privateKeyBase64url = base64urlEscape(privateKey.toString('base64'));

  console.log('🔑 VAPID Keys Generated (Web Push Compatible):');
  console.log('');
  console.log('PUBLIC KEY (for frontend):');
  console.log(publicKeyBase64url);
  console.log('');
  console.log('PRIVATE KEY (for backend/edge functions):');
  console.log(privateKeyBase64url);
  console.log('');
  console.log('📝 Add these to your environment variables:');
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKeyBase64url}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKeyBase64url}`);
  console.log('');
  console.log('📧 VAPID Subject (your email or website):');
  console.log('mailto:satoshinakamototokyo42@gmail.com');
  
  return {
    publicKey: publicKeyBase64url,
    privateKey: privateKeyBase64url
  };
}

generateVAPIDKeys();