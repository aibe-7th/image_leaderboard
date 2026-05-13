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

        console.log("전송할 데이터 확인:", { 
            name: nameValue, 
            challenge_id: challengeId, 
            prompt: promptValue,
            hasFile: !!(imageInput && imageInput.files && imageInput.files[0])
        });

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
            
            if (window.loadLeaderboard) {
                await window.loadLeaderboard();
            }
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

// 페이지 로드 시 sessionStorage에서 이름 가져와 기본값으로 설정
const savedName = sessionStorage.getItem("savedName");
if (savedName) {
    const nameInput = document.getElementById("name");
    if (nameInput) {
        nameInput.value = savedName;
    }
}
