// Netlify Function for Votifier Proxy
// Bu dosya netlify/functions/votifier.js olarak kaydedilmeli

const net = require('net')
const crypto = require('crypto')

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { serverAddress, serverPort, publicKey, encodedVote } = JSON.parse(event.body)

    if (!serverAddress || !serverPort || !publicKey || !encodedVote) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          error: 'Missing required parameters' 
        })
      }
    }

    // Base64 decode edilmiş vote'u RSA ile şifrele
    const voteJson = Buffer.from(encodedVote, 'base64').toString('utf8')
    const encryptedVote = encryptVote(voteJson, publicKey)

    // Votifier sunucusuna bağlan ve vote gönder
    const result = await sendVotifierVote(serverAddress, serverPort, encryptedVote)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('Votifier proxy error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        error: error.message 
      })
    }
  }
}

function encryptVote(voteJson, publicKey) {
  try {
    // Public key'i PEM formatına çevir
    let pemKey = publicKey
    if (!pemKey.includes('-----BEGIN PUBLIC KEY-----')) {
      pemKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`
    }
    
    // RSA public key ile şifrele
    const encrypted = crypto.publicEncrypt(
      {
        key: pemKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(voteJson, 'utf8')
    )
    
    return encrypted
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

function sendVotifierVote(serverAddress, serverPort, encryptedVote) {
  return new Promise((resolve) => {
    const client = new net.Socket()
    
    client.setTimeout(10000) // 10 saniye timeout
    
    client.connect(serverPort, serverAddress, () => {
      console.log('Connected to Votifier server')
      
      // Votifier protokolü: önce challenge gönder
      const challenge = generateRandomBytes(16)
      client.write(challenge)
    })
    
    client.on('data', (data) => {
      try {
        // Sunucudan gelen response'u parse et
        const response = data.toString('utf8').trim()
        
        if (response === 'ok') {
          // Challenge başarılı, şimdi şifrelenmiş vote'u gönder
          client.write(encryptedVote)
          
          // Son response'u bekle
          client.once('data', (finalData) => {
            const finalResponse = finalData.toString('utf8').trim()
            
            if (finalResponse === 'ok') {
              resolve({ status: 'ok' })
            } else {
              resolve({ status: 'error', error: finalResponse })
            }
            
            client.destroy()
          })
        } else {
          resolve({ status: 'error', error: response })
          client.destroy()
        }
      } catch (error) {
        resolve({ status: 'error', error: error.message })
        client.destroy()
      }
    })
    
    client.on('error', (error) => {
      console.error('Votifier connection error:', error)
      resolve({ 
        status: 'error', 
        error: `Connection failed: ${error.message}` 
      })
    })
    
    client.on('timeout', () => {
      console.error('Votifier connection timeout')
      resolve({ 
        status: 'error', 
        error: 'Connection timeout' 
      })
      client.destroy()
    })
    
    client.on('close', () => {
      console.log('Votifier connection closed')
    })
  })
}

function generateRandomBytes(length) {
  const bytes = Buffer.alloc(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}
