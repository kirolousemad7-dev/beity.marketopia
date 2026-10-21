<?php

namespace App\Models\Users;

use Illuminate\Database\Eloquent\Model;

class UserAuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = ['action', 'user_id', 'ip_address', 'details'];

    protected function casts(): array
    {
        return ['details' => 'array'];
    }
}
