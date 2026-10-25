import React from 'react'
import { Link } from 'react-router-dom'

export default function StoreLogo({
  size = 'md',
  showTagline = true,
  className = '',
  linkTo = '/',
  light = false,
}) {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  }

  const titleSizes = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  }

  const taglineSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Grocery Basket Icon with SDK Initials */}
      <div
        className={`relative flex items-center justify-center shrink-0 shadow-sm border border-emerald-700/30 ${iconSizes[size]} bg-gradient-to-br from-emerald-800 to-green-900 text-white`}
      >
        {/* Subtle Shopping Basket Silhouette */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full p-1.5 opacity-25 absolute inset-0 text-amber-300"
        >
          <path d="m15 11-1 9" />
          <path d="m19 11-4-7" />
          <path d="M2 11h20" />
          <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
          <path d="m4.5 15.5h15" />
          <path d="m5 11 4-7" />
          <path d="m9 11 1 9" />
        </svg>

        {/* SDK Monogram */}
        <span className="relative z-10 font-black tracking-wider text-amber-300 drop-shadow-xs">
          SDK
        </span>

        {/* Small Fresh Leaf Accent */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white shadow-xs" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSizes[size]} ${
              light ? 'text-white' : 'text-slate-900'
            }`}
          >
            Shree Data <span className="text-emerald-700">Kirana</span>
          </span>
        </div>
        {showTagline && (
          <span
            className={`font-medium ${taglineSizes[size]} ${
              light ? 'text-emerald-200/90' : 'text-emerald-800/80'
            } tracking-normal`}
          >
            Your Daily Needs, Delivered with Care.
          </span>
        )}
      </div>
    </div>
  )

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="group inline-flex items-center transition-transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
      >
        {content}
      </Link>
    )
  }

  return content
}
