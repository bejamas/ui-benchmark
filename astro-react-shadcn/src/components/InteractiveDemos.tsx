"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { allCookies, necessaryOnly, cookieSummary, readCookiePreferences, saveCookiePreferences, type CookiePreferences } from "@/lib/cookie-preferences";

export default function InteractiveDemos() {
  const [saved, setSaved] = useState<CookiePreferences>(necessaryOnly);
  const [draft, setDraft] = useState<CookiePreferences>(necessaryOnly);
  const [open, setOpen] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [unread, setUnread] = useState(true);
  const [tips, setTips] = useState(true);
  const [digest, setDigest] = useState(false);

  useEffect(() => { setSaved(readCookiePreferences()); }, []);

  function save(preferences: CookiePreferences) {
    setSaved(preferences);
    setPersistent(saveCookiePreferences(preferences));
    setOpen(false);
  }

  return (
    <section id="preferences" className="border-t bg-muted/30 py-20" aria-labelledby="preferences-heading">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="preferences-heading" className="text-3xl font-bold tracking-tight text-center">Make it yours</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Small controls, thoughtful details. Try the everyday interactions that make a website feel complete.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Your privacy, your choice</h3>
            <p className="text-sm text-muted-foreground">Choose which cookie categories you allow and change your mind at any time.</p>
            <Dialog open={open} onOpenChange={(next) => { if (next) setDraft({ ...saved }); setOpen(next); }}>
              <DialogTrigger render={<Button variant="outline" className="w-full" />}>Cookie preferences</DialogTrigger>
              <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cookie preferences</DialogTitle>
                  <DialogDescription>Choose what you share. Necessary cookies stay on; everything else is optional.</DialogDescription>
                </DialogHeader>
                <div className="divide-y">
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div><label htmlFor="cookie-necessary" className="font-medium">Necessary</label><p id="cookie-necessary-description" className="mt-1 text-muted-foreground">Required for basic site functions. Always enabled.</p></div>
                    <Switch id="cookie-necessary" checked disabled aria-label="Necessary" aria-describedby="cookie-necessary-description" />
                  </div>
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div><label htmlFor="cookie-analytics" className="font-medium">Analytics</label><p id="cookie-analytics-description" className="mt-1 text-muted-foreground">Help us understand which pages are useful.</p></div>
                    <Switch id="cookie-analytics" checked={draft.analytics} onCheckedChange={(analytics) => setDraft((value) => ({ ...value, analytics }))} aria-label="Analytics" aria-describedby="cookie-analytics-description" />
                  </div>
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div><label htmlFor="cookie-marketing" className="font-medium">Marketing</label><p id="cookie-marketing-description" className="mt-1 text-muted-foreground">Allow content and offers tailored to your interests.</p></div>
                    <Switch id="cookie-marketing" checked={draft.marketing} onCheckedChange={(marketing) => setDraft((value) => ({ ...value, marketing }))} aria-label="Marketing" aria-describedby="cookie-marketing-description" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Demo only. These controls do not enable tracking.</p>
                <DialogFooter className="flex-col sm:flex-row sm:flex-wrap">
                  <Button variant="outline" onClick={() => save(necessaryOnly)}>Reject optional</Button>
                  <Button variant="outline" onClick={() => save(allCookies)}>Accept all</Button>
                  <Button onClick={() => save(draft)}>Save preferences</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p role="status" data-cookie-summary className="mt-auto text-xs text-muted-foreground">{cookieSummary(saved)}{persistent ? "" : ". Saved for this visit only."}</p>
          </article>
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Stay in the loop</h3>
            <p className="text-sm text-muted-foreground">Catch up on product news without leaving the page you are reading.</p>
            <Popover>
              <PopoverTrigger render={<Button variant="outline" className="w-full" />}>Notifications</PopoverTrigger>
              <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-4" align="center" sideOffset={6}>
                <PopoverHeader><PopoverTitle>What&apos;s new</PopoverTitle><PopoverDescription>Your latest product updates.</PopoverDescription></PopoverHeader>
                <ul className="space-y-4 py-3">
                  <li><p className="font-medium">Cookie controls are here</p><p className="text-sm text-muted-foreground">Fine-tune your preferences in one place.</p></li>
                  <li><p className="font-medium">A smoother navigation</p><p className="text-sm text-muted-foreground">Explore products with your mouse or keyboard.</p></li>
                </ul>
                <Button variant="outline" disabled={!unread} onClick={() => setUnread(false)}>Mark all as read</Button>
              </PopoverContent>
            </Popover>
            <p role="status" data-notification-summary className="mt-auto text-xs text-muted-foreground">{unread ? "2 unread updates" : "You are all caught up"}</p>
          </article>
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">A little more control</h3>
            <p className="text-sm text-muted-foreground">Keep helpful tips close and choose how often you hear from us.</p>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full" />}>Quick settings</DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="center">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Personalize your experience</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem className="focus:bg-muted focus:text-foreground focus:**:text-foreground" checked={tips} onCheckedChange={setTips} closeOnClick={false}>Show helpful tips</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem className="focus:bg-muted focus:text-foreground focus:**:text-foreground" checked={digest} onCheckedChange={setDigest} closeOnClick={false}>Weekly digest</DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <p role="status" data-settings-summary className="mt-auto text-xs text-muted-foreground">Tips {tips ? "on" : "off"} · Weekly digest {digest ? "on" : "off"}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
