import { processHtml } from '@/lib/html';

export default function WpContent({
  html,
  withInContentAds = false,
  maxLazyRepeaters,
}: {
  html: string;
  withInContentAds?: boolean;
  maxLazyRepeaters?: number;
}) {
  return (
    <div
      className="wp-content"
      dangerouslySetInnerHTML={{ __html: processHtml(html, { injectLazyAds: withInContentAds, maxLazyRepeaters }) }}
    />
  );
}
