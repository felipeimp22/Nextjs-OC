'use client';

interface ColorPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function ColorPreview({ primaryColor, secondaryColor, accentColor }: ColorPreviewProps) {
  return (
    <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-4">Color Preview</p>
      <div className="flex gap-4">
        <div className="flex-1 text-center">
          <div
            className="h-16 rounded-lg shadow-sm border border-gray-200"
            style={{ backgroundColor: primaryColor }}
          />
          <p className="text-xs text-gray-600 mt-2">Primary</p>
        </div>
        <div className="flex-1 text-center">
          <div
            className="h-16 rounded-lg shadow-sm border border-gray-200"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-xs text-gray-600 mt-2">Secondary</p>
        </div>
        <div className="flex-1 text-center">
          <div
            className="h-16 rounded-lg shadow-sm border border-gray-200"
            style={{ backgroundColor: accentColor }}
          />
          <p className="text-xs text-gray-600 mt-2">Accent</p>
        </div>
      </div>
    </div>
  );
}
