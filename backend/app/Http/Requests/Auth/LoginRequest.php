<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_no' => ['nullable', 'string', 'max:255'],
            'os_type' => ['nullable', 'string', 'max:30'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'os_version' => ['nullable', 'string', 'max:50'],
            'app_version' => ['nullable', 'string', 'max:50'],
            'notification_token' => ['nullable', 'string', 'max:512'],
        ];
    }

    /** @return array<string,?string> */
    public function deviceData(): array
    {
        return $this->only([
            'device_no', 'os_type', 'device_name', 'os_version', 'app_version', 'notification_token',
        ]);
    }
}
