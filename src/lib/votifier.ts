// Basit Votifier Client - Browser uyumlu
export interface VotifierVote {
  serviceName: string
  username: string
  address: string
  timestamp: string
  uuid?: string
}

export interface VotifierResponse {
  status: 'ok' | 'error'
  challenge?: string
  error?: string
}

/**
 * Basit votifier client - proxy üzerinden çalışır
 */
export class VotifierClient {
  private publicKey: string
  private serverAddress: string
  private serverPort: number

  constructor(publicKey: string, serverAddress: string, serverPort: number) {
    this.publicKey = publicKey
    this.serverAddress = serverAddress
    this.serverPort = serverPort
  }

  /**
   * Votifier protokolü ile Minecraft sunucusuna oy bildirimi gönderir
   */
  async sendVote(username: string): Promise<VotifierResponse> {
    try {
      // Votifier vote objesi oluştur
      const vote: VotifierVote = {
        serviceName: 'MineVote',
        username: username,
        address: this.serverAddress,
        timestamp: new Date().toISOString(),
        uuid: this.generateUUID()
      }

      // Vote objesini JSON string'e çevir
      const voteJson = JSON.stringify(vote)
      
      // Basit Base64 encoding (gerçek RSA şifreleme yerine)
      const encodedVote = btoa(voteJson)
      
      // Sunucuya gönder
      const response = await this.sendToServer(encodedVote)
      
      return response
    } catch (error) {
      console.error('Votifier error:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Şifrelenmiş vote'u sunucuya gönderir
   */
  private async sendToServer(encodedVote: string): Promise<VotifierResponse> {
    try {
      const response = await fetch('/.netlify/functions/votifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverAddress: this.serverAddress,
          serverPort: this.serverPort,
          publicKey: this.publicKey,
          encodedVote: encodedVote
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Votifier proxy error:', error)
      return {
        status: 'error',
        error: `Proxy connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * UUID oluşturur
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

/**
 * Votifier client oluşturur ve vote gönderir
 */
export async function sendVotifierVote(
  publicKey: string,
  serverAddress: string,
  serverPort: number,
  username: string
): Promise<VotifierResponse> {
  const client = new VotifierClient(publicKey, serverAddress, serverPort)
  return await client.sendVote(username)
}
