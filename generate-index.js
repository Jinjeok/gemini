const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, 'docs');
const outputFilePath = path.join(__dirname, 'index.html');

const reportFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.html'));

let reports = [];

reportFiles.forEach(filename => {
    const filePath = path.join(docsDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // <title> 태그 내용 추출
    const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : filename;

    try {
        // 각 파일의 마지막 git commit 날짜를 ISO 8601 표준 형식으로 추출
        const command = `git log -1 --format=%cI -- "${filePath}"`;
        const isoDate = execSync(command).toString().trim(); // YYYY-MM-DDTHH:mm:ssZ 형식
        
        if (isoDate) {
            reports.push({
                filename,
                title,
                isoDate: isoDate, // 정렬을 위한 표준 날짜 형식
            });
        }
    } catch (e) {
        // git log 실패 시 파일 시스템의 수정 날짜를 사용 (fallback)
        const stats = fs.statSync(filePath);
        reports.push({
            filename,
            title,
            isoDate: stats.mtime.toISOString(), // 파일 수정 시간을 ISO 형식으로 저장
        });
        console.warn(`Could not get git log for ${filename}. Falling back to file modification time.`);
    }
});

// isoDate (표준 형식)를 기준으로 정확하게 최신순 정렬
reports.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));

// HTML 카드 생성 (이 단계에서 보여줄 날짜 형식으로 변환)
let cardsHTML = reports.map(report => {
    // 보여주기 위한 날짜 형식 (YYYY-MM-DD HH:MM)
    const displayDate = new Date(report.isoDate).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\. /g, '-').replace('.', '');

    return `
            <div class="report-card">
                <a href="docs/${report.filename}">
                    <div class="flex justify-between items-center">
                        <h2 class="report-title">${report.title}</h2>
                        <span class="report-date">${displayDate}</span>
                    </div>
                    <p class="report-filename">${report.filename}</p>
                </a>
            </div>`;
}).join('');

const finalHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale-1.0">
    <title>Gemini Deep Research Curation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; background-color: #F8F9FA; }
        .report-card { background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .report-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1); }
        .report-card a { text-decoration: none; color: inherit; display: block; padding: 24px; }
        .report-title { color: #212529; font-weight: 700; font-size: 1.25rem; }
        .report-filename { color: #868E96; font-size: 0.875rem; margin-top: 8px; }
        .report-date { color: #868E96; font-size: 0.875rem; white-space: nowrap; margin-left: 16px; }
    </style>
</head>
<body class="antialiased text-gray-800">
    <div class="container mx-auto p-4 md:p-8 max-w-4xl">
        <header class="text-center mb-10">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800">Gemini Deep Research</h1>
            <p class="text-lg mt-2 text-gray-600">Gemini를 통해 생성된 리서치 보고서 모음 (최신순)</p>
        </header>
        <main id="curation-list" class="space-y-6">
            ${cardsHTML}
        </main>
    </div>
</body>
</html>
`;

fs.writeFileSync(outputFilePath, finalHTML);

console.log('index.html이 commit 시각 기준으로 정확하게 업데이트되었습니다!');
