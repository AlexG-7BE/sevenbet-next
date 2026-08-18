import Link from "next/link";
import { LearningSearchAndFilter } from "@/components/learning/LearningSearchAndFilter";
import { getArticlePath, type LearningArticle, type LearningCategory, type LearningDifficulty, type LearningPath } from "@/lib/learning-center";
import styles from "./learn.module.css";

export function LearningCenterPage({articles,categories,tags,initialCategory}:{articles:LearningArticle[];categories:LearningCategory[];tags:string[];paths:LearningPath[];initialCategory?:string}){
  const start=articles.slice(0,4); const difficulties=Array.from(new Set(articles.map(a=>a.difficulty))) as LearningDifficulty[];
  return <article className={styles.page} data-figma-authority="835:6356" data-learning-center>
    <header className={styles.hero}><div className={styles.heroCopy}><p>Guides &amp; insights</p><h1>Learn.<br/><em>Play smarter.</em></h1><span>Plain answers to the questions the industry prefers you didn&apos;t ask.</span><a href="#learning-search">Search guides — wagering, payouts, RTP…</a></div></header>
    <section className={styles.proof}><span>Written by the team that runs the tests</span><span>No sponsored guides</span><span>Updated weekly</span></section>
    <section className={styles.start}><header><h2>Start here</h2><span>Four guides that answer 80% of questions</span></header><div>{start.map(article=><Link href={getArticlePath(article)} key={article.slug}><small>{categories.find(c=>c.slug===article.categorySlug)?.title ?? article.categorySlug}</small><strong>{article.title}</strong><p>{article.summary}</p><span>{article.readingTime} · Updated {article.lastUpdated}</span></Link>)}</div></section>
    <LearningSearchAndFilter articles={articles} categories={categories.map(({slug,title})=>({slug,title}))} tags={tags} difficulties={difficulties} initialCategory={initialCategory}/>
    <section className={styles.bridge}><p>Beyond reading</p><h2>Knowledge is half of it.<br/><em>The plan is the other half.</em></h2><span>Ten missions that turn what you&apos;ve read into boundaries that hold. Free and private.</span><Link href="/program">Start Programme</Link></section>
  </article>
}
