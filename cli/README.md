# InboxLM CLI

Resource-oriented CLI for InboxLM auth APIs.

## Commands

```bash
inboxlm config set base-url https://demo.example.com
inboxlm config set api-token <token>
inboxlm config set output json

inboxlm token verify

inboxlm link add --url https://example.com
inboxlm link batch-add --url https://a.com --url https://b.com
inboxlm link batch-add --file ./links.json
inboxlm link get --id <link_id>
inboxlm link list --page 1 --page-size 20

inboxlm social-post add --source x --url https://x.com/a/status/123 --fetch-method scraper
inboxlm social-post batch-add --file ./social-posts.json
inboxlm social-post authors list --source x --author-starred true
inboxlm social-post get --id <social_post_id>
inboxlm social-post list --source x --mark-status important --author-starred true
```

## Social Post Commands

Single record (worker will fetch):

```bash
inboxlm social-post add \
  --source x \
  --url https://x.com/example/status/123 \
  --fetch-method scraper
```

Single record with pre-scraped data (skip the fetcher and go straight to AI
analysis):

```bash
inboxlm social-post add \
  --source x \
  --url https://x.com/karpathy/status/2053872850101285137 \
  --fetch-method preloaded \
  --post-id 2053872850101285137 \
  --original-content "This works really well btw…" \
  --like-count 17570 \
  --comment-count 937 \
  --share-count 2252 \
  --favorite-count 19843 \
  --platform-created-at 2026-05-11T16:20:21.000Z \
  --metrics-updated-at 2026-05-19T19:35:25.686Z \
  --author-handle karpathy \
  --author-name "Andrej Karpathy" \
  --resource-url https://example.com/img1.png \
  --resource-url https://example.com/img2.png
```

List query:

```bash
inboxlm social-post list \
  --page 1 \
  --page-size 20 \
  --source x \
  --mark-status important \
  --status completed \
  --author-starred true \
  --author-tag ai
```

Author query:

```bash
inboxlm social-post authors list \
  --source x \
  --author-starred true
```

## Configuration

Configuration keys:

- `base_url`
- `api_token`
- `output`

## Batch File Formats

`inboxlm link batch-add --file` accepts:

```json
["https://example.com/a", "https://example.com/b"]
```

or

```json
{
  "urls": ["https://example.com/a", "https://example.com/b"]
}
```

`inboxlm social-post batch-add --file` accepts:

```json
[
  {
    "source": "x",
    "url": "https://x.com/example/status/123",
    "fetch_method": "scraper"
  }
]
```

or

```json
{
  "items": [
    {
      "source": "rednote",
      "url": "https://www.xiaohongshu.com/explore/abc",
      "fetch_method": "agent"
    }
  ]
}
```

### Preloaded ingest (e.g. scraped tweets)

When you already have the post body and metrics (for example a per-tweet record
from an external scraper), set `fetch_method: "preloaded"` and include the
metadata fields you have. The API skips the fetch step and the worker goes
straight to AI analysis.

Mapping from a typical x-crab `tweets.jsonl` record to the payload:

| JSONL field      | Payload field                |
|------------------|------------------------------|
| `tweet_id`       | `post_id`                    |
| `handle`         | `author.platform_author_id`  |
| `ts`             | `platform_created_at`        |
| `scraped_at`     | `metrics_updated_at`         |
| `text_full`      | `original_content`           |
| `metrics.likes`  | `like_count`                 |
| `metrics.replies`| `comment_count`              |
| `metrics.retweets`| `share_count`               |
| `metrics.bookmarks`| `favorite_count`           |
| `media[].url`    | `resource_urls[]`            |

Not yet exposed (will be dropped if supplied): `metrics.views`, `is_repost`,
`is_reply`, `pinned`, `quoted_tweet`, `thread[]`, and structured `media[]`
metadata beyond the flat URL list.

Example payload file:

```json
{
  "items": [
    {
      "source": "x",
      "url": "https://x.com/karpathy/status/2053872850101285137",
      "fetch_method": "preloaded",
      "post_id": "2053872850101285137",
      "original_content": "This works really well btw…",
      "resource_urls": [
        "https://example.com/img1.png"
      ],
      "like_count": 17570,
      "comment_count": 937,
      "share_count": 2252,
      "favorite_count": 19843,
      "platform_created_at": "2026-05-11T16:20:21.000Z",
      "metrics_updated_at": "2026-05-19T19:35:25.686Z",
      "author": {
        "platform_author_id": "karpathy",
        "author_name": "Andrej Karpathy",
        "avatar_url": "https://example.com/karpathy.png"
      }
    }
  ]
}
```
