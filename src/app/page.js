import { cookies } from "next/headers";

import auth from "../lib/auth";
import configModule from "../lib/config";
import github from "../lib/github";
import PromoteForm from "./promote-form";
import RestoreForm from "./restore-form";
import UploadForm from "./upload-form";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { getConfig } = configModule;
const { getBranchSummary, listRecentMainCommits } = github;

export const dynamic = "force-dynamic";

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(date));
}

function Login({ error }) {
  return (
    <main className="shell auth-shell">
      <section className="panel auth-panel">
        <div>
          <h1>Reboot 홈페이지 업데이트</h1>
        </div>

        {error ? <p className="alert">{error}</p> : null}

        <form method="post" action="/api/login" className="stack">
          <label>
            관리자 비밀번호
            <input name="password" type="password" autoComplete="current-password" required autoFocus />
          </label>
          <button type="submit">로그인</button>
        </form>
      </section>
    </main>
  );
}

async function Dashboard({ params, config }) {
  let deployments = [];
  let historyError = null;
  let previewStatus = { exists: false };
  let previewError = null;

  try {
    deployments = await listRecentMainCommits({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
    });
  } catch (error) {
    historyError = error.message;
  }

  try {
    previewStatus = await getBranchSummary({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.updaterRepo,
      branch: config.previewBranch,
      excludePaths: ["CNAME", ".nojekyll"],
    });
  } catch (error) {
    previewError = error.message;
  }

  const latestDeployment = deployments[0] || null;
  const hasPendingPreview =
    previewStatus.exists && (!latestDeployment || !latestDeployment.fullMessage?.includes(`Promoted from ${config.updaterRepo}/${config.previewBranch}@${previewStatus.shortSha}`));

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>리부트 홈페이지 업로드</h1>
        </div>
        <form method="post" action="/api/logout">
          <button className="secondary" type="submit">
            로그아웃
          </button>
        </form>
      </header>

      <section className="panel">
        {params.error ? <p className="alert">{params.error}</p> : null}

        <UploadForm maxZipBytes={config.maxZipBytes} previewUrl={config.previewUrl} />
      </section>

      <section className="panel preview-panel">
        <div className="section-heading">
          <h2>미리보기</h2>
        </div>
        {previewError ? <p className="alert">미리보기 상태를 불러오지 못했습니다. {previewError}</p> : null}
        {!previewError && previewStatus.exists ? (
          <p className="muted preview-status">
            preview 브랜치에 {previewStatus.fileCount}개 파일이 있습니다. 최신 변경: {previewStatus.message}
          </p>
        ) : null}
        {!previewError && !previewStatus.exists ? (
          <p className="muted preview-status">아직 생성된 미리보기가 없습니다. zip을 업로드하면 preview 브랜치가 생성됩니다.</p>
        ) : null}
        <div className="preview-actions">
          {config.previewUrl && previewStatus.exists ? (
            <a className="button-link secondary-link" href={config.previewUrl} target="_blank" rel="noreferrer">
              미리보기 열기
            </a>
          ) : config.previewUrl ? (
            <span className="button-link disabled-link">미리보기 열기</span>
          ) : (
            <p className="muted">PREVIEW_URL 환경변수를 설정하면 미리보기 링크가 표시됩니다.</p>
          )}
          {hasPendingPreview ? <PromoteForm disabled={Boolean(previewError)} /> : null}
        </div>
      </section>

      <section className="panel history-panel">
        <div className="section-heading">
          <h2>최근 배포 이력</h2>
        </div>

        {historyError ? <p className="alert">배포 이력을 불러오지 못했습니다. {historyError}</p> : null}

        {!historyError && deployments.length === 0 ? <p className="muted">아직 표시할 배포 이력이 없습니다.</p> : null}

        {!historyError && deployments.length > 0 ? (
          <div className="history-list">
            {deployments.map((deployment, index) => (
              <article className="history-item" key={deployment.sha}>
                <div>
                  <strong>{deployment.message}</strong>
                  <span>
                    {deployment.shortSha} · {formatDate(deployment.date)}
                  </span>
                </div>
                <div className="history-actions">
                  <a href={deployment.url} target="_blank" rel="noreferrer">
                    보기
                  </a>
                  {index === 0 ? <span className="current-badge">현재</span> : <RestoreForm sha={deployment.sha} />}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const config = getConfig();
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  const isLoggedIn = isValidSessionCookie(session, config.sessionSecret);

  if (!isLoggedIn) {
    return <Login error={params.error || null} />;
  }

  return <Dashboard params={params} config={config} />;
}
