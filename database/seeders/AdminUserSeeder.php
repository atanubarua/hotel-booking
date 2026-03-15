<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = config('admin.email', 'admin@booking.test');
        $password = config('admin.password', 'password');

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make($password),
                'role' => Role::Admin,
            ]
        );
    }
}

