'use client';
import TrustBar from '@/components/trust-bar';
import JoinWaitlist from './JoinWaitlist';

export default function Hero() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero"
      aria-label="WorkloadWizard hero"
    >
      {/* Background wash */}
      <div className="absolute inset-0 bg-gradient-subtle" aria-hidden="true" />

      {/* Decorative blobs (muted on small screens) */}
      <div
        className={`
          pointer-events-none absolute top-1/4 left-[20%]
          h-36 w-36 rounded-full blur-3xl md:blur-[72px]
          mix-blend-screen bg-[hsla(280,95%,70%,0.35)]
          animate-[driftA_28s_linear_infinite]
        `}
        aria-hidden="true"
      />

      <div
        className={`
          pointer-events-none absolute bottom-[22%] right-[18%]
          h-56 w-56 rounded-full blur-[90px] mix-blend-screen
          bg-[hsla(200,95%,60%,0.3)]
          animate-[driftB_34s_linear_infinite]
          [animation-delay:-10s]
        `}
        aria-hidden="true"
      />

      <div
        className={`
          pointer-events-none absolute top-[12%] right-[28%]
          h-44 w-44 rounded-full blur-[86px] mix-blend-screen
          bg-[hsla(340,90%,65%,0.32)]
          animate-[driftC_40s_linear_infinite]
          [animation-delay:-18s]
        `}
        aria-hidden="true"
      />

      {/* Respect reduced motion */}
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-[driftA_28s_linear_infinite],
          .animate-[driftB_34s_linear_infinite],
          .animate-[driftC_40s_linear_infinite] {
            animation: none !important;
          }
        }

        @keyframes driftA {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(45vw, -15vh) scale(1.06);
          }
          50% {
            transform: translate(10vw, 35vh) scale(0.94);
          }
          75% {
            transform: translate(-35vw, -20vh) scale(1.05);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes driftB {
          0% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(-38vw, 28vh) scale(1.04);
          }
          40% {
            transform: translate(42vw, -22vh) scale(0.96);
          }
          70% {
            transform: translate(-18vw, -38vh) scale(1.08);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes driftC {
          0% {
            transform: translate(0, 0) scale(1);
          }
          30% {
            transform: translate(32vw, 22vh) scale(1.05);
          }
          55% {
            transform: translate(-28vw, 30vh) scale(0.92);
          }
          85% {
            transform: translate(18vw, -30vh) scale(1.07);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 className="mb-6 text-[2.75rem] font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          Academic workload
          <br />
          <span className="text-white/90">made easy.</span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
          Plan, allocate, and track staff workload with clarity — built for
          higher education.
        </p>

        <div className="flex justify-center">
          <JoinWaitlist source="landing" />
        </div>

        {/* Trust bar under CTA with consistent spacing */}
        <div className="mt-8 md:mt-10 flex justify-center pointer-events-none relative">
          <div className="pointer-events-auto">
            <TrustBar />
          </div>
        </div>
      </div>
    </section>
  );
}
