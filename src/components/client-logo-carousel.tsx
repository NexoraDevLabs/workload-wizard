'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const logos = [
  { name: 'Microsoft', src: '/microsoft-logo.png' },
  { name: 'Google', src: '/google-logo.png' },
  { name: 'Apple', src: '/apple-logo.png' },
  { name: 'Amazon', src: '/amazon-logo.png' },
  { name: 'Meta', src: '/meta-logo-abstract.png' },
  { name: 'Netflix', src: '/netflix-inspired-logo.png' },
  { name: 'Tesla', src: '/tesla-logo.png' },
  { name: 'Spotify', src: '/spotify-logo.png' },
  { name: 'Adobe', src: '/adobe-logo.png' },
  { name: 'Salesforce', src: '/salesforce-logo.png' },
];

export function ClientLogoCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollWidth = scrollContainer.scrollWidth;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 1;
      if (scrollPosition >= scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
    };

    const intervalId = setInterval(scroll, 30);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full overflow-hidden bg-muted/30 rounded-lg py-8">
      <div
        ref={scrollRef}
        className="flex gap-12 overflow-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* First set of logos */}
        {logos.map((logo, index) => (
          <div
            key={`first-${index}`}
            className="flex-shrink-0 flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
          >
            <Image
              src={logo.src || '/placeholder.svg'}
              alt={`${logo.name} logo`}
              width={112}
              height={48}
            />
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {logos.map((logo, index) => (
          <div
            key={`second-${index}`}
            className="flex-shrink-0 flex items-center justify-center h-16 w-32 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
          >
            <Image
              src={logo.src || '/placeholder.svg'}
              alt={`${logo.name} logo`}
              width={112}
              height={48}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
