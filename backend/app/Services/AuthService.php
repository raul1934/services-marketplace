<?php

namespace App\Services;

use App\Models\ProviderProfile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user with the given role(s).
     *
     * @param  array{name:string,email:string,phone?:?string,password:string,role:string}  $data
     * @param  array<string,?string>|null  $device
     * @return array{user:User, tokens:array<string,string>}
     */
    public function register(array $data, ?array $device = null): array
    {
        $isProvider = in_array($data['role'], ['provider', 'both'], true);
        $isClient = in_array($data['role'], ['client', 'both'], true);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'], // 'hashed' cast handles bcrypt
            'is_client' => $isClient,
            'is_provider' => $isProvider,
        ]);

        if ($isProvider) {
            ProviderProfile::create(['user_id' => $user->id]);
        }

        if ($device) {
            $this->syncDevice($user, $device);
        }

        return [
            'user' => $user->load('providerProfile', 'categories'),
            'tokens' => $this->issueTokens($user),
        ];
    }

    /**
     * @param  array<string,?string>|null  $device
     * @return array{user:User, tokens:array<string,string>}
     */
    public function login(string $email, string $password, ?array $device = null): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        if ($device) {
            $this->syncDevice($user, $device);
        }

        return [
            'user' => $user->load('providerProfile', 'categories'),
            'tokens' => $this->issueTokens($user),
        ];
    }

    /**
     * Find-or-create a user from a verified social profile, then issue tokens.
     *
     * @param  array<string,?string>|null  $device
     * @return array{user:User, tokens:array<string,string>}
     */
    public function socialLogin(string $email, string $name, string $role = 'client', ?array $device = null): array
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            $isProvider = in_array($role, ['provider', 'both'], true);
            $isClient = in_array($role, ['client', 'both'], true) || ! $isProvider;

            $user = User::create([
                'name' => $name !== '' ? $name : 'Usuário',
                'email' => $email,
                'password' => Str::random(40),
                'is_client' => $isClient,
                'is_provider' => $isProvider,
            ]);

            if ($isProvider) {
                ProviderProfile::create(['user_id' => $user->id]);
            }
        }

        if ($device) {
            $this->syncDevice($user, $device);
        }

        return [
            'user' => $user->load('providerProfile', 'categories'),
            'tokens' => $this->issueTokens($user),
        ];
    }

    /**
     * Find-or-create a user from a verified phone number, then issue tokens.
     * Used by the OTP flow after the code has been confirmed.
     *
     * @param  array<string,?string>|null  $device
     * @return array{user:User, tokens:array<string,string>}
     */
    public function phoneLogin(string $phone, string $role = 'client', ?array $device = null, ?string $name = null): array
    {
        $user = User::where('phone', $phone)->first();

        if (! $user) {
            $isProvider = in_array($role, ['provider', 'both'], true);
            $isClient = in_array($role, ['client', 'both'], true) || ! $isProvider;

            $user = User::create([
                'name' => $name && $name !== '' ? $name : 'Usuário',
                'email' => 'phone+'.$phone.'@chamafacil.local',
                'phone' => $phone,
                'password' => Str::random(40),
                'is_client' => $isClient,
                'is_provider' => $isProvider,
            ]);

            if ($isProvider) {
                ProviderProfile::create(['user_id' => $user->id]);
            }
        }

        if ($device) {
            $this->syncDevice($user, $device);
        }

        return [
            'user' => $user->load('providerProfile', 'categories'),
            'tokens' => $this->issueTokens($user),
        ];
    }

    /**
     * Issue one token per role the user holds. A user can be both a client and
     * a provider (and/or admin); the mobile app stores every token returned and
     * sends the one matching the context it is acting in. The token ability
     * ('client' | 'provider' | 'admin') is what gates the API routes.
     *
     * @return array<string,string>
     */
    public function issueTokens(User $user): array
    {
        $tokens = [];

        if ($user->is_client) {
            $tokens['client'] = $user->createToken('client', ['client'])->plainTextToken;
        }
        if ($user->is_provider) {
            $tokens['provider'] = $user->createToken('provider', ['provider'])->plainTextToken;
        }
        if ($user->is_admin) {
            $tokens['admin'] = $user->createToken('admin', ['admin'])->plainTextToken;
        }

        return $tokens;
    }

    /** Revoke every token for the user (full sign-out of all contexts). */
    public function logout(User $user, ?string $deviceNo = null): void
    {
        $user->tokens()->delete();

        if ($deviceNo) {
            $user->devices()->where('device_no', $deviceNo)->update(['notification_token' => null]);
        }
    }

    /**
     * Upsert the calling device so it can be targeted with FCM.
     *
     * @param  array<string,?string>  $device
     */
    public function syncDevice(User $user, array $device): void
    {
        $deviceNo = $device['device_no'] ?? null;
        if (! $deviceNo) {
            return;
        }

        $user->devices()->updateOrCreate(
            ['device_no' => $deviceNo],
            [
                'os_type' => $device['os_type'] ?? null,
                'device_name' => $device['device_name'] ?? null,
                'os_version' => $device['os_version'] ?? null,
                'app_version' => $device['app_version'] ?? null,
                'notification_token' => $device['notification_token'] ?? null,
            ],
        );
    }
}
