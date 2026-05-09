'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

export type NavSecondaryItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: BadgeVariant;
  badgeClassName?: string;
  disabled?: boolean;
};

function NavSecondaryItemContent({ item }: { item: NavSecondaryItem }) {
  return (
    <>
      <item.icon className="shrink-0" />

      <span className="group-data-[collapsible=icon]:hidden">
        {item.title}
      </span>

      {item.badge ? (
        <Badge
          variant={item.badgeVariant ?? 'secondary'}
          className={cn(
            'ml-auto px-1.5 py-0 text-[10px] leading-4 group-data-[collapsible=icon]:hidden',
            item.badgeClassName
          )}
        >
          {item.badge}
        </Badge>
      ) : null}
    </>
  );
}

export function NavSecondary({
  items,
  ...props
}: {
  items: NavSecondaryItem[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
        {items.map((item) => {
          const isDisabled = item.disabled || !item.url;
          const href = item.url;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                size="sm"
                isActive={!isDisabled && pathname === href}
                tooltip={
                  item.badge ? `${item.title} - ${item.badge}` : item.title
                }
                className={cn(
                  isDisabled &&
                    'cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground'
                )}
              >
                {isDisabled || !href ? (
                  <div aria-disabled="true" role="button">
                    <NavSecondaryItemContent item={item} />
                  </div>
                ) : (
                  <Link href={href}>
                    <NavSecondaryItemContent item={item} />
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}