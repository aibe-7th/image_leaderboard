const form = document.getElementById("submitForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const loadingOverlay = document.getElementById("loadingOverlay");

// 폼 제출
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) {
            statusEl.textContent = "";
            statusEl.className = "mt-3 text-center fw-semibold"; // Reset classes
        }

    const nameValue = document.getElementById("name").value.trim();
    sessionStorage.setItem("savedName", nameValue);

    const formData = new FormData();
    formData.append("name", nameValue);
    formData.append("image_file", document.getElementById("image_file").files[0]);
    formData.append("prompt", document.getElementById("prompt").value.trim());

    if (loadingOverlay) loadingOverlay.classList.remove("d-none");

    try {
        // API 요청과 최소 3초 대기를 동시에 실행 (스피너 최소 3초 노출 보장)
        const [response] = await Promise.all([
            axios.post("/api/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        
        if (statusEl) {
            statusEl.textContent = "✅ 제출 완료!";
            statusEl.classList.add("text-success");
        }
        form.reset();
        
        const nameInput = document.getElementById("name");
        if (nameInput && sessionStorage.getItem("savedName")) {
            nameInput.value = sessionStorage.getItem("savedName");
        }
        
        if (window.loadLeaderboard) {
            await window.loadLeaderboard();
        }
    } catch (error) {
        console.error("제출 실패:", error);
        const errorMsg = error.response?.data?.error || "제출 실패";
        if (statusEl) {
            statusEl.textContent = `❌ ${errorMsg}`;
            statusEl.classList.add("text-danger");
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (loadingOverlay) loadingOverlay.classList.add("d-none");
    }
});
}

// 페이지 로드 시 sessionStorage에서 이름 가져와 기본값으로 설정
const savedName = sessionStorage.getItem("savedName");
if (savedName) {
    const nameInput = document.getElementById("name");
    if (nameInput) {
        nameInput.value = savedName;
    }
}
