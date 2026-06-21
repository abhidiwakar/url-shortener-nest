import { LOGO_PATH } from '../constants/product';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 40, className = 'brand-mark' }: BrandMarkProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      height={size}
      src={LOGO_PATH}
      width={size}
    />
  );
}
