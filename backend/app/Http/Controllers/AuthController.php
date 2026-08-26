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

        $user = User::with(['rol', 'sede'])
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
                'sede' => $user->sede,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['rol', 'sede']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'dni' => $user->dni,
                'username' => $user->username,
                'email' => $user->email,
                'rol' => $user->rol,
                'sede' => $user->sede,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta'], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'editar',
            'entidad' => 'user',
            'entidad_id' => $user->id,
            'detalle' => ['campo' => 'password'],
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente']);
    }
}
