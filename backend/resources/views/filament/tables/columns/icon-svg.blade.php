@php $svg = $getState(); @endphp

@if ($svg)
    {{-- lucide's source SVG hardcodes width/height="24", which would win over
    any sizing on this wrapper unless overridden directly on the <svg> itself. --}}
    <span class="inline-block h-5 w-5 text-gray-500 [&>svg]:h-full [&>svg]:w-full dark:text-gray-400">
        {!! $svg !!}
    </span>
@endif
