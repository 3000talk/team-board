# 실시간 공유 팀 관리 웹앱

하나의 웹앱에서 **① 일정표(교육/행사/연가)** 와 **② 야간 순환근무(달력 자동 배정)** 를
관리하고, **공유 링크 하나로 팀원들이 동시에 실시간 편집**할 수 있는 앱입니다.

- 프레임워크: **Next.js (App Router) + TypeScript + Tailwind CSS**
- 데이터/실시간: **Supabase (PostgreSQL + Realtime)**
- 배포: **Vercel**
- 공유 주소: `/board/개포도서관` 처럼 사람이 읽을 수 있는 한글 ID(slug) 사용
- 로그인/비밀번호 없음 — 링크를 아는 사람은 누구나 보기/편집 가능

---

## 폴더 구조

```
seoul/
├─ package.json                # 프로젝트 정보 + 라이브러리 목록
├─ tsconfig.json               # TypeScript 설정
├─ next.config.mjs             # Next.js 설정
├─ postcss.config.mjs          # Tailwind(PostCSS) 설정
├─ tailwind.config.ts          # 색상 팔레트 등 디자인 설정
├─ .gitignore                  # 깃에 올리지 않을 파일 목록 (.env 포함!)
├─ .env.local.example          # 환경변수 예시 (복사해서 .env.local 만들기)
├─ README.md                   # 이 파일
│
├─ supabase/
│  └─ migration.sql            # ★ Supabase SQL Editor에 붙여넣을 코드
│
└─ src/
   ├─ app/
   │  ├─ layout.tsx            # 공통 레이아웃
   │  ├─ globals.css           # 전역 스타일 + 버튼/카드 클래스
   │  ├─ page.tsx              # 첫 화면 "새 팀표 만들기"
   │  └─ board/
   │     └─ [slug]/
   │        └─ page.tsx        # /board/개포도서관 보드 페이지
   │
   ├─ components/
   │  ├─ BoardClient.tsx       # 보드 메인(탭 전환 + 실시간 구독 + 상태표시)
   │  ├─ ScheduleTab.tsx       # 탭1: 일정표
   │  ├─ NightTab.tsx          # 탭2: 야간 순환근무 달력
   │  ├─ ShareBar.tsx          # 공유 링크 복사 바
   │  ├─ StatusPill.tsx        # 저장중/실시간 연결 상태 배지
   │  └─ Modal.tsx             # 공용 팝오버(모달)
   │
   └─ lib/
      ├─ supabaseClient.ts     # Supabase 연결
      ├─ boardApi.ts           # DB 읽기/쓰기 함수 모음
      ├─ nightRotation.ts      # ★ 야간 배정 계산 로직
      ├─ dateUtils.ts          # 날짜 계산 유틸
      ├─ constants.ts          # 초기 팀원 6명, 색상 팔레트
      └─ types.ts              # 데이터 타입 정의
```

---

## 처음 따라 하기 (코딩을 몰라도 OK)

> 순서대로만 하면 됩니다. 막히면 각 단계의 "확인" 문구를 참고하세요.

### 0단계. Node.js 설치 (한 번만)

이 프로젝트를 실행하려면 컴퓨터에 **Node.js** 가 필요합니다.

1. https://nodejs.org 접속 → **LTS 버전** 다운로드 → 설치 (계속 "다음")
2. 설치 후 새 터미널(PowerShell)을 열고 아래를 입력해 버전이 나오면 성공:
   ```powershell
   node -v
   npm -v
   ```
   (`v20.x.x` 처럼 숫자가 보이면 OK)

---

### 1단계. Supabase 프로젝트 생성

1. https://supabase.com 접속 → 가입/로그인 (GitHub 계정으로 간편 가입 가능)
2. **New project** 클릭
3. 입력 항목:
   - **Name**: 아무 이름 (예: `team-board`)
   - **Database Password**: 안전한 비밀번호 (어딘가 적어두세요)
   - **Region**: `Northeast Asia (Seoul)` 추천
4. **Create new project** → 1~2분 기다리면 준비 완료

---

### 2단계. SQL 붙여넣고 실행 (테이블 + 실시간 설정)

1. 왼쪽 메뉴에서 **SQL Editor** 클릭 → **New query**
2. 이 프로젝트의 `supabase/migration.sql` 파일을 열어 **전체 복사**
3. SQL Editor에 **붙여넣기** 후 오른쪽 아래 **Run** (또는 `Ctrl + Enter`)
4. **확인**: 아래쪽에 `Success. No rows returned` 가 보이면 성공입니다.

> 이 SQL은 테이블 4개를 만들고, **Realtime(실시간) 설정까지 자동으로** 해줍니다.
> 여러 번 실행해도 안전하게 작성되어 있어요.

#### (보너스) Realtime이 켜졌는지 눈으로 확인하기

- 왼쪽 메뉴 **Database → Replication** (또는 **Publications**) 으로 들어가면
  `supabase_realtime` publication에 우리 테이블 4개
  (`schedules`, `employees`, `entries`, `night_overrides`) 가 들어 있어야 합니다.
- SQL이 이미 추가했으니 보통 그대로 켜져 있습니다. 혹시 빠진 게 있으면 토글을 켜주세요.

---

### 3단계. 환경변수(.env.local) 입력

앱이 "어떤 Supabase 프로젝트에 연결할지" 알려주는 단계입니다. **가장 자주 막히는 부분**이라 천천히 하세요.

