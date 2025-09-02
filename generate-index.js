const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const outputFilePath = path.join(__dirname, 'index.html');

// docs 폴더에서 .html 파일 목록을 읽어옵니다.
const reportFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.html'));

// 파일 이름으로 역순 정렬 (최신 파일이 위로)
reportFiles.sort().reverse();

let cardsHTML = '';

reportFiles.forEach(filename => {
    const filePath = path.join(docsDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 각 HTML 파일에서 <title> 태그 내용을 추출합니다.
    const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : filename;

    cardsHTML += `
            <div class="report-card">
                <a href="docs/${filename}">
                    <h2 class="report-title">${title}</h2>
                    <p class="report-filename">${filename}</p>
                </a>
            </div>`;
});

// 최종 index.html 템플릿
const finalHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Deep Research Curation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; background-color: #F8F9FA; }
        .report-card { background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .report-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1); }
        .report-card a { text-decoration: none; color: inherit; display: block; padding: 24px; }
        .report-title { color: #212529; font-weight: 700; font-size: 1.25rem; }
        .report-filename { color: #868E96; font-size: 0.875rem; margin-top: 8px; }
    </style>
</head>
<body class="antialiased text-gray-800">
    <div class="container mx-auto p-4 md:p-8 max-w-4xl">
        <header class="text-center mb-10">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800">Gemini Deep Research</h1>
            <p class="text-lg mt-2 text-gray-600">Gemini를 통해 생성된 리서치 보고서 모음</p>
        </header>
        <main id="curation-list" class="space-y-6">
            ${cardsHTML}
        </main>
    </div>
</body>
</html>
`;

// 생성된 내용을 index.html 파일로 씁니다.
fs.writeFileSync(outputFilePath, finalHTML);

console.log('index.html 파일이 성공적으로 생성되었습니다!');
