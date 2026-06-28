<?php

namespace App\Notifications;

/**
 * Notifies the rated party that a review was left for them. Mutual rating,
 * client <-> provider (R-AVALIAÇÃO). `authorRole` is the role of the author who
 * left the review ('client' or 'provider'); the recipient is the other party.
 */
class YouWereRated extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $rating,
        public string $authorRole,
    ) {}

    public function type(): string
    {
        return 'you_were_rated';
    }

    public function title(): string
    {
        return __('notifications.you_were_rated.title');
    }

    public function body(): string
    {
        return __('notifications.you_were_rated.body', ['rating' => $this->rating]);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'rating' => (string) $this->rating,
            'author_role' => $this->authorRole,
        ];
    }
}
