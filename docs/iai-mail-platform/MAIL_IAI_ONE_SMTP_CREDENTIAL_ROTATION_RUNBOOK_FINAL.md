# MAIL_IAI_ONE_SMTP_CREDENTIAL_ROTATION_RUNBOOK_FINAL

IAI Mail Delivery & Automation Layer

SMTP Credential Rotation Runbook  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Runbook nay dung de rotate SMTP credential an toan, khong lam app ngung gui mail va khong mo ra cua so mat bao mat.

## 2. Khi nao phai rotate

- den ky rotation dinh ky
- nghi ngo lo secret
- nhan su doi vai tro
- credential duoc cap qua rong
- sau su co bao mat

## 3. Nguyen tac rotation

1. khong rotate bang cach sua de credential dang chay
2. tao credential moi truoc, test xong moi cutover
3. giu song song mot cua so ngan de app doi secret
4. revoke credential cu sau khi xac nhan cutover thanh cong

## 4. Thong tin can co truoc khi rotate

- workspace
- app dang dung credential
- sender/stream duoc phep
- owner cua app
- khung gio cutover
- rollback owner

## 5. Quy trinh rotation chuan

### Step 1 - Tao credential moi
- tao principal moi hoac secret moi
- map dung `workspace_id`, sender va stream
- dat expiry cho credential cu neu can
- ghi audit log

### Step 2 - Test credential moi
- test auth thanh cong
- test sender hop le
- test invalid sender reject
- test queue accept

Preferred test:

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <NEW_USER> --auth-password '<NEW_PASS>' \
  --from no-reply@tx.iai.one --to you@example.com \
  --header 'Subject: Credential rotation test' \
  --body 'rotation verification'
```

### Step 3 - Phat hanh secret moi cho app owner
- gui secret moi qua kenh an toan
- thong bao thoi diem cat credential cu
- thong bao test case can chay ben app

### Step 4 - Cutover
- app doi sang credential moi
- team SMTP theo doi auth success va reject logs
- xac nhan message moi di bang credential moi

### Step 5 - Revoke credential cu
- disable credential cu
- ghi audit log
- xac nhan khong con auth success bang credential cu

## 6. Checklist PASS

- [ ] credential moi auth duoc
- [ ] sender/stream dung policy
- [ ] app da doi sang secret moi
- [ ] auth bang secret cu khong con hop le sau revoke
- [ ] khong tang reject rate bat thuong sau cutover

## 7. Rollback

Rollback neu:
- app khong auth duoc voi secret moi
- app gui sai sender/stream sau doi secret
- auth failure tang dot bien sau cutover

Cach rollback:
1. mo lai credential cu trong khung rollback neu van an toan
2. thong bao app owner quay lai secret cu
3. tiep tuc dieu tra secret moi
4. dat lai lich rotation moi

## 8. Luu y bao mat

- khong gui secret qua kenh cong khai
- khong log plain secret
- khong dung mot credential chung cho nhieu app
- uu tien moi app mot credential rieng

## 9. Evidence can luu

- ai yeu cau rotation
- ly do rotation
- credential id cu va moi
- timestamp tao/test/cutover/revoke
- ket qua auth test
- app owner xac nhan da doi secret

## 10. Definition of Done

Rotation duoc xem la xong khi:
- credential moi dang duoc app su dung that
- credential cu da revoke
- logs va audit day du
- khong co gian doan gui mail ngoai khung chap nhan
