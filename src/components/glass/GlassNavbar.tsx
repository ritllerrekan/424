import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
}

interface GlassNavbarProps {
  logo?: React.ReactNode;
  items: NavItem[];
  rightContent?: React.ReactNode;
  className?: string;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  logo,
  items,
  rightContent,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-40
        backdrop-blur-xl bg-gradient-glass border-b border-white/10
        shadow-glass animate-slide-down
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}

            <div className="hidden md:flex items-center gap-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    text-sm font-medium transition-all duration-300
                    ${
                      item.active
                        ? 'bg-white/20 text-white shadow-glow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center">
            {rightContent}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 animate-slide-down">
          <div className="px-4 py-4 space-y-2">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  text-sm font-medium transition-all duration-300
                  ${
                    item.active
                      ? 'bg-white/20 text-white shadow-glow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            {rightContent && (
              <div className="pt-4 border-t border-white/10">
                {rightContent}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
