import type {ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import Admonition from '@theme/Admonition';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Props = WrapperProps<typeof ContentType>;

/**
 * Under /vi/, say plainly whether the reader is looking at a translation.
 *
 * Only the production-patterns lessons are translated; every other page is the English
 * original served at a Vietnamese URL, which is what made the previous vi locale misleading
 * (TECH_DEBT.md 6.1). `translated` and `translation_stale` are set by scripts/sync-knowledge.mjs.
 * The English link is a plain <a>: <Link> would prefix it with the vi base URL.
 */
export default function ContentWrapper(props: Props): ReactNode {
    const {i18n} = useDocusaurusContext();
    const {frontMatter, metadata} = useDoc();
    if (i18n.currentLocale !== 'vi') return <Content {...props} />;

    const fm = frontMatter as {translated?: boolean; translation_stale?: boolean};
    const english = metadata.permalink.replace(/^\/vi(?=\/)/, '');
    const notice = !fm.translated ? (
        <Admonition type="info" title="Chưa có bản tiếng Việt">
            Trang này hiện chỉ có bằng tiếng Anh. Các bài trong mục <em>Production patterns</em> đã
            được dịch.
        </Admonition>
    ) : fm.translation_stale ? (
        <Admonition type="warning" title="Bản dịch có thể chưa cập nhật">
            Bản tiếng Anh đã thay đổi sau khi trang này được dịch.{' '}
            <a href={english}>Xem bản tiếng Anh mới nhất</a>.
        </Admonition>
    ) : null;

    return (
        <>
            {notice}
            <Content {...props} />
        </>
    );
}
