const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, 'docs');
const outputFilePath = path.join(__dirname, 'index.html');

console.log('--- index.html 생성을 시작합니다 ---');
let reports = [];

// 날짜를 한국 시간(GMT+9) 'YYYY-MM-DD HH:MM' 형식으로 변환하는 함수
function formatDateToKST(date) {
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(date.getTime() + kstOffset);
    
    const year = kstDate.getUTCFullYear();
    const month = (kstDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = kstDate.getUTCDate().toString().padStart(2, '0');
    const hours = kstDate.getUTCHours().toString().padStart(2, '0');
    const minutes = kstDate.getUTCMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

const docFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.html'));

docFiles.forEach(filename => {
    const filePath = path.join(docsDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : filename;

    let commitDate;
    try {
        // 각 파일의 실제 마지막 git commit 시간을 조회
        const command = `git log -1 --format=%cI -- "${filePath}"`;
        const isoDate = execSync(command).toString().trim();
        commitDate = new Date(isoDate);
    } catch (e) {
        // git log 실패 시 현재 시간으로 대체 (오류 방지)
        commitDate = new Date();
        console.warn(`'${filename}'의 git log를 가져오지 못했습니다. 현재 시간으로 대체합니다.`);
    }
    
    reports.push({ filename, title, date: commitDate });
});

// 실제 커밋 시간을 기준으로 정확하게 최신순으로 정렬
reports.sort((a, b) => b.date - a.date);

let cardsHTML = reports.map(report => {
    const displayDate = formatDateToKST(report.date);

    return `
            <div class="report-card flex flex-col">
                <a href="docs/${report.filename}" class="flex-grow flex flex-col">
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <h2 class="report-title">${report.title}</h2>
                            <span class="report-date">${displayDate}</span>
                        </div>
                        <p class="report-filename mt-2">${report.filename}</p>
                    </div>
                </a>
            </div>`;
}).join('');

const finalHTML = `<!DOCTYPE html>
<html lang="ko"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Deep Research Curation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; background-color: #F8F9FA; }
        .report-card { background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .report-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1); }
        .report-card a { text-decoration: none; color: inherit; display: block; padding: 24px; }
        .report-title { color: #212529; font-weight: 700; font-size: 1.1rem; line-height: 1.4; }
        .report-filename { color: #868E96; font-size: 0.875rem; }
        .report-date { color: #868E96; font-size: 0.875rem; white-space: nowrap; margin-left: 16px; padding-top: 2px; }
    </style>
</head>
<body class="antialiased text-gray-800">
    <div class="container mx-auto p-4 md:p-8 max-w-7xl">
        <header class="text-center mb-10">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800">Gemini Deep Research</h1>
            <p class="text-lg mt-2 text-gray-600">Gemini를 통해 생성된 리서치 보고서 모음 (최신순)</p>
        </header>
        <main id="curation-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${cardsHTML}
        </main>
    </div>
</body></html>`;

fs.writeFileSync(outputFilePath, finalHTML);
console.log('--- index.html 생성을 완료했습니다.---');
