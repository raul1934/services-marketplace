<x-filament-panels::page class="fi-dashboard-page">
    <x-filament-widgets::widgets
        :columns="$this->getColumns()"
        :widgets="$this->getVisibleWidgets()"
    />

    {{ $this->table }}
</x-filament-panels::page>
