import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  lifted?: boolean
  variant?: 'default' | 'elevated' | 'accent-top'
  accentColor?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, lifted = true, variant = 'default', accentColor, style, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-card text-card-foreground border shadow-sm',
      elevated: 'bg-primary text-primary-foreground border-primary shadow-elevated',
      'accent-top': 'bg-card text-card-foreground border shadow-sm border-t-[3px]',
    }
    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          lifted && 'motion-lift',
          className,
        )}
        style={{
          ...(variant === 'accent-top' && accentColor ? { borderTopColor: accentColor } : {}),
          ...style,
        }}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('font-display text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
