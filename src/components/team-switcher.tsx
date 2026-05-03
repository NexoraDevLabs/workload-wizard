'use client';

import { WandSparkles } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default rounded-2xl border border-sidebar-border/70 bg-white/60 hover:bg-white/60"
        >
          <div className="flex aspect-square size-9 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <WandSparkles className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">WorkloadWizard</span>
            <span className="truncate text-xs text-muted-foreground">MVP</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
