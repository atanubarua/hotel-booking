<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventAdminFromDashboard
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === Role::Admin) {
            return redirect('/admin');
        }

        if ($user && $user->role === Role::Partner) {
            return redirect('/partner');
        }

        return $next($request);
    }
}
