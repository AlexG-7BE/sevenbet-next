import { Card, FAQ, Section } from "@/components/ui";
import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";

function Block({ block }: { block: EditorialBlock }) {
  if (block.type === "heading") { const Tag = `h${block.level}` as "h2" | "h3"; return <Tag>{block.text}</Tag>; }
  if (block.type === "paragraph") return <p className="muted">{block.text}</p>;
  if (block.type === "quote") return <blockquote><p>{block.text}</p>{block.attribution && <footer>— {block.attribution}</footer>}</blockquote>;
  if (block.type === "divider") return <hr />;
  if (block.type === "faq") return <FAQ items={[[block.question, block.answer]]} />;
  if (block.type === "image") return <figure><img alt={block.alt} loading="lazy" src={`/api/media/${encodeURIComponent(block.mediaId)}`} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === "video") { const host = block.provider === "youtube" ? "https://www.youtube-nocookie.com/embed" : "https://player.vimeo.com/video"; return <iframe allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" src={`${host}/${encodeURIComponent(block.videoId)}`} title={block.title} />; }
  if ("items" in block) return block.type === "numbered-list" ? <ol>{block.items.map((item) => <li key={item}>{item}</li>)}</ol> : <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  return <Card tone={block.type === "warning" || block.type === "responsible-gambling" ? "warning" : "soft"}><h3>{block.title}</h3><p className="muted">{block.text}</p></Card>;
}

export function EditorialReviewRenderer({ document }: { document: CasinoEditorialDocument }) {
  return <>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <Section eyebrow={section.kind.replaceAll("-", " ")} key={section.id} title={section.title}><div className="guideGrid oneCol">{section.blocks.map((block) => <Block block={block} key={block.id} />)}</div></Section>)}</>;
}
