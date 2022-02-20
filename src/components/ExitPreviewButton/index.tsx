import Link from 'next/link';

import styles from './styles.module.scss';

export function ExitPreviewButton(): JSX.Element {
  return (
    <Link href="/api/exit-preview">
      <button className={styles.exitPreviewButton} type="button">
        Sair do modo Preview
      </button>
    </Link>
  );
}
