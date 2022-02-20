import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { ExitPreviewButton } from '../components/ExitPreviewButton';
import { PreviewDataType } from '../types';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [morePosts, setMorePosts] = useState(postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    const response = await fetch(morePosts);
    const { results, next_page } = await response.json();
    const newPosts = results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setMorePosts(next_page);
    setPosts(prevState => [...prevState, ...newPosts]);
  }

  return (
    <main className={`${commonStyles.container} ${styles.postContainer}`}>
      <Header />

      <ul>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <li className={styles.post}>
              <h1>{post.data.title}</h1>
              <h2>{post.data.subtitle}</h2>

              <div className={commonStyles.postInfo}>
                <figure>
                  <FiCalendar size={18} />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </figure>
                <figure>
                  <FiUser size={18} />
                  {post.data.author}
                </figure>
              </div>
            </li>
          </Link>
        ))}
      </ul>

      {morePosts && (
        <button
          className={styles.loadMorePosts}
          onClick={handleLoadMorePosts}
          type="button"
        >
          Carregar mais posts
        </button>
      )}

      {preview && <ExitPreviewButton />}
    </main>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const previewDataFormatted = previewData as PreviewDataType;
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
      ref: previewDataFormatted.ref ?? null,
    }
  );

  const results = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
      preview,
    },
  };
};
