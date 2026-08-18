<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login de desarrollo (mock): valida contra los usuarios locales de SAGI.
     * En producción se reemplazará por la integración con el login del ISeP.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dni' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with(['rol', 'area'])
            ->where('dni', $validated['dni'])
            ->orWhere('username', $validated['dni'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        $token = $user->createToken('sagi-token')->plainTextToken;

        Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'login',
            'entidad' => 'auth',
            'entidad_id' => $user->id,
            'detalle' => ['dni' => $validated['dni']],
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'dni' => $user->dni,
                'username' => $user->username,
                'email' => $user->email,
                'rol' => $user->rol,
                'area' => $user->area,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['rol', 'area']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'dni' => $user->dni,
                'username' => $user->username,
                'email' => $user->email,
                'rol' => $user->rol,
                'area' => $user->area,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }
}
