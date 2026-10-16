import { Link, useNavigate } from 'react-router-dom';
import Public from '../components/Public';
import { useT } from '../lib/i18n';

export function NotFound() {
  const { lang } = useT(); const zh = lang === 'zh';
  return (
    <Public>
      <div className="mx-auto max-w-[520px] px-5 py-24 text-center">
        <div className="serif text-[64px] leading-none text-accent mb-4">404</div>
        <h1 className="serif font-medium text-[28px] mb-2">{zh ? '这一页不在了。' : 'This page isn’t here.'}</h1>
        <p className="text-ink-2 mb-6">{zh ? '可能是链接过期了，或者被邀请的权限已经收回。故事本身还在，没有丢。' : 'The link may have expired, or the invitation was revoked. The stories themselves are safe.'}</p>
        <Link to="/" className="btn btn-primary">{zh ? '回到首页' : 'Back home'}</Link>
      </div>
    </Public>
  );
}

export function Deleted() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  return (
    <Public>
      <div className="mx-auto max-w-[520px] px-5 py-24 text-center">
        <h1 className="serif font-medium text-[28px] mb-2">{zh ? '账号已标记删除。' : 'Account marked for deletion.'}</h1>
        <p className="text-ink-2 mb-6">{zh ? '30 天内用原邮箱登录即可恢复一切。之后所有录音、文字和照片会被彻底清除，包括备份。' : 'Log in with the same email within 30 days to restore everything. After that, all recordings, text and photos are permanently erased, including backups.'}</p>
        <button className="btn" onClick={() => nav('/')}>{zh ? '回到首页' : 'Back home'}</button>
      </div>
    </Public>
  );
}
