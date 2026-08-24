import Image from 'next/image';
import { cn } from '@/shared/utils';

type LogoProps = {
  className?: string;
  priority?: boolean;
};

/**
 * Brand wordmark. Renders the white logo on dark surfaces and the
 * black logo on light surfaces, switching automatically via the
 * `dark` class on <html>.
 */
export default function Logo({ className, priority = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Vineforge"
      className={cn(
        'relative inline-block aspect-[8/3] select-none',
        className
      )}
    >
      <Image
        src="/Logo.png"
        alt=""
        fill
        sizes="240px"
        priority={priority}
        draggable={false}
        className="object-contain object-left dark:block hidden"
      />
      <Image
        src="/Logo-black.png"
        alt=""
        fill
        sizes="240px"
        priority={priority}
        draggable={false}
        className="object-contain object-left block dark:hidden"
      />
    </span>
  );
}
