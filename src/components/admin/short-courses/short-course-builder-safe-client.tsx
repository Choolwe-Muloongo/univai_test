'use client';

import { useEffect } from 'react';

import { ShortCoursesClient } from '@/components/admin/short-courses-client';

export function ShortCourseBuilderSafeClient() {
  useEffect(() => {
    function enforceDraftOnlyCopy() {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const select of selects) {
        const publishOption = Array.from(select.options).find((option) => option.value === 'published' || option.textContent?.toLowerCase().includes('publish now'));
        if (publishOption) {
          publishOption.remove();
          select.value = 'draft';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const buttons = Array.from(document.querySelectorAll('button'));
      for (const button of buttons) {
        if (button.textContent?.trim().toLowerCase() === 'publish course') {
          button.textContent = 'Save draft';
        }
      }
    }

    enforceDraftOnlyCopy();
    const observer = new MutationObserver(enforceDraftOnlyCopy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Draft-only builder</p>
        <p>
          This builder saves course content as a draft. Publishing is handled from the Review & Publish page after human review and approval.
        </p>
      </div>
      <ShortCoursesClient />
    </div>
  );
}
