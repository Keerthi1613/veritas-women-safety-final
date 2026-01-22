import React, { useState } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FaceCheck = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { label: string; score: number; isAI: boolean }>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const isLikelyAI = (label: string, confidence: number) => {
    const labelLower = label.toLowerCase();

    // AI-related keywords
    const aiKeywords = [
      'cartoon',
      'digital',
      'render',
      'toy',
      'drawing',
      'mask',
      'illustration',
      'animation',
    ];

    // AI-style results (e.g., overly perfect female portraits)
    const suspiciousVisuals = [
      'brassiere',
      'bandeau',
      'gown',
      'gorgeous',
      'makeup',
      'smile',
      'hairstyle',
      'cleavage',
    ];

    const suspiciousGeneric =
      (labelLower.includes('person') || labelLower.includes('face')) && confidence >= 99;

    return (
      aiKeywords.some((kw) => labelLower.includes(kw)) ||
      suspiciousVisuals.some((kw) => labelLower.includes(kw)) ||
      suspiciousGeneric
    );
  };

  const analyzeImage = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/resnet-50',
        file,
        {
          headers: {
            Authorization: `Bearer $
            {import.meta.env.VITE_HF_TOKEN}`,
            'Content-Type': file.type,
          },
        }
      );

      const predictions = response.data;

      if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error('Unexpected response from AI model.');
      }

      const top = predictions[0];
      const confidence = top.score * 100;
      const isAI = isLikelyAI(top.label, confidence);

      setResult({
        label: top.label,
        score: confidence,
        isAI,
      });
    } catch (err: any) {
      console.error('API ERROR:', err.response?.data || err.message);
      if (err.response) {
        alert('API ERROR: ' + JSON.stringify(err.response.data));
      } else {
        alert('NETWORK ERROR: ' + err.message);
      }
      setError('Something went wrong during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow veritas-container max-w-3xl mx-auto px-4 py-8">
        <h1 className="page-title">FaceCheck – AI Image Detector</h1>
        <p className="text-center text-gray-600 mb-4">
          Upload a profile image to check if it's AI-generated or a real photograph.
        </p>

        <div className="bg-white border p-6 rounded-xl shadow space-y-6">
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0 file:font-medium
              file:bg-veritas-lightPurple file:text-veritas-purple hover:file:bg-veritas-lightPurple/90"
          />

          {previewUrl && (
            <div className="border rounded-md p-4">
              <p className="text-sm mb-2">Preview:</p>
              <img src={previewUrl} alt="Preview" className="max-w-full h-64 object-contain mx-auto" />
            </div>
          )}

          <Button onClick={analyzeImage} disabled={loading || !file} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              'Analyze Image'
            )}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.isAI ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center space-x-2">
                {result.isAI ? (
                  <AlertTriangle className="text-red-500" />
                ) : (
                  <CheckCircle className="text-green-600" />
                )}
                <p className="font-semibold text-sm">
                  This image is likely <strong>{result.isAI ? 'AI-Generated' : 'Real'}</strong>{' '}
                  ({result.label}, Confidence: {result.score.toFixed(2)}%)
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FaceCheck;
