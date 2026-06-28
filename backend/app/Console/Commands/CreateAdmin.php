<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {name} {email} {password}';

    protected $description = 'Create or promote an admin user (admins cannot self-register)';

    public function handle(): int
    {
        $user = User::updateOrCreate(
            ['email' => $this->argument('email')],
            [
                'name' => $this->argument('name'),
                'password' => $this->argument('password'), // 'hashed' cast hashes it
                'is_admin' => true,
                'is_client' => false,
                'is_provider' => false,
            ],
        );

        $this->info("Admin ready: {$user->email} (id {$user->id})");

        return self::SUCCESS;
    }
}
