<?php

namespace App\Enums;

/** Lifecycle stage a request photo belongs to. */
enum PhotoPhase: string
{
    case Request = 'request'; // client's reference photos at creation
    case Before = 'before';   // provider's photo before starting the job
    case After = 'after';     // provider's photo after finishing the job
}
