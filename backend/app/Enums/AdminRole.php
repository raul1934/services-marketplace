<?php

namespace App\Enums;

/**
 * Only meaningful on an admin account (users.is_admin = true). Super Admin is
 * global; Market Admin is scoped to whichever Markets they're assigned to via
 * the admin_market pivot (see User::marketIds()).
 */
enum AdminRole: string
{
    case SuperAdmin = 'super_admin';
    case MarketAdmin = 'market_admin';
}
