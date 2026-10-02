import { useEffect, useState, useCallback } from 'react';

/* راوتر بسيط قائم على hash — بدون تبعيات */

export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/';
}

export function navigate(to: string) {
  if (currentPath() === to) return;
  window.location.hash = to;
}

export function useRoute() {
  const [path, setPath] = useState(currentPath());
  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const segments = path.split('/').filter(Boolean);
  const back = useCallback(() => window.history.back(), []);
  return { path, segments, navigate, back };
}

export function Link({ to, className, children, onClick, ...rest }: {
  to: string; className?: string; children: React.ReactNode; onClick?: () => void;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={() => { onClick?.(); }}
      {...rest}
    >
      {children}
    </a>
  );
}
