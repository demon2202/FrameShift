import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FormattedTextProps {
  text?: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  const navigate = useNavigate();
  if (!text) return null;

  const words = text.split(/(\s+)/);

  return (
    <p className={className}>
      {words.map((word, index) => {
        // Tag
        if (word.startsWith('#') && word.length > 1) {
          const tag = word.substring(1);
          return (
            <span 
              key={index} 
              onClick={(e) => { e.stopPropagation(); navigate(`/explore?q=${tag}`); }}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              {word}
            </span>
          );
        }
        // Mention
        if (word.startsWith('@') && word.length > 1) {
          const mention = word.substring(1);
          // Assuming user name check isn't required here and it routes to unknown if faulty
          return (
            <span 
              key={index} 
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${mention}`); }}
              className="font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              {word}
            </span>
          );
        }
        // Regular Text
        return <React.Fragment key={index}>{word}</React.Fragment>;
      })}
    </p>
  );
};
