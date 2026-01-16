/**
 * Toolbar Dropdown Button Component
 * Split button with main action and dropdown menu for additional options
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
  /** Unique identifier for the option */
  id: string;
  /** Display label */
  label: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Click handler */
  on_click: () => void;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface ToolbarDropdownButtonProps {
  /** Icon for the main button */
  icon: React.ReactNode;
  /** Aria label for accessibility */
  aria_label: string;
  /** Tooltip text */
  title: string;
  /** Handler for main button click */
  on_main_click: () => void;
  /** Dropdown options */
  options: DropdownOption[];
  /** Button background color */
  background_color?: string;
  /** Button hover background color */
  background_color_hover?: string;
  /** Button text/icon color */
  text_color?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Toolbar Dropdown Button
 * Split button design with main action and dropdown chevron
 */
export const ToolbarDropdownButton: React.FC<ToolbarDropdownButtonProps> = ({
  icon,
  aria_label,
  title,
  on_main_click,
  options,
  background_color = '#ffffff',
  background_color_hover = '#f3f4f6',
  text_color = '#374151',
  disabled = false,
}) => {
  const [dropdown_open, setDropdownOpen] = useState(false);
  const [is_main_hovered, setIsMainHovered] = useState(false);
  const [is_chevron_hovered, setIsChevronHovered] = useState(false);
  const container_ref = useRef<HTMLDivElement>(null);
  const dropdown_ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handle_click_outside = (e: MouseEvent) => {
      if (container_ref.current && !container_ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdown_open) {
      document.addEventListener('mousedown', handle_click_outside);
      return () => {
        document.removeEventListener('mousedown', handle_click_outside);
      };
    }
    return undefined;
  }, [dropdown_open]);

  // Close dropdown on escape key
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dropdown_open) {
        setDropdownOpen(false);
      }
    };

    if (dropdown_open) {
      document.addEventListener('keydown', handle_keydown);
      return () => {
        document.removeEventListener('keydown', handle_keydown);
      };
    }
    return undefined;
  }, [dropdown_open]);

  const handle_main_click = () => {
    if (!disabled) {
      on_main_click();
    }
  };

  const handle_chevron_click = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setDropdownOpen(!dropdown_open);
    }
  };

  const handle_option_click = (option: DropdownOption) => {
    if (!option.disabled) {
      option.on_click();
      setDropdownOpen(false);
    }
  };

  return (
    <div ref={container_ref} className="cls_toolbar_dropdown_container" style={{ position: 'relative' }}>
      <div
        className={cn(
          'cls_toolbar_dropdown_button',
          disabled && 'cls_toolbar_dropdown_button_disabled'
        )}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderRadius: '0.25rem',
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Main button area */}
        <button
          type="button"
          onClick={handle_main_click}
          className="cls_toolbar_dropdown_main"
          aria-label={aria_label}
          title={title}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem 0.5rem',
            backgroundColor: is_main_hovered ? background_color_hover : background_color,
            color: text_color,
            border: '1px solid #d1d5db',
            borderRight: 'none',
            borderTopLeftRadius: '0.25rem',
            borderBottomLeftRadius: '0.25rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={() => setIsMainHovered(true)}
          onMouseLeave={() => setIsMainHovered(false)}
        >
          {icon}
        </button>

        {/* Chevron dropdown trigger */}
        <button
          type="button"
          onClick={handle_chevron_click}
          className="cls_toolbar_dropdown_chevron"
          aria-label="Show more options"
          aria-expanded={dropdown_open}
          aria-haspopup="menu"
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem 0.25rem',
            backgroundColor: is_chevron_hovered ? background_color_hover : background_color,
            color: text_color,
            border: '1px solid #d1d5db',
            borderTopRightRadius: '0.25rem',
            borderBottomRightRadius: '0.25rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={() => setIsChevronHovered(true)}
          onMouseLeave={() => setIsChevronHovered(false)}
        >
          <ChevronDown
            size={12}
            style={{
              transform: dropdown_open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {/* Dropdown menu */}
      {dropdown_open && (
        <div
          ref={dropdown_ref}
          className="cls_toolbar_dropdown_menu"
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              onClick={() => handle_option_click(option)}
              disabled={option.disabled}
              className={cn(
                'cls_toolbar_dropdown_item',
                option.disabled && 'cls_toolbar_dropdown_item_disabled'
              )}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: '13px',
                color: option.disabled ? '#9ca3af' : '#374151',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!option.disabled) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {option.icon && <span style={{ flexShrink: 0 }}>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolbarDropdownButton;
