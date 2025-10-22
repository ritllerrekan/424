import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';
import { verifyCertificateByHash, getCertificateByCertificateId } from '../services/certificateStorageService';
import { verifyCertificateAuthenticity } from '../services/certificateService';

export function CertificateVerifier() {
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: any;
    message: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationResult(null);

      const certificate = await getCertificateByCertificateId(certificateId.trim());

      if (!certificate) {
        setVerificationResult({
          isValid: false,
          message: 'Certificate not found in database'
        });
        return;
      }

      const isValidHash = await verifyCertificateByHash(
        certificate.certificate_hash,
        certificate.batch_number
      );

      const isAuthentic = await verifyCertificateAuthenticity(
        certificate.certificate_hash,
        certificate.batch_number,
        ''
      );

      if (isValidHash && certificate.blockchain_verified) {
        setVerificationResult({
          isValid: true,
          certificate,
          message: 'Certificate is valid and verified on blockchain'
        });
      } else {
        setVerificationResult({
          isValid: false,
          certificate,
          message: 'Certificate found but verification failed'
        });
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setVerificationResult({
        isValid: false,
        message: 'Error occurred during verification'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-800">Certificate Verification</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificate ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="Enter certificate ID (e.g., CERT-BATCH123-1234567890)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          />
          <button
            onClick={handleVerify}
            disabled={isVerifying || !certificateId.trim()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Verify
          </button>
        </div>
      </div>

      {verificationResult && (
        <div
          className={`p-6 rounded-lg border-2 ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.isValid ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`text-lg font-bold mb-2 ${
                  verificationResult.isValid ? 'text-emerald-900' : 'text-red-900'
                }`}
              >
                {verificationResult.isValid ? 'Certificate Valid' : 'Invalid Certificate'}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  verificationResult.isValid ? 'text-emerald-800' : 'text-red-800'
                }`}
              >
                {verificationResult.message}
              </p>

              {verificationResult.certificate && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Batch Number:</span>
                      <p className="text-gray-900">{verificationResult.certificate.batch_number}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Generated:</span>
                      <p className="text-gray-900">
                        {new Date(verificationResult.certificate.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Generated By:</span>
                      <p className="text-gray-900 truncate">
                        {verificationResult.certificate.generated_by}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Blockchain:</span>
                      <p className="text-gray-900">
                        {verificationResult.certificate.blockchain_verified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                  </div>

                  {verificationResult.certificate.ipfs_hash && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm">IPFS Hash:</span>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${verificationResult.certificate.ipfs_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm mt-1"
                      >
                        <span className="font-mono">{verificationResult.certificate.ipfs_hash}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {verificationResult.certificate.participants && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm mb-2 block">
                        Supply Chain Participants:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {verificationResult.certificate.participants.collector && (
                          <div>
                            <span className="text-gray-600">Collector:</span>
                            <p className="font-mono text-gray-900">
                              {verificationResult.certificate.participants.collector.slice(0, 10)}...
                            </p>
                          </div>
                        )}
                        {verificationResult.certificate.participants.tester && (
                          <div>
                            <span className="text-gray-600">Tester:</span>
                            <p className="font-mono text-gray-900">
                              {verificationResult.certificate.participants.tester.slice(0, 10)}...
                            </p>
                          </div>
                        )}
                        {verificationResult.certificate.participants.processor && (
                          <div>
                            <span className="text-gray-600">Processor:</span>
                            <p className="font-mono text-gray-900">
                              {verificationResult.certificate.participants.processor.slice(0, 10)}...
                            </p>
                          </div>
                        )}
                        {verificationResult.certificate.participants.manufacturer && (
                          <div>
                            <span className="text-gray-600">Manufacturer:</span>
                            <p className="font-mono text-gray-900">
                              {verificationResult.certificate.participants.manufacturer.slice(0, 10)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-700 text-sm">Certificate Hash:</span>
                    <p className="font-mono text-xs text-gray-600 break-all mt-1">
                      {verificationResult.certificate.certificate_hash}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How to verify:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Enter the Certificate ID from your downloaded certificate</li>
          <li>Click the Verify button</li>
          <li>Check that the certificate details match your records</li>
          <li>Verify the blockchain hash matches if needed</li>
        </ol>
      </div>
    </div>
  );
}
