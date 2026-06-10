interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
}

export function Avatar({ name, size = 40, src }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size }} className="flex-shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: 'linear-gradient(135deg, var(--mv-primary), #43346A)',
      }}
    >
      {initials}
    </div>
  );
}
