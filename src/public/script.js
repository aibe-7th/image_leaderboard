const form = document.getElementById("submitForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const boardBody = document.getElementById("boardBody");

// 리더보드 로드
async function loadLeaderboard() {
    try {
        const response = await axios.get("/api/leaderboard");
        const rows = response.data;
        
        if (!Array.isArray(rows) || rows.length === 0) {
            boardBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-3">아직 데이터가 없습니다.</td></tr>`;
            return;
        }
        
        boardBody.innerHTML = rows.map((r, i) => `
            <tr>
                <td class="fw-bold text-warning">${i + 1}</td>
                <td>${r.name}</td>
                <td style="max-width:200px; word-break:break-word;">${r.prompt}</td>
                <td>${r.prompt_score}</td>
                <td>${r.image_score}</td>
                <td>${r.created_at}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("리더보드 로드 실패:", error);
        boardBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">조회 실패</td></tr>`;
    }
}

// 폼 제출
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    statusEl.textContent = "";
    statusEl.className = "mt-3 text-center fw-semibold"; // Reset classes

    const payload = {
        name: document.getElementById("name").value.trim(),
        prompt: document.getElementById("prompt").value.trim(),
        prompt_score: parseFloat(document.getElementById("prompt_score").value),
        image_score: parseFloat(document.getElementById("image_score").value),
    };

    try {
        const response = await axios.post("/api/submit", payload);
        
        statusEl.textContent = "✅ 제출 완료!";
        statusEl.classList.add("text-success");
        form.reset();
        await loadLeaderboard();
    } catch (error) {
        console.error("제출 실패:", error);
        const errorMsg = error.response?.data?.error || "제출 실패";
        statusEl.textContent = `❌ ${errorMsg}`;
        statusEl.classList.add("text-danger");
    } finally {
        submitBtn.disabled = false;
    }
});

// 초기 로드
loadLeaderboard();
