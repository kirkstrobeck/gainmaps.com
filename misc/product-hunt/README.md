# Product Hunt launch kit — Gainmaps

Paste from these files. Do not ask anyone to upvote. Do not pay a hunter. Self-hunt.

Official docs: https://www.producthunt.com/launch and https://www.producthunt.com/launch/preparing-for-launch

## Submit flow

1. Log into Product Hunt as Kirk Strobeck.
2. Submit → New Product.
3. Paste https://gainmaps.com
4. Fill fields from form.md
5. Upload thumbnail (thumbnail.svg exported to 240x240 PNG) and gallery (slides, 1270x760)
6. Optional: YouTube URL from video.md
7. Schedule Tuesday, Wednesday, or Thursday at 12:01 AM Pacific. Avoid Monday and Friday if you can choose.
8. You can schedule up to about a month ahead. Drafts autosave.

Expected post URL: https://www.producthunt.com/posts/gainmaps

## Asset checklist

- [ ] Name, tagline, description, 3 topics, pricing Free
- [ ] Thumbnail 240x240, under 3MB, first frame works as a still
- [ ] At least 2 gallery images (5 slides provided), 1270x760, under 3MB, first image is social preview
- [ ] Optional public YouTube video, full watch URL
- [ ] First comment copied, ready to paste at go-live
- [ ] Social posts ready (social.md)
- [ ] Maker profile filled

## Launch day

- T-minus overnight: confirm the scheduled launch, thumbnail, gallery order, links
- Minute 0: post the first comment from first-comment.md
- First hour: reply to every comment using the reply bank in social.md
- Morning: share X, LinkedIn, email, Slack. Ask people to try a photo and comment. Never ask for upvotes.
- Rest of day: stay on the thread. Be specific. Thank people. Fix nothing in public that you have not verified.

## After launch

Replace the Product Hunt placeholder on the homepage:

- File: apps/web/app/page.tsx
- Current: https://www.producthunt.com/posts/PLACEHOLDER
- Next: https://www.producthunt.com/posts/gainmaps (or the real slug Product Hunt assigns)

Do not do that until the post exists.

## Files

- form.md — paste-ready fields
- first-comment.md — maker comment
- gallery.md — shot list
- video.md — demo script
- social.md — posts and replies
- thumbnail.svg — 240x240 mark
- slides/ — five 1270x760 HTML cards to screenshot
