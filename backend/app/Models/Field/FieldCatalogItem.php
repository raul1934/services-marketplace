<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;

/** Company-wide catalog of add-on services offered on any visit. */
class FieldCatalogItem extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'rate', 'obrig', 'position'];

    protected $casts = [
        'obrig' => 'boolean',
        'position' => 'integer',
    ];
}
