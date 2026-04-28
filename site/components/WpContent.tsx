import { processHtml } from '@/lib/html';

export default function WpContent({ html }: { html: string }) {
  return (
    <div
      className="wp-content"
      dangerouslySetInnerHTML={{ __html: processHtml(html) }}
    />
  );
}
