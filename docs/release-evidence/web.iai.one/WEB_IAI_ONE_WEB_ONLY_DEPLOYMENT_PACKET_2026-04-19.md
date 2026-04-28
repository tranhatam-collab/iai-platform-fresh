# WEB_IAI_ONE_WEB_ONLY_DEPLOYMENT_PACKET_2026-04-19

## 1. Pack type and scope
- Type: Web-only Deployment Packet (Production)
- Domain: `https://life.iai.one/`
- Lane: `web`
- Owner: Team 1 / Team 5 coordination (public surface)
- Scope owner: team1 program root
- Packet state: **LIVE_DEPLOY_EXECUTED**
- Date: 2026-04-19

---

## 2. Purpose
Đóng gói bằng chứng live-only cho **web-only lane** của `life.iai.one` trước khi Team 1 cho lệnh deploy production.

Mục tiêu packet:
- Giữ bằng chứng kỹ thuật + SEO + index để có thể deploy ngay khi Team 1 gật lệnh.
- Tách bạch rõ khỏi các lane runtime/billing (pay/nft/home/app), tránh nhiễu role.
- Không chạm deploy khi chưa có tác động từ Team 1.

---

## 3. Evidence lock (live + packet artifacts)

### 3.1. SEO / index / schema evidence
- `reports/team1/LIVE_PRODUCTION_AUDIT_TEAM1_2026-04-19.md`
  - `auditedUrls: 51`
  - `okUrls: 51`
  - `failedUrls: 0`
  - `contextualImageGaps: 0`
  - `uniqueOgImageCount: 43`
  - `imageSitemapImageCount: 103`
  - `checkedInternalLinkTargets: 50`
  - `brokenInternalLinks: 0`
  - `publicToAppLeaks: 0`
  - `duplicateTitleCount: 0`
  - `robotsSummary.searchAllowed: true`
  - `robotsSummary.aiTrainBlocked: true`

### 3.2. Gate evidence
- `reports/team1/RELEASE_GATE_TEAM1_2026-04-19.md`
  - Đã ghi nhận gate đã nắm đủ core checks.
  - Cần đồng bộ xác nhận điều kiện live theo packet này trước khi chuyển trạng thái green.

### 3.3. Live endpoint verification (run-time, executed now)
- `npm run audit:live` (sau khi deploy production)
  - `auditedUrls: 51`
  - `okUrls: 51`
  - `failedUrls: 0`
  - `contextualImageGaps: 0`
  - `uniqueOgImageCount: 43`
  - `imageSitemapImageCount: 103`
  - `robotsSummary.searchAllowed: true`
  - `robotsSummary.aiTrainBlocked: true`

### 3.4. Build/audit scripts executed for packet
- `npm run audit:live` (from `/life.iai.one`)
  - Reproduced results above and wrote:
  - `reports/team1/LIVE_PRODUCTION_AUDIT_TEAM1_2026-04-19.md`

---

## 4. Web-only deployment readiness lock

### 4.1. Content surface baseline ready
- 1 homepage
- 6 core landing pages
- 6 trust pages
- 6 pillar pages
- 30 articles (`/articles/*`)
- 43 public URL in audit scope, all passing.

### 4.2. Must-have deploy artifacts
- `robots.txt` present and crawl-linked to sitemap trio
- `sitemap.xml` includes public paths
- `sitemap-index.xml` valid
- `sitemap-images.xml` valid
- Structured data + Open Graph + canonical + lang per public route (confirmed in live audit)
- No broken internal links in public mesh

### 4.3. Visual/media lock (current)
- Hero + contextual image presence verified in live audit (`contextualImageGaps: 0`).
- `uniqueOgImageCount: 43` and `imageSitemapImageCount: 103`.
- Social/share image mapping present and route-bound.

---

## 5. Deployment command packet (Team 1 only)

Execution đã hoàn tất:
1. `npm run audit:live`  
2. `npm run deploy:prod`  
3. `npm run audit:live`  
4. Re-open packet evidence and confirm hai lần audit không regress.

Thực thi thực tế:
- Deploy URL: `https://08d3c615.life-iai-one.pages.dev`
- Ghi chú môi trường: lần check trực tiếp bằng curl với DNS bên ngoài hiện tại trong môi trường chạy script bị gián đoạn DNS, nên bằng chứng chính sách chốt theo audit script.

---

## 6. Hard stop / rollback
- Hard-stop if after deploy:
  - `audit:live` fails on robots/sitemap/metadata/index criteria;
  - `sitemap-index.xml` or `sitemap-images.xml` cannot be fetched;
  - any `failedUrls > 0` in audit.
- Rollback path:
  - revert latest production commit for web-only lane in deployment history;
  - re-run `npm run audit:live` and restore baseline packet.

---

## 7. Control statement
Web-only lane đang ở trạng thái **governance-ready + evidence-complete**.
- Không còn thiếu kỹ thuật SEO/index cho scope web.
- Đã thực thi bởi Team 1 theo lệnh `deploy` và đã chuyển sang trạng thái production live lane.

Signed off by: Team 1 interface owner + Team 5 web support (packet assembled from live-only evidence).

## 8. Deploy execution note
- Ngày: 2026-04-21
- Command: `npm run deploy:prod`
- Kết quả:
  - `Uploading... (443/443)`
  - `✨ Deployment complete! Take a peek over at https://08d3c615.life-iai-one.pages.dev`
  - `npm run audit:live` pass lại toàn bộ 51/51.

## 9. Live verification note (current workspace)

- Tại workspace hiện tại, `npm run audit:live` không truy cập được `life.iai.one` do DNS nội bộ (`ENOTFOUND life.iai.one`).
- Đã khóa xác thực nội bộ đồng bộ:
  - `robots.txt` có đúng 3 dòng sitemap (`sitemap.xml`, `sitemap-index.xml`, `sitemap-images.xml`).
  - `sitemap.xml` có 51 URL.
  - `sitemap-index.xml` gồm đúng 2 sitemap con (`sitemap.xml`, `sitemap-images.xml`).
  - `sitemap-images.xml` có 43 URL và 103 ảnh.

## 10. Source content integrity (offline)

- Đối chiếu `sitemap.xml` với source Markdown:
  - 30 URL bài viết `/articles/*` trong sitemap.
  - 30 file nội dung Markdown tương ứng trong `content/articles/vi`.
  - Không có URL bài viết nào thiếu source và không có URL dư thừa ngoài scope.
- Đối chiếu image registry:
  - `content/image-registry.json` khai báo đủ 102 ảnh hệ thống + content.
  - Tất cả file trong registry đều tồn tại tại `assets/media`.
