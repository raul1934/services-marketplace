<x-filament-panels::page>
    <div>
        {{-- Leaflet CSS/JS and the `liveMap` Alpine component are loaded
        panel-wide via AdminPanelProvider's HEAD_END render hook
        (public/js/admin-maps.js) — see that provider's docblock for why this
        can't be an inline <script> here. --}}
        <div
            wire:ignore
            x-data="liveMap(@js($this->mapMarkets), @js($this->icons), @js($this->categories))"
            x-init="init($el)"
        >
            <div class="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
                    @foreach (['Open' => '#3b82f6', 'Accepted' => '#f59e0b', 'In progress' => '#10b981'] as $label => $color)
                        <span class="flex items-center gap-2">
                            <span class="inline-block h-3 w-3 rounded-full" style="background: {{ $color }}"></span>
                            {{ $label }}
                        </span>
                    @endforeach
                    <span class="flex items-center gap-2"><span class="text-base">👤</span> Customer (category icon)</span>
                    <span class="flex items-center gap-2"><span class="text-base">🚚</span> Provider</span>
                </div>

                <div class="relative">
                    <button
                        type="button"
                        x-on:click="filtersOpen = !filtersOpen"
                        class="fi-btn fi-btn-color-gray flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium"
                        style="border-color: rgb(209 213 219);"
                    >
                        Filters
                    </button>

                    {{-- z-index must clear Leaflet's own panes (200–1000+): the
                    map container only sets `position: relative` with no
                    z-index of its own, so its internal panes' z-index values
                    escape its stacking context and compare directly against
                    siblings here — a plain z-20 rendered fully underneath. --}}
                    <div
                        x-show="filtersOpen"
                        x-on:click.outside="filtersOpen = false"
                        x-cloak
                        class="absolute right-0 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-800"
                        style="border-color: rgb(209 213 219); max-height: 70vh; overflow-y: auto; z-index: 9999;"
                    >
                        <p class="mb-2 font-semibold">Status</p>
                        <div class="mb-4 flex flex-col gap-1.5">
                            <template x-for="status in Object.keys(statusColors)" :key="status">
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" x-model="statusFilter[status]" x-on:change="refresh()" class="fi-checkbox-input rounded" />
                                    <span class="inline-block h-2.5 w-2.5 rounded-full" x-bind:style="`background: ${statusColors[status]}`"></span>
                                    <span x-text="status.replace('_', ' ')"></span>
                                </label>
                            </template>
                        </div>

                        <div class="mb-2 flex items-center justify-between">
                            <p class="font-semibold">Category</p>
                            <div class="flex gap-2 text-xs">
                                <button type="button" x-on:click="toggleAllCategories(true)" class="fi-link font-medium text-primary-600 dark:text-primary-400">All</button>
                                <button type="button" x-on:click="toggleAllCategories(false)" class="fi-link font-medium text-primary-600 dark:text-primary-400">None</button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <template x-for="category in categories" :key="category.id">
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" x-model="categoryFilter[category.id]" x-on:change="refresh()" class="fi-checkbox-input rounded" />
                                    <span class="inline-block h-4 w-4 [&>svg]:h-full [&>svg]:w-full" x-html="icons[category.icon] ?? ''"></span>
                                    <span x-text="category.name"></span>
                                </label>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div x-ref="mapEl" style="height: 75vh; border-radius: 0.5rem; overflow: hidden;"></div>
        </div>
    </div>
</x-filament-panels::page>
