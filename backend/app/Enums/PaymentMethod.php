<?php

namespace App\Enums;

/** How the customer intends to pay for a service request. */
enum PaymentMethod: string
{
    case Pix = 'pix';   // instant transfer, paid when the service is done
    case Card = 'card'; // credit card on file
    case Cash = 'cash'; // paid directly to the provider on site

    public function label(): string
    {
        return match ($this) {
            self::Pix => 'Pix',
            self::Card => 'Cartão',
            self::Cash => 'Dinheiro',
        };
    }
}
