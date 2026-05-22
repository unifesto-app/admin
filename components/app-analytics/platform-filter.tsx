'use client';

import { Smartphone } from 'lucide-react';
import { AppleLogo, GooglePlayLogo } from './brand-icons';

interface PlatformFilterProps {
  value: 'ios' | 'android' | 'all';
  onChange: (value: 'ios' | 'android' | 'all') => void;
}

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const platforms = [
    { 
      value: 'all' as const, 
      label: 'All Platforms', 
      icon: <Smartphone className="w-4 h-4" />,
      activeClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-100'
    },
    { 
      value: 'ios' as const, 
      label: 'iOS', 
      icon: <AppleLogo className="w-4 h-4" />,
      activeClass: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-200'
    },
    { 
      value: 'android' as const, 
      label: 'Android', 
      icon: <GooglePlayLogo className="w-4 h-4" />,
      activeClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-100'
    },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-inner">
      {platforms.map((platform) => {
        const isActive = value === platform.value;
        return (
          <button
            key={platform.value}
            onClick={() => onChange(platform.value)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold 
              transition-all duration-200 ease-out active:scale-95
              ${isActive 
                ? platform.activeClass 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
              }
            `}
          >
            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-80'}`}>
              {platform.icon}
            </span>
            <span>{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}

