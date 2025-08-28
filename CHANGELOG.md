# Changelog

## [0.4.1](https://github.com/smcnab1/workload-wizard-app/compare/v0.4.0...v0.4.1) (2025-08-26)

### 🚀 Features

- **account/features:** refresh button triggers router.refresh for SSR re-run ([634aead](https://github.com/smcnab1/workload-wizard-app/commit/634aead07c8a33d9b3d226429887c9bf333092f8))
- Add blog, sanity & waitlist ([e3bc1d5](https://github.com/smcnab1/workload-wizard-app/commit/e3bc1d505b8a4e1e6d4e9dcacb5d7665b54eb9bd))
- Add blog, sanity & waitlist ([69b636e](https://github.com/smcnab1/workload-wizard-app/commit/69b636eb5c4298a9d6b59a09cd2939badc09d51b))
- Add landing page, update public route styles ([9b32578](https://github.com/smcnab1/workload-wizard-app/commit/9b32578c46774547b616e68224ecf181c40cbff0))
- Add loading overlay ([61b734b](https://github.com/smcnab1/workload-wizard-app/commit/61b734be4bc30978b2ea7241eb9921b7c69739ce))
- Add statsig integration and flag placeholders ([08c8290](https://github.com/smcnab1/workload-wizard-app/commit/08c829077f401c413e569a30db20b70b31213c7a))
- **admin/features:** inline stage selector per feature ([133db4f](https://github.com/smcnab1/workload-wizard-app/commit/133db4fc2d85329f3bdea197b9c4344bb035f1f4))
- **admin/features:** show stage badge matching account page style next to inline selector ([09be129](https://github.com/smcnab1/workload-wizard-app/commit/09be129546372bd4d4402a533562bd7656c76e30))
- **admin:** add Feature Flags link to Admin menu in sidebar ([023b681](https://github.com/smcnab1/workload-wizard-app/commit/023b68168bc3221148e63ddc770b7dcc44093d15))
- **flags/ssr:** enrich SSR identify with enrolments; gate QuickAccessBeta strictly on Statsig gate ([58c03a6](https://github.com/smcnab1/workload-wizard-app/commit/58c03a6da72d480e8206a2c0cfef37e0b28e3166))
- **statsig:** also expose flattened custom booleans (enrolled\_&lt;gateKey&gt;) for simpler gate rules ([172e095](https://github.com/smcnab1/workload-wizard-app/commit/172e095c8927dcf2dc53967534868db1f5da6aee))
- Update all actions ([#69](https://github.com/smcnab1/workload-wizard-app/issues/69)) ([29199a5](https://github.com/smcnab1/workload-wizard-app/commit/29199a5badb796da49d56d179474f310c54b92c0))

### 🐛 Fixes

- disable Sentry debug logging and simplify config, enable screenshot support for feedback ([7ed4ef1](https://github.com/smcnab1/workload-wizard-app/commit/7ed4ef1288a2caa701b05bc54a86948fc3639aa7))
- Fix linting errors ([f92b289](https://github.com/smcnab1/workload-wizard-app/commit/f92b28989a90b3449ca81feea9bc40a58cf0f5b2))
- Fix vercel.yml ([7c0a0a5](https://github.com/smcnab1/workload-wizard-app/commit/7c0a0a55ac572d11f0721ecba72db3f1f63a68fa))
- remove feature flags permission and clean up related code ([4ad8251](https://github.com/smcnab1/workload-wizard-app/commit/4ad825174f3ad86609985dff7729611f20f01929))
- resolve Clerk hooks being called during static generation ([2b0b891](https://github.com/smcnab1/workload-wizard-app/commit/2b0b891a5d029c545a683fc8bf2917352f6648fd))
- resolve E2E test failures - fix middleware blocking admin API routes - increase test timeouts from 30s to 60s - fix fixture timeouts for seedDemoData - add proper waiting for course-years-list elements - replace unreliable networkidle waits with element-based waits ([1c6ff38](https://github.com/smcnab1/workload-wizard-app/commit/1c6ff38121d05ebf793c6ee4d89ebde896e0f7b7))
- Resolve TypeScript errors and install missing UI dependencies ([6d4f9b7](https://github.com/smcnab1/workload-wizard-app/commit/6d4f9b7cf027d731aaadefecdd4731cbb6c9a337))

### 🗂 Docs

- add v0.4.0 release notes ([d4ff25d](https://github.com/smcnab1/workload-wizard-app/commit/d4ff25db57e1eed82d12004715c91441499dbb76))
- mark E2E test fixes as completed in review-TODO ([35ead3c](https://github.com/smcnab1/workload-wizard-app/commit/35ead3ca58196acbd13ac617d22ef5faf03059dd))

### 🔧 Refactors

- merge new design system styles and remove globals.css ([f71053c](https://github.com/smcnab1/workload-wizard-app/commit/f71053c9516e6e105f178c75300f69b7d704800c))
- merge new design system styles and remove globals.css ([78a9e3c](https://github.com/smcnab1/workload-wizard-app/commit/78a9e3c42f0a62a41b17570ef53dc926f0a464d4))

### 🧪 Tests

- Add api route to confirm fix ([#73](https://github.com/smcnab1/workload-wizard-app/issues/73)) ([db8be0e](https://github.com/smcnab1/workload-wizard-app/commit/db8be0ebde3155c59342ca35848716fe3a6b5c80))
- **e2e:** add authenticated Playwright setup and high-signal MVP coverage\n\n- Load .env.local in Playwright config; add setup project with storageState\n- Programmatic sign-in via custom form; skip gracefully if auth unavailable\n- Core workflow: academic year → course → module → iteration → group → allocation\n- UI permission states with disabled-with-tooltip assertions\n- AY visibility + preferences persistence\n- Courses listing uses actor-derived org (server-side)\n- Staff capacity filters + totals test (with testids)\n- Audit logs smoke + stable selectors\n- Tiny testids added to avoid flake\n\nrefactor(convex): add courses.listForActor query and use in courses page\nfeat(api-dev): add dev-only helper route for deterministic test data ([e03e4c3](https://github.com/smcnab1/workload-wizard-app/commit/e03e4c35d37a25cead709fc90f494850011c6eb1))
- **smoke:** stabilize [@smoke](https://github.com/smoke) suite; tag @core/[@flaky](https://github.com/flaky); gate CI on [@smoke](https://github.com/smoke); fix dev-tools orgCode; add staff testids; serialize smoke workers; fix modules smoke locator ([a770457](https://github.com/smcnab1/workload-wizard-app/commit/a7704573b1ac256a127168372ef3590206fdde2e))
- Test deploy to Vercel CLI ([f0c9926](https://github.com/smcnab1/workload-wizard-app/commit/f0c9926b74b07b502fb3aec78d4dabce80a9541d))

### 🧰 Maintenance

- Disable middleware for test ([08ba6c3](https://github.com/smcnab1/workload-wizard-app/commit/08ba6c3c38152babeb95f10488e13b9899396491))
- **docs:** update TOC ([d393b40](https://github.com/smcnab1/workload-wizard-app/commit/d393b402cff69eb62e07a7ba4d9edacdcccde20c))
- **docs:** update TOC ([3aa6f73](https://github.com/smcnab1/workload-wizard-app/commit/3aa6f7379485168ac6b87e21989b02c470765e55))
- **docs:** update TOC ([64c867e](https://github.com/smcnab1/workload-wizard-app/commit/64c867e0d03520a15e4d586d4d113867dd4c149a))
- **docs:** update TOC ([2b4c4b1](https://github.com/smcnab1/workload-wizard-app/commit/2b4c4b142570282efaa9fdc2a6ff6618ecfecefa))
- **docs:** update TOC ([0dc2da1](https://github.com/smcnab1/workload-wizard-app/commit/0dc2da17e6f1c39c0b9e3118987db2aa28230d65))
- **docs:** update TOC ([eb3ca64](https://github.com/smcnab1/workload-wizard-app/commit/eb3ca64ee1560c6cd5af60ad37d4a49b69acbf1e))
- **docs:** update TOC ([4054c20](https://github.com/smcnab1/workload-wizard-app/commit/4054c2060483c646aabf98688257d6893a6ad00b))
- **docs:** update TOC ([ebf761b](https://github.com/smcnab1/workload-wizard-app/commit/ebf761b6ab9db1097bbe7ef0f770c86f926cfde2))
- **docs:** update TOC ([d008aa2](https://github.com/smcnab1/workload-wizard-app/commit/d008aa2032831d6edf15b459074c646d93e2c6c4))
- **docs:** update TOC ([bcfab91](https://github.com/smcnab1/workload-wizard-app/commit/bcfab917747265460a9e6d190e572dd65be34fb2))
- **docs:** update TOC ([ba33223](https://github.com/smcnab1/workload-wizard-app/commit/ba33223304c7c0c664c1ec2a68cf91179933bf11))
- Fix blog errors ([654cad5](https://github.com/smcnab1/workload-wizard-app/commit/654cad555e72f3eb568a8bfa1834b0c6db09edc9))
- Fix codeql.yml ([c22e50d](https://github.com/smcnab1/workload-wizard-app/commit/c22e50d65244a0d1d3a9fb3988e324962ea648ad))
- Fix docs formatting ([b664394](https://github.com/smcnab1/workload-wizard-app/commit/b664394926861b75cbb9c11876c7dcec7088dcaf))
- Fix Format ([cf99140](https://github.com/smcnab1/workload-wizard-app/commit/cf99140efaea8ebb4af427eff733ed8cd20f79bf))
- Fix formatting ([e46f11d](https://github.com/smcnab1/workload-wizard-app/commit/e46f11d41688e8b31de8dbe35392743f6d0e775d))
- Fix formatting ([b823bf4](https://github.com/smcnab1/workload-wizard-app/commit/b823bf42539c7d683a3cce952294697f5616712e))
- Fix formatting ([5fcb761](https://github.com/smcnab1/workload-wizard-app/commit/5fcb761314429af6ab5d5f77599c7065e2cf3f02))
- Fix navigation for Admin & Dev ([8d758fa](https://github.com/smcnab1/workload-wizard-app/commit/8d758fa6d6bb808e911e2523e841b2397db9bc08))
- Fix quality.yml linting ([993d880](https://github.com/smcnab1/workload-wizard-app/commit/993d880d39ef2603d9d3aa55a83cd2413871b45c))
- Fix quality.yml linting ([e1f9f3f](https://github.com/smcnab1/workload-wizard-app/commit/e1f9f3ff9bdb7421dec84e2adeb548a66f46b039))
- Fix quality.yml linting ([e89b136](https://github.com/smcnab1/workload-wizard-app/commit/e89b136f6c9c99f4eedaf8e1aad64a201f3abf1f))
- Fix quality.yml linting ([37a4dfa](https://github.com/smcnab1/workload-wizard-app/commit/37a4dfac1045f3ba7f4f9dc54e52e8520bab54b1))
- Fix semgrep.yml ([bf54c2a](https://github.com/smcnab1/workload-wizard-app/commit/bf54c2ae9a61b9872f1ce009f633ac526200002c))
- Fix semgrep.yml ([d6b8336](https://github.com/smcnab1/workload-wizard-app/commit/d6b8336e969e312421a83dddee91650f1bf9b8df))
- Fix semgrep.yml ([a866798](https://github.com/smcnab1/workload-wizard-app/commit/a8667980658e7ed30961fbff94c017597825e9a6))
- Fix semgrep.yml ([bbf7145](https://github.com/smcnab1/workload-wizard-app/commit/bbf7145bf6230ffba1427d053255cf55f5f5e6bb))
- Fix semgrep.yml ([3e4a995](https://github.com/smcnab1/workload-wizard-app/commit/3e4a9953d5167b13b1ac344a4237474be20ca4d5))
- Fix semgrep.yml ([38872a5](https://github.com/smcnab1/workload-wizard-app/commit/38872a5961960fb34b5507b57f6a0e24e069e398))
- Fix UI & Bugs ([38706a9](https://github.com/smcnab1/workload-wizard-app/commit/38706a9b36437ef16697090d1e36f54b4ca50123))
- Fix vercel.yml ([9495471](https://github.com/smcnab1/workload-wizard-app/commit/9495471c34f6271cf551adf8f761523138ef596a))
- Fix vercel.yml ([8816f70](https://github.com/smcnab1/workload-wizard-app/commit/8816f703d9a4ffec461031254dc8e0fa41f36f7d))
- Fix vercel.yml ([f031d0c](https://github.com/smcnab1/workload-wizard-app/commit/f031d0c78e04ddb2ba253374a5c5ce8278c713da))
- Fix vercel.yml ([a9879f4](https://github.com/smcnab1/workload-wizard-app/commit/a9879f41f050d0d65198bdf403c685cb09576c37))
- Fix vercel.yml ([a812cc9](https://github.com/smcnab1/workload-wizard-app/commit/a812cc96ddc054ad6256d68fc22215509f7fc2ca))
- Fix vercel.yml ([4cb13c7](https://github.com/smcnab1/workload-wizard-app/commit/4cb13c79f8f2e6ed3d8a9ec2bd315ad837d3c971))
- Fix vercel.yml ([0d62972](https://github.com/smcnab1/workload-wizard-app/commit/0d62972b9780fda2710e274cdd98f33c42841faf))
- Fix vercel.yml ([185f170](https://github.com/smcnab1/workload-wizard-app/commit/185f17099831b1cc388f0c6148dd84f277fea958))
- format with prettier ([9300474](https://github.com/smcnab1/workload-wizard-app/commit/93004741a71da41249ab6472b59feb4354c76948))
- Push for fix ([baefa58](https://github.com/smcnab1/workload-wizard-app/commit/baefa583e39bebb9211bafbfff6a2a5696efeec5))
- Remove custom feature-flag functions ([7d5b339](https://github.com/smcnab1/workload-wizard-app/commit/7d5b339244344ed46e477705406a250463c129c9))
- Remove outdated TODO list for e2e testing improvements ([0f28bce](https://github.com/smcnab1/workload-wizard-app/commit/0f28bceef2813bd0ce69bfa93433696dfb69e2f3))
- Removes obsolete documentation files ([#72](https://github.com/smcnab1/workload-wizard-app/issues/72)) ([08117ee](https://github.com/smcnab1/workload-wizard-app/commit/08117eebdd12cc6516e94aef6e8c8ceb120294d3))
- Test Commit for PR Test ([36c49f6](https://github.com/smcnab1/workload-wizard-app/commit/36c49f67fca05d9f7906546564c27d77091016fc))
- Update docs ([#61](https://github.com/smcnab1/workload-wizard-app/issues/61)) ([ff61938](https://github.com/smcnab1/workload-wizard-app/commit/ff619380a65d4dc712832488cefa10cda348521f))
- Update tests ([e3384ca](https://github.com/smcnab1/workload-wizard-app/commit/e3384caa1ac58e2d447b320042d545eb9ac03e91))
