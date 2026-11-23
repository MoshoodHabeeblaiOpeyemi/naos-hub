import { useState } from 'react';

/**
 * ImageUploader - Reusable component for uploading images to ImgBB
 * Accepts an image file, converts to base64, and POSTs to ImgBB API
 * Returns the image URL via onImageUploaded callback
 */
export default function ImageUploader({ onImageUploaded, initialImage = '' }) {
  const [file, setFile] = useState(null);
  const [displayImage, setDisplayImage] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Preview the image
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => {
        setDisplayImage(reader.result);
      };
      setError('');
    }
  };

  const uploadImage = async () => {
    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Convert image to base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const dataUrl = reader.result;
          // Extract just the base64 part after the comma
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });

      // POST to ImgBB API
      const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: imgbbApiKey,
          image: base64String,
        }),
      });

      const data = await response.json();

      if (data.status !== 200) {
        throw new Error(data.error || 'ImgBB upload failed');
      }

      // Return the image URL via callback
      onImageUploaded(data.data.url);
      setDisplayImage(data.data.url);
      setFile(null);
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Image preview */}
      {displayImage && (
        <img
          src={displayImage}
          alt="Preview"
          className="max-w-full rounded-md h-40 object-cover"
        />
      )}

      {/* File input */}
      <div className="border-2 border-naos-gray/50 rounded-md p-4 cursor-pointer hover:border-naos-green transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-6 w-6 text-naos-gray/60"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M19 14c0 1-1 2-2 2H7v2H5v2H4v-2H2v2H1v-1h1v1h3v-1h1v1h3v-4h-2v4zM21 5c0-1.1-.9-2-2-2h-4c0 1 .9 2 2 2h4c-1 0-2-.9-2-2V3c0-1.1.9-2 2-2h4c1 0 2 .9 2 2v2zM7 6h2v2H7V6zm0 8h2v2H7v-2zm5-3h1v9h-1V6zM7 3h2v2H7V3zm0 12h2v2H7v-2z"
            />
          </svg>
          <span className="text-sm text-naos-text">Click to upload or drag image</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Upload button */}
      {file && !isUploading && (
        <button
          onClick={uploadImage}
          className="mt-2 rounded-md bg-naos-green px-4 py-2 text-sm font-bold text-white transition hover:bg-naos-dark shadow-xs"
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
      )}

      {/* Success message */}
      {displayImage && !file && (
        <p className="text-sm text-naos-green">Image uploaded successfully!</p>
      )}
    </div>
  );
}