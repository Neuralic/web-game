"use client";

interface DescriptionSectionProps {
  description?: string;
}

export default function DescriptionSection({
  description,
}: DescriptionSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
        Description
      </h3>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
        {description ? (
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            No description yet.
          </p>
        )}
      </div>
    </div>
  );
}
