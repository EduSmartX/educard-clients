import { BRANDING } from '@/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      img: 'h-8 w-8',
      text: 'text-base',
    },
    md: {
      img: 'h-10 w-10',
      text: 'text-lg',
    },
    lg: {
      img: 'h-12 w-12',
      text: 'text-xl',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="40" r="35" fill="#60A5FA" />
          <path d="M 30 40 Q 30 60, 50 70 Q 70 60, 70 40" fill="#3B82F6" />
          <rect x="20" y="75" width="60" height="8" rx="2" fill="#1E40AF" />
          <circle cx="35" cy="35" r="3" fill="white" />
          <circle cx="65" cy="35" r="3" fill="white" />
          <path d="M 40 50 Q 50 55, 60 50" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${sizes.text} text-gray-900`}>{BRANDING.APP_NAME}</span>
      )}
    </div>
  );
}
