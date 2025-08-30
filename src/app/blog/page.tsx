'use client';

import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/sanity/client';
import { urlFor } from '@/sanity/lib/image';
import { sanityEnabled } from '@/sanity/env';

import { CalendarDays, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Tag, ArrowRight } from 'lucide-react';
import DynamicIslandHeader from '@/components/dynamic-header-island';
import Footer from '@/components/Footer';
import NewsletterSubscription from '@/components/NewsletterSubscription';
import { useEffect, useState } from 'react';

// Helper function to extract slug value
function getSlugValue(slug: string | { current: string }): string {
  return typeof slug === 'string' ? slug : slug?.current || '';
}

type Post = {
  _id: string;
  title: string;
  slug: string | { current: string };
  excerpt?: string;
  publishedAt: string;
  readingTime?: number;
  coverImage?: unknown;
  categories?: { title: string; slug?: { current: string } }[];
  author?: { name?: string; avatar?: unknown };
};

async function getPosts(): Promise<Post[]> {
  const query = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...25]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    readingTime,
    coverImage,
    categories[]-> { title, slug },
    author->{ name, avatar }
  }`;
  return client.fetch(query);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!sanityEnabled) {
        setLoading(false);
        return;
      }

      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        // Failed to fetch posts
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (!sanityEnabled) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 -z-10 animated-gradient pointer-events-none" />
        <DynamicIslandHeader />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
              Blog
            </h1>
            <p className="text-xl text-white/85 max-w-3xl mx-auto leading-relaxed">
              The blog is disabled in this environment.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 -z-10 animated-gradient pointer-events-none" />
        <DynamicIslandHeader />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
              Blog
            </h1>
            <p className="text-xl text-white/85 max-w-3xl mx-auto leading-relaxed">
              Loading posts...
            </p>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <DynamicIslandHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Notes on academic workload planning, allocations, and
            privacy-respecting tools for universities.
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 px-4 relative bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card
                key={post._id}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden p-0"
              >
                <Link
                  href={`/blog/${getSlugValue(post.slug)}`}
                  className="block"
                >
                  {/* Cover Image - positioned at very top of card */}
                  {post.coverImage ? (
                    <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-700 rounded-t-xl">
                      <Image
                        src={urlFor(post.coverImage)
                          .width(600)
                          .height(448)
                          .fit('crop')
                          .url()}
                        alt={post.coverImage?.alt || post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-slate-100 dark:bg-slate-700 rounded-t-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Tag className="w-6 h-6 text-slate-400 dark:text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No image
                        </p>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </CardTitle>

                    {post.excerpt && (
                      <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {post.author?.name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{post.author.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      {typeof post.readingTime === 'number' && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.readingTime} min read</span>
                        </div>
                      )}
                    </div>

                    {/* Categories */}
                    {post.categories?.length ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.categories.map((c) => (
                          <span
                            key={`${post._id}-${c.title}`}
                            className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700"
                          >
                            <Tag className="w-3 h-3" />
                            {c.title}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Read More Button */}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-transparent group-hover:translate-x-1 transition-all duration-300"
                      >
                        Read more
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {posts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="w-12 h-12 text-slate-400 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Check back soon for updates and insights.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA with Gradient */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient dark:animated-gradient-subdued" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            Stay Updated
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get the latest insights on academic workload planning and university
            management delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NewsletterSubscription
              source="blog"
              buttonText="Subscribe to Updates"
              buttonProps={{
                size: 'lg',
                className:
                  'bg-white text-blue-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
              }}
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        .animated-gradient {
          background:
            radial-gradient(
              1200px 600px at 20% 10%,
              rgba(255, 255, 255, 0.08),
              transparent 60%
            ),
            linear-gradient(120deg, #0f59ff, #8b5cf6, #06b6d4);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
        }
        .animated-gradient-subdued {
          background:
            radial-gradient(
              1200px 600px at 20% 10%,
              rgba(255, 255, 255, 0.04),
              transparent 60%
            ),
            linear-gradient(120deg, #475569, #64748b, #475569);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}
