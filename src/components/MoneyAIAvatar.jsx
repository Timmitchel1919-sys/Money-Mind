// Money AI's brand avatar — a premium, circular enterprise-assistant mark
// (chrome ring, navy face plate, cyan eyes, blue gradient body). Renders
// inline so its idle animations (breathing glow, eye pulse, blink, float)
// run as plain CSS — see the ".money-ai-avatar" rules in index.css.
// Static export lives at /public/money-ai-avatar.svg (+ -1024.png) for use
// outside React (favicons, share cards, app icons).
export default function MoneyAIAvatar({ size = 56, animated = true, className = "" }) {
  return (
    <div
      className={`money-ai-avatar ${animated ? "money-ai-avatar--animated" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 208 208"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="mai-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00B8FF" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#007BFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#007BFF" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="mai-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2F2F2" />
            <stop offset="22%" stopColor="#C0C0C0" />
            <stop offset="46%" stopColor="#8D9198" />
            <stop offset="62%" stopColor="#E8E8EA" />
            <stop offset="80%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#9DA0A6" />
          </linearGradient>

          <linearGradient id="mai-body" x1="18%" y1="8%" x2="82%" y2="92%">
            <stop offset="0%" stopColor="#00B8FF" />
            <stop offset="100%" stopColor="#007BFF" />
          </linearGradient>

          <linearGradient id="mai-navy" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#0B0B63" />
            <stop offset="100%" stopColor="#090951" />
          </linearGradient>

          <radialGradient id="mai-eye" cx="45%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#F2FEFF" />
            <stop offset="35%" stopColor="#4FE9FF" />
            <stop offset="75%" stopColor="#00C8FF" />
            <stop offset="100%" stopColor="#00B8FF" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="mai-glass" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <filter id="mai-blur-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="mai-blur-ambient" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="9" />
          </filter>

          <clipPath id="mai-body-clip">
            <circle cx="104" cy="104" r="82" />
          </clipPath>
        </defs>

        <circle
          className="money-ai-avatar__glow"
          cx="104"
          cy="104"
          r="98"
          fill="url(#mai-ambient)"
          filter="url(#mai-blur-ambient)"
        />

        <rect x="4" y="87" width="17" height="34" rx="8.5" fill="url(#mai-chrome)" />
        <rect x="8.5" y="92" width="3" height="24" rx="1.5" fill="#00B8FF" opacity="0.85" />
        <rect x="187" y="87" width="17" height="34" rx="8.5" fill="url(#mai-chrome)" />
        <rect x="196.5" y="92" width="3" height="24" rx="1.5" fill="#00B8FF" opacity="0.85" />

        <rect x="97" y="5" width="14" height="18" rx="7" fill="url(#mai-chrome)" />
        <circle className="money-ai-avatar__sensor" cx="104" cy="14" r="3.4" fill="url(#mai-eye)" />
        <circle cx="104" cy="14" r="1.4" fill="#F2FEFF" />

        <circle cx="104" cy="104" r="92" fill="url(#mai-chrome)" />
        <circle cx="104" cy="104" r="84" fill="#04040A" opacity="0.18" />
        <circle cx="104" cy="104" r="82" fill="url(#mai-body)" />

        <g clipPath="url(#mai-body-clip)">
          <ellipse cx="104" cy="64" rx="60" ry="32" fill="url(#mai-glass)" />
        </g>

        <path
          d="M32 66 A 84 84 0 0 1 96 21"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.3"
          fill="none"
        />
        <path
          d="M160 168 A 84 84 0 0 0 182 118"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.18"
          fill="none"
        />

        <rect
          x="57"
          y="61"
          width="94"
          height="76"
          rx="30"
          fill="url(#mai-navy)"
          stroke="#FFFFFF"
          strokeOpacity="0.07"
          strokeWidth="1.5"
        />

        <g className="money-ai-avatar__eyes">
          <circle
            className="money-ai-avatar__eye-halo"
            cx="84"
            cy="100"
            r="12"
            fill="url(#mai-eye)"
            filter="url(#mai-blur-soft)"
            opacity="0.6"
          />
          <circle cx="84" cy="100" r="6.6" fill="#00E5FF" />
          <circle cx="81.6" cy="97.6" r="1.7" fill="#F2FEFF" />

          <circle
            className="money-ai-avatar__eye-halo"
            cx="124"
            cy="100"
            r="12"
            fill="url(#mai-eye)"
            filter="url(#mai-blur-soft)"
            opacity="0.6"
          />
          <circle cx="124" cy="100" r="6.6" fill="#00E5FF" />
          <circle cx="121.6" cy="97.6" r="1.7" fill="#F2FEFF" />
        </g>

        <path
          d="M90 123 Q104 130 118 123"
          stroke="#4FE9FF"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>
  )
}
