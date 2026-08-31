import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqMessages } from "@/lib/i18n/static-pages/faq";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import styles from "./FAQPage.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = faqMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/faq", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function FAQPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = faqMessages(presentation.locale);
  const canonicalPath = productCanonicalPath(presentation, "/faq");
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: messages.groups.flatMap((group) => group.items.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }))) };
  return <>
    <JsonLd data={[faqSchema, { "@context": "https://schema.org", "@type": "WebPage", name: messages.metadataTitle, description: messages.metadataDescription, url: absoluteUrl(canonicalPath) }]} />
    <article className={styles.page}><header><div><p><span aria-hidden="true" />{messages.eyebrow}</p><h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1></div></header><div className={styles.paint} /><main>{messages.groups.map((group, groupIndex)=><section key={group.title}><h2>{group.title}</h2><div>{group.items.map(([question, answer], index)=><details key={question} open={groupIndex===0&&index===0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>)}<aside className={styles.contactRail}><span>{messages.railPrompt}</span><Link href={productHref(presentation, "/contact")}>{messages.contactLink}</Link><Link href={productHref(presentation, "/methodology")}>{messages.methodologyLink}</Link><Link href="/affiliate-disclosure">{messages.affiliateLink}</Link></aside></main></article>
  </>;
}
