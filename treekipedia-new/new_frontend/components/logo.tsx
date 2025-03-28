import Link from "next/link"

interface LogoProps {
  variant?: "default" | "white"
  showText?: boolean
}

export function Logo({ variant = "default", showText = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative h-8 w-8 mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={variant === "white" ? "#ffffff" : "#4A6C4B"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7c-2 2.5-2 4.5 0 7s2 4.5 0 7" />
          <path d="M12 7c2 2.5 2 4.5 0 7s-2 4.5 0 7" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold text-xl ${variant === "white" ? "text-white" : "text-silvi-green"}`}>
          Treekipedia
        </span>
      )}
    </Link>
  )
}

