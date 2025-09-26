/**
 * Walrus Storage Service with Seal Encryption
 * For encrypting and storing images on Walrus testnet
 */

import { SuiClient } from '@mysten/sui/client';
import { SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';

export interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      registeredEpoch: number;
      blobId: string;
      size: number;
      encodingType: string;
      certifiedEpoch: number | null;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
      deletable: boolean;
    };
    resourceOperation: {
      registerFromScratch: {
        encodedLength: number;
        epochsAhead: number;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

// Seal server configurations (from reference encryptionService.ts)
const serverObjectIds = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // mysten-testnet-1
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // mysten-testnet-2
  '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2', // Ruby Nodes
  '0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007'  // NodeInfra
];

// Sui configuration
const SUI_CLIENT = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
const PACKAGE_ID = '0xcfedf4e2445497ba1a5d57349d6fc116b194eca41524f46f593c63a7a70a8eab';

// Government whitelist ID (should match the deployed whitelist)
const GOVERNMENT_WHITELIST_ID = '0xca700b2604763639ba3fbf0237d4f1ab34470ac509d407d34030621b1a254747';

// Initialize Seal client
const sealClient = new SealClient({
  suiClient: SUI_CLIENT,
  serverConfigs: serverObjectIds.map((id) => ({
    objectId: id,
    weight: 1,
  })),
  verifyKeyServers: false,
});

export interface EncryptionResult {
  success: boolean;
  blobId?: string;
  encryptionId?: string;
  suiRef?: string;
  error?: string;
}

export class WalrusService {
  private readonly publisherUrl: string;
  private readonly aggregatorUrl: string;
  private readonly epochs: number;

  constructor(epochs: number = 1) {
    this.publisherUrl = 'https://publisher.walrus-testnet.walrus.space';
    this.aggregatorUrl = 'https://aggregator.walrus-testnet.walrus.space';
    this.epochs = epochs;
    
    console.log('🐋 Walrus service initialized:', {
      publisher: this.publisherUrl,
      aggregator: this.aggregatorUrl,
      epochs: this.epochs,
    });
  }

  /**
   * Store an encrypted image file on Walrus using Seal encryption
   */
  async storeImage(file: File, userAddress?: string): Promise<string> {
    try {
      console.log('� Starting encrypted image storage process...');
      console.log('📄 File:', file.name, file.size, 'bytes');

      // Step 1: Generate encryption ID
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(GOVERNMENT_WHITELIST_ID);
      const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      
      console.log('🔑 Generated Encryption ID:', encryptionId);

      // Step 2: Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      console.log('📊 File converted to Uint8Array:', fileData.length, 'bytes');

      // Step 3: Encrypt with Seal
      console.log('🔒 Encrypting with Seal protocol...');
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId: PACKAGE_ID,
        id: encryptionId,
        data: fileData,
      });
      
      console.log('✅ Image encrypted successfully');
      console.log('📦 Encrypted data size:', encryptedBytes.length, 'bytes');

      // Step 4: Store encrypted data on Walrus
      console.log('☁️ Uploading encrypted data to Walrus...');
      const response = await fetch(`${this.publisherUrl}/v1/blobs?epochs=${this.epochs}`, {
        method: 'PUT',
        body: encryptedBytes,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to store on Walrus: ${response.status} - ${errorText}`);
      }

      const result: WalrusStoreResponse = await response.json();
      console.log('✅ Encrypted image stored on Walrus:', result);

      // Extract blob ID from response
      let blobId: string;
      if (result.newlyCreated) {
        blobId = result.newlyCreated.blobObject.blobId;
      } else if (result.alreadyCertified) {
        blobId = result.alreadyCertified.blobId;
      } else {
        throw new Error('Unexpected Walrus response format');
      }

      console.log('🎉 Storage completed successfully!');
      console.log('🆔 Blob ID:', blobId);
      console.log('🔐 Encryption ID:', encryptionId);

      return blobId;
    } catch (error) {
      console.error('❌ Error storing encrypted image:', error);
      throw error;
    }
  }

  /**
   * Store an encrypted image file on Walrus and return full encryption details
   */
  async storeImageWithEncryption(file: File, userAddress: string): Promise<EncryptionResult> {
    try {
      console.log('🔐 Starting encrypted image storage with full details...');
      console.log('📄 File:', file.name, file.size, 'bytes');
      console.log('👤 User Address:', userAddress);

      // Step 1: Generate encryption ID
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(GOVERNMENT_WHITELIST_ID);
      const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      
      console.log('🔑 Generated Encryption ID:', encryptionId);

      // Step 2: Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      console.log('📊 File converted to Uint8Array:', fileData.length, 'bytes');

      // Step 3: Encrypt with Seal
      console.log('🔒 Encrypting with Seal protocol...');
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId: PACKAGE_ID,
        id: encryptionId,
        data: fileData,
      });
      
      console.log('✅ Image encrypted successfully');
      console.log('📦 Encrypted data size:', encryptedBytes.length, 'bytes');

      // Step 4: Store encrypted data on Walrus
      console.log('☁️ Uploading encrypted data to Walrus...');
      const response = await fetch(`${this.publisherUrl}/v1/blobs?epochs=${this.epochs}`, {
        method: 'PUT',
        body: encryptedBytes,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to store on Walrus: ${response.status} - ${errorText}`);
      }

      const result: WalrusStoreResponse = await response.json();
      console.log('✅ Encrypted image stored on Walrus:', result);

      // Step 5: Extract blob information
      let blobId: string;
      let suiRef: string;
      
      if (result.alreadyCertified) {
        blobId = result.alreadyCertified.blobId;
        suiRef = result.alreadyCertified.event.txDigest;
        console.log('📋 Status: Already certified');
      } else if (result.newlyCreated) {
        blobId = result.newlyCreated.blobObject.blobId;
        suiRef = result.newlyCreated.blobObject.id;
        console.log('📋 Status: Newly created');
      } else {
        throw new Error('Unexpected Walrus response format');
      }

      console.log('🎉 Encryption and storage completed successfully!');
      console.log('🆔 Blob ID:', blobId);
      console.log('🔗 Sui Reference:', suiRef);
      console.log('🔐 Encryption ID:', encryptionId);

      return {
        success: true,
        blobId,
        encryptionId,
        suiRef
      };

    } catch (error) {
      console.error('❌ Encryption and storage failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Store image data as ArrayBuffer on Walrus
   */
  async storeImageData(imageData: ArrayBuffer, contentType: string = 'image/jpeg'): Promise<string> {
    try {
      console.log('📤 Storing image data on Walrus:', {
        size: imageData.byteLength,
        type: contentType,
      });

      const response = await fetch(`${this.publisherUrl}/v1/blobs?epochs=${this.epochs}`, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: imageData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to store on Walrus: ${response.status} - ${errorText}`);
      }

      const result: WalrusStoreResponse = await response.json();
      console.log('✅ Image data stored on Walrus:', result);

      // Extract blob ID from response
      if (result.newlyCreated) {
        return result.newlyCreated.blobObject.blobId;
      } else if (result.alreadyCertified) {
        return result.alreadyCertified.blobId;
      } else {
        throw new Error('Unexpected Walrus response format');
      }
    } catch (error) {
      console.error('❌ Error storing image data on Walrus:', error);
      throw error;
    }
  }

  /**
   * Retrieve an image from Walrus by blob ID
   */
  async retrieveImage(blobId: string): Promise<Blob> {
    try {
      console.log('📥 Retrieving image from Walrus:', { blobId });

      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve from Walrus: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('✅ Image retrieved from Walrus:', {
        blobId,
        size: blob.size,
        type: blob.type,
      });

      return blob;
    } catch (error) {
      console.error('❌ Error retrieving image from Walrus:', error);
      throw error;
    }
  }

  /**
   * Get the direct URL for accessing a blob
   */
  getBlobUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  /**
   * Convert File to Uint8Array
   */
  async fileToUint8Array(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Convert Blob to data URL for display
   */
  async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Retrieve and decrypt an encrypted image from Walrus
   * Note: For full decryption, you need a SessionKey and transaction authorization
   * This is a simplified version for demo purposes
   */
  async retrieveAndDecryptImage(blobId: string, encryptionId: string, sessionKey?: any): Promise<Blob> {
    try {
      console.log('🔍 Retrieving encrypted image from Walrus...', { blobId, encryptionId });

      // Step 1: Retrieve encrypted data from Walrus
      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve from Walrus: ${response.status}`);
      }

      const encryptedData = await response.arrayBuffer();
      const encryptedBytes = new Uint8Array(encryptedData);
      
      console.log('📦 Retrieved encrypted data:', encryptedBytes.length, 'bytes');

      if (sessionKey) {
        // Step 2: Decrypt with Seal (requires session key and transaction)
        console.log('🔓 Decrypting with Seal protocol...');
        
        // This would require proper session key and transaction setup
        // For now, we'll throw an error indicating this needs proper authorization
        throw new Error('Decryption requires proper session key and government authorization. Use retrieveEncryptedImageUrl for viewing encrypted blob directly.');
      } else {
        // For demo purposes, return the encrypted data as is
        // In production, this should not be done
        console.log('⚠️ Returning encrypted data as blob (demo mode)');
        const blob = new Blob([encryptedBytes], { type: 'application/octet-stream' });
        return blob;
      }

    } catch (error) {
      console.error('❌ Error retrieving image:', error);
      throw error;
    }
  }

  /**
   * Get the direct URL to the encrypted blob (for viewing encrypted data)
   * This shows the encrypted blob data directly from Walrus
   */
  getEncryptedBlobUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  /**
   * Retrieve and decrypt an encrypted image, returning as data URL
   * Note: This requires proper session key authorization
   */
  async retrieveAndDecryptImageAsDataUrl(blobId: string, encryptionId: string, sessionKey?: any): Promise<string> {
    try {
      const blob = await this.retrieveAndDecryptImage(blobId, encryptionId, sessionKey);
      return await this.blobToDataUrl(blob);
    } catch (error) {
      console.error('❌ Error retrieving and decrypting image as data URL:', error);
      throw error;
    }
  }

  /**
   * Get encryption details for display
   */
  getEncryptionDetails(encryptionId: string) {
    return {
      encryptionId,
      whitelistId: GOVERNMENT_WHITELIST_ID,
      packageId: PACKAGE_ID,
      threshold: 2,
      serverCount: serverObjectIds.length,
    };
  }
}