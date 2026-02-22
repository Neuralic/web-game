"use client";

interface DescriptionSectionProps {
  description?: string;
}

const URL_REGEX = /(https?:\/\/[^\s<>"]+)/g;

function renderWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
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
            {renderWithLinks(description)}
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
