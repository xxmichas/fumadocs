'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/utils/cn'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function Info({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger>
        <InfoIcon className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="text-sm">{children}</PopoverContent>
    </Popover>
  )
}

type ObjectType = {
  [name: string]: {
    description?: string
    type: string
    typeDescription?: string
    typeDescriptionLink?: string
    default?: string
  }
}

export function TypeTable({ type }: { type: ObjectType }) {
  const th = cn('p-2 font-medium first:pl-0 last:pr-0')
  const td = cn('p-2 first:pl-0 last:pr-0')
  const field = cn('inline-flex flex-row items-center gap-1')
  const code = cn('bg-secondary rounded-md p-1')

  return (
    <div className="not-prose overflow-auto whitespace-nowrap">
      <table className="text-muted-foreground my-4 w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className={cn(th, 'w-[45%]')}>Prop</th>
            <th className={cn(th, 'w-[30%]')}>Type</th>
            <th className={cn(th, 'w-[25%]')}>Default</th>
          </tr>
        </thead>
        <tbody className="divide-border border-collapse divide-y">
          {Object.entries(type).map(([key, value]) => (
            <tr key={key}>
              <td className={td}>
                <div className={field}>
                  <code className={cn(code, 'bg-primary/10 text-primary')}>
                    {key}
                  </code>
                  {value.description && <Info>{value.description}</Info>}
                </div>
              </td>
              <td className={td}>
                <div className={field}>
                  <code className={code}>{value.type}</code>
                  {value.typeDescription && (
                    <Info>
                      <pre className="text-secondary-foreground bg-secondary overflow-auto">
                        {value.typeDescription}
                      </pre>
                    </Info>
                  )}
                  {value.typeDescriptionLink && (
                    <Link href={value.typeDescriptionLink}>
                      <InfoIcon className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </td>
              <td className={td}>
                {value.default ? (
                  <code className={code}>{value.default}</code>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}