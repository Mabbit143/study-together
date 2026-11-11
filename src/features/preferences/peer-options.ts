export const voices = ["alloy", "coral", "sage"] as const;
export const personalities = ["encouraging", "straightforward", "playful"] as const;
export const approaches = ["question-led", "example-led", "explain-then-practice"] as const;
export type VoiceId = typeof voices[number];
export type Personality = typeof personalities[number];
export type StudyApproach = typeof approaches[number];
