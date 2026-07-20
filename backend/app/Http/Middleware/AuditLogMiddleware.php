<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log write operations (POST, PUT, DELETE, PATCH)
        if (in_array($request->method(), ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $user = Auth::user();
            
            // Exclude sensitive data from logs
            $payload = $request->except(['password', 'password_confirmation', 'token', 'current_password']);
            
            $action = $request->method();
            $path = $request->path();
            
            $description = "User " . ($user ? $user->email : 'Anonymous') . " executed {$action} on {$path}";

            // Don't log if it's logging out (handled separately)
            if ($path !== 'api/auth/logout') {
                ActivityLog::create([
                    'user_id' => $user ? $user->id : null,
                    'action' => $action,
                    'description' => $description,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'payload' => $payload,
                ]);
            }
        }

        return $response;
    }
}
