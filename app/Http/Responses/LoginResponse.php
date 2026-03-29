<?php

namespace App\Http\Responses;

use App\Enums\Role;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request)
    {
        $user = $request->user();

        $intended = '/dashboard';

        if ($user?->role === Role::Admin) {
            $intended = '/admin';
        } elseif ($user?->role === Role::Partner) {
            $intended = '/partner';
        }

        return redirect()->intended($intended);
    }
}

