const form = document.getElementById("submitForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const loadingOverlay = document.getElementById("loadingOverlay");
const leaderboardBody = document.getElementById("leaderboardBody");

// 리더보드 페칭 로드 함수
async function loadLeaderboard() {
    const challengeIdInput = document.getElementById("challenge_id");
    const challengeId = challengeIdInput ? challengeIdInput.value : null;
    
    if (!challengeId || !leaderboardBody) return;

    try {
        const response = await axios.get(`/api/leaderboard?challenge_id=${challengeId}&sort=prompt_score`);
        const { data } = response.data;

        if (!data || data.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-secondary small">아직 도전자가 없습니다. <br> 첫 번째 주인공이 되어보세요!</td></tr>';
            return;
        }

        leaderboardBody.innerHTML = data.map((r, i) => `
            <tr>
                <td class="fw-bold text-warning">${i + 1}</td>
                <td>
                    <span class="d-block text-white">${r.name}</span>
                    <small class="text-secondary opacity-75">${r.ip || "-"}</small>
                </td>
                <td class="text-info fw-bold">${r.prompt_score}</td>
                <td>
                    <a href="/api/image/${r.image_name}" target="_blank">
                        <img src="/api/image/${r.image_name}" class="rank-thumb rounded shadow-sm" alt="Result">
                    </a>
                </td>
                <td class="text-secondary opacity-75 small">${new Date(r.created_at).toLocaleString()}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("리더보드 로드 실패:", error);
    }
}

// 폼 제출
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) {
            statusEl.textContent = "";
            statusEl.className = "mt-3 text-center fw-semibold"; 
        }

        const nameInput = document.getElementById("name");
        const nameValue = nameInput ? nameInput.value.trim() : "";
        if (nameValue) sessionStorage.setItem("savedName", nameValue);

        const challengeIdInput = document.getElementById("challenge_id");
        const challengeId = challengeIdInput ? challengeIdInput.value : null;

        if (!challengeId) {
            alert("챌린지 ID를 찾을 수 없습니다.");
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const formData = new FormData();
        formData.append("name", nameValue);
        formData.append("challenge_id", challengeId);
        
        const imageInput = document.getElementById("image_file");
        if (imageInput && imageInput.files && imageInput.files[0]) {
            formData.append("image_file", imageInput.files[0]);
        }
        
        const promptInput = document.getElementById("prompt");
        const promptValue = promptInput ? promptInput.value.trim() : "";
        formData.append("prompt", promptValue);

        if (loadingOverlay && loadingOverlay.classList) {
            loadingOverlay.classList.remove("d-none");
        }

        try {
            const [response] = await Promise.all([
                axios.post("/api/submit", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                }),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            
            if (statusEl) {
                statusEl.textContent = "✅ 제출 완료!";
                if (statusEl.classList) statusEl.classList.add("text-success");
            }
            form.reset();
            
            const nameInputRef = document.getElementById("name");
            if (nameInputRef && sessionStorage.getItem("savedName")) {
                nameInputRef.value = sessionStorage.getItem("savedName");
            }
            
            // 랭킹 즉시 업데이트 (페칭 방식)
            await loadLeaderboard();
            
        } catch (error) {
            console.error("제출 실패:", error);
            const errorMsg = error.response?.data?.error || "제출 실패";
            if (statusEl) {
                statusEl.textContent = `❌ ${errorMsg}`;
                if (statusEl.classList) statusEl.classList.add("text-danger");
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (loadingOverlay && loadingOverlay.classList) {
                loadingOverlay.classList.add("d-none");
            }
        }
    });
}

// 전역 함수로 등록 (필요시)
window.loadLeaderboard = loadLeaderboard;

// 페이지 로드 시 sessionStorage에서 이름 가져와 기본값으로 설정
const savedName = sessionStorage.getItem("savedName");
if (savedName) {
    const nameInput = document.getElementById("name");
    if (nameInput) {
        nameInput.value = savedName;
    }
}
