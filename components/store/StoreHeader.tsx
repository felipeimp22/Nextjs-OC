interface StoreHeaderProps {
  restaurant: {
    name: string;
    description?: string | null;
    logo?: string | null;
    colors: { primary: string; secondary: string; accent: string };
    address: { city: string; state: string };
  };
}

export function StoreHeader({ restaurant }: StoreHeaderProps) {
  return (
    <div
      className="py-6 px-4 shadow-md"
      style={{ backgroundColor: restaurant.colors.primary }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {restaurant.logo && (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-16 h-16 rounded-lg object-cover bg-white"
            />
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="text-white/90 mt-1">{restaurant.description}</p>
            )}
            <p className="text-white/80 text-sm mt-1">
              {restaurant.address.city}, {restaurant.address.state}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
