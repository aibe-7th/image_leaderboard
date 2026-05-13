import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 (서버에서만 key 사용)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SK
);

export async function uploadImageToStorage(fileName, buffer) {
    const { data, error } = await supabase.storage
        .from("genai_image")
        .upload(fileName, buffer, {
            contentType: "image/webp"
        });
    return { data, error };
}

export async function insertLeaderboardData(payload) {
    const { data, error } = await supabase
        .from("leaderboard")
        .insert([payload])
        .select()
        .single();
    return { data, error };
}

export async function getLeaderboardData(sortBy, challengeId) {
    let query = supabase
        .from("leaderboard")
        .select("*", { count: "exact" });

    if (challengeId) {
        query = query.eq("challenge_id", challengeId);
    }

    const { data, error, count } = await query
        .order(sortBy, { ascending: false })
        .order("created_at", { ascending: false });
    return { data, error, count };
}

export async function getImageFromStorage(fileName) {
    const { data, error } = await supabase.storage
        .from("genai_image")
        .download(fileName);
    return { data, error };
}

export async function checkDuplicatePrompt(prompt, challengeId) {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("id")
        .eq("prompt", prompt)
        .eq("challenge_id", challengeId)
        .limit(1);
    return { exists: data && data.length > 0, error };
}

// 챌린지 정보 저장
export async function insertChallenge({ prompt, result_image, start_date, end_date, show_yn }) {
    const { data, error } = await supabase
        .from("challenge")
        .insert([{ prompt, result_image, start_date, end_date, show_yn }])
        .select();
    return { data, error };
}

// 현재 오픈 중인 모든 챌린지 조회 (보안을 위해 prompt 제외)
export async function getOpenChallenges() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from("challenge")
        .select("id, result_image, start_date, end_date, created_at")
        .eq("show_yn", "Y")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });
    return { data, error };
}

// 특정 챌린지 상세 조회 (보안을 위해 prompt 제외)
export async function getChallengeById(id) {
    const { data, error } = await supabase
        .from("challenge")
        .select("id, result_image, start_date, end_date, created_at")
        .eq("id", id)
        .single();
    return { data, error };
}

