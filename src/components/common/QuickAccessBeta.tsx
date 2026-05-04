'use client';

import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type QuickLink = { name: string; url: string };

export function QuickAccessBeta() {
  const { user, isLoaded } = useAuthUser();
  const prefs = useQuery(
    api.quickAccess.getForCurrentUser,
    isLoaded && user?.id && user?.organisationId
    ? { userId: user.id }
    : 'skip'
  );
  const savePrefs = useMutation(api.quickAccess.saveForCurrentUser);
  const [links, setLinks] = React.useState<QuickLink[]>([]);
  const [draft, setDraft] = React.useState<QuickLink>({ name: '', url: '' });
  const [showNames, setShowNames] = React.useState(true);

  React.useEffect(() => {
    if (prefs) {
      setLinks((prefs.links as QuickLink[]) || []);
      setShowNames(Boolean(prefs.showNames));
    }
  }, [prefs]);

  const addLink = () => {
    if (!draft.name || !draft.url) return;
    const next = [...links, draft];
    setLinks(next);
    if (user?.id) savePrefs({ userId: user.id, links: next, showNames }).catch(() => {});
    setDraft({ name: '', url: '' });
  };
  const clearAll = () => {
    setLinks([]);
    if (user?.id) savePrefs({ userId: user.id, links: [], showNames }).catch(() => {});
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Quick Access (Beta)</SidebarGroupLabel>
      <SidebarMenu>
        {links.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              No quick access items yet.
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          links.map((item) => (
            <SidebarMenuItem key={`${item.name}-${item.url}`}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <span>{showNames ? item.name : item.url}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
        <SidebarMenuItem>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="mx-2">
                Customise
              </Button>
            </DialogTrigger>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Customise quick access</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    placeholder="e.g. Modules"
                  />
                  <Label className="text-xs">URL</Label>
                  <Input
                    value={draft.url}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, url: e.target.value }))
                    }
                    placeholder="e.g. /modules"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addLink}
                      disabled={!draft.name || !draft.url}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      className="ml-auto"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showNames}
	                    onCheckedChange={(v) => {
	                      setShowNames(v);
	                      if (user?.id) {
	                        savePrefs({
	                          userId: user.id,
	                          links,
	                          showNames: v,
	                        }).catch(() => {});
	                      }
	                    }}
                    id="qa-show-names"
                  />
                  <Label htmlFor="qa-show-names">Show names in sidebar</Label>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Preview</div>
                  <div className="border rounded p-2 space-y-1">
                    {links.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No items
                      </div>
                    ) : (
                      links.map((l) => (
                        <div key={`${l.name}-${l.url}`} className="text-sm">
                          {showNames ? l.name : l.url}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
