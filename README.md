# Hyderabad Entrepreneurs Hub — website

Source for [entrepreneurhub.in](https://entrepreneurhub.in). Built with Next.js, TypeScript and Tailwind CSS; deployed on Vercel. Every page is statically generated, so the site is fast and needs no server.

## Editing content (no code knowledge needed)

All copy and data live in `src/data/`. Change a value, commit, and the site redeploys.

| To change… | Edit |
|---|---|
| Contact details, address, social links, membership fee, apply-form link, nav | `src/data/site.ts` |
| Core team (names, roles, LinkedIn, email; photos in `public/team/`) | `src/data/team.ts` |
| Benefits, eligibility criteria, application steps, what membership includes | `src/data/benefits.ts` |
| FAQ | `src/data/faq.ts` |
| Testimonial videos (YouTube IDs) | `src/data/testimonials.ts` |
| Privacy policy | `src/data/privacy.ts` |
| Colours, fonts, spacing | `src/app/globals.css` (`@theme` block) |


## Pages

`/` home · `/events` · `/members` (locked, "Launching soon") · `/team` · `/apply` · `/login` (placeholder) · `/privacy`

SEO is built in: per-page titles and descriptions, Open Graph image, `sitemap.xml`, `robots.txt`, and Organization + FAQ structured data for search engines and AI assistants.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # production build
```

## Deploying

The repository is connected to Vercel. Pushing to `main` deploys to production; every pull request gets a preview URL.
