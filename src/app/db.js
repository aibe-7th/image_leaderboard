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

export async function getLeaderboardData(sortBy) {
    const { data, error, count } = await supabase
        .from("leaderboard")
        .select("*", { count: "exact" })
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

export async function checkDuplicatePrompt(prompt) {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("id")
        .eq("prompt", prompt)
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

// 현재 활성화된 챌린지 조회
export async function getActiveChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from("challenge")
        .select("*")
        .eq("show_yn", "Y")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    return { data, error };
}

