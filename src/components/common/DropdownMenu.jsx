import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// Context for Dropdown state
const DropdownContext = createContext();

// Add keyframes to document if not already added
if (typeof document !== 'undefined' && !document.getElementById('dropdown-animations')) {
  const style = document.createElement('style');
  style.id = 'dropdown-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// Main Dropdown Component
export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Listen to scroll on window and all scrollable parents
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, dropdownRef }}>
      <div ref={dropdownRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Trigger Button
export function DropdownMenuTrigger({ children, asChild }) {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
  };

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
    });
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// Content Container
export function DropdownMenuContent({ children, className = '', align = 'end' }) {
  const { isOpen, dropdownRef } = useContext(DropdownContext);
  const contentRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // Reset ready state when opening
      setIsReady(false);

      const calculatePosition = () => {
        if (!dropdownRef.current || !contentRef.current) return;

        const triggerRect = dropdownRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Use actual dimensions from rendered content
        const dropdownHeight = contentRect.height;
        const dropdownWidth = contentRect.width;

        // Determine if dropdown should open upward or downward
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        let placement = 'bottom';
        let top = triggerRect.bottom + 8; // mt-2 = 8px

        // If not enough space below and more space above, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          placement = 'top';
          top = triggerRect.top - dropdownHeight - 8;
        }

        // Calculate horizontal position
        let left = align === 'start' ? triggerRect.left : triggerRect.right - dropdownWidth;

        // Ensure dropdown doesn't overflow viewport horizontally
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        setPosition({ top, left, placement });
        setIsReady(true);
      };

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });
    } else {
      setPosition(null);
      setIsReady(false);
    }
  }, [isOpen, align, dropdownRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={`fixed rounded-md bg-white shadow-lg border border-gray-200 focus:outline-none ${className}`}
      style={{
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        zIndex: 9999,
        visibility: isReady ? 'visible' : 'hidden',
        opacity: isReady ? 1 : 0,
        transition: isReady ? 'opacity 0.1s ease-out' : 'none',
      }}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
}

// Label
export function DropdownMenuLabel({ children, className = '' }) {
  return (
    <div className={`px-3 py-2 text-sm font-semibold text-gray-900 ${className}`} role="menuitem">
      {children}
    </div>
  );
}

// Menu Item
export function DropdownMenuItem({ children, disabled = false, onClick, className = '' }) {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      setIsOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-between transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
}

// Separator
export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} role="separator" />;
}

// Group
export function DropdownMenuGroup({ children }) {
  return <div className="py-1">{children}</div>;
}

// Shortcut
export function DropdownMenuShortcut({ children, className = '' }) {
  return (
    <span className={`ml-auto text-xs tracking-widest text-gray-400 ${className}`}>{children}</span>
  );
}

// Sub Menu (Nested Dropdown)
const SubMenuContext = createContext();

export function DropdownMenuSub({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const subMenuRef = useRef(null);

  return (
    <SubMenuContext.Provider value={{ isOpen, setIsOpen, subMenuRef }}>
      <div ref={subMenuRef} className="relative">
        {children}
      </div>
    </SubMenuContext.Provider>
  );
}

// Sub Menu Trigger
export function DropdownMenuSubTrigger({ children, className = '' }) {
  const { setIsOpen } = useContext(SubMenuContext);

  return (
    <button
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-between transition-colors cursor-pointer ${className}`}
    >
      <span>{children}</span>
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// Sub Menu Content
export function DropdownMenuSubContent({ children, className = '' }) {
  const { isOpen } = useContext(SubMenuContext);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute left-full top-0 ml-1 rounded-md bg-white shadow-lg border border-gray-200 focus:outline-none z-50 transition-all duration-100 ease-out ${className}`}
      style={{
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div className="py-1 min-w-48">{children}</div>
    </div>
  );
}

// Portal (for sub menus) - in this simple implementation, we don't need actual portal
export function DropdownMenuPortal({ children }) {
  return <>{children}</>;
}
