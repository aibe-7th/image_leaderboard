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
