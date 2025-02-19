/**
 * Message handler types
 */
type MessageType = 'saveApiKey' | 'getSelectedProvider';

interface SaveApiKeyData {
  provider: string;
  apiKey: string;
}

interface GetSelectedProviderData {
  siteId?: string;
}

type MessageData = SaveApiKeyData | GetSelectedProviderData;

interface Message {
  type: MessageType;
  data: MessageData;
}

/**
 * Handle messages from the designer extension
 */
export async function handleDesignerMessage(message: Message, userId: string) {
  console.log('Handling message:', message.type, 'for user:', userId);
  
  try {
    switch (message.type) {
      case 'saveApiKey': {
        const data = message.data as SaveApiKeyData;
        const { provider, apiKey } = data;
        if (!provider || !apiKey) {
          return { error: 'Missing required fields' };
        }
        
        // TODO: Implement proper secret storage
        console.log('Would save API key for:', provider);
        return { success: true };
      }
      
      case 'getSelectedProvider': {
        // TODO: Implement proper storage
        return { provider: 'openai' };
      }
      
      default: {
        console.warn('Unknown message type:', message.type);
        return { error: 'Unknown message type' };
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return { error: 'Internal server error' };
  }
}
