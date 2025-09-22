// Advanced Votifier Implementation for Netlify Functions
// This implements the actual Votifier protocol for Minecraft servers

const net = require('net');
const crypto = require('crypto');

// Votifier Protocol Implementation
class VotifierClient {
  constructor(publicKey, serverAddress, serverPort) {
    this.publicKey = publicKey;
    this.serverAddress = serverAddress;
    this.serverPort = serverPort;
  }

  async sendVote(voteData) {
    return new Promise((resolve, reject) => {
      try {
        // Parse the public key
        const key = this.parsePublicKey(this.publicKey);
        
        // Create the vote payload
        const payload = this.createVotePayload(voteData);
        
        // Encrypt the payload
        const encryptedPayload = crypto.publicEncrypt({
          key: key,
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from(payload, 'utf8'));

        // Create the socket connection
        const socket = new net.Socket();
        const timeout = 10000; // 10 seconds timeout

        socket.setTimeout(timeout);

        socket.on('connect', () => {
          console.log('Connected to Minecraft server');
          
          // Send the encrypted payload
          socket.write(encryptedPayload);
        });

        socket.on('data', (data) => {
          console.log('Received response from server');
          socket.destroy();
          
          // Parse the response
          const response = this.parseResponse(data);
          resolve({
            status: 'ok',
            response: response
          });
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
          socket.destroy();
          reject({
            status: 'error',
            error: 'Connection failed',
            details: error.message
          });
        });

        socket.on('timeout', () => {
          console.error('Connection timeout');
          socket.destroy();
          reject({
            status: 'error',
            error: 'Connection timeout'
          });
        });

        // Connect to the server
        socket.connect(this.serverPort, this.serverAddress);

      } catch (error) {
        reject({
          status: 'error',
          error: 'Failed to process vote',
          details: error.message
        });
      }
    });
  }

  parsePublicKey(publicKeyString) {
    try {
      // Remove headers and format the key
      const cleanKey = publicKeyString
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
      
      const keyBuffer = Buffer.from(cleanKey, 'base64');
      return crypto.createPublicKey({
        key: keyBuffer,
        format: 'der',
        type: 'spki'
      });
    } catch (error) {
      throw new Error('Invalid public key format');
    }
  }

  createVotePayload(voteData) {
    // Create the vote payload according to Votifier protocol
    const payload = {
      serviceName: voteData.serviceName || 'MineVote',
      username: voteData.username,
      address: voteData.address,
      timestamp: voteData.timestamp,
      uuid: voteData.uuid || this.generateUUID()
    };

    return JSON.stringify(payload);
  }

  parseResponse(data) {
    try {
      return JSON.parse(data.toString());
    } catch (error) {
      return { message: data.toString() };
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { serverAddress, serverPort, publicKey, encodedVote } = JSON.parse(event.body);

    if (!serverAddress || !serverPort || !publicKey || !encodedVote) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          status: 'error', 
          error: 'Missing required parameters' 
        })
      };
    }

    // Decode the vote data
    let voteData;
    try {
      voteData = JSON.parse(Buffer.from(encodedVote, 'base64').toString('utf8'));
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'error',
          error: 'Invalid vote data format'
        })
      };
    }

    console.log('Processing votifier request:', {
      serverAddress,
      serverPort,
      username: voteData.username,
      timestamp: voteData.timestamp
    });

    // Create Votifier client and send vote
    const votifierClient = new VotifierClient(publicKey, serverAddress, serverPort);
    
    try {
      const result = await votifierClient.sendVote(voteData);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'ok',
          message: 'Vote sent successfully',
          timestamp: new Date().toISOString(),
          response: result.response
        })
      };
    } catch (votifierError) {
      console.error('Votifier error:', votifierError);
      
      return {
        statusCode: 200, // Still return 200 but with error status
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'error',
          error: 'Failed to send vote to server',
          details: votifierError.error || 'Unknown error',
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error('Votifier proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'error',
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
