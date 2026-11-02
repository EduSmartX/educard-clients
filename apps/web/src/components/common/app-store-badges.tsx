import { APP_STORE_URL, PLAY_STORE_URL } from '@/constants/app-config';

interface AppStoreBadgesProps {
  className?: string;
}

const BADGES = [
  {
    href: PLAY_STORE_URL,
    src: '/assets/images/google-play-badge.png',
    alt: 'Get it on Google Play',
  },
  {
    href: APP_STORE_URL,
    src: '/assets/images/app-store-badge.png',
    alt: 'Download on the App Store',
  },
].filter((badge) => badge.href);

/** Official Google Play / App Store badges linking to the EduCard mobile app. */
export function AppStoreBadges({ className = '' }: Readonly<AppStoreBadgesProps>) {
  if (BADGES.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {BADGES.map((badge) => (
        <a
          key={badge.alt}
          href={badge.href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:-translate-y-0.5"
        >
          <img src={badge.src} alt={badge.alt} className="h-11 w-auto" />
        </a>
      ))}
    </div>
  );
}
