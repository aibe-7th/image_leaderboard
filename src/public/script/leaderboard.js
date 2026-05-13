const challengeList = document.getElementById("challengeList");
const challengeSelect = document.getElementById("challenge_id");

// 챌린지 및 리더보드 로드
async function loadChallengesAndBoards() {
    try {
        const response = await axios.get("/api/challenge");
        const challenges = response.data.challenges;

        if (!challenges || challenges.length === 0) {
            challengeList.innerHTML = '<div class="col-12 text-center py-5 text-secondary">현재 진행 중인 챌린지가 없습니다.</div>';
            return;
        }

        // 제출 폼 셀렉박스 채우기
        challengeSelect.innerHTML = '<option value="">챌린지를 선택하세요</option>' + 
            challenges.map(c => `<option value="${c.id}">${c.prompt.substring(0, 20)}...</option>`).join("");

        // 챌린지 섹션 생성
        challengeList.innerHTML = "";
        for (const challenge of challenges) {
            const section = document.createElement("div");
            section.className = "col-12 mb-5 fade-in";
            section.innerHTML = `
                <div class="challenge-card">
                    <div class="row g-0">
                        <div class="col-lg-5 bg-black d-flex align-items-center justify-content-center border-end border-secondary border-opacity-25 p-3">
                            <img src="/api/image/${challenge.result_image}" class="img-fluid rounded-3 shadow" style="max-height: 400px;" alt="Challenge Image">
                        </div>
                        <div class="col-lg-7 p-4 p-md-5">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3 class="h4 text-info fw-bold mb-0">챌린지 #${challenge.id}</h3>
                                <span class="badge bg-info text-white">진행 중</span>
                            </div>
                            <p class="text-secondary mb-4">이미지를 보고 가장 유사한 프롬프트를 맞춰보세요. (기간: ${challenge.start_date} ~ ${challenge.end_date})</p>
                            
                            <div class="table-responsive">
                                <table class="table table-dark table-hover align-middle leaderboard-table border-secondary border-opacity-25">
                                    <thead>
                                        <tr class="text-secondary small">
                                            <th>순위</th>
                                            <th>이름</th>
                                            <th>유사도</th>
                                            <th>일자</th>
                                        </tr>
                                    </thead>
                                    <tbody id="board-${challenge.id}">
                                        <tr><td colspan="4" class="text-center py-3 small opacity-50">데이터 로드 중...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            challengeList.appendChild(section);
            
            // 각 챌린지별 리더보드 로드
            loadLeaderboardForChallenge(challenge.id);
        }
    } catch (error) {
        console.error("챌린지 로드 실패:", error);
        challengeList.innerHTML = '<div class="col-12 text-center py-5 text-danger">정보를 불러오지 못했습니다.</div>';
    }
}

async function loadLeaderboardForChallenge(challengeId) {
    const boardBody = document.getElementById(`board-${challengeId}`);
    try {
        const response = await axios.get(`/api/leaderboard?challenge_id=${challengeId}&sort=prompt&page=1`);
        const { data } = response.data;

        if (!data || data.length === 0) {
            boardBody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-secondary small">첫 번째로 도전해보세요!</td></tr>';
            return;
        }

        boardBody.innerHTML = data.map((r, i) => `
            <tr>
                <td class="fw-bold text-warning">${i + 1}</td>
                <td>
                    <span class="d-block text-white">${r.name}</span>
                    <small class="text-secondary" style="font-size: 0.7rem;">${r.ip || "-"}</small>
                </td>
                <td class="text-info fw-bold">${r.prompt_score}</td>
                <td class="text-secondary" style="font-size: 0.75rem;">${new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error(`리더보드 #${challengeId} 로드 실패:`, error);
        boardBody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger small">조회 실패</td></tr>';
    }
}

// 초기 로드
loadChallengesAndBoards();
