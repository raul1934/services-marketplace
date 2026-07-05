{{-- Leaflet CSS/JS and the map-init logic are loaded panel-wide via
AdminPanelProvider's HEAD_END render hook (public/js/admin-maps.js). This
container is picked up by a MutationObserver there rather than an Alpine
x-data component — see that file's docblock for why (Alpine's $el/$refs
resolved to undefined when this content was injected via the modal's
Livewire AJAX swap). --}}
<div>
    <div class="mb-3 flex items-center gap-2 text-sm">
        <span data-role="status-dot" class="inline-block h-2.5 w-2.5 rounded-full" style="background: {{ ['open' => '#3b82f6', 'accepted' => '#f59e0b', 'in_progress' => '#10b981'][$record['status']] ?? '#6b7280' }}"></span>
        <span data-role="status-label">#{{ $record['id'] }} · {{ $record['label'] ?? '—' }} · {{ $record['status'] }}</span>
    </div>

    <div
        wire:ignore
        class="js-request-map"
        data-record="{{ json_encode($record) }}"
        data-icons="{{ json_encode($icons) }}"
        style="height: 380px; border-radius: 0.5rem; overflow: hidden;"
    ></div>
</div>
