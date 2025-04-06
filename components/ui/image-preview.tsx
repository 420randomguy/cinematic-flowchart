import React from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
  imageUrl: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <div className="relative w-full h-20 overflow-hidden rounded-sm border border-gray-700/50">
      <Image
        src={imageUrl}
        alt="Preview"
        layout="fill"
        objectFit="contain" // Or 'cover', depending on desired behavior
        unoptimized // If using external URLs not configured in next.config.js
      />
    </div>
  );
};

export default ImagePreview; 