// Netlify Function for Votifier Proxy
// This function handles the communication between the frontend and Minecraft servers using Votifier protocol

const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { serverAddress, serverPort, publicKey, encodedVote } = JSON.parse(event.body);

    if (!serverAddress || !serverPort || !publicKey || !encodedVote) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: 'error', 
          error: 'Missing required parameters' 
        })
      };
    }

    // For demo purposes, we'll simulate a successful votifier response
    // In a real implementation, you would:
    // 1. Parse the public key
    // 2. Decrypt the vote data
    // 3. Send the vote to the Minecraft server via TCP socket
    // 4. Handle the response

    console.log('Votifier request:', {
      serverAddress,
      serverPort,
      publicKey: publicKey.substring(0, 50) + '...',
      encodedVote: encodedVote.substring(0, 50) + '...'
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        status: 'ok',
        message: 'Vote processed successfully',
        timestamp: new Date().toISOString()
      })
    };

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

// Handle preflight requests
exports.handler = async (event, context) => {
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { serverAddress, serverPort, publicKey, encodedVote } = JSON.parse(event.body);

    if (!serverAddress || !serverPort || !publicKey || !encodedVote) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: 'error', 
          error: 'Missing required parameters' 
        })
      };
    }

    // For demo purposes, we'll simulate a successful votifier response
    // In a real implementation, you would:
    // 1. Parse the public key
    // 2. Decrypt the vote data
    // 3. Send the vote to the Minecraft server via TCP socket
    // 4. Handle the response

    console.log('Votifier request:', {
      serverAddress,
      serverPort,
      publicKey: publicKey.substring(0, 50) + '...',
      encodedVote: encodedVote.substring(0, 50) + '...'
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        status: 'ok',
        message: 'Vote processed successfully',
        timestamp: new Date().toISOString()
      })
    };

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