import React from 'react';

interface Step {
  number: number;
  text: string;
  icon: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="py-4 px-6">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                {/* Step */}
                <div className="flex flex-col items-center relative">
                  {/* Número del paso */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all duration-300
                      ${currentStep >= step.number
                        ? 'bg-blue-600 text-white transform scale-110 shadow-lg'
                        : 'bg-gray-300 text-gray-600'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  
                  {/* Texto del paso */}
                  <span
                    className={`
                      text-xs font-medium text-center transition-all duration-300
                      ${currentStep >= step.number
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-500'
                      }
                    `}
                  >
                    {step.text}
                  </span>
                </div>

                {/* Conector */}
                {index < steps.length - 1 && (
                  <div className="flex items-center mx-4 lg:mx-6 mt-0 mb-6">
                    <div
                      className={`
                        h-0.5 w-12 lg:w-16 transition-all duration-300
                        ${currentStep > step.number
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                        }
                      `}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;