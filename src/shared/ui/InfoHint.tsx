import { cn } from '@/shared/lib/cn';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type InfoHintProps = {
  text: string;
  className?: string;
};

type PopoverPosition = {
  left: number;
  top: number;
  placement: 'top' | 'bottom';
};

function getPopoverPosition(element: HTMLElement): PopoverPosition {
  const rect = element.getBoundingClientRect();
  const maxWidth = 280;
  const margin = 16;
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    window.innerWidth - margin - maxWidth / 2,
    Math.max(margin + maxWidth / 2, centerX),
  );
  const showBelow = rect.bottom + 140 <= window.innerHeight;

  return {
    left,
    top: showBelow ? rect.bottom + 12 : rect.top - 12,
    placement: showBelow ? 'bottom' : 'top',
  };
}

export function InfoHint({ text, className }: InfoHintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) {
        return;
      }

      setPosition(getPopoverPosition(buttonRef.current));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <span className={cn('info-hint', className)}>
        <button
          ref={buttonRef}
          aria-controls={tooltipId}
          aria-expanded={isOpen}
          aria-label="Открыть пояснение"
          className="info-hint__button"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          i
        </button>
      </span>
      {isOpen && position
        ? createPortal(
            <div
              id={tooltipId}
              ref={popoverRef}
              className={cn('info-hint__popover', `info-hint__popover--${position.placement}`)}
              role="tooltip"
              style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                transform:
                  position.placement === 'bottom' ? 'translateX(-50%)' : 'translate(-50%, -100%)',
              }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
