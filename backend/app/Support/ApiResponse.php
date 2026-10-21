<?php

namespace App\Support;

trait ApiResponse
{
    private function formatResponse($message, $data = null, $errors = null, $statusCode = 200, $meta = null)
    {
        $response = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'message' => $message,
        ];

        if ($statusCode >= 400 && $statusCode <= 599) {
            $response['errors'] = $errors;
        }
        else {
            $response['data'] = $data;
            if ($meta) {
                $response['meta'] = $meta;
            }
        }

        
        return response()->json($response, $statusCode);
    }

    protected function successResponse($data, $message = 'Success', $meta = null)
    {
        return $this->formatResponse($message, $data, null, 200, $meta);
    }

    protected function errorResponse($message, $errors = null, $statusCode = 400)
    {
        return $this->formatResponse($message, null, $errors, $statusCode);
    }

    protected function catchErrorResponse($message, $statusCode = 400)
    {
        return $this->formatResponse($message, null, null, $statusCode);
    }
}