const boardBody = document.getElementById("boardBody");

let currentSort = "latest"; // 기본 정렬 기준
let currentPage = 1; // 현재 페이지 상태

const pagination = document.getElementById("pagination");
const sortLatestBtn = document.getElementById("sortLatestBtn");
const sortPromptBtn = document.getElementById("sortPromptBtn");

sortLatestBtn.addEventListener("click", () => {
    currentSort = "latest";
    currentPage = 1; // 정렬 변경 시 1페이지로 리셋
    window.loadLeaderboard();
});

sortPromptBtn.addEventListener("click", () => {
    currentSort = "prompt";
    currentPage = 1;
    window.loadLeaderboard();
});

// 리더보드 로드
window.loadLeaderboard = async function() {
    try {
        const response = await axios.get(`/api/leaderboard?sort=${currentSort}&page=${currentPage}`);
        const { data, total, page, limit } = response.data;
        
        sortLatestBtn.className = currentSort === "latest" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        sortPromptBtn.className = currentSort === "prompt" ? "btn btn-info btn-sm text-white fw-bold" : "btn btn-outline-info btn-sm";
        
        if (!Array.isArray(data) || data.length === 0) {
            boardBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-3">아직 데이터가 없습니다.</td></tr>`;
            pagination.innerHTML = "";
            return;
        }
        
        boardBody.innerHTML = data.map((r, i) => {
            const rank = (page - 1) * limit + i + 1; // 순위 계산
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
                <td class="fw-bold text-warning">${rank}</td>
                <td>
                    ${r.name}<br>
                    <small class="text-secondary" style="font-size: 0.75rem;">${r.ip || "-"}</small>
                </td>
                <td>
                    <a href="/api/image/${r.image_name}" target="_blank">
                        <img src="/api/image/${r.image_name}" alt="미리보기" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;" class="border border-secondary" />
                    </a>
                </td>
                <td style="max-width:200px; word-break:break-word;">${r.prompt}</td>
                <td class="text-info fw-bold">${r.prompt_score}</td>
                <td>${formattedDate}</td>
            </tr>
        `}).join("");

        renderPagination(total, limit, page);
    } catch (error) {
        console.error("리더보드 로드 실패:", error);
        boardBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">조회 실패</td></tr>`;
        pagination.innerHTML = "";
    }
};

function renderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }

    let html = "";
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === current ? "btn-info text-white" : "btn-outline-info";
        html += `<button class="btn ${activeClass} btn-sm fw-bold" onclick="changePage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

window.changePage = (page) => {
    currentPage = page;
    window.loadLeaderboard();
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
