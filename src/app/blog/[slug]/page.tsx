'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableText } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { sanityEnabled } from '@/sanity/env';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Tag, ArrowLeft } from 'lucide-react';
import DynamicIslandHeader from '@/components/dynamic-header-island';
import Footer from '@/components/Footer';
import NewsletterSubscription from '@/components/NewsletterSubscription';
import { useState, useEffect } from 'react';

interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

interface SanityBlock {
  _type: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

interface SanityLink {
  href: string;
}

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  body?: SanityBlock[];
  publishedAt: string;
  readingTime?: number;
  coverImage?: SanityImage;
  categories?: { title: string; slug?: { current: string } }[];
  author?: { name?: string; avatar?: SanityImage };
}

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  excerpt,
  body,
  publishedAt,
  readingTime,
  coverImage,
  categories[]->{ title, slug },
  author->{ name, avatar }
}`;

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

interface BlockComponentProps {
  children: React.ReactNode;
}

interface LinkComponentProps {
  value: SanityLink;
  children: React.ReactNode;
}

const portableComponents = {
  // Map Sanity block styles to semantic HTML so Tailwind Typography renders correctly
  block: {
    h1: ({ children }: BlockComponentProps) => (
      <h1 className="mt-10 mb-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
        {children}
      </h1>
    ),
    h2: ({ children }: BlockComponentProps) => (
      <h2 className="mt-10 mb-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
        {children}
      </h2>
    ),
    h3: ({ children }: BlockComponentProps) => (
      <h3 className="mt-8 mb-3 text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
        {children}
      </h3>
    ),
    h4: ({ children }: BlockComponentProps) => (
      <h4 className="mt-6 mb-2 text-lg md:text-xl font-semibold tracking-tight text-slate-900">
        {children}
      </h4>
    ),
    normal: ({ children }: BlockComponentProps) => (
      <p className="my-4 leading-relaxed text-slate-700">{children}</p>
    ),
    blockquote: ({ children }: BlockComponentProps) => (
      <blockquote className="my-6 border-l-4 border-blue-200 pl-4 italic text-slate-600 bg-blue-50 py-2 rounded-r">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: BlockComponentProps) => (
      <ul className="my-4 ml-5 list-disc space-y-1 text-slate-700">
        {children}
      </ul>
    ),
    number: ({ children }: BlockComponentProps) => (
      <ol className="my-4 ml-5 list-decimal space-y-1 text-slate-700">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: BlockComponentProps) => (
      <li className="leading-relaxed">{children}</li>
    ),
    number: ({ children }: BlockComponentProps) => (
      <li className="leading-relaxed">{children}</li>
    ),
  },
  marks: {
    link: ({ value, children }: LinkComponentProps) => {
      const { href } = value;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </a>
      );
    },
  },
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!sanityEnabled) {
        setLoading(false);
        return;
      }

      try {
        const fetchedPost = await client.fetch<Post>(POST_QUERY, {
          slug: params.slug,
        });
        if (fetchedPost) {
          setPost(fetchedPost);
          if (fetchedPost.coverImage && fetchedPost.coverImage.asset) {
            setCoverUrl(
              urlFor(fetchedPost.coverImage)
                .width(1600)
                .height(840)
                .fit('crop')
                .url()
            );
          }
        }
      } catch {
        // Failed to fetch post
      } finally {
        setLoading(false);
      }
    }

    void fetchPost();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <DynamicIslandHeader />

        {/* Loading Section */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Loading...
            </h1>
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

  if (!post) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-background">
      <DynamicIslandHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            asChild
          >
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to blog
            </Link>
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {post.author?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            {typeof post.readingTime === 'number' && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime} min read</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {post.categories?.length ? (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.categories.map((c) => (
                <span
                  key={`${post._id}-${c.title}`}
                  className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700"
                >
                  <Tag className="w-3 h-3" />
                  {c.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Cover Image and Article Content - Combined */}
      <section className="px-4 pb-16 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {coverUrl && (
            <div className="mb-8">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <Image
                  src={coverUrl}
                  alt={post.coverImage?.alt || post.title}
                  width={1600}
                  height={840}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <article className="prose prose-slate prose-lg max-w-none dark:prose-invert [&_p]:text-slate-700 dark:[&_p]:text-white [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h4]:text-slate-900 dark:[&_h4]:text-white [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-white [&_li]:text-slate-700 dark:[&_li]:text-white [&_ul]:text-slate-700 dark:[&_ul]:text-white [&_ol]:text-slate-700 dark:[&_ol]:text-white">
            {Array.isArray(post.body) ? (
              <PortableText
                value={post.body}
                components={portableComponents}
              />
            ) : null}
          </article>
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
