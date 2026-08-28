<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrecompressResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $acceptEncoding = $request->header('Accept-Encoding', '');

        $content = $response->getContent();
        if ($content === null || strlen($content) < 256) {
            return $response;
        }

        $encoding = null;
        $compressed = null;

        if (str_contains($acceptEncoding, 'br') && function_exists('brotli_compress')) {
            $compressed = brotli_compress($content, 6, BROTLI_TEXT);
            if ($compressed !== false) {
                $encoding = 'br';
            }
        }

        if ($encoding === null && str_contains($acceptEncoding, 'gzip') && function_exists('gzencode')) {
            $compressed = gzencode($content, 6);
            if ($compressed !== false) {
                $encoding = 'gzip';
            }
        }

        if ($encoding !== null && $compressed !== false && strlen($compressed) < strlen($content)) {
            $response->setContent($compressed);
            $response->headers->set('Content-Encoding', $encoding);
            $response->headers->set('Content-Length', (string) strlen($compressed));
            $response->headers->remove('Vary');
            $response->headers->set('Vary', 'Accept-Encoding');
        }

        return $response;
    }
}
