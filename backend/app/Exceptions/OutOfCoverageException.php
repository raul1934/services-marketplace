<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Thrown when a customer opens a request outside every active Market's geofence
 * while territory isolation is on: there's no franchisee to serve it. Renders as
 * a 422 (JSON for api/*, per bootstrap/app.php) so the app shows the message, and
 * the demand is captured as a CoverageLead before this is thrown.
 */
class OutOfCoverageException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct(422, $message);
    }
}
