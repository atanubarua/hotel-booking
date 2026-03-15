<?php

namespace App\Http\Responses;

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

        if ($user && ($user->role ?? null) === 'admin') {
            $intended = '/admin';
        }

        return redirect()->intended($intended);
    }
}

