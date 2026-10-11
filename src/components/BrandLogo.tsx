type Props = { variant?: 'hero' | 'login' | 'loginCompact' | 'compact' | 'document'; className?: string };

const sizes = {
  hero: 'w-44 sm:w-52',
  login: 'w-48 sm:w-56',
  loginCompact: 'w-36 sm:w-48',
  compact: 'w-24 sm:w-32',
  document: 'w-48',
};

/** Keep the wide wordmark readable instead of shrinking it into a square icon. */
export default function BrandLogo({ variant = 'hero', className = '' }: Props) {
  return <div className={`shrink-0 ${sizes[variant]} ${variant === 'document' ? '' : 'rounded-2xl border border-white/80 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.12)]'} ${className}`}>
    <img src="/logo/logo.png" alt="SBR Funding" width={2439} height={1216} className="block h-auto w-full object-contain" />
  </div>;
}
