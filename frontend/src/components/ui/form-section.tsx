import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FormSection({ title, icon, defaultOpen = false, children }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-0 py-3 text-left">
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-4 space-y-4">{children}</div>}
    </div>
  );
}
