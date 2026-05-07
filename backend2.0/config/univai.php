<?php

return [
    'brand' => [
        'name' => env('UNIVAI_BRAND_NAME', 'UnivAI'),
        'legal_name' => env('UNIVAI_LEGAL_NAME', 'UnivAI University'),
        'tagline' => env('UNIVAI_TAGLINE', 'AI-powered higher education for every learner'),
        'support_email' => env('UNIVAI_SUPPORT_EMAIL', 'support@univai.edu'),
        'admissions_email' => env('UNIVAI_ADMISSIONS_EMAIL', 'admissions@univai.edu'),
        'public_url' => env('FRONTEND_URL', env('APP_URL', 'https://univai.edu')),
        'primary_color' => env('UNIVAI_PRIMARY_COLOR', '#2563eb'),
        'secondary_color' => env('UNIVAI_SECONDARY_COLOR', '#0f172a'),
    ],


    'version' => [
        'label' => env('UNIVAI_VERSION_LABEL', 'v1'),
        'launch_profile' => env('UNIVAI_LAUNCH_PROFILE', 'university-plus-short-courses'),
        'release_state' => env('UNIVAI_RELEASE_STATE', 'launch-ready'),
    ],

    'ops' => [
        'demo_incidents' => filter_var(env('UNIVAI_DEMO_INCIDENTS', false), FILTER_VALIDATE_BOOLEAN),
    ],

    'capacity' => [
        'target_registered_users' => (int) env('UNIVAI_TARGET_REGISTERED_USERS', 10000),
        'target_concurrent_users' => (int) env('UNIVAI_TARGET_CONCURRENT_USERS', 1000),
        'public_cache_seconds' => (int) env('UNIVAI_PUBLIC_CACHE_SECONDS', 300),
    ],

    'ai' => [
        'public_content_disclaimer' => env(
            'UNIVAI_AI_PUBLIC_CONTENT_DISCLAIMER',
            'AI-assisted draft. A UnivAI staff member must review and approve before public release.'
        ),
        'brand_guardrails' => [
            'Use the UnivAI name exactly as configured.',
            'Keep public-facing copy professional, inclusive, accessible, and student-safe.',
            'Never invent accreditation, licensing, tuition, dates, policies, or guarantees that are not provided in context.',
            'Mark formal programme content, admissions letters, certificate text, policy text, and public notices as review-required drafts.',
            'Include practical next steps and a support contact for public communications.',
        ],
    ],
];
