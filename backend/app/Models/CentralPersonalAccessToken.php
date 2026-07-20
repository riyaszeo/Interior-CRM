<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class CentralPersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $connection = 'central';
    protected $table = 'personal_access_tokens';
}
