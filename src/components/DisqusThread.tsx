import React, { useEffect, useRef } from 'react';

interface DisqusThreadProps {
  shortname?: string;
  identifier: string;
  title: string;
  url?: string;
}

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: { reload: boolean; config?: (this: any) => void }) => void;
    };
    disqus_config?: (this: any) => void;
  }
}

export const DisqusThread: React.FC<DisqusThreadProps> = ({
  shortname = 'sinta888',
  identifier,
  title,
  url
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    try {
      // Define global disqus_config callback
      window.disqus_config = function () {
        this.page.identifier = identifier;
        this.page.url = canonicalUrl;
        this.page.title = title;
      };

      if (window.DISQUS) {
        // If Disqus is already loaded on the page, reset and reload with the new thread configuration
        window.DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = identifier;
            this.page.url = canonicalUrl;
            this.page.title = title;
          }
        });
      } else {
        // If script is not yet in DOM, dynamically inject embed.js with crossorigin anonymous
        const existingScript = document.getElementById('dsq-embed-scr');
        if (!existingScript) {
          const d = document;
          const s = d.createElement('script');
          s.id = 'dsq-embed-scr';
          s.src = `https://${shortname}.disqus.com/embed.js`;
          s.setAttribute('data-timestamp', String(+new Date()));
          s.crossOrigin = 'anonymous';
          s.async = true;
          (d.head || d.body).appendChild(s);
        }
      }
    } catch (e) {
      console.warn('Disqus load handled safely:', e);
    }
  }, [identifier, title, canonicalUrl, shortname]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div id="disqus_thread" ref={containerRef} className="min-h-[220px]" />
      <noscript>
        Please enable JavaScript to view the{' '}
        <a href="https://disqus.com/?ref_noscript" className="text-blue-600 underline">
          comments powered by Disqus.
        </a>
      </noscript>
    </div>
  );
};

