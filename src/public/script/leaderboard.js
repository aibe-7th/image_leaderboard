const boardBody = document.getElementById("boardBody");

let currentSort = "latest"; // 기본 정렬 기준

const sortLatestBtn = document.getElementById("sortLatestBtn");
const sortPromptBtn = document.getElementById("sortPromptBtn");
const sortImageBtn = document.getElementById("sortImageBtn");
const sortTotalBtn = document.getElementById("sortTotalBtn");

sortLatestBtn.addEventListener("click", () => {
    currentSort = "latest";
    window.loadLeaderboard();
});

sortPromptBtn.addEventListener("click", () => {
    currentSort = "prompt";
    window.loadLeaderboard();
});

sortImageBtn.addEventListener("click", () => {
    currentSort = "image";
    window.loadLeaderboard();
});

sortTotalBtn.addEventListener("click", () => {
    currentSort = "total";
    window.loadLeaderboard();
});

// 리더보드 로드
window.loadLeaderboard = async function() {
    try {
        const response = await axios.get(`/api/leaderboard?sort=${currentSort}`);
        const rows = response.data;
        
        sortLatestBtn.className = currentSort === "latest" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        sortPromptBtn.className = currentSort === "prompt" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        sortImageBtn.className = currentSort === "image" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        sortTotalBtn.className = currentSort === "total" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        
        if (!Array.isArray(rows) || rows.length === 0) {
            boardBody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary py-3">아직 데이터가 없습니다.</td></tr>`;
            return;
        }
        
        boardBody.innerHTML = rows.map((r, i) => {
            const dateObj = new Date(r.created_at);
            const formattedDate = dateObj.toLocaleString('ko-KR', { 
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            return `
            <tr>
                <td class="fw-bold text-warning">${i + 1}</td>
                <td>${r.name}</td>
                <td class="text-secondary" style="font-size: 0.85rem;">${r.ip || "-"}</td>
                <td>
                    <a href="/api/image/${r.image_name}" target="_blank">
                        <img src="/api/image/${r.image_name}" alt="미리보기" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;" class="border border-secondary" />
                    </a>
                </td>
                <td style="max-width:200px; word-break:break-word;">${r.prompt}</td>
                <td>${r.prompt_score}</td>
                <td>${r.image_score}</td>
                <td><span class="text-info fw-bold">${(Number(r.prompt_score) + Number(r.image_score)).toFixed(2)}</span></td>
                <td>${formattedDate}</td>
            </tr>
        `}).join("");
    } catch (error) {
        console.error("리더보드 로드 실패:", error);
        boardBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-3">조회 실패</td></tr>`;
    }
};

// 오늘의 챌린지 정보 로드
async function loadChallenge() {
    try {
        const response = await axios.get("/api/challenge");
        const { todayImage } = response.data;
        
        if (todayImage) {
            const challengeSection = document.getElementById("challengeSection");
            const challengeImage = document.getElementById("challengeImage");
            
            challengeImage.src = `/api/image/${todayImage}`;
            challengeSection.style.display = "flex";
        }
    } catch (error) {
        console.error("챌린지 로드 실패:", error);
    }
}

// 초기 로드
loadChallenge();
window.loadLeaderboard();
