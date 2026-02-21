export const state = {
    supabase: null,
    userProfile: null,
    chatHistory: [],
    isRecoveringPassword: false,
    blogLibrary: [],
    lastCronicaTime: null,
    dtvSessions: 0,
    vocalAnalytics: null
};

export function updateState(updates) {
    Object.assign(state, updates);
}
