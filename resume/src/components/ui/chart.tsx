import React, { ReactNode } from 'react'

interface ChartContainerProps {
  children: ReactNode
  className?: string
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  content: ReactNode
}

export function ChartTooltip({ content }: ChartTooltipProps) {
  return (
    <div className="absolute bg-white p-2 shadow-lg rounded-md text-sm">
      {content}
    </div>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  label?: string
}

export function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-lg rounded-md">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index}>{`${entry.name}: ${entry.value}`}</p>
        ))}
      </div>
    )
  }

  return null
}
