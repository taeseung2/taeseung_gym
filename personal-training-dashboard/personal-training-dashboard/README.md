# 개인 운동·식단 대시보드

월~금 오전 운동, 아침·점심·간식·저녁 식단, 12주 진행표와 개인 기록을 한 화면에서 확인하는 정적 웹앱입니다. 모바일과 PC 브라우저를 지원합니다.

## 로컬에서 보기

Python 3가 설치되어 있으면 프로젝트 폴더에서 다음을 실행하세요.

```sh
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. `file://`로 직접 열면 ES 모듈이 차단될 수 있습니다.

## GitHub Pages로 배포

1. 무료 GitHub Pages 사용을 위해 **새 공개 저장소**를 만듭니다. 다운로드한 ZIP의 압축을 풀고 `personal-training-dashboard` 폴더 안 파일들을 저장소 루트에 올리세요. 이 작업 저장소의 과거 git 기록은 올리지 마세요. [GitHub 문서](https://docs.github.com/en/pages/getting-started-with-github-pages)에 따르면 GitHub Free에서는 Pages 소스 저장소가 공개여야 합니다.
2. 저장소의 기본 브랜치 이름을 `main`으로 설정합니다.
3. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
4. `main`에 push하거나 **Actions → Deploy training dashboard to GitHub Pages → Run workflow**를 실행합니다.
5. 완료된 workflow의 배포 URL을 엽니다. 저장소 이름이나 사용자 이름이 URL에 포함될 수 있습니다.

GitHub Pages는 공개 웹사이트입니다. 사이트의 운동·식단 계획과 공개 저장소 코드는 누구나 볼 수 있습니다. 사이트에 로그인이나 접근 제한은 없습니다.

## 개인 기록과 기기 간 이동

프로필, 운동 체크, 중량·반복, 체중·둘레 기록은 사이트 서버에 전송되지 않고 현재 브라우저의 `localStorage`에 저장됩니다. 같은 브라우저에서는 새로고침 후에도 유지되지만 기기 사이 자동 동기화는 없습니다. 내 기록 섹션에서 JSON 백업을 내려받아 다른 기기에서 가져오세요. 기기를 바꾸기 전 백업을 보관하고, JSON 파일은 개인 건강정보로 취급하세요.

공개 소스에는 개인 측정값이 들어 있지 않습니다. 각 기기에서 프로필을 입력하거나 백업 파일을 가져오면 됩니다. 브라우저 데이터를 지우면 백업하지 않은 기록은 복구할 수 없습니다.

## 테스트

Node.js 20 이상에서 실행합니다.

```sh
npm test
```
