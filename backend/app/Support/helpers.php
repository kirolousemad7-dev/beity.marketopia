<?php

if (! function_exists('generateSlug')) {
    function generateSlug(string $name): string
    {
        $name = strtolower($name);
        $name = preg_replace('/[^\p{L}\p{N}\s]+/u', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        $name = trim($name);
        $slug = str_replace(' ', '-', $name);
        return $slug;
    }
}
