const form = document.getElementById("submitForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const boardBody = document.getElementById("boardBody");
const loadingOverlay = document.getElementById("loadingOverlay");

let currentSort = "image"; // 기본 정렬 기준

const sortPromptBtn = document.getElementById("sortPromptBtn");
const sortImageBtn = document.getElementById("sortImageBtn");

sortPromptBtn.addEventListener("click", () => {
    currentSort = "prompt";
    loadLeaderboard();
});

sortImageBtn.addEventListener("click", () => {
    currentSort = "image";
    loadLeaderboard();
});

// 리더보드 로드
async function loadLeaderboard() {
    try {
        const response = await axios.get(`/api/leaderboard?sort=${currentSort}`);
        const rows = response.data;
        
        if (currentSort === "prompt") {
            sortPromptBtn.className = "btn btn-info btn-sm text-white fw-bold";
            sortImageBtn.className = "btn btn-outline-info btn-sm";
        } else {
            sortImageBtn.className = "btn btn-info btn-sm text-white fw-bold";
            sortPromptBtn.className = "btn btn-outline-info btn-sm";
        }
        
        if (!Array.isArray(rows) || rows.length === 0) {
            boardBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-3">아직 데이터가 없습니다.</td></tr>`;
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
                <td>${r.image_name}</td>
                <td style="max-width:200px; word-break:break-word;">${r.prompt}</td>
                <td>${r.prompt_score}</td>
                <td>${r.image_score}</td>
                <td>${formattedDate}</td>
            </tr>
        `}).join("");
    } catch (error) {
        console.error("리더보드 로드 실패:", error);
        boardBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">조회 실패</td></tr>`;
    }
}

// 폼 제출
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    statusEl.textContent = "";
    statusEl.className = "mt-3 text-center fw-semibold"; // Reset classes

    const nameValue = document.getElementById("name").value.trim();
    sessionStorage.setItem("savedName", nameValue);

    const formData = new FormData();
    formData.append("name", nameValue);
    formData.append("image_file", document.getElementById("image_file").files[0]);
    formData.append("prompt", document.getElementById("prompt").value.trim());

    loadingOverlay.classList.remove("d-none");

    try {
        // API 요청과 최소 3초 대기를 동시에 실행 (스피너 최소 3초 노출 보장)
        const [response] = await Promise.all([
            axios.post("/api/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        
        statusEl.textContent = "✅ 제출 완료!";
        statusEl.classList.add("text-success");
        form.reset();
        
        // 폼 리셋 후 저장된 이름 다시 세팅
        if (sessionStorage.getItem("savedName")) {
            document.getElementById("name").value = sessionStorage.getItem("savedName");
        }
        
        await loadLeaderboard();
    } catch (error) {
        console.error("제출 실패:", error);
        const errorMsg = error.response?.data?.error || "제출 실패";
        statusEl.textContent = `❌ ${errorMsg}`;
        statusEl.classList.add("text-danger");
    } finally {
        submitBtn.disabled = false;
        loadingOverlay.classList.add("d-none");
    }
});

// 페이지 로드 시 sessionStorage에서 이름 가져와 기본값으로 설정
const savedName = sessionStorage.getItem("savedName");
if (savedName) {
    document.getElementById("name").value = savedName;
}

// 초기 로드
loadLeaderboard();
