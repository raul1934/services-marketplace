<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The in-app notification list — the bell.
 *
 * Reads what the `database` channel of BaseAppNotification already writes, so
 * every notification in the app is listed here for free. Lives on the shared
 * `Api` namespace (like UploadController) because both the client and the
 * provider apps have the same bell.
 */
class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $page = $request->user()
            ->notifications()
            ->paginate($this->perPage($request));

        return NotificationResource::collection($page);
    }

    /** Feeds the badge; kept separate so the bell doesn't fetch a whole page. */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        // Scoped to the user's own notifications, so a foreign id is a 404
        // rather than someone else's row being marked read.
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }
}
