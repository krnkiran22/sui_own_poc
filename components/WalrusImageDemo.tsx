'use client';

import React, { useState, useCallback } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';
import { Upload, Download, WalletIcon, Image as ImageIcon, Loader2, CheckCircle, Aler              {/* Retrieved Encrypted Data Display */}
            {retrievedImageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">🔐 Retrieved Encrypted Data:</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🔒</div>
                    <p className="text-sm text-gray-600 mb-2">Encrypted Blob Data</p>
                    <p className="text-xs text-gray-500">
                      This data is encrypted with Seal protocol. To decrypt and view the actual image, 
                      you need proper government authorization and session keys.
                    </p>
                    <a 
                      href={retrievedImageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                    >
                      View Raw Encrypted Data
                    </a>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">
                  🔗 Encrypted Blob URL: {retrievedImageUrl}
                </p>
              </div>
            )}cide-react';
import { WalrusService } from '../lib/walrusService';

const walrusService = new WalrusService(5); // Store for 5 epochs

export default function WalrusImageDemo() {
  const currentAccount = useCurrentAccount();

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBlobId, setUploadedBlobId] = useState<string>('');
  const [retrieveBlobId, setRetrieveBlobId] = useState<string>('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedImageUrl, setRetrievedImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  }, []);

  // Handle image upload to Walrus with encryption
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Starting encrypted upload to Walrus...');
      const result = await walrusService.storeImageWithEncryption(selectedFile, currentAccount.address);
      
      if (result.success && result.blobId) {
        setUploadedBlobId(result.blobId);
        setSuccess(`Image encrypted and uploaded successfully! 
        🆔 Blob ID: ${result.blobId}
        🔐 Encryption ID: ${result.encryptionId}
        🔗 Sui Ref: ${result.suiRef}`);
        console.log('✅ Encrypted upload completed:', result);
      } else {
        throw new Error(result.error || 'Unknown encryption error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(`Encrypted upload failed: ${errorMessage}`);
      console.error('❌ Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, currentAccount]);

  // Handle encrypted image retrieval from Walrus
  const handleRetrieve = useCallback(async () => {
    if (!retrieveBlobId.trim()) {
      setError('Please enter a blob ID to retrieve');
      return;
    }

    setIsRetrieving(true);
    setError('');
    setRetrievedImageUrl('');

    try {
      console.log('🔍 Retrieving encrypted image from Walrus...', { blobId: retrieveBlobId });
      
      // Get the encrypted blob URL (this shows encrypted data)
      const encryptedImageUrl = walrusService.getEncryptedBlobUrl(retrieveBlobId);
      setRetrievedImageUrl(encryptedImageUrl);
      setSuccess(`Encrypted image retrieved successfully! Note: This shows the encrypted blob data. To decrypt, you need proper authorization.`);
      
      console.log('✅ Encrypted retrieval completed:', { encryptedImageUrl });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retrieval failed';
      setError(`Retrieval failed: ${errorMessage}`);
      console.error('❌ Retrieval error:', err);
    } finally {
      setIsRetrieving(false);
    }
  }, [retrieveBlobId]);



  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔐 Walrus Encrypted Image Storage Demo
        </h1>
        <p className="text-gray-600">
          Store and retrieve encrypted images using Walrus decentralized storage with Seal encryption
        </p>
      </div>

      {/* Wallet Connection Section */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WalletIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Wallet Status</h3>
              {currentAccount ? (
                <p className="text-sm text-blue-700">
                  Connected: {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                </p>
              ) : (
                <p className="text-sm text-blue-700">Not connected</p>
              )}
            </div>
          </div>
          
          <ConnectButton />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 justify-center">
              <Upload className="w-5 h-5" />
              🔐 Encrypt & Store Image on Walrus
            </h2>
            
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <ImageIcon className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-gray-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !currentAccount}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading to Walrus...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    🔐 Encrypt & Store on Walrus
                  </>
                )}
              </button>
            </div>
            
            {uploadedBlobId && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Blob ID:</p>
                <p className="text-sm text-green-700 font-mono break-all">{uploadedBlobId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Retrieve Section */}
        <div className="space-y-6">
          <div className="border-2 border-gray-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              🔍 Retrieve Encrypted Image from Walrus
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blob ID
                </label>
                <input
                  type="text"
                  value={retrieveBlobId}
                  onChange={(e) => setRetrieveBlobId(e.target.value)}
                  placeholder="Enter blob ID to retrieve..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleRetrieve}
                disabled={!retrieveBlobId.trim() || isRetrieving}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRetrieving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Retrieving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    🔍 Retrieve Encrypted Data
                  </>
                )}
              </button>
              
              {/* Quick fill button for uploaded blob */}
              {uploadedBlobId && (
                <button
                  onClick={() => setRetrieveBlobId(uploadedBlobId)}
                  className="w-full text-blue-600 text-sm hover:text-blue-700"
                >
                  Use uploaded blob ID
                </button>
              )}
            </div>
            
            {/* Retrieved Image Display */}
            {retrievedImageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Retrieved Image:</h3>
                <div className="border rounded-lg p-2 bg-gray-50">
                  <img
                    src={retrievedImageUrl}
                    alt="Retrieved from Walrus"
                    className="max-w-full h-auto rounded"
                    onError={() => setError('Failed to load image from Walrus')}
                    onLoad={() => console.log('✅ Image loaded successfully from Walrus')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">
                  URL: {retrievedImageUrl}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Store:</strong> Upload images to Walrus testnet for 5 epochs</li>
          <li>• <strong>Retrieve:</strong> Access images using their unique blob ID</li>
          <li>• <strong>Decentralized:</strong> Images are stored across multiple nodes</li>
          <li>• <strong>Persistent:</strong> Data remains available for the specified epochs</li>
        </ul>
      </div>
    </div>
  );
}