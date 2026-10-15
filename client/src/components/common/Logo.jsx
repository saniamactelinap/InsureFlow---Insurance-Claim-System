import React from 'react';
import { Link } from 'react-router-dom';

/**
 * InsureFlow official brand logo component.
 *
 * @param {'full'|'icon'} [variant='full'] - Full logo with wordmark or standalone shield icon.
 * @param {'dark'|'light'} [theme='dark'] - 'dark' for Midnight Orchid navy backgrounds, 'light' for white backgrounds.
 * @param {'sm'|'md'|'lg'} [size='md'] - Sizing preset.
 * @param {boolean} [withText=true] - If true, renders the brand wordmark alongside the emblem when using 'icon' variant.
 * @param {string|null} [to='/'] - Link target URL, or null for non-interactive rendering.
 * @param {string} [className=''] - Extra classes for the container.
 */
export const Logo = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  withText = true,
  to = '/',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      full: 'h-7',
      icon: 'w-7 h-7',
      text: 'text-base',
      sub: 'text-[9px]',
    },
    md: {
      full: 'h-9 sm:h-10',
      icon: 'w-9 h-9 sm:w-10 sm:h-10',
      text: 'text-lg',
      sub: 'text-[10px]',
    },
    lg: {
      full: 'h-12 sm:h-14',
      icon: 'w-12 h-12 sm:w-14 sm:h-14',
      text: 'text-2xl',
      sub: 'text-xs',
    },
  }[size] || {
    full: 'h-9',
    icon: 'w-9 h-9',
    text: 'text-lg',
    sub: 'text-[10px]',
  };

  const isDarkTheme = theme === 'dark';
  const logoSrc = isDarkTheme
    ? '/images/insureflow-logo-dark-cropped.png'
    : '/images/insureflow-logo-light-cropped.png';

  const iconSrc = '/images/insureflow-icon-transparent.png';

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant === 'full' ? (
        <img
          src={logoSrc}
          alt="InsureFlow — Smart Insurance Claim Processing and Settlement Management System"
          className={`${sizeClasses.full} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      ) : (
        <>
          <img
            src={iconSrc}
            alt="InsureFlow Shield Emblem"
            className={`${sizeClasses.icon} object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}
          />
          {withText && (
            <div className="leading-none">
              <span
                className={`font-black ${sizeClasses.text} tracking-tight flex items-center ${
                  isDarkTheme ? 'text-white' : 'text-[#020950]'
                }`}
              >
                Insure<span className="text-[#0000FF] ml-0.5">Flow</span>
              </span>
              <span
                className={`block ${sizeClasses.sub} uppercase tracking-wider font-semibold mt-0.5 ${
                  isDarkTheme ? 'text-[#8FA4E8]' : 'text-[#64708A]'
                }`}
              >
                Claims & Settlements
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
