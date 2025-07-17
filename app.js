document.addEventListener('DOMContentLoaded', function() {
    const gridForm = document.getElementById('gridForm');
    const gridDiv = document.getElementById('grid');
    const shapeTextInput = document.getElementById('shapeText');
    const generateShapeBtn = document.getElementById('generateShape');
    let rows = 16;
    let cols = 29;
    let dots = [];
    const recommendationDiv = document.getElementById('recommendation');

    function generateGrid() {
        gridDiv.innerHTML = '';
        dots = [];
        rows = parseInt(document.getElementById('rows').value);
        cols = parseInt(document.getElementById('cols').value);
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
        gridDiv.style.gridTemplateRows = `repeat(${rows}, 22px)`;
        let num = 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dot.textContent = num;
                dot.dataset.index = num;
                dot.dataset.row = r;
                dot.dataset.col = c;
                gridDiv.appendChild(dot);
                dots.push(dot);
                num++;
            }
        }
    }
    // Event delegation: semua titik bisa diedit dengan klik, termasuk hasil generate
    gridDiv.addEventListener('click', function(e) {
        if (e.target.classList.contains('dot')) {
            // Jika titik sudah merah (shape atau active), klik akan menghilangkan semua warna merah
            if (e.target.classList.contains('shape') || e.target.classList.contains('active')) {
                e.target.classList.remove('shape');
                e.target.classList.remove('active');
            } else {
                e.target.classList.add('active');
            }
        }
    });

    gridForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateGrid();
    });

    // Simple shape generator: maps text to grid (centered)
    function generateShape() {
        const text = shapeTextInput.value.trim();
        if (!text) return;
        // Clear previous shape, tapi biarkan titik yang diedit manual tetap merah
        dots.forEach(dot => {
            if (!dot.classList.contains('active')) {
                dot.classList.remove('shape');
            }
        });
        // Titik hasil formasi tetap bisa diedit (class 'active' tidak dihapus)
        // Use canvas to get pixel map of text
        const canvas = document.createElement('canvas');
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext('2d');
        // Cari font size optimal agar semua huruf muat di grid
        let fontSize = Math.floor(rows * 1.2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.clearRect(0,0,canvas.width,canvas.height);
        // Uji font size, turunkan jika terlalu lebar
        ctx.font = `${fontSize}px Arial`;
        let textWidth = ctx.measureText(text).width;
        let maxWidth = cols * 0.85; // padding horizontal agar proporsional
        while (textWidth > maxWidth && fontSize > 6) {
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
            textWidth = ctx.measureText(text).width;
        }
        // Center vertikal: ambil tinggi font dan posisikan di tengah grid
        let metrics = ctx.measureText(text);
        let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        let centerY = rows / 2 + actualHeight / 2 - metrics.actualBoundingBoxDescent;
        ctx.fillText(text, cols/2, centerY);
        const imgData = ctx.getImageData(0,0,cols,rows);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = (r*cols + c)*4;
                const alpha = imgData.data[idx+3];
                if (alpha > 128) {
                    const dotIdx = r*cols + c;
                    if (dots[dotIdx]) dots[dotIdx].classList.add('shape');
                }
            }
        }
    }

    // Fungsi rekomendasi jumlah kolom minimum
    function updateRecommendation() {
        const text = shapeTextInput.value.trim();
        let fontSize = Math.floor(rows * 1.2);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize}px Arial`;
        let textWidth = ctx.measureText(text).width;
        let textHeight = fontSize;
        // Rekomendasi horizontal
        let idealCols = Math.ceil(text.length * 22 * 1.1); // 1.1 untuk spasi antar huruf
        let minCols = Math.ceil(textWidth / 22);
        // Rekomendasi vertikal
        let minRows = Math.ceil(textHeight / 22);
        let idealRows = Math.ceil(textHeight * 1.5 / 22);
        let rekomendasi = [];
        if (text) {
            if (cols < minCols) {
                rekomendasi.push(`Warning: Baris ke samping (horizontal) terlalu sedikit, tulisan bisa terpotong. Rekomendasi minimal: ${minCols}. Ideal agar tulisan jelas: ${idealCols}.`);
            } else if (cols < idealCols) {
                rekomendasi.push(`Rekomendasi: Baris ke samping (horizontal) sebaiknya ${idealCols} agar tulisan muncul jelas dan proporsional.`);
            }
            if (rows < minRows) {
                rekomendasi.push(`Warning: Baris ke belakang (vertikal) terlalu sedikit, tulisan bisa terpotong. Rekomendasi minimal: ${minRows}. Ideal agar proporsional: ${idealRows}.`);
            } else if (rows < idealRows) {
                rekomendasi.push(`Rekomendasi: Baris ke belakang (vertikal) sebaiknya ${idealRows} agar tulisan proporsional.`);
            }
            recommendationDiv.textContent = rekomendasi.join(' ');
        } else {
            recommendationDiv.textContent = '';
        }
    }

    shapeTextInput.addEventListener('input', updateRecommendation);
    document.getElementById('cols').addEventListener('input', updateRecommendation);
    document.getElementById('rows').addEventListener('input', updateRecommendation);

    // Tombol generate bentuk bisa dienter
    shapeTextInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            generateShapeBtn.click();
        }
    });
    generateShapeBtn.addEventListener('click', generateShape);

    // Fitur reset
    document.getElementById('resetGrid').addEventListener('click', function() {
        dots.forEach(dot => {
            dot.classList.remove('shape');
            dot.classList.remove('active');
        });
    });

    // Fitur geser
    function shiftGrid(dx, dy) {
        // Buat array 2D status shape dan active
        let statusArr = Array.from({length: rows}, () => Array(cols).fill(null));
        dots.forEach(dot => {
            let r = parseInt(dot.dataset.row);
            let c = parseInt(dot.dataset.col);
            if (dot.classList.contains('shape') && dot.classList.contains('active')) {
                statusArr[r][c] = 'both';
            } else if (dot.classList.contains('shape')) {
                statusArr[r][c] = 'shape';
            } else if (dot.classList.contains('active')) {
                statusArr[r][c] = 'active';
            }
        });
        // Geser
        let newStatusArr = Array.from({length: rows}, () => Array(cols).fill(null));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let nr = r + dy;
                let nc = c + dx;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    newStatusArr[nr][nc] = statusArr[r][c];
                }
            }
        }
        // Update grid
        dots.forEach(dot => {
            let r = parseInt(dot.dataset.row);
            let c = parseInt(dot.dataset.col);
            dot.classList.remove('shape');
            dot.classList.remove('active');
            if (newStatusArr[r][c] === 'both') {
                dot.classList.add('shape');
                dot.classList.add('active');
            } else if (newStatusArr[r][c] === 'shape') {
                dot.classList.add('shape');
            } else if (newStatusArr[r][c] === 'active') {
                dot.classList.add('active');
            }
        });
    }
    document.getElementById('shiftLeft').addEventListener('click', function() { shiftGrid(-1, 0); });
    document.getElementById('shiftRight').addEventListener('click', function() { shiftGrid(1, 0); });
    document.getElementById('shiftUp').addEventListener('click', function() { shiftGrid(0, -1); });
    document.getElementById('shiftDown').addEventListener('click', function() { shiftGrid(0, 1); });

    generateGrid();
});
