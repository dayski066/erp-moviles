import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
}

interface ProgressIndicatorProps {
  progress: number;
  sections: Section[];
  onSectionClick: (sectionId: string) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  sections,
  onSectionClick
}) => {
  return (
    <div className="flex items-center space-x-4">
      {/* Barra de progreso */}
      <div className="flex-1 max-w-xs">
        <div className="bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progress}% completado
        </div>
      </div>

      {/* Indicadores de sección */}
      <div className="flex items-center space-x-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          
          return (
            <motion.button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              disabled={section.isDisabled}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                ${section.isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : section.isCompleted 
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : section.isDisabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
                }
              `}
              whileHover={!section.isDisabled ? { scale: 1.05 } : {}}
              whileTap={!section.isDisabled ? { scale: 0.95 } : {}}
            >
              {section.isCompleted ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {section.title}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}; 