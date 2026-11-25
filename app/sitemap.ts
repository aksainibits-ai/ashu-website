import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const staticPages = [
  "", "about", "experience", "qualifications", "practice-areas", "courts",
  "blog", "contact", "disclaimer", "privacy", "faqs",
];

function siteBase() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "https://ashu-website-two.vercel.app";
  return configured.replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();
  const entries: MetadataRoute.Sitemap = ["en", "hi"].flatMap(lang =>
    staticPages.map(page => ({
      url: page ? `${base}/${lang}/${page}` : `${base}/${lang}`,
      changeFrequency: page === "blog" ? "daily" as const : "monthly" as const,
      priority: page === "" ? 1 : page === "blog" ? 0.8 : 0.5,
      alternates: {
        languages: {
          en: page ? `${base}/en/${page}` : `${base}/en`,
          hi: page ? `${base}/hi/${page}` : `${base}/hi`,
        },
      },
    }))
  );

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("articles")
      .select("slug,language,published_at,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);

    if (!error && data) {
      for (const article of data) {
        const lang = article.language === "hi" ? "hi" : "en";
        const url = `${base}/${lang}/blog/${encodeURIComponent(article.slug)}`;
        entries.push({
          url,
          lastModified: article.updated_at || article.published_at || undefined,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Keep the public static sitemap available if the database is temporarily unreachable.
  }

  return entries;
}