1. Supabase 대시보드 왼쪽 아래 **톱니바퀴(Project Settings)** → **API** 메뉴 클릭
2. 두 가지 값을 복사합니다:
   - **Project URL** (예: `https://abcd1234.supabase.co`)
   - **Project API keys** 의 **`anon` `public`** 키 (긴 문자열)
     > ⚠️ `service_role` 키는 절대 쓰지 마세요! 공개되면 위험합니다. 꼭 `anon public` 키만.
3. 프로젝트 폴더(`seoul`)에 있는 **`.env.local.example`** 파일을 복사해서
   같은 폴더에 **`.env.local`** 이라는 이름으로 저장합니다.
   - Windows 탐색기에서 파일을 복사/붙여넣기 한 뒤 이름을 `.env.local` 로 바꾸면 됩니다.
4. `.env.local` 을 열어 아래처럼 **방금 복사한 값**으로 채웁니다:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (복사한 긴 키)
   ```

> 중요:
> - 등호(`=`) 양옆에 공백을 넣지 마세요.
> - 값에 따옴표를 붙이지 마세요.
> - `.env.local` 파일은 깃/Vercel에 올라가지 않습니다(`.gitignore`에 등록됨).
>   대신 6단계 Vercel 배포 때 같은 값을 다시 한 번 등록합니다.
> - **이 파일을 바꾼 뒤에는 개발 서버를 껐다 켜야** 반영됩니다.

---

### 4단계. 라이브러리 설치

프로젝트 폴더에서 터미널을 열고:

```powershell
npm install
```

- **확인**: 에러 없이 끝나고 `node_modules` 폴더가 생기면 OK. (인터넷 필요, 1~2분)

---

### 5단계. 로컬에서 실행해 보기

```powershell
npm run dev
```

- 터미널에 `http://localhost:3000` 이 보이면 브라우저에서 그 주소로 접속
- **확인**:
  1. 첫 화면 "새 팀표 만들기" 클릭 → `/board/개포도서관` 으로 이동
  2. 우상단 배지가 "실시간 연결됨"(민트색 점)으로 바뀌면 성공!
  3. 일정표 셀을 눌러 내용 입력 → 저장됨
  4. **다른 브라우저 탭**에서 같은 주소를 열고, 한 쪽에서 수정하면
     다른 쪽에 **새로고침 없이 즉시** 반영되는지 확인 (= 실시간 동작)

> 만약 "Supabase 설정이 필요합니다" 가 나오면 → 3단계 `.env.local` 을 다시 확인하고
> 터미널에서 `Ctrl + C` 로 서버를 끈 뒤 `npm run dev` 로 다시 시작하세요.

---

### 6단계. Vercel 배포 (인터넷에 공개)

1. 코드를 GitHub 저장소에 올립니다(깃 사용). 잘 모르면 GitHub Desktop 앱이 쉽습니다.
2. https://vercel.com 접속 → GitHub로 로그인 → **Add New… → Project**
3. 방금 올린 저장소를 **Import**
4. **Environment Variables** 항목에 **로컬과 똑같이** 두 줄 입력:
   - `NEXT_PUBLIC_SUPABASE_URL` = (3단계의 Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (3단계의 anon public 키)
5. **Deploy** 클릭 → 1~2분 후 `https://...vercel.app` 주소가 생깁니다.
6. 그 주소 뒤에 `/board/개포도서관` 을 붙이거나, 앱에서 "공유 링크 복사"로 받은 주소를
   팀원에게 보내면 끝! 모두가 같은 화면을 실시간으로 함께 편집합니다.

---

## 자주 막히는 부분 (FAQ)

**Q. "실시간 연결됨"이 안 뜨고 "오프라인"이에요.**
- 2단계 SQL을 실행했는지 확인하세요. (특히 publication 부분)
- Supabase 대시보드 **Database → Replication** 에서 4개 테이블이 켜져 있는지 확인.
- `.env.local` 의 URL/키가 정확한지, 서버를 재시작했는지 확인.

**Q. 저장이 안 되고 빨간 에러가 떠요.**
- SQL이 정상 실행됐는지(테이블이 만들어졌는지) 확인하세요.
- 키를 `anon public` 으로 넣었는지 확인하세요(`service_role` 아님).

**Q. 야간근무 자동 배정 규칙이 궁금해요.**
- 시작일부터 어떤 날짜 직전까지의 **평일 개수 % 6** 번째 사람이 그 날 평일 근무자입니다.
- 주말도 똑같이 **주말 개수 % 6** 으로 계산하며, 평일조와 완전히 독립적으로 돕니다.
- 달력에서 날짜를 누르면 그 날만 **수동 교체**할 수 있고, 수동 지정이 자동보다 우선합니다.
  ("자동으로 되돌리기"를 누르면 다시 규칙대로 계산됩니다.)
- 자세한 코드는 `src/lib/nightRotation.ts` 에 주석과 함께 있습니다.

**Q. 팀표 ID(개포도서관)를 바꾸고 싶어요.**
- `src/lib/constants.ts` 의 `DEFAULT_BOARD_ID` 값을 바꾸면 됩니다.
- 또는 직접 `/board/원하는이름` 으로 접속해도 됩니다(없으면 "찾을 수 없음"이 뜨니
  첫 화면에서 만든 ID를 사용하세요).
```
