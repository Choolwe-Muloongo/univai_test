<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RemoveLegacyLearningStyle
{
    public function handle(Request $request, Closure $next)
    {
        $request->request->remove('learningStyle');
        $request->request->remove('learning_style');

        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $data = $response->getData(true);
            $response->setData($this->removeKeys($data));
        }

        return $response;
    }

    private function removeKeys(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        unset($value['learningStyle'], $value['learning_style']);

        foreach ($value as $key => $child) {
            $value[$key] = $this->removeKeys($child);
        }

        return $value;
    }
}
