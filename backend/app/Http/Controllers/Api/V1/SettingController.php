<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Setting;

class SettingController extends ApiController
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key');

        return $this->successResponse($settings, 'Settings fetched');
    }
}
