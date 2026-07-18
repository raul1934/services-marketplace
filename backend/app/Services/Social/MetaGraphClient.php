<?php

namespace App\Services\Social;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper over the Meta Graph API used by both the Facebook and Instagram
 * drivers. Mirrors ExpoChannel's Http usage: `Http::acceptJson()->withToken()
 * ->post/get()` with a try/catch that logs a warning. Tokens are passed as the
 * bearer only — never logged (log lines carry the path/error, not the token).
 */
class MetaGraphClient
{
    private string $base;

    public function __construct()
    {
        $version = (string) config('services.meta.graph_version', 'v21.0');
        $this->base = 'https://graph.facebook.com/'.$version;
    }

    // ── Facebook Page publishing ─────────────────────────────

    /** POST /{page-id}/feed — text/link post. Returns the created post id. */
    public function createPageFeedPost(string $pageId, string $token, string $message, ?string $link = null): ?string
    {
        $payload = ['message' => $message];
        if ($link) {
            $payload['link'] = $link;
        }

        $body = $this->post("/{$pageId}/feed", $token, $payload);

        return $body['id'] ?? null;
    }

    /** POST /{page-id}/photos — image post. Returns the created post id. */
    public function createPagePhotoPost(string $pageId, string $token, string $imageUrl, string $caption): ?string
    {
        $body = $this->post("/{$pageId}/photos", $token, [
            'url' => $imageUrl,
            'caption' => $caption,
        ]);

        // /photos returns post_id (the Page post) alongside the photo id.
        return $body['post_id'] ?? $body['id'] ?? null;
    }

    // ── Instagram publishing (container → publish) ───────────

    /** POST /{ig-user-id}/media — create a media container. Returns its id. */
    public function createInstagramContainer(string $igUserId, string $token, string $imageUrl, string $caption): ?string
    {
        $body = $this->post("/{$igUserId}/media", $token, [
            'image_url' => $imageUrl,
            'caption' => $caption,
        ]);

        return $body['id'] ?? null;
    }

    /** POST /{ig-user-id}/media_publish — publish a container. Returns media id. */
    public function publishInstagramContainer(string $igUserId, string $token, string $creationId): ?string
    {
        $body = $this->post("/{$igUserId}/media_publish", $token, [
            'creation_id' => $creationId,
        ]);

        return $body['id'] ?? null;
    }

    // ── Interactions ─────────────────────────────────────────

    /**
     * GET /{post-id}?fields=reactions.summary(true),comments.summary(true)
     *
     * @return array{likes_count:int, comments_count:int}
     */
    public function facebookPostSummary(string $postId, string $token): array
    {
        $body = $this->get("/{$postId}", $token, [
            'fields' => 'reactions.summary(true),comments.summary(true)',
        ]);

        return [
            'likes_count' => (int) ($body['reactions']['summary']['total_count'] ?? 0),
            'comments_count' => (int) ($body['comments']['summary']['total_count'] ?? 0),
        ];
    }

    /**
     * GET /{post-id}/comments?fields=from,message,created_time
     *
     * @return array<int, array{external_id:string, author_name:?string, text:?string, posted_at:?string}>
     */
    public function facebookComments(string $postId, string $token): array
    {
        $body = $this->get("/{$postId}/comments", $token, [
            'fields' => 'from,message,created_time',
        ]);

        return collect($body['data'] ?? [])->map(fn (array $c) => [
            'external_id' => (string) ($c['id'] ?? ''),
            'author_name' => $c['from']['name'] ?? null,
            'text' => $c['message'] ?? null,
            'posted_at' => $c['created_time'] ?? null,
        ])->filter(fn ($c) => $c['external_id'] !== '')->values()->all();
    }

    /**
     * GET /{media-id}?fields=like_count,comments_count
     *
     * @return array{likes_count:int, comments_count:int}
     */
    public function instagramMediaSummary(string $mediaId, string $token): array
    {
        $body = $this->get("/{$mediaId}", $token, [
            'fields' => 'like_count,comments_count',
        ]);

        return [
            'likes_count' => (int) ($body['like_count'] ?? 0),
            'comments_count' => (int) ($body['comments_count'] ?? 0),
        ];
    }

    /**
     * GET /{media-id}/comments?fields=text,username,timestamp
     *
     * @return array<int, array{external_id:string, author_name:?string, text:?string, posted_at:?string}>
     */
    public function instagramComments(string $mediaId, string $token): array
    {
        $body = $this->get("/{$mediaId}/comments", $token, [
            'fields' => 'text,username,timestamp',
        ]);

        return collect($body['data'] ?? [])->map(fn (array $c) => [
            'external_id' => (string) ($c['id'] ?? ''),
            'author_name' => $c['username'] ?? null,
            'text' => $c['text'] ?? null,
            'posted_at' => $c['timestamp'] ?? null,
        ])->filter(fn ($c) => $c['external_id'] !== '')->values()->all();
    }

    // ── Transport ────────────────────────────────────────────

    /** @return array<string, mixed> */
    private function post(string $path, string $token, array $payload): array
    {
        try {
            $response = Http::acceptJson()->withToken($token)->post($this->base.$path, $payload);

            return $this->unwrap($response, 'POST '.$path);
        } catch (\Throwable $e) {
            Log::warning('Meta Graph POST '.$path.' failed: '.$e->getMessage());

            return [];
        }
    }

    /** @return array<string, mixed> */
    private function get(string $path, string $token, array $query): array
    {
        try {
            $response = Http::acceptJson()->withToken($token)->get($this->base.$path, $query);

            return $this->unwrap($response, 'GET '.$path);
        } catch (\Throwable $e) {
            Log::warning('Meta Graph GET '.$path.' failed: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Log Graph API errors (message only, never the token) and return the body.
     *
     * @return array<string, mixed>
     */
    private function unwrap(Response $response, string $context): array
    {
        if ($response->failed()) {
            $error = $response->json('error.message') ?? $response->status();
            Log::warning('Meta Graph '.$context.' error: '.$error);
        }

        return (array) $response->json();
    }
}
