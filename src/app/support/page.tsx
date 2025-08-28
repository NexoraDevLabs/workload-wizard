'use client';

import DynamicIslandHeader from '@/components/dynamic-header-island';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Map,
  FileText,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useCallback } from 'react';

export default function SupportPage() {
  const openFeaturebaseWidget = useCallback(() => {
    if (typeof window !== 'undefined' && window.Featurebase) {
      try {
        const fb = window.Featurebase as any;
        const appId = process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID || '';

        // PRE-CLEANUP: Remove any existing CSS effects BEFORE opening the widget
        const backdropElements = document.querySelectorAll(
          '[class*="backdrop-blur"], [class*="animate-pulse"], [class*="transform-gpu"]'
        );
        backdropElements.forEach((el) => {
          // Remove problematic classes
          el.classList.remove(
            'backdrop-blur',
            'backdrop-blur-sm',
            'backdrop-blur-md',
            'backdrop-blur-lg',
            'backdrop-blur-xl'
          );
          el.classList.remove('animate-pulse', 'transform-gpu');

          // Force reset any inline styles that might be causing issues
          const htmlEl = el as HTMLElement;
          if (
            htmlEl.style.backdropFilter ||
            htmlEl.style.filter ||
            htmlEl.style.transform
          ) {
            htmlEl.style.backdropFilter = 'none';
            htmlEl.style.filter = 'none';
            htmlEl.style.transform = 'none';
          }
        });

        // Initialize the widget
        fb('init', {
          appId: appId,
          theme: 'light',
          language: 'en',
        });

        // Wait for initialization, then open
        setTimeout(() => {
          // Try API methods first
          try {
            fb('open');
          } catch (error) {
            // Silent fallback
          }

          try {
            fb('openFeedbackWidget');
          } catch (error) {
            // Silent fallback
          }

          // Wait for iframe to load and then apply cleanup
          setTimeout(() => {
            // Always try manual DOM manipulation as a fallback
            try {
              const wrapper = document.getElementById(
                'featurebase-iframe-wrapper'
              );
              const iframe = document.querySelector(
                '.featurebase-messenger-iframe'
              ) as HTMLIFrameElement;

              if (wrapper && iframe) {
                // More thorough cleanup of any active CSS effects
                const backdropElements = document.querySelectorAll(
                  '[class*="backdrop-blur"], [class*="animate-pulse"], [class*="transform-gpu"]'
                );
                backdropElements.forEach((el) => {
                  // Remove problematic classes
                  el.classList.remove(
                    'backdrop-blur',
                    'backdrop-blur-sm',
                    'backdrop-blur-md',
                    'backdrop-blur-lg',
                    'backdrop-blur-xl'
                  );
                  el.classList.remove('animate-pulse', 'transform-gpu');

                  // Force reset any inline styles that might be causing issues
                  const htmlEl = el as HTMLElement;
                  if (
                    htmlEl.style.backdropFilter ||
                    htmlEl.style.filter ||
                    htmlEl.style.transform
                  ) {
                    htmlEl.style.backdropFilter = 'none';
                    htmlEl.style.filter = 'none';
                    htmlEl.style.transform = 'none';
                  }
                });

                // Force a repaint to ensure CSS changes take effect
                wrapper.offsetHeight;

                wrapper.className = wrapper.className.replace(
                  'featurebase-messenger-frame-wrapper-closed',
                  'featurebase-messenger-frame-wrapper-open'
                );

                // Wait for iframe to load its content, then apply cleanup to iframe content
                if (
                  iframe.contentDocument &&
                  iframe.contentDocument.readyState === 'complete'
                ) {
                  // Iframe is already loaded, apply cleanup immediately
                  cleanupIframeContent(iframe);
                  // Try to navigate to Messages tab
                  navigateToMessagesTab(iframe);
                } else {
                  // Wait for iframe to load
                  iframe.addEventListener('load', () => {
                    setTimeout(() => {
                      cleanupIframeContent(iframe);
                      // Try to navigate to Messages tab
                      navigateToMessagesTab(iframe);
                    }, 100); // Small delay to ensure content is fully rendered
                  });
                }

                // Schedule one more cleanup after a delay to catch any late-loading content
                setTimeout(() => {
                  try {
                    if (iframe.contentDocument && iframe.contentDocument.body) {
                      const lateElements =
                        iframe.contentDocument.querySelectorAll(
                          '[class*="backdrop-blur"], [class*="animate-pulse"]'
                        );
                      lateElements.forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        htmlEl.classList.remove(
                          'backdrop-blur',
                          'backdrop-blur-sm',
                          'backdrop-blur-md',
                          'backdrop-blur-lg',
                          'backdrop-blur-xl'
                        );
                        htmlEl.classList.remove('animate-pulse');
                        if (htmlEl.style.backdropFilter)
                          htmlEl.style.backdropFilter = 'none';
                        if (htmlEl.style.filter) htmlEl.style.filter = 'none';
                        if (htmlEl.style.transform)
                          htmlEl.style.transform = 'none';
                      });
                    }
                  } catch (error) {
                    // Silent fallback
                  }
                }, 2000); // Clean up after 2 seconds
              }
            } catch (error) {
              // Silent fallback - open in new tab
              window.open('https://workloadwizard.featurebase.app/', '_blank');
            }
          }, 1000); // Wait 1 second for CSS effects to clear
        }, 500); // Initial delay for initialization
      } catch (error) {
        // If all else fails, open in new tab
        window.open('https://workloadwizard.featurebase.app/', '_blank');
      }
    } else {
      // Widget not available, open in new tab
      window.open('https://workloadwizard.featurebase.app/', '_blank');
    }
  }, []);

  // Helper function to cleanup iframe content
  const cleanupIframeContent = (iframe: HTMLIFrameElement) => {
    try {
      if (iframe.contentDocument && iframe.contentDocument.body) {
        // Find and remove any backdrop-blur elements within the iframe
        const iframeBackdropElements = iframe.contentDocument.querySelectorAll(
          '[class*="backdrop-blur"], [class*="animate-pulse"]'
        );
        iframeBackdropElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.classList.remove(
            'backdrop-blur',
            'backdrop-blur-sm',
            'backdrop-blur-md',
            'backdrop-blur-lg',
            'backdrop-blur-xl'
          );
          htmlEl.classList.remove('animate-pulse');

          // Reset inline styles
          if (htmlEl.style.backdropFilter) htmlEl.style.backdropFilter = 'none';
          if (htmlEl.style.filter) htmlEl.style.filter = 'none';
          if (htmlEl.style.transform) htmlEl.style.transform = 'none';
        });

        // Force iframe content to repaint
        iframe.contentDocument.body.style.display = 'none';
        iframe.contentDocument.body.offsetHeight;
        iframe.contentDocument.body.style.display = '';
      }
    } catch (error) {
      // Silent fallback - iframe might be cross-origin
    }
  };

  const navigateToMessagesTab = (iframe: HTMLIFrameElement) => {
    try {
      if (iframe.contentDocument && iframe.contentDocument.body) {
        // Wait a bit more for the widget to fully load
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument;
            if (doc) {
              // Log what we can find in the iframe to debug

              // FIRST: Try to find and click the "Send us a message" button directly
              // This button is already visible and will start a new chat
              const sendMessageSelectors = [
                'button[type="submit"]',
                'button:contains("Send us a message")',
                'button[innerText*="Send us a message"]',
                'button[textContent*="Send us a message"]',
                '[class*="group"][class*="overflow-hidden"] button',
                'button.group.overflow-hidden',
                // More specific selectors based on the actual button structure
                'button.group.overflow-hidden.main-transition.rounded-lg.transform-gpu.animate-slide-down',
                'button[class*="group"][class*="overflow-hidden"][class*="main-transition"]',
                // Look for button with specific text content
                'button:has(span:contains("Send us a message"))',
                'button span:contains("Send us a message")',
                // Generic button with text content
                'button',
                'button[role="button"]',
              ];

              let sendMessageButton = null;
              for (const selector of sendMessageSelectors) {
                try {
                  sendMessageButton = doc.querySelector(selector);
                  if (sendMessageButton) {
                    break;
                  }
                } catch (e) {
                  // Skip invalid selectors
                }
              }

              // If we didn't find it with selectors, try to find by text content
              if (!sendMessageButton) {
                const allButtons = doc.querySelectorAll('button');
                for (const button of allButtons) {
                  const buttonText =
                    button.textContent || button.innerText || '';
                  if (buttonText.toLowerCase().includes('send us a message')) {
                    sendMessageButton = button;
                    break;
                  }
                }
              }

              // If we found the button, click it directly
              if (sendMessageButton) {
                (sendMessageButton as HTMLElement).click();
                return; // Exit early since we found and clicked the button
              }

              // FALLBACK: If we didn't find the button, try to navigate to Messages tab first

              // Try multiple strategies to find and click the Messages tab
              const messagesTabSelectors = [
                '[data-testid="messages-tab"]',
                '.messages-tab',
                '[aria-label*="Messages"]',
                'button[title*="Messages"]',
                'button[aria-label*="Messages"]',
                '[role="tab"][aria-label*="Messages"]',
                '.tab[data-tab="messages"]',
                '.tab-button[data-tab="messages"]',
                // More generic selectors
                '[class*="messages"]',
                '[class*="conversations"]',
                'button[class*="tab"]',
                'a[class*="tab"]',
              ];

              let messagesTab = null;
              for (const selector of messagesTabSelectors) {
                try {
                  messagesTab = doc.querySelector(selector);
                  if (messagesTab) {
                    break;
                  }
                } catch (e) {
                  // Skip invalid selectors
                }
              }

              if (messagesTab) {
                (messagesTab as HTMLElement).click();

                // After clicking Messages tab, wait for it to load and then try to find new chat button
                setTimeout(() => {
                  try {
                    if (doc) {
                      // Try multiple strategies to find the new chat button
                      const newChatSelectors = [
                        '[data-testid="new-chat"]',
                        '.new-chat',
                        'button[title*="Send us a message"]',
                        '[aria-label*="Send us a message"]',
                        '.new-conversation',
                        'button[aria-label*="New conversation"]',
                        '.start-chat',
                        'button[aria-label*="Start chat"]',
                        // More generic selectors
                        '[class*="new-chat"]',
                        '[class*="new-conversation"]',
                      ];

                      let newChatButton = null;
                      for (const selector of newChatSelectors) {
                        try {
                          newChatButton = doc.querySelector(selector);
                          if (newChatButton) {
                            break;
                          }
                        } catch (e) {
                          // Skip invalid selectors
                        }
                      }

                      if (newChatButton) {
                        (newChatButton as HTMLElement).click();
                      }
                    }
                  } catch (error) {
                    // Error finding new chat button
                  }
                }, 1000); // Wait 1 second for Messages tab to fully load
              } else {
                // Try to find any clickable elements that might be the Messages tab
                const allButtons = doc.querySelectorAll(
                  'button, a, [role="button"]'
                );
              }
            }
          } catch (error) {
            // Error navigating to Messages tab
          }
        }, 1000);
      }
    } catch (error) {
      // Error in navigateToMessagesTab
    }
  };

  const supportLinks = [
    {
      title: 'Help Centre',
      href: 'https://workloadwizard.featurebase.app/help',
      description:
        'Comprehensive guides, FAQs, and how-tos for WorkloadWizard.',
      icon: HelpCircle,
    },
    {
      title: 'Feedback & Suggestions',
      href: 'https://workloadwizard.featurebase.app/',
      description: 'Submit feedback, upvote ideas, and track feature requests.',
      icon: MessageSquare,
    },
    {
      title: 'Product Roadmap',
      href: 'https://workloadwizard.featurebase.app/roadmap',
      description:
        "See what we're building next and what's currently in progress.",
      icon: Map,
    },
    {
      title: 'Changelog',
      href: 'https://workloadwizard.featurebase.app/changelog',
      description: 'Recent improvements, bug fixes, and feature releases.',
      icon: FileText,
    },
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@workload-wiz.xyz',
      icon: Mail,
      href: 'mailto:support@workload-wiz.xyz',
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available during business hours',
      icon: MessageCircle,
      onClick: openFeaturebaseWidget,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 animated-gradient pointer-events-none" />
      <DynamicIslandHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center pt-16">
          <h1 className="mb-6 text-[2.75rem] font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            How can we help you?
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
            Get the support you need to make the most of WorkloadWizard. From
            quick answers to detailed guidance, we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Support Resources */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-6 text-[2.75rem] font-bold leading-tight text-center text-white md:text-3xl lg:text-4xl">
            Support Resources
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {supportLinks.map((link) => (
              <Card
                key={link.href}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <link.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 dark:text-white/80 mb-4">
                    {link.description}
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold dark:text-white text-slate-800 text-center mb-12">
            Get in Touch
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {contactMethods.map((method) => (
              <Card
                key={method.title}
                className="text-center hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <method.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 dark:text-white/80 mb-3">
                    {method.description}
                  </p>
                  <p className="text-base font-medium text-slate-900 dark:text-white/80 mb-4">
                    {method.contact}
                  </p>
                  <Button
                    variant="default"
                    className="w-full cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (method.onClick) {
                        method.onClick();
                      }
                    }}
                    asChild={!method.onClick}
                  >
                    {method.onClick ? (
                      <span>Start a Chat</span>
                    ) : (
                      <Link href={method.href}>Drop us an Email</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How do I get started with WorkloadWizard?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-white/80">
                  Getting started is easy! Simply sign up for an account,
                  complete the onboarding process, and you&apos;ll be guided
                  through setting up your organisation and first academic year.
                  Our step-by-step wizard makes the process straightforward.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What types of organisations can use WorkloadWizard?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-white/80">
                  WorkloadWizard is designed specifically for universities,
                  colleges, and other higher education institutions. It&apos;s
                  perfect for academic departments, faculties, and
                  administrative teams that need to manage teaching workloads
                  and module allocations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Is my data secure and private?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-white/80">
                  Absolutely. We take data security and privacy seriously. All
                  data is encrypted in transit and at rest, and we&apos;re fully
                  GDPR compliant. We never share your data with third parties
                  and provide full control over your information.
                </p>
              </CardContent>
            </Card>
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
