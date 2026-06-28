<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Per-page size for paginated list endpoints. Reads `?per_page`, falling
     * back to $default, and clamps to [1, 50] so a client can't ask for an
     * unbounded page.
     */
    protected function perPage(Request $request, int $default = 20): int
    {
        $perPage = (int) $request->query('per_page', $default);

        return max(1, min(50, $perPage));
    }
}
