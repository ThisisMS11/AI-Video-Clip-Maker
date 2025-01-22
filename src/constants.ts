export const STATUS_MAP = {
    DEFAULT: 'default',
    PROCESSING: 'processing',
    UPLOADING: 'uploading',
    SUCCEEDED: 'succeeded',
    ERROR: 'error',
    FAILED: 'failed',
} as const;

export const RETRIES = {
    MONGO_DB_SERVICE: 5,
    REPLICATE_SERVICE: 3,
    CLOUDINARY_SERVICE: 5,
} as const;

export const MEDIA_TYPE = {
    ORIGINAL: 'original',
    PROCESSED: 'processed',
} as const;

export const CLOUDINARY_FOLDER = {
    ORIGINAL: 'task_4_AI_Generated_Clips_Original',
    CLIPPED: 'task_4_AI_Generated_Clips_Clipped_Videos',
} as const;

export const requiredEnvVars = [
    'NEXT_PUBLIC_REPLICATE_API_TOKEN',
    'WEBHOOK_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];

export const WAIT_TIMES = {
    CLOUDINARY_SERVICE: 5000,
    REPLICATE_SERVICE_RETRY: 5000,
    PREDICTION_SERVICE: 5000,
} as const;

export const SETTINGS_MAP = {
    LANG: 'lang',
    VIDEO_URL: 'videoUrl',
    EXT: 'ext',
    PREFER_LENGTH: 'preferLength',
    PROJECT_NAME: 'projectName',
    SUBTITLE_SWITCH: 'subtitleSwitch',
    HEADLINE_SWITCH: 'headlineSwitch',
    VIDEO_TYPE: 'videoType',
    MAX_CLIP_NUMBER: 'maxClipNumber',
    KEYWORDS: 'keywords',
    REMOVE_SILENCE_SWITCH: 'removeSilenceSwitch',
} as const;

export const LANGUAGE_MAP = {
    English: 'en',
    'Arabic (عربي)': 'ar',
    'Bulgarian (български)': 'bg',
    'Croatian (Hrvatski)': 'hr',
    'Czech (čeština)': 'cs',
    'Danish (Dansk)': 'da',
    'Dutch (Nederlands)': 'nl',
    'Finnish (Suomi)': 'fi',
    'French (Français)': 'fr',
    'German (Deutsch)': 'de',
    'Greek(Ελληνικά)': 'el',
    'Hebrew (עִברִית)': 'iw',
    'Hindi (हिंदी)': 'hi',
    'Hungarian (Magyar nyelv)': 'hu',
    'Indonesian (Bahasa Indonesia)': 'id',
    'Italian (Italiano)': 'it',
    'Japanese (日本語)': 'ja',
    'Korean (한국어)': 'ko',
    'Lithuanian (Lietuvių kalba)': 'lt',
    'Malay (Melayu)': 'mal',
    'Mandarin - Simplified (普通话-简体)': 'zh',
    'Mandarin - Traditional (國語-繁體)': 'zh-TW',
    'Norwegian (Norsk)': 'no',
    'Polish (Polski)': 'pl',
    'Portuguese (Português)': 'pt',
    'Romanian (Limba română)': 'ro',
    'Russian (Pусский)': 'ru',
    'Serbian (Српски)': 'sr',
    'Slovak (Slovenský)': 'sk',
    'Spanish (Español)': 'es',
    'Swedish (Svenska)': 'sv',
    'Turkish (Türkçe)': 'tr',
    'Ukrainian (Україна)': 'uk',
    'Vietnamese (Tiếng Việt)': 'vi',
} as const;

export const sampleHistoryOutput = [
    {
        _id: '64abc123def456ghijkl7890',
        project_name: 'Test Project',
        project_id: 101,
        status: 'succeeded',
        settings: {
            ext: 'mp4',
            video_url: 'https://cdn-docs.vizard.ai/sample.mp4',
            video_type: 1,
            language: 'en',
            prefer_length: 30,
            subtitle_switch: 1,
            headline_switch: 1,
            max_clip_number: 10,
            keywords: 'AI, testing, demo',
            remove_silence_switch: 0,
        },
        output: [
            {
                viral_score: '10',
                related_topic: '[]',
                transcript:
                    "Start talking to customers. If you don't have customers yet, start by talking to people who have this problem and figure out why is this a problem for them? What are they struggling with? Get their thought process. When they run into an obstacle where they need to create a screen recording, what were the events that led up to them wanting to create that screen recording? And then we keep coming back to this idea of a pathway. What should they be able to do as a result of that screen recording? So talking to people and finding out what that problem is and using that to identify what that first topic is going to be. And you might write down a bunch of different topics, which is good. But ultimately, the next step with ideation is that you want to select one single topic. Every single video you should come up with should have one job to do, and it's to answer that question. We start out what we call the foundation. There's three questions in there, but for now, let's just pick two. So the main two question is, who is your audience? Who is this video for? And then what is the outcome of the video? What should somebody be able to do or do after watching the video? And an emphasis on the do because I believe that the reason you're creating videos for marketing is to drive some action. The same with learning. If people learn something and it's just a nugget of knowledge that sticks in their head, that doesn't really matter to me unless I can actually see them do something in the real world. So with ideation, what you want to nail down is those two things. Identify who the person is that you're talking to. What is the thing that they're trying to do? And then if they were to come to your video, what is the outcome of that? What will they actually do as a result of your watching your video? So once you do that, you start to create a scope for your video.",
                video_url:
                    'https://cdn-video.vizard.ai/vizard/video/export/20250122/11869633-08cf6961a7e34cf8a8a90ecea1518403.mp4?Expires=1738171981&Signature=B6QTr1T3EI4adtcZedvbGzcdz9qpw2IrqNdKRf-Flfp-nLbHO9-cFlnQ3~UI~Fs6LuhcmjpkN0nZIKRbRoqWAR09bKDz8MePeQG1hNYV1NbOnfpaaEPSi6AFmNdSTfuHUhH~66FlJ~3WV33vUl5M6v9M334nCBGbPDrSvBtxRWDEEjiNKzKq447rV3aXPoNwZwQGKp0w1~TKZYEV7TTCm4twifXwQJ1sNK273DTR6l2DQBNT2n8e3H34AKkJSa6sjeA3RFOTltlRCJAlAghlMYbcbFgUGh~0ptg4XMwzwqvG2cEzuEm8M6WeuwiWd-kc5FoehKjqSVtTnngb0AIOOw__&Key-Pair-Id=K1STSG6HQYFY8F',
                video_ms_duration: 53875,
                video_id: 11869633,
                title: 'Unlock the Power of Customer Insights for Effective Videos',
                viral_reason:
                    'The clip provides actionable advice on creating impactful videos by understanding customer needs, which is valuable and relatable content for creators and marketers alike.',
            },
            {
                viral_score: '9',
                related_topic: '["video ideation","audience","outcome"]',
                transcript:
                    "So the main two question is, who is your audience? Who is this video for? And then what is the outcome of the video? What should somebody be able to do or do after watching the video? And an emphasis on the do because I believe that the reason you're creating videos for marketing is to drive some action. The same with learning. If people learn something and it's just a nugget of knowledge that sticks in their head, that doesn't really matter to me unless I can actually see them do something in the real world. So with ideation, what you want to nail down is those two things. Identify who the person is that you're talking to.",
                video_url:
                    'https://cdn-video.vizard.ai/vizard/video/export/20250122/11869632-332db3728fc7474e8f05a96092f52424.mp4?Expires=1738171981&Signature=r0BsjVuwyhR-14exbK7OlbOf15tcdJkaCg6EJT8O5wg7SulhR1enDKwHod2vM8FwsjMYQUkkm0gxhg0aM8mQUdBSa6E3pOh9WepZZEhFMwDFml6eeKdJHcWeUQ0bsxcIIohyvTTSPKc9jVmMxGRwsHYEYvN10VH4Ij4qFtegOrdOlg~reS2-YGl0XbPsD9l6Ft7BBtfwK0AaI~Z4mS992z2pbG2MS06GQ-9oRJmmK1-V29lKTc5EMWLjglktFZduZb6yQ-iML5m-558Z8LhUGnC9VCqQg-e-2Y-cAnRIL1LRm6Mz4YtmmFxjaVUGjllP8CaAL5kPWpBEINTef7jGAQ__&Key-Pair-Id=K1STSG6HQYFY8F',
                video_ms_duration: 33791,
                video_id: 11869632,
                title: "Nail Your Video's Audience and Outcome",
                viral_reason:
                    'The focus on defining audience and outcomes is crucial for content creators, making this clip highly relatable and actionable.',
            },
            {
                viral_score: '8.8',
                related_topic: '["SEO","search data","video ideas"]',
                transcript:
                    "You mentioned that you would look at what people are searching. Do you do that qualitatively or is there like a database or... some type of analytics where you can dig into that search data? Yeah, so that's a good question. So I work a lot with my SEO team member who has a lot of apps and tools. They send me some ideas in that way. But what I do is if I talk to a person who says, I struggle with how to make a training video, for example, that's something that's very relevant for our audience.",
                video_url:
                    'https://cdn-video.vizard.ai/vizard/video/export/20250122/11869631-137061760e4a4c74a6c845230c63a6ab.mp4?Expires=1738171981&Signature=lQGn6dY0-z0b1CXYHJg~-G-jW2mKb3dQ4eEtxSlIBrD2FROZcMUhwxM9sIslWFSNdzbB9NRfzSzWy2xJ1JdKGn19pKUxrl-m46gjVvVqP~DrQldDTXtZgjym0QMG5fwN7dizTXvba6iH7-LUgcSUoWgw4EbtQtpOWDeX2~OJOvtwn8YABPqK2RPXkcOl5Jb0RxaHOMOOcL2p0F~8MgyXSyzcEZGY93sXPBQH8BCSQKLwO-nMfI2lZTrbWEdnWlWHV1f9lkr75oGfQMzjIV-FGTlHZ9YEjJBiS4kNk0SvCSKqVW2BAeMYtBF0FDslER474iryVmHTJwEArU3itnju2w__&Key-Pair-Id=K1STSG6HQYFY8F',
                video_ms_duration: 35333,
                video_id: 11869631,
                title: 'Leverage SEO for Video Ideas',
                viral_reason:
                    'This clip discusses the integration of SEO in video creation, which is a hot topic for creators looking to optimize their content.',
            },
            {
                viral_score: '8.5',
                related_topic:
                    '["customer feedback","problem solving","video creation"]',
                transcript:
                    "Start talking to customers. If you don't have customers yet, start by talking to people who have this problem and figure out why is this a problem for them? What are they struggling with? Get their thought process. When they run into an obstacle where they need to create a screen recording, what were the events that led up to them wanting to create that screen recording? And then we keep coming back to this idea of a pathway. What should they be able to do as a result of that screen recording? So talking to people and finding out...",
                video_url:
                    'https://cdn-video.vizard.ai/vizard/video/export/20250122/11869630-7aa88d3f03c14bf58a12e3ccef7f0df2.mp4?Expires=1738171981&Signature=ejBAbbJXG-WKOjm0U-dCiI~TVAc8i9Wvm5VuOMbDBiCfyENNpjR4ehQmcxXkWuxeVulLwrVtIXN9iQgcsmrPIdVOjM5bxM6rMu5db5FdJMlyXFl2rBLP2RmNomr71mIwsGKsidcmqGWCJJH4dhcJ6xSDb1ZMHoqa1JY5bp~23N0NsNgGWyAw6-kVZs41qHSPzNdGQuAKMtdw9lkEFXJH-WyChMB7u54V16MvGDDjkjSYsRURhb-nT62ziQyOM6Vu3~dFEAEKfTLfFSm8PkskzTrzJW9nb5nvHlkupUN5LVEvv1Jmu3QNqTWNPDrzLrntzUsrLbVroS4uY0SG-2EZgQ__&Key-Pair-Id=K1STSG6HQYFY8F',
                video_ms_duration: 28416,
                video_id: 11869630,
                title: 'Unlocking Customer Insights for Better Videos',
                viral_reason:
                    'This clip emphasizes the importance of understanding customer pain points, which resonates with many creators and entrepreneurs.',
            },
            {
                viral_score: '8',
                related_topic: '["video scope","content creation","focus"]',
                transcript:
                    "Once you have those two places, you're ready to start thinking about the next step of creating a video. So that's where ideation starts. The beginning and the audience and the outcome. You nail those two down and figure out what that job is to be done. You mentioned that you would look at what people are searching.",
                video_url:
                    'https://cdn-video.vizard.ai/vizard/video/export/20250122/11869629-58073535b1b64c01a81796d915999da9.mp4?Expires=1738171981&Signature=A1IQrtYF~Jc2CvpSM8HS2OZF8g3epqm8OVRfiVXL6damI44EORJj0ICDICvcdsZ5mk-hZF0Fb3PfiGYamgT3EOR5I6lzyg0aanjOFKVccQ7-hFKjmrlXAL-aAitTNkQt~RBcpa1dKEPLQBM9mGjdXavMDrLvcDgC1DJf~aVver2E7xJEXiJTDfQRfd7dFD4QH4pRkUOqvhvK-RYKtwH1GEfqfotYNoqDNqi5Q4VjriLrBtzdsXMLaPWCWwdjCPUKd~f9m~82eInZmzla2MNkPCB~N09KaW-MZ9laO6x3GX8JPUpFGZipzg2Sp8fVuVKTzM4hRcP~lygWTgUKmC9Akg__&Key-Pair-Id=K1STSG6HQYFY8F',
                video_ms_duration: 17916,
                video_id: 11869629,
                title: 'Create a Clear Scope for Your Videos',
                viral_reason:
                    'The concept of creating a scope for videos helps creators stay focused, making this clip valuable for anyone in content creation.',
            },
        ],
    },
];
